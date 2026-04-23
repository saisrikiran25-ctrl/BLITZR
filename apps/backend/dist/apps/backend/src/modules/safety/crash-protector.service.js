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
var CrashProtectorService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CrashProtectorService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const ticker_entity_1 = require("../ipo/entities/ticker.entity");
const bonding_curve_service_1 = require("../ipo/bonding-curve.service");
const notification_service_1 = require("../../common/services/notification.service");
const config_1 = require("@nestjs/config");
const redis_factory_1 = require("../../config/redis.factory");
let CrashProtectorService = CrashProtectorService_1 = class CrashProtectorService {
    constructor(tickerRepo, dataSource, bondingCurve, notificationService, configService) {
        this.tickerRepo = tickerRepo;
        this.dataSource = dataSource;
        this.bondingCurve = bondingCurve;
        this.notificationService = notificationService;
        this.configService = configService;
        this.logger = new common_1.Logger(CrashProtectorService_1.name);
    }
    onModuleInit() {
        const redisUrl = this.configService.get('REDIS_URL', 'redis://localhost:6379');
        this.redisClient = (0, redis_factory_1.createRedisClient)(redisUrl, 'CrashProtector');
    }
    onModuleDestroy() {
        this.redisClient?.disconnect();
    }
    async handleCron() {
        this.logger.debug('Running Crash Protector Scan (5 min interval)...');
        // Find all active tickers
        const activeTickers = await this.tickerRepo.find({
            where: { status: 'ACTIVE' },
            relations: ['owner'],
            select: ['ticker_id', 'current_supply', 'owner_id', 'status', 'price_open', 'frozen_until'],
        });
        for (const ticker of activeTickers) {
            const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
            const [txYesterday] = await this.dataSource.query(`SELECT price_at_execution FROM transactions
                 WHERE ticker_id = $1 AND created_at <= $2
                 ORDER BY created_at DESC
                 LIMIT 1`, [ticker.ticker_id, twentyFourHoursAgo]);
            // Fall back to session price_open if no 24h transaction exists
            // (protects new/low-volume tickers that might not have traded yet)
            let baslinePrice = txYesterday?.price_at_execution
                ? Number(txYesterday.price_at_execution)
                : null;
            if (!baslinePrice) {
                // Use price_open as fallback baseline
                baslinePrice = Number(ticker.price_open) || null;
            }
            if (!baslinePrice) {
                continue;
            }
            const priceNow = this.bondingCurve.getPrice(Number(ticker.current_supply));
            const priceThen = baslinePrice;
            const changePct = ((priceNow - priceThen) / priceThen) * 100;
            if (changePct <= -25) {
                this.logger.warn(`CRASH DETECTED: ${ticker.ticker_id} dropped ${changePct.toFixed(2)}%`);
                const freezeTimestamp = new Date(Date.now() + 60 * 60 * 1000);
                ticker.status = 'AUTO_FROZEN';
                ticker.frozen_until = freezeTimestamp;
                await this.tickerRepo.save(ticker);
                await this.notificationService.send(ticker.owner_id, {
                    title: 'Your Clout Score is Protected',
                    body: 'Your score was moving fast. Markets resume in 60 minutes.',
                });
                const holders = await this.dataSource.query(`SELECT DISTINCT user_id FROM transactions WHERE ticker_id = $1 AND tx_type = 'BUY'`, [ticker.ticker_id]);
                for (const holder of holders) {
                    await this.notificationService.send(holder.user_id, {
                        title: 'Market Paused',
                        body: `${ticker.ticker_id} is temporarily paused due to high volatility.`,
                    });
                }
                await this.redisClient.set(`unfreeze:${ticker.ticker_id}`, 'true', 'EX', 3600);
            }
        }
    }
};
exports.CrashProtectorService = CrashProtectorService;
__decorate([
    (0, schedule_1.Cron)('0 */5 * * * *'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CrashProtectorService.prototype, "handleCron", null);
exports.CrashProtectorService = CrashProtectorService = CrashProtectorService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(ticker_entity_1.TickerEntity)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.DataSource,
        bonding_curve_service_1.BondingCurveService,
        notification_service_1.NotificationService,
        config_1.ConfigService])
], CrashProtectorService);
