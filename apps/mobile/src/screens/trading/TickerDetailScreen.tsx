import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    Alert,
    StatusBar,
    Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { GlassCard } from '../../components/common/GlassCard';
import { Button } from '../../components/common/Button';
import { Colors, Typography, Spacing, BorderRadius, Gradients } from '../../theme';
import { useMarketStore } from '../../store/useMarketStore';
import { usePortfolioStore } from '../../store/usePortfolioStore';
import { useAuthStore } from '../../store/useAuthStore';
import { formatPrice, formatPctChange, formatCompact } from '../../utils/formatters';
import { previewBuyPrice, previewSellPrice } from '../../utils/bondingCurve';
import { api } from '../../services/api';

declare const window: any;

/**
 * TickerDetailScreen — High-Fidelity Dossier
 * Aesthetic: Palantir HUD / Industrial Glass
 */
export const TickerDetailScreen: React.FC<{ route: any; navigation: any }> = ({
    route,
    navigation,
}) => {
    const { tickerId } = route.params;
    const ticker = useMarketStore((s) => s.tickers[tickerId]);
    const { credBalance } = usePortfolioStore();
    const { userId } = useAuthStore();
    
    // Ownership check for Panic Button visibility
    const isOwner = ticker?.owner_id === userId;

    const [shares, setShares] = useState(1);
    const [mode, setMode] = useState<'buy' | 'sell'>('buy');
    const [isLoading, setIsLoading] = useState(false);

    const supply = ticker?.supply ?? 0;
    const price = ticker?.price ?? 0;
    const changePct = ticker?.change_pct ?? 0;
    const volume = ticker?.volume ?? 0;

    // Price preview from bonding curve
    const preview = mode === 'buy'
        ? previewBuyPrice(supply, shares)
        : previewSellPrice(supply, shares);

    const marketCap = price * supply;
    const isPositive = changePct >= 0;

    const handleTrade = useCallback(async () => {
        setIsLoading(true);
        try {
            if (mode === 'buy') {
                await api.executeBuy(tickerId, shares);
            } else {
                await api.executeSell(tickerId, shares);
            }
            Alert.alert('Action Confirmed', `${mode === 'buy' ? 'BOOST' : 'REDUCE'} x${shares}`);
            usePortfolioStore.getState().fetchInitialData();
        } catch (error: any) {
            Alert.alert('Trade Failed', error.message);
        } finally {
            setIsLoading(false);
        }
    }, [mode, shares, tickerId]);
    
    const handleDelist = useCallback(async () => {
        setIsLoading(true);
        try {
            await api.delistIpo();
            if (Platform.OS === 'web') {
                window.alert('Ticker Delisted: Your IPO has been terminated. All holders have been refunded.');
            } else {
                Alert.alert('Ticker Delisted', 'Your IPO has been terminated. All holders have been refunded.');
            }
            useAuthStore.getState().updateProfile({ tosAccepted: true }); // Sync state
            navigation.navigate('TradingFloor');
        } catch (error: any) {
            if (Platform.OS === 'web') {
                window.alert('Delist Failed: ' + error.message);
            } else {
                Alert.alert('Delist Failed', error.message);
            }
        } finally {
            setIsLoading(false);
        }
    }, [navigation]);

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            {/* Ambient Background */}
            <LinearGradient
                colors={Gradients.obsidianDeep as any}
                style={StyleSheet.absoluteFill as any}
            />

            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Text style={styles.backText}>← SYSTEM.BACK</Text>
                    </TouchableOpacity>
                    <View style={styles.headerRight}>
                        <View style={styles.liveIndicator} />
                        <Text style={styles.liveText}>LIVE FEED</Text>
                    </View>
                </View>

                {/* Ticker Hero */}
                <View style={styles.heroSection}>
                    <Text style={[styles.tickerName, Typography.phosphorAmber]}>{tickerId}</Text>
                    <View style={styles.priceContainer}>
                        <Text style={[
                            styles.heroPrice,
                            isPositive ? Typography.phosphorGreen : styles.redGlow
                        ]}>
                            {formatPrice(price)}
                        </Text>
                    </View>
                    <Text style={[styles.heroChange, isPositive ? styles.green : styles.red]}>
                        {isPositive ? '▲' : '▼'} {formatPctChange(changePct)}
                    </Text>
                </View>

                {/* Chart Engine HUD */}
                <GlassCard style={styles.chartContainer} intensity={30}>
                    <View style={styles.chartPlaceholder}>
                        <View style={styles.chartHeader}>
                            <Text style={styles.chartLabel}>VOLATILITY TRACE</Text>
                            <Text style={styles.chartSubtext}>MARKET DEPTH: 100.0%</Text>
                        </View>

                        <View style={styles.mockChart}>
                            {Array.from({ length: 32 }, (_, i) => {
                                const h = 30 + Math.sin(i * 0.4) * 20 + Math.random() * 15;
                                return (
                                    <View
                                        key={i}
                                        style={[
                                            styles.mockBar,
                                            {
                                                height: h,
                                                backgroundColor: h > 40 ? Colors.kineticGreen : Colors.thermalRed,
                                                opacity: 0.3 + (i / 40),
                                            },
                                        ]}
                                    />
                                );
                            })}
                        </View>
                        <View style={styles.chartGlow} />
                    </View>
                </GlassCard>

                {/* Stats Matrix */}
                <View style={styles.statsRow}>
                    <GlassCard style={styles.statCard} variant="flat">
                        <Text style={styles.statLabel}>MARKET CAP</Text>
                        <Text style={styles.statValue}>{formatCompact(marketCap)}</Text>
                    </GlassCard>
                    <GlassCard style={styles.statCard} variant="flat">
                        <Text style={styles.statLabel}>AVG VOL</Text>
                        <Text style={styles.statValue}>{formatCompact(volume)}</Text>
                    </GlassCard>
                </View>
                <View style={styles.statsRow}>
                    <GlassCard style={styles.statCard} variant="flat">
                        <Text style={styles.statLabel}>TOTAL SUPPLY</Text>
                        <Text style={styles.statValue}>{formatCompact(supply)}</Text>
                    </GlassCard>
                    <GlassCard style={styles.statCard} variant="flat">
                        <Text style={styles.statLabel}>YOUR LIQUIDITY</Text>
                        <Text style={[styles.statValue, { color: Colors.activeGold }]}>
                            {formatPrice(credBalance)}
                        </Text>
                    </GlassCard>
                </View>

                {/* Trade Terminal */}
                <GlassCard style={styles.orderBlock} variant="elevated" intensity={40}>
                    <Text style={styles.orderTitle}>BOOST TERMINAL</Text>

                    <View style={styles.modeRow}>
                        <TouchableOpacity
                            style={[styles.modeTab, mode === 'buy' && styles.buyModeActive]}
                            onPress={() => setMode('buy')}
                        >
                            <Text style={[styles.modeText, mode === 'buy' && styles.buyModeText]}>BOOST</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.modeTab, mode === 'sell' && styles.sellModeActive]}
                            onPress={() => setMode('sell')}
                        >
                            <Text style={[styles.modeText, mode === 'sell' && styles.sellModeText]}>REDUCE</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.sharesRow}>
                        <TouchableOpacity
                            onPress={() => setShares(Math.max(1, shares - 1))}
                            style={styles.sharesBtn}
                        >
                            <Text style={styles.sharesBtnText}>−</Text>
                        </TouchableOpacity>
                        <View style={styles.countWrapper}>
                            <Text style={styles.sharesCount}>{shares}</Text>
                            <Text style={styles.sharesLabel}>POSITION</Text>
                        </View>
                        <TouchableOpacity
                            onPress={() => setShares(shares + 1)}
                            style={styles.sharesBtn}
                        >
                            <Text style={styles.sharesBtnText}>+</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.previewSection}>
                        <View style={styles.previewRow}>
                            <Text style={styles.previewLabel}>Impact Cost</Text>
                            <Text style={[styles.previewValue, mode === 'buy' ? styles.red : styles.green]}>
                                {formatPrice(mode === 'buy' ? preview.totalCost : preview.totalValue)}
                            </Text>
                        </View>
                        <View style={styles.previewRow}>
                            <Text style={styles.previewLabel}>Execution Price</Text>
                            <Text style={styles.previewValue}>{formatPrice(preview.newPrice)}</Text>
                        </View>
                        <View style={styles.previewRow}>
                            <Text style={styles.previewLabel}>Slippage Estimate</Text>
                            <Text style={[styles.previewValue, preview.priceImpact >= 0 ? styles.green : styles.red]}>
                                {formatPctChange(preview.priceImpact)}
                            </Text>
                        </View>
                    </View>

                    <Button
                        title={mode === 'buy' ? 'EXECUTE BOOST' : 'EXECUTE REDUCE'}
                        variant={mode === 'buy' ? 'buy' : 'sell'}
                        size="xl"
                        fullWidth
                        loading={isLoading}
                        onPress={handleTrade}
                    />

                    <View style={styles.disclaimerContainer}>
                        <Text style={styles.disclaimerText}>
                            BLITZR operates exclusively with virtual credits. No real monetary value. Not a financial product.
                        </Text>
                    </View>
                </GlassCard>

                {/* Panic Button (Owners Only) */}
                {isOwner && (
                    <View style={styles.panicSection}>
                        <Button
                            title="PANIC: DELIST IPO"
                            variant="sell"
                            size="md"
                            fullWidth
                            loading={isLoading}
                            onPress={() => {
                                if (Platform.OS === 'web') {
                                    const confirmed = window.confirm("WARNING: Emergency Delisting.\n\nAre you sure you want to DELIST your IPO? All holders will be refunded and you will be invisible for 72h.");
                                    if (confirmed) {
                                        handleDelist();
                                    }
                                } else {
                                    Alert.alert('Hold to Confirm', 'Maintain pressure for 3 seconds to execute emergency delisting.');
                                }
                            }}
                            onLongPress={Platform.OS === 'web' ? undefined : handleDelist}
                            delayLongPress={Platform.OS === 'web' ? undefined : 3000}
                            style={styles.delistBtn}
                        />
                        <Text style={styles.panicSubtext}>
                            WARNING: 3-second hold to confirm. Refunds all holders. Permanent 72h invisibility.
                        </Text>
                    </View>
                )}
                
                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.obsidianBase,
    },
    // Header
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Spacing.lg,
        paddingTop: Spacing.xl,
        paddingBottom: Spacing.md,
    },
    backButton: {
        paddingVertical: Spacing.sm,
    },
    backText: {
        ...Typography.dataLabel,
        color: Colors.textSecondary,
        letterSpacing: 2,
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    liveIndicator: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: Colors.kineticGreen,
        marginRight: 6,
    },
    liveText: {
        ...Typography.dataLabel,
        color: Colors.kineticGreen,
        fontSize: 10,
    },
    // Hero
    heroSection: {
        alignItems: 'center',
        paddingVertical: Spacing.xl,
    },
    tickerName: {
        ...Typography.displayHero,
        color: Colors.textPrimary,
        fontSize: 32,
        letterSpacing: 4,
    },
    priceContainer: {
        alignItems: 'center',
        marginTop: Spacing.sm,
    },
    heroPrice: {
        ...Typography.displayHero,
        fontSize: 48,
        letterSpacing: -1,
    },
    heroChange: {
        ...Typography.price,
        marginTop: Spacing.xs,
        letterSpacing: 1,
    },
    green: { color: Colors.kineticGreen },
    red: { color: Colors.thermalRed },
    redGlow: {
        color: Colors.thermalRed,
        textShadowColor: Colors.glowRed,
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 8,
    },
    // Chart
    chartContainer: {
        marginHorizontal: Spacing.lg,
        marginBottom: Spacing.lg,
    },
    chartPlaceholder: {
        height: 220,
        padding: Spacing.md,
    },
    chartHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: Spacing.lg,
    },
    chartLabel: {
        ...Typography.dataLabel,
        color: Colors.textSecondary,
        letterSpacing: 1,
    },
    chartSubtext: {
        ...Typography.dataLabel,
        color: Colors.textTertiary,
        fontSize: 8,
    },
    mockChart: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'center',
        gap: 2,
        marginTop: Spacing.sm,
    },
    mockBar: {
        width: 7,
        borderRadius: 1,
    },
    chartGlow: {
        position: 'absolute',
        bottom: 10,
        left: '10%',
        right: '10%',
        height: 20,
        backgroundColor: Colors.glowCobalt,
        opacity: 0.1,
        borderRadius: 20,
    },
    // Stats Matrix
    statsRow: {
        flexDirection: 'row',
        paddingHorizontal: Spacing.lg,
        marginBottom: Spacing.sm,
    },
    statCard: {
        flex: 1,
        marginHorizontal: Spacing.xs,
        padding: Spacing.md,
    },
    statLabel: {
        ...Typography.dataLabel,
        color: Colors.textTertiary,
        fontSize: 9,
        letterSpacing: 1.5,
    },
    statValue: {
        ...Typography.price,
        color: Colors.textPrimary,
        marginTop: 4,
    },
    // Order Block
    orderBlock: {
        margin: Spacing.lg,
        padding: Spacing.lg,
    },
    orderTitle: {
        ...Typography.dataLabel,
        color: Colors.textSecondary,
        textAlign: 'center',
        letterSpacing: 3,
        marginBottom: Spacing.xl,
    },
    modeRow: {
        flexDirection: 'row',
        gap: Spacing.sm,
        marginBottom: Spacing.xl,
    },
    modeTab: {
        flex: 1,
        paddingVertical: Spacing.md,
        alignItems: 'center',
        borderRadius: 100, // Pill shaped tabs
        borderWidth: 2, // Thicker border
        borderColor: Colors.glassBorder,
        backgroundColor: Colors.materialDark,
    },
    buyModeActive: {
        backgroundColor: Colors.pulseGreen,
        borderColor: Colors.kineticGreen,
        shadowColor: Colors.glowGreen,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 10,
    },
    sellModeActive: {
        backgroundColor: Colors.pulseRed,
        borderColor: Colors.thermalRed,
        shadowColor: Colors.glowRed,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 10,
    },
    modeText: {
        ...Typography.bodyMedium,
        color: Colors.textTertiary,
        fontWeight: '900',
        letterSpacing: 2,
    },
    buyModeText: { color: Colors.kineticGreen },
    sellModeText: { color: Colors.thermalRed },
    sharesRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: Spacing.xl,
    },
    sharesBtn: {
        width: 48,
        height: 48,
        borderRadius: BorderRadius.button,
        backgroundColor: Colors.materialLight,
        borderWidth: 1,
        borderColor: Colors.glassBorder,
        alignItems: 'center',
        justifyContent: 'center',
    },
    sharesBtnText: {
        ...Typography.h2,
        color: Colors.textPrimary,
    },
    countWrapper: {
        alignItems: 'center',
    },
    sharesCount: {
        ...Typography.displayHero,
        color: Colors.textPrimary,
        fontSize: 40,
    },
    sharesLabel: {
        ...Typography.dataLabel,
        color: Colors.textTertiary,
        fontSize: 10,
        letterSpacing: 2,
    },
    previewSection: {
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderRadius: BorderRadius.card,
        padding: Spacing.md,
        marginBottom: Spacing.xl,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    previewRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: Spacing.xs,
    },
    previewLabel: {
        ...Typography.caption,
        color: Colors.textSecondary,
    },
    previewValue: {
        ...Typography.price,
        fontSize: 14,
        color: Colors.textPrimary,
    },
    disclaimerContainer: {
        marginTop: Spacing.xl,
        alignItems: 'center',
    },
    disclaimerText: {
        color: '#8E8E93',
        fontSize: 10,
        textAlign: 'center',
        lineHeight: 14,
    },
    // Panic Button
    panicSection: {
        marginHorizontal: Spacing.lg,
        marginTop: Spacing.sm,
        padding: Spacing.md,
        alignItems: 'center',
    },
    delistBtn: {
        borderColor: Colors.thermalRed,
        borderWidth: 1,
        backgroundColor: 'rgba(255, 59, 48, 0.1)',
    },
    panicSubtext: {
        ...Typography.caption,
        color: Colors.textTertiary,
        textAlign: 'center',
        marginTop: Spacing.sm,
        fontSize: 9,
        lineHeight: 12,
    },
});

