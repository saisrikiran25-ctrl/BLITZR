import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { UserEntity } from './entities/user.entity';
import * as crypto from 'crypto';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(UserEntity)
        private readonly userRepository: Repository<UserEntity>,
        private readonly dataSource: DataSource,
    ) { }

    async findById(userId: string): Promise<UserEntity | null> {
        return this.userRepository.findOne({ where: { user_id: userId } });
    }

    async findOneById(userId: string): Promise<UserEntity> {
        const user = await this.findById(userId);
        if (!user) throw new NotFoundException('User not found');
        return user;
    }

    async findByEmail(email: string): Promise<UserEntity | null> {
        return this.userRepository.findOne({ where: { email } });
    }

    async findByUsername(username: string): Promise<UserEntity | null> {
        return this.userRepository.findOne({ where: { username } });
    }

    async isUsernameTaken(username: string, institutionId: string): Promise<boolean> {
        const user = await this.userRepository.findOne({
            where: { username, institution_id: institutionId }
        });
        return !!user;
    }

    async create(data: Partial<UserEntity>): Promise<UserEntity> {
        // NUCLEAR FIX: Manually generate user_id if not present to prevent
        // 'undefined' property access after save in high-latency DB environments.
        const user = this.userRepository.create({
            ...data,
            user_id: data.user_id || crypto.randomUUID(),
        });
        return this.userRepository.save(user);
    }


    async update(userId: string, data: Partial<UserEntity>): Promise<UserEntity> {
        const user = await this.findOneById(userId);
        Object.assign(user, data);
        return this.userRepository.save(user);
    }

    async deleteUser(userId: string): Promise<void> {
        // Safe Delete (Ghosting) across modules to preserve Foreign Key strict constraints
        // on heavily ledgered rows like tickers, rumors, and prop events natively.
        await this.dataSource.transaction(async (manager) => {
            // 1. Fully Destroy Personal Ledger Actions (These can be cleanly deleted)
            await manager.query(`DELETE FROM transactions WHERE user_id = $1`, [userId]);
            await manager.query(`DELETE FROM holdings WHERE user_id = $1`, [userId]);
            await manager.query(`DELETE FROM prop_bets WHERE user_id = $1`, [userId]);
            await manager.query(`DELETE FROM notifications WHERE user_id = $1`, [userId]);
            await manager.query(`DELETE FROM rumor_votes WHERE user_id = $1`, [userId]);
            await manager.query(`DELETE FROM currency_exchanges WHERE user_id = $1`, [userId]);

            // 2. Erase Waitlist Registry securely securely securely
            const user = await manager.findOne(UserEntity, { where: { user_id: userId } });
            if (user && user.email) {
                await manager.query(`DELETE FROM waitlist WHERE email = $1`, [user.email]);
            }

            // 3. Ghost their actual core Identity safely.
            // We overwrite their identity markers natively to guarantee complete data wipe 
            // while preserving the integer referential constraint integrity across tickers.
            const generateGhostId = () => crypto.randomUUID().split('-')[0];
            
            await manager.update(UserEntity, userId, {
                email: `deleted_${generateGhostId()}@purged.invalid`,
                username: `anonymous_${generateGhostId()}`,
                password_hash: '',
                display_name: 'Deleted User',
                cred_balance: 0,
                chip_balance: 0,
                credibility_score: 0,
                avatar_url: '',
                tos_accepted: false,
                role: 'USER',
            });
            
            // NOTE: Tickers, Prop Events, and Rumors authored by this User strictly retain 
            // the user_id as creator/owner strictly to mathematically enforce the schema. 
            // The display layer efficiently fetches "Deleted User" via relation securely.
        });
    }
}
