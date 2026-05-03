"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisPubSubService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const redis_factory_1 = require("../../config/redis.factory");
/**
 * RedisPubSubService
 *
 * Manages Redis Pub/Sub for broadcasting price updates
 * across multiple server instances (horizontal scaling).
 */
let RedisPubSubService = class RedisPubSubService {
    constructor(configService) {
        this.configService = configService;
    }
    async onModuleInit() {
        const redisUrl = this.configService.get('REDIS_URL');
        const host = this.configService.get('REDIS_HOST', 'localhost');
        const port = this.configService.get('REDIS_PORT', 6379);
        try {
            const url = redisUrl || `redis://${host}:${port}`;
            this.publisher = (0, redis_factory_1.createRedisClient)(url, 'PubSub-Publisher');
            this.subscriber = (0, redis_factory_1.createRedisClient)(url, 'PubSub-Subscriber');
            // Explicitly connect due to lazyConnect: true in factory
            await Promise.all([
                this.publisher.connect().catch(e => console.warn('PubSub Publisher connect failed:', e.message)),
                this.subscriber.connect().catch(e => console.warn('PubSub Subscriber connect failed:', e.message))
            ]);
        }
        catch (error) {
            console.error('❌ Redis Init Failure:', error);
        }
    }
    onModuleDestroy() {
        this.publisher?.disconnect();
        this.subscriber?.disconnect();
    }
    /**
     * Publish a price update event.
     */
    async publishPriceUpdate(tickerId, price, supply) {
        await this.publisher.publish('price_updates', JSON.stringify({ ticker_id: tickerId, price, supply, timestamp: Date.now() }));
    }
    /**
     * Publish a trade event (for the Pulse indicator).
     */
    async publishTrade(tickerId, txType, amount) {
        await this.publisher.publish('trades', JSON.stringify({ ticker_id: tickerId, tx_type: txType, amount, timestamp: Date.now() }));
    }
    /**
     * Subscribe to a Redis channel with a callback.
     */
    async subscribe(channel, callback) {
        await this.subscriber.subscribe(channel);
        this.subscriber.on('message', (ch, message) => {
            if (ch === channel)
                callback(message);
        });
    }
    /**
     * Cache a value with optional TTL.
     */
    async cacheSet(key, value, ttlSeconds) {
        if (ttlSeconds) {
            await this.publisher.set(key, value, 'EX', ttlSeconds);
        }
        else {
            await this.publisher.set(key, value);
        }
    }
    /**
     * Get a cached value.
     */
    async cacheGet(key) {
        return this.publisher.get(key);
    }
};
exports.RedisPubSubService = RedisPubSubService;
exports.RedisPubSubService = RedisPubSubService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], RedisPubSubService);
