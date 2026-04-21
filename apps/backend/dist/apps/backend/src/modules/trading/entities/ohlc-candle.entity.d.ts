import { TickerEntity } from '../../ipo/entities/ticker.entity';
/**
 * OHLC Candles Entity
 * Pre-aggregated chart data for line/candle rendering.
 * Intervals: 1m, 5m, 1h, 1d
 *
 * Per PRD §6.2
 */
export declare class OhlcCandleEntity {
    candle_id: string;
    ticker_id: string;
    ticker: TickerEntity;
    interval: string;
    open_price: number;
    high_price: number;
    low_price: number;
    close_price: number;
    volume: number;
    trade_count: number;
    bucket_start: Date;
    created_at: Date;
}
