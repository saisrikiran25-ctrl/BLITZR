import { Platform } from 'react-native';

/**
 * Haptic Feedback Service
 * 
 * BLITZR uses "Taptic" feedback to simulate physical machinery.
 * Per Design Doc §4.1:
 * - "Click": Sharp, medium-impact on trade confirmed
 * - "Scroll": Light ticks on Ticker Tape scroll
 * - "Alert": Double-pulse on 10%+ crash
 */

// Note: In production, use react-native-haptic-feedback
// This is a stub for the interface
class HapticService {
    /**
     * Sharp, medium-impact haptic when a trade is confirmed.
     */
    tradeConfirmed() {
        if (Platform.OS === 'ios') {
            // RNHapticFeedback.trigger('impactMedium');
        }
    }

    /**
     * Light haptic ticks when scrolling through the Ticker Tape.
     */
    scrollTick() {
        if (Platform.OS === 'ios') {
            // RNHapticFeedback.trigger('impactLight');
        }
    }

    /**
     * Double-pulse haptic when a stock crashes 10%+.
     */
    crashAlert() {
        if (Platform.OS === 'ios') {
            // RNHapticFeedback.trigger('notificationError');
        }
    }

    /**
     * Success notification haptic.
     */
    success() {
        if (Platform.OS === 'ios') {
            // RNHapticFeedback.trigger('notificationSuccess');
        }
    }
}

export const haptics = new HapticService();
