/**
 * The Scaling Constant (k).
 *
 * Calibrated for a campus of ~5,000 students.
 * At s=100 shares, P(100) = 100² / 200 = 50 Creds.
 *
 * This ensures:
 *  - Early volatility (first shares are cheap, creating FOMO)
 *  - Prices don't become "unreachable" too soon
 */
export declare const SCALING_CONSTANT_K = 200;
/**
 * Initial supply when a user IPOs.
 * The first share is held by the creator.
 */
export declare const INITIAL_SUPPLY = 1;
/**
 * Calculate the current price of a ticker.
 * P(s) = s² / k
 *
 * @param supply - Current circulating supply (s)
 * @param k - Scaling constant (default: 200)
 * @returns Price in Creds
 */
export declare function calculatePrice(supply: number, k?: number): number;
/**
 * Calculate the cost to buy `n` shares starting at supply `s`.
 * C = ∫[s to s+n] (x² / k) dx = [(s+n)³ - s³] / (3k)
 *
 * @param currentSupply - Current supply before purchase (s)
 * @param sharesToBuy - Number of shares to buy (n)
 * @param k - Scaling constant (default: 200)
 * @returns Total cost in Creds (before fees)
 */
export declare function calculateBuyCost(currentSupply: number, sharesToBuy: number, k?: number): number;
/**
 * Calculate the value received from selling `n` shares starting at supply `s`.
 * V = [s³ - (s-n)³] / (3k)
 *
 * @param currentSupply - Current supply before sale (s)
 * @param sharesToSell - Number of shares to sell (n)
 * @param k - Scaling constant (default: 200)
 * @returns Value received in Creds (before fees)
 */
export declare function calculateSellValue(currentSupply: number, sharesToSell: number, k?: number): number;
/**
 * Calculate the price impact of buying `n` shares.
 * Returns the new price after the purchase.
 *
 * @param currentSupply - Current supply before purchase
 * @param sharesToBuy - Number of shares to buy
 * @param k - Scaling constant
 * @returns New price after purchase
 */
export declare function priceAfterBuy(currentSupply: number, sharesToBuy: number, k?: number): number;
/**
 * Calculate the price impact of selling `n` shares.
 * Returns the new price after the sale.
 *
 * @param currentSupply - Current supply before sale
 * @param sharesToSell - Number of shares to sell
 * @param k - Scaling constant
 * @returns New price after sale
 */
export declare function priceAfterSell(currentSupply: number, sharesToSell: number, k?: number): number;
//# sourceMappingURL=bonding-curve.d.ts.map