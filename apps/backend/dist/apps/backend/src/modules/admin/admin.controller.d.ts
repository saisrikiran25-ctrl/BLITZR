import { AdminAnalyticsService } from './admin-analytics.service';
import { PropMarketService } from '../prop-market/prop-market.service';
export declare class AdminController {
    private readonly adminService;
    private readonly propMarketService;
    constructor(adminService: AdminAnalyticsService, propMarketService: PropMarketService);
    getAnalytics(req: any, limit?: number): Promise<import("./entities/admin-analytics.entity").AdminAnalyticsEntity[]>;
    /**
     * GET moderation queue — reads from moderation_queue table (Dean's Dashboard Page 4).
     */
    getModerationQueue(status?: string): Promise<any>;
    /**
     * PATCH clear — sets post.visibility = PUBLIC, rewards author credibility.
     */
    clearModerationItem(queueId: string): Promise<{
        success: boolean;
        action: string;
        queue_id: string;
    }>;
    /**
     * PATCH remove — sets post.visibility = REMOVED, penalises author credibility.
     */
    removeModerationItem(queueId: string): Promise<{
        success: boolean;
        action: string;
        queue_id: string;
    }>;
    /**
     * POST /admin/campus/pause — pauses all markets for 24 hours.
     * Requires confirmText === 'CONFIRM PAUSE' in the request body.
     */
    pauseAllCampusMarkets(req: any, body: {
        confirm_text: string;
    }): Promise<{
        message: string;
        frozen_tickers: number;
    }>;
    freezeAllMarkets(): Promise<{
        message: string;
        frozen_tickers: number;
    }>;
    delistTicker(tickerId: string): Promise<import("../ipo/entities/ticker.entity").TickerEntity>;
    /**
     * POST /admin/emergency/delist-by-email — delist by student email.
     */
    delistByEmail(body: {
        email: string;
    }): Promise<{
        message: string;
        delisted: string[];
    }>;
    /**
     * B4: Admin endpoint to create a national/regional prop market.
     * Protected by AdminJwtGuard.
     */
    createMarket(req: any, body: {
        title: string;
        description?: string;
        category?: string;
        expiry_timestamp: string;
        scope: 'LOCAL' | 'REGIONAL' | 'NATIONAL';
        institution_id?: string;
        options?: string[];
        featured?: boolean;
    }): Promise<import("../prop-market/entities/prop-event.entity").PropEventEntity[]>;
    toggleLockdown(body: {
        active: boolean;
    }): Promise<{
        success: boolean;
        lockdown_active: boolean;
    }>;
    getRiskMetrics(): Promise<{
        timestamp: Date;
        toxicity: {
            high_risk_24h: number;
            avg_toxicity_24h: string;
            pending_moderation: number;
        };
        market: {
            halted_tickers: number;
            delisted_tickers: number;
        };
    }>;
    exportAuditLogs(): Promise<any>;
}
