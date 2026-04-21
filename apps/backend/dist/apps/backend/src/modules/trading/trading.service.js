"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var TradingService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TradingService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const transaction_entity_1 = require("./entities/transaction.entity");
const bonding_curve_service_1 = require("../ipo/bonding-curve.service");
const shared_1 = require("@blitzr/shared");
const realtime_gateway_1 = require("../realtime/realtime.gateway");
const notifications_service_1 = require("../notifications/notifications.service");
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
let TradingService = TradingService_1 = class TradingService {
    constructor(txRepo, bondingCurve, dataSource, realtimeGateway, notificationsService) {
        this.txRepo = txRepo;
        this.bondingCurve = bondingCurve;
        this.dataSource = dataSource;
        this.realtimeGateway = realtimeGateway;
        this.notificationsService = notificationsService;
        this.logger = new common_1.Logger(TradingService_1.name);
    }
    /**
     * Preview a BUY trade (no mutation — shows price impact).
     */
    async previewBuy(collegeDomain, tickerId, sharesToBuy) {
        const ticker = await this.dataSource.query(`SELECT current_supply, scaling_constant, status, frozen_until FROM tickers WHERE ticker_id = $1 AND college_domain = $2`, [tickerId, collegeDomain]);
        // Global Lockdown Check
        const isLockdown = await this.dataSource.query(`SELECT value FROM settings WHERE key = 'GLOBAL_LOCKDOWN'`);
        if (isLockdown.length && isLockdown[0].value === 'true') {
            throw new common_1.ForbiddenException('Market is in GLOBAL LOCKDOWN mode. All trading is suspended.');
        }
        if (!ticker.length)
            throw new common_1.NotFoundException(`Ticker ${tickerId} not found`);
        // Circuit Breaker Check
        if (ticker[0].status === 'AUTO_FROZEN' || ticker[0].status === 'FROZEN') {
            const frozenUntil = ticker[0].frozen_until ? new Date(ticker[0].frozen_until).getTime() : 0;
            if (frozenUntil > Date.now()) {
                throw new common_1.ForbiddenException(`Trading halted until ${new Date(frozenUntil).toLocaleTimeString()}`);
            }
        }
        if (ticker[0].status === 'DELISTED')
            throw new common_1.ForbiddenException('Ticker is delisted');
        const supply = Number(ticker[0].current_supply);
        const grossCost = this.bondingCurve.getBuyCost(supply, sharesToBuy);
        const { netAmount, burnAmount, dividendAmount } = (0, shared_1.applyIpoFees)(grossCost);
        return {
            ticker_id: tickerId,
            shares: sharesToBuy,
            direction: 'BUY',
            gross_cost: grossCost,
            burn_fee: burnAmount,
            dividend_fee: dividendAmount,
            net_cost: grossCost, // User pays full gross; fees come from the system side
            price_before: this.bondingCurve.getPrice(supply),
            price_after: this.bondingCurve.getPriceAfterBuy(supply, sharesToBuy),
            supply_before: supply,
            supply_after: supply + sharesToBuy,
        };
    }
    /**
     * Compute NYSE-style session % change: (current - price_open) / price_open * 100
     * price_open is the session-open price reset every 24h by the daily Cron.
     */
    calculateChangePct(openPrice, currentPrice) {
        if (!openPrice || openPrice === currentPrice)
            return 0;
        const pct = ((currentPrice - openPrice) / openPrice) * 100;
        return Number(pct.toFixed(2));
    }
    /**
     * ATOMIC BUY — The heart of the exchange.
     * Uses SELECT ... FOR UPDATE to prevent race conditions.
     */
    async executeBuy(userId, collegeDomain, tickerId, sharesToBuy) {
        if (sharesToBuy <= 0)
            throw new common_1.BadRequestException('Must buy at least 1 share');
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            // L5 Global Lockdown Check
            const isLockdown = await queryRunner.query(`SELECT value FROM settings WHERE key = 'GLOBAL_LOCKDOWN' FOR SHARE`);
            if (isLockdown.length && isLockdown[0].value === 'true') {
                throw new common_1.ForbiddenException('Market is in GLOBAL LOCKDOWN mode. All trading is suspended.');
            }
            // Step 1: Lock the ticker row
            const [ticker] = await queryRunner.query(`SELECT current_supply, scaling_constant, owner_id, status, price_open, college_domain, frozen_until 
         FROM tickers 
         WHERE ticker_id = $1 AND college_domain = $2
         FOR UPDATE`, [tickerId, collegeDomain]);
            if (!ticker)
                throw new common_1.NotFoundException(`Ticker ${tickerId} not found`);
            // L3 Circuit Breaker Check
            if (ticker.status === 'AUTO_FROZEN' || ticker.status === 'FROZEN') {
                const frozenUntil = ticker.frozen_until ? new Date(ticker.frozen_until).getTime() : 0;
                if (frozenUntil > Date.now()) {
                    throw new common_1.ForbiddenException(`Trading halted for security. Resumes at ${new Date(frozenUntil).toLocaleTimeString()}`);
                }
                // If time expired, we allow it (and status will be updated to ACTIVE in Step 4)
            }
            else if (ticker.status === 'DELISTED') {
                throw new common_1.ForbiddenException('Ticker is delisted and cannot be traded');
            }
            const supply = Number(ticker.current_supply);
            // Step 2: Calculate cost
            const grossCost = this.bondingCurve.getBuyCost(supply, sharesToBuy);
            const { burnAmount, dividendAmount } = (0, shared_1.applyIpoFees)(grossCost);
            // Step 3: Lock and check user balance
            const [user] = await queryRunner.query(`SELECT cred_balance FROM users WHERE user_id = $1 FOR UPDATE`, [userId]);
            if (!user)
                throw new common_1.NotFoundException('User not found');
            const balance = Number(user.cred_balance);
            if (balance < grossCost) {
                throw new common_1.BadRequestException(`Insufficient Creds: need ${grossCost.toFixed(4)}, have ${balance.toFixed(4)}`);
            }
            // Step 4: Update ticker supply
            await queryRunner.query(`UPDATE tickers 
         SET current_supply = current_supply + $1, 
             total_volume = total_volume + $2,
             total_trades = total_trades + 1,
             human_trades_1h = human_trades_1h + 1,
             status = 'ACTIVE', -- Auto-resume if it was frozen but time expired
             updated_at = NOW()
         WHERE ticker_id = $3`, [sharesToBuy, grossCost, tickerId]);
            // Step 5: Deduct Creds from buyer
            await queryRunner.query(`UPDATE users SET cred_balance = cred_balance - $1, updated_at = NOW() WHERE user_id = $2`, [grossCost, userId]);
            // Step 6: UPSERT holding
            await queryRunner.query(`INSERT INTO holdings (user_id, ticker_id, shares_held, avg_buy_price)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (user_id, ticker_id)
         DO UPDATE SET 
           shares_held = holdings.shares_held + $3,
           avg_buy_price = (
             (holdings.avg_buy_price * holdings.shares_held) + ($4 * $3)
           ) / (holdings.shares_held + $3),
           updated_at = NOW()`, [userId, tickerId, sharesToBuy, grossCost / sharesToBuy]);
            // Step 7: Insert transaction record
            const newSupply = supply + sharesToBuy;
            await queryRunner.query(`INSERT INTO transactions 
         (user_id, ticker_id, tx_type, shares_quantity, amount, 
          price_at_execution, supply_at_execution, 
          burn_amount, dividend_amount, currency)
         VALUES ($1, $2, 'BUY', $3, $4, $5, $6, $7, $8, 'CRED')`, [userId, tickerId, sharesToBuy, grossCost,
                this.bondingCurve.getPrice(supply), supply,
                burnAmount, dividendAmount]);
            // Step 8: Pay 5% dividend to creator
            await queryRunner.query(`UPDATE users 
         SET cred_balance = cred_balance + $1, 
             dividend_earned = dividend_earned + $1,
             updated_at = NOW()
         WHERE user_id = $2`, [dividendAmount, ticker.owner_id]);
            // Step 9: Burn 3% (update platform wallet)
            await queryRunner.query(`UPDATE platform_wallet 
         SET total_burned_creds = total_burned_creds + $1, updated_at = NOW()
         WHERE id = 1`, [burnAmount]);
            // COMMIT
            await queryRunner.commitTransaction();
            // STEP 10: Broadcast updates
            const finalPrice = this.bondingCurve.getPrice(newSupply);
            const changePct = this.calculateChangePct(Number(ticker.price_open), finalPrice);
            const [updatedTicker] = await this.dataSource.query(`SELECT total_volume FROM tickers WHERE ticker_id = $1`, [tickerId]);
            const newVolume = updatedTicker ? Number(updatedTicker.total_volume) : 0;
            this.realtimeGateway.broadcastPriceUpdate(ticker.college_domain, tickerId, finalPrice, newSupply, changePct, newVolume);
            this.realtimeGateway.broadcastPulse(ticker.college_domain, tickerId, 'BUY');
            // Step 11: In-app notification
            await this.notificationsService.createNotification(userId, 'TRADE_EXECUTED', `Successfully bought ${sharesToBuy} shares of $${tickerId} at ${finalPrice.toFixed(4)}`, 'TRADING', { tickerId, shares: sharesToBuy, price: finalPrice, type: 'BUY' });
            return {
                tx_type: 'BUY',
                ticker_id: tickerId,
                shares: sharesToBuy,
                total_cost: grossCost,
                burn_fee: burnAmount,
                dividend_paid: dividendAmount,
                new_price: this.bondingCurve.getPrice(newSupply),
                new_supply: newSupply,
                new_balance: balance - grossCost,
            };
        }
        catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        }
        finally {
            await queryRunner.release();
        }
    }
    /**
     * ATOMIC SELL — Mirror of executeBuy with reversed logic.
     */
    async executeSell(userId, collegeDomain, tickerId, sharesToSell) {
        if (sharesToSell <= 0)
            throw new common_1.BadRequestException('Must sell at least 1 share');
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            // L5 Global Lockdown Check
            const isLockdown = await queryRunner.query(`SELECT value FROM settings WHERE key = 'GLOBAL_LOCKDOWN' FOR SHARE`);
            if (isLockdown.length && isLockdown[0].value === 'true') {
                throw new common_1.ForbiddenException('Market is in GLOBAL LOCKDOWN mode. All trading is suspended.');
            }
            // Lock ticker
            const [ticker] = await queryRunner.query(`SELECT current_supply, owner_id, status, price_open, college_domain, frozen_until FROM tickers WHERE ticker_id = $1 AND college_domain = $2 FOR UPDATE`, [tickerId, collegeDomain]);
            if (!ticker)
                throw new common_1.NotFoundException(`Ticker ${tickerId} not found`);
            // L3 Circuit Breaker Check
            if (ticker.status === 'AUTO_FROZEN' || ticker.status === 'FROZEN') {
                const frozenUntil = ticker.frozen_until ? new Date(ticker.frozen_until).getTime() : 0;
                if (frozenUntil > Date.now()) {
                    throw new common_1.ForbiddenException(`Trading halted for security. Resumes at ${new Date(frozenUntil).toLocaleTimeString()}`);
                }
            }
            else if (ticker.status === 'DELISTED') {
                throw new common_1.ForbiddenException('Ticker is delisted and cannot be traded');
            }
            const supply = Number(ticker.current_supply);
            // Lock user's holding
            const [holding] = await queryRunner.query(`SELECT shares_held FROM holdings WHERE user_id = $1 AND ticker_id = $2 FOR UPDATE`, [userId, tickerId]);
            if (!holding || Number(holding.shares_held) < sharesToSell) {
                throw new common_1.BadRequestException('Insufficient shares to sell');
            }
            // Calculate sell value
            const grossValue = this.bondingCurve.getSellValue(supply, sharesToSell);
            const { burnAmount, dividendAmount } = (0, shared_1.applyIpoFees)(grossValue);
            const netValue = grossValue - burnAmount - dividendAmount;
            // Update ticker supply
            await queryRunner.query(`UPDATE tickers 
         SET current_supply = current_supply - $1, 
             total_volume = total_volume + $2,
             total_trades = total_trades + 1,
             human_trades_1h = human_trades_1h + 1,
             status = 'ACTIVE', -- Auto-resume
             updated_at = NOW()
         WHERE ticker_id = $3`, [sharesToSell, grossValue, tickerId]);
            // Credit Creds to seller (net of fees)
            await queryRunner.query(`UPDATE users SET cred_balance = cred_balance + $1, updated_at = NOW() WHERE user_id = $2`, [netValue, userId]);
            // Update holding
            const newSharesHeld = Number(holding.shares_held) - sharesToSell;
            if (newSharesHeld === 0) {
                await queryRunner.query(`DELETE FROM holdings WHERE user_id = $1 AND ticker_id = $2`, [userId, tickerId]);
            }
            else {
                await queryRunner.query(`UPDATE holdings SET shares_held = $1, updated_at = NOW() WHERE user_id = $2 AND ticker_id = $3`, [newSharesHeld, userId, tickerId]);
            }
            // Insert transaction
            const newSupply = supply - sharesToSell;
            await queryRunner.query(`INSERT INTO transactions 
         (user_id, ticker_id, tx_type, shares_quantity, amount, 
          price_at_execution, supply_at_execution, 
          burn_amount, dividend_amount, currency)
         VALUES ($1, $2, 'SELL', $3, $4, $5, $6, $7, $8, 'CRED')`, [userId, tickerId, sharesToSell, grossValue,
                this.bondingCurve.getPrice(supply), supply,
                burnAmount, dividendAmount]);
            // Pay dividend to creator
            await queryRunner.query(`UPDATE users 
         SET cred_balance = cred_balance + $1, 
             dividend_earned = dividend_earned + $1,
             updated_at = NOW()
         WHERE user_id = $2`, [dividendAmount, ticker.owner_id]);
            // Burn
            await queryRunner.query(`UPDATE platform_wallet 
         SET total_burned_creds = total_burned_creds + $1, updated_at = NOW()
         WHERE id = 1`, [burnAmount]);
            await queryRunner.commitTransaction();
            // STEP 10: Broadcast updates
            const finalPrice = this.bondingCurve.getPrice(newSupply);
            const changePct = this.calculateChangePct(Number(ticker.price_open), finalPrice);
            const [updatedTickerSell] = await this.dataSource.query(`SELECT total_volume FROM tickers WHERE ticker_id = $1`, [tickerId]);
            const newVolumeSell = updatedTickerSell ? Number(updatedTickerSell.total_volume) : 0;
            this.realtimeGateway.broadcastPriceUpdate(ticker.college_domain, tickerId, finalPrice, newSupply, changePct, newVolumeSell);
            this.realtimeGateway.broadcastPulse(ticker.college_domain, tickerId, 'SELL');
            // Step 11: In-app notification
            await this.notificationsService.createNotification(userId, 'TRADE_EXECUTED', `Successfully sold ${sharesToSell} shares of $${tickerId} at ${finalPrice.toFixed(4)}`, 'TRADING', { tickerId, shares: sharesToSell, price: finalPrice, type: 'SELL' });
            return {
                tx_type: 'SELL',
                ticker_id: tickerId,
                shares: sharesToSell,
                gross_value: grossValue,
                net_received: netValue,
                burn_fee: burnAmount,
                dividend_paid: dividendAmount,
                new_price: this.bondingCurve.getPrice(newSupply),
                new_supply: newSupply,
            };
        }
        catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        }
        finally {
            await queryRunner.release();
        }
    }
    /**
     * CRON JOB: Broadcast live price + accurate % change every minute.
     * % change = (currentPrice - lastTxPrice) / lastTxPrice * 100
     * Includes supply so frontend can recompute Global Market Cap.
     */
    async broadcastMarketUpdates() {
        // Fetch current supply AND the session open price for each active ticker
        const tickers = await this.dataSource.query(`SELECT t.ticker_id, t.current_supply, t.total_volume, t.price_open, t.college_domain
             FROM tickers t
             WHERE t.status = 'ACTIVE'`);
        if (!tickers.length)
            return;
        const domainMap = new Map();
        for (const t of tickers) {
            const supply = Number(t.current_supply);
            const currentPrice = this.bondingCurve.getPrice(supply);
            const openPrice = Number(t.price_open);
            // Session change: (current - open) / open
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
                await this.dataSource.query(`UPDATE tickers 
                     SET status = 'AUTO_FROZEN', 
                         frozen_until = NOW() + INTERVAL '24 hours',
                         updated_at = NOW() 
                     WHERE ticker_id = $1`, [t.ticker_id]);
                // Alert owner
                await this.notificationsService.createNotification(t.owner_id, 'TICKER_FROZEN', `Your ticker $${t.ticker_id} has been auto-frozen for 24h due to a critical price drop (>25%).`, 'SYSTEM');
            }
            const domain = t.college_domain || 'iift.edu';
            if (!domainMap.has(domain)) {
                domainMap.set(domain, []);
            }
            domainMap.get(domain).push(update);
        }
        for (const [domain, domainTickers] of domainMap.entries()) {
            this.realtimeGateway.broadcastTickerTape(domain, domainTickers);
        }
    }
};
exports.TradingService = TradingService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_MINUTE),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TradingService.prototype, "broadcastMarketUpdates", null);
exports.TradingService = TradingService = TradingService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(transaction_entity_1.TransactionEntity)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        bonding_curve_service_1.BondingCurveService,
        typeorm_2.DataSource,
        realtime_gateway_1.RealtimeGateway,
        notifications_service_1.NotificationsService])
], TradingService);
