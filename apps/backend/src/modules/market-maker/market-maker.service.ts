import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DataSource } from 'typeorm';
import {
    MARKET_MAKER_BATCH_SIZE,
    MARKET_MAKER_MIN_SHARES,
    MARKET_MAKER_MAX_SHARES,
    MARKET_MAKER_SUNSET_THRESHOLD,
} from '@blitzr/shared';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { BondingCurveService } from '../ipo/bonding-curve.service';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { createRedisClient } from '../../config/redis.factory';

/**
 * MarketMakerService (Ghost Town Defense)
 *
 * Cron job that runs every 120 seconds.
 * - Selects 10 random active tickers with low volume
 * - Executes random Buy/Sell of 1-3 shares
 * - Creates chart "wiggling" to simulate activity
 * - Disengages once a ticker hits 50 human trades/hour
 *
 * FIX (Apr 25 2026):
 *  - BUG-03: Service now implements OnModuleInit/OnModuleDestroy.
 *    createRedisClient uses lazyConnect:true so the client does NOT
 *    auto-connect. Without an explicit .connect() call the client stays
 *    permanently in 'wait' state, meaning:
 *      a) status check in executeMarketMaking() always returns false
 *         → all bot trades silently skipped
 *      b) redisClient.keys() in resetSessionOpenPrices() throws
 *         "Stream isn't writeable" every midnight, crashing the cron.
 *    Fix: call await redisClient.connect() in onModuleInit() with graceful
 *    try/catch so a Redis outage at boot doesn't crash the whole process.
 *  - BUG-07: BUY path now also increments total_volume.
 *    Previously only the SELL path updated total_volume. This under-reported
 *    volume so the 5% bot volume cap never triggered on buy-side.
 */
@Injectable()
export class MarketMakerService implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(MarketMakerService.name);

    private redisClient: Redis;

    constructor(
        private readonly dataSource: DataSource,
        private readonly realtimeGateway: RealtimeGateway,
        private readonly bondingCurve: BondingCurveService,
        private readonly configService: ConfigService,
    ) {}

    async onModuleInit() {
        const redisUrl = this.configService.get<string>('REDIS_URL', 'redis://localhost:6379');
        this.redisClient = createRedisClient(redisUrl, 'MarketMaker');
        // BUG-03 FIX: lazyConnect:true means the client won't auto-connect.
        // Explicitly connect here so status becomes 'ready' before first cron tick.
        try {
            await this.redisClient.connect();
        } catch (err: any) {
            this.logger.warn(`MarketMaker Redis initial connect failed (will retry): ${err.message}`);
        }
    }

    onModuleDestroy() {
        this.redisClient?.disconnect();
    }

    /**
     * Ghost Town Defense — runs every 2 minutes.
     */
    @Cron('*/2 * * * *')
    async executeMarketMaking() {
        this.logger.log('🤖 Market Maker bot executing...');

        try {
            const tickers = await this.dataSource.query(
                `SELECT ticker_id, current_supply, owner_id, college_domain, price_open, total_volume
         FROM tickers
         WHERE status = 'ACTIVE'
           AND human_trades_1h < $1
         ORDER BY RANDOM()
         LIMIT $2`,
                [MARKET_MAKER_SUNSET_THRESHOLD, MARKET_MAKER_BATCH_SIZE],
            );

            for (const ticker of tickers) {
                const supply = Number(ticker.current_supply);
                const currentPrice = this.bondingCurve.getPrice(supply);
                const openPrice = Number(ticker.price_open) || currentPrice;

                const botVolKey = `bot:vol:${ticker.ticker_id}:${new Date().toISOString().split('T')[0]}`;

                // Safety: Skip if Redis is not yet ready
                if (this.redisClient.status !== 'ready') {
                    this.logger.warn(
                        `Redis [${this.redisClient.status}]. Skipping bot logic for ${ticker.ticker_id}`,
                    );
                    continue;
                }

                const botSharesTraded = Number(await this.redisClient.get(botVolKey)) || 0;
                const totalSessionVolume = Number(ticker.total_volume) || 1;

                if (botSharesTraded / totalSessionVolume > 0.05) {
                    this.logger.debug(`Bot volume cap reached for ${ticker.ticker_id} (5%). Skipping.`);
                    continue;
                }

                // L3 Mean Reversion with randomness
                let isBuy = Math.random() > 0.5;
                if (currentPrice < openPrice * 0.95) isBuy = Math.random() > 0.2;
                else if (currentPrice > openPrice * 1.05) isBuy = Math.random() < 0.2;

                const shares = this.randomInt(MARKET_MAKER_MIN_SHARES, MARKET_MAKER_MAX_SHARES);

                if (!isBuy && supply <= shares + 1) continue;

                let newSupply: number;
                if (isBuy) {
                    newSupply = supply + shares;
                    // BUG-07 FIX: BUY now also increments total_volume (cost in Creds).
                    // Previously only SELL updated total_volume, causing the 5% bot cap
                    // to never trigger on buy-side, allowing unlimited bot buy pressure.
                    const buyCost = this.bondingCurve.getBuyCost(supply, shares);
                    await this.dataSource.query(
                        `UPDATE tickers
             SET current_supply = current_supply + $1,
                 total_volume = total_volume + $2,
                 total_trades = total_trades + 1,
                 updated_at = NOW()
             WHERE ticker_id = $3`,
                        [shares, buyCost, ticker.ticker_id],
                    );
                } else {
                    newSupply = supply - shares;
                    await this.dataSource.query(
                        `UPDATE tickers
             SET current_supply = current_supply - $1,
                 total_trades = total_trades + 1,
                 total_volume = total_volume + $2,
                 updated_at = NOW()
             WHERE ticker_id = $3`,
                        [shares, this.bondingCurve.getSellValue(supply, shares), ticker.ticker_id],
                    );
                }

                await this.redisClient.incrby(botVolKey, shares);
                await this.redisClient.expire(botVolKey, 86400);

                const finalPrice = this.bondingCurve.getPrice(newSupply);

                const [updatedTicker] = await this.dataSource.query(
                    `SELECT price_open, total_volume FROM tickers WHERE ticker_id = $1`,
                    [ticker.ticker_id],
                );

                if (updatedTicker) {
                    const updatedOpen = Number(updatedTicker.price_open);
                    const changePct = updatedOpen
                        ? Number(((finalPrice - updatedOpen) / updatedOpen * 100).toFixed(2))
                        : 0;
                    const volume = Number(updatedTicker.total_volume);

                    this.realtimeGateway.broadcastPriceUpdate(
                        ticker.college_domain,
                        ticker.ticker_id,
                        finalPrice,
                        newSupply,
                        changePct,
                        volume,
                    );
                    this.realtimeGateway.broadcastPulse(
                        ticker.college_domain,
                        ticker.ticker_id,
                        isBuy ? 'BUY' : 'SELL',
                    );
                }

                this.logger.debug(`Bot ${isBuy ? 'bought' : 'sold'} ${shares} of ${ticker.ticker_id}`);
            }

            this.logger.log(`Market Maker processed ${tickers.length} tickers`);
        } catch (error) {
            this.logger.error('Market Maker error:', error);
        }
    }

    /**
     * Reset hourly trade counters (runs every hour).
     */
    @Cron(CronExpression.EVERY_HOUR)
    async resetHourlyCounters() {
        await this.dataSource.query(`UPDATE tickers SET human_trades_1h = 0 WHERE status = 'ACTIVE'`);
        this.logger.log('Reset hourly trade counters');
    }

    /**
     * Daily session open reset — snapshots current bonding curve price
     * into price_open for all active tickers.
     * Runs at UTC midnight (00:00) every day.
     */
    @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
    async resetSessionOpenPrices() {
        const tickers = await this.dataSource.query(
            `SELECT ticker_id, current_supply FROM tickers WHERE status = 'ACTIVE'`,
        );

        if (!tickers.length) return;

        // Clear bot volume tracking keys for the new session.
        // BUG-03 FIX: this previously threw 'Stream isn't writeable' every midnight
        // because the client was never connected. Now safe.
        if (this.redisClient.status === 'ready') {
            const keys = await this.redisClient.keys('bot:vol:*');
            if (keys.length > 0) await this.redisClient.del(...keys);
        } else {
            this.logger.warn('Redis not ready during session reset — bot:vol keys not cleared.');
        }

        for (const t of tickers) {
            const supply = Number(t.current_supply);
            const currentPrice = this.bondingCurve.getPrice(supply);
            await this.dataSource.query(
                `UPDATE tickers SET price_open = $1 WHERE ticker_id = $2`,
                [currentPrice, t.ticker_id],
            );
        }

        this.logger.log(`🌅 Session open prices reset for ${tickers.length} tickers`);
    }

    private randomInt(min: number, max: number): number {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
}
