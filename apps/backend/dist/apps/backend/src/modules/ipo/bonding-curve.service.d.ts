/**
 * BondingCurveService
 *
 * Core math engine implementing P(s) = s² / k
 *
 * This service is the source of truth for all price calculations
 * on the server side. It mirrors the formulas in @blitzr/shared
 * but provides additional validation and rounding for database writes.
 */
export declare class BondingCurveService {
    private readonly k;
    constructor();
    /**
     * Get the current price of a ticker given its supply.
     * P(s) = s² / k
     */
    getPrice(supply: number): number;
    /**
     * Calculate the total cost to buy `n` shares at current supply `s`.
     * C = [(s+n)³ - s³] / (3k)
     *
     * This is the EXACT integral of the bonding curve.
     */
    getBuyCost(currentSupply: number, sharesToBuy: number): number;
    /**
     * Calculate the total value received from selling `n` shares at current supply `s`.
     * V = [s³ - (s-n)³] / (3k)
     */
    getSellValue(currentSupply: number, sharesToSell: number): number;
    /**
     * Get the price AFTER buying n shares (for price impact preview).
     */
    getPriceAfterBuy(currentSupply: number, sharesToBuy: number): number;
    /**
     * Get the price AFTER selling n shares (for price impact preview).
     */
    getPriceAfterSell(currentSupply: number, sharesToSell: number): number;
    /**
     * Calculate the market cap of a ticker.
     * MarketCap = P(s) × s = s³ / k
     */
    getMarketCap(supply: number): number;
    /**
     * Round to 4 decimal places (matching DECIMAL(18,4) in PostgreSQL).
     */
    private round4;
}
