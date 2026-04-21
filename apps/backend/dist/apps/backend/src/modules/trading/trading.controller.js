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
exports.TradingController = void 0;
const common_1 = require("@nestjs/common");
const trading_service_1 = require("./trading.service");
const trade_queue_service_1 = require("./trade-queue.service");
const ohlc_aggregation_service_1 = require("./ohlc-aggregation.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
let TradingController = class TradingController {
    constructor(tradingService, tradeQueue, ohlcService) {
        this.tradingService = tradingService;
        this.tradeQueue = tradeQueue;
        this.ohlcService = ohlcService;
    }
    async previewBuy(req, body) {
        return this.tradingService.previewBuy(req.user.collegeDomain, body.ticker_id, body.shares);
    }
    /**
     * B12: Buy via Redis trade queue — returns immediately with QUEUED status.
     */
    async executeBuy(req, body) {
        return this.tradeQueue.enqueueTrade(req.user.userId, req.user.collegeDomain, body.ticker_id, 'BUY', body.shares);
    }
    /**
     * B12: Sell via Redis trade queue — returns immediately with QUEUED status.
     */
    async executeSell(req, body) {
        return this.tradeQueue.enqueueTrade(req.user.userId, req.user.collegeDomain, body.ticker_id, 'SELL', body.shares);
    }
    /**
     * Get OHLC candles for chart rendering (PRD §6.2).
     */
    async getCandles(req, tickerId, interval = '1h', limit = 100) {
        return this.ohlcService.getCandles(req.user.collegeDomain, tickerId, interval, limit);
    }
};
exports.TradingController = TradingController;
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('preview/buy'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], TradingController.prototype, "previewBuy", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('buy'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], TradingController.prototype, "executeBuy", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('sell'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], TradingController.prototype, "executeSell", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('candles/:tickerId'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('tickerId')),
    __param(2, (0, common_1.Query)('interval')),
    __param(3, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, Number]),
    __metadata("design:returntype", Promise)
], TradingController.prototype, "getCandles", null);
exports.TradingController = TradingController = __decorate([
    (0, common_1.Controller)('trading'),
    __metadata("design:paramtypes", [trading_service_1.TradingService,
        trade_queue_service_1.TradeQueueService,
        ohlc_aggregation_service_1.OhlcAggregationService])
], TradingController);
