import { NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
/**
 * Rate limit interceptor.
 * Maximum 5 trades per minute per user (per PRD §7.2).
 * Uses an in-memory store; use Redis in production for horizontal scaling.
 */
export declare class RateLimitInterceptor implements NestInterceptor {
    private readonly store;
    private readonly maxRequests;
    private readonly windowMs;
    intercept(context: ExecutionContext, next: CallHandler): Observable<any>;
}
