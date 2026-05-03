import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { createRedisClient } from '../../config/redis.factory';

/**
 * RedisPubSubService
 * 
 * Manages Redis Pub/Sub for broadcasting price updates
 * across multiple server instances (horizontal scaling).
 */
@Injectable()
export class RedisPubSubService implements OnModuleInit, OnModuleDestroy {
    private publisher: Redis;
    private subscriber: Redis;

    constructor(private readonly configService: ConfigService) { }

    onModuleInit() {
        const redisUrl = this.configService.get<string>('REDIS_URL');
        const host = this.configService.get<string>('REDIS_HOST', 'localhost');
        const port = this.configService.get<number>('REDIS_PORT', 6379);

        try {
            const url = redisUrl || `redis://${host}:${port}`;
            this.publisher = createRedisClient(url, 'PubSub-Publisher');
            this.subscriber = createRedisClient(url, 'PubSub-Subscriber');
            
            // Non-blocking background connect
            this.publisher.connect().catch(e => console.warn('PubSub Publisher connect failed:', e.message));
            this.subscriber.connect().catch(e => console.warn('PubSub Subscriber connect failed:', e.message));
        } catch (error) {
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
    async publishPriceUpdate(tickerId: string, price: number, supply: number) {
        await this.publisher.publish(
            'price_updates',
            JSON.stringify({ ticker_id: tickerId, price, supply, timestamp: Date.now() }),
        );
    }

    /**
     * Publish a trade event (for the Pulse indicator).
     */
    async publishTrade(tickerId: string, txType: string, amount: number) {
        await this.publisher.publish(
            'trades',
            JSON.stringify({ ticker_id: tickerId, tx_type: txType, amount, timestamp: Date.now() }),
        );
    }

    /**
     * Subscribe to a Redis channel with a callback.
     */
    async subscribe(channel: string, callback: (message: string) => void) {
        await this.subscriber.subscribe(channel);
        this.subscriber.on('message', (ch, message) => {
            if (ch === channel) callback(message);
        });
    }

    /**
     * Cache a value with optional TTL.
     */
    async cacheSet(key: string, value: string, ttlSeconds?: number) {
        if (ttlSeconds) {
            await this.publisher.set(key, value, 'EX', ttlSeconds);
        } else {
            await this.publisher.set(key, value);
        }
    }

    /**
     * Get a cached value.
     */
    async cacheGet(key: string): Promise<string | null> {
        return this.publisher.get(key);
    }
}
