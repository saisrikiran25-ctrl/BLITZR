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
 *
 * FIX (Apr 25 2026 — batch 1):
 *  - BUG-04: Added HttpException and InternalServerErrorException to imports.
 *  - BUG-05: Campus silo healer uses ticker.college_domain as authoritative value.
 *
 * FIX (Apr 25 2026 — batch 2):
 *  - BUG-08: broadcastMarketUpdates() cron no longer falls back to 'iift.edu'.
 *    Tickers with no college_domain are skipped with a warn log.
 *  - BUG-09: executeBuy + executeSell healer dead-code inner condition removed.
 *    `ticker.college_domain === collegeDomain` was unreachable inside the
 *    `ticker.college_domain !== collegeDomain` branch — now cleaned out.
 *  - NEW-01: executeBuy secondary broadcasts no longer fall back to collegeDomain.
 *    ticker.college_domain is guaranteed set by the healer above.
 *  - NEW-02: previewBuy() Global Lockdown check moved before the ticker query
 *    so a stale college_domain in DB cannot cause a misleading 404.
 *  - NEW-03: platform_wallet burn step now logs a CRITICAL warning if 0 rows
 *    were affected (row missing), surfacing the data integrity gap to ops.
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
     *
     * NEW-02 FIX: Global Lockdown check is now the FIRST thing that runs,
     * before the ticker SELECT. Previously, if college_domain was stale in
     * the DB the ticker query returned 0 rows and we threw NotFoundException
     * instead of the correct ForbiddenException('GLOBAL LOCKDOWN').
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
     */
    private calculateChangePct;
    /**
     * ATOMIC BUY — The heart of the exchange.
     * Uses SELECT ... FOR UPDATE to prevent race conditions.
     */
    executeBuy(userId: string, collegeDomain: string, tickerId: string, sharesToBuyInput: number): Promise<{
        status: string;
        new_balance: number;
    }>;
    /**
     * ATOMIC SELL — Mirror of executeBuy with reversed logic.
     */
    executeSell(userId: string, collegeDomain: string, tickerId: string, sharesToSellInput: number): Promise<{
        status: string;
        net_received: number;
    }>;
    /**
     * CRON JOB: Broadcast live price + accurate % change every minute.
     *
     * BUG-08 FIX: Removed `|| 'iift.edu'` fallback on domain resolution.
     * Tickers with no college_domain are now skipped with a warn log.
     * Previously they were silently routed into IIFT-D's realtime room,
     * causing a multi-tenant data leak and denying other campuses live updates.
     */
    broadcastMarketUpdates(): Promise<void>;
}
