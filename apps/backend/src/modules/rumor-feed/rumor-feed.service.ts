import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { RumorEntity } from './entities/rumor.entity';
import { RumorVoteEntity, VoteType } from './entities/rumor-vote.entity';
import { ClassifierService } from './classifier.service';
import { BondingCurveService } from '../ipo/bonding-curve.service';
import { MarketMonitorService } from './market-monitor.service';
import { ModerationService } from './moderation.service';
import { NotificationService } from '../../common/services/notification.service';
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
        private readonly bondingCurve: BondingCurveService,
        private readonly marketMonitorService: MarketMonitorService,
        private readonly moderationService: ModerationService,
        private readonly notificationService: NotificationService,
    ) { }

    /**
     * Create a new anonymous rumor post.
     */
    async createPost(authorId: string, collegeDomain: string, text: string) {
        // L5 Global Lockdown Check
        const isLockdown = await this.dataSource.query(`SELECT value FROM settings WHERE key = 'GLOBAL_LOCKDOWN'`);
        if (isLockdown.length && isLockdown[0].value === 'true') {
            throw new ForbiddenException('Intelligence Stream is in GLOBAL LOCKDOWN mode. All broadcasts suspended.');
        }

        const ghostId = this.generateGhostId();

        // STEP 1: Check prohibited content
        const isProhibited = await this.moderationService.checkProhibited(text);
        if (isProhibited) {
            throw new BadRequestException('This post violates community guidelines.');
        }

        // STEP 2: Classify the post
        const classification = await this.classifierService.classify(text);

        if (classification.risk_score >= 0.99) {
            throw new BadRequestException('STRICT WARNING: Your post contains vulgar, evasive, or hate speech and has been completely blocked from the feed.');
        }

        // STEP 3: Credibility gate (Bypassed for Demo/Dysfunction Fix)
        const [user] = await this.dataSource.query(
            `SELECT credibility_score FROM users WHERE user_id = $1`,
            [authorId],
        );
        if (!user) throw new NotFoundException('User not found');
        const credScore = Number(user.credibility_score) || 0;
        
        // Temporarily allowing all post types to fix 'dysfunctional' transmission in demo
        /*
        if (classification.post_type === 'FACTUAL_CLAIM' && credScore < 50) {
            throw new ForbiddenException('Make accurate predictions to unlock all post types.');
        }
        */

        // STEP 4: Price snapshot for mentioned tickers
        const priceSnapshot: Record<string, number> = {};
        for (const tickerId of classification.tickers) {
            const [ticker] = await this.dataSource.query(
                `SELECT current_supply FROM tickers WHERE ticker_id = $1`,
                [tickerId],
            );
            if (ticker) {
                priceSnapshot[tickerId] = this.bondingCurve.getPrice(Number(ticker.current_supply));
            }
        }

        // STEP 5: Determine visibility + moderation flag
        const visibility: 'PUBLIC' | 'PENDING' | 'HIDDEN' | 'REMOVED' = 'PUBLIC';
        let moderationFlag: string | null = null;

        if (classification.post_type === 'FACTUAL_CLAIM' && classification.risk_score >= 0.7) {
            moderationFlag = 'HIGH_RISK_CLAIM';
        }

        // L2 Shadow Gate: Alert admins, but keep PUBLIC for demo/instant feedback
        if (credScore < 10 && visibility === 'PUBLIC') {
            moderationFlag = 'SHADOW_REVIEW';
        }

        // STEP 6: Save post
        const post = this.rumorRepo.create({
            author_id: authorId,
            ghost_id: ghostId,
            text,
            tagged_tickers: classification.tickers,
            college_domain: collegeDomain,
            price_snapshot: priceSnapshot,
            post_type: classification.post_type,
            risk_score: classification.risk_score,
            visibility: visibility as any,
            moderation_flag: moderationFlag,
        });

        const savedPost = await this.rumorRepo.save(post);

        // STEP 7: Add to moderation queue if flagged
        if (moderationFlag) {
            await this.dataSource.query(
                `INSERT INTO moderation_queue (flag_type, post_id, meta)
                 VALUES ($1, $2, $3)`,
                [
                    moderationFlag,
                    savedPost.post_id,
                    JSON.stringify({ risk_score: classification.risk_score }),
                ],
            );
            await this.notificationService.sendAdminAlert(
                `⚠️ High-risk post pending review. Risk: ${classification.risk_score}`,
            );
        }

        // STEP 8: Start market impact monitor
        if (classification.tickers.length > 0 && visibility === 'PUBLIC') {
            await this.marketMonitorService.startMarketMonitor(
                savedPost.post_id,
                classification.tickers,
                priceSnapshot,
                authorId,
            );
        }

        return { post: savedPost, visibility };
    }

    /**
     * Get the rumor feed (newest first).
     */
    async getFeed(collegeDomain: string, page: number = 1, limit: number = 20) {
        return this.rumorRepo.find({
            where: { visibility: 'PUBLIC' as any, college_domain: collegeDomain },
            order: { created_at: 'DESC' },
            skip: (page - 1) * limit,
            take: limit,
        });
    }

    /**
     * Upvote a rumor.
     */
    async upvote(userId: string, collegeDomain: string, postId: string) {
        return this.handleVote(userId, collegeDomain, postId, VoteType.UP);
    }

    /**
     * Downvote a rumor.
     */
    async downvote(userId: string, collegeDomain: string, postId: string) {
        return this.handleVote(userId, collegeDomain, postId, VoteType.DOWN);
    }

    /**
     * Core atomic voting ledger logic.
     * Enforces single-vote rule & handles vote-swapping.
     */
    private async handleVote(userId: string, collegeDomain: string, postId: string, type: VoteType) {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // Lock the rumor row to prevent race conditions during vote count updates
            const rumor = await queryRunner.manager.findOne(RumorEntity, {
                where: { post_id: postId, college_domain: collegeDomain },
                lock: { mode: 'pessimistic_write' },
            });

            if (!rumor) {
                throw new NotFoundException('Rumor not found');
            }

            // Check for existing vote in ledger
            let existingVote = await queryRunner.manager.findOne(RumorVoteEntity, {
                where: { user_id: userId, post_id: postId },
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
                    post_id: postId,
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

    private generateGhostId(): string {
        return `ghost_${crypto.randomBytes(4).toString('hex')}`;
    }

    /**
     * Community Dispute System (Task B10)
     */
    async disputePost(userId: string, postId: string) {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const existing = await queryRunner.manager.query(
                `SELECT dispute_id FROM post_disputes WHERE post_id = $1 AND user_id = $2`,
                [postId, userId],
            );
            if (existing.length) {
                throw new BadRequestException('You have already disputed this post.');
            }

            await queryRunner.manager.query(
                `INSERT INTO post_disputes (post_id, user_id) VALUES ($1, $2)`,
                [postId, userId],
            );

            // Count disputes within last 72 hours
            const countRes = await queryRunner.manager.query(
                `SELECT COUNT(*) as count FROM post_disputes
                 WHERE post_id = $1 AND created_at >= NOW() - INTERVAL '72 hours'`,
                [postId],
            );

            const count = parseInt(countRes[0].count, 10);

            if (count >= 30) {
                const post = await queryRunner.manager.findOne(RumorEntity, {
                    where: { post_id: postId },
                });

                if (post && post.visibility !== 'HIDDEN' && post.visibility !== 'REMOVED') {
                    post.visibility = 'HIDDEN';
                    post.moderation_flag = 'COMMUNITY_DISPUTED';
                    await queryRunner.manager.save(post);

                    await queryRunner.manager.query(
                        `INSERT INTO moderation_queue (flag_type, post_id, meta)
                         VALUES ($1, $2, $3)`,
                        [
                            'COMMUNITY_DISPUTED',
                            postId,
                            JSON.stringify({ dispute_count: count }),
                        ],
                    );

                    await queryRunner.manager.query(
                        `UPDATE users SET chip_balance = GREATEST(0, chip_balance - 500) WHERE user_id = $1`,
                        [post.author_id],
                    );

                    await this.notificationService.send(post.author_id, {
                        title: 'Post Under Review',
                        body: 'Community members have disputed your post. It is under review.',
                    });
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
