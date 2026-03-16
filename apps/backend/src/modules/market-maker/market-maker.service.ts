import { Injectable, Logger } from '@nestjs/common';
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

/**
 * MarketMakerService (Ghost Town Defense)
 * 
 * Cron job that runs every 120 seconds.
 * - Selects 10 random active tickers with low volume
 * - Executes random Buy/Sell of 1-3 shares
 * - Creates chart "wiggling" to simulate activity
 * - Disengages once a ticker hits 50 human trades/hour
 */
@Injectable()
export class MarketMakerService {
    private readonly logger = new Logger(MarketMakerService.name);

    constructor(
        private readonly dataSource: DataSource,
        private readonly realtimeGateway: RealtimeGateway,
        private readonly bondingCurve: BondingCurveService,
    ) { }

    /**
     * Ghost Town Defense — runs every 2 minutes.
     */
    @Cron('*/2 * * * *') // Every 2 minutes
    async executeMarketMaking() {
        this.logger.log('🤖 Market Maker bot executing...');

        try {
            // Select random active tickers with low human activity
            const tickers = await this.dataSource.query(
                `SELECT ticker_id, current_supply, owner_id, college_domain 
         FROM tickers 
         WHERE status = 'ACTIVE' 
           AND human_trades_1h < $1
         ORDER BY RANDOM() 
         LIMIT $2`,
                [MARKET_MAKER_SUNSET_THRESHOLD, MARKET_MAKER_BATCH_SIZE],
            );

            for (const ticker of tickers) {
                const shares = this.randomInt(MARKET_MAKER_MIN_SHARES, MARKET_MAKER_MAX_SHARES);
                const isBuy = Math.random() > 0.5;
                const supply = Number(ticker.current_supply);

                // Don't sell below minimum supply
                if (!isBuy && supply <= shares + 1) continue;

                // Execute via raw SQL
                let newSupply: number;
                if (isBuy) {
                    newSupply = supply + shares;
                    await this.dataSource.query(
                        `UPDATE tickers 
             SET current_supply = current_supply + $1, 
                 total_trades = total_trades + 1,
                 updated_at = NOW()
             WHERE ticker_id = $2`,
                        [shares, ticker.ticker_id],
                    );
                } else {
                    newSupply = supply - shares;
                    await this.dataSource.query(
                        `UPDATE tickers 
             SET current_supply = current_supply - $1, 
                 total_trades = total_trades + 1,
                 updated_at = NOW()
             WHERE ticker_id = $2`,
                        [shares, ticker.ticker_id],
                    );
                }

                // Calculate results for broadcast
                const finalPrice = this.bondingCurve.getPrice(newSupply);

                // Fetch updated ticker data for broadcast (especially price_open and volume)
                const [updatedTicker] = await this.dataSource.query(
                    `SELECT price_open, total_volume FROM tickers WHERE ticker_id = $1`,
                    [ticker.ticker_id]
                );

                if (updatedTicker) {
                    const openPrice = Number(updatedTicker.price_open);
                    const changePct = openPrice ? Number(((finalPrice - openPrice) / openPrice * 100).toFixed(2)) : 0;
                    const volume = Number(updatedTicker.total_volume);

                    // Broadcast Real-Time
                    this.realtimeGateway.broadcastPriceUpdate(
                        ticker.college_domain,
                        ticker.ticker_id,
                        finalPrice,
                        newSupply,
                        changePct,
                        volume
                    );
                    this.realtimeGateway.broadcastPulse(ticker.college_domain, ticker.ticker_id, isBuy ? 'BUY' : 'SELL');
                }

                this.logger.debug(
                    `Bot ${isBuy ? 'bought' : 'sold'} ${shares} of ${ticker.ticker_id}`,
                );
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
        await this.dataSource.query(
            `UPDATE tickers SET human_trades_1h = 0 WHERE status = 'ACTIVE'`,
        );
        this.logger.log('Reset hourly trade counters');
    }

    /**
     * Daily session open reset — snapshots current bonding curve price
     * into price_open for all active tickers. Enables NYSE-style
     * session % change: (current - price_open) / price_open * 100.
     * Runs at UTC midnight (00:00) every day.
     */
    @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
    async resetSessionOpenPrices() {
        const tickers = await this.dataSource.query(
            `SELECT ticker_id, current_supply FROM tickers WHERE status = 'ACTIVE'`
        );

        if (!tickers.length) return;

        for (const t of tickers) {
            const supply = Number(t.current_supply);
            // P(s) = s^2 / k  where k = 200
            const currentPrice = (supply * supply) / 200;
            await this.dataSource.query(
                `UPDATE tickers SET price_open = $1 WHERE ticker_id = $2`,
                [Number(currentPrice.toFixed(4)), t.ticker_id]
            );
        }

        this.logger.log(`🌅 Session open prices reset for ${tickers.length} tickers`);
    }

    private randomInt(min: number, max: number): number {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
}
