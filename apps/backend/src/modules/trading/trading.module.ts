import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransactionEntity } from './entities/transaction.entity';
import { OhlcCandleEntity } from './entities/ohlc-candle.entity';
import { TradingController } from './trading.controller';
import { TradingService } from './trading.service';
import { OhlcAggregationService } from './ohlc-aggregation.service';
import { IpoModule } from '../ipo/ipo.module';
import { UsersModule } from '../users/users.module';
import { RealtimeModule } from '../realtime/realtime.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([TransactionEntity, OhlcCandleEntity]),
        IpoModule,
        UsersModule,
        RealtimeModule,
    ],
    controllers: [TradingController],
    providers: [TradingService, OhlcAggregationService],
    exports: [TradingService, OhlcAggregationService],
})
export class TradingModule { }
