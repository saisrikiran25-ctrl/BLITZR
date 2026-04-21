import { Controller, Get, Post, Param, UseGuards, Request, Query } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('notifications')
export class NotificationsController {
    constructor(private readonly notificationsService: NotificationsService) { }

    @UseGuards(JwtAuthGuard)
    @Get()
    async getNotifications(@Request() req: any, @Query('limit') limit: number) {
        return this.notificationsService.getNotifications(req.user.userId, limit);
    }

    @UseGuards(JwtAuthGuard)
    @Post(':id/read')
    async markAsRead(@Param('id') id: string) {
        return this.notificationsService.markAsRead(id);
    }

    @UseGuards(JwtAuthGuard)
    @Post('read-all')
    async markAllAsRead(@Request() req: any) {
        return this.notificationsService.markAllAsRead(req.user.userId);
    }
}
