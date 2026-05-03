import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TradingService } from './trading.service';
/**
 * B12: TradeQueueService
 *
 * Every buy/sell is enqueued to a Redis list keyed by ticker_id so that
 * trades for the same ticker are processed one-at-a-time, preventing
 * the "Priya Slap" concurrent-update race condition without relying
 * solely on PostgreSQL row locks.
 *
 * Architecture:
 *  - One LPUSH per incoming trade (O(1), returns immediately to client)
 *  - One worker per active ticker pops trades with BRPOPLPUSH (blocking pop)
 *  - Each worker acknowledges the trade after processing to avoid loss on crash
 *  - Idle workers shut down after 5 minutes of inactivity
 *  - Each worker calls TradingService.executeBuy/Sell which still uses
 *    a PG transaction as a secondary safety net
 *
 * FIX (Apr 25 2026):
 *  - BUG 1: lazyConnect:true was set but .connect() was never called in
 *    onModuleInit, leaving both redis clients permanently in a non-ready
 *    state and causing every lpush to throw
 *    "Stream isn't writeable and enableOfflineQueue options is false".
 *    Fix: explicitly await connect() after creating each client.
 *  - BUG 2: The isReady() guard now uses a helper that correctly checks
 *    the status string, preventing the race where status flips between
 *    the check and the lpush.
 */
export declare class TradeQueueService implements OnModuleInit, OnModuleDestroy {
    private readonly configService;
    private readonly tradingService;
    private readonly logger;
    private idleShutdownSeconds;
    private popTimeoutSeconds;
    private maxAttemptCount;
    private redisEnqueue;
    private redisWorker;
    private activeWorkers;
    private shuttingDown;
    constructor(configService: ConfigService, tradingService: TradingService);
    onModuleInit(): void;
    onModuleDestroy(): void;
    /** True only when the Redis connection is ready to accept commands. */
    private isReady;
    /**
     * Enqueue a trade and spin up a worker for this ticker if one isn't running.
     * Returns immediately — client receives QUEUED status.
     * Falls back to DIRECT execution when Redis is unavailable.
     */
    enqueueTrade(userId: string, collegeDomain: string, tickerId: string, action: 'BUY' | 'SELL', quantity: number): Promise<{
        status: 'QUEUED' | 'DIRECT';
        message: string;
    }>;
    /**
     * Start a blocking worker for a specific ticker.
     * Processes trades sequentially — only one trade at a time per ticker.
     */
    private startWorker;
    private processTrade;
    private handleTradeFailure;
    private requeueProcessing;
    private acknowledgeTrade;
}
