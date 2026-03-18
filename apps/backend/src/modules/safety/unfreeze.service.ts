import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual } from 'typeorm';
import { TickerEntity } from '../ipo/entities/ticker.entity';

@Injectable()
export class UnfreezeService {
    private readonly logger = new Logger(UnfreezeService.name);

    constructor(
        @InjectRepository(TickerEntity)
        private tickerRepo: Repository<TickerEntity>,
    ) { }

    @Cron(CronExpression.EVERY_MINUTE)
    async handleCron() {
        // Find all frozen tickers whose frozen_until is <= now
        const now = new Date();
        
        const tickersToUnfreeze = await this.tickerRepo.find({
            where: { 
                status: 'AUTO_FROZEN',
                frozen_until: LessThanOrEqual(now)
            }
        });

        for (const ticker of tickersToUnfreeze) {
            this.logger.log(`UNFREEZING TICKER: ${ticker.ticker_id}`);
            
            ticker.status = 'ACTIVE';
            ticker.frozen_until = null as any;
            
            // Adjust price_open to current price to reset the 24h trailing crash window?
            // (Optional logic, usually an open price is reset daily anyway)
            
            await this.tickerRepo.save(ticker);
            
            this.logger.log(`[PUSH NOTIFICATION] -> To General Market: Trading resumed for ${ticker.ticker_id}`);
        }
    }
}
