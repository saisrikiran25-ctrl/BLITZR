import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
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

const ITEM_WIDTH = 160;

const formatTicker = (id: string) => {
    if (!id) return '';
    if (id.length <= 4) return id;
    const hasPrefix = id.startsWith('$');
    const start = hasPrefix ? id.substring(0, 2) : id.substring(0, 1);
    const end = id.slice(-2);
    return `${start}${end}`;
};

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
                        <Text style={styles.tickerName}>
                            {formatTicker(item.ticker_id)}
                        </Text>
                        <Text style={styles.change}>
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
        backgroundColor: Colors.pureBlack,
        overflow: 'hidden',
        borderBottomWidth: 0.5,
        borderBottomColor: 'transparent',
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
        color: Colors.textPrimary,
    },
});
