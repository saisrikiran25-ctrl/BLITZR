import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions, Easing } from 'react-native';
import { Colors, Typography, Spacing } from '../../theme';

/**
 * TickerTape — Kinetic Scrolling Marquee
 * 
 * At the very top of every screen (except Vault).
 * 24px high, monospaced white text on Obsidian.
 * Seamlessly scrolls real-time price changes.
 * 
 * Per Design Doc §2.2
 */

interface TickerItem {
    ticker_id: string;
    price: number;
    change_pct: number;
}

interface TickerTapeProps {
    items: TickerItem[];
    speed?: number;
}

const SCREEN_WIDTH = Dimensions.get('window').width;
const ITEM_WIDTH = 160;

export const TickerTape: React.FC<TickerTapeProps> = ({
    items,
    speed = 50,
}) => {
    const scrollX = useRef(new Animated.Value(0)).current;
    const totalWidth = items.length * ITEM_WIDTH;

    useEffect(() => {
        if (items.length === 0) return;

        const duration = (totalWidth / speed) * 1000;

        const animation = Animated.loop(
            Animated.timing(scrollX, {
                toValue: -totalWidth,
                duration,
                easing: Easing.linear,
                useNativeDriver: true,
            }),
        );
        animation.start();

        return () => animation.stop();
    }, [items.length, totalWidth, speed, scrollX]);

    if (items.length === 0) return null;

    // Duplicate items for seamless loop
    const displayItems = [...items, ...items];

    return (
        <View style={styles.container}>
            <Animated.View
                style={[
                    styles.scrollContainer,
                    { transform: [{ translateX: scrollX }] },
                ]}
            >
                {displayItems.map((item, index) => (
                    <View key={`${item.ticker_id}-${index}`} style={styles.item}>
                        <Text style={styles.tickerName}>{item.ticker_id}</Text>
                        <Text
                            style={[
                                styles.change,
                                item.change_pct >= 0 ? styles.positive : styles.negative,
                            ]}
                        >
                            {item.change_pct >= 0 ? '+' : ''}
                            {item.change_pct.toFixed(1)}%
                        </Text>
                    </View>
                ))}
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        height: 24,
        backgroundColor: Colors.obsidianBase,
        overflow: 'hidden',
        borderBottomWidth: 0.5,
        borderBottomColor: Colors.cardBorder,
    },
    scrollContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 24,
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        width: ITEM_WIDTH,
        paddingHorizontal: Spacing.sm,
    },
    tickerName: {
        ...Typography.tickerTape,
        color: Colors.textPrimary,
        marginRight: Spacing.xs,
    },
    change: {
        ...Typography.tickerTape,
    },
    positive: {
        color: Colors.kineticGreen,
    },
    negative: {
        color: Colors.thermalRed,
    },
});
