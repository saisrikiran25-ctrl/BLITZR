import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
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
 *  - One worker per active ticker pops trades with BLPOP (blocking pop)
 *  - Each worker calls TradingService.executeBuy/Sell which still uses
 *    a PG transaction as a secondary safety net
 */
@Injectable()
export class TradeQueueService implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(TradeQueueService.name);
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

            while (!this.shuttingDown) {
                try {
                    // BRPOP with 2-second timeout (unblocks to check shuttingDown)
                    const result = await this.redisWorker.brpop(queueKey, 2);

                    if (!result) {
                        // Timeout — check if queue is empty and stop worker
                        const queueLength = await this.redisWorker.llen(queueKey);
                        if (queueLength === 0) {
                            break;
                        }
                        continue;
                    }

                    const [, raw] = result;
                    const trade = JSON.parse(raw) as {
                        user_id: string;
                        college_domain: string;
                        ticker_id: string;
                        action: 'BUY' | 'SELL';
                        quantity: number;
                    };

                    await this.processTrade(trade);
                } catch (err) {
                    this.logger.error(`Worker error for ${tickerId}:`, err);
                }
            }

            this.activeWorkers.delete(tickerId);
            this.logger.log(`Worker stopped for ${tickerId}`);
        });
    }

    /**
     * Process a single trade by delegating to TradingService.
     */
    private async processTrade(trade: {
        user_id: string;
        college_domain: string;
        ticker_id: string;
        action: 'BUY' | 'SELL';
        quantity: number;
    }) {
        try {
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
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            this.logger.error(
                `Trade failed for ${trade.ticker_id} (${trade.action} x${trade.quantity} by ${trade.user_id}): ${message}`,
            );
        }
    }
}
