import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TickerEntity } from '../ipo/entities/ticker.entity';
import { RumorEntity } from '../rumor-feed/entities/rumor.entity';
import { CrashProtectorService } from './crash-protector.service';
import { UnfreezeService } from './unfreeze.service';
import { RumorMonitorService } from './rumor-monitor.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([TickerEntity, RumorEntity]),
    ],
    providers: [
        CrashProtectorService,
        UnfreezeService,
        RumorMonitorService
    ],
    exports: []
})
export class SafetyModule { }
