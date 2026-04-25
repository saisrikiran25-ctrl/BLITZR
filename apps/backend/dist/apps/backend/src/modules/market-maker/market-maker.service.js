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
var MarketMakerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MarketMakerService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const typeorm_1 = require("typeorm");
const shared_1 = require("@blitzr/shared");
const realtime_gateway_1 = require("../realtime/realtime.gateway");
const bonding_curve_service_1 = require("../ipo/bonding-curve.service");
const config_1 = require("@nestjs/config");
const redis_factory_1 = require("../../config/redis.factory");

let MarketMakerService = MarketMakerService_1 = class MarketMakerService {
    constructor(dataSource, realtimeGateway, bondingCurve, configService) {
        this.dataSource = dataSource;
        this.realtimeGateway = realtimeGateway;
        this.bondingCurve = bondingCurve;
        this.configService = configService;
        this.logger = new common_1.Logger(MarketMakerService_1.name);
        // DO NOT create Redis client in constructor — env vars may not be resolved yet
    }

    onModuleInit() {
        // Create Redis client here so REDIS_URL env var is guaranteed to be resolved
        const redisUrl = this.configService.get('REDIS_URL', 'redis://localhost:6379');
        this.redisClient = (0, redis_factory_1.createRedisClient)(redisUrl, 'MarketMaker');
        this.logger.log('MarketMakerService initialised');
    }

    onModuleDestroy() {
        this.redisClient?.disconnect();
    }

    async executeMarketMaking() {
        this.logger.log('\ud83e\udd16 Market Maker bot executing...');
        try {
            const tickers = await this.dataSource.query(`SELECT ticker_id, current_supply, owner_id, college_domain, price_open, total_volume 
         FROM tickers 
         WHERE status = 'ACTIVE' 
           AND human_trades_1h < $1
         ORDER BY RANDOM() 
         LIMIT $2`, [shared_1.MARKET_MAKER_SUNSET_THRESHOLD, shared_1.MARKET_MAKER_BATCH_SIZE]);
            for (const ticker of tickers) {
                if (!ticker.college_domain) {
                    this.logger.warn(`Ticker ${ticker.ticker_id} has no college_domain — skipping market maker.`);
                    continue;
                }
                const supply = Number(ticker.current_supply);
                const currentPrice = this.bondingCurve.getPrice(supply);
                const openPrice = Number(ticker.price_open) || currentPrice;
                const botVolKey = `bot:vol:${ticker.ticker_id}:${new Date().toISOString().split('T')[0]}`;
                const botSharesTraded = Number(await this.redisClient.get(botVolKey)) || 0;
                const totalSessionVolume = Number(ticker.total_volume) || 1;
                if (botSharesTraded / totalSessionVolume > 0.05) {
                    this.logger.debug(`Bot volume cap reached for ${ticker.ticker_id}. Skipping.`);
                    continue;
                }
                let isBuy = Math.random() > 0.5;
                if (currentPrice < openPrice * 0.95) isBuy = Math.random() > 0.2;
                else if (currentPrice > openPrice * 1.05) isBuy = Math.random() < 0.2;
                const shares = this.randomInt(shared_1.MARKET_MAKER_MIN_SHARES, shared_1.MARKET_MAKER_MAX_SHARES);
                if (!isBuy && supply <= shares + 1) continue;
                let newSupply;
                if (isBuy) {
                    newSupply = supply + shares;
                    await this.dataSource.query(`UPDATE tickers SET current_supply = current_supply + $1, total_trades = total_trades + 1, updated_at = NOW() WHERE ticker_id = $2`, [shares, ticker.ticker_id]);
                } else {
                    newSupply = supply - shares;
                    await this.dataSource.query(`UPDATE tickers SET current_supply = current_supply - $1, total_trades = total_trades + 1, total_volume = total_volume + $2, updated_at = NOW() WHERE ticker_id = $3`, [shares, this.bondingCurve.getSellValue(supply, shares), ticker.ticker_id]);
                }
                await this.redisClient.incrby(botVolKey, shares);
                await this.redisClient.expire(botVolKey, 86400);
                const finalPrice = this.bondingCurve.getPrice(newSupply);
                const [updatedTicker] = await this.dataSource.query(`SELECT price_open, total_volume FROM tickers WHERE ticker_id = $1`, [ticker.ticker_id]);
                if (updatedTicker) {
                    const updatedOpen = Number(updatedTicker.price_open);
                    const changePct = updatedOpen ? Number(((finalPrice - updatedOpen) / updatedOpen * 100).toFixed(2)) : 0;
                    const volume = Number(updatedTicker.total_volume);
                    this.realtimeGateway.broadcastPriceUpdate(ticker.college_domain, ticker.ticker_id, finalPrice, newSupply, changePct, volume);
                    this.realtimeGateway.broadcastPulse(ticker.college_domain, ticker.ticker_id, isBuy ? 'BUY' : 'SELL');
                }
                this.logger.debug(`Bot ${isBuy ? 'bought' : 'sold'} ${shares} of ${ticker.ticker_id}`);
            }
            this.logger.log(`Market Maker processed ${tickers.length} tickers`);
        } catch (error) {
            this.logger.error('Market Maker error:', error.message);
        }
    }

    async resetHourlyCounters() {
        await this.dataSource.query(`UPDATE tickers SET human_trades_1h = 0 WHERE status = 'ACTIVE'`);
        this.logger.log('Reset hourly trade counters');
    }

    async resetSessionOpenPrices() {
        const tickers = await this.dataSource.query(`SELECT ticker_id, current_supply FROM tickers WHERE status = 'ACTIVE'`);
        if (!tickers.length) return;
        if (this.redisClient && this.redisClient.status === 'ready') {
            const keys = await this.redisClient.keys('bot:vol:*');
            if (keys.length > 0) await this.redisClient.del(...keys);
        }
        for (const t of tickers) {
            const supply = Number(t.current_supply);
            const currentPrice = this.bondingCurve.getPrice(supply);
            await this.dataSource.query(`UPDATE tickers SET price_open = $1 WHERE ticker_id = $2`, [currentPrice, t.ticker_id]);
        }
        this.logger.log(`\ud83c� Session open prices reset for ${tickers.length} tickers`);
    }

    randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
};
exports.MarketMakerService = MarketMakerService;
__decorate([
    (0, schedule_1.Cron)('*/2 * * * *'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], MarketMakerService.prototype, "executeMarketMaking", null);
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_HOUR),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], MarketMakerService.prototype, "resetHourlyCounters", null);
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_DAY_AT_MIDNIGHT),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], MarketMakerService.prototype, "resetSessionOpenPrices", null);
exports.MarketMakerService = MarketMakerService = MarketMakerService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeorm_1.DataSource, realtime_gateway_1.RealtimeGateway, bonding_curve_service_1.BondingCurveService, config_1.ConfigService])
], MarketMakerService);
