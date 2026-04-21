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
import { useNavigation, useRoute } from '@react-navigation/native';

const FEATURE_DATA: any = {
    SECURE_DASHBOARD: {
        icon: 'shield',
        title: 'Secure Dashboard',
        description: 'Advanced profile obfuscation for high-value accounts.',
        details: [
            'Removes your profile from public "Floor" search results.',
            'Masks your net worth from non-connected entities.',
            'Ensures your asset breakdown remains strictly confidential.',
        ]
    },
    STEALTH_TRADING: {
        icon: 'eye-off',
        title: 'Stealth Trading',
        description: 'Anonymous execution protocols.',
        details: [
            'Hides your username from live "Ticker Tape" broadcasts.',
            'Obfuscates your position size in public market depth.',
            'Prevents imitation trading on your open positions.',
        ]
    },
    TWO_FACTOR_AUTH: {
        icon: 'key',
        title: 'Two-Factor Authentication',
        description: 'Biometric and multi-step verification.',
        details: [
            'Requires biometric verification for all high-value trades.',
            'Mandatory 2FA for all Cred-to-Chip exchange operations.',
            'Hardware-level encryption for your session and keys.',
        ]
    }
};

export const PrivacyDetailScreen: React.FC = () => {
    const navigation = useNavigation();
    const route = useRoute<any>();
    const { featureId } = route.params || { featureId: 'SECURE_DASHBOARD' };
    const feature = FEATURE_DATA[featureId] || FEATURE_DATA.SECURE_DASHBOARD;

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <LinearGradient colors={Gradients.obsidianDeep as any} style={StyleSheet.absoluteFill as any} />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Feather name="chevron-left" size={24} color={Colors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.title}>Privacy Protocol</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <GlassCard style={styles.heroCard} variant="default" intensity={20}>
                    <View style={styles.iconBox}>
                        <Feather name={feature.icon} size={32} color={Colors.kineticGreen} />
                    </View>
                    <Text style={styles.featureTitle}>{feature.title}</Text>
                    <Text style={styles.featureDescription}>{feature.description}</Text>
                </GlassCard>

                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Capabilities</Text>
                    <View style={styles.headerLine} />
                </View>

                {feature.details.map((detail: string, index: number) => (
                    <View key={index} style={styles.detailRow}>
                        <Feather name="check-circle" size={14} color={Colors.kineticGreen} />
                        <Text style={styles.detailText}>{detail}</Text>
                    </View>
                ))}

                <TouchableOpacity style={styles.actionButton} onPress={() => navigation.goBack()}>
                    <Text style={styles.actionButtonText}>Acknowledge and Return</Text>
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
        letterSpacing: 2,
    },
    content: {
        padding: Spacing.lg,
    },
    heroCard: {
        alignItems: 'center',
        padding: Spacing.xxl,
        marginBottom: Spacing.xl,
    },
    iconBox: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: 'rgba(0, 255, 65, 0.05)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.lg,
        borderWidth: 1,
        borderColor: 'rgba(0, 255, 65, 0.1)',
    },
    featureTitle: {
        ...Typography.h3,
        color: Colors.textPrimary,
        marginBottom: Spacing.xs,
    },
    featureDescription: {
        ...Typography.body,
        color: Colors.textSecondary,
        textAlign: 'center',
        fontSize: 13,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Spacing.lg,
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
    detailRow: {
        flexDirection: 'row',
        gap: Spacing.md,
        marginBottom: Spacing.md,
        alignItems: 'flex-start',
    },
    detailText: {
        ...Typography.body,
        color: Colors.textSecondary,
        fontSize: 12,
        lineHeight: 18,
        flex: 1,
    },
    actionButton: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        paddingVertical: Spacing.lg,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: Spacing.xxl,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    actionButtonText: {
        ...Typography.bodyMedium,
        color: Colors.textPrimary,
    },
});
