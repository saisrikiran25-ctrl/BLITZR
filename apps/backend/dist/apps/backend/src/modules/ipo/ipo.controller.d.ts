import { IpoService } from './ipo.service';
import { IpoDelistService } from './ipo-delist.service';
export declare class IpoController {
    private readonly ipoService;
    private readonly ipoDelistService;
    constructor(ipoService: IpoService, ipoDelistService: IpoDelistService);
    createIpo(req: any, body: {
        ticker_symbol: string;
        category?: string;
    }): Promise<{
        ticker_id: string;
        current_supply: number;
        starting_price: number;
        market_cap: number;
    }>;
    /**
     * Panic Button — Delist IPO (PRD §7.1)
     */
    delistIpo(req: any): Promise<{
        ticker_id: any;
        status: string;
        holders_refunded: any;
        total_creds_refunded: number;
        refund_price: number;
    }>;
    /**
     * Nuke a Prop Market (costs 2000 Chips)
     */
    nukePropMarket(req: any, eventId: string): Promise<{
        event_id: string;
        nuked_by: string;
        frozen_until: Date;
    }>;
    /**
     * Buy Shoutout (pin rumor for 10 min, costs 500 Chips)
     */
    buyShoutout(req: any, rumorId: string): Promise<{
        post_id: string;
        pinned_until: Date;
    }>;
    /**
     * Buy Golden Border (costs 1000 Creds)
     */
    buyGoldenBorder(req: any): Promise<{
        ticker_id: any;
        golden_border_until: Date;
    }>;
    getActiveTickers(req: any): Promise<{
        current_price: number;
        change_percentage: number;
        market_cap: number;
        ticker_id: string;
        owner_id: string;
        owner: import("../users/entities/user.entity").UserEntity;
        current_supply: number;
        scaling_constant: number;
        price_open: number;
        total_volume: number;
        total_trades: number;
        human_trades_1h: number;
        status: "ACTIVE" | "FROZEN" | "AUTO_FROZEN" | "MANUAL_FROZEN" | "PENDING" | "DELISTED";
        frozen_until: Date;
        category: string;
        created_at: Date;
        college_domain: string;
        featured: boolean;
        updated_at: Date;
    }[]>;
    getTicker(req: any, id: string): Promise<{
        current_price: number;
        change_percentage: number;
        market_cap: number;
        ticker_id: string;
        owner_id: string;
        owner: import("../users/entities/user.entity").UserEntity;
        current_supply: number;
        scaling_constant: number;
        price_open: number;
        total_volume: number;
        total_trades: number;
        human_trades_1h: number;
        status: "ACTIVE" | "FROZEN" | "AUTO_FROZEN" | "MANUAL_FROZEN" | "PENDING" | "DELISTED";
        frozen_until: Date;
        category: string;
        created_at: Date;
        college_domain: string;
        featured: boolean;
        updated_at: Date;
    }>;
    getUserHoldings(req: any): Promise<{
        current_price: number;
        current_value: number;
        profit_loss: number;
        profit_loss_pct: number;
        holding_id: string;
        user_id: string;
        user: import("../users/entities/user.entity").UserEntity;
        ticker_id: string;
        ticker: import("./entities/ticker.entity").TickerEntity;
        shares_held: number;
        avg_buy_price: number;
        created_at: Date;
        updated_at: Date;
    }[]>;
}
