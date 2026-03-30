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
            <BlurView
                intensity={Platform.OS === 'web' ? 0 : intensity}
                tint="dark"
                style={StyleSheet.absoluteFill}
            />
            {hasShimmer && variant !== 'flat' && (
                <LinearGradient
                    colors={Gradients.glassShine as any}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0.5, y: 0.5 }}
                    style={StyleSheet.absoluteFill}
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
        borderWidth: 1,
        borderColor: Colors.glassBorder,
        overflow: 'hidden',
        // Shadow for depth
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
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
