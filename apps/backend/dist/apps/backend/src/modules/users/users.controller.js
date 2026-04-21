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
exports.UsersController = void 0;
const common_1 = require("@nestjs/common");
const users_service_1 = require("./users.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const notifications_service_1 = require("../notifications/notifications.service");
const bcrypt = __importStar(require("bcrypt"));
let UsersController = class UsersController {
    constructor(usersService, notificationsService) {
        this.usersService = usersService;
        this.notificationsService = notificationsService;
    }
    async getProfile(req) {
        const user = await this.usersService.findById(req.user.userId);
        if (!user)
            return null;
        const { password_hash, ...safeUser } = user;
        return safeUser;
    }
    async updateProfile(req, updateData) {
        const userId = req.user.userId;
        const user = await this.usersService.findOneById(userId);
        const finalUpdate = {};
        const changedFields = [];
        // ── USERNAME CHANGE ──────────────────────────────────────────────────
        if (updateData.username && updateData.username.trim() !== user.username) {
            const taken = await this.usersService.isUsernameTaken(updateData.username.trim(), user.institution_id);
            if (taken) {
                throw new common_1.ConflictException('That username is already taken at your institution. Please choose a different one.');
            }
            finalUpdate.username = updateData.username.trim();
            changedFields.push('username');
        }
        // ── PASSWORD CHANGE ──────────────────────────────────────────────────
        if (updateData.password) {
            if (!updateData.currentPassword) {
                throw new common_1.BadRequestException('Current password is required to change your password.');
            }
            const isValid = await bcrypt.compare(updateData.currentPassword, user.password_hash);
            if (!isValid) {
                throw new common_1.UnauthorizedException('Incorrect current password.');
            }
            const salt = await bcrypt.genSalt(12);
            finalUpdate.password_hash = await bcrypt.hash(updateData.password, salt);
            changedFields.push('password');
        }
        // ── NOTIFICATION PREFERENCES (non-sensitive, no auth needed) ─────────
        const prefFields = ['notify_trading', 'notify_price_threshold', 'notify_arena_resolution'];
        for (const field of prefFields) {
            if (typeof updateData[field] === 'boolean') {
                finalUpdate[field] = updateData[field];
            }
        }
        if (Object.keys(finalUpdate).length === 0) {
            const { password_hash, ...safeUser } = user;
            return safeUser;
        }
        // Persist to database
        const updatedUser = await this.usersService.update(userId, finalUpdate);
        // ── FIRE IN-APP NOTIFICATION (only for identity/security changes) ────
        if (changedFields.length > 0) {
            const message = changedFields.includes('username') && changedFields.includes('password')
                ? 'Your username and password have been updated successfully.'
                : changedFields.includes('username')
                    ? `Your username has been changed to @${finalUpdate.username}.`
                    : 'Your password has been updated successfully.';
            // Fire-and-forget — don't let a notification failure break the response
            this.notificationsService.createNotification(userId, 'Profile Updated', message, 'SYSTEM', { changed_fields: changedFields }).catch(() => { }); // Silently swallow notification errors
        }
        // Strip password_hash before returning
        const { password_hash, ...safeUser } = updatedUser;
        return safeUser;
    }
    async deleteMe(req) {
        return this.usersService.deleteUser(req.user.userId);
    }
    async getUser(id) {
        const user = await this.usersService.findById(id);
        if (!user)
            return null;
        const { password_hash, ...safeUser } = user;
        return safeUser;
    }
};
exports.UsersController = UsersController;
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('me'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getProfile", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Patch)('me'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "updateProfile", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Delete)('me'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "deleteMe", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getUser", null);
exports.UsersController = UsersController = __decorate([
    (0, common_1.Controller)('users'),
    __metadata("design:paramtypes", [users_service_1.UsersService,
        notifications_service_1.NotificationsService])
], UsersController);
