import { Injectable, Logger, ForbiddenException } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
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
@Injectable()
export class OhlcAggregationService {
    private readonly logger = new Logger(OhlcAggregationService.name);

    constructor(
        @InjectRepository(OhlcCandleEntity)
        private readonly candleRepo: Repository<OhlcCandleEntity>,
        private readonly dataSource: DataSource,
    ) { }

    /**
     * Aggregate 1-minute candles every minute.
     */
    @Cron(CronExpression.EVERY_MINUTE)
    async aggregate1m() {
        await this.aggregateCandles('1m', 60);
    }

    /**
     * Aggregate 5-minute candles every 5 minutes.
     */
    @Cron(CronExpression.EVERY_5_MINUTES)
    async aggregate5m() {
        await this.aggregateCandles('5m', 300);
    }

    /**
     * Aggregate 1-hour candles every hour.
     */
    @Cron(CronExpression.EVERY_HOUR)
    async aggregate1h() {
        await this.aggregateCandles('1h', 3600);
    }

    /**
     * Aggregate 1-day candles at midnight.
     */
    @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
    async aggregate1d() {
        await this.aggregateCandles('1d', 86400);
    }

    /**
     * Core aggregation logic.
     * Groups transactions by ticker and time bucket,
     * computes OHLC + volume, and upserts candle records.
     */
    private async aggregateCandles(interval: string, bucketSeconds: number) {
        try {
            const bucketEnd = new Date();
            const bucketStart = new Date(bucketEnd.getTime() - bucketSeconds * 1000);

            // Get all trades in this bucket
            const trades = await this.dataSource.query(
                `SELECT ticker_id, price_at_execution, amount, created_at
         FROM transactions
         WHERE tx_type IN ('BUY', 'SELL')
           AND ticker_id IS NOT NULL
           AND created_at >= $1 AND created_at < $2
         ORDER BY created_at ASC`,
                [bucketStart.toISOString(), bucketEnd.toISOString()],
            );

            // Group by ticker
            const byTicker: Record<string, Array<{ price: number; amount: number }>> = {};
            for (const t of trades) {
                if (!byTicker[t.ticker_id]) byTicker[t.ticker_id] = [];
                byTicker[t.ticker_id].push({
                    price: Number(t.price_at_execution),
                    amount: Number(t.amount),
                });
            }

            // Build candles
            for (const [tickerId, tickerTrades] of Object.entries(byTicker)) {
                if (tickerTrades.length === 0) continue;

                const prices = tickerTrades.map((t) => t.price);
                const volume = tickerTrades.reduce((sum, t) => sum + t.amount, 0);

                await this.dataSource.query(
                    `INSERT INTO ohlc_candles (ticker_id, interval, open_price, high_price, low_price, close_price, volume, trade_count, bucket_start)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
           ON CONFLICT DO NOTHING`,
                    [
                        tickerId,
                        interval,
                        prices[0],
                        Math.max(...prices),
                        Math.min(...prices),
                        prices[prices.length - 1],
                        volume,
                        tickerTrades.length,
                        bucketStart.toISOString(),
                    ],
                );
            }

            if (Object.keys(byTicker).length > 0) {
                this.logger.debug(
                    `Aggregated ${interval} candles for ${Object.keys(byTicker).length} tickers`,
                );
            }
        } catch (error) {
            this.logger.error(`OHLC aggregation error (${interval}):`, error);
        }
    }

    /**
     * Get candles for a ticker (used by chart endpoints).
     */
    async getCandles(collegeDomain: string, tickerId: string, interval: string, limit: number = 100) {
        // Enforce domain isolation before yielding read-only candlestick data
        const [ticker] = await this.dataSource.query(
            `SELECT 1 FROM tickers WHERE ticker_id = $1 AND college_domain = $2`,
            [tickerId, collegeDomain]
        );
        if (!ticker) throw new ForbiddenException('Access denied to this ticker');
        return this.candleRepo.find({
            where: { ticker_id: tickerId, interval },
            order: { bucket_start: 'DESC' },
            take: limit,
        });
    }
}
