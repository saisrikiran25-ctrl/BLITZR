import { PropMarketService } from './prop-market.service';
export declare class PropMarketController {
    private readonly propMarketService;
    constructor(propMarketService: PropMarketService);
    createEvent(req: any, body: {
        title: string;
        description?: string;
        category?: string;
        expiry_timestamp: string;
        referee_id?: string;
        listing_fee?: number;
        initial_liquidity: number;
    }): Promise<import("./entities/prop-event.entity").PropEventEntity>;
    placeBet(req: any, body: {
        event_id: string;
        outcome: 'YES' | 'NO';
        chip_amount: number;
    }): Promise<{
        event_id: string;
        outcome: "YES" | "NO";
        chip_amount: number;
        platform_fee: number;
    }>;
    settleEvent(req: any, body: {
        event_id: string;
        winning_outcome: 'YES' | 'NO';
    }): Promise<{
        event_id: string;
        winning_outcome: "YES" | "NO";
        total_pool: number;
        winners_paid: any;
    }>;
    getActiveEvents(req: any, scope?: 'LOCAL' | 'REGIONAL' | 'NATIONAL' | 'ALL'): Promise<{
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
     * B4: Admin endpoint to create a national/regional prop market.
     * Protected by ADMIN_SECRET header.
     */
    adminCreateMarket(req: any, body: {
        title: string;
        description?: string;
        category?: string;
        expiry_timestamp: string;
        scope: 'LOCAL' | 'REGIONAL' | 'NATIONAL';
        institution_id?: string;
        options?: string[];
        featured?: boolean;
    }): Promise<import("./entities/prop-event.entity").PropEventEntity[]>;
}
