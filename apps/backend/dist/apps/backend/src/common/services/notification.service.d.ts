export declare class NotificationService {
    private readonly logger;
    send(userId: string, payload: {
        title: string;
        body: string;
    }): Promise<void>;
    sendAdminAlert(message: string): Promise<void>;
}
