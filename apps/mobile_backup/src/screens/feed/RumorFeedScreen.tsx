import React from 'react';
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    TouchableOpacity,
    StatusBar,
    Modal,
    TextInput,
    Alert,
} from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    interpolate
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { audioService } from '../../services/AudioService';
import { useFeedStore } from '../../store/useFeedStore';
import { GlassCard } from '../../components/common/GlassCard';
import { TickerTape } from '../../components/common/TickerTape';
import { Colors, Typography, Spacing, BorderRadius, Gradients } from '../../theme';
import { useMarketStore } from '../../store/useMarketStore';
import { formatTimeAgo } from '../../utils/formatters';
import { api } from '../../services/api';
import { Button } from '../../components/common/Button';
import { usePortfolioStore } from '../../store/usePortfolioStore';

/**
 * RumorFeedScreen — High-Fidelity Intelligence Feed
 * Aesthetic: Ghost Glass / Neural Net
 */
export const RumorFeedScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
    const { rumors, userVotes, updateRumorVotes, fetchInitialData } = useFeedStore();
    const { tickerTapeItems } = useMarketStore();
    const { credibilityScore } = usePortfolioStore();

    // Broadcast Modal State
    const [isCreateModalVisible, setIsCreateModalVisible] = React.useState(false);
    const [newRumorContent, setNewRumorContent] = React.useState('');
    const [isDeploying, setIsDeploying] = React.useState(false);

    // Ghost Scan Animation
    const scanPos = useSharedValue(0);
    React.useEffect(() => {
        scanPos.value = withRepeat(withTiming(1, { duration: 4000 }), -1, false);
    }, []);

    const animatedScanLine = useAnimatedStyle(() => ({
        top: interpolate(scanPos.value, [0, 1], [-10, 300]),
        opacity: interpolate(scanPos.value, [0, 0.5, 1], [0, 1, 0]),
    }));

    const handleVote = async (rumorId: string, type: 'UP' | 'DOWN') => {
        if (userVotes[rumorId] === type) return; // Prevent duplicate network calls

        audioService.playSFX('CLICK');
        try {
            const updated = (type === 'UP'
                ? await api.upvoteRumor(rumorId)
                : await api.downvoteRumor(rumorId)) as any;

            updateRumorVotes(rumorId, updated.upvotes, updated.downvotes, type);
        } catch (error) {
            console.error('Vote failed:', error);
        }
    };

    const handleCreateRumor = async () => {
        if (!newRumorContent || newRumorContent.trim().length < 5) {
            Alert.alert('Invalid Transmission', 'Intelligence broadcasts must contain at least 5 characters of encrypted context.');
            return;
        }

        setIsDeploying(true);
        audioService.playSFX('TRADE_SUCCESS');
        try {
            await api.createRumor(newRumorContent.trim());
            Alert.alert('Transmission Successful', 'Anonymous intelligence injected into the stream.');
            setIsCreateModalVisible(false);
            setNewRumorContent('');
            fetchInitialData(); // Instantly pull the new Ghost node back onto the stream UI
        } catch (error: any) {
            Alert.alert('Deployment Failed', error.message || 'Signal lost.');
        } finally {
            setIsDeploying(false);
        }
    };

    const handleDispute = async (rumorId: string) => {
        audioService.playSFX('ERROR');
        try {
            const res = await api.disputeRumor(rumorId);
            if ((res as any).success) {
                Alert.alert('Intelligence Disputed', 'We are triangulating consensus. Too many disputes will trigger a lockdown.');
            } else {
                Alert.alert('Notice', (res as any).message || 'Already disputed.');
            }
        } catch (error: any) {
            Alert.alert('Failed to Flag', error.message);
        }
    };

    const isRestrictedFactualClaim = () => {
        if (credibilityScore >= 50) return false;
        const keywords = ['will acquire', 'merger', 'resigning', 'firing', 'bankrupt', 'lawsuit', 'investigation', 'earnings', 'revenue'];
        const lowerStr = newRumorContent.toLowerCase();
        return keywords.some(k => lowerStr.includes(k));
    };

    const renderRumor = ({ item }: { item: typeof rumors[0] }) => {
        return (
            <GlassCard
                style={[
                    styles.rumorCard,
                    item.is_pinned && styles.pinnedCard,
                ]}
                variant={item.is_pinned ? 'elevated' : 'flat'}
                intensity={item.is_pinned ? 30 : 10}
            >
                {/* Ghost Scan Line Overlay */}
                {item.is_pinned && <Animated.View style={[styles.scanLine, animatedScanLine]} />}

                {/* Header: ghost_id + timestamp */}
                <View style={styles.rumorHeader}>
                    <View style={styles.ghostRow}>
                        <View style={styles.ghostAvatar}>
                            <Text style={styles.ghostAvatarText}>Ω</Text>
                        </View>
                        <View>
                            <Text style={styles.ghostId}>ANONYMOUS_ENTITY_{item.ghost_id.slice(-4)}</Text>
                            <Text style={styles.timestamp}>{formatTimeAgo(item.created_at)}</Text>
                        </View>
                    </View>
                    {item.is_pinned && (
                        <View style={styles.pinnedNotice}>
                            <Text style={styles.pinnedNoticeText}>PRIORITY</Text>
                        </View>
                    )}
                    {(item as Exclude<typeof item, never> & { post_type?: string }).post_type === 'FACTUAL_CLAIM' && (
                        <View style={styles.factualNotice}>
                            <Text style={styles.factualNoticeText}>⚠️ FACTUAL CLAIM</Text>
                        </View>
                    )}
                </View>

                {/* Content with $TICKER highlighting */}
                <View style={styles.contentWrapper}>
                    <Text style={styles.rumorContent}>
                        {highlightTickers(item.content)}
                    </Text>
                </View>

                {/* Footer: Tags + Votes */}
                <View style={styles.rumorFooter}>
                    <View style={styles.tagRow}>
                        {item.tagged_tickers.map((ticker) => (
                            <TouchableOpacity
                                key={ticker}
                                onPress={() => navigation.navigate('TickerDetail', { tickerId: ticker })}
                                style={styles.tickerTag}
                            >
                                <Text style={styles.tickerTagText}>${ticker}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <View style={styles.voteRow}>
                        {(() => {
                            const voteStatus = userVotes[item.rumor_id];
                            const isUp = voteStatus === 'UP';
                            const isDown = voteStatus === 'DOWN';

                            return (
                                <>
                                    <TouchableOpacity
                                        style={[styles.voteButton, isUp && styles.voteButtonActiveUp]}
                                        onPress={() => handleVote(item.rumor_id, 'UP')}
                                    >
                                        <LinearGradient
                                            colors={[isUp ? 'rgba(0,255,65,0.2)' : 'rgba(0,255,65,0.05)', 'transparent']}
                                            style={styles.voteButtonBg}
                                        />
                                        <Text style={styles.voteUp}>▲ {item.upvotes}</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.voteButton, isDown && styles.voteButtonActiveDown]}
                                        onPress={() => handleVote(item.rumor_id, 'DOWN')}
                                    >
                                        <LinearGradient
                                            colors={[isDown ? 'rgba(255,59,48,0.2)' : 'rgba(255,59,48,0.05)', 'transparent']}
                                            style={styles.voteButtonBg}
                                        />
                                        <Text style={styles.voteDown}>▼ {item.downvotes}</Text>
                                    </TouchableOpacity>
                                    
                                    <TouchableOpacity
                                        style={styles.disputeButton}
                                        onPress={() => handleDispute(item.rumor_id)}
                                    >
                                        <Text style={styles.disputeIcon}>🏴</Text>
                                    </TouchableOpacity>
                                </>
                            );
                        })()}
                    </View>
                </View>
                {item.is_pinned && <View style={styles.pinnedGlow} />}
            </GlassCard>
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <LinearGradient colors={Gradients.obsidianDeep as any} style={StyleSheet.absoluteFill} />

            <TickerTape items={tickerTapeItems} />

            <View style={styles.feedHeader}>
                <Text style={styles.feedTitle}>INTELLIGENCE_STREAM</Text>
                <View style={styles.headerDot} />
            </View>

            <FlatList
                data={rumors}
                keyExtractor={(item) => item.rumor_id}
                renderItem={renderRumor}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyIcon}>∅</Text>
                        <Text style={styles.emptyTitle}>NO DATA_FLOW</Text>
                        <Text style={styles.emptySubtitle}>
                            The encrypted channel is currently silent.
                        </Text>
                    </View>
                }
            />

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
                    <Text style={styles.fabText}>+</Text>
                </LinearGradient>
            </TouchableOpacity>

            {/* Ghost Broadcast Modal */}
            <Modal
                visible={isCreateModalVisible}
                transparent
                animationType="slide"
                onRequestClose={() => setIsCreateModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <GlassCard style={styles.modalContent} variant="elevated" intensity={50}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>ENCRYPTED_BROADCAST</Text>
                            <View style={styles.modalLine} />
                        </View>

                        <View style={styles.ghostIdentityWarning}>
                            <View style={styles.ghostAvatarSmall}>
                                <Text style={styles.ghostAvatarTextSmall}>Ω</Text>
                            </View>
                            <Text style={styles.ghostWarningText}>
                                Your biological IP signature will be scrambled via one-way cryptographic hashing upon deployment. You are acting as ANONYMOUS_ENTITY_XXXX.
                            </Text>
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>TRANSMISSION_PAYLOAD</Text>
                            <TextInput
                                style={styles.textInput}
                                value={newRumorContent}
                                onChangeText={setNewRumorContent}
                                placeholder="Intercepted intelligence to broadcast..."
                                placeholderTextColor="rgba(255,255,255,0.2)"
                                maxLength={280}
                                multiline
                                textAlignVertical="top"
                            />
                            <View style={styles.characterCountRow}>
                                <Text style={[styles.characterCount, newRumorContent.length >= 250 && { color: Colors.thermalRed }]}>
                                    {newRumorContent.length} / 280
                                </Text>
                            </View>
                            
                            {isRestrictedFactualClaim() && (
                                <View style={styles.restrictionWarning}>
                                    <Text style={styles.restrictionWarningText}>
                                        ⚠️ CREDIBILITY LOCK: Your score ({credibilityScore}) is below 50. 
                                        You cannot execute 'Factual Claim' intelligence drops until you prove competency in the Prop Arena.
                                    </Text>
                                </View>
                            )}
                        </View>

                        <View style={styles.modalButtons}>
                            <Button
                                title="ABORT"
                                variant="secondary"
                                onPress={() => setIsCreateModalVisible(false)}
                                style={{ flex: 1, marginRight: 8 }}
                            />
                            <Button
                                title="TRANSMIT"
                                variant="buy"
                                loading={isDeploying}
                                disabled={isRestrictedFactualClaim()}
                                onPress={handleCreateRumor}
                                style={{ flex: 2 }}
                            />
                        </View>
                    </GlassCard>
                </View>
            </Modal>
        </View>
    );
};

/**
 * Highlight $TICKER mentions in Neural Green.
 */
function highlightTickers(content: string): React.ReactNode {
    const parts = content.split(/(\$[A-Z_]{1,20})/g);
    return parts.map((part, index) => {
        if (part.match(/^\$[A-Z_]{1,20}$/)) {
            return (
                <Text key={index} style={styles.tickerMention}>
                    {part}
                </Text>
            );
        }
        return part;
    });
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.obsidianBase,
    },
    feedHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.lg,
        paddingTop: Spacing.md,
        paddingBottom: Spacing.sm,
    },
    feedTitle: {
        ...Typography.caption,
        color: Colors.textSecondary,
        letterSpacing: 3,
        fontWeight: '700',
    },
    headerDot: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: Colors.kineticGreen,
        marginLeft: 8,
    },
    listContent: {
        paddingHorizontal: Spacing.sm,
        paddingTop: Spacing.sm,
        paddingBottom: 40,
    },
    // Rumor Card
    rumorCard: {
        marginBottom: Spacing.md,
        padding: Spacing.lg,
        overflow: 'hidden',
    },
    pinnedCard: {
        borderColor: 'rgba(212, 175, 55, 0.3)',
        borderWidth: 1,
    },
    scanLine: {
        position: 'absolute',
        left: 0,
        right: 0,
        height: 1,
        backgroundColor: Colors.kineticGreen,
        opacity: 0.2,
        zIndex: 10,
    },
    pinnedGlow: {
        position: 'absolute',
        top: 0,
        right: 0,
        width: 40,
        height: 40,
        backgroundColor: Colors.activeGold,
        opacity: 0.05,
        borderRadius: 20,
        transform: [{ scale: 2 }],
    },
    // Header
    rumorHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: Spacing.lg,
    },
    ghostRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    ghostAvatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: Colors.materialDark,
        borderWidth: 1,
        borderColor: Colors.glassBorder,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: Spacing.md,
    },
    ghostAvatarText: {
        color: Colors.textTertiary,
        fontSize: 14,
        fontWeight: '900',
    },
    ghostId: {
        ...Typography.ticker,
        color: Colors.textSecondary,
        fontSize: 10,
        letterSpacing: 1,
    },
    pinnedNotice: {
        backgroundColor: Colors.activeGold,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    pinnedNoticeText: {
        ...Typography.dataLabel,
        fontSize: 8,
        color: Colors.obsidianBase,
        fontWeight: '900',
    },
    factualNotice: {
        borderColor: Colors.activeGold,
        borderWidth: 1,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        marginLeft: 8,
    },
    factualNoticeText: {
        ...Typography.dataLabel,
        fontSize: 8,
        color: Colors.activeGold,
        fontWeight: '900',
    },
    timestamp: {
        ...Typography.dataLabel,
        color: Colors.textTertiary,
        fontSize: 9,
        marginTop: 2,
    },
    // Content
    contentWrapper: {
        marginBottom: Spacing.xl,
    },
    rumorContent: {
        ...Typography.body,
        color: Colors.textPrimary,
        fontSize: 15,
        lineHeight: 24,
    },
    tickerMention: {
        ...Typography.ticker,
        color: Colors.kineticGreen,
        fontWeight: 'bold',
    },
    // Footer
    rumorFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    tagRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        flex: 1,
    },
    tickerTag: {
        backgroundColor: 'rgba(0, 255, 65, 0.05)',
        borderRadius: 4,
        paddingHorizontal: 8,
        paddingVertical: 4,
        marginRight: Spacing.xs,
        borderWidth: 1,
        borderColor: 'rgba(0, 255, 65, 0.1)',
    },
    tickerTagText: {
        ...Typography.ticker,
        color: Colors.kineticGreen,
        fontSize: 9,
    },
    // Votes
    voteRow: {
        flexDirection: 'row',
        gap: Spacing.sm,
    },
    voteButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.03)',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
        overflow: 'hidden',
    },
    voteButtonActiveUp: {
        borderColor: 'rgba(0,255,65,0.4)',
    },
    voteButtonActiveDown: {
        borderColor: 'rgba(255,59,48,0.4)',
    },
    voteButtonBg: {
        ...StyleSheet.absoluteFillObject,
    },
    voteUp: {
        ...Typography.priceSmall,
        color: Colors.kineticGreen,
        fontSize: 11,
        fontWeight: 'bold',
    },
    voteDown: {
        ...Typography.priceSmall,
        color: Colors.thermalRed,
        fontSize: 11,
        fontWeight: 'bold',
    },
    disputeButton: {
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 10,
        backgroundColor: 'rgba(255,255,255,0.02)',
        borderRadius: 6,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    disputeIcon: {
        fontSize: 12,
        opacity: 0.6,
    },
    // Empty
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 120,
    },
    emptyIcon: {
        fontSize: 64,
        color: Colors.textTertiary,
        marginBottom: Spacing.lg,
    },
    emptyTitle: {
        ...Typography.h2,
        color: Colors.textPrimary,
        letterSpacing: 4,
    },
    emptySubtitle: {
        ...Typography.dataLabel,
        color: Colors.textTertiary,
        marginTop: Spacing.sm,
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
        marginLeft: 1,
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
        ...Typography.dataLabel,
        color: Colors.textSecondary,
        letterSpacing: 4,
    },
    modalLine: {
        height: 1,
        width: 40,
        backgroundColor: Colors.kineticGreen,
        marginTop: 4,
    },
    ghostIdentityWarning: {
        flexDirection: 'row',
        backgroundColor: 'rgba(57, 255, 122, 0.05)',
        borderWidth: 1,
        borderColor: 'rgba(57, 255, 122, 0.2)',
        padding: Spacing.md,
        borderRadius: 8,
        marginBottom: Spacing.xl,
        alignItems: 'center',
    },
    ghostAvatarSmall: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: Colors.materialDark,
        borderWidth: 1,
        borderColor: Colors.kineticGreen,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: Spacing.md,
    },
    ghostAvatarTextSmall: {
        color: Colors.kineticGreen,
        fontSize: 10,
        fontWeight: '900',
    },
    ghostWarningText: {
        flex: 1,
        ...Typography.dataLabel,
        color: Colors.textSecondary,
        fontSize: 9,
        lineHeight: 14,
    },
    inputContainer: {
        marginBottom: Spacing.xl,
    },
    inputLabel: {
        ...Typography.dataLabel,
        color: Colors.textSecondary,
        letterSpacing: 2,
        marginBottom: Spacing.sm,
    },
    textInput: {
        ...Typography.bodyMedium,
        color: Colors.textPrimary,
        height: 120,
        backgroundColor: 'rgba(0,0,0,0.2)',
        borderWidth: 1,
        borderColor: Colors.glassBorder,
        borderRadius: 6,
        padding: Spacing.md,
        lineHeight: 22,
    },
    characterCountRow: {
        alignItems: 'flex-end',
        marginTop: 6,
    },
    characterCount: {
        ...Typography.dataLabel,
        color: Colors.textTertiary,
        fontSize: 9,
    },
    restrictionWarning: {
        marginTop: Spacing.md,
        padding: Spacing.sm,
        backgroundColor: 'rgba(255, 59, 48, 0.1)',
        borderLeftWidth: 2,
        borderColor: Colors.thermalRed,
    },
    restrictionWarningText: {
        ...Typography.dataLabel,
        color: Colors.thermalRed,
        fontSize: 10,
        lineHeight: 14,
    },
    modalButtons: {
        flexDirection: 'row',
    },
});


