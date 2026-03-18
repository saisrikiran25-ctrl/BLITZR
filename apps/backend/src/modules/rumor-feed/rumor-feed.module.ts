import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RumorEntity } from './entities/rumor.entity';
import { RumorVoteEntity } from './entities/rumor-vote.entity';
import { RumorFeedController } from './rumor-feed.controller';
import { RumorFeedService } from './rumor-feed.service';
import { ClassifierService } from './classifier.service';
import { MarketMonitorService } from './market-monitor.service';
import { ModerationService } from './moderation.service';
import { IpoModule } from '../ipo/ipo.module';
import { UsersModule } from '../users/users.module';
import { NotificationService } from '../../common/services/notification.service';
import { PostSurvivalService } from './post-survival.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([RumorEntity, RumorVoteEntity]),
        IpoModule,
        UsersModule,
    ],
    controllers: [RumorFeedController],
    providers: [
        RumorFeedService,
        ClassifierService,
        MarketMonitorService,
        ModerationService,
        NotificationService,
        PostSurvivalService,
    ],
    exports: [RumorFeedService, ClassifierService, MarketMonitorService],
})
export class RumorFeedModule { }
