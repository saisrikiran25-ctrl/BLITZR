import {
    Injectable,
    BadRequestException,
    NotFoundException,
    ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { PropEventEntity } from './entities/prop-event.entity';
import { PropBetEntity } from './entities/prop-bet.entity';
import { applyPropFees, calculatePariMutuelPayout, PROP_PLATFORM_FEE_RATE } from '@blitzr/shared';
import { RealtimeGateway } from '../realtime/realtime.gateway';

@Injectable()
export class PropMarketService {
    constructor(
        @InjectRepository(PropEventEntity)
        private readonly eventRepo: Repository<PropEventEntity>,
        @InjectRepository(PropBetEntity)
        private readonly betRepo: Repository<PropBetEntity>,
        private readonly dataSource: DataSource,
        private readonly realtimeGateway: RealtimeGateway,
    ) { }

    /**
     * Create a new prop event.
     */
    async createEvent(
        creatorId: string,
        collegeDomain: string,
        title: string,
        description: string | undefined,
        category: string | undefined,
        expiryTimestamp: Date,
        refereeId?: string,
        listingFee: number = 0,
        initialLiquidity: number = 0,
    ) {
        const [creator] = await this.dataSource.query(
            `SELECT institution_id FROM users WHERE user_id = $1`,
            [creatorId],
        );
        const institutionId = creator?.institution_id ?? null;

        const totalCost = listingFee + (initialLiquidity * 2); // Liquidity must seed BOTH sides 50/50

        // Deduct listing fee + initial liquidity if user-created
        if (totalCost > 0) {
            const [user] = await this.dataSource.query(
                `SELECT chip_balance FROM users WHERE user_id = $1`,
                [creatorId],
            );
            if (Number(user.chip_balance) < totalCost) {
                throw new BadRequestException('Insufficient Chips for listing and initial liquidity');
            }
            await this.dataSource.query(
                `UPDATE users SET chip_balance = chip_balance - $1 WHERE user_id = $2`,
                [totalCost, creatorId],
            );
        }

        const event = this.eventRepo.create({
            creator_id: creatorId,
            title,
            description,
            category,
            expiry_timestamp: expiryTimestamp,
            referee_id: refereeId,
            listing_fee_paid: listingFee,
            yes_pool: initialLiquidity,
            no_pool: initialLiquidity,
            college_domain: collegeDomain,
            scope: 'LOCAL',
            institution_id: institutionId,
            options: ['YES', 'NO'],
        });

        return this.eventRepo.save(event);
    }

    /**
     * Place a bet on a prop event (pari-mutuel).
     * Uses SELECT ... FOR UPDATE to prevent pool race conditions.
     */
    async placeBet(userId: string, collegeDomain: string, eventId: string, outcome: 'YES' | 'NO', chipAmount: number) {
        if (chipAmount <= 0) throw new BadRequestException('Bet must be positive');

        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const [userInstitution] = await queryRunner.query(
                `SELECT institution_id FROM users WHERE user_id = $1`,
                [userId],
            );
            const institutionId = userInstitution?.institution_id ?? null;

            // Lock the event
            const [event] = await queryRunner.query(
                `SELECT event_id, status, yes_pool, no_pool, platform_fee_rate, creator_id 
                 FROM prop_events
                 WHERE event_id = $1 AND (institution_id = $2 OR institution_id IS NULL)
                 FOR UPDATE`,
                [eventId, institutionId],
            );

            if (!event) throw new NotFoundException('Event not found');
            if (event.status !== 'OPEN') throw new ForbiddenException('Event is not open for betting');
            if (event.creator_id === userId) throw new ForbiddenException('Creators cannot bet on their own events');

            // Lock user balance
            const [user] = await queryRunner.query(
                `SELECT chip_balance FROM users WHERE user_id = $1 FOR UPDATE`,
                [userId],
            );

            if (Number(user.chip_balance) < chipAmount) {
                throw new BadRequestException('Insufficient Chips');
            }

            // Apply platform fee
            const { netBetAmount, platformFee } = applyPropFees(chipAmount);

            // Deduct chips
            await queryRunner.query(
                `UPDATE users SET chip_balance = chip_balance - $1 WHERE user_id = $2`,
                [chipAmount, userId],
            );

            // Update pool
            const poolColumn = outcome === 'YES' ? 'yes_pool' : 'no_pool';
            await queryRunner.query(
                `UPDATE prop_events SET ${poolColumn} = ${poolColumn} + $1, updated_at = NOW() WHERE event_id = $2`,
                [netBetAmount, eventId],
            );

            // Record platform fee
            await queryRunner.query(
                `UPDATE platform_wallet SET reserve_chips = reserve_chips + $1, updated_at = NOW() WHERE id = 1`,
                [platformFee],
            );

            // Create bet record
            await queryRunner.query(
                `INSERT INTO prop_bets (event_id, user_id, outcome_choice, chip_amount) VALUES ($1, $2, $3, $4)`,
                [eventId, userId, outcome, chipAmount],
            );

            // Transaction record
            await queryRunner.query(
                `INSERT INTO transactions (user_id, prop_event_id, tx_type, amount, platform_fee_amount, currency)
         VALUES ($1, $2, 'BET', $3, $4, 'CHIP')`,
                [userId, eventId, chipAmount, platformFee],
            );

            await queryRunner.commitTransaction();

            // STEP 10: Broadcast updates
            const [updatedEvent] = await this.dataSource.query(
                `SELECT yes_pool, no_pool, college_domain FROM prop_events WHERE event_id = $1`,
                [eventId],
            );
            this.realtimeGateway.broadcastPropUpdate(updatedEvent.college_domain, eventId, Number(updatedEvent.yes_pool), Number(updatedEvent.no_pool));

            return { event_id: eventId, outcome, chip_amount: chipAmount, platform_fee: platformFee };
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    /**
     * Settle a prop event (pari-mutuel payout).
     * Only the creator or referee can settle.
     */
    async settleEvent(settledBy: string, collegeDomain: string, eventId: string, winningOutcome: 'YES' | 'NO') {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const [userInstitution] = await queryRunner.query(
                `SELECT institution_id FROM users WHERE user_id = $1`,
                [settledBy],
            );
            const institutionId = userInstitution?.institution_id ?? null;

            const [event] = await queryRunner.query(
                `SELECT * FROM prop_events
                 WHERE event_id = $1 AND (institution_id = $2 OR institution_id IS NULL)
                 FOR UPDATE`,
                [eventId, institutionId],
            );

            if (!event) throw new NotFoundException('Event not found');
            if (event.status !== 'OPEN' && event.status !== 'CLOSED') {
                throw new ForbiddenException('Event is already settled');
            }
            if (event.creator_id !== settledBy && event.referee_id !== settledBy) {
                throw new ForbiddenException('Only creator or referee can settle');
            }

            const totalPool = Number(event.yes_pool) + Number(event.no_pool);
            const winningSidePool = winningOutcome === 'YES'
                ? Number(event.yes_pool)
                : Number(event.no_pool);

            // Get all bets on the winning side
            const winningBets = await queryRunner.query(
                `SELECT bet_id, user_id, chip_amount FROM prop_bets 
         WHERE event_id = $1 AND outcome_choice = $2 AND is_settled = false`,
                [eventId, winningOutcome],
            );

            // Calculate and distribute payouts
            for (const bet of winningBets) {
                const { netBetAmount } = applyPropFees(Number(bet.chip_amount));
                const payout = calculatePariMutuelPayout(
                    totalPool,
                    0, // Fee already deducted at bet time
                    netBetAmount, // Use net pool contribution for accurate share calculation
                    winningSidePool,
                );

                await queryRunner.query(
                    `UPDATE users SET chip_balance = chip_balance + $1 WHERE user_id = $2`,
                    [payout, bet.user_id],
                );

                await queryRunner.query(
                    `UPDATE prop_bets SET payout_amount = $1, is_settled = true WHERE bet_id = $2`,
                    [payout, bet.bet_id],
                );
            }

            // Mark losing bets as settled (no payout)
            await queryRunner.query(
                `UPDATE prop_bets SET is_settled = true, payout_amount = 0 
         WHERE event_id = $1 AND outcome_choice != $2`,
                [eventId, winningOutcome],
            );

            // Update event status
            await queryRunner.query(
                `UPDATE prop_events 
         SET status = 'SETTLED', winning_outcome = $1, settled_at = NOW(), updated_at = NOW()
         WHERE event_id = $2`,
                [winningOutcome, eventId],
            );

            await queryRunner.commitTransaction();

            return {
                event_id: eventId,
                winning_outcome: winningOutcome,
                total_pool: totalPool,
                winners_paid: winningBets.length,
            };
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    /**
     * Get active prop events with live odds.
     */
    async getActiveEvents(userId: string, scope: 'LOCAL' | 'REGIONAL' | 'NATIONAL' | 'ALL' = 'LOCAL') {
        let events: PropEventEntity[];

        const [user] = await this.dataSource.query(
            `SELECT institution_id FROM users WHERE user_id = $1`,
            [userId],
        );
        const institutionId = user?.institution_id ?? null;

        return this.getActiveEventsForInstitution(institutionId, scope);
    }

    async getActiveEventsForInstitution(
        institutionId: string | null,
        scope: 'LOCAL' | 'REGIONAL' | 'NATIONAL' | 'ALL' = 'LOCAL',
    ) {
        let events: PropEventEntity[];

        if (scope === 'LOCAL') {
            events = await this.dataSource.query(
                `SELECT * FROM prop_events
                 WHERE status = 'OPEN' AND institution_id = $1
                 ORDER BY expiry_timestamp ASC`,
                [institutionId],
            );
        } else if (scope === 'NATIONAL') {
            events = await this.dataSource.query(
                `SELECT * FROM prop_events
                 WHERE status = 'OPEN' AND institution_id IS NULL
                 ORDER BY expiry_timestamp ASC`,
            );
        } else if (scope === 'REGIONAL') {
            events = await this.dataSource.query(
                `SELECT * FROM prop_events
                 WHERE status = 'OPEN' AND scope = 'REGIONAL'
                 ORDER BY expiry_timestamp ASC`,
            );
        } else {
            events = await this.dataSource.query(
                `SELECT * FROM prop_events
                 WHERE status = 'OPEN' AND (institution_id = $1 OR institution_id IS NULL)
                 ORDER BY expiry_timestamp ASC`,
                [institutionId],
            );
        }

        return events.map((e) => {
            const totalPool = Number(e.yes_pool) + Number(e.no_pool);
            return {
                ...e,
                total_pool: totalPool,
                yes_odds: totalPool > 0 && Number(e.yes_pool) > 0
                    ? totalPool / Number(e.yes_pool)
                    : 0,
                no_odds: totalPool > 0 && Number(e.no_pool) > 0
                    ? totalPool / Number(e.no_pool)
                    : 0,
                time_remaining_ms: new Date(e.expiry_timestamp).getTime() - Date.now(),
            };
        });
    }

    /**
     * B4: Admin create a national/regional prop market.
     * scope is enforced server-side — isAdmin must be validated by caller.
     */
    async createAdminMarket(
        creatorId: string,
        isAdmin: boolean,
        title: string,
        description: string | undefined,
        category: string | undefined,
        expiryTimestamp: Date,
        scope: 'LOCAL' | 'REGIONAL' | 'NATIONAL',
        institutionId: string | undefined,
        options: string[] | undefined,
        featured: boolean = false,
    ) {
        // Enforce scope server-side — never trust frontend
        const resolvedScope = isAdmin ? scope : 'LOCAL';
        const resolvedInstitutionId = resolvedScope === 'NATIONAL' ? null : institutionId;

        const event = this.eventRepo.create({
            creator_id: creatorId,
            title,
            description,
            category,
            expiry_timestamp: expiryTimestamp,
            scope: resolvedScope as any,
            institution_id: resolvedInstitutionId,
            featured,
            yes_pool: 0,
            no_pool: 0,
            options: options ?? ['YES', 'NO'],
        } as any);

        return this.eventRepo.save(event);
    }
}
