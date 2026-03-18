import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TickerEntity } from '../ipo/entities/ticker.entity';
import { CrashProtectorService } from './crash-protector.service';
import { UnfreezeService } from './unfreeze.service';
import { IpoModule } from '../ipo/ipo.module';
import { NotificationService } from '../../common/services/notification.service';
import { ConfigModule } from '@nestjs/config';

@Module({
    imports: [
        ConfigModule,
        TypeOrmModule.forFeature([TickerEntity]),
        IpoModule,
    ],
    providers: [
        CrashProtectorService,
        UnfreezeService,
        NotificationService,
    ],
    exports: []
})
export class SafetyModule { }
