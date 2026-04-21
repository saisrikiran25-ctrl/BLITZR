import { PropMarketService } from './prop-market.service';
export declare class MarketsController {
    private readonly propMarketService;
    constructor(propMarketService: PropMarketService);
    getMarkets(req: any, scope?: 'LOCAL' | 'REGIONAL' | 'NATIONAL' | 'ALL'): Promise<{
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
}
