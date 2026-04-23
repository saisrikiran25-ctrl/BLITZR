import React, { useState } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    Modal,
    TextInput,
    Alert,
    StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { GlassCard } from '../../components/common/GlassCard';
import { Button } from '../../components/common/Button';

import { Colors, Typography, Spacing, Gradients, Fonts } from '../../theme';
import { useMarketStore } from '../../store/useMarketStore';
import { usePropStore } from '../../store/usePropStore';
import { usePortfolioStore } from '../../store/usePortfolioStore';
import { formatCreds, formatChips } from '../../utils/formatters';
import { api } from '../../services/api';
import { BIcon } from '../../components/common/BIcon';
import { useAuthStore } from '../../store/useAuthStore';

/**
 * ArenaScreen — High-Fidelity Prop Market
 * Aesthetic: Kinetic HUD / Industrial Glass
 */
export const ArenaScreen: React.FC = () => {
    const { email } = useAuthStore();
    const { tickerTapeItems } = useMarketStore();
    const { events, isLoading, fetchInitialData } = usePropStore();
    const { chipBalance } = usePortfolioStore();

    const IIFT_ALLOWED_EMAILS = [
        'saksham_ipm25@iift.edu',
        'aarav_ipm25@iift.edu',
        'saisrikiran_ipm25@iift.edu',
    ];

    const isAuthorizedToCreate = !!email && (
        !email.toLowerCase().endsWith('@iift.edu') || 
        IIFT_ALLOWED_EMAILS.includes(email.toLowerCase().trim())
    );

    const [selectedTab, setSelectedTab] = useState<'Active' | 'Settled'>('Active');

    // Betting Modal State
    const [isBetModalVisible, setIsBetModalVisible] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<any>(null);
    const [selectedOutcome, setSelectedOutcome] = useState<'YES' | 'NO'>('YES');
    const [betAmount, setBetAmount] = useState('10');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Create Modal State
    const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
    const [newEventTitle, setNewEventTitle] = useState('');
    const [newEventCategory, setNewEventCategory] = useState('CAMPUS');
    const [customCategory, setCustomCategory] = useState('');
    const [newEventExpiryHours, setNewEventExpiryHours] = useState('24');
    const [newEventLiquidity, setNewEventLiquidity] = useState('50');
    const [isCreating, setIsCreating] = useState(false);

    const filteredEvents = events.filter(e =>
        selectedTab === 'Active' ? e.status === 'OPEN' : e.status === 'SETTLED'
    );

    const formatTimeRemaining = (ms: number): string => {
        if (ms <= 0) return 'Expired';
        const hours = Math.floor(ms / 3600000);
        const minutes = Math.floor((ms % 3600000) / 60000);
        if (hours > 0) return `${hours}h ${minutes}m`;
        return `${minutes}m`;
    };

    const handleOpenBet = (event: any, outcome: 'YES' | 'NO') => {
        if (event.time_remaining_ms <= 0) {
            Alert.alert('TIME UP', 'This event has reached its duration limit. No further broadcasts or bets accepted.');
            return;
        }
        setSelectedEvent(event);
        setSelectedOutcome(outcome);
        setIsBetModalVisible(true);
    };

    const handleSettleEvent = (eventId: string, winningOutcome: 'YES' | 'NO') => {
        Alert.alert(
            'Final Verdict',
            `Are you sure you want to resolve this market as ${winningOutcome}? This will distribute all prize pool Chips immediately.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: `Resolve ${winningOutcome}`,
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await api.settleEvent(eventId, winningOutcome);
                            Alert.alert('Market Settled', 'All winners have been compensated and the market is archived.');
                            fetchInitialData();
                        } catch (error: any) {
                            Alert.alert('Settlement Failed', error.message);
                        }
                    }
                }
            ]
        );
    };

    const handlePlaceBet = async () => {
        const amount = parseInt(betAmount);
        if (isNaN(amount) || amount <= 0) {
            Alert.alert('Invalid Amount', 'Please enter a valid chip amount.');
            return;
        }

        setIsSubmitting(true);
        try {
            await api.placeBet(selectedEvent.event_id, selectedOutcome, amount);
            Alert.alert('Bet Placed', `Successfully bet ${amount} Chips on ${selectedOutcome}`);
            setIsBetModalVisible(false);
            fetchInitialData(); // Refresh Props
            usePortfolioStore.getState().fetchInitialData(); // Sync live Chip depletion
        } catch (error: any) {
            Alert.alert('Bet Failed', error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCreateEvent = async () => {
        const hours = parseInt(newEventExpiryHours);
        const liquidity = parseInt(newEventLiquidity);
        const finalCategory = newEventCategory === 'Other' ? customCategory.trim().toUpperCase() : newEventCategory.toUpperCase();

        if (!newEventTitle || newEventTitle.length < 5) {
            Alert.alert('Invalid Title', 'Please enter a clear proposition title.');
            return;
        }
        if (newEventCategory === 'Other' && (!finalCategory || finalCategory.length < 3)) {
            Alert.alert('Invalid Category', 'Please enter a valid custom category (min 3 chars).');
            return;
        }
        if (isNaN(hours) || hours <= 0 || hours > 720) {
            Alert.alert('Invalid Expiry', 'Expiry must be between 1 and 720 hours.');
            return;
        }
        if (isNaN(liquidity) || liquidity < 10) {
            Alert.alert('Invalid Liquidity', 'Minimum seed liquidity is 10 Chips per side (Total cost: 20 Chips).');
            return;
        }

        setIsCreating(true);
        try {
            // Calculate absolute expiry timestamp
            const expiryDate = new Date();
            expiryDate.setHours(expiryDate.getHours() + hours);

            await api.createPropEvent(
                newEventTitle,
                expiryDate.toISOString(),
                'User Generated Context', // Optional description
                finalCategory,
                liquidity
            );

            Alert.alert('Market Deployed', `Event created successfully with ¤ ${liquidity} initial pool parity.`);
            setIsCreateModalVisible(false);
            setNewEventTitle(''); // Reset
            setCustomCategory(''); // Reset
            fetchInitialData(); // Refresh global arena feed
            usePortfolioStore.getState().fetchInitialData(); // Sync exact UI chip deduction (- liquidity * 2)
        } catch (error: any) {
            Alert.alert('Creation Failed', error.message);
        } finally {
            setIsCreating(false);
        }
    };

    const renderPropCard = ({ item }: { item: any }) => {
        const totalPool = item.yes_pool + item.no_pool || 1;
        const yesPct = (item.yes_pool / totalPool) * 100;
        const noPct = (item.no_pool / totalPool) * 100;
        const isSettled = item.status === 'SETTLED';
        const isMainModerator = email?.toLowerCase().trim() === 'saisrikiran_ipm25@iift.edu';
        const isExpired = item.time_remaining_ms <= 0;

        return (
            <GlassCard style={styles.propCard} variant="default" intensity={10}>
                {/* Category Header */}
                <View style={styles.cardHeader}>
                    <View style={styles.categoryBadge}>
                        <BIcon name="landmark" size={10} color={Colors.textSecondary} style={{ marginRight: 4 }} />
                        <Text style={styles.propCategory}>{item.category || 'Politics'}</Text>
                    </View>
                </View>

                {/* Title and Date */}
                <Text style={styles.propTitle} numberOfLines={2}>
                    {item.title}
                </Text>
                <Text style={styles.propDate}>
                    {isSettled ? 'Settled' : `Ends in ${formatTimeRemaining(item.time_remaining_ms)}`}
                </Text>

                {/* Outcomes List */}
                <View style={styles.outcomesContainer}>
                    {/* YES Outcome */}
                    <TouchableOpacity
                        style={styles.outcomeRow}
                        onPress={() => !isSettled && handleOpenBet(item, 'YES')}
                        activeOpacity={0.7}
                    >
                        <View style={styles.outcomeInfo}>
                            <Text style={styles.outcomeName}>Yes</Text>
                            <View style={styles.progressTrack}>
                                <View style={[styles.progressBar, { width: `${yesPct}%`, backgroundColor: Colors.kineticGreen }]} />
                            </View>
                        </View>
                        <View style={styles.outcomeStats}>
                            <Text style={styles.outcomeOdds}>¤ {Math.round(yesPct)}</Text>
                        </View>
                    </TouchableOpacity>

                    {/* NO Outcome */}
                    <TouchableOpacity
                        style={styles.outcomeRow}
                        onPress={() => !isSettled && handleOpenBet(item, 'NO')}
                        activeOpacity={0.7}
                    >
                        <View style={styles.outcomeInfo}>
                            <Text style={styles.outcomeName}>No</Text>
                            <View style={styles.progressTrack}>
                                <View style={[styles.progressBar, { width: `${noPct}%`, backgroundColor: Colors.thermalRed }]} />
                            </View>
                        </View>
                        <View style={styles.outcomeStats}>
                            <Text style={styles.outcomeOdds}>¤ {Math.round(noPct)}</Text>
                        </View>
                    </TouchableOpacity>
                </View>

                {/* Footer Stats */}
                <View style={[styles.cardFooter, isMainModerator && isExpired && !isSettled && { borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)', paddingBottom: 8 }]}>
                    <Text style={styles.volumeText}>{formatCreds(totalPool)} Vol</Text>
                    <Text style={styles.marketCount}>{isExpired ? 'Expired' : 'Live'}</Text>
                </View>

                {/* Moderator Settlement Console */}
                {isMainModerator && isExpired && !isSettled && (
                    <View style={styles.modSettleConsole}>
                        <Text style={styles.modSettleTitle}>SETTLEMENT REQUIRED</Text>
                        <Text style={styles.modSettleSubtitle}>What is the right bet?</Text>
                        <View style={styles.modSettleButtons}>
                            <TouchableOpacity
                                style={[styles.miniSettleBtn, { borderColor: Colors.kineticGreen }]}
                                onPress={() => handleSettleEvent(item.event_id, 'YES')}
                            >
                                <Text style={[styles.miniSettleText, { color: Colors.kineticGreen }]}>YES</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.miniSettleBtn, { borderColor: Colors.thermalRed }]}
                                onPress={() => handleSettleEvent(item.event_id, 'NO')}
                            >
                                <Text style={[styles.miniSettleText, { color: Colors.thermalRed }]}>NO</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            </GlassCard>
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <LinearGradient colors={Gradients.obsidianDeep as any} style={StyleSheet.absoluteFill as any} />



            <View style={styles.tabBar}>
                {['Active', 'Settled'].map((tab: any) => (
                    <TouchableOpacity
                        key={tab}
                        style={[styles.tab, selectedTab === tab && styles.tabActive]}
                        onPress={() => setSelectedTab(tab)}
                    >
                        <Text style={[styles.tabText, selectedTab === tab && styles.tabTextActive]}>
                            {tab}
                        </Text>
                        {selectedTab === tab && <View style={styles.tabIndicator} />}
                    </TouchableOpacity>
                ))}
            </View>

            {isLoading ? (
                <View style={styles.emptyState}><Text style={styles.emptyTitle}>Scanning Arena...</Text></View>
            ) : filteredEvents.length === 0 ? (
                <View style={styles.emptyState}>
                    <Text style={styles.emptyIcon}>∅</Text>
                    <Text style={styles.emptyTitle}>No Active Markets</Text>
                    <Text style={styles.emptySubtitle}>Initialize new events via the (+) controller.</Text>
                </View>
            ) : (
                <FlatList
                    data={filteredEvents}
                    keyExtractor={(item) => item.event_id}
                    renderItem={renderPropCard}
                    numColumns={2}
                    columnWrapperStyle={styles.columnWrapper}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                />
            )}

            {selectedTab === 'Active' && isAuthorizedToCreate && (
                <TouchableOpacity
                    style={styles.fab}
                    activeOpacity={0.8}
                    onPress={() => setIsCreateModalVisible(true)}
                >
                    <LinearGradient
                        colors={Gradients.buttonBuy as any}
                        style={styles.fabGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                        <BIcon name="plus" size={32} color={Colors.obsidianBase} />
                    </LinearGradient>
                </TouchableOpacity>
            )}

            <Modal
                visible={isBetModalVisible}
                transparent
                animationType="slide"
                onRequestClose={() => setIsBetModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <GlassCard style={styles.modalContent} variant="elevated" intensity={50}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Place Bet</Text>
                            <View style={styles.modalLine} />
                        </View>

                        <Text style={styles.modalEventTitle}>{selectedEvent?.title}</Text>

                        <View style={styles.outcomePreview}>
                            <View style={styles.outcomeBlock}>
                                <Text style={styles.outcomeLabel}>Position</Text>
                                <Text style={[styles.outcomeValue, selectedOutcome === 'YES' ? styles.green : styles.red]}>
                                    {selectedOutcome}
                                </Text>
                            </View>
                            <View style={styles.outcomeDivider} />
                            <View style={styles.outcomeBlock}>
                                <Text style={styles.outcomeLabel}>Estimated Return</Text>
                                <Text style={[styles.outcomeValue, selectedOutcome === 'YES' ? styles.green : styles.red]}>
                                    {(() => {
                                        const amount = parseInt(betAmount) || 0;
                                        if (amount <= 0 || !selectedEvent) return formatChips(0);

                                        // Dynamic slippage calculation
                                        const total = selectedEvent.yes_pool + selectedEvent.no_pool;
                                        const pool = selectedOutcome === 'YES' ? selectedEvent.yes_pool : selectedEvent.no_pool;

                                        // Formula: (Total Pool + Bet) * (Bet / (Pool + Bet))
                                        // Minus 5% platform fee
                                        const netBet = amount * 0.95;
                                        const newTotal = total + netBet;
                                        const newPool = pool + netBet;

                                        const returnAmount = newTotal * (netBet / newPool);
                                        return formatChips(returnAmount);
                                    })()}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>Chip Allocation</Text>
                            <TextInput
                                style={styles.amountInput}
                                value={betAmount}
                                onChangeText={setBetAmount}
                                keyboardType="numeric"
                                placeholder="..."
                                placeholderTextColor="rgba(255,255,255,0.2)"
                            />
                            <View style={styles.balanceTag}>
                                <Text style={styles.balanceText}>Balance: {chipBalance}</Text>
                            </View>
                        </View>

                        <View style={styles.modalButtons}>
                            <Button
                                title="Abort"
                                variant="secondary"
                                onPress={() => setIsBetModalVisible(false)}
                                style={{ flex: 1, marginRight: 8 }}
                            />
                            <Button
                                title="Approve"
                                variant={selectedOutcome === 'YES' ? 'buy' : 'sell'}
                                loading={isSubmitting}
                                onPress={handlePlaceBet}
                                style={{ flex: 2 }}
                            />
                        </View>
                        <View style={styles.disclaimerContainer}>
                            <Text style={styles.disclaimerText}>
                                BLITZR operates exclusively with virtual credits. No real monetary value. Not a financial product.
                            </Text>
                        </View>
                    </GlassCard>
                </View>
            </Modal>

            {/* Event Creation Modal */}
            <Modal
                visible={isCreateModalVisible}
                transparent
                animationType="slide"
                onRequestClose={() => setIsCreateModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <GlassCard style={styles.modalContent} variant="elevated" intensity={50}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Create Market</Text>
                            <View style={styles.modalLine} />
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>Proposition Title</Text>
                            <TextInput
                                style={styles.textInput}
                                value={newEventTitle}
                                onChangeText={setNewEventTitle}
                                placeholder="e.g., Will it rain tomorrow?"
                                placeholderTextColor="rgba(255,255,255,0.2)"
                                maxLength={100}
                                multiline
                            />
                        </View>

                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.xl }}>
                            <View style={{ flex: 1, marginRight: Spacing.md }}>
                                <Text style={styles.inputLabel}>Category</Text>
                                <View style={styles.categoryPicker}>
                                    {['Campus', 'Sports', 'Events', 'Opinion', 'Other'].map((cat) => (
                                        <TouchableOpacity
                                            key={cat}
                                            style={[styles.catOption, newEventCategory === cat && styles.catOptionActive]}
                                            onPress={() => setNewEventCategory(cat)}
                                        >
                                            <Text style={[styles.catOptionText, newEventCategory === cat && styles.catOptionTextActive]}>{cat}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                                {newEventCategory === 'Other' && (
                                    <View style={{ marginTop: Spacing.md }}>
                                        <TextInput
                                            style={[styles.textInput, { minHeight: 40, paddingBottom: 4, fontSize: 12 }]}
                                            value={customCategory}
                                            onChangeText={setCustomCategory}
                                            placeholder="Enter custom category..."
                                            placeholderTextColor="rgba(255,255,255,0.2)"
                                            maxLength={15}
                                            autoCapitalize="characters"
                                        />
                                    </View>
                                )}
                            </View>
                        </View>

                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.xxl }}>
                            <View style={{ flex: 1, marginRight: Spacing.md }}>
                                <Text style={styles.inputLabel}>Duration (Hours)</Text>
                                <TextInput
                                    style={styles.numericInput}
                                    value={newEventExpiryHours}
                                    onChangeText={setNewEventExpiryHours}
                                    keyboardType="numeric"
                                    placeholder="24"
                                    placeholderTextColor="rgba(255,255,255,0.2)"
                                />
                            </View>

                            <View style={{ flex: 1, marginLeft: Spacing.md }}>
                                <Text style={styles.inputLabel}>Initial Liquidity</Text>
                                <TextInput
                                    style={[styles.numericInput, { color: Colors.kineticGreen }]}
                                    value={newEventLiquidity}
                                    onChangeText={setNewEventLiquidity}
                                    keyboardType="numeric"
                                    placeholder="50"
                                    placeholderTextColor="rgba(255,255,255,0.2)"
                                />
                                <View style={{ position: 'absolute', bottom: -20, left: 0, right: 0, alignItems: 'center' }}>
                                    <Text style={{ fontSize: 9, color: Colors.thermalRed, fontFamily: Fonts.bold }}>
                                        Cost: -{parseInt(newEventLiquidity || '0') * 2} Chips
                                    </Text>
                                </View>
                            </View>
                        </View>

                        <View style={styles.modalButtons}>
                            <Button
                                title="Cancel"
                                variant="secondary"
                                onPress={() => setIsCreateModalVisible(false)}
                                style={{ flex: 1, marginRight: 8 }}
                            />
                            <Button
                                title="Deploy"
                                variant="buy"
                                loading={isCreating}
                                onPress={handleCreateEvent}
                                style={{ flex: 2 }}
                            />
                        </View>
                    </GlassCard>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.obsidianBase,
    },
    // Tabs
    tabBar: {
        flexDirection: 'row',
        paddingHorizontal: Spacing.lg,
        paddingTop: Spacing.md,
        paddingBottom: 2,
    },
    tab: {
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.lg,
        marginRight: Spacing.md,
        alignItems: 'center',
    },
    tabActive: {},
    tabIndicator: {
        position: 'absolute',
        bottom: 0,
        height: 2,
        width: '100%',
        backgroundColor: Colors.kineticGreen,
        borderRadius: 2,
    },
    tabText: {
        ...Typography.h3,
        color: Colors.textTertiary,
    },
    tabTextActive: {
        color: Colors.textPrimary,
    },
    // List
    listContent: {
        paddingHorizontal: Spacing.sm,
        paddingTop: Spacing.md,
        paddingBottom: 100,
    },
    columnWrapper: {
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.xs,
        marginBottom: Spacing.sm,
    },
    // Prop Card
    propCard: {
        width: '48.5%',
        padding: Spacing.md,
        marginBottom: Spacing.sm,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Spacing.sm,
    },
    categoryBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.05)',
        paddingHorizontal: 6,
        paddingVertical: 3,
        borderRadius: 4,
    },
    categoryIcon: {
        fontSize: 10,
        marginRight: 4,
    },
    propCategory: {
        ...Typography.dataLabel,
        color: Colors.textSecondary,
        fontSize: 10,
        fontFamily: Fonts.semibold,
    },
    propTitle: {
        ...Typography.bodyMedium,
        color: Colors.textPrimary,
        fontSize: 15,
        height: 44,
        lineHeight: 22,
        marginTop: 4,
    },
    propDate: {
        ...Typography.dataLabel,
        color: Colors.textTertiary,
        fontSize: 10,
        marginTop: 2,
    },
    outcomesContainer: {
        marginTop: Spacing.md,
        gap: 8,
    },
    outcomeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    outcomeInfo: {
        flex: 1,
        marginRight: 12,
    },
    outcomeName: {
        ...Typography.bodyMedium,
        color: Colors.textPrimary,
        fontSize: 13,
        marginBottom: 4,
    },
    progressTrack: {
        height: 4,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 2,
        overflow: 'hidden',
    },
    progressBar: {
        height: '100%',
        borderRadius: 2,
    },
    outcomeStats: {
        flexDirection: 'row',
        alignItems: 'center',
        width: 85,
        justifyContent: 'flex-end',
    },
    outcomeOdds: {
        ...Typography.h3,
        color: Colors.textPrimary,
        marginRight: 8,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: Spacing.lg,
        paddingTop: Spacing.sm,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.03)',
    },
    volumeText: {
        ...Typography.dataLabel,
        color: Colors.textTertiary,
        fontSize: 10,
    },
    marketCount: {
        ...Typography.dataLabel,
        color: Colors.textTertiary,
        fontSize: 10,
    },
    // Empty
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: Spacing.xxxl,
    },
    emptyIcon: {
        fontSize: 64,
        color: Colors.textTertiary,
        marginBottom: Spacing.lg,
    },
    emptyTitle: {
        ...Typography.h2,
        color: Colors.textPrimary,
        marginBottom: Spacing.sm,
    },
    emptySubtitle: {
        ...Typography.dataLabel,
        color: Colors.textTertiary,
        textAlign: 'center',
        lineHeight: 18,
    },
    // FAB
    fab: {
        position: 'absolute',
        bottom: Spacing.xl,
        right: Spacing.xl,
        width: 60,
        height: 60,
        borderRadius: 30,
        overflow: 'hidden',
        elevation: 10,
        shadowColor: Colors.kineticGreen,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 10,
    },
    fabGradient: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    fabText: {
        fontSize: 36,
        color: Colors.obsidianBase,
        fontWeight: '900',
        lineHeight: 36,
        marginTop: -4,
        marginLeft: 1, // Optional: slightly adjust X axis if needed too, but normally Y axis is the issue
    },
    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.9)',
        justifyContent: 'center',
        padding: Spacing.xl,
    },
    modalContent: {
        padding: Spacing.xl,
    },
    modalHeader: {
        alignItems: 'center',
        marginBottom: Spacing.lg,
    },
    modalTitle: {
        ...Typography.h2,
        color: Colors.textPrimary,
    },
    modalLine: {
        height: 1,
        width: 40,
        backgroundColor: Colors.kineticGreen,
        marginTop: 4,
    },
    modalEventTitle: {
        ...Typography.bodyMedium,
        color: Colors.textPrimary,
        textAlign: 'center',
        fontSize: 16,
        marginBottom: Spacing.xl,
    },
    outcomePreview: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 8,
        padding: Spacing.md,
        marginBottom: Spacing.xl,
    },
    outcomeBlock: {
        alignItems: 'center',
    },
    outcomeLabel: {
        ...Typography.dataLabel,
        fontSize: 8,
        color: Colors.textTertiary,
        marginBottom: 4,
    },
    outcomeValue: {
        ...Typography.h3,
        fontWeight: '900',
    },
    outcomeDivider: {
        width: 1,
        height: 30,
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    inputContainer: {
        marginBottom: Spacing.xxl,
    },
    inputLabel: {
        ...Typography.dataLabel,
        color: Colors.textSecondary,
        fontSize: 11,
        marginBottom: Spacing.xs,
    },
    amountInput: {
        ...Typography.displayHero,
        fontSize: 48,
        color: Colors.textPrimary,
        height: 80,
        borderBottomWidth: 1,
        borderBottomColor: Colors.glassBorder,
        textAlign: 'center',
    },
    balanceTag: {
        alignSelf: 'center',
        marginTop: -10,
        backgroundColor: Colors.materialDark,
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: Colors.glassBorder,
    },
    balanceText: {
        ...Typography.dataLabel,
        fontSize: 9,
        color: Colors.activeGold,
    },
    modalButtons: {
        flexDirection: 'row',
    },
    green: { color: Colors.kineticGreen },
    red: { color: Colors.thermalRed },
    // Create Event Specific
    textInput: {
        ...Typography.bodyMedium,
        color: Colors.textPrimary,
        minHeight: 60,
        borderBottomWidth: 1,
        borderBottomColor: Colors.glassBorder,
        paddingBottom: Spacing.sm,
    },
    numericInput: {
        ...Typography.h3,
        color: Colors.textPrimary,
        height: 48,
        borderBottomWidth: 1,
        borderBottomColor: Colors.glassBorder,
        textAlign: 'center',
    },
    categoryPicker: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: Spacing.sm,
    },
    catOption: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 4,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 1,
        borderColor: 'transparent',
    },
    catOptionActive: {
        backgroundColor: 'rgba(57, 255, 122, 0.1)',
        borderColor: Colors.kineticGreen,
    },
    catOptionText: {
        ...Typography.dataLabel,
        fontSize: 10,
        color: Colors.textTertiary,
    },
    catOptionTextActive: {
        color: Colors.kineticGreen,
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
    // Mod Settle
    modSettleConsole: {
        marginTop: Spacing.md,
        paddingTop: Spacing.sm,
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.05)',
    },
    modSettleTitle: {
        ...Typography.dataLabel,
        color: Colors.activeGold,
        fontSize: 9,
        letterSpacing: 1.5,
        marginBottom: Spacing.sm,
    },
    modSettleSubtitle: {
        ...Typography.bodyMedium,
        color: Colors.textPrimary,
        fontSize: 11,
    },
    modSettleButtons: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 4,
    },
    miniSettleBtn: {
        paddingHorizontal: 24,
        paddingVertical: 8,
        borderRadius: 4,
        borderWidth: 1,
        backgroundColor: 'rgba(0,0,0,0.2)',
    },
    miniSettleText: {
        ...Typography.dataLabel,
        fontSize: 10,
        fontFamily: Fonts.bold,
    },
});
