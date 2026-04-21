/**
 * Exchange rate: 1 Cred = 2 Chips
 */
export declare const CRED_TO_CHIP_RATIO = 2;
/**
 * Inverse: 1 Chip = 0.5 Creds
 */
export declare const CHIP_TO_CRED_RATIO = 0.5;
/**
 * Maximum decimal precision for Creds.
 * The backend must support fractional Creds up to 4 decimal places.
 */
export declare const CRED_DECIMAL_PRECISION = 4;
/**
 * Currency identifiers used in the database.
 */
export declare const CURRENCY_CRED: "CRED";
export declare const CURRENCY_CHIP: "CHIP";
export type CurrencyType = typeof CURRENCY_CRED | typeof CURRENCY_CHIP;
/**
 * Convert Creds to Chips.
 * @param creds - Amount of Creds
 * @returns Equivalent Chips
 */
export declare function credsToChips(creds: number): number;
/**
 * Convert Chips to Creds.
 * @param chips - Amount of Chips
 * @returns Equivalent Creds (up to 4 decimal places)
 */
export declare function chipsToCreds(chips: number): number;
/**
 * Round a Cred amount to the precision limit.
 */
export declare function roundCreds(amount: number): number;
//# sourceMappingURL=currency.d.ts.map