import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AdminAnalyticsEntity } from './entities/admin-analytics.entity';
import { AdminAnalyticsService } from './admin-analytics.service';
import { AdminController } from './admin.controller';
import { AdminAuthController } from './admin-auth.controller';
import { AdminAuthService } from './admin-auth.service';
import { AdminJwtStrategy } from './strategies/admin-jwt.strategy';
import { AdminJwtGuard } from './guards/admin-jwt.guard';

import { UserEntity } from '../users/entities/user.entity';
import { TickerEntity } from '../ipo/entities/ticker.entity';
import { UsersModule } from '../users/users.module';
import { IpoModule } from '../ipo/ipo.module';
import { PropMarketModule } from '../prop-market/prop-market.module';

@Module({
    imports: [
        ConfigModule,
        TypeOrmModule.forFeature([
            AdminAnalyticsEntity,
            UserEntity,
            TickerEntity
        ]),
        UsersModule,
        IpoModule,
        PropMarketModule,
        JwtModule.registerAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => ({
                secret: configService.get<string>('ADMIN_JWT_SECRET', 'blitzr-admin-secret'),
                signOptions: { expiresIn: '12h' },
            }),
        }),
    ],
    controllers: [AdminController, AdminAuthController],
    providers: [AdminAnalyticsService, AdminAuthService, AdminJwtStrategy, AdminJwtGuard],
    exports: [AdminJwtGuard],
})
export class AdminModule { }
