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

let RedisPubSubService = class RedisPubSubService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger('RedisPubSubService');
    }

    onModuleInit() {
        const redisUrl = this.configService.get('REDIS_URL');
        const host = this.configService.get('REDIS_HOST', 'localhost');
        const port = this.configService.get('REDIS_PORT', 6379);
        const url = redisUrl || `redis://${host}:${port}`;
        // lazyConnect:false in factory — these auto-connect immediately
        this.publisher = (0, redis_factory_1.createRedisClient)(url, 'PubSub-Publisher');
        this.subscriber = (0, redis_factory_1.createRedisClient)(url, 'PubSub-Subscriber');
        this.logger.log('RedisPubSubService initialised');
    }

    onModuleDestroy() {
        this.publisher?.disconnect();
        this.subscriber?.disconnect();
    }

    async publishPriceUpdate(tickerId, price, supply) {
        if (!this.publisher || this.publisher.status !== 'ready') return;
        await this.publisher.publish('price_updates', JSON.stringify({ ticker_id: tickerId, price, supply, timestamp: Date.now() }));
    }

    async publishTrade(tickerId, txType, amount) {
        if (!this.publisher || this.publisher.status !== 'ready') return;
        await this.publisher.publish('trades', JSON.stringify({ ticker_id: tickerId, tx_type: txType, amount, timestamp: Date.now() }));
    }

    async subscribe(channel, callback) {
        if (!this.subscriber || this.subscriber.status !== 'ready') {
            this.logger.warn(`Cannot subscribe to ${channel} — subscriber not ready`);
            return;
        }
        await this.subscriber.subscribe(channel);
        this.subscriber.on('message', (ch, message) => {
            if (ch === channel) callback(message);
        });
    }

    async cacheSet(key, value, ttlSeconds) {
        if (!this.publisher || this.publisher.status !== 'ready') return;
        if (ttlSeconds) await this.publisher.set(key, value, 'EX', ttlSeconds);
        else await this.publisher.set(key, value);
    }

    async cacheGet(key) {
        if (!this.publisher || this.publisher.status !== 'ready') return null;
        return this.publisher.get(key);
    }
};
exports.RedisPubSubService = RedisPubSubService;
exports.RedisPubSubService = RedisPubSubService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], RedisPubSubService);
