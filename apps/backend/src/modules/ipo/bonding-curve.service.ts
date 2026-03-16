import { Injectable } from '@nestjs/common';
import {
    SCALING_CONSTANT_K,
    calculatePrice,
    calculateBuyCost,
    calculateSellValue,
} from '@blitzr/shared';

/**
 * BondingCurveService
 * 
 * Core math engine implementing P(s) = s² / k
 * 
 * This service is the source of truth for all price calculations
 * on the server side. It mirrors the formulas in @blitzr/shared
 * but provides additional validation and rounding for database writes.
 */
@Injectable()
export class BondingCurveService {
    private readonly k: number;

    constructor() {
        this.k = SCALING_CONSTANT_K; // 200
    }

    /**
     * Get the current price of a ticker given its supply.
     * P(s) = s² / k
     */
    getPrice(supply: number): number {
        return this.round4(calculatePrice(supply, this.k));
    }

    /**
     * Calculate the total cost to buy `n` shares at current supply `s`.
     * C = [(s+n)³ - s³] / (3k)
     * 
     * This is the EXACT integral of the bonding curve.
     */
    getBuyCost(currentSupply: number, sharesToBuy: number): number {
        if (sharesToBuy <= 0) {
            throw new Error('sharesToBuy must be positive');
        }
        return this.round4(calculateBuyCost(currentSupply, sharesToBuy, this.k));
    }

    /**
     * Calculate the total value received from selling `n` shares at current supply `s`.
     * V = [s³ - (s-n)³] / (3k)
     */
    getSellValue(currentSupply: number, sharesToSell: number): number {
        if (sharesToSell <= 0) {
            throw new Error('sharesToSell must be positive');
        }
        if (sharesToSell > currentSupply) {
            throw new Error(`Cannot sell ${sharesToSell} shares: only ${currentSupply} in supply`);
        }
        return this.round4(calculateSellValue(currentSupply, sharesToSell, this.k));
    }

    /**
     * Get the price AFTER buying n shares (for price impact preview).
     */
    getPriceAfterBuy(currentSupply: number, sharesToBuy: number): number {
        return this.round4(calculatePrice(currentSupply + sharesToBuy, this.k));
    }

    /**
     * Get the price AFTER selling n shares (for price impact preview).
     */
    getPriceAfterSell(currentSupply: number, sharesToSell: number): number {
        return this.round4(calculatePrice(currentSupply - sharesToSell, this.k));
    }

    /**
     * Calculate the market cap of a ticker.
     * MarketCap = P(s) × s = s³ / k
     */
    getMarketCap(supply: number): number {
        return this.round4((Math.pow(supply, 3)) / this.k);
    }

    /**
     * Round to 4 decimal places (matching DECIMAL(18,4) in PostgreSQL).
     */
    private round4(value: number): number {
        return Math.round(value * 10000) / 10000;
    }
}
