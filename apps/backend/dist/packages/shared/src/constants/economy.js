"use strict";
// ============================================================
// BLITZR-PRIME: Economy Constants
// Taxation, Coin Sinks, and Fee Structure
// ============================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.STARTING_CHIP_BALANCE = exports.STARTING_CRED_BALANCE = exports.MAX_TRADES_PER_MINUTE = exports.MARKET_MAKER_SUNSET_THRESHOLD = exports.MARKET_MAKER_MAX_SHARES = exports.MARKET_MAKER_MIN_SHARES = exports.MARKET_MAKER_BATCH_SIZE = exports.MARKET_MAKER_INTERVAL_MS = exports.NUKE_FREEZE_DURATION_MS = exports.NUKE_COST_CHIPS = exports.GOLDEN_BORDER_COST_CREDS = exports.SHOUTOUT_COST_CHIPS = exports.PROP_PLATFORM_FEE_RATE = exports.IPO_DIVIDEND_RATE = exports.IPO_BURN_RATE = void 0;
exports.applyIpoFees = applyIpoFees;
exports.applyPropFees = applyPropFees;
exports.calculatePariMutuelPayout = calculatePariMutuelPayout;
/**
 * IPO Transaction Fees
 * Applied to every buy/sell on the Personal IPO Market.
 */
exports.IPO_BURN_RATE = 0.03; // 3% burned (deleted from global supply)
exports.IPO_DIVIDEND_RATE = 0.05; // 5% credited to creator_wallet_id
/**
 * Prop Market Fees
 * Applied to every bet in the Arena.
 */
exports.PROP_PLATFORM_FEE_RATE = 0.05; // 5% moved to platform_reserve_wallet
/**
 * Utility Spending Prices (in Chips unless noted)
 */
exports.SHOUTOUT_COST_CHIPS = 500; // Pin a message for 10 minutes
exports.GOLDEN_BORDER_COST_CREDS = 1000; // Gold ticker border for 1 week
exports.NUKE_COST_CHIPS = 2000; // Freeze a prop market for 1 hour
exports.NUKE_FREEZE_DURATION_MS = 60 * 60 * 1000; // 1 hour in ms
/**
 * Market Maker Bot Configuration
 */
exports.MARKET_MAKER_INTERVAL_MS = 120 * 1000; // Every 120 seconds
exports.MARKET_MAKER_BATCH_SIZE = 10; // 10 random tickers
exports.MARKET_MAKER_MIN_SHARES = 1;
exports.MARKET_MAKER_MAX_SHARES = 3;
exports.MARKET_MAKER_SUNSET_THRESHOLD = 50; // Human trades/hour to disengage
/**
 * Rate Limiting
 */
exports.MAX_TRADES_PER_MINUTE = 5;
/**
 * Starting Balances for New Users
 */
exports.STARTING_CRED_BALANCE = 100;
exports.STARTING_CHIP_BALANCE = 200; // 100 Creds × 2
/**
 * Apply IPO fees to a gross trade amount.
 * Returns the breakdown of net amount, burn, and dividend.
 */
function applyIpoFees(grossAmount) {
    const burnAmount = grossAmount * exports.IPO_BURN_RATE;
    const dividendAmount = grossAmount * exports.IPO_DIVIDEND_RATE;
    const netAmount = grossAmount - burnAmount - dividendAmount;
    return { netAmount, burnAmount, dividendAmount };
}
/**
 * Apply Prop Market fees to a bet amount.
 * Returns the net pool contribution and platform fee.
 */
function applyPropFees(betAmount) {
    const platformFee = betAmount * exports.PROP_PLATFORM_FEE_RATE;
    const netBetAmount = betAmount - platformFee;
    return { netBetAmount, platformFee };
}
/**
 * Calculate pari-mutuel payout.
 * Payout = (Total Pool - House Cut) * (User Bet / Winning Side Total Pool)
 */
function calculatePariMutuelPayout(totalPool, houseCutRate, userBet, winningSidePool) {
    if (winningSidePool === 0)
        return 0;
    const netPool = totalPool * (1 - houseCutRate);
    return netPool * (userBet / winningSidePool);
}
