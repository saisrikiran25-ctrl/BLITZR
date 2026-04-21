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
exports.MarketsController = void 0;
const common_1 = require("@nestjs/common");
const prop_market_service_1 = require("./prop-market.service");
const jwt_or_admin_guard_1 = require("../../common/guards/jwt-or-admin.guard");
let MarketsController = class MarketsController {
    constructor(propMarketService) {
        this.propMarketService = propMarketService;
    }
    async getMarkets(req, scope = 'LOCAL') {
        if (req.user?.userId) {
            return this.propMarketService.getActiveEvents(req.user.userId, scope);
        }
        return this.propMarketService.getActiveEventsForInstitution(req.user?.institutionId, scope);
    }
};
exports.MarketsController = MarketsController;
__decorate([
    (0, common_1.UseGuards)(jwt_or_admin_guard_1.JwtOrAdminGuard),
    (0, common_1.Get)(),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('scope')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], MarketsController.prototype, "getMarkets", null);
exports.MarketsController = MarketsController = __decorate([
    (0, common_1.Controller)('markets'),
    __metadata("design:paramtypes", [prop_market_service_1.PropMarketService])
], MarketsController);
