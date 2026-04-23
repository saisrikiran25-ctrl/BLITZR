import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TickerEntity } from '../ipo/entities/ticker.entity';
import Redis from 'ioredis';
import { ConfigService } from '@nestjs/config';
import { createRedisClient } from '../../config/redis.factory';

@Injectable()
export class UnfreezeService implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(UnfreezeService.name);
    private redisClient: Redis;

    constructor(
        @InjectRepository(TickerEntity)
        private tickerRepo: Repository<TickerEntity>,
        private readonly configService: ConfigService,
    ) { }

    onModuleInit() {
        const redisUrl = this.configService.get<string>('REDIS_URL', 'redis://localhost:6379');
        this.redisClient = createRedisClient(redisUrl, 'Unfreeze');
    }

    onModuleDestroy() {
        this.redisClient?.disconnect();
    }

    @Cron('0 * * * * *')
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
            ticker.frozen_until = null as any;
            await this.tickerRepo.save(ticker);
        }
    }
}
