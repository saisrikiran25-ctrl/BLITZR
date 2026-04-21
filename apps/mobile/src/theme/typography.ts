// ============================================================
// BLITZR: Modern Typography — "Gamified Cyberpunk"
// Primary: Inter (Modern, professional, highly readable)
// Tone: Vibrant, neon, extreme contrast
// ============================================================

import { TextStyle } from 'react-native';
import { Colors } from './colors';

export const Fonts = {
    primary: 'Inter_400Regular',
    medium: 'Inter_500Medium',
    semibold: 'Inter_600SemiBold',
    bold: 'Inter_700Bold',
};

// Larger font sizing for a chunkier gamified feel
export const FontSizes = {
    xs: 12,     
    sm: 14,     
    body: 16,   
    md: 18,     
    lg: 20,     
    xl: 24,     
    xxl: 32,    
    hero: 44,   
    display: 60,
} as const;

export const LineHeights = {
    xs: 18,
    sm: 20,
    body: 24,
    md: 26,
    lg: 28,
    xl: 32,
    xxl: 40,
    hero: 52,
    display: 68,
} as const;

export const FontWeights = {
    regular: '400' as TextStyle['fontWeight'],
    medium: '500' as TextStyle['fontWeight'],
    semibold: '600' as TextStyle['fontWeight'],
    bold: '800' as TextStyle['fontWeight'], // Extra chunky bold
};

export const Typography = {
    displayHero: {
        fontFamily: Fonts.bold,
        fontSize: FontSizes.hero,
        lineHeight: LineHeights.hero,
        fontWeight: FontWeights.bold,
        letterSpacing: -2, 
        textTransform: 'uppercase', // Cyberpunk standard
    } as TextStyle,

    h1: {
        fontFamily: Fonts.bold,
        fontSize: FontSizes.xxl,
        lineHeight: LineHeights.xxl,
        fontWeight: FontWeights.bold,
        letterSpacing: -1,
        textTransform: 'uppercase',
    } as TextStyle,

    h2: {
        fontFamily: Fonts.semibold,
        fontSize: FontSizes.xl,
        lineHeight: LineHeights.xl,
        fontWeight: FontWeights.bold,
        letterSpacing: -0.5,
    } as TextStyle,

    h3: {
        fontFamily: Fonts.semibold,
        fontSize: FontSizes.lg,
        lineHeight: LineHeights.lg,
        fontWeight: FontWeights.bold,
        letterSpacing: 0,
    } as TextStyle,

    body: {
        fontFamily: Fonts.primary,
        fontSize: FontSizes.body,
        lineHeight: LineHeights.body,
        fontWeight: FontWeights.medium, // Thicker base body for contrast
    } as TextStyle,

    bodyMedium: {
        fontFamily: Fonts.medium,
        fontSize: FontSizes.body,
        lineHeight: LineHeights.body,
        fontWeight: FontWeights.semibold,
    } as TextStyle,

    caption: {
        fontFamily: Fonts.primary,
        fontSize: FontSizes.sm,
        lineHeight: LineHeights.sm,
        fontWeight: FontWeights.medium,
        color: Colors.textSecondary,
        letterSpacing: 0.5,
    } as TextStyle,

    ticker: {
        fontFamily: Fonts.bold,
        fontSize: FontSizes.md,
        lineHeight: LineHeights.md,
        fontWeight: FontWeights.bold,
        letterSpacing: 1, // Gamified tracking
    } as TextStyle,

    price: {
        fontFamily: Fonts.bold,
        fontSize: FontSizes.md,
        lineHeight: LineHeights.md,
        fontWeight: FontWeights.bold,
        letterSpacing: -0.5,
    } as TextStyle,

    priceSmall: {
        fontFamily: Fonts.semibold,
        fontSize: FontSizes.sm,
        lineHeight: LineHeights.sm,
        fontWeight: FontWeights.semibold,
        letterSpacing: -0.25,
    } as TextStyle,

    priceLarge: {
        fontFamily: Fonts.bold,
        fontSize: FontSizes.xxl,
        lineHeight: LineHeights.xxl,
        fontWeight: FontWeights.bold,
        letterSpacing: -1.5,
    } as TextStyle,

    dataLabel: {
        fontFamily: Fonts.bold,
        fontSize: FontSizes.xs,
        lineHeight: LineHeights.xs,
        fontWeight: FontWeights.bold,
        color: Colors.textSecondary,
        letterSpacing: 2, // Modern wide label format
        textTransform: 'uppercase',
    } as TextStyle,

    tickerTape: {
        fontFamily: Fonts.bold,
        fontSize: FontSizes.body,
        lineHeight: 24,
        fontWeight: FontWeights.bold,
        letterSpacing: 2,
        textTransform: 'uppercase',
    } as TextStyle,

    phosphorGreen: {
        color: Colors.kineticGreen,
        textShadowColor: Colors.glowGreen,
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 8,
    },
    phosphorAmber: {
        color: Colors.thermalAmber,
        textShadowColor: Colors.thermalAmber,
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 8,
    },
} as const;
