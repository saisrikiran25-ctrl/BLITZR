import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NationalLeaderboardEntity } from './entities/national-leaderboard.entity';
import { LeaderboardService } from './leaderboard.service';
import { LeaderboardController } from './leaderboard.controller';
import { IpoModule } from '../ipo/ipo.module';

@Module({
    imports: [TypeOrmModule.forFeature([NationalLeaderboardEntity]), IpoModule],
    controllers: [LeaderboardController],
    providers: [LeaderboardService],
    exports: [LeaderboardService],
})
export class LeaderboardModule {}
