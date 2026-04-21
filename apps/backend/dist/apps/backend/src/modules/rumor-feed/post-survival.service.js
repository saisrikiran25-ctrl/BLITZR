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
var PostSurvivalService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostSurvivalService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const typeorm_1 = require("typeorm");
const credibility_service_1 = require("../users/credibility.service");
let PostSurvivalService = PostSurvivalService_1 = class PostSurvivalService {
    constructor(dataSource, credibilityService) {
        this.dataSource = dataSource;
        this.credibilityService = credibilityService;
        this.logger = new common_1.Logger(PostSurvivalService_1.name);
    }
    async rewardSurvivedPosts() {
        const threshold = new Date(Date.now() - 72 * 60 * 60 * 1000);
        const posts = await this.dataSource.query(`SELECT post_id, created_at
             FROM rumor_posts
             WHERE post_type = 'FACTUAL_CLAIM'
               AND created_at <= $1
               AND credibility_rewarded = false`, [threshold]);
        for (const post of posts) {
            const [countRes] = await this.dataSource.query(`SELECT COUNT(*)::int AS count
                 FROM post_disputes
                 WHERE post_id = $1 AND created_at <= ($2::timestamptz + INTERVAL '72 hours')`, [post.post_id, post.created_at]);
            const disputeCount = Number(countRes?.count ?? 0);
            if (disputeCount < 30) {
                await this.credibilityService.onPostSurvived(post.post_id);
                await this.dataSource.query(`UPDATE rumor_posts SET credibility_rewarded = true WHERE post_id = $1`, [post.post_id]);
                this.logger.log(`Credibility reward granted for post ${post.post_id}`);
            }
        }
    }
};
exports.PostSurvivalService = PostSurvivalService;
__decorate([
    (0, schedule_1.Cron)('0 0 * * * *'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], PostSurvivalService.prototype, "rewardSurvivedPosts", null);
exports.PostSurvivalService = PostSurvivalService = PostSurvivalService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeorm_1.DataSource,
        credibility_service_1.CredibilityService])
], PostSurvivalService);
