import { NotificationsService } from './notifications.service';
export declare class NotificationsController {
    private readonly notificationsService;
    constructor(notificationsService: NotificationsService);
    getNotifications(req: any, limit: number): Promise<import("./entities/notification.entity").NotificationEntity[]>;
    markAsRead(id: string): Promise<import("typeorm").UpdateResult>;
    markAllAsRead(req: any): Promise<import("typeorm").UpdateResult>;
}
