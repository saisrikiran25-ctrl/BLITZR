import { Repository, DataSource } from 'typeorm';
import { AdminAnalyticsEntity } from './entities/admin-analytics.entity';
import { UserEntity } from '../users/entities/user.entity';
import { TickerEntity } from '../ipo/entities/ticker.entity';
import { CredibilityService } from '../users/credibility.service';
import { BondingCurveService } from '../ipo/bonding-curve.service';
/** Safety gate text required to trigger campus market pause. */
export declare const CAMPUS_PAUSE_CONFIRM_TEXT = "CONFIRM PAUSE";
export declare class AdminAnalyticsService {
    private analyticsRepo;
    private userRepo;
    private tickerRepo;
    private readonly credibilityService;
    private readonly bondingCurve;
    private readonly dataSource;
    private readonly logger;
    constructor(analyticsRepo: Repository<AdminAnalyticsEntity>, userRepo: Repository<UserEntity>, tickerRepo: Repository<TickerEntity>, credibilityService: CredibilityService, bondingCurve: BondingCurveService, dataSource: DataSource);
    computeAdminAnalytics(): Promise<void>;
    getAnalytics(limit?: number, institutionId?: string): Promise<AdminAnalyticsEntity[]>;
    /**
     * GET moderation_queue items (Dean's Dashboard Page 4).
     */
    getModerationQueue(status?: string): Promise<any>;
    /**
     * Clear a moderation_queue item (mark post as PUBLIC).
     */
    clearModerationItem(queueId: string): Promise<{
        success: boolean;
        action: string;
        queue_id: string;
    }>;
    /**
     * Remove a moderation_queue item (mark post as REMOVED).
     */
    removeModerationItem(queueId: string): Promise<{
        success: boolean;
        action: string;
        queue_id: string;
    }>;
    /**
     * B4/Emergency: Pause all campus markets for up to 24 hours.
     * Requires confirmText === 'CONFIRM PAUSE' for safety gate.
     */
    pauseAllCampusMarkets(confirmText: string, institutionId: string | null): Promise<{
        message: string;
        frozen_tickers: number;
    }>;
    resumePausedMarkets(): Promise<void>;
    freezeAllMarkets(): Promise<{
        message: string;
        frozen_tickers: number;
    }>;
    delistTicker(tickerId: string): Promise<TickerEntity>;
    /**
     * Delist by student college email (Dean's Dashboard — Emergency Controls).
     */
    delistTickerByEmail(studentEmail: string): Promise<{
        message: string;
        delisted: string[];
    }>;
    /**
     * L5 Global Lockdown Toggle
     * Halts ALL trading and rumor publishing platform-wide.
     */
    toggleGlobalLockdown(active: boolean): Promise<{
        success: boolean;
        lockdown_active: boolean;
    }>;
    /**
     * Real-time Admin Risk Dashboard Data (L5)
     * Provides a bird-eye view of toxicity and market stress.
     */
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
    /**
     * Audit Log Export (L5 Compliance)
     * Returns a structured list of all moderation actions for legal review.
     */
    exportAuditLogs(): Promise<any>;
}
