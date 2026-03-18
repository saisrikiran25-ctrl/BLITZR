import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron } from '@nestjs/schedule';

import { AdminAnalyticsEntity } from './entities/admin-analytics.entity';
import { UserEntity } from '../users/entities/user.entity';
import { TickerEntity } from '../ipo/entities/ticker.entity';
import { RumorEntity } from '../rumor-feed/entities/rumor.entity';
import { CredibilityService } from '../users/credibility.service';

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

    async moderateRumor(rumorId: string, action: 'RESTORE' | 'DELETE') {
        const rumor = await this.rumorRepo.findOne({ where: { rumor_id: rumorId } });
        if (!rumor) throw new Error('Rumor not found');

        rumor.status = action === 'RESTORE' ? 'VISIBLE' : 'DELETED';
        rumor.visibility = action === 'RESTORE' ? 'PUBLIC' : 'REMOVED';
        
        // Safety Group 2 hooks
        if (action === 'RESTORE') {
            await this.credibilityService.onPostCleared(rumor.author_id);
        } else if (action === 'DELETE') {
            await this.credibilityService.onPostRemoved(rumor.author_id);
        }

        return this.rumorRepo.save(rumor);
    }

    async freezeAllMarkets() {
        // Find all active
        const tickers = await this.tickerRepo.find({ where: { status: 'ACTIVE' } });
        const freezeStamp = new Date();
        freezeStamp.setHours(freezeStamp.getHours() + 24); // 24h hard-freeze

        for (const t of tickers) {
            t.status = 'FROZEN'; // Manual freeze bypasses AUTO
            t.frozen_until = freezeStamp;
            await this.tickerRepo.save(t);
        }
        return { message: `Frozen ${tickers.length} active markets.` };
    }

    async delistTicker(tickerId: string) {
        const ticker = await this.tickerRepo.findOne({ where: { ticker_id: tickerId } });
        if (!ticker) throw new Error('Ticker not found');
        ticker.status = 'DELISTED';
        return this.tickerRepo.save(ticker);
    }
}
