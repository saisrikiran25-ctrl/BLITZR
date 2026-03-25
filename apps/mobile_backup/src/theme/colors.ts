// ============================================================
// BLITZR: Obsidian Industrial Color Palette
// Design Language: "Palantir Foundry meets Tesla Interface"
// ============================================================

export const Colors = {
    // === BASE ===
    obsidianBase: '#0A0A0B',        // Primary background — OLED black
    titaniumGray: '#1C1C1E',        // Secondary surface (cards, panels, inputs)
    slateNeutral: '#8E8E93',        // Secondary text, borders
    pureBlack: '#000000',           // True black for OLED depth

    // === KINETIC ACCENTS ===
    kineticGreen: '#00FF41',        // Bull / Buy / Gains — vintage terminal phosphor
    thermalRed: '#FF3B30',          // Bear / Sell / Losses — alert red
    activeGold: '#FFD60A',           // Blue Chip status, premium IPOs
    phosphorGreen: '#00FF41',
    thermalAmber: '#FF9500',
    neuralBlue: '#0A84FF',

    // === TEXT ===
    textPrimary: '#FFFFFF',
    textSecondary: '#8E8E93',
    textTertiary: '#636366',
    textInverse: '#000000',

    // === SURFACE ===
    cardBackground: '#1C1C1E',
    cardBorder: 'rgba(142, 142, 147, 0.2)',
    glassTint: 'rgba(255, 255, 255, 0.08)',    // 8% white for glass panels
    glassOverlay: 'rgba(255, 255, 255, 0.20)',  // 20% white Material Backdrop
    glassBorder: 'rgba(255, 255, 255, 0.12)',

    // === GLOW EFFECTS ===
    glowGreen: 'rgba(0, 255, 65, 0.50)',
    glowRed: 'rgba(255, 59, 48, 0.40)',
    glowGold: 'rgba(255, 214, 10, 0.40)',
    glowCobalt: 'rgba(10, 132, 255, 0.40)',

    // === MATERIALS (Glassmorphism) ===
    materialDark: 'rgba(10, 10, 11, 0.70)',    // Deep Obsidian Glass
    materialLight: 'rgba(255, 255, 255, 0.05)', // Subtle Surface
    materialTitanium: 'rgba(28, 28, 30, 0.80)', // Solid Titanium Glass

    // === STATUS ===
    success: '#00FF41',
    error: '#FF3B30',
    warning: '#FFD60A',
    info: '#0A84FF',

    // === CHART ===
    chartGreenLine: '#00FF41',
    chartRedLine: '#FF3B30',
    chartGrid: 'rgba(142, 142, 147, 0.1)',

    // === TRANSPARENCIES ===
    overlay: 'rgba(10, 10, 11, 0.85)',
    pulseGreen: 'rgba(0, 255, 65, 0.15)',
    pulseRed: 'rgba(255, 59, 48, 0.15)',
    nukeFlash: 'rgba(255, 59, 48, 0.3)',
} as const;

export type ColorKey = keyof typeof Colors;
