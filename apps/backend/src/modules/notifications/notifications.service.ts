import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationEntity } from './entities/notification.entity';
import { UserEntity } from '../users/entities/user.entity';

@Injectable()
export class NotificationsService {
    constructor(
        @InjectRepository(NotificationEntity)
        private readonly notificationRepository: Repository<NotificationEntity>,
        @InjectRepository(UserEntity)
        private readonly userRepository: Repository<UserEntity>,
    ) { }

    async createNotification(userId: string, title: string, message: string, type: 'TRADING' | 'PRICE_ALERT' | 'ARENA' | 'SYSTEM', metadata?: any) {
        // 1. Check user preferences
        const user = await this.userRepository.findOne({ where: { user_id: userId } });
        if (!user) return;

        let shouldNotify = true;
        if (type === 'TRADING' && !user.notify_trading) shouldNotify = false;
        if (type === 'PRICE_ALERT' && !user.notify_price_threshold) shouldNotify = false;
        if (type === 'ARENA' && !user.notify_arena_resolution) shouldNotify = false;

        if (!shouldNotify) return;

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

    async getNotifications(userId: string, limit = 20) {
        return this.notificationRepository.find({
            where: { user_id: userId },
            order: { created_at: 'DESC' },
            take: limit,
        });
    }

    async markAsRead(notificationId: string) {
        return this.notificationRepository.update(notificationId, { is_read: true });
    }

    async markAllAsRead(userId: string) {
        return this.notificationRepository.update({ user_id: userId, is_read: false }, { is_read: true });
    }
}
