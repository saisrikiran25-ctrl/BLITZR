import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { TickerEntity } from '../ipo/entities/ticker.entity';
import { BondingCurveService } from '../ipo/bonding-curve.service';
import { NotificationService } from '../../common/services/notification.service';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { createRedisClient } from '../../config/redis.factory';

@Injectable()
export class CrashProtectorService implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(CrashProtectorService.name);
    private redisClient: Redis;

    constructor(
        @InjectRepository(TickerEntity)
        private tickerRepo: Repository<TickerEntity>,
        private readonly dataSource: DataSource,
        private readonly bondingCurve: BondingCurveService,
        private readonly notificationService: NotificationService,
        private readonly configService: ConfigService,
    ) { }

    onModuleInit() {
        const redisUrl = this.configService.get<string>('REDIS_URL', 'redis://localhost:6379');
        this.redisClient = createRedisClient(redisUrl, 'CrashProtector');
    }

    onModuleDestroy() {
        this.redisClient?.disconnect();
    }

    @Cron('0 */5 * * * *')
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
            const [txYesterday] = await this.dataSource.query(
                `SELECT price_at_execution FROM transactions
                 WHERE ticker_id = $1 AND created_at <= $2
                 ORDER BY created_at DESC
                 LIMIT 1`,
                [ticker.ticker_id, twentyFourHoursAgo],
            );

            // Fall back to session price_open if no 24h transaction exists
            // (protects new/low-volume tickers that might not have traded yet)
            let baslinePrice: number | null = txYesterday?.price_at_execution
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

                const holders = await this.dataSource.query(
                    `SELECT DISTINCT user_id FROM transactions WHERE ticker_id = $1 AND tx_type = 'BUY'`,
                    [ticker.ticker_id],
                );
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
}
