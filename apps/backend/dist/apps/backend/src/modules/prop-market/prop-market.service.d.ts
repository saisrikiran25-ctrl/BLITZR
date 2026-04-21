import { Repository, DataSource } from 'typeorm';
import { PropEventEntity } from './entities/prop-event.entity';
import { PropBetEntity } from './entities/prop-bet.entity';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { CredibilityService } from '../users/credibility.service';
import { NotificationsService } from '../notifications/notifications.service';
export declare class PropMarketService {
    private readonly eventRepo;
    private readonly betRepo;
    private readonly dataSource;
    private readonly realtimeGateway;
    private readonly credibilityService;
    private readonly notificationsService;
    constructor(eventRepo: Repository<PropEventEntity>, betRepo: Repository<PropBetEntity>, dataSource: DataSource, realtimeGateway: RealtimeGateway, credibilityService: CredibilityService, notificationsService: NotificationsService);
    /**
     * Create a new prop event.
     */
    createEvent(creatorId: string, collegeDomain: string, title: string, description: string | undefined, category: string | undefined, expiryTimestamp: Date, refereeId?: string, listingFee?: number, initialLiquidity?: number): Promise<PropEventEntity>;
    /**
     * Place a bet on a prop event (pari-mutuel).
     * Uses SELECT ... FOR UPDATE to prevent pool race conditions.
     */
    placeBet(userId: string, collegeDomain: string, eventId: string, outcome: 'YES' | 'NO', chipAmount: number): Promise<{
        event_id: string;
        outcome: "YES" | "NO";
        chip_amount: number;
        platform_fee: number;
    }>;
    /**
     * Settle a prop event (pari-mutuel payout).
     * Only the creator or referee can settle.
     */
    settleEvent(settledBy: string, collegeDomain: string, eventId: string, winningOutcome: 'YES' | 'NO'): Promise<{
        event_id: string;
        winning_outcome: "YES" | "NO";
        total_pool: number;
        winners_paid: any;
    }>;
    /**
     * Get active prop events with live odds.
     */
    getActiveEvents(userId: string, scope?: 'LOCAL' | 'REGIONAL' | 'NATIONAL' | 'ALL'): Promise<{
        total_pool: number;
        yes_odds: number;
        no_odds: number;
        time_remaining_ms: number;
        event_id: string;
        creator_id: string;
        creator: import("../users/entities/user.entity").UserEntity;
        title: string;
        description: string;
        category: string;
        status: "OPEN" | "PAUSED" | "CLOSED" | "SETTLED" | "CANCELLED";
        yes_pool: number;
        no_pool: number;
        options: string[];
        winning_outcome: string;
        referee_id: string;
        referee: import("../users/entities/user.entity").UserEntity;
        expiry_timestamp: Date;
        settled_at: Date;
        listing_fee_paid: number;
        platform_fee_rate: number;
        created_at: Date;
        scope: "LOCAL" | "REGIONAL" | "NATIONAL";
        institution_id: string;
        featured: boolean;
        college_domain: string;
        updated_at: Date;
    }[]>;
    getActiveEventsForInstitution(institutionId: string | null, scope?: 'LOCAL' | 'REGIONAL' | 'NATIONAL' | 'ALL'): Promise<{
        total_pool: number;
        yes_odds: number;
        no_odds: number;
        time_remaining_ms: number;
        event_id: string;
        creator_id: string;
        creator: import("../users/entities/user.entity").UserEntity;
        title: string;
        description: string;
        category: string;
        status: "OPEN" | "PAUSED" | "CLOSED" | "SETTLED" | "CANCELLED";
        yes_pool: number;
        no_pool: number;
        options: string[];
        winning_outcome: string;
        referee_id: string;
        referee: import("../users/entities/user.entity").UserEntity;
        expiry_timestamp: Date;
        settled_at: Date;
        listing_fee_paid: number;
        platform_fee_rate: number;
        created_at: Date;
        scope: "LOCAL" | "REGIONAL" | "NATIONAL";
        institution_id: string;
        featured: boolean;
        college_domain: string;
        updated_at: Date;
    }[]>;
    /**
     * B4: Admin create a national/regional prop market.
     * scope is enforced server-side — isAdmin must be validated by caller.
     */
    createAdminMarket(creatorId: string, isAdmin: boolean, title: string, description: string | undefined, category: string | undefined, expiryTimestamp: Date, scope: 'LOCAL' | 'REGIONAL' | 'NATIONAL', institutionId: string | undefined, options: string[] | undefined, featured?: boolean): Promise<PropEventEntity[]>;
}
