import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards, UnauthorizedException } from '@nestjs/common';
import { AdminAnalyticsService } from './admin-analytics.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Admin Dashboard - Telegraph Telemetry')
@Controller('admin')
export class AdminController {
    constructor(private readonly adminService: AdminAnalyticsService) { }

    @Get('sentiment')
    @ApiOperation({ summary: 'Get historical sentiment analytics' })
    getSentimentHistory() {
        return this.adminService.getHistory(48);
    }

    @Get('flagged-rumors')
    @ApiOperation({ summary: 'Get all rumors marked PENDING_REVIEW automatically by correlation limiter.' })
    getFlaggedRumors() {
        return this.adminService.getFlaggedRumors();
    }

    /**
     * GET moderation queue — reads from moderation_queue table (Dean's Dashboard Page 4).
     */
    @Get('moderation-queue')
    @ApiOperation({ summary: 'Get moderation queue items by status' })
    getModerationQueue(@Query('status') status: string = 'PENDING') {
        return this.adminService.getModerationQueue(status);
    }

    /**
     * PATCH clear — sets post.visibility = PUBLIC, rewards author credibility.
     */
    @Patch('moderation/:queueId/clear')
    @ApiOperation({ summary: 'Clear a moderation queue item — post becomes PUBLIC' })
    clearModerationItem(@Param('queueId') queueId: string) {
        return this.adminService.clearModerationItem(queueId);
    }

    /**
     * PATCH remove — sets post.visibility = REMOVED, penalises author credibility.
     */
    @Patch('moderation/:queueId/remove')
    @ApiOperation({ summary: 'Remove a moderation queue item — post becomes REMOVED' })
    removeModerationItem(@Param('queueId') queueId: string) {
        return this.adminService.removeModerationItem(queueId);
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

    /**
     * POST /admin/campus/pause — pauses all markets for 24 hours.
     * Requires confirmText === 'CONFIRM PAUSE' in the request body.
     */
    @Post('campus/pause')
    @ApiOperation({ summary: 'Pause all campus markets for 24 hours (requires CONFIRM PAUSE text)' })
    pauseAllCampusMarkets(@Body() body: { confirm_text: string }) {
        return this.adminService.pauseAllCampusMarkets(body.confirm_text ?? '');
    }

    @Post('emergency/freeze-all')
    @ApiOperation({ summary: 'Panic button: Freeze all active markets instantly' })
    freezeAllMarkets() {
        return this.adminService.freezeAllMarkets();
    }

    @Post('emergency/delist/:tickerId')
    @ApiOperation({ summary: 'Manually delist a ticker by ticker ID' })
    delistTicker(@Param('tickerId') tickerId: string) {
        return this.adminService.delistTicker(tickerId);
    }

    /**
     * POST /admin/emergency/delist-by-email — delist by student email.
     */
    @Post('emergency/delist-by-email')
    @ApiOperation({ summary: 'Delist a student ticker by their college email' })
    delistByEmail(@Body() body: { email: string }) {
        return this.adminService.delistTickerByEmail(body.email);
    }
}
