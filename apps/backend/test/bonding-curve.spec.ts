import {
    calculatePrice,
    calculateBuyCost,
    calculateSellValue,
    SCALING_CONSTANT_K,
    applyIpoFees,
    applyPropFees,
    calculatePariMutuelPayout,
    credsToChips,
    chipsToCreds,
    CRED_TO_CHIP_RATIO,
    roundCreds,
} from '@blitzr/shared';

describe('BLITZR-PRIME Economic Engine', () => {
    // ================================================================
    // 1. BONDING CURVE: P(s) = s² / k
    // ================================================================
    describe('Bonding Curve: Price Formula P(s) = s²/k', () => {
        const k = SCALING_CONSTANT_K; // 200

        test('k should be 200', () => {
            expect(k).toBe(200);
        });

        test('P(0) = 0 (price at zero supply)', () => {
            expect(calculatePrice(0, k)).toBe(0);
        });

        test('P(1) = 0.005 (price at supply 1)', () => {
            expect(calculatePrice(1, k)).toBeCloseTo(0.005, 4);
        });

        test('P(10) = 0.5 (price at supply 10)', () => {
            expect(calculatePrice(10, k)).toBeCloseTo(0.5, 4);
        });

        test('P(100) = 50 (PRD calibration point)', () => {
            // This is the CRITICAL calibration from the PRD:
            // "at 100 shares, the price is ~50 Creds"
            expect(calculatePrice(100, k)).toBe(50);
        });

        test('P(200) = 200', () => {
            expect(calculatePrice(200, k)).toBe(200);
        });

        test('P(500) = 1250', () => {
            expect(calculatePrice(500, k)).toBe(1250);
        });

        test('P(1000) = 5000', () => {
            expect(calculatePrice(1000, k)).toBe(5000);
        });

        test('Price is monotonically increasing', () => {
            let prevPrice = 0;
            for (let s = 1; s <= 100; s++) {
                const price = calculatePrice(s, k);
                expect(price).toBeGreaterThan(prevPrice);
                prevPrice = price;
            }
        });
    });

    // ================================================================
    // 2. PURCHASE COST INTEGRAL: C = [(s+n)³ - s³] / (3k)
    // ================================================================
    describe('Purchase Cost: Integral C = [(s+n)³ - s³] / (3k)', () => {
        const k = SCALING_CONSTANT_K;

        test('Cost of buying 1 share at supply 0', () => {
            // C = (1³ - 0³) / (3 * 200) = 1/600 ≈ 0.001667
            const cost = calculateBuyCost(0, 1, k);
            expect(cost).toBeCloseTo(1 / 600, 4);
        });

        test('Cost of buying 1 share at supply 100', () => {
            // C = (101³ - 100³) / 600 = (1030301 - 1000000) / 600 = 30301/600 ≈ 50.5017
            const cost = calculateBuyCost(100, 1, k);
            expect(cost).toBeCloseTo(30301 / 600, 4);
        });

        test('Cost of buying 5 shares at supply 10', () => {
            // C = (15³ - 10³) / 600 = (3375 - 1000) / 600 = 2375/600 ≈ 3.9583
            const cost = calculateBuyCost(10, 5, k);
            expect(cost).toBeCloseTo(2375 / 600, 4);
        });

        test('Cost of buying 10 shares at supply 0', () => {
            // C = (10³ - 0³) / 600 = 1000/600 ≈ 1.6667
            const cost = calculateBuyCost(0, 10, k);
            expect(cost).toBeCloseTo(1000 / 600, 4);
        });

        test('Cost is always positive for positive shares', () => {
            for (let s = 0; s <= 50; s += 10) {
                for (let n = 1; n <= 10; n++) {
                    expect(calculateBuyCost(s, n, k)).toBeGreaterThan(0);
                }
            }
        });

        test('Cost increases super-linearly with shares', () => {
            const cost1 = calculateBuyCost(50, 1, k);
            const cost5 = calculateBuyCost(50, 5, k);
            // Buying 5 shares should cost more than 5× the cost of 1 share
            // (because the curve is quadratic)
            expect(cost5).toBeGreaterThan(5 * cost1);
        });
    });

    // ================================================================
    // 3. SELL VALUE: V = [s³ - (s-n)³] / (3k)
    // ================================================================
    describe('Sell Value: V = [s³ - (s-n)³] / (3k)', () => {
        const k = SCALING_CONSTANT_K;

        test('Sell value of 1 share at supply 100', () => {
            // V = (100³ - 99³) / 600 = (1000000 - 970299) / 600 = 29701/600 ≈ 49.5017
            const value = calculateSellValue(100, 1, k);
            expect(value).toBeCloseTo(29701 / 600, 4);
        });

        test('Sell value of 5 shares at supply 15 equals buy cost at supply 10', () => {
            // Buy 5 at supply 10: C = (15³ - 10³) / 600
            // Sell 5 at supply 15: V = (15³ - 10³) / 600
            // These must be EQUAL (bonding curve property)
            const buyCost = calculateBuyCost(10, 5, k);
            const sellValue = calculateSellValue(15, 5, k);
            expect(sellValue).toBeCloseTo(buyCost, 10);
        });

        test('Cannot sell more shares than supply', () => {
            expect(() => calculateSellValue(5, 10, k)).toThrow();
        });

        test('Sell value is always positive', () => {
            for (let s = 1; s <= 50; s++) {
                for (let n = 1; n <= s; n++) {
                    expect(calculateSellValue(s, n, k)).toBeGreaterThan(0);
                }
            }
        });

        test('Round-trip buy then sell preserves value (no fees)', () => {
            // If you buy 5 shares at supply 10 and immediately sell 5 at supply 15,
            // you get back exactly what you paid (before fees).
            const supply = 10;
            const shares = 5;
            const buyCost = calculateBuyCost(supply, shares, k);
            const sellValue = calculateSellValue(supply + shares, shares, k);
            expect(Math.abs(buyCost - sellValue)).toBeLessThan(0.0001);
        });
    });

    // ================================================================
    // 4. FLOATING POINT PRECISION
    // ================================================================
    describe('Floating Point Precision (4 decimal places)', () => {
        const k = SCALING_CONSTANT_K;

        test('Price rounds cleanly to 4 decimal places', () => {
            for (let s = 1; s <= 200; s++) {
                const price = calculatePrice(s, k);
                const rounded = Number(price.toFixed(4));
                expect(Math.abs(price - rounded)).toBeLessThan(0.00005);
            }
        });

        test('Cred rounding function works correctly', () => {
            expect(roundCreds(1.23456789)).toBe(1.2346);
            expect(roundCreds(0.00005)).toBe(0.0001);
            expect(roundCreds(100.0)).toBe(100.0);
        });
    });

    // ================================================================
    // 5. DUAL CURRENCY: 1 Cred ↔ 2 Chips
    // ================================================================
    describe('Dual Currency Exchange: 1 Cred = 2 Chips', () => {
        test('Exchange ratio is 2', () => {
            expect(CRED_TO_CHIP_RATIO).toBe(2);
        });

        test('100 Creds = 200 Chips', () => {
            expect(credsToChips(100)).toBe(200);
        });

        test('200 Chips = 100 Creds', () => {
            expect(chipsToCreds(200)).toBe(100);
        });

        test('1 Chip = 0.5 Creds', () => {
            expect(chipsToCreds(1)).toBe(0.5);
        });

        test('Fractional Creds maintained to 4 decimal places', () => {
            expect(chipsToCreds(3)).toBe(1.5);
            expect(chipsToCreds(1)).toBe(0.5);
            expect(chipsToCreds(7)).toBe(3.5);
        });

        test('Round-trip conversion preserves value', () => {
            const creds = 42.5;
            const chips = credsToChips(creds);
            const credsBack = chipsToCreds(chips);
            expect(credsBack).toBe(creds);
        });
    });

    // ================================================================
    // 6. FEE STRUCTURE
    // ================================================================
    describe('IPO Fee Structure', () => {
        test('3% burn rate', () => {
            const { burnAmount } = applyIpoFees(100);
            expect(burnAmount).toBe(3);
        });

        test('5% dividend rate', () => {
            const { dividendAmount } = applyIpoFees(100);
            expect(dividendAmount).toBe(5);
        });

        test('Net amount = gross - burn - dividend', () => {
            const { netAmount, burnAmount, dividendAmount } = applyIpoFees(100);
            expect(netAmount).toBe(100 - 3 - 5);
            expect(burnAmount + dividendAmount + netAmount).toBe(100);
        });

        test('Fees are proportional', () => {
            const result1 = applyIpoFees(200);
            expect(result1.burnAmount).toBe(6);
            expect(result1.dividendAmount).toBe(10);
        });
    });

    describe('Prop Market Fee Structure', () => {
        test('5% platform fee on bets', () => {
            const { platformFee } = applyPropFees(100);
            expect(platformFee).toBe(5);
        });

        test('Net bet amount enters the pool', () => {
            const { netBetAmount, platformFee } = applyPropFees(100);
            expect(netBetAmount).toBe(95);
            expect(netBetAmount + platformFee).toBe(100);
        });
    });

    // ================================================================
    // 7. PARI-MUTUEL PAYOUT
    // ================================================================
    describe('Pari-Mutuel Payout Calculation', () => {
        test('Even split: 50/50 pool with 0% house cut', () => {
            // Total pool: 100, User bet 10 on YES, YES pool = 50
            const payout = calculatePariMutuelPayout(100, 0, 10, 50);
            // Payout = 100 * (10/50) = 20
            expect(payout).toBe(20);
        });

        test('Lopsided pool: user on minority side', () => {
            // Total pool: 100, YES pool = 20, NO pool = 80
            // User bet 10 on YES (minority). YES wins.
            const payout = calculatePariMutuelPayout(100, 0, 10, 20);
            // Payout = 100 * (10/20) = 50 (5x return!)
            expect(payout).toBe(50);
        });

        test('With 5% house cut', () => {
            const payout = calculatePariMutuelPayout(100, 0.05, 10, 50);
            // Net pool = 95, Payout = 95 * (10/50) = 19
            expect(payout).toBe(19);
        });

        test('Zero winning pool returns 0', () => {
            const payout = calculatePariMutuelPayout(100, 0, 10, 0);
            expect(payout).toBe(0);
        });
    });
});
