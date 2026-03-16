import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { RumorEntity } from './entities/rumor.entity';
import { RumorVoteEntity, VoteType } from './entities/rumor-vote.entity';
import * as crypto from 'crypto';

@Injectable()
export class RumorFeedService {
    constructor(
        @InjectRepository(RumorEntity)
        private readonly rumorRepo: Repository<RumorEntity>,
        @InjectRepository(RumorVoteEntity)
        private readonly voteRepo: Repository<RumorVoteEntity>,
        private readonly dataSource: DataSource,
    ) { }

    /**
     * Create a new anonymous rumor.
     */
    async createRumor(authorId: string, collegeDomain: string, content: string) {
        const ghostId = this.generateGhostId();
        const taggedTickers = this.parseTickerTags(content);

        const rumor = this.rumorRepo.create({
            author_id: authorId,
            ghost_id: ghostId,
            content,
            tagged_tickers: taggedTickers,
            college_domain: collegeDomain,
        });

        return this.rumorRepo.save(rumor);
    }

    /**
     * Get the rumor feed (newest first).
     */
    async getFeed(collegeDomain: string, page: number = 1, limit: number = 20) {
        return this.rumorRepo.find({
            where: { status: 'VISIBLE' as any, college_domain: collegeDomain },
            order: { created_at: 'DESC' },
            skip: (page - 1) * limit,
            take: limit,
        });
    }

    /**
     * Upvote a rumor.
     */
    async upvote(userId: string, collegeDomain: string, rumorId: string) {
        return this.handleVote(userId, collegeDomain, rumorId, VoteType.UP);
    }

    /**
     * Downvote a rumor.
     */
    async downvote(userId: string, collegeDomain: string, rumorId: string) {
        return this.handleVote(userId, collegeDomain, rumorId, VoteType.DOWN);
    }

    /**
     * Core atomic voting ledger logic.
     * Enforces single-vote rule & handles vote-swapping.
     */
    private async handleVote(userId: string, collegeDomain: string, rumorId: string, type: VoteType) {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // Lock the rumor row to prevent race conditions during vote count updates
            const rumor = await queryRunner.manager.findOne(RumorEntity, {
                where: { rumor_id: rumorId, college_domain: collegeDomain },
                lock: { mode: 'pessimistic_write' },
            });

            if (!rumor) {
                throw new NotFoundException('Rumor not found');
            }

            // Check for existing vote in ledger
            let existingVote = await queryRunner.manager.findOne(RumorVoteEntity, {
                where: { user_id: userId, rumor_id: rumorId },
                lock: { mode: 'pessimistic_write' },
            });

            if (existingVote) {
                // If voting the exact same way again, do nothing (idempotent)
                if (existingVote.vote_type === type) {
                    await queryRunner.rollbackTransaction();
                    return rumor;
                }

                // If vote swapping (UP -> DOWN or DOWN -> UP)
                if (type === VoteType.UP) {
                    rumor.upvotes += 1;
                    rumor.downvotes = Math.max(0, rumor.downvotes - 1);
                } else {
                    rumor.downvotes += 1;
                    rumor.upvotes = Math.max(0, rumor.upvotes - 1);
                }

                existingVote.vote_type = type;
                await queryRunner.manager.save(existingVote);
            } else {
                // Brand new vote
                if (type === VoteType.UP) {
                    rumor.upvotes += 1;
                } else {
                    rumor.downvotes += 1;
                }

                const newVote = this.voteRepo.create({
                    user_id: userId,
                    rumor_id: rumorId,
                    vote_type: type,
                });
                await queryRunner.manager.save(newVote);
            }

            // Save the updated mathematical counters
            const updatedRumor = await queryRunner.manager.save(rumor);
            await queryRunner.commitTransaction();

            return updatedRumor;
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    private parseTickerTags(content: string): string[] {
        const regex = /\$[A-Z_]{1,20}/g;
        const matches = content.match(regex);
        return matches ? [...new Set(matches)] : [];
    }

    private generateGhostId(): string {
        return `ghost_${crypto.randomBytes(4).toString('hex')}`;
    }
}

