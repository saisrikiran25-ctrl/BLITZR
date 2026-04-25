"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var TradeQueueService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TradeQueueService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const trading_service_1 = require("./trading.service");
const redis_factory_1 = require("../../config/redis.factory");

let TradeQueueService = TradeQueueService_1 = class TradeQueueService {
    constructor(configService, tradingService) {
        this.configService = configService;
        this.tradingService = tradingService;
        this.logger = new common_1.Logger(TradeQueueService_1.name);
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
        // lazyConnect:false in factory means these auto-connect immediately
        this.redisEnqueue = (0, redis_factory_1.createRedisClient)(redisUrl, 'TradeQueue-Enqueue');
        this.redisWorker = (0, redis_factory_1.createRedisClient)(redisUrl, 'TradeQueue-Worker');
        this.logger.log('Trade Queue Service initialised');
    }

    onModuleDestroy() {
        this.shuttingDown = true;
        this.redisEnqueue?.disconnect();
        this.redisWorker?.disconnect();
    }

    isReady() {
        return this.redisEnqueue && this.redisEnqueue.status === 'ready';
    }

    /**
     * Enqueue a trade. Falls back to direct execution if Redis not ready.
     * This ensures trades NEVER fail silently due to Redis connectivity.
     */
    async enqueueTrade(userId, collegeDomain, tickerId, action, quantity) {
        if (!this.isReady()) {
            this.logger.warn(`[TradeQueue] Redis not ready (status: ${this.redisEnqueue?.status}) — executing ${action} for ${tickerId} directly.`);
            if (action === 'BUY') return this.tradingService.executeBuy(userId, collegeDomain, tickerId, quantity);
            else return this.tradingService.executeSell(userId, collegeDomain, tickerId, quantity);
        }
        const payload = JSON.stringify({
            user_id: userId, college_domain: collegeDomain,
            ticker_id: tickerId, action, quantity,
            attempts: 1, enqueued_at: Date.now(),
        });
        await this.redisEnqueue.lpush(`queue:trade:${tickerId}`, payload);
        if (!this.activeWorkers.has(tickerId)) this.startWorker(tickerId);
        return { status: 'QUEUED', message: 'Trade is being processed.' };
    }

    startWorker(tickerId) {
        this.activeWorkers.add(tickerId);
        this.logger.log(`Worker started for ${tickerId}`);
        setImmediate(async () => {
            const queueKey = `queue:trade:${tickerId}`;
            const processingKey = `${queueKey}:processing`;
            let lastActivityAt = Date.now();
            await this.requeueProcessing(queueKey, processingKey);
            while (!this.shuttingDown) {
                let raw = null;
                try {
                    raw = await this.redisWorker.brpoplpush(queueKey, processingKey, this.popTimeoutSeconds);
                } catch (err) {
                    this.logger.error(`Worker brpoplpush error for ${tickerId}: ${err.message}`);
                    await new Promise(r => setTimeout(r, 1000));
                    continue;
                }
                if (!raw) {
                    const idleForMs = Date.now() - lastActivityAt;
                    if (idleForMs >= this.idleShutdownSeconds * 1000) {
                        const [queueLength, processingLength] = await Promise.all([
                            this.redisWorker.llen(queueKey),
                            this.redisWorker.llen(processingKey),
                        ]);
                        if (queueLength === 0 && processingLength === 0) break;
                    }
                    continue;
                }
                lastActivityAt = Date.now();
                let trade;
                try {
                    const p = JSON.parse(raw);
                    if (!p) throw new Error('null payload');
                    const errs = [];
                    if (typeof p.user_id !== 'string') errs.push('user_id');
                    if (typeof p.college_domain !== 'string') errs.push('college_domain');
                    if (typeof p.ticker_id !== 'string') errs.push('ticker_id');
                    if (p.action !== 'BUY' && p.action !== 'SELL') errs.push('action');
                    if (typeof p.quantity !== 'number' || !Number.isFinite(p.quantity)) errs.push('quantity');
                    if (errs.length) throw new Error(`Invalid trade payload: ${errs.join(', ')}`);
                    trade = { ...p, attempts: p.attempts ?? 1 };
                } catch (err) {
                    this.logger.error(`Parse error for ${tickerId}: ${err.message}`);
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

    async processTrade(trade) {
        if (trade.action === 'BUY') await this.tradingService.executeBuy(trade.user_id, trade.college_domain, trade.ticker_id, trade.quantity);
        else await this.tradingService.executeSell(trade.user_id, trade.college_domain, trade.ticker_id, trade.quantity);
    }

    async handleTradeFailure(trade, raw, queueKey, processingKey, err) {
        const nextAttempts = trade.attempts + 1;
        const message = err instanceof Error ? err.message : String(err);
        this.logger.error(`Trade failed for ${trade.ticker_id} (${trade.action} x${trade.quantity} by ${trade.user_id}): ${message}`);
        if (nextAttempts <= this.maxAttemptCount) {
            await this.redisWorker.lpush(queueKey, JSON.stringify({ ...trade, attempts: nextAttempts }));
            this.logger.warn(`Requeued ${trade.ticker_id} attempt ${nextAttempts}/${this.maxAttemptCount}`);
        } else {
            this.logger.error(`Trade ${trade.ticker_id} dropped after ${this.maxAttemptCount} attempts.`);
        }
        await this.acknowledgeTrade(processingKey, raw);
    }

    async requeueProcessing(queueKey, processingKey) {
        let moved = 0;
        while (!this.shuttingDown) {
            const raw = await this.redisWorker.rpoplpush(processingKey, queueKey);
            if (!raw) break;
            moved++;
        }
        if (moved > 0) this.logger.warn(`Requeued ${moved} in-flight trade(s) after worker restart.`);
    }

    async acknowledgeTrade(processingKey, raw) {
        await this.redisWorker.lrem(processingKey, 1, raw);
    }
};
exports.TradeQueueService = TradeQueueService;
exports.TradeQueueService = TradeQueueService = TradeQueueService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService, trading_service_1.TradingService])
], TradeQueueService);
