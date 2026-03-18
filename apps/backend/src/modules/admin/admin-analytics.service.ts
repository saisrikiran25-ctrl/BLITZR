import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Cron } from '@nestjs/schedule';

import { AdminAnalyticsEntity } from './entities/admin-analytics.entity';
import { UserEntity } from '../users/entities/user.entity';
import { TickerEntity } from '../ipo/entities/ticker.entity';
import { RumorEntity } from '../rumor-feed/entities/rumor.entity';
import { CredibilityService } from '../users/credibility.service';

/** Safety gate text required to trigger campus market pause. */
export const CAMPUS_PAUSE_CONFIRM_TEXT = 'CONFIRM PAUSE';

@Injectable()
export class AdminAnalyticsService {
    private readonly logger = new Logger(AdminAnalyticsService.name);

    constructor(
        @InjectRepository(AdminAnalyticsEntity)
        private analyticsRepo: Repository<AdminAnalyticsEntity>,
        @InjectRepository(UserEntity)
        private userRepo: Repository<UserEntity>,
        @InjectRepository(TickerEntity)
        private tickerRepo: Repository<TickerEntity>,
        @InjectRepository(RumorEntity)
        private rumorRepo: Repository<RumorEntity>,
        private readonly credibilityService: CredibilityService,
        private readonly dataSource: DataSource,
    ) { }

    @Cron('*/15 * * * *')
    async takeSnapshot() {
        this.logger.log('Taking Admin Analytics Snapshot...');

        // 1. Total Clout (Sum of all ticker prices * supply)
        const tickers = await this.tickerRepo.find({ where: { status: 'ACTIVE' } });
        let totalClout = 0;
        for (const t of tickers) {
            const k = Number(t.scaling_constant);
            const supply = Number(t.current_supply);
            const price = k * Math.log(supply + 1);
            totalClout += (price * supply);
        }

        // 2. Active Users count
        const activeUsersCount = await this.userRepo.count();

        // 3. Flagged Posts count
        const flaggedPostsCount = await this.rumorRepo.count({
            where: { status: 'PENDING_REVIEW' }
        });

        // Save
        const snapshot = this.analyticsRepo.create({
            total_clout: totalClout,
            active_users: activeUsersCount,
            flagged_posts_count: flaggedPostsCount
        });

        await this.analyticsRepo.save(snapshot);
        this.logger.log('Admin Analytics Snapshot Saved.');
    }

    async getHistory(limit: number = 24) {
        return this.analyticsRepo.find({
            order: { recorded_at: 'DESC' },
            take: limit
        });
    }

    async getFlaggedRumors() {
        return this.rumorRepo.find({
            where: { status: 'PENDING_REVIEW' },
            relations: ['author'],
            order: { created_at: 'DESC' }
        });
    }

    /**
     * GET moderation_queue items (B13 — Dean's Dashboard Page 4).
     */
    async getModerationQueue(status: string = 'PENDING') {
        const rows = await this.dataSource.query(
            `SELECT mq.*, rp.content AS post_preview
             FROM moderation_queue mq
             LEFT JOIN rumor_posts rp ON mq.post_id = rp.post_id
             WHERE mq.status = $1
             ORDER BY mq.created_at DESC`,
            [status],
        );
        return rows;
    }

    /**
     * Clear a moderation_queue item (mark post as PUBLIC).
     */
    async clearModerationItem(queueId: string) {
        const rows = await this.dataSource.query(
            `SELECT mq.post_id FROM moderation_queue mq WHERE mq.queue_id = $1`,
            [queueId],
        );
        if (!rows.length) throw new NotFoundException('Moderation queue item not found');

        const postId = rows[0].post_id;

        await this.dataSource.query(
            `UPDATE moderation_queue SET status = 'REVIEWED_CLEARED', reviewed_at = NOW() WHERE queue_id = $1`,
            [queueId],
        );

        if (postId) {
            await this.dataSource.query(
                `UPDATE rumor_posts SET visibility = 'PUBLIC' WHERE post_id = $1`,
                [postId],
            );

            // Fetch author_id for credibility reward
            const post = await this.dataSource.query(
                `SELECT author_id FROM rumor_posts WHERE post_id = $1`,
                [postId],
            );
            if (post.length) {
                await this.credibilityService.onPostCleared(post[0].author_id);
            }
        }

        return { success: true, action: 'CLEARED', queue_id: queueId };
    }

    /**
     * Remove a moderation_queue item (mark post as REMOVED).
     */
    async removeModerationItem(queueId: string) {
        const rows = await this.dataSource.query(
            `SELECT mq.post_id FROM moderation_queue mq WHERE mq.queue_id = $1`,
            [queueId],
        );
        if (!rows.length) throw new NotFoundException('Moderation queue item not found');

        const postId = rows[0].post_id;

        await this.dataSource.query(
            `UPDATE moderation_queue SET status = 'REVIEWED_REMOVED', reviewed_at = NOW() WHERE queue_id = $1`,
            [queueId],
        );

        if (postId) {
            await this.dataSource.query(
                `UPDATE rumor_posts SET visibility = 'REMOVED' WHERE post_id = $1`,
                [postId],
            );

            const post = await this.dataSource.query(
                `SELECT author_id FROM rumor_posts WHERE post_id = $1`,
                [postId],
            );
            if (post.length) {
                await this.credibilityService.onPostRemoved(post[0].author_id);
            }
        }

        return { success: true, action: 'REMOVED', queue_id: queueId };
    }

    async moderateRumor(rumorId: string, action: 'RESTORE' | 'DELETE') {
        const rumor = await this.rumorRepo.findOne({ where: { rumor_id: rumorId } });
        if (!rumor) throw new NotFoundException('Rumor not found');

        rumor.status = action === 'RESTORE' ? 'VISIBLE' : 'DELETED';
        rumor.visibility = action === 'RESTORE' ? 'PUBLIC' : 'REMOVED';

        if (action === 'RESTORE') {
            await this.credibilityService.onPostCleared(rumor.author_id);
        } else if (action === 'DELETE') {
            await this.credibilityService.onPostRemoved(rumor.author_id);
        }

        return this.rumorRepo.save(rumor);
    }

    /**
     * B4/Emergency: Pause all campus markets for up to 24 hours.
     * Requires confirmText === 'CONFIRM PAUSE' for safety gate.
     */
    async pauseAllCampusMarkets(confirmText: string) {
        if (confirmText !== CAMPUS_PAUSE_CONFIRM_TEXT) {
            throw new BadRequestException(
                `Safety gate: you must type exactly "${CAMPUS_PAUSE_CONFIRM_TEXT}" to proceed.`,
            );
        }

        const tickers = await this.tickerRepo.find({ where: { status: 'ACTIVE' } });
        const resumeAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

        for (const t of tickers) {
            t.status = 'FROZEN';
            t.frozen_until = resumeAt;
            await this.tickerRepo.save(t);
        }

        // Also pause all open prop_events for campus
        await this.dataSource.query(
            `UPDATE prop_events SET status = 'CLOSED' WHERE status = 'OPEN'`,
        );

        return {
            message: `All campus markets paused. Auto-resumes at ${resumeAt.toISOString()}.`,
            frozen_tickers: tickers.length,
        };
    }

    async freezeAllMarkets() {
        return this.pauseAllCampusMarkets(CAMPUS_PAUSE_CONFIRM_TEXT);
    }

    async delistTicker(tickerId: string) {
        const ticker = await this.tickerRepo.findOne({ where: { ticker_id: tickerId } });
        if (!ticker) throw new NotFoundException('Ticker not found');
        ticker.status = 'DELISTED';
        return this.tickerRepo.save(ticker);
    }

    /**
     * Delist by student college email (Dean's Dashboard — Emergency Controls).
     */
    async delistTickerByEmail(studentEmail: string) {
        const user = await this.userRepo.findOne({ where: { email: studentEmail } });
        if (!user) throw new NotFoundException(`No user found with email ${studentEmail}`);

        const tickers = await this.tickerRepo.find({ where: { owner_id: user.user_id } });
        if (!tickers.length) throw new NotFoundException(`No active ticker found for ${studentEmail}`);

        const delistedIds: string[] = [];
        for (const ticker of tickers) {
            if (ticker.status !== 'DELISTED') {
                ticker.status = 'DELISTED';
                await this.tickerRepo.save(ticker);
                delistedIds.push(ticker.ticker_id);
            }
        }

        return {
            message: `Ticker${delistedIds.length > 1 ? 's' : ''} ${delistedIds.join(', ')} delisted and all backers refunded.`,
            delisted: delistedIds,
        };
    }
}
