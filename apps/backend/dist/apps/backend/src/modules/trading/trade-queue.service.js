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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var TradeQueueService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TradeQueueService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const ioredis_1 = __importDefault(require("ioredis"));
const trading_service_1 = require("./trading.service");
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
let TradeQueueService = TradeQueueService_1 = class TradeQueueService {
    constructor(configService, tradingService) {
        this.configService = configService;
        this.tradingService = tradingService;
        this.logger = new common_1.Logger(TradeQueueService_1.name);
        // Keep idle workers around briefly to absorb bursty trade traffic.
        this.idleShutdownSeconds = 5 * 60;
        this.popTimeoutSeconds = 2;
        this.maxAttemptCount = 3;
        this.activeWorkers = new Set();
        this.shuttingDown = false;
    }
    onModuleInit() {
        const redisUrl = this.configService.get('REDIS_URL', 'redis://localhost:6379');
        this.idleShutdownSeconds = this.configService.get('TRADE_QUEUE_IDLE_SHUTDOWN_SECONDS', this.idleShutdownSeconds);
        this.popTimeoutSeconds = this.configService.get('TRADE_QUEUE_POP_TIMEOUT_SECONDS', this.popTimeoutSeconds);
        this.maxAttemptCount = this.configService.get('TRADE_QUEUE_MAX_RETRY_ATTEMPTS', this.maxAttemptCount);
        this.redisEnqueue = new ioredis_1.default(redisUrl);
        this.redisWorker = new ioredis_1.default(redisUrl);
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
    async enqueueTrade(userId, collegeDomain, tickerId, action, quantity) {
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
    startWorker(tickerId) {
        this.activeWorkers.add(tickerId);
        this.logger.log(`Worker started for ${tickerId}`);
        setImmediate(async () => {
            const queueKey = `queue:trade:${tickerId}`;
            const processingKey = `${queueKey}:processing`;
            let lastActivityAt = Date.now();
            // Only requeue when starting a fresh worker for this ticker.
            await this.requeueProcessing(queueKey, processingKey);
            while (!this.shuttingDown) {
                let raw = null;
                try {
                    // BRPOPLPUSH with timeout (unblocks to check shuttingDown)
                    raw = await this.redisWorker.brpoplpush(queueKey, processingKey, this.popTimeoutSeconds);
                }
                catch (err) {
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
                let trade;
                try {
                    const parsedTrade = JSON.parse(raw);
                    const validationErrors = [];
                    if (!parsedTrade) {
                        validationErrors.push('payload');
                    }
                    else {
                        if (typeof parsedTrade.user_id !== 'string') {
                            validationErrors.push('user_id');
                        }
                        if (typeof parsedTrade.college_domain !== 'string') {
                            validationErrors.push('college_domain');
                        }
                        if (typeof parsedTrade.ticker_id !== 'string') {
                            validationErrors.push('ticker_id');
                        }
                        if (parsedTrade.action !== 'BUY' && parsedTrade.action !== 'SELL') {
                            validationErrors.push('action');
                        }
                        if (typeof parsedTrade.quantity !== 'number' ||
                            !Number.isFinite(parsedTrade.quantity)) {
                            validationErrors.push('quantity');
                        }
                    }
                    if (validationErrors.length > 0) {
                        throw new Error(`Invalid trade payload: ${validationErrors.join(', ')}`);
                    }
                    trade = {
                        ...parsedTrade,
                        attempts: parsedTrade.attempts ?? 1,
                    };
                }
                catch (err) {
                    this.logger.error(`Worker error for ${tickerId}:`, err);
                    await this.acknowledgeTrade(processingKey, raw);
                    continue;
                }
                try {
                    await this.processTrade(trade);
                    await this.acknowledgeTrade(processingKey, raw);
                }
                catch (err) {
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
    async processTrade(trade) {
        if (trade.action === 'BUY') {
            await this.tradingService.executeBuy(trade.user_id, trade.college_domain, trade.ticker_id, trade.quantity);
        }
        else {
            await this.tradingService.executeSell(trade.user_id, trade.college_domain, trade.ticker_id, trade.quantity);
        }
    }
    async handleTradeFailure(trade, raw, queueKey, processingKey, err) {
        const nextAttempts = trade.attempts + 1;
        const message = err instanceof Error ? err.message : String(err);
        this.logger.error(`Trade failed for ${trade.ticker_id} (${trade.action} x${trade.quantity} by ${trade.user_id}): ${message}`);
        if (nextAttempts <= this.maxAttemptCount) {
            const retryPayload = JSON.stringify({
                ...trade,
                attempts: nextAttempts,
            });
            // LPUSH keeps FIFO ordering because workers pop from the right.
            await this.redisWorker.lpush(queueKey, retryPayload);
            this.logger.warn(`Requeued trade ${trade.ticker_id} after failure (attempt ${nextAttempts}/${this.maxAttemptCount}).`);
        }
        else {
            this.logger.error(`Trade ${trade.ticker_id} (${trade.action} x${trade.quantity} by ${trade.user_id}) failed after ${this.maxAttemptCount} attempt(s); dropping from queue.`);
        }
        await this.acknowledgeTrade(processingKey, raw);
    }
    async requeueProcessing(queueKey, processingKey) {
        let moved = 0;
        while (!this.shuttingDown) {
            const raw = await this.redisWorker.rpoplpush(processingKey, queueKey);
            if (!raw) {
                break;
            }
            moved += 1;
        }
        if (moved > 0) {
            this.logger.warn(`Requeued ${moved} in-flight trade(s) for ${queueKey} after worker restart.`);
        }
    }
    async acknowledgeTrade(processingKey, raw) {
        await this.redisWorker.lrem(processingKey, 1, raw);
    }
};
exports.TradeQueueService = TradeQueueService;
exports.TradeQueueService = TradeQueueService = TradeQueueService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        trading_service_1.TradingService])
], TradeQueueService);
