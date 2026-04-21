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
exports.IpoController = void 0;
const common_1 = require("@nestjs/common");
const ipo_service_1 = require("./ipo.service");
const ipo_delist_service_1 = require("./ipo-delist.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
let IpoController = class IpoController {
    constructor(ipoService, ipoDelistService) {
        this.ipoService = ipoService;
        this.ipoDelistService = ipoDelistService;
    }
    async createIpo(req, body) {
        return this.ipoService.createIpo(req.user.userId, req.user.collegeDomain, body.ticker_symbol, body.category);
    }
    /**
     * Panic Button — Delist IPO (PRD §7.1)
     */
    async delistIpo(req) {
        return this.ipoDelistService.delistIpo(req.user.userId);
    }
    /**
     * Nuke a Prop Market (costs 2000 Chips)
     */
    async nukePropMarket(req, eventId) {
        return this.ipoDelistService.nukePropMarket(req.user.userId, req.user.collegeDomain, eventId);
    }
    /**
     * Buy Shoutout (pin rumor for 10 min, costs 500 Chips)
     */
    async buyShoutout(req, rumorId) {
        return this.ipoDelistService.buyShoutout(req.user.userId, req.user.collegeDomain, rumorId);
    }
    /**
     * Buy Golden Border (costs 1000 Creds)
     */
    async buyGoldenBorder(req) {
        return this.ipoDelistService.buyGoldenBorder(req.user.userId);
    }
    async getActiveTickers(req) {
        return this.ipoService.getActiveTickers(req.user.collegeDomain);
    }
    async getTicker(req, id) {
        return this.ipoService.getTicker(req.user.collegeDomain, id);
    }
    async getUserHoldings(req) {
        return this.ipoService.getUserHoldings(req.user.userId);
    }
};
exports.IpoController = IpoController;
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('create'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], IpoController.prototype, "createIpo", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('delist'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], IpoController.prototype, "delistIpo", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('nuke/:eventId'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('eventId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], IpoController.prototype, "nukePropMarket", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('shoutout/:rumorId'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('rumorId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], IpoController.prototype, "buyShoutout", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('golden-border'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], IpoController.prototype, "buyGoldenBorder", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('tickers'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], IpoController.prototype, "getActiveTickers", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('ticker/:id'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], IpoController.prototype, "getTicker", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('holdings'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], IpoController.prototype, "getUserHoldings", null);
exports.IpoController = IpoController = __decorate([
    (0, common_1.Controller)('ipo'),
    __metadata("design:paramtypes", [ipo_service_1.IpoService,
        ipo_delist_service_1.IpoDelistService])
], IpoController);
