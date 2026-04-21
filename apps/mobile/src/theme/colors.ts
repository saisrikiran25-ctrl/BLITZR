// ============================================================
// BLITZR: College Neon Cyberpunk Palette
// Design Language: Vibrant, Gamified, High-Contrast
// ============================================================

export const Colors = {
    // === BASE ===
    obsidianBase: '#020205',        // Midnight Black (Reduced blue)
    titaniumGray: '#0A0A0F',        // Deep Slate
    slateNeutral: '#8B92A5',        // Silver/blue neutral
    pureBlack: '#000000',           // True black

    // === REFINED ACCENTS (Gamer/Neon Aesthetic) ===
    kineticGreen: '#00FA9A',        // Toxic Neon Mint - Extreme pop
    thermalRed: '#FF3366',          // Cybernetic Pink-Red
    activeGold: '#FFD700',          // Pure Cyber Gold
    phosphorGreen: '#00FA9A',
    thermalAmber: '#FF7F50',        // Coral / Neon Orange
    neuralBlue: '#00E5FF',          // Tron / Cyan Neon Blue

    // === TEXT ===
    textPrimary: '#FFFFFF',
    textSecondary: '#A0B0C0',       // Frosty slate
    textTertiary: '#64748B',        
    textInverse: '#000000',

    // === SURFACE ===
    cardBackground: '#06060C',      // Toned down midnight violet
    cardBorder: 'rgba(255, 255, 255, 0.08)',
    glassTint: 'rgba(255, 255, 255, 0.015)',
    glassOverlay: 'rgba(255, 255, 255, 0.05)', 
    glassBorder: 'rgba(255, 255, 255, 0.10)', // Slightly softer border

    // === SOFT GLOWS (HUD/Cyber glows) ===
    glowGreen: 'rgba(0, 250, 154, 0.35)',
    glowRed: 'rgba(255, 51, 102, 0.30)',
    glowGold: 'rgba(255, 215, 0, 0.30)',
    glowCobalt: 'rgba(0, 229, 255, 0.30)',

    // === MATERIALS (Refined Glassmorphism) ===
    materialDark: 'rgba(5, 5, 17, 0.90)',    
    materialLight: 'rgba(255, 255, 255, 0.03)', 
    materialTitanium: 'rgba(16, 16, 30, 0.95)', 

    // === STATUS ===
    success: '#00FA9A',
    error: '#FF3366',
    warning: '#FFD700',
    info: '#00E5FF',

    // === CHART ===
    chartGreenLine: '#00FA9A',
    chartRedLine: '#FF3366',
    chartGrid: 'rgba(255, 255, 255, 0.05)',

    // === TRANSPARENCIES ===
    overlay: 'rgba(0, 0, 0, 0.85)',
    pulseGreen: 'rgba(0, 250, 154, 0.15)',
    pulseRed: 'rgba(255, 51, 102, 0.12)',
    nukeFlash: 'rgba(255, 51, 102, 0.4)',
} as const;

export type ColorKey = keyof typeof Colors;
