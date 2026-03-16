// ============================================================
// BLITZR-PRIME: Bonding Curve Constants
// P(s) = s² / k
// ============================================================

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
export const SCALING_CONSTANT_K = 200;

/**
 * Initial supply when a user IPOs.
 * The first share is held by the creator.
 */
export const INITIAL_SUPPLY = 1;

/**
 * Calculate the current price of a ticker.
 * P(s) = s² / k
 * 
 * @param supply - Current circulating supply (s)
 * @param k - Scaling constant (default: 200)
 * @returns Price in Creds
 */
export function calculatePrice(supply: number, k: number = SCALING_CONSTANT_K): number {
    return (supply * supply) / k;
}

/**
 * Calculate the cost to buy `n` shares starting at supply `s`.
 * C = ∫[s to s+n] (x² / k) dx = [(s+n)³ - s³] / (3k)
 * 
 * @param currentSupply - Current supply before purchase (s)
 * @param sharesToBuy - Number of shares to buy (n)
 * @param k - Scaling constant (default: 200)
 * @returns Total cost in Creds (before fees)
 */
export function calculateBuyCost(
    currentSupply: number,
    sharesToBuy: number,
    k: number = SCALING_CONSTANT_K,
): number {
    const sEnd = currentSupply + sharesToBuy;
    return (Math.pow(sEnd, 3) - Math.pow(currentSupply, 3)) / (3 * k);
}

/**
 * Calculate the value received from selling `n` shares starting at supply `s`.
 * V = [s³ - (s-n)³] / (3k)
 * 
 * @param currentSupply - Current supply before sale (s)
 * @param sharesToSell - Number of shares to sell (n)
 * @param k - Scaling constant (default: 200)
 * @returns Value received in Creds (before fees)
 */
export function calculateSellValue(
    currentSupply: number,
    sharesToSell: number,
    k: number = SCALING_CONSTANT_K,
): number {
    if (sharesToSell > currentSupply) {
        throw new Error(
            `Cannot sell ${sharesToSell} shares: only ${currentSupply} in circulation`,
        );
    }
    const sAfter = currentSupply - sharesToSell;
    return (Math.pow(currentSupply, 3) - Math.pow(sAfter, 3)) / (3 * k);
}

/**
 * Calculate the price impact of buying `n` shares.
 * Returns the new price after the purchase.
 * 
 * @param currentSupply - Current supply before purchase
 * @param sharesToBuy - Number of shares to buy
 * @param k - Scaling constant
 * @returns New price after purchase
 */
export function priceAfterBuy(
    currentSupply: number,
    sharesToBuy: number,
    k: number = SCALING_CONSTANT_K,
): number {
    return calculatePrice(currentSupply + sharesToBuy, k);
}

/**
 * Calculate the price impact of selling `n` shares.
 * Returns the new price after the sale.
 * 
 * @param currentSupply - Current supply before sale
 * @param sharesToSell - Number of shares to sell
 * @param k - Scaling constant
 * @returns New price after sale
 */
export function priceAfterSell(
    currentSupply: number,
    sharesToSell: number,
    k: number = SCALING_CONSTANT_K,
): number {
    if (sharesToSell > currentSupply) {
        throw new Error(
            `Cannot sell ${sharesToSell} shares: only ${currentSupply} in circulation`,
        );
    }
    return calculatePrice(currentSupply - sharesToSell, k);
}
