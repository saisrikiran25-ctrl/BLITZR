import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, BorderRadius, Gradients } from '../../theme';

interface GlassCardProps {
    children: React.ReactNode;
    style?: StyleProp<ViewStyle>;
    variant?: 'default' | 'elevated' | 'flat';
    intensity?: number;
    hasShimmer?: boolean;
}

/**
 * GlassCard — Reimagined for High Fidelity
 * Uses expo-blur for real-time translucent depth and LinearGradient for surface shine.
 * Aesthetic: Palantir HUD / Industrial Glass
 *
 * Android note: BlurView has no effect on API < 31 (renders transparent).
 * We layer a solid dark fill beneath it so the card aesthetic is preserved
 * on all Android devices regardless of API level.
 */
export const GlassCard: React.FC<GlassCardProps> = ({
    children,
    style,
    variant = 'default',
    intensity = 20,
    hasShimmer = true,
}) => {
    return (
        <View style={[styles.card, variantStyles[variant], style]}>
            {/* Android fallback: solid dark fill so BlurView transparency doesn't break aesthetics on API < 31 */}
            {Platform.OS === 'android' && (
                <View
                    style={[
                        StyleSheet.absoluteFill as any,
                        styles.androidBlurFallback,
                    ]}
                />
            )}
            <BlurView
                intensity={Platform.OS === 'web' ? 0 : intensity}
                tint="dark"
                style={StyleSheet.absoluteFill as any}
            />
            {hasShimmer && variant !== 'flat' && (
                <LinearGradient
                    colors={Gradients.glassShine as any}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0.5, y: 0.5 }}
                    style={StyleSheet.absoluteFill as any}
                />
            )}
            <View style={styles.content}>
                {children}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        borderRadius: BorderRadius.card,
        borderWidth: 1.5,
        borderColor: Colors.glassBorder, // Thick reflective rim
        overflow: 'hidden',
        // Subtle, refined dark blue shadow (Substantially toned down)
        shadowColor: '#000D1A',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
        elevation: 6,
    },
    androidBlurFallback: {
        backgroundColor: 'rgba(15, 20, 30, 0.82)',
    },
    content: {
        padding: 16,
    },
});

const variantStyles = StyleSheet.create({
    default: {
        backgroundColor: Colors.materialDark,
    },
    elevated: {
        backgroundColor: Colors.materialTitanium,
        borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    flat: {
        backgroundColor: Colors.materialLight,
        borderWidth: 0,
    },
});
