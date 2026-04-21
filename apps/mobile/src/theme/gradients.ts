// ============================================================
// BLITZR: Gradients — "Neon Cyber Flow"
// ============================================================

import { Colors } from './colors';

export const Gradients = {
    // Primary background — Toned down (Reduced blue intensity)
    obsidianDeep: ['#06060E', '#020205', '#000000', '#000000'],

    // Gamified VIP background
    vipGold: ['#FFD700', '#FF8C00', '#8B0000', '#000000'],

    // Glass card reflective shine (Top-Left to Bottom-Right)
    glassShine: [
        'rgba(255, 255, 255, 0.18)',
        'rgba(255, 255, 255, 0.05)',
        'rgba(255, 255, 255, 0.01)',
    ],

    // Thermal Trace HUD backgrounds
    thermalTraceGreen: [
        'rgba(0, 250, 154, 0.15)',
        'rgba(0, 250, 154, 0.03)',
        'transparent',
    ],
    thermalTraceRed: [
        'rgba(255, 51, 102, 0.15)',
        'rgba(255, 51, 102, 0.03)',
        'transparent',
    ],

    // Status-based highlights
    kineticGreen: [
        'rgba(0, 250, 154, 0.40)',
        'rgba(0, 250, 154, 0.08)',
        'transparent',
    ],
    thermalRed: [
        'rgba(255, 51, 102, 0.30)',
        'rgba(255, 51, 102, 0.04)',
        'transparent',
    ],

    // Interactive buttons
    buttonBuy: [Colors.kineticGreen, '#00C870'],
    buttonSell: [Colors.thermalRed, '#D00030'],
    buttonSecondary: [Colors.titaniumGray, Colors.obsidianBase],
    buttonGold: [Colors.activeGold, '#FF8C00'],
} as const;
