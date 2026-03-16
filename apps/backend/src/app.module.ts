import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';

// Feature Modules
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { IpoModule } from './modules/ipo/ipo.module';
import { TradingModule } from './modules/trading/trading.module';
import { PropMarketModule } from './modules/prop-market/prop-market.module';
import { RumorFeedModule } from './modules/rumor-feed/rumor-feed.module';
import { WalletModule } from './modules/wallet/wallet.module';
import { RealtimeModule } from './modules/realtime/realtime.module';
import { MarketMakerModule } from './modules/market-maker/market-maker.module';

// Database config
import { getDatabaseConfig } from './config/database.config';

@Module({
    imports: [
        // Configuration (env vars)
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: '.env',
        }),

        // PostgreSQL via TypeORM
        TypeOrmModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: getDatabaseConfig,
        }),

        // Cron scheduling (Market Maker bot)
        ScheduleModule.forRoot(),

        // Feature modules
        AuthModule,
        UsersModule,
        IpoModule,
        TradingModule,
        PropMarketModule,
        RumorFeedModule,
        WalletModule,
        RealtimeModule,
        MarketMakerModule,
    ],
})
export class AppModule { }
