import { Injectable, BadRequestException } from '@nestjs/common';
import { DataSource } from 'typeorm';

// Exchange Constants
const CRED_TO_CHIP_RATIO = 2.0;
const CHIP_TO_CRED_RATIO = 0.5;
const CURRENCY_CRED = 'CRED';
const CURRENCY_CHIP = 'CHIP';

function roundCreds(amount: number): number {
    return Math.round(amount * 100) / 100;
}

/**
 * WalletService
 * Handles dual-currency exchange: 1 Cred ↔ 2 Chips
 */
@Injectable()
export class WalletService {
    constructor(private readonly dataSource: DataSource) { }

    /**
     * Exchange Creds to Chips.
     * 1 Cred = 2 Chips
     */
    async credsToChips(userId: string, credAmount: number) {
        if (credAmount <= 0) throw new BadRequestException('Amount must be positive');

        const chipAmount = credAmount * CRED_TO_CHIP_RATIO;

        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const [user] = await queryRunner.query(
                `SELECT cred_balance, chip_balance FROM users WHERE user_id = $1 FOR UPDATE`,
                [userId],
            );

            if (Number(user.cred_balance) < credAmount) {
                throw new BadRequestException('Insufficient Creds');
            }

            await queryRunner.query(
                `UPDATE users 
         SET cred_balance = cred_balance - $1, chip_balance = chip_balance + $2, updated_at = NOW() 
         WHERE user_id = $3`,
                [credAmount, chipAmount, userId],
            );

            await queryRunner.query(
                `INSERT INTO currency_exchanges (user_id, from_currency, to_currency, from_amount, to_amount)
         VALUES ($1, $2, $3, $4, $5)`,
                [userId, CURRENCY_CRED, CURRENCY_CHIP, credAmount, chipAmount],
            );

            const newCreds = Number(user.cred_balance) - credAmount;
            const newChips = Number(user.chip_balance) + chipAmount;

            await queryRunner.commitTransaction();

            return {
                message: 'Exchange successful',
                balances: {
                    cred_balance: newCreds.toString(),
                    chip_balance: newChips.toString()
                }
            };
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    /**
     * Exchange Chips to Creds.
     * 2 Chips = 1 Cred
     */
    async chipsToCreds(userId: string, chipAmount: number) {
        if (chipAmount <= 0) throw new BadRequestException('Amount must be positive');

        const credAmount = roundCreds(chipAmount * CHIP_TO_CRED_RATIO);

        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const [user] = await queryRunner.query(
                `SELECT cred_balance, chip_balance FROM users WHERE user_id = $1 FOR UPDATE`,
                [userId],
            );

            if (Number(user.chip_balance) < chipAmount) {
                throw new BadRequestException('Insufficient Chips');
            }

            await queryRunner.query(
                `UPDATE users 
         SET chip_balance = chip_balance - $1, cred_balance = cred_balance + $2, updated_at = NOW() 
         WHERE user_id = $3`,
                [chipAmount, credAmount, userId],
            );

            await queryRunner.query(
                `INSERT INTO currency_exchanges (user_id, from_currency, to_currency, from_amount, to_amount)
         VALUES ($1, $2, $3, $4, $5)`,
                [userId, CURRENCY_CHIP, CURRENCY_CRED, chipAmount, credAmount],
            );

            const newChips = Number(user.chip_balance) - chipAmount;
            const newCreds = Number(user.cred_balance) + credAmount;

            await queryRunner.commitTransaction();

            return {
                message: 'Exchange successful',
                balances: {
                    cred_balance: newCreds.toString(),
                    chip_balance: newChips.toString()
                }
            };
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }
}
