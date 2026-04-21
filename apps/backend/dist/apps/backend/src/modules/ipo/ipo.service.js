"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IpoService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const ticker_entity_1 = require("./entities/ticker.entity");
const holding_entity_1 = require("./entities/holding.entity");
const bonding_curve_service_1 = require("./bonding-curve.service");
const shared_1 = require("@blitzr/shared");
let IpoService = class IpoService {
    constructor(tickerRepo, holdingRepo, bondingCurve, dataSource) {
        this.tickerRepo = tickerRepo;
        this.holdingRepo = holdingRepo;
        this.bondingCurve = bondingCurve;
        this.dataSource = dataSource;
    }
    /**
     * Compute NYSE-style session % change: (current - price_open) / price_open * 100
     * price_open is set at IPO time and reset every 24h by the Cron job.
     */
    async calculateChangePct(tickerId, currentPrice) {
        const [row] = await this.dataSource.query(`SELECT price_open FROM tickers WHERE ticker_id = $1`, [tickerId]);
        const openPrice = row ? Number(row.price_open) : 0;
        if (!openPrice)
            return 0;
        const pct = ((currentPrice - openPrice) / openPrice) * 100;
        return Number(pct.toFixed(2));
    }
    /**
     * IPO Opt-In: Initialize a new ticker for a user.
     * Sets initial supply to 1 (held by creator), calculates starting price.
     */
    async createIpo(userId, collegeDomain, tickerSymbol, category) {
        // Ensure ticker starts with $
        const tickerId = tickerSymbol.startsWith('$') ? tickerSymbol : `$${tickerSymbol}`;
        // Check for existing ticker
        const existing = await this.tickerRepo.findOne({ where: { ticker_id: tickerId } });
        if (existing) {
            throw new common_1.ConflictException(`Ticker ${tickerId} already exists`);
        }
        // Check if user already has an IPO
        const existingUserTicker = await this.tickerRepo.findOne({ where: { owner_id: userId } });
        if (existingUserTicker) {
            throw new common_1.ConflictException('User already has an active IPO');
        }
        // Create the ticker with initial supply = 1
        const startingPrice = this.bondingCurve.getPrice(shared_1.INITIAL_SUPPLY);
        const ticker = this.tickerRepo.create({
            ticker_id: tickerId,
            owner_id: userId,
            current_supply: shared_1.INITIAL_SUPPLY,
            price_open: startingPrice, // Session open = IPO price
            category,
            college_domain: collegeDomain,
        });
        await this.tickerRepo.save(ticker);
        // Create the initial holding (creator holds 1 share)
        const holding = this.holdingRepo.create({
            user_id: userId,
            ticker_id: tickerId,
            shares_held: shared_1.INITIAL_SUPPLY,
            avg_buy_price: startingPrice, // Reuse already-computed value
        });
        await this.holdingRepo.save(holding);
        // Mark user as IPO active
        await this.dataSource.query(`UPDATE users SET is_ipo_active = true WHERE user_id = $1`, [userId]);
        return {
            ticker_id: tickerId,
            current_supply: shared_1.INITIAL_SUPPLY,
            starting_price: startingPrice, // Reuse already-computed value
            market_cap: this.bondingCurve.getMarketCap(shared_1.INITIAL_SUPPLY),
        };
    }
    /**
     * Get a ticker by ID with current price.
     */
    async getTicker(collegeDomain, tickerId) {
        const ticker = await this.tickerRepo.findOne({ where: { ticker_id: tickerId, college_domain: collegeDomain } });
        if (!ticker) {
            throw new common_1.NotFoundException(`Ticker ${tickerId} not found in your domain`);
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
    async getActiveTickers(collegeDomain) {
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
    async getUserHoldings(userId) {
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
};
exports.IpoService = IpoService;
exports.IpoService = IpoService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(ticker_entity_1.TickerEntity)),
    __param(1, (0, typeorm_1.InjectRepository)(holding_entity_1.HoldingEntity)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        bonding_curve_service_1.BondingCurveService,
        typeorm_2.DataSource])
], IpoService);
