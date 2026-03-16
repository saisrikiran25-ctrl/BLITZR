// ============================================================
// BLITZR-PRIME: Currency Constants
// Dual-currency system: Creds and Chips
// ============================================================

/**
 * Exchange rate: 1 Cred = 2 Chips
 */
export const CRED_TO_CHIP_RATIO = 2;

/**
 * Inverse: 1 Chip = 0.5 Creds
 */
export const CHIP_TO_CRED_RATIO = 0.5;

/**
 * Maximum decimal precision for Creds.
 * The backend must support fractional Creds up to 4 decimal places.
 */
export const CRED_DECIMAL_PRECISION = 4;

/**
 * Currency identifiers used in the database.
 */
export const CURRENCY_CRED = 'CRED' as const;
export const CURRENCY_CHIP = 'CHIP' as const;

export type CurrencyType = typeof CURRENCY_CRED | typeof CURRENCY_CHIP;

/**
 * Convert Creds to Chips.
 * @param creds - Amount of Creds
 * @returns Equivalent Chips
 */
export function credsToChips(creds: number): number {
    return creds * CRED_TO_CHIP_RATIO;
}

/**
 * Convert Chips to Creds.
 * @param chips - Amount of Chips  
 * @returns Equivalent Creds (up to 4 decimal places)
 */
export function chipsToCreds(chips: number): number {
    return Number((chips * CHIP_TO_CRED_RATIO).toFixed(CRED_DECIMAL_PRECISION));
}

/**
 * Round a Cred amount to the precision limit.
 */
export function roundCreds(amount: number): number {
    return Number(amount.toFixed(CRED_DECIMAL_PRECISION));
}
