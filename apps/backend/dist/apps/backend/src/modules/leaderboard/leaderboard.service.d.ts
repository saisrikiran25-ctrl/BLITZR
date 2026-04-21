import { Repository, DataSource } from 'typeorm';
import { NationalLeaderboardEntity } from './entities/national-leaderboard.entity';
import { BondingCurveService } from '../ipo/bonding-curve.service';
export declare class LeaderboardService {
    private readonly leaderboardRepo;
    private readonly dataSource;
    private readonly bondingCurve;
    private readonly logger;
    constructor(leaderboardRepo: Repository<NationalLeaderboardEntity>, dataSource: DataSource, bondingCurve: BondingCurveService);
    /**
     * B5: National Leaderboard cron — runs every 30 minutes (at :00 and :30 of each hour).
     */
    computeNationalLeaderboard(): Promise<void>;
    /**
     * GET /v1/leaderboard/national — reads ONLY from snapshot table.
     */
    getNationalLeaderboard(limit?: number): Promise<any>;
}
