import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { BondingCurveService } from '../ipo/bonding-curve.service';
import { ConfigService } from '@nestjs/config';
/**
 * MarketMakerService (Ghost Town Defense)
 *
 * FIX (Apr 25 2026):
 *  - BUG-03: OnModuleInit/OnModuleDestroy added. lazyConnect:true means the
 *    client won't auto-connect. Explicit connect() called on boot.
 *  - BUG-07: BUY path now increments total_volume.
 */
export declare class MarketMakerService implements OnModuleInit, OnModuleDestroy {
    private readonly dataSource;
    private readonly realtimeGateway;
    private readonly bondingCurve;
    private readonly configService;
    private readonly logger;
    private redisClient;
    constructor(dataSource: DataSource, realtimeGateway: RealtimeGateway, bondingCurve: BondingCurveService, configService: ConfigService);
    onModuleInit(): Promise<void>;
    onModuleDestroy(): void;
    executeMarketMaking(): Promise<void>;
    resetHourlyCounters(): Promise<void>;
    resetSessionOpenPrices(): Promise<void>;
    private randomInt;
}
