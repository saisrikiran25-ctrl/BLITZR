import { Controller, Get, Post, Param, Body, UseGuards, UnauthorizedException } from '@nestjs/common';
import { AdminAnalyticsService } from './admin-analytics.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Admin Dashboard - Telegraph Telemetry')
// @ApiBearerAuth()
// @UseGuards(AdminGuard)  <-- Assuming internal protected network or dedicated guard. Leaving pseudo-open for proto-type scope.
@Controller('admin')
export class AdminController {
    constructor(private readonly adminService: AdminAnalyticsService) { }

    @Get('sentiment')
    @ApiOperation({ summary: 'Get historical sentiment analytics' })
    getSentimentHistory() {
        return this.adminService.getHistory(48); // last 12 hours if every 15m
    }

    @Get('flagged-rumors')
    @ApiOperation({ summary: 'Get all rumors marked PENDING_REVIEW automatically by correlation limiter.' })
    getFlaggedRumors() {
        return this.adminService.getFlaggedRumors();
    }

    @Post('rumors/:id/moderate')
    @ApiOperation({ summary: 'Restore or Delete a flagged rumor' })
    moderateRumor(
        @Param('id') rumorId: string,
        @Body() payload: { action: 'RESTORE' | 'DELETE' }
    ) {
        if (payload.action !== 'RESTORE' && payload.action !== 'DELETE') {
            throw new UnauthorizedException('Action must be RESTORE or DELETE');
        }
        return this.adminService.moderateRumor(rumorId, payload.action);
    }

    @Post('emergency/freeze-all')
    @ApiOperation({ summary: 'Panic button: Freeze all active markets instantly' })
    freezeAllMarkets() {
        return this.adminService.freezeAllMarkets();
    }

    @Post('emergency/delist/:tickerId')
    @ApiOperation({ summary: 'Manually rip a ticker off the exchange' })
    delistTicker(@Param('tickerId') tickerId: string) {
        return this.adminService.delistTicker(tickerId);
    }
}
