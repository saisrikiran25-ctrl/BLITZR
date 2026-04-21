import React from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    StatusBar,
} from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    interpolate
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useMarketStore } from '../../store/useMarketStore';
import { GlassCard } from '../../components/common/GlassCard';
import { TickerTape } from '../../components/common/TickerTape';
import { SkeletonCard } from '../../components/common/SkeletonScreen';
import { Colors, Typography, Spacing, Gradients, Fonts } from '../../theme';
import { formatPrice, formatPctChange, formatCompact } from '../../utils/formatters';

/**
 * TradingFloorScreen — High-Fidelity HUD
 */
export const TradingFloorScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
    const { tickers, tickerTapeItems, globalMarketCap, isLoading } = useMarketStore();

    // Pulse Animation for Hero
    const pulse = useSharedValue(0);
    React.useEffect(() => {
        pulse.value = withRepeat(withTiming(1, { duration: 2000 }), -1, true);
    }, [pulse]);

    const animatedHeroGlow = useAnimatedStyle(() => ({
        opacity: interpolate(pulse.value, [0, 1], [0.3, 0.8]),
        transform: [{ scaleX: interpolate(pulse.value, [0, 1], [0.8, 1.2]) }],
    }));

    const tickerList = Object.values(tickers).sort(
        (a, b) => Math.abs(b.change_pct) - Math.abs(a.change_pct),
    );

    const renderTickerItem = ({ item }: { item: typeof tickerList[0] }) => {
        const isPositive = item.change_pct >= 0;

        return (
            <TouchableOpacity
                onPress={() => navigation.navigate('TickerDetail', { tickerId: item.ticker_id })}
                activeOpacity={0.8}
            >
                <GlassCard style={styles.tickerRow} variant="default" intensity={8}>
                    {/* Thermal Trace Glow */}
                    <LinearGradient
                        colors={(isPositive ? Gradients.thermalTraceGreen : Gradients.thermalTraceRed) as any}
                        style={StyleSheet.absoluteFill as any}
                        start={{ x: 0, y: 0.5 }}
                        end={{ x: 1, y: 0.5 }}
                    />

                    <View style={styles.tickerLeft}>
                        <Text style={styles.tickerSymbol}>{item.ticker_id}</Text>
                        <Text style={styles.tickerNameSub}>PRIMARY ENTITY</Text>
                        <Text style={styles.tickerPrice}>
                            {formatPrice(item.price)}
                        </Text>
                        <Text style={styles.tickerSupply}>S: {formatCompact(item.supply)}</Text>
                    </View>
                    <View style={styles.tickerRight}>
                        <View style={[styles.pnlBadge, isPositive ? styles.pnlBadgePos : styles.pnlBadgeNeg]}>
                            <Text style={styles.pnlText}>
                                {isPositive ? '▲' : '▼'} {formatPctChange(item.change_pct)}
                            </Text>
                        </View>
                        <Text style={styles.volumeLabel}>
                            V: {formatCompact(item.volume)}
                        </Text>
                    </View>
                </GlassCard>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            {/* Ambient Background Glow */}
            <LinearGradient
                colors={Gradients.obsidianDeep as any}
                style={StyleSheet.absoluteFill as any}
            />

            {/* Ticker Tape Marquee */}
            <TickerTape items={tickerTapeItems} />

            {/* Global Market Cap Hero */}
            <View style={styles.heroSection}>
                <Text style={styles.heroLabel}>GLOBAL DATA AGGREGATE</Text>
                <View style={styles.numberWrapper}>
                    <Text style={styles.heroNumber}>
                        {formatPrice(globalMarketCap)}
                    </Text>
                </View>
                <Animated.View style={[styles.heroGlow, animatedHeroGlow]} />
            </View>

            {/* Live Tickers */}
            <View style={styles.listHeader}>
                <Text style={styles.listHeaderText}>ACTIVE CLOUT VOLATILITY</Text>
                <View style={styles.headerLine} />
            </View>

            {isLoading ? (
                <View style={styles.skeletonContainer}>
                    {[1, 2, 3, 4, 5].map((i) => (
                        <SkeletonCard key={i} />
                    ))}
                </View>
            ) : (
                <FlatList
                    data={tickerList}
                    keyExtractor={(item) => item.ticker_id}
                    renderItem={renderTickerItem}
                    style={styles.list}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.obsidianBase,
    },
    // Hero Section
    heroSection: {
        paddingTop: Spacing.xl,
        paddingBottom: Spacing.lg,
        paddingHorizontal: Spacing.lg,
        alignItems: 'center',
    },
    heroLabel: {
        ...Typography.caption,
        color: Colors.textTertiary,
        letterSpacing: 3,
        fontWeight: '700',
    },
    numberWrapper: {
        flexDirection: 'row',
        alignItems: 'baseline',
        marginTop: Spacing.xl,
    },
    heroNumber: {
        ...Typography.displayHero,
        color: Colors.kineticGreen, // Neon cyber green
        fontSize: 56, // Massive
        letterSpacing: -2,
        textShadowColor: Colors.glowGreen,
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 15,
    },
    heroGlow: {
        position: 'absolute',
        bottom: 0,
        height: 1,
        width: '60%',
        backgroundColor: Colors.glowGreen,
        shadowColor: Colors.kineticGreen,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 10,
    },
    // List Header
    listHeader: {
        paddingHorizontal: Spacing.lg,
        marginBottom: Spacing.sm,
    },
    listHeaderText: {
        ...Typography.dataLabel,
        color: Colors.textSecondary,
        letterSpacing: 1.5,
    },
    headerLine: {
        height: 1,
        backgroundColor: Colors.glassBorder,
        marginTop: 4,
        width: 40,
    },
    // Skeleton
    skeletonContainer: {
        padding: Spacing.lg,
    },
    // Ticker List
    list: {
        flex: 1,
    },
    listContent: {
        paddingHorizontal: Spacing.sm,
        paddingBottom: Spacing.xxl,
    },
    // Ticker Row
    tickerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: Spacing.lg,
        paddingHorizontal: Spacing.md,
        marginBottom: Spacing.sm,
    },
    tickerLeft: {
        flex: 1,
        alignItems: 'flex-start',
    },
    tickerRight: {
        alignItems: 'flex-end',
        justifyContent: 'center',
    },
    tickerSymbol: {
        ...Typography.ticker,
        color: Colors.textPrimary,
        fontSize: 18,
    },
    tickerNameSub: {
        ...Typography.dataLabel,
        color: Colors.textTertiary,
        fontSize: 8,
        letterSpacing: 1,
        marginBottom: Spacing.sm,
    },
    tickerPrice: {
        ...Typography.price,
        color: Colors.textPrimary,
        fontSize: 14,
    },
    tickerSupply: {
        ...Typography.dataLabel,
        color: Colors.textTertiary,
        marginTop: 2,
        fontSize: 10,
    },
    pnlBadge: {
        paddingHorizontal: 12, // Wider pill
        paddingVertical: 6,
        borderRadius: 100, // Pill shaped gamified badge
        marginBottom: 6,
    },
    pnlBadgePos: {
        backgroundColor: Colors.pulseGreen,
        borderWidth: 1.5,
        borderColor: Colors.kineticGreen,
        shadowColor: Colors.glowGreen,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 12,
    },
    pnlBadgeNeg: {
        backgroundColor: Colors.pulseRed,
        borderWidth: 1.5,
        borderColor: Colors.thermalRed,
        shadowColor: Colors.glowRed,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 12,
    },
    pnlText: {
        ...Typography.dataLabel,
        fontSize: 12,
        color: Colors.textPrimary,
        fontFamily: Fonts.bold,
    },
    volumeLabel: {
        ...Typography.dataLabel,
        color: Colors.textTertiary,
        fontSize: 10,
    },
});
