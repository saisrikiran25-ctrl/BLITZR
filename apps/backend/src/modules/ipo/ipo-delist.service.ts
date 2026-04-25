import {
    Injectable,
    BadRequestException,
    NotFoundException,
    ForbiddenException,
    Logger,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { BondingCurveService } from './bonding-curve.service';
import {
    NUKE_COST_CHIPS,
    NUKE_FREEZE_DURATION_MS,
    SHOUTOUT_COST_CHIPS,
    GOLDEN_BORDER_COST_CREDS,
} from '@blitzr/shared';

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
@Injectable()
export class IpoDelistService {
    private readonly logger = new Logger(IpoDelistService.name);

    constructor(
        private readonly dataSource: DataSource,
        private readonly bondingCurve: BondingCurveService,
    ) { }

    /**
     * Delist a user's IPO (Panic Button).
     * Must be the ticker owner.
     */
    async delistIpo(userId: string) {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // Find the user's ticker
            const [ticker] = await queryRunner.query(
                `SELECT ticker_id, current_supply, owner_id, status
         FROM tickers WHERE owner_id = $1 AND status != 'DELISTED' FOR UPDATE`,
                [userId],
            );

            if (!ticker) throw new NotFoundException('No active IPO found for this user');
            if (ticker.owner_id !== userId) throw new ForbiddenException('Not the ticker owner');

            const supply = Number(ticker.current_supply);
            const currentPrice = this.bondingCurve.getPrice(supply);

            // Step 1: Freeze the ticker
            await queryRunner.query(
                `UPDATE tickers SET status = 'DELISTED', updated_at = NOW() WHERE ticker_id = $1`,
                [ticker.ticker_id],
            );

            // Step 2: Get all holders
            const holdings = await queryRunner.query(
                `SELECT user_id, shares_held FROM holdings WHERE ticker_id = $1 FOR UPDATE`,
                [ticker.ticker_id],
            );

            // Step 3: Refund each holder at current price
            let totalRefunded = 0;
            for (const holding of holdings) {
                const refund = Number(holding.shares_held) * currentPrice;
                totalRefunded += refund;

                await queryRunner.query(
                    `UPDATE users SET cred_balance = cred_balance + $1, updated_at = NOW() WHERE user_id = $2`,
                    [refund, holding.user_id],
                );

                // Record refund transaction
                await queryRunner.query(
                    `INSERT INTO transactions (user_id, ticker_id, tx_type, shares_quantity, amount, price_at_execution, supply_at_execution, currency)
           VALUES ($1, $2, 'TRANSFER', $3, $4, $5, $6, 'CRED')`,
                    [holding.user_id, ticker.ticker_id, holding.shares_held, refund, currentPrice, supply],
                );
            }

            // Step 4: Delete all holdings
            await queryRunner.query(
                `DELETE FROM holdings WHERE ticker_id = $1`,
                [ticker.ticker_id],
            );

            // Mark user as no longer IPO active
            await queryRunner.query(
                `UPDATE users SET is_ipo_active = false, updated_at = NOW() WHERE user_id = $1`,
                [userId],
            );

            await queryRunner.commitTransaction();

            this.logger.warn(
                `IPO DELISTED: ${ticker.ticker_id} by ${userId}. Refunded ${totalRefunded.toFixed(4)} Creds to ${holdings.length} holders.`,
            );

            return {
                ticker_id: ticker.ticker_id,
                status: 'DELISTED',
                holders_refunded: holdings.length,
                total_creds_refunded: totalRefunded,
                refund_price: currentPrice,
            };
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    /**
     * Nuke a prop market (freeze for 1 hour).
     * Costs 2,000 Chips. Per Blueprint §6.3.
     */
    async nukePropMarket(userId: string, collegeDomain: string, eventId: string) {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // Check user chip balance
            const [user] = await queryRunner.query(
                `SELECT chip_balance FROM users WHERE user_id = $1 FOR UPDATE`,
                [userId],
            );
            if (Number(user.chip_balance) < NUKE_COST_CHIPS) {
                throw new BadRequestException(`Insufficient Chips. Need ${NUKE_COST_CHIPS}`);
            }

            // Check event exists and is open
            const [event] = await queryRunner.query(
                `SELECT event_id, status FROM prop_events WHERE event_id = $1 AND college_domain = $2 FOR UPDATE`,
                [eventId, collegeDomain],
            );
            if (!event) throw new NotFoundException('Event not found');
            if (event.status !== 'OPEN') throw new ForbiddenException('Event is not open');

            // Deduct chips
            await queryRunner.query(
                `UPDATE users SET chip_balance = chip_balance - $1, updated_at = NOW() WHERE user_id = $2`,
                [NUKE_COST_CHIPS, userId],
            );

            // Freeze the event
            const frozenUntil = new Date(Date.now() + NUKE_FREEZE_DURATION_MS);
            await queryRunner.query(
                `UPDATE prop_events SET status = 'CLOSED', updated_at = NOW() WHERE event_id = $1`,
                [eventId],
            );

            // Burn the chips (platform wallet)
            await queryRunner.query(
                `UPDATE platform_wallet SET reserve_chips = reserve_chips + $1, updated_at = NOW() WHERE id = 1`,
                [NUKE_COST_CHIPS],
            );

            // Transaction record
            await queryRunner.query(
                `INSERT INTO transactions (user_id, prop_event_id, tx_type, amount, currency)
         VALUES ($1, $2, 'FEE', $3, 'CHIP')`,
                [userId, eventId, NUKE_COST_CHIPS],
            );

            await queryRunner.commitTransaction();

            return { event_id: eventId, nuked_by: userId, frozen_until: frozenUntil };
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    /**
     * Pin a rumor (Shoutout) for 10 minutes.
     * Costs 500 Chips. Per Blueprint §6.3.
     */
    async buyShoutout(userId: string, collegeDomain: string, rumorId: string) {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const [user] = await queryRunner.query(
                `SELECT chip_balance FROM users WHERE user_id = $1 FOR UPDATE`,
                [userId],
            );
            if (Number(user.chip_balance) < SHOUTOUT_COST_CHIPS) {
                throw new BadRequestException(`Insufficient Chips. Need ${SHOUTOUT_COST_CHIPS}`);
            }

            await queryRunner.query(
                `UPDATE users SET chip_balance = chip_balance - $1, updated_at = NOW() WHERE user_id = $2`,
                [SHOUTOUT_COST_CHIPS, userId],
            );

            // Ensure rumor exists and belongs to the user's domain
            const [rumor] = await queryRunner.query(
                `SELECT post_id FROM rumor_posts WHERE post_id = $1 AND college_domain = $2 FOR UPDATE`,
                [rumorId, collegeDomain],
            );
            if (!rumor) throw new NotFoundException('Rumor not found');

            const pinnedUntil = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
            await queryRunner.query(
                `UPDATE rumor_posts SET is_pinned = true, pinned_until = $1 WHERE post_id = $2`,
                [pinnedUntil, rumorId],
            );

            await queryRunner.query(
                `UPDATE platform_wallet SET reserve_chips = reserve_chips + $1, updated_at = NOW() WHERE id = 1`,
                [SHOUTOUT_COST_CHIPS],
            );

            await queryRunner.commitTransaction();

            return { post_id: rumorId, pinned_until: pinnedUntil };
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    /**
     * Buy Golden Border for ticker (1 week).
     * Costs 1,000 Creds. Per Blueprint §6.3.
     *
     * FIX-B: ticker query now uses FOR UPDATE inside the queryRunner transaction.
     * Previously the ticker was fetched without a lock, creating a TOCTOU window
     * where a concurrent delist could set status = 'DELISTED' between the ticker
     * SELECT and the Cred deduction, charging the user for a delisted ticker.
     */
    async buyGoldenBorder(userId: string) {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const [user] = await queryRunner.query(
                `SELECT cred_balance FROM users WHERE user_id = $1 FOR UPDATE`,
                [userId],
            );
            if (Number(user.cred_balance) < GOLDEN_BORDER_COST_CREDS) {
                throw new BadRequestException(`Insufficient Creds. Need ${GOLDEN_BORDER_COST_CREDS}`);
            }

            // FIX-B: Added FOR UPDATE to lock the ticker row and prevent TOCTOU with delistIpo().
            const [ticker] = await queryRunner.query(
                `SELECT ticker_id, status FROM tickers WHERE owner_id = $1 AND status = 'ACTIVE' FOR UPDATE`,
                [userId],
            );
            if (!ticker) throw new NotFoundException('No active IPO');

            await queryRunner.query(
                `UPDATE users SET cred_balance = cred_balance - $1, updated_at = NOW() WHERE user_id = $2`,
                [GOLDEN_BORDER_COST_CREDS, userId],
            );

            // Burn the creds
            await queryRunner.query(
                `UPDATE platform_wallet SET total_burned_creds = total_burned_creds + $1, updated_at = NOW() WHERE id = 1`,
                [GOLDEN_BORDER_COST_CREDS],
            );

            await queryRunner.commitTransaction();

            return { ticker_id: ticker.ticker_id, golden_border_until: new Date(Date.now() + 7 * 24 * 3600 * 1000) };
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }
}
