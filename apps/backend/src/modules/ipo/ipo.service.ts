import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { TickerEntity } from './entities/ticker.entity';
import { HoldingEntity } from './entities/holding.entity';
import { BondingCurveService } from './bonding-curve.service';
import { INITIAL_SUPPLY } from '@blitzr/shared';

@Injectable()
export class IpoService {
    constructor(
        @InjectRepository(TickerEntity)
        private readonly tickerRepo: Repository<TickerEntity>,
        @InjectRepository(HoldingEntity)
        private readonly holdingRepo: Repository<HoldingEntity>,
        private readonly bondingCurve: BondingCurveService,
        private readonly dataSource: DataSource,
    ) { }

    /**
     * Compute NYSE-style session % change: (current - price_open) / price_open * 100
     * price_open is set at IPO time and reset every 24h by the Cron job.
     */
    private async calculateChangePct(tickerId: string, currentPrice: number): Promise<number> {
        const [row] = await this.dataSource.query(
            `SELECT price_open FROM tickers WHERE ticker_id = $1`,
            [tickerId]
        );
        const openPrice = row ? Number(row.price_open) : 0;
        if (!openPrice) return 0;
        const pct = ((currentPrice - openPrice) / openPrice) * 100;
        return Number(pct.toFixed(2));
    }

    /**
     * IPO Opt-In: Initialize a new ticker for a user.
     * Sets initial supply to 1 (held by creator), calculates starting price.
     */
    async createIpo(userId: string, collegeDomain: string, tickerSymbol: string, category?: string) {
        // Ensure ticker starts with $
        const tickerId = tickerSymbol.startsWith('$') ? tickerSymbol : `$${tickerSymbol}`;

        // Check for existing ticker
        const existing = await this.tickerRepo.findOne({ where: { ticker_id: tickerId } });
        if (existing) {
            throw new ConflictException(`Ticker ${tickerId} already exists`);
        }

        // Check if user already has an IPO
        const existingUserTicker = await this.tickerRepo.findOne({ where: { owner_id: userId } });
        if (existingUserTicker) {
            throw new ConflictException('User already has an active IPO');
        }

        // Create the ticker with initial supply = 1
        const startingPrice = this.bondingCurve.getPrice(INITIAL_SUPPLY);
        const ticker = this.tickerRepo.create({
            ticker_id: tickerId,
            owner_id: userId,
            current_supply: INITIAL_SUPPLY,
            price_open: startingPrice,   // Session open = IPO price
            category,
            college_domain: collegeDomain,
        });

        await this.tickerRepo.save(ticker);

        // Create the initial holding (creator holds 1 share)
        const holding = this.holdingRepo.create({
            user_id: userId,
            ticker_id: tickerId,
            shares_held: INITIAL_SUPPLY,
            avg_buy_price: this.bondingCurve.getPrice(INITIAL_SUPPLY),
        });

        await this.holdingRepo.save(holding);

        // Mark user as IPO active
        await this.dataSource.query(
            `UPDATE users SET is_ipo_active = true WHERE user_id = $1`,
            [userId],
        );

        return {
            ticker_id: tickerId,
            current_supply: INITIAL_SUPPLY,
            starting_price: this.bondingCurve.getPrice(INITIAL_SUPPLY),
            market_cap: this.bondingCurve.getMarketCap(INITIAL_SUPPLY),
        };
    }

    /**
     * Get a ticker by ID with current price.
     */
    async getTicker(collegeDomain: string, tickerId: string) {
        const ticker = await this.tickerRepo.findOne({ where: { ticker_id: tickerId, college_domain: collegeDomain } });
        if (!ticker) {
            throw new NotFoundException(`Ticker ${tickerId} not found in your domain`);
        }

        const currentPrice = this.bondingCurve.getPrice(Number(ticker.current_supply));
        const changePct = await this.calculateChangePct(tickerId, currentPrice);

        return {
            ...ticker,
            current_price: currentPrice,
            change_percentage: changePct,
            market_cap: this.bondingCurve.getMarketCap(Number(ticker.current_supply)),
        };
    }

    /**
     * Get all active tickers with live prices.
     */
    async getActiveTickers(collegeDomain: string) {
        const tickers = await this.tickerRepo.find({
            where: { status: 'ACTIVE', college_domain: collegeDomain },
            order: { total_volume: 'DESC' },
        });

        return Promise.all(tickers.map(async (t) => {
            const currentPrice = this.bondingCurve.getPrice(Number(t.current_supply));
            const changePct = await this.calculateChangePct(t.ticker_id, currentPrice);
            return {
                ...t,
                current_price: currentPrice,
                change_percentage: changePct,
                market_cap: this.bondingCurve.getMarketCap(Number(t.current_supply)),
            };
        }));
    }

    /**
     * Get holdings for a user (portfolio).
     */
    async getUserHoldings(userId: string) {
        const holdings = await this.holdingRepo.find({
            where: { user_id: userId },
            relations: ['ticker'],
        });

        return holdings.map((h) => {
            const currentPrice = this.bondingCurve.getPrice(Number(h.ticker.current_supply));
            const currentValue = Number(h.shares_held) * currentPrice;
            const costBasis = Number(h.shares_held) * Number(h.avg_buy_price);
            return {
                ...h,
                current_price: currentPrice,
                current_value: currentValue,
                profit_loss: currentValue - costBasis,
                profit_loss_pct: costBasis > 0 ? ((currentValue - costBasis) / costBasis) * 100 : 0,
            };
        });
    }
}
