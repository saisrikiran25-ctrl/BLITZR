import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TickerEntity } from '../ipo/entities/ticker.entity';

@Injectable()
export class CrashProtectorService {
    private readonly logger = new Logger(CrashProtectorService.name);

    constructor(
        @InjectRepository(TickerEntity)
        private tickerRepo: Repository<TickerEntity>,
    ) { }

    @Cron('*/5 * * * *')
    async handleCron() {
        this.logger.debug('Running Crash Protector Scan (5 min interval)...');
        
        // Find all active tickers
        const activeTickers = await this.tickerRepo.find({
            where: { status: 'ACTIVE' },
            relations: ['owner']
        });

        for (const ticker of activeTickers) {
            const priceOpen = Number(ticker.price_open);
            if (priceOpen === 0) continue; // safety check

            // Bonding curve recalculation (mock)
            const k = Number(ticker.scaling_constant);
            const currentSupply = Number(ticker.current_supply);
            // Example invariant formula price calculation
            const currentPrice = k * Math.log(currentSupply + 1);

            const dropPercent = ((currentPrice - priceOpen) / priceOpen) * 100;

            if (dropPercent <= -25) {
                this.logger.warn(`CRASH DETECTED: ${ticker.ticker_id} dropped ${dropPercent.toFixed(2)}%`);
                
                // Freeze for 60 minutes
                const freezeTimestamp = new Date();
                freezeTimestamp.setMinutes(freezeTimestamp.getMinutes() + 60);

                ticker.status = 'AUTO_FROZEN';
                ticker.frozen_until = freezeTimestamp;
                
                await this.tickerRepo.save(ticker);

                // Mock notification sending per requirements
                this.logger.log(`[PUSH NOTIFICATION] -> To Owner (${ticker.owner_id}): Your Clout Score is temporarily protected. Markets resume in 60 minutes.`);
                this.logger.log(`[PUSH NOTIFICATION] -> To Holders: This ticker is temporarily paused due to high volatility.`);
            }
        }
    }
}
