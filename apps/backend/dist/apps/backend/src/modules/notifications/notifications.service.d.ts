import { Repository } from 'typeorm';
import { NotificationEntity } from './entities/notification.entity';
import { UserEntity } from '../users/entities/user.entity';
export declare class NotificationsService {
    private readonly notificationRepository;
    private readonly userRepository;
    constructor(notificationRepository: Repository<NotificationEntity>, userRepository: Repository<UserEntity>);
    createNotification(userId: string, title: string, message: string, type: 'TRADING' | 'PRICE_ALERT' | 'ARENA' | 'SYSTEM', metadata?: any): Promise<NotificationEntity | undefined>;
    getNotifications(userId: string, limit?: number): Promise<NotificationEntity[]>;
    markAsRead(notificationId: string): Promise<import("typeorm").UpdateResult>;
    markAllAsRead(userId: string): Promise<import("typeorm").UpdateResult>;
}
