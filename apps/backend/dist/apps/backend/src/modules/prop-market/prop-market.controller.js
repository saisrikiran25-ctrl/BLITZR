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
exports.PropMarketController = void 0;
const common_1 = require("@nestjs/common");
const prop_market_service_1 = require("./prop-market.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const admin_jwt_guard_1 = require("../admin/guards/admin-jwt.guard");
let PropMarketController = class PropMarketController {
    constructor(propMarketService) {
        this.propMarketService = propMarketService;
    }
    async createEvent(req, body) {
        return this.propMarketService.createEvent(req.user.userId, req.user.collegeDomain, body.title, body.description, body.category, new Date(body.expiry_timestamp), body.referee_id, body.listing_fee, body.initial_liquidity);
    }
    async placeBet(req, body) {
        return this.propMarketService.placeBet(req.user.userId, req.user.collegeDomain, body.event_id, body.outcome, body.chip_amount);
    }
    async settleEvent(req, body) {
        return this.propMarketService.settleEvent(req.user.userId, req.user.collegeDomain, body.event_id, body.winning_outcome);
    }
    async getActiveEvents(req, scope = 'LOCAL') {
        return this.propMarketService.getActiveEvents(req.user.userId, scope);
    }
    /**
     * B4: Admin endpoint to create a national/regional prop market.
     * Protected by ADMIN_SECRET header.
     */
    async adminCreateMarket(req, body) {
        const isAdmin = ['ADMIN', 'INSTITUTION_ADMIN'].includes(req.user.role);
        return this.propMarketService.createAdminMarket(req.user.adminId, isAdmin, body.title, body.description, body.category, new Date(body.expiry_timestamp), body.scope, body.institution_id ?? req.user.institutionId, body.options, body.featured ?? false);
    }
};
exports.PropMarketController = PropMarketController;
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('create'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], PropMarketController.prototype, "createEvent", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('bet'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], PropMarketController.prototype, "placeBet", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('settle'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], PropMarketController.prototype, "settleEvent", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('events'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('scope')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], PropMarketController.prototype, "getActiveEvents", null);
__decorate([
    (0, common_1.UseGuards)(admin_jwt_guard_1.AdminJwtGuard),
    (0, common_1.Post)('admin/create'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], PropMarketController.prototype, "adminCreateMarket", null);
exports.PropMarketController = PropMarketController = __decorate([
    (0, common_1.Controller)('prop-market'),
    __metadata("design:paramtypes", [prop_market_service_1.PropMarketService])
], PropMarketController);
