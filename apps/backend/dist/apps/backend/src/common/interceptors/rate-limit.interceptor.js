"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RateLimitInterceptor = void 0;
const common_1 = require("@nestjs/common");
/**
 * Rate limit interceptor.
 * Maximum 5 trades per minute per user (per PRD §7.2).
 * Uses an in-memory store; use Redis in production for horizontal scaling.
 */
let RateLimitInterceptor = class RateLimitInterceptor {
    constructor() {
        this.store = new Map();
        this.maxRequests = 5;
        this.windowMs = 60 * 1000; // 1 minute
    }
    intercept(context, next) {
        const request = context.switchToHttp().getRequest();
        const userId = request.user?.userId;
        if (!userId)
            return next.handle();
        const now = Date.now();
        const key = `rate:${userId}`;
        const entry = this.store.get(key);
        if (!entry || now > entry.resetAt) {
            this.store.set(key, { count: 1, resetAt: now + this.windowMs });
        }
        else if (entry.count >= this.maxRequests) {
            throw new common_1.HttpException(`Rate limit exceeded: max ${this.maxRequests} trades per minute`, common_1.HttpStatus.TOO_MANY_REQUESTS);
        }
        else {
            entry.count++;
        }
        return next.handle();
    }
};
exports.RateLimitInterceptor = RateLimitInterceptor;
exports.RateLimitInterceptor = RateLimitInterceptor = __decorate([
    (0, common_1.Injectable)()
], RateLimitInterceptor);
