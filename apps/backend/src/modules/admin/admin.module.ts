import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AdminAnalyticsEntity } from './entities/admin-analytics.entity';
import { AdminAnalyticsService } from './admin-analytics.service';
import { AdminController } from './admin.controller';

import { UserEntity } from '../users/entities/user.entity';
import { TickerEntity } from '../ipo/entities/ticker.entity';
import { RumorEntity } from '../rumor-feed/entities/rumor.entity';
import { UsersModule } from '../users/users.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            AdminAnalyticsEntity,
            UserEntity,
            TickerEntity,
            RumorEntity
        ]),
        UsersModule,
    ],
    controllers: [AdminController],
    providers: [AdminAnalyticsService],
})
export class AdminModule { }
