export type TickerStatus = 'ACTIVE' | 'FROZEN' | 'DELISTED';
export interface Ticker {
    ticker_id: string;
    owner_id: string;
    current_supply: number;
    scaling_constant: number;
    total_volume: number;
    total_trades: number;
    human_trades_1h: number;
    status: TickerStatus;
    frozen_until?: string;
    category?: string;
    created_at: string;
    updated_at: string;
}
export interface TickerWithPrice extends Ticker {
    current_price: number;
    price_change_24h: number;
    market_cap: number;
}
export interface Holding {
    holding_id: string;
    user_id: string;
    ticker_id: string;
    shares_held: number;
    avg_buy_price: number;
    created_at: string;
    updated_at: string;
}
export interface HoldingWithPnL extends Holding {
    current_price: number;
    current_value: number;
    profit_loss: number;
    profit_loss_pct: number;
}
//# sourceMappingURL=ticker.types.d.ts.map