import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Cron } from '@nestjs/schedule';

import { AdminAnalyticsEntity } from './entities/admin-analytics.entity';
import { UserEntity } from '../users/entities/user.entity';
import { TickerEntity } from '../ipo/entities/ticker.entity';
import { CredibilityService } from '../users/credibility.service';
import { BondingCurveService } from '../ipo/bonding-curve.service';

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
        private readonly credibilityService: CredibilityService,
        private readonly bondingCurve: BondingCurveService,
        private readonly dataSource: DataSource,
    ) { }

    @Cron('0 */15 * * * *')
    async computeAdminAnalytics() {
        this.logger.log('Computing Admin Analytics Snapshot...');

        const institutions = await this.dataSource.query(
            `SELECT institution_id FROM institutions WHERE verified = true`,
        );

        const fifteenMinAgo = new Date(Date.now() - 15 * 60 * 1000);

        for (const institution of institutions) {
            const institutionId = institution.institution_id;

            const [activeUsersRes] = await this.dataSource.query(
                `SELECT COUNT(*)::int AS count
                 FROM users
                 WHERE institution_id = $1 AND last_active_at >= $2`,
                [institutionId, fifteenMinAgo],
            );

            const [flaggedRes] = await this.dataSource.query(
                `SELECT COUNT(*)::int AS count
                 FROM moderation_queue mq
                 LEFT JOIN rumor_posts rp ON mq.post_id = rp.post_id
                 LEFT JOIN users u ON rp.author_id = u.user_id
                 WHERE mq.status = 'PENDING' AND mq.created_at >= $2 AND u.institution_id = $1`,
                [institutionId, fifteenMinAgo],
            );

            const [avgChangeRes] = await this.dataSource.query(
                `SELECT AVG(t.price_at_execution)::numeric AS avg
                 FROM transactions t
                 JOIN users u ON t.user_id = u.user_id
                 WHERE t.created_at >= $2 AND u.institution_id = $1`,
                [institutionId, fifteenMinAgo],
            );

            const [tradeCountRes] = await this.dataSource.query(
                `SELECT COUNT(*)::int AS count
                 FROM transactions t
                 JOIN users u ON t.user_id = u.user_id
                 WHERE t.created_at >= $2 AND u.institution_id = $1`,
                [institutionId, fifteenMinAgo],
            );

            const tickers = await this.dataSource.query(
                `SELECT t.current_supply, t.category
                 FROM tickers t
                 JOIN users u ON t.owner_id = u.user_id
                 WHERE u.institution_id = $1 AND t.status = 'ACTIVE'`,
                [institutionId],
            );

            const deptSentiment: Record<string, number> = {};
            for (const ticker of tickers) {
                const dept = ticker.category || 'UNASSIGNED';
                const price = this.bondingCurve.getPrice(Number(ticker.current_supply));
                deptSentiment[dept] = (deptSentiment[dept] ?? 0) + price;
            }

            const snapshot = this.analyticsRepo.create({
                institution_id: institutionId,
                dept_sentiment: deptSentiment,
                avg_score_change: Number(avgChangeRes?.avg ?? 0),
                total_trades: Number(tradeCountRes?.count ?? 0),
                active_users: Number(activeUsersRes?.count ?? 0),
                flagged_posts: Number(flaggedRes?.count ?? 0),
            });

            await this.analyticsRepo.save(snapshot);
        }
    }

    async getAnalytics(limit: number = 672, institutionId?: string) {
        return this.analyticsRepo.find({
            where: institutionId ? { institution_id: institutionId } : {},
            order: { computed_at: 'DESC' },
            take: limit,
        });
    }

    /**
     * GET moderation_queue items (Dean's Dashboard Page 4).
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
            await this.credibilityService.onPostCleared(postId);
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
            await this.credibilityService.onPostRemoved(postId);
        }

        return { success: true, action: 'REMOVED', queue_id: queueId };
    }

    /**
     * B4/Emergency: Pause all campus markets for up to 24 hours.
     * Requires confirmText === 'CONFIRM PAUSE' for safety gate.
     */
    async pauseAllCampusMarkets(confirmText: string, institutionId: string | null) {
        if (confirmText !== CAMPUS_PAUSE_CONFIRM_TEXT) {
            throw new BadRequestException(
                `Safety gate: you must type exactly "${CAMPUS_PAUSE_CONFIRM_TEXT}" to proceed.`,
            );
        }

        const resumeAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
        let tickers: Array<{ ticker_id: string }> = [];

        if (institutionId) {
            tickers = await this.dataSource.query(
                `SELECT t.ticker_id
                 FROM tickers t
                 JOIN users u ON t.owner_id = u.user_id
                 WHERE u.institution_id = $1 AND t.status = 'ACTIVE'`,
                [institutionId],
            );

            await this.dataSource.query(
                `UPDATE tickers
                 SET status = 'MANUAL_FROZEN', frozen_until = $2
                 WHERE ticker_id IN (
                     SELECT t.ticker_id FROM tickers t
                     JOIN users u ON t.owner_id = u.user_id
                     WHERE u.institution_id = $1 AND t.status = 'ACTIVE'
                 )`,
                [institutionId, resumeAt],
            );

            await this.dataSource.query(
                `UPDATE prop_events SET status = 'PAUSED' WHERE status = 'OPEN' AND institution_id = $1`,
                [institutionId],
            );
        } else {
            tickers = await this.dataSource.query(
                `SELECT ticker_id FROM tickers WHERE status = 'ACTIVE'`,
            );
            await this.dataSource.query(
                `UPDATE tickers SET status = 'MANUAL_FROZEN', frozen_until = $1 WHERE status = 'ACTIVE'`,
                [resumeAt],
            );
            await this.dataSource.query(
                `UPDATE prop_events SET status = 'PAUSED' WHERE status = 'OPEN'`,
            );
        }

        return {
            message: `All campus markets paused. Auto-resumes at ${resumeAt.toISOString()}.`,
            frozen_tickers: tickers.length,
        };
    }

    @Cron('0 */10 * * * *')
    async resumePausedMarkets() {
        const now = new Date();
        const institutionsToResume = await this.dataSource.query(
            `SELECT DISTINCT u.institution_id
             FROM tickers t
             JOIN users u ON t.owner_id = u.user_id
             WHERE t.status = 'MANUAL_FROZEN' AND t.frozen_until <= $1`,
            [now],
        );

        await this.dataSource.query(
            `UPDATE tickers
             SET status = 'ACTIVE', frozen_until = NULL
             WHERE status = 'MANUAL_FROZEN' AND frozen_until <= $1`,
            [now],
        );

        for (const row of institutionsToResume) {
            if (!row.institution_id) continue;
            await this.dataSource.query(
                `UPDATE prop_events SET status = 'OPEN'
                 WHERE status = 'PAUSED' AND institution_id = $1`,
                [row.institution_id],
            );
        }
    }

    async freezeAllMarkets() {
        return this.pauseAllCampusMarkets(CAMPUS_PAUSE_CONFIRM_TEXT, null);
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
            message: `Ticker${delistedIds.length > 1 ? 's' : ''} ${delistedIds.join(', ')} delisted. Holdings remain in backers' portfolios at zero liquidity.`,
            delisted: delistedIds,
        };
    }

    /**
     * L5 Global Lockdown Toggle
     * Halts ALL trading and rumor publishing platform-wide.
     */
    async toggleGlobalLockdown(active: boolean) {
        await this.dataSource.query(
            `UPDATE settings SET value = $1, updated_at = NOW() WHERE key = 'GLOBAL_LOCKDOWN'`,
            [String(active)],
        );
        this.logger.warn(`GLOBAL_LOCKDOWN_${active ? 'ACTIVATED' : 'DEACTIVATED'}`);
        return { success: true, lockdown_active: active };
    }

    /**
     * Real-time Admin Risk Dashboard Data (L5)
     * Provides a bird-eye view of toxicity and market stress.
     */
    async getRiskMetrics() {
        const [toxicityStats] = await this.dataSource.query(`
            SELECT 
                COUNT(*) FILTER (WHERE risk_score > 0.8) as high_risk_count,
                AVG(risk_score)::numeric as avg_toxicity,
                COUNT(*) FILTER (WHERE visibility = 'PENDING') as pending_count
            FROM rumor_posts
            WHERE created_at >= NOW() - INTERVAL '24 hours'
        `);

        const [marketStress] = await this.dataSource.query(`
            SELECT 
                COUNT(*) FILTER (WHERE status = 'AUTO_FROZEN') as frozen_tickers_count,
                COUNT(*) FILTER (WHERE status = 'DELISTED') as delisted_count
            FROM tickers
        `);

        return {
            timestamp: new Date(),
            toxicity: {
                high_risk_24h: Number(toxicityStats.high_risk_count),
                avg_toxicity_24h: Number(toxicityStats.avg_toxicity || 0).toFixed(2),
                pending_moderation: Number(toxicityStats.pending_count),
            },
            market: {
                halted_tickers: Number(marketStress.frozen_tickers_count),
                delisted_tickers: Number(marketStress.delisted_count),
            }
        };
    }

    /**
     * Audit Log Export (L5 Compliance)
     * Returns a structured list of all moderation actions for legal review.
     */
    async exportAuditLogs() {
        return this.dataSource.query(`
            SELECT 
                mq.queue_id,
                mq.flag_type,
                mq.status,
                mq.created_at,
                mq.reviewed_at,
                rp.content as post_content,
                rp.author_id,
                rp.risk_score
            FROM moderation_queue mq
            JOIN rumor_posts rp ON mq.post_id = rp.post_id
            ORDER BY mq.created_at DESC
        `);
    }
}
