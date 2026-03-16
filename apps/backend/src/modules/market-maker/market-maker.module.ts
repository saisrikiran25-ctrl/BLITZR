import { Module } from '@nestjs/common';
import { MarketMakerService } from './market-maker.service';
import { IpoModule } from '../ipo/ipo.module';
import { RealtimeModule } from '../realtime/realtime.module';

@Module({
    imports: [IpoModule, RealtimeModule],
    providers: [MarketMakerService],
})
export class MarketMakerModule { }
