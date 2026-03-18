import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Cron } from '@nestjs/schedule';
import { NationalLeaderboardEntity } from './entities/national-leaderboard.entity';
import { BondingCurveService } from '../ipo/bonding-curve.service';

@Injectable()
export class LeaderboardService {
    private readonly logger = new Logger(LeaderboardService.name);

    constructor(
        @InjectRepository(NationalLeaderboardEntity)
        private readonly leaderboardRepo: Repository<NationalLeaderboardEntity>,
        private readonly dataSource: DataSource,
        private readonly bondingCurve: BondingCurveService,
    ) {}

    /**
     * B5: National Leaderboard cron — runs every 30 minutes (at :00 and :30 of each hour).
     */
    @Cron('0 0,30 * * * *')
    async computeNationalLeaderboard() {
        this.logger.log('Computing National Leaderboard...');

        // Get all verified institutions
        const institutions = await this.dataSource.query(
            `SELECT institution_id, short_code FROM institutions WHERE verified = true`,
        );

        // Delete old snapshot
        await this.leaderboardRepo.clear();

        let nationalRankCounter = 1;

        for (const institution of institutions) {
            // Get top 3 tickers by total_volume for this institution
            const topTickers = await this.dataSource.query(
                `SELECT t.ticker_id, t.current_supply, t.scaling_constant, t.total_volume, t.featured
                 FROM tickers t
                 JOIN users u ON t.owner_id = u.user_id
                 WHERE u.institution_id = $1 AND t.status = 'ACTIVE'
                 ORDER BY t.total_volume DESC
                 LIMIT 3`,
                [institution.institution_id],
            );

            for (let i = 0; i < topTickers.length; i++) {
                const ticker = topTickers[i];
                const supply = Number(ticker.current_supply);
                const snapshotPrice = this.bondingCurve.getPrice(supply);

                const entry = this.leaderboardRepo.create({
                    ticker_id: ticker.ticker_id,
                    institution_id: institution.institution_id,
                    campus_rank: i + 1,
                    national_rank: nationalRankCounter++,
                    snapshot_price: snapshotPrice,
                    snapshot_volume: Number(ticker.total_volume),
                    featured: ticker.featured ?? false,
                });

                await this.leaderboardRepo.save(entry);
            }
        }

        this.logger.log(`National Leaderboard computed. ${nationalRankCounter - 1} entries.`);
    }

    /**
     * GET /v1/leaderboard/national — reads ONLY from snapshot table.
     */
    async getNationalLeaderboard(limit: number = 50) {
        const rows = await this.dataSource.query(
            `SELECT nl.*, t.ticker_id, i.short_code AS institution_short_code, i.name AS institution_name,
                    u.display_name AS owner_display_name,
                    CASE
                        WHEN t.price_open IS NULL OR t.price_open = 0 THEN 0
                        ELSE ((nl.snapshot_price - t.price_open) / t.price_open) * 100
                    END AS change_pct
             FROM national_leaderboard nl
             LEFT JOIN tickers t ON nl.ticker_id = t.ticker_id
             LEFT JOIN institutions i ON nl.institution_id = i.institution_id
             LEFT JOIN users u ON t.owner_id = u.user_id
             ORDER BY nl.featured DESC, nl.national_rank ASC
             LIMIT $1`,
            [limit],
        );
        return rows;
    }
}
