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
exports.AdminController = void 0;
const common_1 = require("@nestjs/common");
const admin_analytics_service_1 = require("./admin-analytics.service");
const swagger_1 = require("@nestjs/swagger");
const admin_jwt_guard_1 = require("./guards/admin-jwt.guard");
const prop_market_service_1 = require("../prop-market/prop-market.service");
let AdminController = class AdminController {
    constructor(adminService, propMarketService) {
        this.adminService = adminService;
        this.propMarketService = propMarketService;
    }
    getAnalytics(req, limit = 672) {
        return this.adminService.getAnalytics(Number(limit), req.user.institutionId ?? undefined);
    }
    /**
     * GET moderation queue — reads from moderation_queue table (Dean's Dashboard Page 4).
     */
    getModerationQueue(status = 'PENDING') {
        return this.adminService.getModerationQueue(status);
    }
    /**
     * PATCH clear — sets post.visibility = PUBLIC, rewards author credibility.
     */
    clearModerationItem(queueId) {
        return this.adminService.clearModerationItem(queueId);
    }
    /**
     * PATCH remove — sets post.visibility = REMOVED, penalises author credibility.
     */
    removeModerationItem(queueId) {
        return this.adminService.removeModerationItem(queueId);
    }
    /**
     * POST /admin/campus/pause — pauses all markets for 24 hours.
     * Requires confirmText === 'CONFIRM PAUSE' in the request body.
     */
    pauseAllCampusMarkets(req, body) {
        return this.adminService.pauseAllCampusMarkets(body.confirm_text ?? '', req.user.institutionId ?? null);
    }
    freezeAllMarkets() {
        return this.adminService.freezeAllMarkets();
    }
    delistTicker(tickerId) {
        return this.adminService.delistTicker(tickerId);
    }
    /**
     * POST /admin/emergency/delist-by-email — delist by student email.
     */
    delistByEmail(body) {
        return this.adminService.delistTickerByEmail(body.email);
    }
    /**
     * B4: Admin endpoint to create a national/regional prop market.
     * Protected by AdminJwtGuard.
     */
    createMarket(req, body) {
        const isAdmin = ['ADMIN', 'INSTITUTION_ADMIN'].includes(req.user.role);
        return this.propMarketService.createAdminMarket(req.user.adminId, isAdmin, body.title, body.description, body.category, new Date(body.expiry_timestamp), body.scope, body.institution_id ?? req.user.institutionId, body.options, body.featured ?? false);
    }
    toggleLockdown(body) {
        return this.adminService.toggleGlobalLockdown(body.active);
    }
    getRiskMetrics() {
        return this.adminService.getRiskMetrics();
    }
    exportAuditLogs() {
        return this.adminService.exportAuditLogs();
    }
};
exports.AdminController = AdminController;
__decorate([
    (0, common_1.Get)('analytics'),
    (0, swagger_1.ApiOperation)({ summary: 'Get historical admin analytics snapshots' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "getAnalytics", null);
__decorate([
    (0, common_1.Get)('moderation-queue'),
    (0, swagger_1.ApiOperation)({ summary: 'Get moderation queue items by status' }),
    __param(0, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "getModerationQueue", null);
__decorate([
    (0, common_1.Patch)('moderation/:queueId/clear'),
    (0, swagger_1.ApiOperation)({ summary: 'Clear a moderation queue item — post becomes PUBLIC' }),
    __param(0, (0, common_1.Param)('queueId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "clearModerationItem", null);
__decorate([
    (0, common_1.Patch)('moderation/:queueId/remove'),
    (0, swagger_1.ApiOperation)({ summary: 'Remove a moderation queue item — post becomes REMOVED' }),
    __param(0, (0, common_1.Param)('queueId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "removeModerationItem", null);
__decorate([
    (0, common_1.Post)('campus/pause'),
    (0, swagger_1.ApiOperation)({ summary: 'Pause all campus markets for 24 hours (requires CONFIRM PAUSE text)' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "pauseAllCampusMarkets", null);
__decorate([
    (0, common_1.Post)('emergency/freeze-all'),
    (0, swagger_1.ApiOperation)({ summary: 'Panic button: Freeze all active markets instantly' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "freezeAllMarkets", null);
__decorate([
    (0, common_1.Post)('emergency/delist/:tickerId'),
    (0, swagger_1.ApiOperation)({ summary: 'Manually delist a ticker by ticker ID' }),
    __param(0, (0, common_1.Param)('tickerId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "delistTicker", null);
__decorate([
    (0, common_1.Post)('emergency/delist-by-email'),
    (0, swagger_1.ApiOperation)({ summary: 'Delist a student ticker by their college email' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "delistByEmail", null);
__decorate([
    (0, common_1.Post)('markets/create'),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new prop market (admin)' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "createMarket", null);
__decorate([
    (0, common_1.Post)('emergency/lockdown'),
    (0, swagger_1.ApiOperation)({ summary: 'L5 Toggle Global Lockdown (Halts all trading/rumors)' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "toggleLockdown", null);
__decorate([
    (0, common_1.Get)('risk-metrics'),
    (0, swagger_1.ApiOperation)({ summary: 'L5 Real-time Risk Dashboard telemetry' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "getRiskMetrics", null);
__decorate([
    (0, common_1.Get)('audit-export'),
    (0, swagger_1.ApiOperation)({ summary: 'L5 Export moderation audit logs' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "exportAuditLogs", null);
exports.AdminController = AdminController = __decorate([
    (0, swagger_1.ApiTags)('Admin Dashboard - Telegraph Telemetry'),
    (0, common_1.UseGuards)(admin_jwt_guard_1.AdminJwtGuard),
    (0, common_1.Controller)('admin'),
    __metadata("design:paramtypes", [admin_analytics_service_1.AdminAnalyticsService,
        prop_market_service_1.PropMarketService])
], AdminController);
