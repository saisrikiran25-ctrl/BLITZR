import { Repository, DataSource } from 'typeorm';
import { TickerEntity } from './entities/ticker.entity';
import { HoldingEntity } from './entities/holding.entity';
import { BondingCurveService } from './bonding-curve.service';
export declare class IpoService {
    private readonly tickerRepo;
    private readonly holdingRepo;
    private readonly bondingCurve;
    private readonly dataSource;
    constructor(tickerRepo: Repository<TickerEntity>, holdingRepo: Repository<HoldingEntity>, bondingCurve: BondingCurveService, dataSource: DataSource);
    /**
     * Compute NYSE-style session % change: (current - price_open) / price_open * 100
     * price_open is set at IPO time and reset every 24h by the Cron job.
     */
    private calculateChangePct;
    /**
     * IPO Opt-In: Initialize a new ticker for a user.
     * Sets initial supply to 1 (held by creator), calculates starting price.
     */
    createIpo(userId: string, collegeDomain: string, tickerSymbol: string, category?: string): Promise<{
        ticker_id: string;
        current_supply: number;
        starting_price: number;
        market_cap: number;
    }>;
    /**
     * Get a ticker by ID with current price.
     */
    getTicker(collegeDomain: string, tickerId: string): Promise<{
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
        updated_at: Date;
    }>;
    /**
     * Get all active tickers with live prices.
     */
    getActiveTickers(collegeDomain: string): Promise<{
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
        updated_at: Date;
    }[]>;
    /**
     * Get holdings for a user (portfolio).
     */
    getUserHoldings(userId: string): Promise<{
        current_price: number;
        current_value: number;
        profit_loss: number;
        profit_loss_pct: number;
        holding_id: string;
        user_id: string;
        user: import("../users/entities/user.entity").UserEntity;
        ticker_id: string;
        ticker: TickerEntity;
        shares_held: number;
        avg_buy_price: number;
        created_at: Date;
        updated_at: Date;
    }[]>;
}
