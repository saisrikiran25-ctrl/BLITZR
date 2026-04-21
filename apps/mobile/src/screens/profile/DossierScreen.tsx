import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    StatusBar,
    FlatList,
    TouchableOpacity,
    Alert,
    Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { usePortfolioStore } from '../../store/usePortfolioStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useNotificationsStore } from '../../store/useNotificationsStore';
import { GlassCard } from '../../components/common/GlassCard';
import { Button } from '../../components/common/Button';
import { Colors, Typography, Spacing, Gradients } from '../../theme';
import { formatCreds, formatChips, formatPrice, formatPctChange } from '../../utils/formatters';
import { api } from '../../services/api';

declare const window: any;

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
    const {
        username,
        userId,
        tosAccepted,
        isIpoActive,
        logout,
    } = useAuthStore();
    const { unreadCount, fetchNotifications } = useNotificationsStore();
    const navigation = useNavigation<any>();
    const [isConfirmingLogout, setIsConfirmingLogout] = React.useState(false);

    useFocusEffect(
        React.useCallback(() => {
            const syncProfile = async () => {
                try {
                    // Fetch full holdings and latest balances
                    await usePortfolioStore.getState().fetchInitialData();
                    
                    // Fetch latest profile for identity updates
                    const profile = await api.getProfile();
                    useAuthStore.getState().updateProfile(profile);
                } catch (error) {
                    console.error('[DOSSIER_SYNC_FAILURE]', error);
                }
            };

            syncProfile();
            fetchNotifications();
            
            return () => {}; // Optional cleanup
        }, [])
    );

    const renderHolding = ({ item: holding }: { item: any }) => {
        const isPositive = holding.profit_loss >= 0;
        return (
            <GlassCard key={holding.ticker_id} style={styles.holdingCard} variant="default" intensity={15}>
                <View style={styles.holdingHeader}>
                    <View>
                        <Text style={styles.holdingTicker}>${holding.ticker_id}</Text>
                        <Text style={styles.holdingShares}>{holding.shares_held} Shares Held</Text>
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
                        <Text style={styles.gridLabel}>Avg Entry</Text>
                        <Text style={styles.gridValue}>{formatPrice(holding.avg_buy_price)}</Text>
                    </View>
                    <View style={styles.gridItem}>
                        <Text style={styles.gridLabel}>Market Price</Text>
                        <Text style={styles.gridValue}>{formatPrice(holding.current_price)}</Text>
                    </View>
                    <View style={styles.gridItem}>
                        <Text style={styles.gridLabel}>Est Profit</Text>
                        <Text style={[styles.gridValue, isPositive ? styles.positiveText : styles.negativeText]}>
                            {isPositive ? '+' : ''}{formatPrice(holding.profit_loss)}
                        </Text>
                    </View>
                </View>
            </GlassCard>
        );
    };

    const handleComingSoon = (title: string) => {
        Alert.alert(title, 'This feature is coming soon.');
    };

    const handleCreateIpo = async () => {
        const executeListing = async () => {
            try {
                const ticker = username?.replace(/\s+/g, '').toUpperCase() || 'USER';
                await api.createIpo(ticker);
                if (Platform.OS === 'web') {
                    window.alert("Success. You are now LIVE on the exchange!");
                } else {
                    Alert.alert("Success", "You are now LIVE on the exchange!");
                }
                // Refresh profile to trigger isIpoActive update
                const profile = await api.getProfile();
                useAuthStore.getState().updateProfile(profile);
            } catch (error: any) {
                if (Platform.OS === 'web') {
                    window.alert("Listing Failed: " + error.message);
                } else {
                    Alert.alert("Listing Failed", error.message);
                }
            }
        };

        if (Platform.OS === 'web') {
            const confirm1 = window.confirm("Going public allows other students to trade your 'Clout Score' (ticker). This is permanent and public within your campus.\n\nContinue?");
            if (!confirm1) return;
            const confirm2 = window.confirm("I understand that my ticker value is based on campus sentiment and is NOT a financial instrument. I consent to being listed on the BLITZR exchange.\n\nCONFIRM LISTING?");
            if (!confirm2) return;
            await executeListing();
            return;
        }

        // Step 1: Initialize interest
        Alert.alert(
            "List Your identity?",
            "Going public allows other students to trade your 'Clout Score' (ticker). This is permanent and public within your campus.",
            [
                { text: "Cancel", style: "cancel" },
                { 
                    text: "Continue", 
                    onPress: () => {
                        // Step 2: Critical Disclaimer
                        Alert.alert(
                            "Legal Clearance Required",
                            "I understand that my ticker value is based on campus sentiment and is NOT a financial instrument. I consent to being listed on the BLITZR exchange.",
                            [
                                { text: "Go Back", style: "cancel" },
                                {
                                    text: "CONFIRM LISTING",
                                    onPress: executeListing
                                }
                            ]
                        );
                    }
                }
            ]
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <LinearGradient colors={Gradients.obsidianDeep as any} style={StyleSheet.absoluteFill as any} />

            <FlatList
                data={holdings}
                renderItem={renderHolding}
                keyExtractor={(item) => item.ticker_id}
                contentContainerStyle={styles.content}
                ListHeaderComponent={
                    <>
                        <TouchableOpacity 
                            style={styles.notificationBell} 
                            onPress={() => navigation.navigate('NotificationCenter')}
                        >
                            <Feather name="bell" size={20} color={Colors.textPrimary} />
                            {unreadCount > 0 && (
                                <View style={styles.badge}>
                                    <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                                </View>
                            )}
                        </TouchableOpacity>

                        <View style={styles.heroContainer}>
                            <Text style={styles.heroCaption}>Total Net Worth</Text>
                            <Text style={styles.heroAmount}>{formatCreds(netWorth)}</Text>
                            <View style={styles.heroGlow} />
                        </View>

                        <View style={styles.statsGrid}>
                            <GlassCard style={styles.statCard} variant="default" intensity={20}>
                                <Text style={statLabelStyle}>Cred Reserve</Text>
                                <Text style={statValueGreenStyle}>{formatCreds(credBalance)}</Text>
                            </GlassCard>
                            <GlassCard style={styles.statCard} variant="default" intensity={20}>
                                <Text style={statLabelStyle}>Chip Pool</Text>
                                <Text style={statValueGoldStyle}>{formatChips(chipBalance)}</Text>
                            </GlassCard>
                        </View>

                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>My identity</Text>
                            <View style={styles.headerLine} />
                        </View>

                        {isIpoActive ? (
                            <GlassCard style={styles.ipoActiveCard}>
                                <View style={styles.ipoHeader}>
                                    <View>
                                        <Text style={styles.ipoLabel}>Live Ticker</Text>
                                        <Text style={styles.ipoStatus}>${username?.toUpperCase().replace(/\s+/g, '')}</Text>
                                    </View>
                                    <View style={styles.activeBadge}>
                                        <Text style={styles.activeBadgeText}>ACTIVE</Text>
                                    </View>
                                </View>
                            </GlassCard>
                        ) : (
                            <GlassCard style={styles.ipoInactiveCard} variant="default" intensity={25}>
                                <Text style={styles.ipoInactiveTitle}>Not Listed on Exchange</Text>
                                <Text style={styles.ipoInactiveText}>
                                    List your identity as a ticker to allow others to trade your clout. 
                                    Opt-in is required for trading eligibility.
                                </Text>
                                <Button 
                                    title="LIST MY IPO" 
                                    variant="buy" 
                                    size="sm" 
                                    fullWidth 
                                    onPress={handleCreateIpo}
                                    style={styles.listBtn}
                                />
                            </GlassCard>
                        )}

                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>My Account</Text>
                            <View style={styles.headerLine} />
                        </View>

                        <GlassCard style={styles.accountCard} variant="default" intensity={20}>
                            <View style={styles.accountRow}>
                                <View style={styles.accountRowLeft}>
                                    <Feather name="at-sign" size={16} color={Colors.kineticGreen} />
                                    <View>
                                        <Text style={styles.accountLabel}>Username</Text>
                                        <Text style={styles.accountValue}>{username ?? 'Unknown'}</Text>
                                    </View>
                                </View>
                            </View>

                            <View style={styles.accountDivider} />

                            <View style={styles.accountRow}>
                                <View style={styles.accountRowLeft}>
                                    <Feather name="hash" size={16} color={Colors.activeGold} />
                                    <View>
                                        <Text style={styles.accountLabel}>Account ID</Text>
                                        <Text style={styles.accountValue}>{userId ?? 'N/A'}</Text>
                                    </View>
                                </View>
                            </View>

                            <View style={styles.accountDivider} />

                            <View style={styles.accountRow}>
                                <View style={styles.accountRowLeft}>
                                    <Feather name="shield" size={16} color={Colors.textSecondary} />
                                    <View>
                                        <Text style={styles.accountLabel}>Terms Status</Text>
                                        <Text style={styles.accountValue}>{tosAccepted ? 'Accepted' : 'Pending'}</Text>
                                    </View>
                                </View>
                            </View>
                        </GlassCard>

                        <View style={styles.accountActions}>
                            <TouchableOpacity style={styles.actionRow} onPress={() => navigation.navigate('EditProfile')}>
                                <View style={styles.actionLeft}>
                                    <Feather name="user" size={16} color={Colors.textSecondary} />
                                    <Text style={styles.actionText}>Edit Profile</Text>
                                </View>
                                <Feather name="chevron-right" size={16} color={Colors.textTertiary} />
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.actionRow} onPress={() => navigation.navigate('Privacy')}>
                                <View style={styles.actionLeft}>
                                    <Feather name="lock" size={16} color={Colors.textSecondary} />
                                    <Text style={styles.actionText}>Privacy</Text>
                                </View>
                                <Feather name="chevron-right" size={16} color={Colors.textTertiary} />
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.actionRow} onPress={() => navigation.navigate('Notifications')}>
                                <View style={styles.actionLeft}>
                                    <Feather name="bell" size={16} color={Colors.textSecondary} />
                                    <Text style={styles.actionText}>Notifications</Text>
                                </View>
                                <Feather name="chevron-right" size={16} color={Colors.textTertiary} />
                            </TouchableOpacity>
                        </View>

                        <Button
                            title={isConfirmingLogout ? "Tap Again to Confirm Log Out" : "Log Out"}
                            variant={isConfirmingLogout ? "primary" : "danger"}
                            size="sm"
                            fullWidth
                            onPress={async () => {
                                if (!isConfirmingLogout) {
                                    setIsConfirmingLogout(true);
                                    setTimeout(() => setIsConfirmingLogout(false), 5000); // Reset after 5s
                                    return;
                                }

                                // If already confirming, execute the purge immediately
                                usePortfolioStore.getState().clearData();
                                useNotificationsStore.getState().clearNotifications();
                                await logout();
                                if (Platform.OS === 'web') {
                                    (window as any).location.reload();
                                }
                            }}
                            style={styles.logoutButton}
                        />

                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Active Positions</Text>
                            <View style={styles.headerLine} />
                        </View>
                    </>
                }
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyText}>No assets found</Text>
                        <Text style={styles.emptySubtext}>Your active profile holdings will appear here.</Text>
                    </View>
                }
            />
        </View>
    );
};

const statLabelStyle = [Typography.dataLabel, { color: Colors.textTertiary, fontSize: 10, marginBottom: 4 }];
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
    notificationBell: {
        position: 'absolute',
        top: 10,
        right: 10,
        zIndex: 10,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.05)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    badge: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: Colors.thermalRed,
        minWidth: 14,
        height: 14,
        borderRadius: 7,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 2,
    },
    badgeText: {
        color: '#fff',
        fontSize: 8,
        fontWeight: 'bold',
    },
    // Hero
    heroContainer: {
        alignItems: 'center',
        paddingVertical: Spacing.xxxl,
        marginBottom: Spacing.xl, // Extended margin
        overflow: 'visible', // Allow glow to expand fully
    },
    heroCaption: {
        ...Typography.dataLabel,
        color: Colors.textSecondary,
        fontSize: 14,
        letterSpacing: 4,
    },
    heroAmount: {
        ...Typography.displayHero,
        color: Colors.kineticGreen, // Switch to pure neon green instead of white
        fontSize: 56, // Massive numbers
        marginTop: Spacing.sm,
        marginBottom: Spacing.xs,
        letterSpacing: -2,
        textShadowColor: Colors.glowGreen,
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 15, // Blazing glow
    },
    heroGlow: {
        position: 'absolute',
        top: '10%',
        width: '100%',
        height: '100%',
        backgroundColor: Colors.kineticGreen,
        opacity: 0.1, // Stronger back-glow
        borderRadius: 200,
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
    accountCard: {
        padding: Spacing.md,
        marginBottom: Spacing.sm,
    },
    accountRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: Spacing.sm,
    },
    accountRowLeft: {
        flexDirection: 'row',
        gap: Spacing.md,
        alignItems: 'center',
    },
    accountLabel: {
        ...Typography.dataLabel,
        color: Colors.textTertiary,
        fontSize: 10,
        marginBottom: 2,
    },
    accountValue: {
        ...Typography.body,
        color: Colors.textPrimary,
    },
    accountDivider: {
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    accountActions: {
        marginBottom: Spacing.md,
    },
    actionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: Spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    actionLeft: {
        flexDirection: 'row',
        gap: Spacing.md,
        alignItems: 'center',
    },
    actionText: {
        ...Typography.dataLabel,
        color: Colors.textSecondary,
        fontSize: 10,
    },
    logoutButton: {
        marginBottom: Spacing.xl,
    },
    // Section Header
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Spacing.md,
    },
    sectionTitle: {
        ...Typography.h3,
        color: Colors.textPrimary,
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
        fontSize: 9,
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
        ...Typography.h2,
        color: Colors.textSecondary,
    },
    emptySubtext: {
        ...Typography.body,
        color: Colors.textTertiary,
        fontSize: 13,
        marginTop: Spacing.sm,
    },
    // IPO Cards
    ipoActiveCard: {
        padding: Spacing.lg,
        marginBottom: Spacing.xl,
        borderColor: Colors.kineticGreen,
        borderWidth: 1,
    },
    ipoHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    ipoLabel: {
        ...Typography.dataLabel,
        color: Colors.textTertiary,
        fontSize: 10,
    },
    ipoStatus: {
        ...Typography.h2,
        color: Colors.kineticGreen,
        marginTop: 4,
    },
    activeBadge: {
        backgroundColor: 'rgba(0, 255, 65, 0.1)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: Colors.kineticGreen,
    },
    activeBadgeText: {
        ...Typography.dataLabel,
        color: Colors.kineticGreen,
        fontSize: 10,
    },
    ipoInactiveCard: {
        padding: Spacing.xl,
        marginBottom: Spacing.xl,
        alignItems: 'center',
    },
    ipoInactiveTitle: {
        ...Typography.h3,
        color: Colors.textPrimary,
        marginBottom: Spacing.xs,
    },
    ipoInactiveText: {
        ...Typography.body,
        color: Colors.textSecondary,
        textAlign: 'center',
        fontSize: 12,
        marginBottom: Spacing.lg,
    },
    listBtn: {
        shadowColor: Colors.kineticGreen,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 10,
    },
});
