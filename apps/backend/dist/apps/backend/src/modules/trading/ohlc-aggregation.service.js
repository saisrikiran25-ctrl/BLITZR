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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var OhlcAggregationService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OhlcAggregationService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const ohlc_candle_entity_1 = require("../trading/entities/ohlc-candle.entity");
/**
 * OHLC Aggregation Service
 *
 * Pre-aggregates trade data into candle buckets for chart rendering.
 * Runs on schedule to build 1m, 5m, 1h, 1d candles.
 *
 * Per PRD §6.2
 */
let OhlcAggregationService = OhlcAggregationService_1 = class OhlcAggregationService {
    constructor(candleRepo, dataSource) {
        this.candleRepo = candleRepo;
        this.dataSource = dataSource;
        this.logger = new common_1.Logger(OhlcAggregationService_1.name);
    }
    /**
     * Aggregate 1-minute candles every minute.
     */
    async aggregate1m() {
        await this.aggregateCandles('1m', 60);
    }
    /**
     * Aggregate 5-minute candles every 5 minutes.
     */
    async aggregate5m() {
        await this.aggregateCandles('5m', 300);
    }
    /**
     * Aggregate 1-hour candles every hour.
     */
    async aggregate1h() {
        await this.aggregateCandles('1h', 3600);
    }
    /**
     * Aggregate 1-day candles at midnight.
     */
    async aggregate1d() {
        await this.aggregateCandles('1d', 86400);
    }
    /**
     * Core aggregation logic.
     * Groups transactions by ticker and time bucket,
     * computes OHLC + volume, and upserts candle records.
     */
    async aggregateCandles(interval, bucketSeconds) {
        try {
            const bucketEnd = new Date();
            const bucketStart = new Date(bucketEnd.getTime() - bucketSeconds * 1000);
            // Get all trades in this bucket
            const trades = await this.dataSource.query(`SELECT ticker_id, price_at_execution, amount, created_at
         FROM transactions
         WHERE tx_type IN ('BUY', 'SELL')
           AND ticker_id IS NOT NULL
           AND created_at >= $1 AND created_at < $2
         ORDER BY created_at ASC`, [bucketStart.toISOString(), bucketEnd.toISOString()]);
            // Group by ticker
            const byTicker = {};
            for (const t of trades) {
                if (!byTicker[t.ticker_id])
                    byTicker[t.ticker_id] = [];
                byTicker[t.ticker_id].push({
                    price: Number(t.price_at_execution),
                    amount: Number(t.amount),
                });
            }
            // Build candles
            for (const [tickerId, tickerTrades] of Object.entries(byTicker)) {
                if (tickerTrades.length === 0)
                    continue;
                const prices = tickerTrades.map((t) => t.price);
                const volume = tickerTrades.reduce((sum, t) => sum + t.amount, 0);
                await this.dataSource.query(`INSERT INTO ohlc_candles (ticker_id, interval, open_price, high_price, low_price, close_price, volume, trade_count, bucket_start)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
           ON CONFLICT DO NOTHING`, [
                    tickerId,
                    interval,
                    prices[0],
                    Math.max(...prices),
                    Math.min(...prices),
                    prices[prices.length - 1],
                    volume,
                    tickerTrades.length,
                    bucketStart.toISOString(),
                ]);
            }
            if (Object.keys(byTicker).length > 0) {
                this.logger.debug(`Aggregated ${interval} candles for ${Object.keys(byTicker).length} tickers`);
            }
        }
        catch (error) {
            this.logger.error(`OHLC aggregation error (${interval}):`, error);
        }
    }
    /**
     * Get candles for a ticker (used by chart endpoints).
     */
    async getCandles(collegeDomain, tickerId, interval, limit = 100) {
        // Enforce domain isolation before yielding read-only candlestick data
        const [ticker] = await this.dataSource.query(`SELECT 1 FROM tickers WHERE ticker_id = $1 AND college_domain = $2`, [tickerId, collegeDomain]);
        if (!ticker)
            throw new common_1.ForbiddenException('Access denied to this ticker');
        return this.candleRepo.find({
            where: { ticker_id: tickerId, interval },
            order: { bucket_start: 'DESC' },
            take: limit,
        });
    }
};
exports.OhlcAggregationService = OhlcAggregationService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_MINUTE),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], OhlcAggregationService.prototype, "aggregate1m", null);
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_5_MINUTES),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], OhlcAggregationService.prototype, "aggregate5m", null);
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_HOUR),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], OhlcAggregationService.prototype, "aggregate1h", null);
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_DAY_AT_MIDNIGHT),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], OhlcAggregationService.prototype, "aggregate1d", null);
exports.OhlcAggregationService = OhlcAggregationService = OhlcAggregationService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(ohlc_candle_entity_1.OhlcCandleEntity)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.DataSource])
], OhlcAggregationService);
