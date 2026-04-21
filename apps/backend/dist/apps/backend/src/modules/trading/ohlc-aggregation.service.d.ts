import { Repository, DataSource } from 'typeorm';
import { OhlcCandleEntity } from '../trading/entities/ohlc-candle.entity';
/**
 * OHLC Aggregation Service
 *
 * Pre-aggregates trade data into candle buckets for chart rendering.
 * Runs on schedule to build 1m, 5m, 1h, 1d candles.
 *
 * Per PRD §6.2
 */
export declare class OhlcAggregationService {
    private readonly candleRepo;
    private readonly dataSource;
    private readonly logger;
    constructor(candleRepo: Repository<OhlcCandleEntity>, dataSource: DataSource);
    /**
     * Aggregate 1-minute candles every minute.
     */
    aggregate1m(): Promise<void>;
    /**
     * Aggregate 5-minute candles every 5 minutes.
     */
    aggregate5m(): Promise<void>;
    /**
     * Aggregate 1-hour candles every hour.
     */
    aggregate1h(): Promise<void>;
    /**
     * Aggregate 1-day candles at midnight.
     */
    aggregate1d(): Promise<void>;
    /**
     * Core aggregation logic.
     * Groups transactions by ticker and time bucket,
     * computes OHLC + volume, and upserts candle records.
     */
    private aggregateCandles;
    /**
     * Get candles for a ticker (used by chart endpoints).
     */
    getCandles(collegeDomain: string, tickerId: string, interval: string, limit?: number): Promise<OhlcCandleEntity[]>;
}
