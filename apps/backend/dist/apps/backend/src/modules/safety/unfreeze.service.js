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
var UnfreezeService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnfreezeService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const ticker_entity_1 = require("../ipo/entities/ticker.entity");
const config_1 = require("@nestjs/config");
const redis_factory_1 = require("../../config/redis.factory");
let UnfreezeService = UnfreezeService_1 = class UnfreezeService {
    constructor(tickerRepo, configService) {
        this.tickerRepo = tickerRepo;
        this.configService = configService;
        this.logger = new common_1.Logger(UnfreezeService_1.name);
    }
    onModuleInit() {
        const redisUrl = this.configService.get('REDIS_URL', 'redis://localhost:6379');
        this.redisClient = (0, redis_factory_1.createRedisClient)(redisUrl);
    }
    onModuleDestroy() {
        this.redisClient?.disconnect();
    }
    async handleCron() {
        const frozenTickers = await this.tickerRepo.find({
            where: {
                status: 'AUTO_FROZEN',
            },
        });
        for (const ticker of frozenTickers) {
            const key = await this.redisClient.get(`unfreeze:${ticker.ticker_id}`);
            if (key) {
                continue;
            }
            this.logger.log(`UNFREEZING TICKER: ${ticker.ticker_id}`);
            ticker.status = 'ACTIVE';
            ticker.frozen_until = null;
            await this.tickerRepo.save(ticker);
        }
    }
};
exports.UnfreezeService = UnfreezeService;
__decorate([
    (0, schedule_1.Cron)('0 * * * * *'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], UnfreezeService.prototype, "handleCron", null);
exports.UnfreezeService = UnfreezeService = UnfreezeService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(ticker_entity_1.TickerEntity)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        config_1.ConfigService])
], UnfreezeService);
