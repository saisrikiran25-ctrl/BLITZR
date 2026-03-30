import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { Request } from 'express';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class TosGuard implements CanActivate {
    constructor(
        private readonly dataSource: DataSource,
        private readonly reflector: Reflector,
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (isPublic) {
            return true;
        }

        const request = context.switchToHttp().getRequest<Request>();

        const user: any = request.user;
        if (!user || !user.userId) {
            // If user is not attached yet (e.g., public route without JWT guard)
            // It might be handled by JwtAuthGuard later, but we let it pass TOS guard
            return true; 
        }

        const res = await this.dataSource.query(
            'SELECT tos_accepted FROM users WHERE user_id = $1',
            [user.userId]
        );

        if (res.length > 0 && res[0].tos_accepted) {
            return true;
        }

        throw new ForbiddenException('Please accept the Terms of Service to continue.');
    }
}
