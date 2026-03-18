import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Request } from 'express';

@Injectable()
export class TosGuard implements CanActivate {
    constructor(private readonly dataSource: DataSource) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest<Request>();
        
        // Skip auth endpoints from TOS checking
        if (request.url.startsWith('/api/v1/auth')) {
            return true;
        }

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
