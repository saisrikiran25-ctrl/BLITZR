/**
 * IPO Transaction Fees
 * Applied to every buy/sell on the Personal IPO Market.
 */
export declare const IPO_BURN_RATE = 0.03;
export declare const IPO_DIVIDEND_RATE = 0.05;
/**
 * Prop Market Fees
 * Applied to every bet in the Arena.
 */
export declare const PROP_PLATFORM_FEE_RATE = 0.05;
/**
 * Utility Spending Prices (in Chips unless noted)
 */
export declare const SHOUTOUT_COST_CHIPS = 500;
export declare const GOLDEN_BORDER_COST_CREDS = 1000;
export declare const NUKE_COST_CHIPS = 2000;
export declare const NUKE_FREEZE_DURATION_MS: number;
/**
 * Market Maker Bot Configuration
 */
export declare const MARKET_MAKER_INTERVAL_MS: number;
export declare const MARKET_MAKER_BATCH_SIZE = 10;
export declare const MARKET_MAKER_MIN_SHARES = 1;
export declare const MARKET_MAKER_MAX_SHARES = 3;
export declare const MARKET_MAKER_SUNSET_THRESHOLD = 50;
/**
 * Rate Limiting
 */
export declare const MAX_TRADES_PER_MINUTE = 5;
/**
 * Starting Balances for New Users
 */
export declare const STARTING_CRED_BALANCE = 100;
export declare const STARTING_CHIP_BALANCE = 200;
/**
 * Apply IPO fees to a gross trade amount.
 * Returns the breakdown of net amount, burn, and dividend.
 */
export declare function applyIpoFees(grossAmount: number): {
    netAmount: number;
    burnAmount: number;
    dividendAmount: number;
};
/**
 * Apply Prop Market fees to a bet amount.
 * Returns the net pool contribution and platform fee.
 */
export declare function applyPropFees(betAmount: number): {
    netBetAmount: number;
    platformFee: number;
};
/**
 * Calculate pari-mutuel payout.
 * Payout = (Total Pool - House Cut) * (User Bet / Winning Side Total Pool)
 */
export declare function calculatePariMutuelPayout(totalPool: number, houseCutRate: number, userBet: number, winningSidePool: number): number;
//# sourceMappingURL=economy.d.ts.map