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
exports.NotificationsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const notification_entity_1 = require("./entities/notification.entity");
const user_entity_1 = require("../users/entities/user.entity");
let NotificationsService = class NotificationsService {
    constructor(notificationRepository, userRepository) {
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
    }
    async createNotification(userId, title, message, type, metadata) {
        // 1. Check user preferences
        const user = await this.userRepository.findOne({ where: { user_id: userId } });
        if (!user)
            return;
        let shouldNotify = true;
        if (type === 'TRADING' && !user.notify_trading)
            shouldNotify = false;
        if (type === 'PRICE_ALERT' && !user.notify_price_threshold)
            shouldNotify = false;
        if (type === 'ARENA' && !user.notify_arena_resolution)
            shouldNotify = false;
        if (!shouldNotify)
            return;
        // 2. Create the notification
        const notification = this.notificationRepository.create({
            user_id: userId,
            title,
            message,
            type,
            metadata,
        });
        return this.notificationRepository.save(notification);
    }
    async getNotifications(userId, limit = 20) {
        return this.notificationRepository.find({
            where: { user_id: userId },
            order: { created_at: 'DESC' },
            take: limit,
        });
    }
    async markAsRead(notificationId) {
        return this.notificationRepository.update(notificationId, { is_read: true });
    }
    async markAllAsRead(userId) {
        return this.notificationRepository.update({ user_id: userId, is_read: false }, { is_read: true });
    }
};
exports.NotificationsService = NotificationsService;
exports.NotificationsService = NotificationsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(notification_entity_1.NotificationEntity)),
    __param(1, (0, typeorm_1.InjectRepository)(user_entity_1.UserEntity)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], NotificationsService);
