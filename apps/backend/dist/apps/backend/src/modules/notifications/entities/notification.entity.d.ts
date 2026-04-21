import { UserEntity } from '../../users/entities/user.entity';
export declare class NotificationEntity {
    notification_id: string;
    user_id: string;
    user: UserEntity;
    title: string;
    message: string;
    type: 'TRADING' | 'PRICE_ALERT' | 'ARENA' | 'SYSTEM';
    is_read: boolean;
    metadata: any;
    created_at: Date;
}
