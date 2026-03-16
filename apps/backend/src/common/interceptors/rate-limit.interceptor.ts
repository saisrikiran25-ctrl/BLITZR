import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
    HttpException,
    HttpStatus,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

/**
 * Rate limit interceptor.
 * Maximum 5 trades per minute per user (per PRD §7.2).
 * Uses an in-memory store; use Redis in production for horizontal scaling.
 */
@Injectable()
export class RateLimitInterceptor implements NestInterceptor {
    private readonly store = new Map<string, { count: number; resetAt: number }>();
    private readonly maxRequests = 5;
    private readonly windowMs = 60 * 1000; // 1 minute

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const request = context.switchToHttp().getRequest();
        const userId = request.user?.userId;

        if (!userId) return next.handle();

        const now = Date.now();
        const key = `rate:${userId}`;
        const entry = this.store.get(key);

        if (!entry || now > entry.resetAt) {
            this.store.set(key, { count: 1, resetAt: now + this.windowMs });
        } else if (entry.count >= this.maxRequests) {
            throw new HttpException(
                `Rate limit exceeded: max ${this.maxRequests} trades per minute`,
                HttpStatus.TOO_MANY_REQUESTS,
            );
        } else {
            entry.count++;
        }

        return next.handle();
    }
}
