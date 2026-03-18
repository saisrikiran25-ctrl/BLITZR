import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class NotificationService {
    private readonly logger = new Logger(NotificationService.name);

    async send(userId: string, payload: { title: string; body: string }) {
        this.logger.log(`[NOTIFY:${userId}] ${payload.title} — ${payload.body}`);
    }

    async sendAdminAlert(message: string) {
        this.logger.warn(`[ADMIN ALERT] ${message}`);
    }
}
