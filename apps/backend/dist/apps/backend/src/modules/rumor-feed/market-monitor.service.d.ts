import { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { BondingCurveService } from '../ipo/bonding-curve.service';
import { NotificationService } from '../../common/services/notification.service';
export declare class MarketMonitorService implements OnModuleInit, OnModuleDestroy {
    private readonly dataSource;
    private readonly bondingCurve;
    private readonly notificationService;
    private readonly configService;
    private readonly logger;
    private redisClient;
    constructor(dataSource: DataSource, bondingCurve: BondingCurveService, notificationService: NotificationService, configService: ConfigService);
    onModuleInit(): Promise<void>;
    onModuleDestroy(): void;
    startMarketMonitor(postId: string, tickers: string[], priceSnapshot: Record<string, number>, authorId: string): Promise<void>;
    processMonitorQueue(): Promise<void>;
}
