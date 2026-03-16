// ============================================================
// BLITZR-PRIME: Economy Constants
// Taxation, Coin Sinks, and Fee Structure
// ============================================================

/**
 * IPO Transaction Fees
 * Applied to every buy/sell on the Personal IPO Market.
 */
export const IPO_BURN_RATE = 0.03;        // 3% burned (deleted from global supply)
export const IPO_DIVIDEND_RATE = 0.05;    // 5% credited to creator_wallet_id

/**
 * Prop Market Fees
 * Applied to every bet in the Arena.
 */
export const PROP_PLATFORM_FEE_RATE = 0.05;  // 5% moved to platform_reserve_wallet

/**
 * Utility Spending Prices (in Chips unless noted)
 */
export const SHOUTOUT_COST_CHIPS = 500;       // Pin a message for 10 minutes
export const GOLDEN_BORDER_COST_CREDS = 1000; // Gold ticker border for 1 week
export const NUKE_COST_CHIPS = 2000;          // Freeze a prop market for 1 hour
export const NUKE_FREEZE_DURATION_MS = 60 * 60 * 1000; // 1 hour in ms

/**
 * Market Maker Bot Configuration
 */
export const MARKET_MAKER_INTERVAL_MS = 120 * 1000; // Every 120 seconds
export const MARKET_MAKER_BATCH_SIZE = 10;           // 10 random tickers
export const MARKET_MAKER_MIN_SHARES = 1;
export const MARKET_MAKER_MAX_SHARES = 3;
export const MARKET_MAKER_SUNSET_THRESHOLD = 50;     // Human trades/hour to disengage

/**
 * Rate Limiting
 */
export const MAX_TRADES_PER_MINUTE = 5;

/**
 * Starting Balances for New Users
 */
export const STARTING_CRED_BALANCE = 100;
export const STARTING_CHIP_BALANCE = 200; // 100 Creds × 2

/**
 * Apply IPO fees to a gross trade amount.
 * Returns the breakdown of net amount, burn, and dividend.
 */
export function applyIpoFees(grossAmount: number): {
    netAmount: number;
    burnAmount: number;
    dividendAmount: number;
} {
    const burnAmount = grossAmount * IPO_BURN_RATE;
    const dividendAmount = grossAmount * IPO_DIVIDEND_RATE;
    const netAmount = grossAmount - burnAmount - dividendAmount;
    return { netAmount, burnAmount, dividendAmount };
}

/**
 * Apply Prop Market fees to a bet amount.
 * Returns the net pool contribution and platform fee.
 */
export function applyPropFees(betAmount: number): {
    netBetAmount: number;
    platformFee: number;
} {
    const platformFee = betAmount * PROP_PLATFORM_FEE_RATE;
    const netBetAmount = betAmount - platformFee;
    return { netBetAmount, platformFee };
}

/**
 * Calculate pari-mutuel payout.
 * Payout = (Total Pool - House Cut) * (User Bet / Winning Side Total Pool)
 */
export function calculatePariMutuelPayout(
    totalPool: number,
    houseCutRate: number,
    userBet: number,
    winningSidePool: number,
): number {
    if (winningSidePool === 0) return 0;
    const netPool = totalPool * (1 - houseCutRate);
    return netPool * (userBet / winningSidePool);
}
