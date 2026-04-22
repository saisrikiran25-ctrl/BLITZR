import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    StatusBar,
    TouchableOpacity,
    Platform,
    ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { GlassCard } from '../../components/common/GlassCard';
import { Colors, Typography, Spacing, Gradients } from '../../theme';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../../store/useAuthStore';
import { usePortfolioStore } from '../../store/usePortfolioStore';
import { useNotificationsStore } from '../../store/useNotificationsStore';
import { api } from '../../services/api';
import { Alert } from 'react-native';

declare const window: any;

export const PrivacyScreen: React.FC = () => {
    const navigation = useNavigation<any>();
    const { logout } = useAuthStore();
    const [isConfirmingErase, setIsConfirmingErase] = React.useState(false);

    const handleEraseData = async () => {
        if (!isConfirmingErase) {
            setIsConfirmingErase(true);
            setTimeout(() => setIsConfirmingErase(false), 5000); // Auto-reset after 5 seconds
            return;
        }

        // If already confirming, execute the purge immediately
        try {
            await api.deleteAccount();
            // Clear all local stores
            usePortfolioStore.getState().clearData();
            useNotificationsStore.getState().clearNotifications();
            await logout(); // Ensure we await the async logout
            if (Platform.OS === 'web') {
                (window as any).location.reload();
            }
        } catch {
            if (Platform.OS === 'web') {
                (window as any).alert('Failed to execute data purge.');
            } else {
                Alert.alert('System Error', 'Failed to execute data purge.');
            }
        }
    };

    const renderSetting = (icon: any, title: string, description: string, featureId: string) => (
        <TouchableOpacity 
            style={styles.settingRow}
            onPress={() => navigation.navigate('PrivacyDetail', { featureId })}
        >
            <View style={styles.settingLeft}>
                <Feather name={icon} size={20} color={Colors.textSecondary} />
                <View style={styles.settingText}>
                    <Text style={styles.settingTitle}>{title}</Text>
                    <Text style={styles.settingDescription}>{description}</Text>
                </View>
            </View>
            <Feather name="chevron-right" size={16} color={Colors.textTertiary} />
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <LinearGradient colors={Gradients.obsidianDeep as any} style={StyleSheet.absoluteFill as any} />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Feather name="chevron-left" size={24} color={Colors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.title}>Privacy</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Security & Encryption</Text>
                    <View style={styles.headerLine} />
                </View>

                <GlassCard style={styles.card} variant="default" intensity={15}>
                    {renderSetting('shield', 'Secure Dashboard', 'Hidden profile from public floor searches.', 'SECURE_DASHBOARD')}
                    <View style={styles.divider} />
                    {renderSetting('eye-off', 'Stealth Trading', 'Keep your active positions anonymous.', 'STEALTH_TRADING')}
                    <View style={styles.divider} />
                    {renderSetting('key', 'Two-Factor Auth', 'Enhanced biometric verification.', 'TWO_FACTOR_AUTH')}
                </GlassCard>

                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Data Management</Text>
                    <View style={styles.headerLine} />
                </View>

                <TouchableOpacity 
                    style={[styles.dangerAction, isConfirmingErase && styles.dangerActionConfirm]} 
                    onPress={handleEraseData}
                >
                    <Text style={[styles.dangerText, isConfirmingErase && styles.dangerTextConfirm]}>
                        {isConfirmingErase ? "CONFIRM ERASE ALL DATA (IRREVERSIBLE)" : "Erase All Data"}
                    </Text>
                    {!isConfirmingErase && <Feather name="trash-2" size={16} color={Colors.thermalRed} />}
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.obsidianBase,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: Platform.OS === 'ios' ? 40 : 20,
        paddingHorizontal: Spacing.lg,
        paddingBottom: Spacing.lg,
    },
    backButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        ...Typography.h2,
        color: Colors.textPrimary,
    },
    content: {
        padding: Spacing.lg,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Spacing.md,
        marginTop: Spacing.lg,
    },
    sectionTitle: {
        ...Typography.dataLabel,
        color: Colors.textSecondary,
        marginRight: Spacing.md,
    },
    headerLine: {
        flex: 1,
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    card: {
        padding: Spacing.md,
    },
    settingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: Spacing.md,
    },
    settingLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
        flex: 1,
    },
    settingText: {
        flex: 1,
    },
    settingTitle: {
        ...Typography.dataLabel,
        color: Colors.textPrimary,
        fontSize: 11,
    },
    settingDescription: {
        ...Typography.caption,
        color: Colors.textTertiary,
        marginTop: 2,
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    dangerAction: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'rgba(255, 59, 48, 0.05)',
        padding: Spacing.lg,
        borderRadius: 8,
        marginTop: Spacing.sm,
        borderWidth: 1,
        borderColor: 'rgba(255, 59, 48, 0.1)',
    },
    dangerText: {
        ...Typography.dataLabel,
        color: Colors.thermalRed,
    },
    dangerActionConfirm: {
        backgroundColor: Colors.thermalRed,
        borderColor: Colors.thermalRed,
        justifyContent: 'center',
    },
    dangerTextConfirm: {
        color: '#fff',
        fontWeight: 'bold',
    },
});
