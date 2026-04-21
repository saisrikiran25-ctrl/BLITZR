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
var IpoDelistService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.IpoDelistService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("typeorm");
const bonding_curve_service_1 = require("./bonding-curve.service");
const shared_1 = require("@blitzr/shared");
/**
 * IPO Delist Service — The "Panic Button" (PRD §7.1)
 *
 * When a student feels targeted, they can delist their IPO.
 * Sequence:
 * 1. Freeze the ticker (status = 'FROZEN')
 * 2. Iterate all holdings for that ticker
 * 3. Refund each holder: current_price × shares_held
 * 4. Soft-delete the ticker
 */
let IpoDelistService = IpoDelistService_1 = class IpoDelistService {
    constructor(dataSource, bondingCurve) {
        this.dataSource = dataSource;
        this.bondingCurve = bondingCurve;
        this.logger = new common_1.Logger(IpoDelistService_1.name);
    }
    /**
     * Delist a user's IPO (Panic Button).
     * Must be the ticker owner.
     */
    async delistIpo(userId) {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            // Find the user's ticker
            const [ticker] = await queryRunner.query(`SELECT ticker_id, current_supply, owner_id, status 
         FROM tickers WHERE owner_id = $1 AND status != 'DELISTED' FOR UPDATE`, [userId]);
            if (!ticker)
                throw new common_1.NotFoundException('No active IPO found for this user');
            if (ticker.owner_id !== userId)
                throw new common_1.ForbiddenException('Not the ticker owner');
            const supply = Number(ticker.current_supply);
            const currentPrice = this.bondingCurve.getPrice(supply);
            // Step 1: Freeze the ticker
            await queryRunner.query(`UPDATE tickers SET status = 'DELISTED', updated_at = NOW() WHERE ticker_id = $1`, [ticker.ticker_id]);
            // Step 2: Get all holders
            const holdings = await queryRunner.query(`SELECT user_id, shares_held FROM holdings WHERE ticker_id = $1 FOR UPDATE`, [ticker.ticker_id]);
            // Step 3: Refund each holder at current price
            let totalRefunded = 0;
            for (const holding of holdings) {
                const refund = Number(holding.shares_held) * currentPrice;
                totalRefunded += refund;
                await queryRunner.query(`UPDATE users SET cred_balance = cred_balance + $1, updated_at = NOW() WHERE user_id = $2`, [refund, holding.user_id]);
                // Record refund transaction
                await queryRunner.query(`INSERT INTO transactions (user_id, ticker_id, tx_type, shares_quantity, amount, price_at_execution, supply_at_execution, currency)
           VALUES ($1, $2, 'TRANSFER', $3, $4, $5, $6, 'CRED')`, [holding.user_id, ticker.ticker_id, holding.shares_held, refund, currentPrice, supply]);
            }
            // Step 4: Delete all holdings
            await queryRunner.query(`DELETE FROM holdings WHERE ticker_id = $1`, [ticker.ticker_id]);
            // Mark user as no longer IPO active
            await queryRunner.query(`UPDATE users SET is_ipo_active = false, updated_at = NOW() WHERE user_id = $1`, [userId]);
            await queryRunner.commitTransaction();
            this.logger.warn(`IPO DELISTED: ${ticker.ticker_id} by ${userId}. Refunded ${totalRefunded.toFixed(4)} Creds to ${holdings.length} holders.`);
            return {
                ticker_id: ticker.ticker_id,
                status: 'DELISTED',
                holders_refunded: holdings.length,
                total_creds_refunded: totalRefunded,
                refund_price: currentPrice,
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
     * Nuke a prop market (freeze for 1 hour).
     * Costs 2,000 Chips. Per Blueprint §6.3.
     */
    async nukePropMarket(userId, collegeDomain, eventId) {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            // Check user chip balance
            const [user] = await queryRunner.query(`SELECT chip_balance FROM users WHERE user_id = $1 FOR UPDATE`, [userId]);
            if (Number(user.chip_balance) < shared_1.NUKE_COST_CHIPS) {
                throw new common_1.BadRequestException(`Insufficient Chips. Need ${shared_1.NUKE_COST_CHIPS}`);
            }
            // Check event exists and is open
            const [event] = await queryRunner.query(`SELECT event_id, status FROM prop_events WHERE event_id = $1 AND college_domain = $2 FOR UPDATE`, [eventId, collegeDomain]);
            if (!event)
                throw new common_1.NotFoundException('Event not found');
            if (event.status !== 'OPEN')
                throw new common_1.ForbiddenException('Event is not open');
            // Deduct chips
            await queryRunner.query(`UPDATE users SET chip_balance = chip_balance - $1, updated_at = NOW() WHERE user_id = $2`, [shared_1.NUKE_COST_CHIPS, userId]);
            // Freeze the event
            const frozenUntil = new Date(Date.now() + shared_1.NUKE_FREEZE_DURATION_MS);
            await queryRunner.query(`UPDATE prop_events SET status = 'CLOSED', updated_at = NOW() WHERE event_id = $1`, [eventId]);
            // Burn the chips (platform wallet)
            await queryRunner.query(`UPDATE platform_wallet SET reserve_chips = reserve_chips + $1, updated_at = NOW() WHERE id = 1`, [shared_1.NUKE_COST_CHIPS]);
            // Transaction record
            await queryRunner.query(`INSERT INTO transactions (user_id, prop_event_id, tx_type, amount, currency)
         VALUES ($1, $2, 'FEE', $3, 'CHIP')`, [userId, eventId, shared_1.NUKE_COST_CHIPS]);
            await queryRunner.commitTransaction();
            return { event_id: eventId, nuked_by: userId, frozen_until: frozenUntil };
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
     * Pin a rumor (Shoutout) for 10 minutes.
     * Costs 500 Chips. Per Blueprint §6.3.
     */
    async buyShoutout(userId, collegeDomain, rumorId) {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            const [user] = await queryRunner.query(`SELECT chip_balance FROM users WHERE user_id = $1 FOR UPDATE`, [userId]);
            if (Number(user.chip_balance) < shared_1.SHOUTOUT_COST_CHIPS) {
                throw new common_1.BadRequestException(`Insufficient Chips. Need ${shared_1.SHOUTOUT_COST_CHIPS}`);
            }
            await queryRunner.query(`UPDATE users SET chip_balance = chip_balance - $1, updated_at = NOW() WHERE user_id = $2`, [shared_1.SHOUTOUT_COST_CHIPS, userId]);
            // Ensure rumor exists and belongs to the user's domain
            const [rumor] = await queryRunner.query(`SELECT post_id FROM rumor_posts WHERE post_id = $1 AND college_domain = $2 FOR UPDATE`, [rumorId, collegeDomain]);
            if (!rumor)
                throw new common_1.NotFoundException('Rumor not found');
            const pinnedUntil = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
            await queryRunner.query(`UPDATE rumor_posts SET is_pinned = true, pinned_until = $1 WHERE post_id = $2`, [pinnedUntil, rumorId]);
            await queryRunner.query(`UPDATE platform_wallet SET reserve_chips = reserve_chips + $1, updated_at = NOW() WHERE id = 1`, [shared_1.SHOUTOUT_COST_CHIPS]);
            await queryRunner.commitTransaction();
            return { post_id: rumorId, pinned_until: pinnedUntil };
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
     * Buy Golden Border for ticker (1 week).
     * Costs 1,000 Creds. Per Blueprint §6.3.
     */
    async buyGoldenBorder(userId) {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            const [user] = await queryRunner.query(`SELECT cred_balance FROM users WHERE user_id = $1 FOR UPDATE`, [userId]);
            if (Number(user.cred_balance) < shared_1.GOLDEN_BORDER_COST_CREDS) {
                throw new common_1.BadRequestException(`Insufficient Creds. Need ${shared_1.GOLDEN_BORDER_COST_CREDS}`);
            }
            const [ticker] = await queryRunner.query(`SELECT ticker_id FROM tickers WHERE owner_id = $1 AND status = 'ACTIVE'`, [userId]);
            if (!ticker)
                throw new common_1.NotFoundException('No active IPO');
            await queryRunner.query(`UPDATE users SET cred_balance = cred_balance - $1, updated_at = NOW() WHERE user_id = $2`, [shared_1.GOLDEN_BORDER_COST_CREDS, userId]);
            // Burn the creds
            await queryRunner.query(`UPDATE platform_wallet SET total_burned_creds = total_burned_creds + $1, updated_at = NOW() WHERE id = 1`, [shared_1.GOLDEN_BORDER_COST_CREDS]);
            await queryRunner.commitTransaction();
            return { ticker_id: ticker.ticker_id, golden_border_until: new Date(Date.now() + 7 * 24 * 3600 * 1000) };
        }
        catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        }
        finally {
            await queryRunner.release();
        }
    }
};
exports.IpoDelistService = IpoDelistService;
exports.IpoDelistService = IpoDelistService = IpoDelistService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeorm_1.DataSource,
        bonding_curve_service_1.BondingCurveService])
], IpoDelistService);
