import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { LeaderboardService } from './leaderboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('leaderboard')
export class LeaderboardController {
    constructor(private readonly leaderboardService: LeaderboardService) {}

    /**
     * B5: GET national leaderboard snapshot.
     * Refresh rate matches cron: every 30 minutes.
     */
    @UseGuards(JwtAuthGuard)
    @Get('national')
    async getNationalLeaderboard(@Query('limit') limit: number = 50) {
        return this.leaderboardService.getNationalLeaderboard(Number(limit));
    }
}
