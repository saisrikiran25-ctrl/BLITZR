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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RumorFeedController = void 0;
const common_1 = require("@nestjs/common");
const create_rumor_dto_1 = require("./dto/create-rumor.dto");
const rumor_feed_service_1 = require("./rumor-feed.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
let RumorFeedController = class RumorFeedController {
    constructor(rumorFeedService) {
        this.rumorFeedService = rumorFeedService;
    }
    mapToDto(rumor) {
        return {
            ...rumor,
            rumor_id: rumor.post_id,
            content: rumor.text,
            // Ensure numbers are numbers for the frontend
            upvotes: Number(rumor.upvotes),
            downvotes: Number(rumor.downvotes),
        };
    }
    async createPost(req, body) {
        const text = body.text || body.content;
        const result = await this.rumorFeedService.createPost(req.user.userId, req.user.collegeDomain, text || '');
        return {
            ...result,
            post: this.mapToDto(result.post),
        };
    }
    async getFeed(req, page = 1, limit = 20) {
        const feed = await this.rumorFeedService.getFeed(req.user.collegeDomain, page, limit);
        return feed.map(r => this.mapToDto(r));
    }
    async upvote(id, req) {
        const result = await this.rumorFeedService.upvote(req.user.userId, req.user.collegeDomain, id);
        return this.mapToDto(result);
    }
    async downvote(id, req) {
        const result = await this.rumorFeedService.downvote(req.user.userId, req.user.collegeDomain, id);
        return this.mapToDto(result);
    }
    async dispute(id, req) {
        return this.rumorFeedService.disputePost(req.user.userId, id);
    }
};
exports.RumorFeedController = RumorFeedController;
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)(),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_rumor_dto_1.CreateRumorDto]),
    __metadata("design:returntype", Promise)
], RumorFeedController.prototype, "createPost", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)(),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, Number]),
    __metadata("design:returntype", Promise)
], RumorFeedController.prototype, "getFeed", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)(':id/upvote'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], RumorFeedController.prototype, "upvote", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)(':id/downvote'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], RumorFeedController.prototype, "downvote", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)(':id/dispute'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], RumorFeedController.prototype, "dispute", null);
exports.RumorFeedController = RumorFeedController = __decorate([
    (0, common_1.Controller)('rumors'),
    __metadata("design:paramtypes", [rumor_feed_service_1.RumorFeedService])
], RumorFeedController);
