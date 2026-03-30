// ============================================================
// BLITZR: Animation Constants
// All animations must maintain 60fps.
// Motion conveys "live data," not decoration.
// ============================================================

export const Animations = {
    // Screen transitions (Design doc: 200ms with motion blur)
    screenTransition: {
        duration: 200,
        type: 'timing',
    },

    // Price odometer roll
    odometerDuration: 300,

    // Chart wiggle (1px jitter for Market Maker activity)
    chartWiggle: {
        amplitude: 1,     // 1px jitter
        frequency: 2000,  // Wiggle every 2s
    },

    // Pulse indicator blip
    pulseBlip: {
        duration: 150,
        fadeOut: 500,
    },

    // Ticker tape scroll speed
    tickerTapeSpeed: 50, // px per second

    // Button press feedback
    buttonPress: {
        scale: 0.97,
        duration: 100,
    },

    // Delist hold-to-confirm (Design doc: 3 seconds)
    delistHoldDuration: 3000,

    // Nuke flash overlay
    nukeFlash: {
        duration: 500,
        opacity: 0.3,
    },

    // Sentiment slider animation
    sentimentSlider: {
        duration: 400,
    },

    // Skeleton shimmer
    skeleton: {
        duration: 1500,
    },
} as const;
