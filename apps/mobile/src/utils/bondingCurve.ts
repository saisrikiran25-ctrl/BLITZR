import {
    calculatePrice,
    calculateBuyCost,
    calculateSellValue,
    SCALING_CONSTANT_K,
} from '@blitzr/shared';

/**
 * Client-side bonding curve preview utilities.
 * Used to show price impact in the TradingTerminal BEFORE hitting the backend.
 */

export function previewBuyPrice(currentSupply: number, shares: number) {
    const currentPrice = calculatePrice(currentSupply, SCALING_CONSTANT_K);
    const cost = calculateBuyCost(currentSupply, shares, SCALING_CONSTANT_K);
    const newPrice = calculatePrice(currentSupply + shares, SCALING_CONSTANT_K);

    return {
        currentPrice: round4(currentPrice),
        totalCost: round4(cost),
        totalValue: round4(cost), // Normalized
        newPrice: round4(newPrice),
        priceImpact: round4(((newPrice - currentPrice) / currentPrice) * 100),
        avgPricePerShare: round4(cost / shares),
    };
}

export function previewSellPrice(currentSupply: number, shares: number) {
    const currentPrice = calculatePrice(currentSupply, SCALING_CONSTANT_K);
    const value = calculateSellValue(currentSupply, shares, SCALING_CONSTANT_K);
    const newPrice = calculatePrice(currentSupply - shares, SCALING_CONSTANT_K);

    return {
        currentPrice: round4(currentPrice),
        totalCost: round4(value), // Normalized
        totalValue: round4(value),
        newPrice: round4(newPrice),
        priceImpact: round4(((newPrice - currentPrice) / currentPrice) * 100),
        avgPricePerShare: round4(value / shares),
    };
}

function round4(n: number): number {
    return Math.round(n * 10000) / 10000;
}
