import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { BondingCurveService } from '../ipo/bonding-curve.service';
import { NotificationService } from '../../common/services/notification.service';

interface MonitorData {
    ticker_ids: string[];
    price_at_publish: Record<string, number>;
    published_at: number;
    checks_done: number;
    author_id: string;
}

@Injectable()
export class MarketMonitorService implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(MarketMonitorService.name);
    private redisClient: Redis;

    constructor(
        private readonly dataSource: DataSource,
        private readonly bondingCurve: BondingCurveService,
        private readonly notificationService: NotificationService,
        private readonly configService: ConfigService,
    ) { }

    onModuleInit() {
        const redisUrl = this.configService.get<string>('REDIS_URL', 'redis://localhost:6379');
        this.redisClient = new Redis(redisUrl);
    }

    onModuleDestroy() {
        this.redisClient?.disconnect();
    }

    async startMarketMonitor(postId: string, tickers: string[], priceSnapshot: Record<string, number>, authorId: string) {
        const monitorData: MonitorData = {
            ticker_ids: tickers,
            price_at_publish: priceSnapshot,
            published_at: Date.now(),
            checks_done: 0,
            author_id: authorId,
        };

        await this.redisClient.set(
            `monitor:post:${postId}`,
            JSON.stringify(monitorData),
            'EX',
            1800,
        );

        await this.redisClient.zadd(
            'monitor:queue',
            Date.now() + 120000,
            postId,
        );
    }

    @Cron('0 */2 * * * *')
    async processMonitorQueue() {
        const now = Date.now();
        const postIds = await this.redisClient.zrangebyscore('monitor:queue', 0, now);

        for (const postId of postIds) {
            await this.redisClient.zrem('monitor:queue', postId);

            const raw = await this.redisClient.get(`monitor:post:${postId}`);
            if (!raw) continue;

            const monitorData: MonitorData = JSON.parse(raw);
            monitorData.checks_done += 1;

            let triggered = false;

            for (const tickerId of monitorData.ticker_ids) {
                const [ticker] = await this.dataSource.query(
                    `SELECT current_supply, owner_id FROM tickers WHERE ticker_id = $1`,
                    [tickerId],
                );
                if (!ticker) continue;

                const priceNow = this.bondingCurve.getPrice(Number(ticker.current_supply));
                const priceAtPublish = monitorData.price_at_publish[tickerId];
                if (!priceAtPublish) continue;

                const changePct = Math.abs(((priceNow - priceAtPublish) / priceAtPublish) * 100);

                if (changePct > 15) {
                    await this.dataSource.query(
                        `UPDATE rumor_posts
                         SET visibility = 'PENDING', market_impact_triggered = true
                         WHERE post_id = $1`,
                        [postId],
                    );

                    await this.dataSource.query(
                        `INSERT INTO moderation_queue (flag_type, post_id, ticker_id, meta)
                         VALUES ($1, $2, $3, $4)`,
                        [
                            'MARKET_MANIPULATION_SUSPECTED',
                            postId,
                            tickerId,
                            JSON.stringify({
                                price_at_publish: priceAtPublish,
                                price_now: priceNow,
                                change_pct: changePct,
                                time_elapsed_minutes: Math.floor((Date.now() - monitorData.published_at) / 60000),
                            }),
                        ],
                    );

                    await this.notificationService.sendAdminAlert(
                        `⚠️ Post may have moved ${tickerId} by ${changePct.toFixed(1)}%. Review needed.`,
                    );

                    await this.notificationService.send(ticker.owner_id, {
                        title: 'Your Clout Score is Protected',
                        body: 'A post affecting your score is under review.',
                    });

                    await this.dataSource.query(
                        `UPDATE users
                         SET credibility_score = GREATEST(0, credibility_score - 20)
                         WHERE user_id = $1`,
                        [monitorData.author_id],
                    );

                    // L3 Circuit Breaker: Halt trading for 30 minutes
                    await this.dataSource.query(
                        `UPDATE tickers
                         SET status = 'AUTO_FROZEN',
                             frozen_until = NOW() + INTERVAL '30 minutes',
                             updated_at = NOW()
                         WHERE ticker_id = $1`,
                        [tickerId],
                    );

                    this.logger.warn(`CIRCUIT_BREAKER_TRIGGERED: ${tickerId} halted for 30m due to post ${postId}`);

                    triggered = true;
                    await this.redisClient.del(`monitor:post:${postId}`);
                    break;
                }
            }

            if (!triggered && monitorData.checks_done < 15) {
                await this.redisClient.set(
                    `monitor:post:${postId}`,
                    JSON.stringify(monitorData),
                    'EX',
                    1800,
                );
                await this.redisClient.zadd(
                    'monitor:queue',
                    Date.now() + 120000,
                    postId,
                );
            }
        }
    }
}
