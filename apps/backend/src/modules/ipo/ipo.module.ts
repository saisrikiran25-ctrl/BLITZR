import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TickerEntity } from './entities/ticker.entity';
import { HoldingEntity } from './entities/holding.entity';
import { IpoController } from './ipo.controller';
import { IpoService } from './ipo.service';
import { IpoDelistService } from './ipo-delist.service';
import { BondingCurveService } from './bonding-curve.service';
import { UsersModule } from '../users/users.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([TickerEntity, HoldingEntity]),
        UsersModule,
    ],
    controllers: [IpoController],
    providers: [IpoService, IpoDelistService, BondingCurveService],
    exports: [IpoService, IpoDelistService, BondingCurveService],
})
export class IpoModule { }
