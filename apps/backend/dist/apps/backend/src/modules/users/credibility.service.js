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
var CredibilityService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CredibilityService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("typeorm");
let CredibilityService = CredibilityService_1 = class CredibilityService {
    constructor(dataSource) {
        this.dataSource = dataSource;
        this.logger = new common_1.Logger(CredibilityService_1.name);
    }
    /**
     * Increment credibility by 10 points when a user's prop bet wins.
     */
    async onPropBetWon(userId) {
        await this.adjustScore(userId, 10, 'Prop Bet Won');
    }
    /**
     * Increment credibility by 5 points if a factual post survives 72 hours without hitting the dispute threshold.
     */
    async onPostSurvived(postId) {
        const [post] = await this.dataSource.query(`SELECT author_id FROM rumor_posts WHERE post_id = $1`, [postId]);
        if (post?.author_id) {
            await this.adjustScore(post.author_id, 5, 'Post Survived 72h');
        }
    }
    /**
     * Increment credibility by 5 points when a flagged post is manually cleared by the Dean.
     */
    async onPostCleared(postId) {
        const [post] = await this.dataSource.query(`SELECT author_id FROM rumor_posts WHERE post_id = $1`, [postId]);
        if (post?.author_id) {
            await this.adjustScore(post.author_id, 5, 'Post Cleared By Moderator');
        }
    }
    /**
     * Decrement credibility by 15 points if a post is manually removed by the Dean for policy violation.
     */
    async onPostRemoved(postId) {
        const [post] = await this.dataSource.query(`SELECT author_id FROM rumor_posts WHERE post_id = $1`, [postId]);
        if (post?.author_id) {
            await this.adjustScore(post.author_id, -15, 'Post Removed By Moderator');
        }
    }
    /**
     * Core score adjustment executing inside a transaction safely.
     * Score is bound between 0 (absolute bottom) and an upper bound, typically no cap but we start at 50.
     */
    async adjustScore(userId, delta, reason) {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            // Update score with GREATEST(0, ... )
            await queryRunner.manager.query(`UPDATE users 
                 SET credibility_score = GREATEST(0, credibility_score + $1)
                 WHERE user_id = $2`, [delta, userId]);
            this.logger.log(`Credibility adjustment: delta=${delta} for user=${userId} reason='${reason}'`);
            await queryRunner.commitTransaction();
        }
        catch (error) {
            this.logger.error(`Failed to adjust credibility score for user ${userId}.`, error);
            await queryRunner.rollbackTransaction();
        }
        finally {
            await queryRunner.release();
        }
    }
};
exports.CredibilityService = CredibilityService;
exports.CredibilityService = CredibilityService = CredibilityService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeorm_1.DataSource])
], CredibilityService);
