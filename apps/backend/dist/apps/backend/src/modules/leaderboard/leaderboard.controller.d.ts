import { LeaderboardService } from './leaderboard.service';
export declare class LeaderboardController {
    private readonly leaderboardService;
    constructor(leaderboardService: LeaderboardService);
    /**
     * B5: GET national leaderboard snapshot.
     * Refresh rate matches cron: every 30 minutes.
     */
    getNationalLeaderboard(limit?: number): Promise<any>;
}
