import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { Colors, Typography } from '../../theme';

interface TickerItem {
    ticker_id: string;
    price: number;
    change_pct: number;
}

interface TickerTapeProps {
    items: TickerItem[];
    speed?: number;
}

/**
 * TickerTape - Absolute Precision "Raw" Mode
 * No truncation. No percentages. Pure Monochromatic HUD.
 * Vertical Pipe separator " | " marks the new version.
 */
export const MasterTickerTape: React.FC<TickerTapeProps> = ({ items, speed = 40 }) => {
    const scrollX = useRef(new Animated.Value(0)).current;

    // Use RAW ticker_id only. Convert to uppercase for HUD aesthetic.
    const rawLabels = items.map(item => item.ticker_id.toUpperCase());
    
    // Duplicate for seamless loop
    const displayLabels = [...rawLabels, ...rawLabels];
    
    // Use Vertical Pipe separator as requested for distinct HUD look
    const SEPARATOR = '   |   ';
    const fullString = displayLabels.join(SEPARATOR) + SEPARATOR;

    // Estimate width: monospaced characters (~10px width including tracking)
    // Using a slightly larger multiplier to ensure no clip
    const estimatedWidth = fullString.length * 9.5; 
    const halfWidth = estimatedWidth / 2;

    useEffect(() => {
        if (items.length === 0) return;
        
        scrollX.setValue(0);
        const animation = Animated.loop(
            Animated.timing(scrollX, {
                toValue: -halfWidth,
                duration: (halfWidth / speed) * 1000,
                easing: Easing.linear,
                useNativeDriver: true,
            }),
        );
        animation.start();
        return () => animation.stop();
    }, [items.length, halfWidth, speed, scrollX]);

    if (items.length === 0) return null;

    return (
        <View style={styles.container}>
            <Animated.View
                style={[
                    styles.scrollContainer,
                    { transform: [{ translateX: scrollX }] },
                ]}
            >
                <Text style={styles.tape} numberOfLines={1}>
                    {fullString}
                </Text>
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        height: 24,
        backgroundColor: 'red', // NUCLEAR TEST COLOR
        overflow: 'hidden',
        borderBottomWidth: 0.5,
        borderBottomColor: 'transparent',
        justifyContent: 'center',
    },
    scrollContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    tape: {
        ...Typography.tickerTape,
        color: '#FFFFFF', // Forced Pure White
    },
});
