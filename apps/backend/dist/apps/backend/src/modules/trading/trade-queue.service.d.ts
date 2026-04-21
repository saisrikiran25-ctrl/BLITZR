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
    /**
     * Enqueue a trade and spin up a worker for this ticker if one isn't running.
     * Returns immediately — client receives QUEUED status.
     */
    enqueueTrade(userId: string, collegeDomain: string, tickerId: string, action: 'BUY' | 'SELL', quantity: number): Promise<{
        status: 'QUEUED';
        message: string;
    }>;
    /**
     * Start a blocking worker for a specific ticker.
     * Processes trades sequentially — only one trade at a time per ticker.
     */
    private startWorker;
    /**
     * Process a single trade by delegating to TradingService.
     */
    private processTrade;
    private handleTradeFailure;
    private requeueProcessing;
    private acknowledgeTrade;
}
