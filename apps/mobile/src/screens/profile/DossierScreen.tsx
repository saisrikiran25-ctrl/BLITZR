import React from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    StatusBar,
    FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { usePortfolioStore } from '../../store/usePortfolioStore';
import { GlassCard } from '../../components/common/GlassCard';
import { Colors, Typography, Spacing, Gradients, BorderRadius } from '../../theme';
import { formatCreds, formatChips, formatPrice, formatPctChange } from '../../utils/formatters';

/**
 * DossierScreen — Elite Asset Ledger
 * Aesthetic: Material Dark / High-Contrast Portfolio
 */
export const DossierScreen: React.FC = () => {
    const {
        credBalance,
        chipBalance,
        netWorth,
        holdings,
    } = usePortfolioStore();

    const renderHolding = ({ item: holding }: { item: any }) => {
        const isPositive = holding.profit_loss >= 0;
        return (
            <GlassCard key={holding.ticker_id} style={styles.holdingCard} variant="default" intensity={15}>
                <View style={styles.holdingHeader}>
                    <View>
                        <Text style={styles.holdingTicker}>${holding.ticker_id}</Text>
                        <Text style={styles.holdingShares}>{holding.shares_held} BACKING_POSITION</Text>
                    </View>
                    <View style={styles.holdingValueCol}>
                        <Text style={styles.holdingValue}>{formatPrice(holding.current_value)}</Text>
                        <View style={[styles.pnlBadge, isPositive ? styles.pnlBadgePos : styles.pnlBadgeNeg]}>
                            <Text style={styles.pnlText}>{formatPctChange(holding.profit_loss_pct)}</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.holdingGrid}>
                    <View style={styles.gridItem}>
                        <Text style={styles.gridLabel}>AVG_ENTRY</Text>
                        <Text style={styles.gridValue}>{formatPrice(holding.avg_buy_price)}</Text>
                    </View>
                    <View style={styles.gridItem}>
                        <Text style={styles.gridLabel}>MARKET_PRICE</Text>
                        <Text style={styles.gridValue}>{formatPrice(holding.current_price)}</Text>
                    </View>
                    <View style={styles.gridItem}>
                        <Text style={styles.gridLabel}>EST_PROFIT</Text>
                        <Text style={[styles.gridValue, isPositive ? styles.positiveText : styles.negativeText]}>
                            {isPositive ? '+' : ''}{formatPrice(holding.profit_loss)}
                        </Text>
                    </View>
                </View>
            </GlassCard>
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <LinearGradient colors={Gradients.obsidianDeep as any} style={StyleSheet.absoluteFill} />

            <FlatList
                data={holdings}
                renderItem={renderHolding}
                keyExtractor={(item) => item.ticker_id}
                contentContainerStyle={styles.content}
                ListHeaderComponent={
                    <>
                        <View style={styles.heroContainer}>
                            <Text style={styles.heroCaption}>AGGREGATED_NET_WORTH</Text>
                            <Text style={styles.heroAmount}>¢{formatCreds(netWorth)}</Text>
                            <View style={styles.heroGlow} />
                        </View>

                        <View style={styles.statsGrid}>
                            <GlassCard style={styles.statCard} variant="default" intensity={20}>
                                <Text style={statLabelStyle}>CRED_RESERVE</Text>
                                <Text style={statValueGreenStyle}>{formatCreds(credBalance)}</Text>
                            </GlassCard>
                            <GlassCard style={styles.statCard} variant="default" intensity={20}>
                                <Text style={statLabelStyle}>CHIP_POOL</Text>
                                <Text style={statValueGoldStyle}>{formatChips(chipBalance)}</Text>
                            </GlassCard>
                        </View>

                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>ACTIVE_POSITIONS</Text>
                            <View style={styles.headerLine} />
                        </View>
                    </>
                }
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyText}>NO_ASSETS_DETECTED</Text>
                        <Text style={styles.emptySubtext}>BOOST_PROFILES_ON_THE_FLOOR</Text>
                    </View>
                }
            />
        </View>
    );
};

const statLabelStyle = [Typography.dataLabel, { color: Colors.textTertiary, fontSize: 8, letterSpacing: 2, marginBottom: 4 }];
const statValueGreenStyle = [Typography.price, { color: Colors.kineticGreen }];
const statValueGoldStyle = [Typography.price, { color: Colors.activeGold }];

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.obsidianBase,
    },
    content: {
        padding: Spacing.lg,
        paddingBottom: 100,
    },
    // Hero
    heroContainer: {
        alignItems: 'center',
        paddingVertical: Spacing.xxxl,
        marginBottom: Spacing.lg,
        overflow: 'hidden',
    },
    heroCaption: {
        ...Typography.dataLabel,
        color: Colors.textTertiary,
        letterSpacing: 4,
        fontSize: 10,
    },
    heroAmount: {
        ...Typography.displayHero,
        color: Colors.textPrimary,
        fontSize: 48,
        marginTop: Spacing.sm,
        marginBottom: Spacing.xs,
    },
    heroGlow: {
        position: 'absolute',
        top: '20%',
        width: '60%',
        height: '60%',
        backgroundColor: Colors.kineticGreen,
        opacity: 0.05,
        borderRadius: 100,
    },
    // Stats Grid
    statsGrid: {
        flexDirection: 'row',
        gap: Spacing.sm,
        marginBottom: Spacing.xl,
    },
    statCard: {
        flex: 1,
        padding: Spacing.md,
    },
    // Section Header
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Spacing.md,
    },
    sectionTitle: {
        ...Typography.dataLabel,
        color: Colors.textSecondary,
        letterSpacing: 2,
        marginRight: Spacing.md,
    },
    headerLine: {
        flex: 1,
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    // Holding Card
    holdingCard: {
        marginBottom: Spacing.sm,
        padding: Spacing.lg,
    },
    holdingHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.lg,
    },
    holdingTicker: {
        ...Typography.h3,
        color: Colors.textPrimary,
        letterSpacing: 1,
    },
    holdingShares: {
        ...Typography.dataLabel,
        color: Colors.textTertiary,
        fontSize: 9,
        marginTop: 2,
    },
    holdingValueCol: {
        alignItems: 'flex-end',
    },
    holdingValue: {
        ...Typography.priceLarge,
        color: Colors.textPrimary,
        fontSize: 18,
    },
    pnlBadge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        marginTop: 4,
    },
    pnlBadgePos: {
        backgroundColor: 'rgba(0, 255, 65, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(0, 255, 65, 0.2)',
    },
    pnlBadgeNeg: {
        backgroundColor: 'rgba(255, 49, 49, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(255, 49, 49, 0.2)',
    },
    pnlText: {
        ...Typography.dataLabel,
        fontSize: 9,
        color: Colors.textPrimary,
    },
    holdingGrid: {
        flexDirection: 'row',
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.05)',
        paddingTop: Spacing.md,
    },
    gridItem: {
        flex: 1,
    },
    gridLabel: {
        ...Typography.dataLabel,
        color: Colors.textTertiary,
        fontSize: 7,
        letterSpacing: 1,
        marginBottom: 2,
    },
    gridValue: {
        ...Typography.dataLabel,
        color: Colors.textSecondary,
        fontSize: 11,
    },
    positiveText: {
        color: Colors.kineticGreen,
    },
    negativeText: {
        color: Colors.thermalRed,
    },
    // Empty
    emptyState: {
        paddingVertical: 100,
        alignItems: 'center',
    },
    emptyText: {
        ...Typography.ticker,
        color: Colors.textTertiary,
        letterSpacing: 4,
    },
    emptySubtext: {
        ...Typography.dataLabel,
        color: 'rgba(255,255,255,0.2)',
        fontSize: 8,
        letterSpacing: 2,
        marginTop: Spacing.sm,
    },
});
