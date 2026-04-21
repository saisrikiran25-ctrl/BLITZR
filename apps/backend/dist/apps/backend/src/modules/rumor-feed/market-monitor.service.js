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
var MarketMonitorService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MarketMonitorService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const typeorm_1 = require("typeorm");
const config_1 = require("@nestjs/config");
const ioredis_1 = __importDefault(require("ioredis"));
const bonding_curve_service_1 = require("../ipo/bonding-curve.service");
const notification_service_1 = require("../../common/services/notification.service");
let MarketMonitorService = MarketMonitorService_1 = class MarketMonitorService {
    constructor(dataSource, bondingCurve, notificationService, configService) {
        this.dataSource = dataSource;
        this.bondingCurve = bondingCurve;
        this.notificationService = notificationService;
        this.configService = configService;
        this.logger = new common_1.Logger(MarketMonitorService_1.name);
    }
    onModuleInit() {
        const redisUrl = this.configService.get('REDIS_URL', 'redis://localhost:6379');
        this.redisClient = new ioredis_1.default(redisUrl);
    }
    onModuleDestroy() {
        this.redisClient?.disconnect();
    }
    async startMarketMonitor(postId, tickers, priceSnapshot, authorId) {
        const monitorData = {
            ticker_ids: tickers,
            price_at_publish: priceSnapshot,
            published_at: Date.now(),
            checks_done: 0,
            author_id: authorId,
        };
        await this.redisClient.set(`monitor:post:${postId}`, JSON.stringify(monitorData), 'EX', 1800);
        await this.redisClient.zadd('monitor:queue', Date.now() + 120000, postId);
    }
    async processMonitorQueue() {
        const now = Date.now();
        const postIds = await this.redisClient.zrangebyscore('monitor:queue', 0, now);
        for (const postId of postIds) {
            await this.redisClient.zrem('monitor:queue', postId);
            const raw = await this.redisClient.get(`monitor:post:${postId}`);
            if (!raw)
                continue;
            const monitorData = JSON.parse(raw);
            monitorData.checks_done += 1;
            let triggered = false;
            for (const tickerId of monitorData.ticker_ids) {
                const [ticker] = await this.dataSource.query(`SELECT current_supply, owner_id FROM tickers WHERE ticker_id = $1`, [tickerId]);
                if (!ticker)
                    continue;
                const priceNow = this.bondingCurve.getPrice(Number(ticker.current_supply));
                const priceAtPublish = monitorData.price_at_publish[tickerId];
                if (!priceAtPublish)
                    continue;
                const changePct = Math.abs(((priceNow - priceAtPublish) / priceAtPublish) * 100);
                if (changePct > 15) {
                    await this.dataSource.query(`UPDATE rumor_posts
                         SET visibility = 'PENDING', market_impact_triggered = true
                         WHERE post_id = $1`, [postId]);
                    await this.dataSource.query(`INSERT INTO moderation_queue (flag_type, post_id, ticker_id, meta)
                         VALUES ($1, $2, $3, $4)`, [
                        'MARKET_MANIPULATION_SUSPECTED',
                        postId,
                        tickerId,
                        JSON.stringify({
                            price_at_publish: priceAtPublish,
                            price_now: priceNow,
                            change_pct: changePct,
                            time_elapsed_minutes: Math.floor((Date.now() - monitorData.published_at) / 60000),
                        }),
                    ]);
                    await this.notificationService.sendAdminAlert(`⚠️ Post may have moved ${tickerId} by ${changePct.toFixed(1)}%. Review needed.`);
                    await this.notificationService.send(ticker.owner_id, {
                        title: 'Your Clout Score is Protected',
                        body: 'A post affecting your score is under review.',
                    });
                    await this.dataSource.query(`UPDATE users
                         SET credibility_score = GREATEST(0, credibility_score - 20)
                         WHERE user_id = $1`, [monitorData.author_id]);
                    // L3 Circuit Breaker: Halt trading for 30 minutes
                    await this.dataSource.query(`UPDATE tickers
                         SET status = 'AUTO_FROZEN',
                             frozen_until = NOW() + INTERVAL '30 minutes',
                             updated_at = NOW()
                         WHERE ticker_id = $1`, [tickerId]);
                    this.logger.warn(`CIRCUIT_BREAKER_TRIGGERED: ${tickerId} halted for 30m due to post ${postId}`);
                    triggered = true;
                    await this.redisClient.del(`monitor:post:${postId}`);
                    break;
                }
            }
            if (!triggered && monitorData.checks_done < 15) {
                await this.redisClient.set(`monitor:post:${postId}`, JSON.stringify(monitorData), 'EX', 1800);
                await this.redisClient.zadd('monitor:queue', Date.now() + 120000, postId);
            }
        }
    }
};
exports.MarketMonitorService = MarketMonitorService;
__decorate([
    (0, schedule_1.Cron)('0 */2 * * * *'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], MarketMonitorService.prototype, "processMonitorQueue", null);
exports.MarketMonitorService = MarketMonitorService = MarketMonitorService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeorm_1.DataSource,
        bonding_curve_service_1.BondingCurveService,
        notification_service_1.NotificationService,
        config_1.ConfigService])
], MarketMonitorService);
