import React, { useCallback } from 'react';
import {
    Text,
    StyleSheet,
    ViewStyle,
    StyleProp,
    ActivityIndicator,
    Pressable,
} from 'react-native';
import { audioService } from '../../services/AudioService';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Typography, Spacing, Gradients, Fonts, FontWeights } from '../../theme';

interface ButtonProps {
    title: string;
    onPress: () => void;
    variant?: 'buy' | 'sell' | 'primary' | 'secondary' | 'danger';
    size?: 'sm' | 'md' | 'lg' | 'xl';
    disabled?: boolean;
    loading?: boolean;
    fullWidth?: boolean;
    style?: StyleProp<ViewStyle>;
    onLongPress?: () => void;
    delayLongPress?: number;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * BLITZR Premium Industrial Button
 * - Centralized Audio & Haptic feedback (§7 Design Doc)
 * - Spring-based micro-animations
 * - Linear Gradient "Bull/Bear" variants
 */
export const Button: React.FC<ButtonProps> = ({
    title,
    onPress,
    variant = 'primary',
    size = 'md',
    disabled = false,
    loading = false,
    fullWidth = false,
    style,
    onLongPress,
    delayLongPress,
}) => {
    const scale = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    const handlePressIn = useCallback(() => {
        if (!disabled && !loading) {
            scale.value = withSpring(0.96);
            audioService.playSFX('CLICK');
        }
    }, [disabled, loading, scale]);

    const handlePressOut = useCallback(() => {
        scale.value = withSpring(1);
    }, [scale]);

    const handlePress = useCallback(() => {
        if (!disabled && !loading) {
            audioService.playSFX(variant === 'buy' || variant === 'sell' ? 'TRADE_SUCCESS' : 'CLICK');
            onPress();
        }
    }, [disabled, loading, onPress, variant]);

    const renderContent = () => {
        if (loading) {
            return <ActivityIndicator color={Colors.textPrimary} size="small" />;
        }
        return (
            <Text
                style={[
                    styles.text,
                    textSizeStyles[size],
                    variant === 'secondary' && styles.secondaryText,
                ]}
            >
                {title}
            </Text>
        );
    };

    const gradientColors = (variant === 'buy' ? Gradients.buttonBuy :
        variant === 'sell' ? Gradients.buttonSell : null) as any;

    return (
        <AnimatedPressable
            onPress={handlePress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            onLongPress={!disabled && !loading ? onLongPress : undefined}
            delayLongPress={delayLongPress}
            disabled={disabled || loading}
            style={[
                styles.base,
                variantStyles[variant],
                sizeStyles[size],
                fullWidth && styles.fullWidth,
                disabled && styles.disabled,
                style,
                animatedStyle,
            ]}
        >
            {gradientColors && (
                <LinearGradient
                    colors={gradientColors}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={StyleSheet.absoluteFill as any}
                />
            )}
            {renderContent()}
        </AnimatedPressable>
    );
};

const styles = StyleSheet.create({
    base: {
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 100, // Pill shaped for modern gamified look
        overflow: 'hidden',
        borderTopWidth: 1.5,
        borderTopColor: 'rgba(255, 255, 255, 0.25)', // Stronger inner highlight
    },
    fullWidth: {
        width: '100%',
    },
    disabled: {
        opacity: 0.4,
    },
    text: {
        ...Typography.bodyMedium,
        fontFamily: Fonts.bold, // Bolder
        color: Colors.textPrimary,
        fontWeight: FontWeights.bold,
        textTransform: 'uppercase', // Aggressive gamified text
        letterSpacing: 2, // Wider tracking
    },
    secondaryText: {
        color: Colors.textSecondary,
    },
});

const variantStyles = StyleSheet.create({
    buy: {
        backgroundColor: Colors.kineticGreen,
    },
    sell: {
        backgroundColor: Colors.thermalRed,
    },
    primary: {
        backgroundColor: Colors.titaniumGray,
        borderWidth: 1,
        borderColor: Colors.glassBorder,
    },
    secondary: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: Colors.slateNeutral,
    },
    danger: {
        backgroundColor: Colors.thermalRed,
    },
});

const sizeStyles = StyleSheet.create({
    sm: {
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.lg,
        minHeight: 32,
    },
    md: {
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.xl,
        minHeight: 44,
    },
    lg: {
        paddingVertical: Spacing.lg,
        paddingHorizontal: Spacing.xxl,
        minHeight: 52,
    },
    xl: {
        paddingVertical: Spacing.xl,
        paddingHorizontal: Spacing.xxxl,
        minHeight: 64,
    },
});

const textSizeStyles = StyleSheet.create({
    sm: { fontSize: 11 },
    md: { fontSize: 13 },
    lg: { fontSize: 15 },
    xl: { fontSize: 17 },
});
