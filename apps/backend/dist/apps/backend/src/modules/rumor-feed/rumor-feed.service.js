"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RumorFeedService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const rumor_entity_1 = require("./entities/rumor.entity");
const rumor_vote_entity_1 = require("./entities/rumor-vote.entity");
const classifier_service_1 = require("./classifier.service");
const bonding_curve_service_1 = require("../ipo/bonding-curve.service");
const market_monitor_service_1 = require("./market-monitor.service");
const moderation_service_1 = require("./moderation.service");
const notification_service_1 = require("../../common/services/notification.service");
const crypto = __importStar(require("crypto"));
let RumorFeedService = class RumorFeedService {
    constructor(rumorRepo, voteRepo, dataSource, classifierService, bondingCurve, marketMonitorService, moderationService, notificationService) {
        this.rumorRepo = rumorRepo;
        this.voteRepo = voteRepo;
        this.dataSource = dataSource;
        this.classifierService = classifierService;
        this.bondingCurve = bondingCurve;
        this.marketMonitorService = marketMonitorService;
        this.moderationService = moderationService;
        this.notificationService = notificationService;
    }
    /**
     * Create a new anonymous rumor post.
     */
    async createPost(authorId, collegeDomain, text) {
        // L5 Global Lockdown Check
        const isLockdown = await this.dataSource.query(`SELECT value FROM settings WHERE key = 'GLOBAL_LOCKDOWN'`);
        if (isLockdown.length && isLockdown[0].value === 'true') {
            throw new common_1.ForbiddenException('Intelligence Stream is in GLOBAL LOCKDOWN mode. All broadcasts suspended.');
        }
        const ghostId = this.generateGhostId();
        // STEP 1: Check prohibited content
        const isProhibited = await this.moderationService.checkProhibited(text);
        if (isProhibited) {
            throw new common_1.BadRequestException('This post violates community guidelines.');
        }
        // STEP 2: Classify the post
        const classification = await this.classifierService.classify(text);
        if (classification.risk_score >= 0.99) {
            throw new common_1.BadRequestException('STRICT WARNING: Your post contains vulgar, evasive, or hate speech and has been completely blocked from the feed.');
        }
        // STEP 3: Credibility gate
        const [user] = await this.dataSource.query(`SELECT credibility_score FROM users WHERE user_id = $1`, [authorId]);
        if (!user)
            throw new common_1.NotFoundException('User not found');
        const credScore = Number(user.credibility_score) || 0;
        if (classification.post_type === 'FACTUAL_CLAIM' && credScore < 50) {
            throw new common_1.ForbiddenException('Make accurate predictions to unlock all post types.');
        }
        // STEP 4: Price snapshot for mentioned tickers
        const priceSnapshot = {};
        for (const tickerId of classification.tickers) {
            const [ticker] = await this.dataSource.query(`SELECT current_supply FROM tickers WHERE ticker_id = $1`, [tickerId]);
            if (ticker) {
                priceSnapshot[tickerId] = this.bondingCurve.getPrice(Number(ticker.current_supply));
            }
        }
        // STEP 5: Determine visibility + moderation flag
        const visibility = 'PUBLIC';
        let moderationFlag = null;
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
            visibility: visibility,
            moderation_flag: moderationFlag,
        });
        const savedPost = await this.rumorRepo.save(post);
        // STEP 7: Add to moderation queue if flagged
        if (moderationFlag) {
            await this.dataSource.query(`INSERT INTO moderation_queue (flag_type, post_id, meta)
                 VALUES ($1, $2, $3)`, [
                moderationFlag,
                savedPost.post_id,
                JSON.stringify({ risk_score: classification.risk_score }),
            ]);
            await this.notificationService.sendAdminAlert(`⚠️ High-risk post pending review. Risk: ${classification.risk_score}`);
        }
        // STEP 8: Start market impact monitor
        if (classification.tickers.length > 0 && visibility === 'PUBLIC') {
            await this.marketMonitorService.startMarketMonitor(savedPost.post_id, classification.tickers, priceSnapshot, authorId);
        }
        return { post: savedPost, visibility };
    }
    /**
     * Get the rumor feed (newest first).
     */
    async getFeed(collegeDomain, page = 1, limit = 20) {
        return this.rumorRepo.find({
            where: { visibility: 'PUBLIC', college_domain: collegeDomain },
            order: { created_at: 'DESC' },
            skip: (page - 1) * limit,
            take: limit,
        });
    }
    /**
     * Upvote a rumor.
     */
    async upvote(userId, collegeDomain, postId) {
        return this.handleVote(userId, collegeDomain, postId, rumor_vote_entity_1.VoteType.UP);
    }
    /**
     * Downvote a rumor.
     */
    async downvote(userId, collegeDomain, postId) {
        return this.handleVote(userId, collegeDomain, postId, rumor_vote_entity_1.VoteType.DOWN);
    }
    /**
     * Core atomic voting ledger logic.
     * Enforces single-vote rule & handles vote-swapping.
     */
    async handleVote(userId, collegeDomain, postId, type) {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            // Lock the rumor row to prevent race conditions during vote count updates
            const rumor = await queryRunner.manager.findOne(rumor_entity_1.RumorEntity, {
                where: { post_id: postId, college_domain: collegeDomain },
                lock: { mode: 'pessimistic_write' },
            });
            if (!rumor) {
                throw new common_1.NotFoundException('Rumor not found');
            }
            // Check for existing vote in ledger
            let existingVote = await queryRunner.manager.findOne(rumor_vote_entity_1.RumorVoteEntity, {
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
                if (type === rumor_vote_entity_1.VoteType.UP) {
                    rumor.upvotes += 1;
                    rumor.downvotes = Math.max(0, rumor.downvotes - 1);
                }
                else {
                    rumor.downvotes += 1;
                    rumor.upvotes = Math.max(0, rumor.upvotes - 1);
                }
                existingVote.vote_type = type;
                await queryRunner.manager.save(existingVote);
            }
            else {
                // Brand new vote
                if (type === rumor_vote_entity_1.VoteType.UP) {
                    rumor.upvotes += 1;
                }
                else {
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
        }
        catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        }
        finally {
            await queryRunner.release();
        }
    }
    generateGhostId() {
        return `ghost_${crypto.randomBytes(4).toString('hex')}`;
    }
    /**
     * Community Dispute System (Task B10)
     */
    async disputePost(userId, postId) {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            const existing = await queryRunner.manager.query(`SELECT dispute_id FROM post_disputes WHERE post_id = $1 AND user_id = $2`, [postId, userId]);
            if (existing.length) {
                throw new common_1.BadRequestException('You have already disputed this post.');
            }
            await queryRunner.manager.query(`INSERT INTO post_disputes (post_id, user_id) VALUES ($1, $2)`, [postId, userId]);
            // Count disputes within last 72 hours
            const countRes = await queryRunner.manager.query(`SELECT COUNT(*) as count FROM post_disputes
                 WHERE post_id = $1 AND created_at >= NOW() - INTERVAL '72 hours'`, [postId]);
            const count = parseInt(countRes[0].count, 10);
            if (count >= 30) {
                const post = await queryRunner.manager.findOne(rumor_entity_1.RumorEntity, {
                    where: { post_id: postId },
                });
                if (post && post.visibility !== 'HIDDEN' && post.visibility !== 'REMOVED') {
                    post.visibility = 'HIDDEN';
                    post.moderation_flag = 'COMMUNITY_DISPUTED';
                    await queryRunner.manager.save(post);
                    await queryRunner.manager.query(`INSERT INTO moderation_queue (flag_type, post_id, meta)
                         VALUES ($1, $2, $3)`, [
                        'COMMUNITY_DISPUTED',
                        postId,
                        JSON.stringify({ dispute_count: count }),
                    ]);
                    await queryRunner.manager.query(`UPDATE users SET chip_balance = GREATEST(0, chip_balance - 500) WHERE user_id = $1`, [post.author_id]);
                    await this.notificationService.send(post.author_id, {
                        title: 'Post Under Review',
                        body: 'Community members have disputed your post. It is under review.',
                    });
                }
            }
            await queryRunner.commitTransaction();
            return { success: true, total_disputes: count };
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
exports.RumorFeedService = RumorFeedService;
exports.RumorFeedService = RumorFeedService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(rumor_entity_1.RumorEntity)),
    __param(1, (0, typeorm_1.InjectRepository)(rumor_vote_entity_1.RumorVoteEntity)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.DataSource,
        classifier_service_1.ClassifierService,
        bonding_curve_service_1.BondingCurveService,
        market_monitor_service_1.MarketMonitorService,
        moderation_service_1.ModerationService,
        notification_service_1.NotificationService])
], RumorFeedService);
