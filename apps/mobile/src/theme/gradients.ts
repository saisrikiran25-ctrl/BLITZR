// ============================================================
// BLITZR: Gradients — "The Obsidian Flow"
// ============================================================

import { Colors } from './colors';

export const Gradients = {
    // Primary background with deep top-down falloff (4-stop OLED)
    obsidianDeep: ['#1C1C1E', '#101011', '#050505', '#000000'],

    // Glass card reflective shine (Top-Left to Bottom-Right)
    glassShine: [
        'rgba(255, 255, 255, 0.12)',
        'rgba(255, 255, 255, 0.04)',
        'rgba(255, 255, 255, 0.02)',
    ],

    // Thermal Trace HUD backgrounds
    thermalTraceGreen: [
        'rgba(0, 255, 65, 0.08)',
        'rgba(0, 255, 65, 0.02)',
        'transparent',
    ],
    thermalTraceRed: [
        'rgba(255, 59, 48, 0.08)',
        'rgba(255, 59, 48, 0.02)',
        'transparent',
    ],

    // Status-based highlights
    kineticGreen: [
        'rgba(0, 255, 65, 0.25)',
        'rgba(0, 255, 65, 0.05)',
        'transparent',
    ],
    thermalRed: [
        'rgba(255, 59, 48, 0.20)',
        'rgba(255, 59, 48, 0.04)',
        'transparent',
    ],

    // Interactive buttons
    buttonBuy: [Colors.kineticGreen, '#00C832'],
    buttonSell: [Colors.thermalRed, '#D72C21'],
    buttonSecondary: [Colors.titaniumGray, Colors.obsidianBase],
} as const;
