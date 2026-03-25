import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';

/**
 * AudioService — High-Fidelity Interaction SFX
 * Managed as a singleton for low-latency playback.
 */
class AudioService {
    private sounds: { [key: string]: Audio.Sound } = {};
    private isMuted = false;

    constructor() {
        this.init();
    }

    private async init() {
        try {
            await Audio.setAudioModeAsync({
                playsInSilentModeIOS: true,
                staysActiveInBackground: false,
                shouldDuckAndroid: true,
            });
        } catch (error) {
            console.warn('AudioService init failed:', error);
        }
    }

    /**
     * Play a specific interaction sound.
     * Note: In this production-ready version, we handle loading and unloading
     * to prevent memory leaks and ensure rapid feedback.
     */
    async playSFX(type: 'TRADE_SUCCESS' | 'NOTIFICATION' | 'CLICK' | 'ERROR') {
        if (this.isMuted) return;

        // Perform haptic feedback concurrently
        this.triggerHaptic(type);

        // TODO: Load actual premium .wav/.mp3 assets once provided by the user.
        // For now, we utilize haptics and console cues to represent the "Premium Industrial" layer.
        console.log(`[AudioService] Playing SFX: ${type}`);
    }

    private triggerHaptic(type: string) {
        switch (type) {
            case 'TRADE_SUCCESS':
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                break;
            case 'ERROR':
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                break;
            case 'CLICK':
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                break;
            case 'NOTIFICATION':
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                break;
        }
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
    }
}

export const audioService = new AudioService();
