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
var LeaderboardService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.LeaderboardService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const schedule_1 = require("@nestjs/schedule");
const national_leaderboard_entity_1 = require("./entities/national-leaderboard.entity");
const bonding_curve_service_1 = require("../ipo/bonding-curve.service");
let LeaderboardService = LeaderboardService_1 = class LeaderboardService {
    constructor(leaderboardRepo, dataSource, bondingCurve) {
        this.leaderboardRepo = leaderboardRepo;
        this.dataSource = dataSource;
        this.bondingCurve = bondingCurve;
        this.logger = new common_1.Logger(LeaderboardService_1.name);
    }
    /**
     * B5: National Leaderboard cron — runs every 30 minutes (at :00 and :30 of each hour).
     */
    async computeNationalLeaderboard() {
        this.logger.log('Computing National Leaderboard...');
        // Get all verified institutions
        const institutions = await this.dataSource.query(`SELECT institution_id, short_code FROM institutions WHERE verified = true`);
        // Delete old snapshot
        await this.leaderboardRepo.clear();
        let nationalRankCounter = 1;
        for (const institution of institutions) {
            // Get top 3 tickers by total_volume for this institution
            const topTickers = await this.dataSource.query(`SELECT t.ticker_id, t.current_supply, t.scaling_constant, t.total_volume, t.featured
                 FROM tickers t
                 JOIN users u ON t.owner_id = u.user_id
                 WHERE u.institution_id = $1 AND t.status = 'ACTIVE'
                 ORDER BY t.total_volume DESC
                 LIMIT 3`, [institution.institution_id]);
            for (let i = 0; i < topTickers.length; i++) {
                const ticker = topTickers[i];
                const supply = Number(ticker.current_supply);
                const snapshotPrice = this.bondingCurve.getPrice(supply);
                const entry = this.leaderboardRepo.create({
                    ticker_id: ticker.ticker_id,
                    institution_id: institution.institution_id,
                    campus_rank: i + 1,
                    national_rank: nationalRankCounter++,
                    snapshot_price: snapshotPrice,
                    snapshot_volume: Number(ticker.total_volume),
                    featured: ticker.featured ?? false,
                });
                await this.leaderboardRepo.save(entry);
            }
        }
        this.logger.log(`National Leaderboard computed. ${nationalRankCounter - 1} entries.`);
    }
    /**
     * GET /v1/leaderboard/national — reads ONLY from snapshot table.
     */
    async getNationalLeaderboard(limit = 50) {
        const rows = await this.dataSource.query(`SELECT nl.*, t.ticker_id, i.short_code AS institution_short_code, i.name AS institution_name,
                    u.display_name AS owner_display_name,
                    CASE
                        WHEN t.price_open IS NULL OR t.price_open = 0 THEN 0
                        ELSE ((nl.snapshot_price - t.price_open) / t.price_open) * 100
                    END AS change_pct
             FROM national_leaderboard nl
             LEFT JOIN tickers t ON nl.ticker_id = t.ticker_id
             LEFT JOIN institutions i ON nl.institution_id = i.institution_id
             LEFT JOIN users u ON t.owner_id = u.user_id
             ORDER BY nl.featured DESC, nl.national_rank ASC
             LIMIT $1`, [limit]);
        return rows;
    }
};
exports.LeaderboardService = LeaderboardService;
__decorate([
    (0, schedule_1.Cron)('0 0,30 * * * *'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], LeaderboardService.prototype, "computeNationalLeaderboard", null);
exports.LeaderboardService = LeaderboardService = LeaderboardService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(national_leaderboard_entity_1.NationalLeaderboardEntity)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.DataSource,
        bonding_curve_service_1.BondingCurveService])
], LeaderboardService);
