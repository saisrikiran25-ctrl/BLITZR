import { Controller, Get, Patch, Delete, Body, Param, UseGuards, Request, ConflictException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { NotificationsService } from '../notifications/notifications.service';
import * as bcrypt from 'bcrypt';
import { UserEntity } from './entities/user.entity';

@Controller('users')
export class UsersController {
    constructor(
        private readonly usersService: UsersService,
        private readonly notificationsService: NotificationsService,
    ) { }

    @UseGuards(JwtAuthGuard)
    @Get('me')
    async getProfile(@Request() req: any) {
        const user = await this.usersService.findById(req.user.userId);
        if (!user) return null;
        const { password_hash, ...safeUser } = user;
        return safeUser;
    }

    @UseGuards(JwtAuthGuard)
    @Patch('me')
    async updateProfile(@Request() req: any, @Body() updateData: any) {
        const userId = req.user.userId;

        const user = await this.usersService.findOneById(userId);

        const finalUpdate: Partial<UserEntity> = {};
        const changedFields: string[] = [];

        // ── USERNAME CHANGE ──────────────────────────────────────────────────
        if (updateData.username && updateData.username.trim() !== user.username) {
            const taken = await this.usersService.isUsernameTaken(
                updateData.username.trim(),
                user.institution_id,
            );
            if (taken) {
                throw new ConflictException(
                    'That username is already taken at your institution. Please choose a different one.',
                );
            }
            finalUpdate.username = updateData.username.trim();
            changedFields.push('username');
        }

        // ── PASSWORD CHANGE ──────────────────────────────────────────────────
        if (updateData.password) {
            if (!updateData.currentPassword) {
                throw new BadRequestException('Current password is required to change your password.');
            }

            const isValid = await bcrypt.compare(updateData.currentPassword, user.password_hash);
            if (!isValid) {
                throw new UnauthorizedException('Incorrect current password.');
            }

            const salt = await bcrypt.genSalt(12);
            finalUpdate.password_hash = await bcrypt.hash(updateData.password, salt);
            changedFields.push('password');
        }

        // ── NOTIFICATION PREFERENCES (non-sensitive, no auth needed) ─────────
        const prefFields = ['notify_trading', 'notify_price_threshold', 'notify_arena_resolution'] as const;
        for (const field of prefFields) {
            if (typeof updateData[field] === 'boolean') {
                (finalUpdate as any)[field] = updateData[field];
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
            this.notificationsService.createNotification(
                userId,
                'Profile Updated',
                message,
                'SYSTEM',
                { changed_fields: changedFields },
            ).catch(() => {}); // Silently swallow notification errors
        }

        // Strip password_hash before returning
        const { password_hash, ...safeUser } = updatedUser;
        return safeUser;
    }

    @UseGuards(JwtAuthGuard)
    @Delete('me')
    async deleteMe(@Request() req: any) {
        return this.usersService.deleteUser(req.user.userId);
    }

    @Get(':id')
    async getUser(@Param('id') id: string) {
        const user = await this.usersService.findById(id);
        if (!user) return null;
        const { password_hash, ...safeUser } = user;
        return safeUser;
    }
}
