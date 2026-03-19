import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { TradingService } from './trading.service';

type TradePayload = {
    user_id: string;
    college_domain: string;
    ticker_id: string;
    action: 'BUY' | 'SELL';
    quantity: number;
    // Retry counter stored with the queue payload to avoid lost trades.
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
 */
@Injectable()
export class TradeQueueService implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(TradeQueueService.name);
    // Keep idle workers around briefly to absorb bursty trade traffic.
    private idleShutdownSeconds = 5 * 60;
    private popTimeoutSeconds = 2;
    private maxRetryAttempts = 3;
    private redisEnqueue: Redis;
    private redisWorker: Redis;
    private activeWorkers = new Set<string>();
    private shuttingDown = false;

    constructor(
        private readonly configService: ConfigService,
        private readonly tradingService: TradingService,
    ) {}

    onModuleInit() {
        const redisUrl = this.configService.get<string>('REDIS_URL', 'redis://localhost:6379');
        this.idleShutdownSeconds = this.configService.get<number>(
            'TRADE_QUEUE_IDLE_SHUTDOWN_SECONDS',
            this.idleShutdownSeconds,
        );
        this.popTimeoutSeconds = this.configService.get<number>(
            'TRADE_QUEUE_POP_TIMEOUT_SECONDS',
            this.popTimeoutSeconds,
        );
        this.maxRetryAttempts = this.configService.get<number>(
            'TRADE_QUEUE_MAX_RETRY_ATTEMPTS',
            this.maxRetryAttempts,
        );

        this.redisEnqueue = new Redis(redisUrl);
        this.redisWorker = new Redis(redisUrl);
        this.logger.log('Trade Queue Service initialised');
    }

    onModuleDestroy() {
        this.shuttingDown = true;
        this.redisEnqueue?.disconnect();
        this.redisWorker?.disconnect();
    }

    /**
     * Enqueue a trade and spin up a worker for this ticker if one isn't running.
     * Returns immediately — client receives QUEUED status.
     */
    async enqueueTrade(
        userId: string,
        collegeDomain: string,
        tickerId: string,
        action: 'BUY' | 'SELL',
        quantity: number,
    ): Promise<{ status: 'QUEUED'; message: string }> {
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

        // Spin up a worker for this ticker if not already running
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

            // Only requeue when starting a fresh worker for this ticker.
            await this.requeueProcessing(queueKey, processingKey);

            while (!this.shuttingDown) {
                let raw: string | null = null;

                try {
                    // BRPOPLPUSH with timeout (unblocks to check shuttingDown)
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
                    if (
                        !parsedTrade ||
                        typeof parsedTrade.user_id !== 'string'
                    ) {
                        validationErrors.push('user_id');
                    }
                    if (!parsedTrade || typeof parsedTrade.college_domain !== 'string') {
                        validationErrors.push('college_domain');
                    }
                    if (!parsedTrade || typeof parsedTrade.ticker_id !== 'string') {
                        validationErrors.push('ticker_id');
                    }
                    if (
                        !parsedTrade ||
                        (parsedTrade.action !== 'BUY' && parsedTrade.action !== 'SELL')
                    ) {
                        validationErrors.push('action');
                    }
                    if (
                        !parsedTrade ||
                        typeof parsedTrade.quantity !== 'number' ||
                        !Number.isFinite(parsedTrade.quantity)
                    ) {
                        validationErrors.push('quantity');
                    }
                    if (validationErrors.length > 0) {
                        throw new Error(
                            `Invalid trade payload: ${validationErrors.join(', ')}`,
                        );
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

    /**
     * Process a single trade by delegating to TradingService.
     */
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

        if (nextAttempts <= this.maxRetryAttempts) {
            const retryPayload = JSON.stringify({
                ...trade,
                attempts: nextAttempts,
            });

            // LPUSH keeps FIFO ordering because workers pop from the right.
            await this.redisWorker.lpush(queueKey, retryPayload);
            this.logger.warn(
                `Requeued trade ${trade.ticker_id} after failure (attempt ${nextAttempts}/${this.maxRetryAttempts}).`,
            );
        } else {
            this.logger.error(
                `Trade ${trade.ticker_id} (${trade.action} x${trade.quantity} by ${trade.user_id}) failed after ${this.maxRetryAttempts} attempt(s); dropping from queue.`,
            );
        }

        await this.acknowledgeTrade(processingKey, raw);
    }

    private async requeueProcessing(queueKey: string, processingKey: string) {
        let moved = 0;

        while (!this.shuttingDown) {
            const raw = await this.redisWorker.rpoplpush(processingKey, queueKey);
            if (!raw) {
                break;
            }
            moved += 1;
        }

        if (moved > 0) {
            this.logger.warn(
                `Requeued ${moved} in-flight trade(s) for ${queueKey} after worker restart.`,
            );
        }
    }

    private async acknowledgeTrade(processingKey: string, raw: string) {
        await this.redisWorker.lrem(processingKey, 1, raw);
    }
}
