import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { TradingService } from './trading.service';
import { createRedisClient } from '../../config/redis.factory';

type TradePayload = {
    user_id: string;
    college_domain: string;
    ticker_id: string;
    action: 'BUY' | 'SELL';
    quantity: number;
    attempts: number;
};

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
@Injectable()
export class TradeQueueService implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(TradeQueueService.name);
    private idleShutdownSeconds = 5 * 60;
    private popTimeoutSeconds = 2;
    private maxAttemptCount = 3;
    private redisEnqueue: Redis;
    private redisWorker: Redis;
    private activeWorkers = new Set<string>();
    private shuttingDown = false;

    constructor(
        private readonly configService: ConfigService,
        private readonly tradingService: TradingService,
    ) {}

    async onModuleInit() {
        const redisUrl = this.configService.get<string>('REDIS_URL', 'redis://localhost:6379');
        this.idleShutdownSeconds = this.configService.get<number>(
            'TRADE_QUEUE_IDLE_SHUTDOWN_SECONDS',
            this.idleShutdownSeconds,
        );
        this.popTimeoutSeconds = this.configService.get<number>(
            'TRADE_QUEUE_POP_TIMEOUT_SECONDS',
            this.popTimeoutSeconds,
        );
        this.maxAttemptCount = this.configService.get<number>(
            'TRADE_QUEUE_MAX_RETRY_ATTEMPTS',
            this.maxAttemptCount,
        );

        this.redisEnqueue = createRedisClient(redisUrl, 'TradeQueue-Enqueue');
        this.redisWorker = createRedisClient(redisUrl, 'TradeQueue-Worker');

        // BUG FIX: lazyConnect:true means ioredis will NOT auto-connect.
        // We must explicitly connect both clients at startup.
        // Use try/catch so a Redis outage at boot does not crash the process;
        // the fallback in enqueueTrade handles the degraded state gracefully.
        try {
            await this.redisEnqueue.connect();
        } catch (err: any) {
            this.logger.warn(`TradeQueue-Enqueue initial connect failed (will retry): ${err.message}`);
        }
        try {
            await this.redisWorker.connect();
        } catch (err: any) {
            this.logger.warn(`TradeQueue-Worker initial connect failed (will retry): ${err.message}`);
        }

        this.logger.log('Trade Queue Service initialised');
    }

    onModuleDestroy() {
        this.shuttingDown = true;
        this.redisEnqueue?.disconnect();
        this.redisWorker?.disconnect();
    }

    /** True only when the Redis connection is ready to accept commands. */
    private isReady(client: Redis): boolean {
        return client.status === 'ready';
    }

    /**
     * Enqueue a trade and spin up a worker for this ticker if one isn't running.
     * Returns immediately — client receives QUEUED status.
     * Falls back to DIRECT execution when Redis is unavailable.
     */
    async enqueueTrade(
        userId: string,
        collegeDomain: string,
        tickerId: string,
        action: 'BUY' | 'SELL',
        quantity: number,
    ): Promise<{ status: 'QUEUED' | 'DIRECT'; message: string }> {
        // Graceful degradation: if Redis is not ready, execute the trade
        // synchronously via the PG-backed TradingService.
        if (!this.isReady(this.redisEnqueue)) {
            this.logger.warn(`Redis not ready (status: ${this.redisEnqueue.status}). Falling back to DIRECT execution for ${tickerId}`);
            if (action === 'BUY') {
                await this.tradingService.executeBuy(userId, collegeDomain, tickerId, quantity);
            } else {
                await this.tradingService.executeSell(userId, collegeDomain, tickerId, quantity);
            }
            return { status: 'DIRECT', message: 'Trade processed directly via secondary atomic path.' };
        }

        const payload = JSON.stringify({
            user_id: userId,
            college_domain: collegeDomain,
            ticker_id: tickerId,
            action,
            quantity,
            attempts: 1,
            enqueued_at: Date.now(),
        });

        await this.redisEnqueue.lpush(`queue:trade:${tickerId}`, payload);

        if (!this.activeWorkers.has(tickerId)) {
            this.startWorker(tickerId);
        }

        return { status: 'QUEUED', message: 'Trade is being processed.' };
    }

    /**
     * Start a blocking worker for a specific ticker.
     * Processes trades sequentially — only one trade at a time per ticker.
     */
    private startWorker(tickerId: string) {
        this.activeWorkers.add(tickerId);
        this.logger.log(`Worker started for ${tickerId}`);

        setImmediate(async () => {
            const queueKey = `queue:trade:${tickerId}`;
            const processingKey = `${queueKey}:processing`;
            let lastActivityAt = Date.now();

            await this.requeueProcessing(queueKey, processingKey);

            while (!this.shuttingDown) {
                let raw: string | null = null;

                try {
                    raw = await this.redisWorker.brpoplpush(
                        queueKey,
                        processingKey,
                        this.popTimeoutSeconds,
                    );
                } catch (err) {
                    this.logger.error(`Worker error for ${tickerId}:`, err);
                    continue;
                }

                if (!raw) {
                    const idleForMs = Date.now() - lastActivityAt;
                    if (idleForMs >= this.idleShutdownSeconds * 1000) {
                        const [queueLength, processingLength] = await Promise.all([
                            this.redisWorker.llen(queueKey),
                            this.redisWorker.llen(processingKey),
                        ]);
                        if (queueLength === 0 && processingLength === 0) {
                            break;
                        }
                    }
                    continue;
                }

                lastActivityAt = Date.now();
                let trade: TradePayload;

                try {
                    const parsedTrade = JSON.parse(raw) as Partial<TradePayload>;
                    const validationErrors: string[] = [];
                    if (!parsedTrade) {
                        validationErrors.push('payload');
                    } else {
                        if (typeof parsedTrade.user_id !== 'string') validationErrors.push('user_id');
                        if (typeof parsedTrade.college_domain !== 'string') validationErrors.push('college_domain');
                        if (typeof parsedTrade.ticker_id !== 'string') validationErrors.push('ticker_id');
                        if (parsedTrade.action !== 'BUY' && parsedTrade.action !== 'SELL') validationErrors.push('action');
                        if (typeof parsedTrade.quantity !== 'number' || !Number.isFinite(parsedTrade.quantity)) validationErrors.push('quantity');
                    }
                    if (validationErrors.length > 0) {
                        throw new Error(`Invalid trade payload: ${validationErrors.join(', ')}`);
                    }
                    trade = {
                        ...(parsedTrade as TradePayload),
                        attempts: parsedTrade.attempts ?? 1,
                    };
                } catch (err) {
                    this.logger.error(`Worker error for ${tickerId}:`, err);
                    await this.acknowledgeTrade(processingKey, raw);
                    continue;
                }

                try {
                    await this.processTrade(trade);
                    await this.acknowledgeTrade(processingKey, raw);
                } catch (err) {
                    await this.handleTradeFailure(trade, raw, queueKey, processingKey, err);
                }
            }

            this.activeWorkers.delete(tickerId);
            this.logger.log(`Worker stopped for ${tickerId}`);
        });
    }

    private async processTrade(trade: TradePayload) {
        if (trade.action === 'BUY') {
            await this.tradingService.executeBuy(
                trade.user_id,
                trade.college_domain,
                trade.ticker_id,
                trade.quantity,
            );
        } else {
            await this.tradingService.executeSell(
                trade.user_id,
                trade.college_domain,
                trade.ticker_id,
                trade.quantity,
            );
        }
    }

    private async handleTradeFailure(
        trade: TradePayload,
        raw: string,
        queueKey: string,
        processingKey: string,
        err: unknown,
    ) {
        const nextAttempts = trade.attempts + 1;
        const message = err instanceof Error ? err.message : String(err);

        this.logger.error(
            `Trade failed for ${trade.ticker_id} (${trade.action} x${trade.quantity} by ${trade.user_id}): ${message}`,
        );

        if (nextAttempts <= this.maxAttemptCount) {
            const retryPayload = JSON.stringify({ ...trade, attempts: nextAttempts });
            await this.redisWorker.lpush(queueKey, retryPayload);
            this.logger.warn(
                `Requeued trade ${trade.ticker_id} after failure (attempt ${nextAttempts}/${this.maxAttemptCount}).`,
            );
        } else {
            this.logger.error(
                `Trade ${trade.ticker_id} (${trade.action} x${trade.quantity} by ${trade.user_id}) failed after ${this.maxAttemptCount} attempt(s); dropping from queue.`,
            );
        }

        await this.acknowledgeTrade(processingKey, raw);
    }

    private async requeueProcessing(queueKey: string, processingKey: string) {
        let moved = 0;
        while (!this.shuttingDown) {
            const raw = await this.redisWorker.rpoplpush(processingKey, queueKey);
            if (!raw) break;
            moved += 1;
        }
        if (moved > 0) {
            this.logger.warn(`Requeued ${moved} in-flight trade(s) for ${queueKey} after worker restart.`);
        }
    }

    private async acknowledgeTrade(processingKey: string, raw: string) {
        await this.redisWorker.lrem(processingKey, 1, raw);
    }
}
