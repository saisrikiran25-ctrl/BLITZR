import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PropEventEntity } from './entities/prop-event.entity';
import { PropBetEntity } from './entities/prop-bet.entity';
import { PropMarketController } from './prop-market.controller';
import { MarketsController } from './markets.controller';
import { PropMarketService } from './prop-market.service';
import { JwtOrAdminGuard } from '../../common/guards/jwt-or-admin.guard';
import { UsersModule } from '../users/users.module';
import { RealtimeModule } from '../realtime/realtime.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([PropEventEntity, PropBetEntity]),
        UsersModule,
        RealtimeModule,
    ],
    controllers: [PropMarketController, MarketsController],
    providers: [PropMarketService, JwtOrAdminGuard],
    exports: [PropMarketService],
})
export class PropMarketModule { }
