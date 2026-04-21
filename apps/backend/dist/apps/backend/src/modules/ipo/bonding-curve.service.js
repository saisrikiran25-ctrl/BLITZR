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
Object.defineProperty(exports, "__esModule", { value: true });
exports.BondingCurveService = void 0;
const common_1 = require("@nestjs/common");
const shared_1 = require("@blitzr/shared");
/**
 * BondingCurveService
 *
 * Core math engine implementing P(s) = s² / k
 *
 * This service is the source of truth for all price calculations
 * on the server side. It mirrors the formulas in @blitzr/shared
 * but provides additional validation and rounding for database writes.
 */
let BondingCurveService = class BondingCurveService {
    constructor() {
        this.k = shared_1.SCALING_CONSTANT_K; // 200
    }
    /**
     * Get the current price of a ticker given its supply.
     * P(s) = s² / k
     */
    getPrice(supply) {
        return this.round4((0, shared_1.calculatePrice)(supply, this.k));
    }
    /**
     * Calculate the total cost to buy `n` shares at current supply `s`.
     * C = [(s+n)³ - s³] / (3k)
     *
     * This is the EXACT integral of the bonding curve.
     */
    getBuyCost(currentSupply, sharesToBuy) {
        if (sharesToBuy <= 0) {
            throw new Error('sharesToBuy must be positive');
        }
        return this.round4((0, shared_1.calculateBuyCost)(currentSupply, sharesToBuy, this.k));
    }
    /**
     * Calculate the total value received from selling `n` shares at current supply `s`.
     * V = [s³ - (s-n)³] / (3k)
     */
    getSellValue(currentSupply, sharesToSell) {
        if (sharesToSell <= 0) {
            throw new Error('sharesToSell must be positive');
        }
        if (sharesToSell > currentSupply) {
            throw new Error(`Cannot sell ${sharesToSell} shares: only ${currentSupply} in supply`);
        }
        return this.round4((0, shared_1.calculateSellValue)(currentSupply, sharesToSell, this.k));
    }
    /**
     * Get the price AFTER buying n shares (for price impact preview).
     */
    getPriceAfterBuy(currentSupply, sharesToBuy) {
        return this.round4((0, shared_1.calculatePrice)(currentSupply + sharesToBuy, this.k));
    }
    /**
     * Get the price AFTER selling n shares (for price impact preview).
     */
    getPriceAfterSell(currentSupply, sharesToSell) {
        return this.round4((0, shared_1.calculatePrice)(currentSupply - sharesToSell, this.k));
    }
    /**
     * Calculate the market cap of a ticker.
     * MarketCap = P(s) × s = s³ / k
     */
    getMarketCap(supply) {
        return this.round4((Math.pow(supply, 3)) / this.k);
    }
    /**
     * Round to 4 decimal places (matching DECIMAL(18,4) in PostgreSQL).
     */
    round4(value) {
        return Math.round(value * 10000) / 10000;
    }
};
exports.BondingCurveService = BondingCurveService;
exports.BondingCurveService = BondingCurveService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], BondingCurveService);
