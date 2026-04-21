import { DataSource } from 'typeorm';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { BondingCurveService } from '../ipo/bonding-curve.service';
import { ConfigService } from '@nestjs/config';
/**
 * MarketMakerService (Ghost Town Defense)
 *
 * Cron job that runs every 120 seconds.
 * - Selects 10 random active tickers with low volume
 * - Executes random Buy/Sell of 1-3 shares
 * - Creates chart "wiggling" to simulate activity
 * - Disengages once a ticker hits 50 human trades/hour
 */
export declare class MarketMakerService {
    private readonly dataSource;
    private readonly realtimeGateway;
    private readonly bondingCurve;
    private readonly configService;
    private readonly logger;
    private redisClient;
    private readonly redisUrl;
    constructor(dataSource: DataSource, realtimeGateway: RealtimeGateway, bondingCurve: BondingCurveService, configService: ConfigService);
    /**
     * Ghost Town Defense — runs every 2 minutes.
     */
    executeMarketMaking(): Promise<void>;
    /**
     * Reset hourly trade counters (runs every hour).
     */
    resetHourlyCounters(): Promise<void>;
    /**
     * Daily session open reset — snapshots current bonding curve price
     * into price_open for all active tickers. Enables NYSE-style
     * session % change: (current - price_open) / price_open * 100.
     * Runs at UTC midnight (00:00) every day.
     */
    resetSessionOpenPrices(): Promise<void>;
    private randomInt;
}
