import { Repository, DataSource } from 'typeorm';
import { TransactionEntity } from './entities/transaction.entity';
import { BondingCurveService } from '../ipo/bonding-curve.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { NotificationsService } from '../notifications/notifications.service';
/**
 * TradingService
 *
 * Implements ATOMIC trade execution using PostgreSQL row-level locks.
 * This is the "Priya Slap" prevention layer.
 *
 * Transaction sequence:
 * 1. BEGIN
 * 2. SELECT ... FOR UPDATE on tickers row (locks supply)
 * 3. SELECT ... FOR UPDATE on users row (locks balance)
 * 4. Calculate cost via bonding curve integral
 * 5. Validate sufficient balance
 * 6. UPDATE supply, balance, holdings
 * 7. INSERT transaction record
 * 8. Pay dividend to creator
 * 9. COMMIT
 */
export declare class TradingService {
    private readonly txRepo;
    private readonly bondingCurve;
    private readonly dataSource;
    private readonly realtimeGateway;
    private readonly notificationsService;
    private readonly logger;
    constructor(txRepo: Repository<TransactionEntity>, bondingCurve: BondingCurveService, dataSource: DataSource, realtimeGateway: RealtimeGateway, notificationsService: NotificationsService);
    /**
     * Preview a BUY trade (no mutation — shows price impact).
     */
    previewBuy(collegeDomain: string, tickerId: string, sharesToBuy: number): Promise<{
        ticker_id: string;
        shares: number;
        direction: "BUY";
        gross_cost: number;
        burn_fee: number;
        dividend_fee: number;
        net_cost: number;
        price_before: number;
        price_after: number;
        supply_before: number;
        supply_after: number;
    }>;
    /**
     * Compute NYSE-style session % change: (current - price_open) / price_open * 100
     * price_open is the session-open price reset every 24h by the daily Cron.
     */
    private calculateChangePct;
    /**
     * ATOMIC BUY — The heart of the exchange.
     * Uses SELECT ... FOR UPDATE to prevent race conditions.
     */
    executeBuy(userId: string, collegeDomain: string, tickerId: string, sharesToBuy: number): Promise<{
        tx_type: string;
        ticker_id: string;
        shares: number;
        total_cost: number;
        burn_fee: number;
        dividend_paid: number;
        new_price: number;
        new_supply: number;
        new_balance: number;
    }>;
    /**
     * ATOMIC SELL — Mirror of executeBuy with reversed logic.
     */
    executeSell(userId: string, collegeDomain: string, tickerId: string, sharesToSell: number): Promise<{
        tx_type: string;
        ticker_id: string;
        shares: number;
        gross_value: number;
        net_received: number;
        burn_fee: number;
        dividend_paid: number;
        new_price: number;
        new_supply: number;
    }>;
    /**
     * CRON JOB: Broadcast live price + accurate % change every minute.
     * % change = (currentPrice - lastTxPrice) / lastTxPrice * 100
     * Includes supply so frontend can recompute Global Market Cap.
     */
    broadcastMarketUpdates(): Promise<void>;
}
