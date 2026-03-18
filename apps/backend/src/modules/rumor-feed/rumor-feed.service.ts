import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { RumorEntity } from './entities/rumor.entity';
import { RumorVoteEntity, VoteType } from './entities/rumor-vote.entity';
import { ClassifierService } from './classifier.service';
import * as crypto from 'crypto';

@Injectable()
export class RumorFeedService {
    constructor(
        @InjectRepository(RumorEntity)
        private readonly rumorRepo: Repository<RumorEntity>,
        @InjectRepository(RumorVoteEntity)
        private readonly voteRepo: Repository<RumorVoteEntity>,
        private readonly dataSource: DataSource,
        private readonly classifierService: ClassifierService,
    ) { }

    /**
     * Create a new anonymous rumor.
     */
    async createRumor(authorId: string, collegeDomain: string, content: string) {
        const ghostId = this.generateGhostId();
        const taggedTickers = this.parseTickerTags(content);
        
        const price_snapshot: Record<string, number> = {};
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        
        try {
            if (taggedTickers.length > 0) {
                for (const tickerTag of taggedTickers) {
                    const tickerId = tickerTag.replace('$', '');
                    const ticker = await queryRunner.manager.query(
                        `SELECT current_supply, scaling_constant FROM tickers WHERE ticker_id = $1`,
                        [tickerId]
                    );
                    
                    if (ticker && ticker.length > 0) {
                        const t = ticker[0];
                        const k = Number(t.scaling_constant);
                        const supply = Number(t.current_supply);
                        const currentPrice = k * Math.log(supply + 1);
                        price_snapshot[tickerId] = currentPrice;
                    }
                }
            }

            // SECURITY GATE: Classify post
            const classification = await this.classifierService.classify(content);
            
            // Fetch user credibility
            const userRes = await queryRunner.manager.query(
                `SELECT credibility_score FROM users WHERE user_id = $1`,
                [authorId]
            );
            const credScore = userRes[0]?.credibility_score || 0;

            // Enforce Credibility Gate
            if (classification.post_type === 'FACTUAL_CLAIM' && credScore < 50) {
                throw new BadRequestException('Your Credibility Score is too low to post factual claims. Participate in the Arena to raise it.');
            }

            let visibility = 'PUBLIC';
            let status = 'VISIBLE';
            
            // Route to moderation if risk is very high and it's a factual claim
            if (classification.post_type === 'FACTUAL_CLAIM' && classification.risk_score >= 0.7) {
                visibility = 'PENDING';
                status = 'HIDDEN'; // Hide from feed until approved
            }

            const rumor = this.rumorRepo.create({
                author_id: authorId,
                ghost_id: ghostId,
                content,
                tagged_tickers: taggedTickers.map(t => t.replace('$', '')),
                college_domain: collegeDomain,
                price_snapshot: price_snapshot,
                post_type: classification.post_type,
                risk_score: classification.risk_score,
                visibility: visibility as any,
                status: status as any,
            });

            const savedRumor = await queryRunner.manager.save(rumor);

            // Log to moderation queue if pending
            if (visibility === 'PENDING') {
                await queryRunner.manager.query(
                    `INSERT INTO moderation_queue (item_id, item_type, reason, reporter_id) VALUES ($1, $2, $3, $4)`,
                    [savedRumor.rumor_id, 'RUMOR', `High-Risk AI Classification: ${classification.risk_score}`, 'SYSTEM']
                );
            }

            // If public and has tickers, ping Redis stream for Market Impact Monitor
            if (visibility === 'PUBLIC' && taggedTickers.length > 0) {
                // Quick broadcast via a Redis list
                const redisClient = (this.classifierService as any).redisClient; 
                if (redisClient) {
                    await redisClient.lpush('market_impact_queue', JSON.stringify({
                        post_id: savedRumor.rumor_id,
                        tickers: savedRumor.tagged_tickers,
                        timestamp: new Date().toISOString()
                    }));
                }
            }

            await queryRunner.commitTransaction();
            return savedRumor;

        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
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

    /**
     * Community Dispute System (Task B10)
     */
    async disputeRumor(userId: string, rumorId: string) {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // Insert dispute (ignoring if already disputed by this user)
            const insertRes = await queryRunner.manager.query(
                `INSERT INTO post_disputes (post_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING RETURNING dispute_id`,
                [rumorId, userId]
            );

            if (insertRes.length === 0) {
                // User already disputed this post
                return { success: false, message: 'Already disputed this post.' };
            }

            // Count disputes within last 72 hours
            const countRes = await queryRunner.manager.query(
                `SELECT COUNT(*) as count FROM post_disputes 
                 WHERE post_id = $1 AND created_at >= NOW() - INTERVAL '72 hours'`,
                [rumorId]
            );
            
            const count = parseInt(countRes[0].count, 10);

            // If threshold reached, lock the post
            if (count >= 30) {
                const rumor = await queryRunner.manager.findOne(RumorEntity, {
                    where: { rumor_id: rumorId }
                });

                if (rumor && rumor.visibility !== 'HIDDEN' && rumor.status !== 'DELETED') {
                    // Update visibility
                    rumor.visibility = 'HIDDEN';
                    rumor.status = 'PENDING_REVIEW';
                    await queryRunner.manager.save(rumor);

                    // Add to moderation queue
                    await queryRunner.manager.query(
                        `INSERT INTO moderation_queue (item_id, item_type, reason, reporter_id) VALUES ($1, $2, $3, $4)`,
                        [rumorId, 'RUMOR', `Community Dispute Threshold Exceeded (${count} disputes)`, 'SYSTEM']
                    );

                    // Decrement author credibility
                    await queryRunner.manager.query(
                        `UPDATE users SET credibility_score = GREATEST(0, credibility_score - 10) WHERE user_id = $1`,
                        [rumor.author_id]
                    );
                    
                    // Note: In real production, trigger a push notification to author_id here
                }
            }

            await queryRunner.commitTransaction();
            return { success: true, total_disputes: count };
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }
}

