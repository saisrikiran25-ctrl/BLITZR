import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RumorEntity } from './entities/rumor.entity';
import { RumorVoteEntity } from './entities/rumor-vote.entity';
import { RumorFeedController } from './rumor-feed.controller';
import { RumorFeedService } from './rumor-feed.service';

@Module({
    imports: [TypeOrmModule.forFeature([RumorEntity, RumorVoteEntity])],
    controllers: [RumorFeedController],
    providers: [RumorFeedService],
    exports: [RumorFeedService],
})
export class RumorFeedModule { }
