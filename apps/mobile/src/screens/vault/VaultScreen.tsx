import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    Alert,
    StatusBar,
    TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { GlassCard } from '../../components/common/GlassCard';
import { Button } from '../../components/common/Button';
import { Colors, Typography, Spacing, BorderRadius, Gradients } from '../../theme';
import { usePortfolioStore } from '../../store/usePortfolioStore';
import { formatCreds, formatChips } from '../../utils/formatters';
import { api } from '../../services/api';

/**
 * VaultScreen — High-Fidelity Asset Management
 * Aesthetic: Material Dark / Secure Terminal
 */
export const VaultScreen: React.FC = () => {
    const { credBalance, chipBalance, performExchange } = usePortfolioStore();
    const [exchangeAmount, setExchangeAmount] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [direction, setDirection] = useState<'creds-to-chips' | 'chips-to-creds'>('creds-to-chips');

    const handleExchange = async () => {
        const amount = parseFloat(exchangeAmount);
        if (isNaN(amount) || amount <= 0) {
            Alert.alert('Invalid Amount', 'Please enter a valid positive number.');
            return;
        }

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setIsLoading(true);
        try {
            const success = await performExchange(
                amount,
                direction === 'creds-to-chips' ? 'cred_to_chip' : 'chip_to_cred'
            );

            if (success) {
                setExchangeAmount('');
                Alert.alert('VAULT_SECURE', 'Transaction authorized and settled immediately.');
            } else {
                throw new Error('Transaction settlement failed at the gateway.');
            }
        } catch (error: any) {
            Alert.alert('VAULT_ERROR', error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const previewAmount =
        direction === 'creds-to-chips'
            ? parseFloat(exchangeAmount || '0') * 2
            : parseFloat(exchangeAmount || '0') / 2;

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <LinearGradient colors={Gradients.obsidianDeep as any} style={StyleSheet.absoluteFill} />

            <View style={styles.header}>
                <Text style={styles.headerTitle}>SECURE_VAULT_INTERFACE</Text>
                <View style={styles.headerStatus}>
                    <View style={styles.statusDot} />
                    <Text style={styles.statusText}>ENCRYPTED</Text>
                </View>
            </View>

            {/* Balance overview HUD */}
            <View style={styles.balanceSection}>
                <GlassCard style={styles.balanceCard} variant="default" intensity={15}>
                    <Text style={styles.balanceLabel}>CRED_RESERVE</Text>
                    <Text style={[styles.credAmount, Typography.phosphorGreen]}>
                        {formatCreds(credBalance)}
                    </Text>
                </GlassCard>
                <GlassCard style={styles.balanceCard} variant="default" intensity={15}>
                    <Text style={styles.balanceLabel}>CHIP_LIQUIDITY</Text>
                    <Text style={[styles.chipAmount, Typography.phosphorAmber]}>
                        {formatChips(chipBalance)}
                    </Text>
                </GlassCard>
            </View>

            {/* Exchange Section Terminal */}
            <GlassCard style={styles.exchangeCard} variant="elevated" intensity={40}>
                <Text style={styles.exchangeTitle}>ASSET_CONVERSION_TERMINAL</Text>
                <View style={styles.divider} />

                {/* Direction toggle */}
                <View style={styles.directionRow}>
                    <TouchableOpacity
                        style={[styles.dirTab, direction === 'creds-to-chips' && styles.dirTabActive]}
                        onPress={() => {
                            setDirection('creds-to-chips');
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        }}
                    >
                        <Text style={[styles.dirTabText, direction === 'creds-to-chips' && styles.dirTabTextActive]}>CREDS → CHIPS</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.dirTab, direction === 'chips-to-creds' && styles.dirTabActive]}
                        onPress={() => {
                            setDirection('chips-to-creds');
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        }}
                    >
                        <Text style={[styles.dirTabText, direction === 'chips-to-creds' && styles.dirTabTextActive]}>CHIPS → CREDS</Text>
                    </TouchableOpacity>
                </View>

                {/* Input HUD */}
                <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>INPUT_AMOUNT</Text>
                    <View style={styles.inputWrapper}>
                        <TextInput
                            style={styles.input}
                            value={exchangeAmount}
                            onChangeText={setExchangeAmount}
                            placeholder="0.00"
                            placeholderTextColor="rgba(255,255,255,0.1)"
                            keyboardType="decimal-pad"
                        />
                        <Text style={styles.currencyTag}>{direction === 'creds-to-chips' ? 'CREDS' : 'CHIPS'}</Text>
                    </View>
                </View>

                {/* Preview HUD */}
                <View style={styles.previewHUD}>
                    <View style={styles.previewColumn}>
                        <Text style={styles.previewLabel}>EXCHANGE_RATE</Text>
                        <Text style={styles.previewValue}>1:2.00</Text>
                    </View>
                    <View style={styles.previewDivider} />
                    <View style={styles.previewColumn}>
                        <Text style={styles.previewLabel}>OUTPUT_ESTIMATE</Text>
                        <Text style={styles.previewValueHighlight}>
                            {previewAmount.toFixed(direction === 'creds-to-chips' ? 2 : 2)} {direction === 'creds-to-chips' ? 'CHIPS' : 'CREDS'}
                        </Text>
                    </View>
                </View>

                <Button
                    title="AUTHORIZE_EXCHANGE"
                    variant="buy"
                    size="lg"
                    fullWidth
                    loading={isLoading}
                    disabled={!exchangeAmount || parseFloat(exchangeAmount) <= 0}
                    onPress={handleExchange}
                    style={{ marginTop: Spacing.xl }}
                />

                <View style={styles.disclaimerContainer}>
                    <Text style={styles.disclaimerText}>
                        BLITZR operates exclusively with virtual credits. No real monetary value. Not a financial product.
                    </Text>
                </View>
            </GlassCard>

            <View style={styles.footerNote}>
                <Text style={styles.footerText}>SECURE_PROTOCOL_V4.2 // NO_REVOCATION_POSSIBLE</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.obsidianBase,
    },
    header: {
        paddingHorizontal: Spacing.xl,
        paddingTop: Spacing.xl,
        marginBottom: Spacing.lg,
    },
    headerTitle: {
        ...Typography.caption,
        color: Colors.textSecondary,
        letterSpacing: 4,
        fontWeight: '900',
    },
    headerStatus: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: Colors.kineticGreen,
        marginRight: 6,
    },
    statusText: {
        ...Typography.dataLabel,
        color: Colors.kineticGreen,
        fontSize: 8,
        letterSpacing: 2,
    },
    // Balances
    balanceSection: {
        flexDirection: 'row',
        paddingHorizontal: Spacing.lg,
        marginBottom: Spacing.xl,
        gap: Spacing.sm,
    },
    balanceCard: {
        flex: 1,
        padding: Spacing.lg,
        alignItems: 'flex-start',
        overflow: 'hidden',
    },
    balanceLabel: {
        ...Typography.dataLabel,
        color: Colors.textTertiary,
        fontSize: 8,
        letterSpacing: 2,
        marginBottom: Spacing.sm,
    },
    credAmount: {
        ...Typography.priceLarge,
        color: Colors.textPrimary,
        fontSize: 20,
    },
    chipAmount: {
        ...Typography.priceLarge,
        color: Colors.textPrimary,
        fontSize: 20,
    },
    // Exchange
    exchangeCard: {
        marginHorizontal: Spacing.lg,
        padding: Spacing.xl,
    },
    exchangeTitle: {
        ...Typography.dataLabel,
        color: Colors.textSecondary,
        letterSpacing: 2,
        textAlign: 'center',
        marginBottom: Spacing.md,
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.05)',
        width: '100%',
        marginBottom: Spacing.xl,
    },
    directionRow: {
        flexDirection: 'row',
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderRadius: 8,
        padding: 4,
        marginBottom: Spacing.xxl,
    },
    dirTab: {
        flex: 1,
        paddingVertical: Spacing.md,
        alignItems: 'center',
        borderRadius: 6,
    },
    dirTabActive: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    dirTabText: {
        ...Typography.dataLabel,
        color: Colors.textTertiary,
        fontSize: 10,
    },
    dirTabTextActive: {
        color: Colors.textPrimary,
        fontWeight: 'bold',
    },
    inputContainer: {
        marginBottom: Spacing.xl,
    },
    inputLabel: {
        ...Typography.dataLabel,
        color: Colors.textTertiary,
        fontSize: 8,
        letterSpacing: 2,
        marginBottom: Spacing.sm,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'baseline',
        borderBottomWidth: 1,
        borderBottomColor: Colors.glassBorder,
        paddingBottom: Spacing.xs,
    },
    input: {
        ...Typography.displayHero,
        color: Colors.textPrimary,
        fontSize: 32,
        flex: 1,
    },
    currencyTag: {
        ...Typography.ticker,
        color: Colors.textTertiary,
        fontSize: 12,
    },
    previewHUD: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 8,
        padding: Spacing.md,
        marginTop: Spacing.md,
    },
    previewColumn: {
        flex: 1,
        alignItems: 'center',
    },
    previewDivider: {
        width: 1,
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    previewLabel: {
        ...Typography.dataLabel,
        fontSize: 7,
        color: Colors.textTertiary,
        marginBottom: 4,
    },
    previewValue: {
        ...Typography.dataLabel,
        fontSize: 12,
        color: Colors.textSecondary,
    },
    previewValueHighlight: {
        ...Typography.dataLabel,
        fontSize: 12,
        color: Colors.kineticGreen,
        fontWeight: 'bold',
    },
    footerNote: {
        marginTop: Spacing.xxxl,
        alignItems: 'center',
    },
    footerText: {
        ...Typography.dataLabel,
        fontSize: 8,
        color: Colors.textTertiary,
        letterSpacing: 2,
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
});
