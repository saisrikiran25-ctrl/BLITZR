import { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Repository, DataSource } from 'typeorm';
import { TickerEntity } from '../ipo/entities/ticker.entity';
import { BondingCurveService } from '../ipo/bonding-curve.service';
import { NotificationService } from '../../common/services/notification.service';
import { ConfigService } from '@nestjs/config';
export declare class CrashProtectorService implements OnModuleInit, OnModuleDestroy {
    private tickerRepo;
    private readonly dataSource;
    private readonly bondingCurve;
    private readonly notificationService;
    private readonly configService;
    private readonly logger;
    private redisClient;
    constructor(tickerRepo: Repository<TickerEntity>, dataSource: DataSource, bondingCurve: BondingCurveService, notificationService: NotificationService, configService: ConfigService);
    onModuleInit(): void;
    onModuleDestroy(): void;
    handleCron(): Promise<void>;
}
