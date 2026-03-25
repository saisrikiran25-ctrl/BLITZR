// ============================================================
// BLITZR: Spacing — Strict 4px Grid
// ============================================================

export const Spacing = {
    /** 2px — hairline */
    xxs: 2,
    /** 4px — minimum spacing */
    xs: 4,
    /** 8px — tight spacing */
    sm: 8,
    /** 12px */
    md: 12,
    /** 16px — standard spacing */
    lg: 16,
    /** 20px */
    xl: 20,
    /** 24px — section spacing */
    xxl: 24,
    /** 32px — large sections */
    xxxl: 32,
    /** 40px */
    huge: 40,
    /** 48px */
    massive: 48,
} as const;

export const BorderRadius = {
    /** 2px — sharp industrial corners */
    sharp: 2,
    /** 4px — standard cards (Design doc: 2-4px, no bubbly) */
    card: 4,
    /** 8px — buttons and inputs */
    button: 8,
    /** 12px — bottom sheets */
    sheet: 12,
    /** 999px — pill shape (sentiment slider) */
    pill: 999,
} as const;

export const IconSize = {
    sm: 16,
    md: 20,
    lg: 24,
    xl: 32,
} as const;

// Glassmorphism Material Backdrop constants
export const Glass = {
    /** Background blur radius (Design doc: 30px heavy blur) */
    blurAmount: 30,
    /** White tint opacity (Design doc: 20%) */
    tintOpacity: 0.2,
    /** Border opacity */
    borderOpacity: 0.12,
} as const;
