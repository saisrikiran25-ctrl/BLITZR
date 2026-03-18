import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards, Request } from '@nestjs/common';
import { AdminAnalyticsService } from './admin-analytics.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AdminJwtGuard } from './guards/admin-jwt.guard';
import { PropMarketService } from '../prop-market/prop-market.service';

@ApiTags('Admin Dashboard - Telegraph Telemetry')
@UseGuards(AdminJwtGuard)
@Controller('admin')
export class AdminController {
    constructor(
        private readonly adminService: AdminAnalyticsService,
        private readonly propMarketService: PropMarketService,
    ) { }

    @Get('analytics')
    @ApiOperation({ summary: 'Get historical admin analytics snapshots' })
    getAnalytics(@Request() req: any, @Query('limit') limit: number = 672) {
        return this.adminService.getAnalytics(Number(limit), req.user.institutionId ?? undefined);
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

    /**
     * POST /admin/campus/pause — pauses all markets for 24 hours.
     * Requires confirmText === 'CONFIRM PAUSE' in the request body.
     */
    @Post('campus/pause')
    @ApiOperation({ summary: 'Pause all campus markets for 24 hours (requires CONFIRM PAUSE text)' })
    pauseAllCampusMarkets(@Request() req: any, @Body() body: { confirm_text: string }) {
        return this.adminService.pauseAllCampusMarkets(body.confirm_text ?? '', req.user.institutionId ?? null);
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

    /**
     * B4: Admin endpoint to create a national/regional prop market.
     * Protected by AdminJwtGuard.
     */
    @Post('markets/create')
    @ApiOperation({ summary: 'Create a new prop market (admin)' })
    createMarket(
        @Request() req: any,
        @Body() body: {
            title: string;
            description?: string;
            category?: string;
            expiry_timestamp: string;
            scope: 'LOCAL' | 'REGIONAL' | 'NATIONAL';
            institution_id?: string;
            options?: string[];
            featured?: boolean;
        },
    ) {
        const isAdmin = ['ADMIN', 'INSTITUTION_ADMIN'].includes(req.user.role);
        return this.propMarketService.createAdminMarket(
            req.user.adminId,
            isAdmin,
            body.title,
            body.description,
            body.category,
            new Date(body.expiry_timestamp),
            body.scope,
            body.institution_id ?? req.user.institutionId,
            body.options,
            body.featured ?? false,
        );
    }
}
