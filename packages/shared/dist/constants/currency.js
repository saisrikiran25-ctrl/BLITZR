"use strict";
// ============================================================
// BLITZR-PRIME: Currency Constants
// Dual-currency system: Creds and Chips
// ============================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.CURRENCY_CHIP = exports.CURRENCY_CRED = exports.CRED_DECIMAL_PRECISION = exports.CHIP_TO_CRED_RATIO = exports.CRED_TO_CHIP_RATIO = void 0;
exports.credsToChips = credsToChips;
exports.chipsToCreds = chipsToCreds;
exports.roundCreds = roundCreds;
/**
 * Exchange rate: 1 Cred = 2 Chips
 */
exports.CRED_TO_CHIP_RATIO = 2;
/**
 * Inverse: 1 Chip = 0.5 Creds
 */
exports.CHIP_TO_CRED_RATIO = 0.5;
/**
 * Maximum decimal precision for Creds.
 * The backend must support fractional Creds up to 4 decimal places.
 */
exports.CRED_DECIMAL_PRECISION = 4;
/**
 * Currency identifiers used in the database.
 */
exports.CURRENCY_CRED = 'CRED';
exports.CURRENCY_CHIP = 'CHIP';
/**
 * Convert Creds to Chips.
 * @param creds - Amount of Creds
 * @returns Equivalent Chips
 */
function credsToChips(creds) {
    return creds * exports.CRED_TO_CHIP_RATIO;
}
/**
 * Convert Chips to Creds.
 * @param chips - Amount of Chips
 * @returns Equivalent Creds (up to 4 decimal places)
 */
function chipsToCreds(chips) {
    return Number((chips * exports.CHIP_TO_CRED_RATIO).toFixed(exports.CRED_DECIMAL_PRECISION));
}
/**
 * Round a Cred amount to the precision limit.
 */
function roundCreds(amount) {
    return Number(amount.toFixed(exports.CRED_DECIMAL_PRECISION));
}
//# sourceMappingURL=currency.js.map