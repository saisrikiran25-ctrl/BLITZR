// ============================================================
// BLITZR: Typography — "The Authority Grid"
// Primary: Inter / SF Pro Display
// Data: JetBrains Mono / Roboto Mono (monospaced, prevents layout jumping)
// Sizing: Strict 4px grid
// ============================================================

import { TextStyle } from 'react-native';
import { Colors } from './colors';

// Font families
export const Fonts = {
    primary: 'SpaceGrotesk_400Regular',
    bold: 'SpaceGrotesk_700Bold',
    mono: 'SpaceGrotesk_500Medium',
};

// Strict 4px grid sizing
export const FontSizes = {
    /** Data labels — smallest legible */
    xs: 10,     // 10px
    /** Small captions */
    sm: 12,     // 12px (3 × 4)
    /** Body text */
    body: 14,   // 14px
    /** Large body / subheadings */
    md: 16,     // 16px (4 × 4)
    /** Section headers */
    lg: 18,     // 18px
    /** Screen titles */
    xl: 20,     // 20px (5 × 4)
    /** Hero numbers */
    xxl: 24,    // 24px (6 × 4)
    /** Global Market Cap counter */
    hero: 32,   // 32px (8 × 4)
    /** Massive display */
    display: 48, // 48px (12 × 4)
} as const;

// Line heights (based on 4px grid)
export const LineHeights = {
    xs: 16,
    sm: 16,
    body: 20,
    md: 24,
    lg: 24,
    xl: 28,
    xxl: 32,
    hero: 40,
    display: 56,
} as const;

// Font weights
export const FontWeights = {
    regular: '400' as TextStyle['fontWeight'],
    medium: '500' as TextStyle['fontWeight'],
    semibold: '600' as TextStyle['fontWeight'],
    bold: '700' as TextStyle['fontWeight'],
    black: '900' as TextStyle['fontWeight'],
};

// Pre-composed text styles
export const Typography = {
    // === HEADERS ===
    displayHero: {
        fontFamily: Fonts.mono,
        fontSize: FontSizes.hero,
        lineHeight: LineHeights.hero,
        fontWeight: FontWeights.bold,
    } as TextStyle,

    h1: {
        fontFamily: Fonts.primary,
        fontSize: FontSizes.xxl,
        lineHeight: LineHeights.xxl,
        fontWeight: FontWeights.bold,
    } as TextStyle,

    h2: {
        fontFamily: Fonts.primary,
        fontSize: FontSizes.xl,
        lineHeight: LineHeights.xl,
        fontWeight: FontWeights.semibold,
    } as TextStyle,

    h3: {
        fontFamily: Fonts.primary,
        fontSize: FontSizes.lg,
        lineHeight: LineHeights.lg,
        fontWeight: FontWeights.semibold,
    } as TextStyle,

    // === BODY ===
    body: {
        fontFamily: Fonts.primary,
        fontSize: FontSizes.body,
        lineHeight: LineHeights.body,
        fontWeight: FontWeights.regular,
    } as TextStyle,

    bodyMedium: {
        fontFamily: Fonts.primary,
        fontSize: FontSizes.body,
        lineHeight: LineHeights.body,
        fontWeight: FontWeights.medium,
    } as TextStyle,

    caption: {
        fontFamily: Fonts.primary,
        fontSize: FontSizes.sm,
        lineHeight: LineHeights.sm,
        fontWeight: FontWeights.regular,
    } as TextStyle,

    // === DATA / MONOSPACED ===
    ticker: {
        fontFamily: Fonts.mono,
        fontSize: FontSizes.body,
        lineHeight: LineHeights.body,
        fontWeight: FontWeights.bold,
    } as TextStyle,

    price: {
        fontFamily: Fonts.mono,
        fontSize: FontSizes.md,
        lineHeight: LineHeights.md,
        fontWeight: FontWeights.semibold,
    } as TextStyle,

    priceSmall: {
        fontFamily: Fonts.mono,
        fontSize: FontSizes.sm,
        lineHeight: LineHeights.sm,
        fontWeight: FontWeights.medium,
    } as TextStyle,

    priceLarge: {
        fontFamily: Fonts.mono,
        fontSize: FontSizes.xxl,
        lineHeight: LineHeights.xxl,
        fontWeight: FontWeights.bold,
    } as TextStyle,

    dataLabel: {
        fontFamily: Fonts.mono,
        fontSize: FontSizes.xs,
        lineHeight: LineHeights.xs,
        fontWeight: FontWeights.regular,
    } as TextStyle,

    // Ticker tape marquee
    tickerTape: {
        fontFamily: Fonts.mono,
        fontSize: FontSizes.sm,
        lineHeight: 24, // 24px high marquee
        fontWeight: FontWeights.medium,
    } as TextStyle,

    // Phosphor Glow HUD Styles
    phosphorGreen: {
        color: Colors.kineticGreen,
        textShadowColor: 'rgba(0, 255, 65, 0.5)',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 8,
    },
    phosphorAmber: {
        color: Colors.thermalAmber,
        textShadowColor: 'rgba(255, 149, 0, 0.5)',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 8,
    },
} as const;
