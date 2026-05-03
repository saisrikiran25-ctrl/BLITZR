import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
/**
 * RedisPubSubService
 *
 * Manages Redis Pub/Sub for broadcasting price updates
 * across multiple server instances (horizontal scaling).
 */
export declare class RedisPubSubService implements OnModuleInit, OnModuleDestroy {
    private readonly configService;
    private publisher;
    private subscriber;
    constructor(configService: ConfigService);
    onModuleInit(): Promise<void>;
    onModuleDestroy(): void;
    /**
     * Publish a price update event.
     */
    publishPriceUpdate(tickerId: string, price: number, supply: number): Promise<void>;
    /**
     * Publish a trade event (for the Pulse indicator).
     */
    publishTrade(tickerId: string, txType: string, amount: number): Promise<void>;
    /**
     * Subscribe to a Redis channel with a callback.
     */
    subscribe(channel: string, callback: (message: string) => void): Promise<void>;
    /**
     * Cache a value with optional TTL.
     */
    cacheSet(key: string, value: string, ttlSeconds?: number): Promise<void>;
    /**
     * Get a cached value.
     */
    cacheGet(key: string): Promise<string | null>;
}
