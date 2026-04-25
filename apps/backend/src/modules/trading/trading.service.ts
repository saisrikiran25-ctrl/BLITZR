import {
    Injectable,
    BadRequestException,
    NotFoundException,
    ForbiddenException,
    InternalServerErrorException,
    HttpException,
    Logger,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { TransactionEntity } from './entities/transaction.entity';
import { BondingCurveService } from '../ipo/bonding-curve.service';
import { IPO_BURN_RATE, IPO_DIVIDEND_RATE, applyIpoFees } from '@blitzr/shared';
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
@Injectable()
export class TradingService {
    private readonly logger = new Logger(TradingService.name);

    constructor(
        @InjectRepository(TransactionEntity)
        private readonly txRepo: Repository<TransactionEntity>,
        private readonly bondingCurve: BondingCurveService,
        private readonly dataSource: DataSource,
        private readonly realtimeGateway: RealtimeGateway,
        private readonly notificationsService: NotificationsService,
    ) { }

    /**
     * Preview a BUY trade (no mutation — shows price impact).
     *
     * NEW-02 FIX: Global Lockdown check is now the FIRST thing that runs,
     * before the ticker SELECT. Previously, if college_domain was stale in
     * the DB the ticker query returned 0 rows and we threw NotFoundException
     * instead of the correct ForbiddenException('GLOBAL LOCKDOWN').
     */
    async previewBuy(collegeDomain: string, tickerId: string, sharesToBuy: number) {
        // NEW-02 FIX: Lockdown check FIRST — before any ticker query.
        const isLockdown = await this.dataSource.query(`SELECT value FROM settings WHERE key = 'GLOBAL_LOCKDOWN'`);
        if (isLockdown.length && isLockdown[0].value === 'true') {
            throw new ForbiddenException('Market is in GLOBAL LOCKDOWN mode. All trading is suspended.');
        }

        const ticker = await this.dataSource.query(
            `SELECT current_supply, scaling_constant, status, frozen_until FROM tickers WHERE ticker_id = $1 AND college_domain = $2`,
            [tickerId, collegeDomain],
        );

        if (!ticker.length) throw new NotFoundException(`Ticker ${tickerId} not found`);

        // Circuit Breaker Check
        if (ticker[0].status === 'AUTO_FROZEN' || ticker[0].status === 'FROZEN') {
            const frozenUntil = ticker[0].frozen_until ? new Date(ticker[0].frozen_until).getTime() : 0;
            if (frozenUntil > Date.now()) {
                throw new ForbiddenException(`Trading halted until ${new Date(frozenUntil).toLocaleTimeString()}`);
            }
        }

        if (ticker[0].status === 'DELISTED') throw new ForbiddenException('Ticker is delisted');

        const supply = Number(ticker[0].current_supply);
        const grossCost = this.bondingCurve.getBuyCost(supply, sharesToBuy);
        const { netAmount, burnAmount, dividendAmount } = applyIpoFees(grossCost);

        return {
            ticker_id: tickerId,
            shares: sharesToBuy,
            direction: 'BUY' as const,
            gross_cost: grossCost,
            burn_fee: burnAmount,
            dividend_fee: dividendAmount,
            net_cost: grossCost,
            price_before: this.bondingCurve.getPrice(supply),
            price_after: this.bondingCurve.getPriceAfterBuy(supply, sharesToBuy),
            supply_before: supply,
            supply_after: supply + sharesToBuy,
        };
    }

    /**
     * Compute NYSE-style session % change: (current - price_open) / price_open * 100
     */
    private calculateChangePct(openPrice: number, currentPrice: number): number {
        if (!openPrice || openPrice === currentPrice) return 0;
        const pct = ((currentPrice - openPrice) / openPrice) * 100;
        return Number(pct.toFixed(2));
    }

    /**
     * ATOMIC BUY — The heart of the exchange.
     * Uses SELECT ... FOR UPDATE to prevent race conditions.
     */
    async executeBuy(userId: string, collegeDomain: string, tickerId: string, sharesToBuyInput: number) {
        const sharesToBuy = Math.floor(Number(sharesToBuyInput));
        if (sharesToBuy <= 0) throw new BadRequestException('Must buy at least 1 share');

        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // Step 1: Lock the ticker row (Surgical lock by ID)
            let ticker: any;
            try {
                const tickerRows = await queryRunner.query(
                    `SELECT t.current_supply, t.owner_id, t.status, t.price_open, t.college_domain, t.frozen_until,
                            i.short_code as owner_campus
                     FROM tickers t
                     JOIN users u ON t.owner_id = u.user_id
                     LEFT JOIN institutions i ON u.institution_id = i.institution_id
                     WHERE t.ticker_id = $1
                     FOR UPDATE OF t`,
                    [tickerId],
                );

                if (!tickerRows || tickerRows.length === 0) {
                    throw new NotFoundException(`Ticker ${tickerId} not found`);
                }
                ticker = tickerRows[0];
            } catch (e: any) {
                this.logger.error(`STEP_1_FAILED: ${e.message}`);
                throw e instanceof NotFoundException ? e : new BadRequestException(`Ticker lock failed: ${e.message}`);
            }

            // BUG-05 FIX: Domain silo enforcement.
            // BUG-09 FIX: Removed dead inner condition `ticker.college_domain === collegeDomain`.
            //   That condition lived inside the block that only executes when
            //   ticker.college_domain !== collegeDomain — it could never be true.
            //   Healer now correctly fires only when ownerCampus === collegeDomain.
            if (ticker.college_domain !== collegeDomain) {
                const ownerCampus = ticker.owner_campus || ticker.college_domain;
                if (ownerCampus === collegeDomain) {
                    await queryRunner.query(
                        'UPDATE tickers SET college_domain = $1 WHERE ticker_id = $2',
                        [collegeDomain, tickerId],
                    );
                    ticker.college_domain = collegeDomain;
                } else {
                    throw new ForbiddenException(
                        `This IPO belongs to ${ticker.college_domain} and cannot be traded on the ${collegeDomain} floor.`,
                    );
                }
            }

            // L3 Circuit Breaker Check
            if (ticker.status === 'AUTO_FROZEN' || ticker.status === 'FROZEN') {
                throw new ForbiddenException(`Trading halted for security.`);
            } else if (ticker.status !== 'ACTIVE') {
                throw new ForbiddenException(`Ticker status: ${ticker.status}`);
            }

            const supply = Number(ticker.current_supply) || 0;

            // Step 2: Calculate cost
            let grossCost: number;
            let burnAmount: number;
            let dividendAmount: number;
            try {
                grossCost = Number(this.bondingCurve.getBuyCost(supply, sharesToBuy));
                const fees = applyIpoFees(grossCost);
                burnAmount = Number(fees.burnAmount);
                dividendAmount = Number(fees.dividendAmount);

                if (isNaN(grossCost) || isNaN(burnAmount) || isNaN(dividendAmount)) {
                    throw new Error('NaN calculated in trade fees');
                }
            } catch (e: any) {
                throw new BadRequestException(`Pricing engine error: ${e.message}`);
            }

            // Step 3: Lock and check user balance
            const userRows = await queryRunner.query(
                `SELECT cred_balance FROM users WHERE user_id = $1 FOR UPDATE`,
                [userId],
            );

            if (!userRows || userRows.length === 0) throw new NotFoundException('User not found');
            const balance = Number(userRows[0].cred_balance);

            if (balance < grossCost) {
                throw new BadRequestException(
                    `Insufficient Creds: need ${grossCost.toFixed(4)}, have ${balance.toFixed(4)}`,
                );
            }

            // Step 4: Update ticker supply
            await queryRunner.query(
                `UPDATE tickers SET
                  current_supply = current_supply + $1,
                  total_volume = total_volume + $2,
                  total_trades = total_trades + 1,
                  human_trades_1h = human_trades_1h + 1,
                  updated_at = NOW()
                 WHERE ticker_id = $3`,
                [Number(sharesToBuy), Number(grossCost), tickerId],
            );

            // Step 5: Deduct Creds from buyer
            await queryRunner.query(
                `UPDATE users SET cred_balance = cred_balance - $1, updated_at = NOW() WHERE user_id = $2`,
                [Number(grossCost), userId],
            );

            // Step 6: UPSERT holding
            const avgPrice = grossCost / sharesToBuy;
            await queryRunner.query(
                `INSERT INTO holdings (user_id, ticker_id, shares_held, avg_buy_price)
                 VALUES ($1, $2, $3, $4)
                 ON CONFLICT (user_id, ticker_id)
                 DO UPDATE SET
                   shares_held = holdings.shares_held + $3,
                   avg_buy_price = (
                     (COALESCE(holdings.avg_buy_price, 0) * holdings.shares_held) + ($4 * $3)
                   ) / (holdings.shares_held + $3),
                   updated_at = NOW()`,
                [userId, tickerId, Number(sharesToBuy), Number(avgPrice)],
            );

            // Step 7: Insert transaction record
            const newSupply = supply + sharesToBuy;
            await queryRunner.query(
                `INSERT INTO transactions
                 (user_id, ticker_id, tx_type, shares_quantity, amount,
                  price_at_execution, supply_at_execution,
                  burn_amount, dividend_amount, currency)
                 VALUES ($1, $2, 'BUY', $3, $4, $5, $6, $7, $8, 'CRED')`,
                [
                    userId, tickerId, Number(sharesToBuy), Number(grossCost),
                    Number(this.bondingCurve.getPrice(supply)), Number(supply),
                    Number(burnAmount), Number(dividendAmount),
                ],
            );

            // Step 8: Pay dividend to creator
            if (ticker.owner_id) {
                await queryRunner.query(
                    `UPDATE users SET
                      cred_balance = cred_balance + $1,
                      dividend_earned = dividend_earned + $1,
                      updated_at = NOW()
                     WHERE user_id = $2`,
                    [Number(dividendAmount), ticker.owner_id],
                );
            }

            // Step 9: Burn — NEW-03 FIX: log CRITICAL warning if platform_wallet row is missing.
            const burnResult = await queryRunner.query(
                `UPDATE platform_wallet SET
                  total_burned_creds = total_burned_creds + $1,
                  updated_at = NOW()
                 WHERE id = 1`,
                [Number(burnAmount)],
            );
            if (!burnResult || burnResult.affected === 0) {
                this.logger.error(
                    `PLATFORM_WALLET_MISSING: BUY burn of ${burnAmount} CRED for trade on ${tickerId} was NOT recorded. platform_wallet row id=1 does not exist. Data integrity gap — ops action required.`,
                );
            }

            // Step 10: Fetch volume before commit
            const updatedTickerRows = await queryRunner.query(
                `SELECT total_volume FROM tickers WHERE ticker_id = $1`,
                [tickerId],
            );
            const newVolume = updatedTickerRows.length ? Number(updatedTickerRows[0].total_volume) : 0;

            await queryRunner.commitTransaction();

            // Step 11: Secondary async actions (non-blocking).
            // NEW-01 FIX: Removed `|| collegeDomain` fallback from broadcastPriceUpdate
            // and broadcastPulse. ticker.college_domain is guaranteed set by the healer
            // above. The fallback was a latent silo leak matching the BUG-08 class.
            try {
                const finalPrice = this.bondingCurve.getPrice(newSupply);
                const changePct = this.calculateChangePct(Number(ticker.price_open), finalPrice);
                this.realtimeGateway.broadcastPriceUpdate(
                    ticker.college_domain,
                    tickerId, finalPrice, newSupply, changePct, newVolume,
                );
                this.realtimeGateway.broadcastPulse(ticker.college_domain, tickerId, 'BUY');
            } catch (e: any) {
                this.logger.warn(`Realtime broadcast failed: ${e.message}`);
            }

            return { status: 'SUCCESS', new_balance: balance - grossCost };
        } catch (error: any) {
            await queryRunner.rollbackTransaction();
            this.logger.error(`TRADE_CRASH: ${error.message}`);
            if (error instanceof HttpException) throw error;
            throw new InternalServerErrorException(`Trade failed: ${error.message}`);
        } finally {
            await queryRunner.release();
        }
    }

    /**
     * ATOMIC SELL — Mirror of executeBuy with reversed logic.
     */
    async executeSell(userId: string, collegeDomain: string, tickerId: string, sharesToSellInput: number) {
        const sharesToSell = Math.floor(Number(sharesToSellInput));
        if (sharesToSell <= 0) throw new BadRequestException('Must sell at least 1 share');

        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // Lock ticker (Surgical lock by ID)
            const tickerRows = await queryRunner.query(
                `SELECT t.current_supply, t.owner_id, t.status, t.price_open, t.college_domain, t.frozen_until,
                        i.short_code as owner_campus
                 FROM tickers t
                 JOIN users u ON t.owner_id = u.user_id
                 LEFT JOIN institutions i ON u.institution_id = i.institution_id
                 WHERE t.ticker_id = $1
                 FOR UPDATE OF t`,
                [tickerId],
            );

            if (!tickerRows || tickerRows.length === 0) throw new NotFoundException(`Ticker ${tickerId} not found`);
            const ticker = tickerRows[0];

            // BUG-05 FIX: Same domain silo fix as executeBuy.
            // BUG-09 FIX: Removed dead inner condition `ticker.college_domain === collegeDomain`.
            if (ticker.college_domain !== collegeDomain) {
                const ownerCampus = ticker.owner_campus || ticker.college_domain;
                if (ownerCampus === collegeDomain) {
                    await queryRunner.query(
                        'UPDATE tickers SET college_domain = $1 WHERE ticker_id = $2',
                        [collegeDomain, tickerId],
                    );
                    ticker.college_domain = collegeDomain;
                } else {
                    throw new ForbiddenException(
                        `This IPO belongs to ${ticker.college_domain} and cannot be traded on the ${collegeDomain} floor.`,
                    );
                }
            }

            // L3 Circuit Breaker Check
            if (ticker.status === 'AUTO_FROZEN' || ticker.status === 'FROZEN') {
                const frozenUntil = ticker.frozen_until ? new Date(ticker.frozen_until).getTime() : 0;
                if (frozenUntil > Date.now()) {
                    throw new ForbiddenException(
                        `Trading halted for security. Resumes at ${new Date(frozenUntil).toLocaleTimeString()}`,
                    );
                }
            } else if (ticker.status === 'DELISTED') {
                throw new ForbiddenException('Ticker is delisted and cannot be traded');
            } else if (ticker.status !== 'ACTIVE') {
                throw new ForbiddenException(`Ticker is not available for trading (status: ${ticker.status})`);
            }

            const supply = Number(ticker.current_supply);

            // Lock user's holding
            const holdingRows = await queryRunner.query(
                `SELECT shares_held FROM holdings WHERE user_id = $1 AND ticker_id = $2 FOR UPDATE`,
                [userId, tickerId],
            );

            if (!holdingRows || holdingRows.length === 0 || Number(holdingRows[0].shares_held) < sharesToSell) {
                throw new BadRequestException('Insufficient shares to sell');
            }
            const holding = holdingRows[0];

            // Calculate sell value
            const grossValue = Number(this.bondingCurve.getSellValue(supply, sharesToSell));
            const { burnAmount, dividendAmount } = applyIpoFees(grossValue);
            const netValue = grossValue - burnAmount - dividendAmount;

            // Update ticker supply
            await queryRunner.query(
                `UPDATE tickers
                 SET current_supply = current_supply - $1,
                     total_volume = total_volume + $2,
                     total_trades = total_trades + 1,
                     human_trades_1h = human_trades_1h + 1,
                     updated_at = NOW()
                 WHERE ticker_id = $3`,
                [sharesToSell, grossValue, tickerId],
            );

            // Credit Creds to seller (net of fees)
            await queryRunner.query(
                `UPDATE users SET cred_balance = cred_balance + $1, updated_at = NOW() WHERE user_id = $2`,
                [netValue, userId],
            );

            // Update holding
            const newSharesHeld = Number(holding.shares_held) - sharesToSell;
            if (newSharesHeld === 0) {
                await queryRunner.query(
                    `DELETE FROM holdings WHERE user_id = $1 AND ticker_id = $2`,
                    [userId, tickerId],
                );
            } else {
                await queryRunner.query(
                    `UPDATE holdings SET shares_held = $1, updated_at = NOW() WHERE user_id = $2 AND ticker_id = $3`,
                    [newSharesHeld, userId, tickerId],
                );
            }

            // Insert transaction
            const newSupply = supply - sharesToSell;
            await queryRunner.query(
                `INSERT INTO transactions
                 (user_id, ticker_id, tx_type, shares_quantity, amount,
                  price_at_execution, supply_at_execution,
                  burn_amount, dividend_amount, currency)
                 VALUES ($1, $2, 'SELL', $3, $4, $5, $6, $7, $8, 'CRED')`,
                [
                    userId, tickerId, sharesToSell, grossValue,
                    this.bondingCurve.getPrice(supply), supply,
                    burnAmount, dividendAmount,
                ],
            );

            // Pay dividend to creator
            await queryRunner.query(
                `UPDATE users
                 SET cred_balance = cred_balance + $1,
                     dividend_earned = dividend_earned + $1,
                     updated_at = NOW()
                 WHERE user_id = $2`,
                [dividendAmount, ticker.owner_id],
            );

            // Burn — NEW-03 FIX: log CRITICAL warning if platform_wallet row is missing.
            const burnResult = await queryRunner.query(
                `UPDATE platform_wallet
                 SET total_burned_creds = total_burned_creds + $1, updated_at = NOW()
                 WHERE id = 1`,
                [burnAmount],
            );
            if (!burnResult || burnResult.affected === 0) {
                this.logger.error(
                    `PLATFORM_WALLET_MISSING: SELL burn of ${burnAmount} CRED for trade on ${tickerId} was NOT recorded. platform_wallet row id=1 does not exist. Data integrity gap — ops action required.`,
                );
            }

            // Fetch volume before commit
            const updatedRows = await queryRunner.query(
                `SELECT total_volume FROM tickers WHERE ticker_id = $1`,
                [tickerId],
            );
            const newVolumeSell = updatedRows.length ? Number(updatedRows[0].total_volume) : 0;

            await queryRunner.commitTransaction();

            // Secondary async actions
            try {
                const finalPrice = this.bondingCurve.getPrice(newSupply);
                const changePct = this.calculateChangePct(Number(ticker.price_open), finalPrice);
                this.realtimeGateway.broadcastPriceUpdate(
                    ticker.college_domain, tickerId, finalPrice, newSupply, changePct, newVolumeSell,
                );
                this.realtimeGateway.broadcastPulse(ticker.college_domain, tickerId, 'SELL');
                this.notificationsService.createNotification(
                    userId, 'TRADE_EXECUTED',
                    `Sold ${sharesToSell} $${tickerId} @ ${this.bondingCurve.getPrice(newSupply).toFixed(2)}`,
                    'TRADING',
                ).catch(() => {});
            } catch (e: any) {
                this.logger.warn(`Secondary sell actions failed: ${e.message}`);
            }

            return { status: 'SUCCESS', net_received: netValue };
        } catch (error: any) {
            await queryRunner.rollbackTransaction();
            this.logger.error(`SELL_CRASH: ${error.message}`);
            if (error instanceof HttpException) throw error;
            throw new InternalServerErrorException(`Sell failed: ${error.message}`);
        } finally {
            await queryRunner.release();
        }
    }

    /**
     * CRON JOB: Broadcast live price + accurate % change every minute.
     *
     * BUG-08 FIX: Removed `|| 'iift.edu'` fallback on domain resolution.
     * Tickers with no college_domain are now skipped with a warn log.
     * Previously they were silently routed into IIFT-D's realtime room,
     * causing a multi-tenant data leak and denying other campuses live updates.
     */
    @Cron(CronExpression.EVERY_MINUTE)
    async broadcastMarketUpdates() {
        const tickers = await this.dataSource.query(
            `SELECT t.ticker_id, t.current_supply, t.total_volume, t.price_open, t.college_domain, t.owner_id
             FROM tickers t
             WHERE t.status = 'ACTIVE'`,
        );

        if (!tickers.length) return;

        const domainMap = new Map<string, any[]>();

        for (const t of tickers) {
            // BUG-08 FIX: Skip tickers with no domain — do NOT fall back to 'iift.edu'.
            if (!t.college_domain) {
                this.logger.warn(
                    `Ticker ${t.ticker_id} has no college_domain — skipping broadcast to prevent cross-campus data leak.`,
                );
                continue;
            }

            const supply = Number(t.current_supply);
            const currentPrice = this.bondingCurve.getPrice(supply);
            const openPrice = Number(t.price_open);
            const changePct = this.calculateChangePct(openPrice, currentPrice);

            const update = {
                ticker_id: t.ticker_id,
                price: currentPrice,
                supply,
                volume: Number(t.total_volume),
                change_pct: changePct,
            };

            // L3 Circuit Breaker: 24h Auto-Freeze on 25% drop
            if (changePct <= -25) {
                this.logger.error(`CRITICAL_DROP_DETECTED: ${t.ticker_id} dropped ${changePct}%. Triggering 24h halt.`);
                await this.dataSource.query(
                    `UPDATE tickers SET status = 'AUTO_FROZEN', frozen_until = NOW() + INTERVAL '24 hours', updated_at = NOW() WHERE ticker_id = $1`,
                    [t.ticker_id],
                );
                await this.notificationsService.createNotification(
                    t.owner_id, 'TICKER_FROZEN',
                    `Your ticker $${t.ticker_id} has been auto-frozen for 24h due to a critical price drop (>25%).`,
                    'SYSTEM',
                );
            }

            const domain = t.college_domain;
            if (!domainMap.has(domain)) domainMap.set(domain, []);
            domainMap.get(domain)!.push(update);
        }

        for (const [domain, domainTickers] of domainMap.entries()) {
            this.realtimeGateway.broadcastTickerTape(domain, domainTickers);
        }
    }
}
