import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { Colors, Typography, Spacing } from '../../theme';

interface TickerItem {
    ticker_id: string;
    price: number;
    change_pct: number;
}

interface TickerTapeProps {
    items: TickerItem[];
    speed?: number;
}

export const TickerTape: React.FC<TickerTapeProps> = ({ items, speed = 40 }) => {
    const scrollX = useRef(new Animated.Value(0)).current;

    // Build flat label array: ticker name + separator
    const labels: string[] = items.map((item) => item.ticker_id);
    // Each label rendered as its own Text node with a separator
    const displayLabels = [...labels, ...labels]; // duplicate for seamless loop

    // Measure total width: we won't use fixed ITEM_WIDTH at all.
    // Instead render everything in one long Animated.View and let text be natural width.
    // To get seamless loop we duplicate and translate by half.
    const SEPARATOR = '   ·   ';
    const fullString = displayLabels.join(SEPARATOR);

    // Since we can't measure before render, we use a large fixed scroll distance
    // based on character count — safe for a marquee.
    const estimatedWidth = fullString.length * 9; // ~9px per char at tickerTape font size
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
        backgroundColor: Colors.pureBlack,
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
        color: Colors.textPrimary,
        whiteSpace: 'nowrap',
    },
});
