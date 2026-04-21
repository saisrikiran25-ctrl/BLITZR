import { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Repository } from 'typeorm';
import { TickerEntity } from '../ipo/entities/ticker.entity';
import { ConfigService } from '@nestjs/config';
export declare class UnfreezeService implements OnModuleInit, OnModuleDestroy {
    private tickerRepo;
    private readonly configService;
    private readonly logger;
    private redisClient;
    constructor(tickerRepo: Repository<TickerEntity>, configService: ConfigService);
    onModuleInit(): void;
    onModuleDestroy(): void;
    handleCron(): Promise<void>;
}
