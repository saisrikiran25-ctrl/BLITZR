import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RumorEntity } from '../rumor-feed/entities/rumor.entity';
import { TickerEntity } from '../ipo/entities/ticker.entity';

@Injectable()
export class RumorMonitorService {
    private readonly logger = new Logger(RumorMonitorService.name);

    constructor(
        @InjectRepository(RumorEntity)
        private rumorRepo: Repository<RumorEntity>,
        @InjectRepository(TickerEntity)
        private tickerRepo: Repository<TickerEntity>
    ) { }

    @Cron('*/2 * * * *')
    async handleCron() {
        this.logger.debug('Running Rumor-to-Market Correlation Limiter (2 min interval)...');

        // Look for PUBLIC rumors created in the last 30 minutes
        const thirtyMinsAgo = new Date(Date.now() - 30 * 60000);

        const recentRumors = await this.rumorRepo
            .createQueryBuilder('rumor')
            .where('rumor.status = :status', { status: 'VISIBLE' })
            .andWhere('rumor.created_at >= :date', { date: thirtyMinsAgo })
            .getMany();

        for (const rumor of recentRumors) {
            const priceSnapshot = rumor.price_at_post || {};
            const taggedTickers = rumor.tagged_tickers || [];

            let causedSignificantMove = false;

            for (const tickerId of taggedTickers) {
                // Fetch current state of this ticker
                const ticker = await this.tickerRepo.findOne({ where: { ticker_id: tickerId } });
                if (!ticker) continue;

                // Simple mock pricing based on current_supply
                const k = Number(ticker.scaling_constant);
                const currentSupply = Number(ticker.current_supply);
                const currentPrice = k * Math.log(currentSupply + 1);

                const snapshotPrice = priceSnapshot[tickerId];
                if (!snapshotPrice) continue;

                const percentChange = ((currentPrice - snapshotPrice) / snapshotPrice) * 100;

                // Trigger if it moved > 15% OR < -15%
                if (Math.abs(percentChange) >= 15) {
                    causedSignificantMove = true;
                    this.logger.warn(`Correlation detected! Post ${rumor.rumor_id} triggered a ${percentChange.toFixed(2)}% move on ${tickerId}.`);
                    break;
                }
            }

            if (causedSignificantMove) {
                rumor.status = 'PENDING_REVIEW';
                await this.rumorRepo.save(rumor);

                this.logger.warn(`[MODERATION QUEUE ALERT] -> Post #${rumor.rumor_id} may have caused a market move. Review required.`);
            }
        }
    }
}
