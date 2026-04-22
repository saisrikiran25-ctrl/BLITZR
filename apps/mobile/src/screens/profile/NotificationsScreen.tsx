import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    StatusBar,
    TouchableOpacity,
    Platform,
    ScrollView,
    Switch,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { GlassCard } from '../../components/common/GlassCard';
import { Colors, Typography, Spacing, Gradients } from '../../theme';
import { useNavigation } from '@react-navigation/native';
import { useNotificationsStore } from '../../store/useNotificationsStore';

export const NotificationsScreen: React.FC = () => {
    const navigation = useNavigation();
    const { preferences, updatePreference, fetchPreferences } = useNotificationsStore();

    React.useEffect(() => {
        fetchPreferences();
    }, [fetchPreferences]);

    const renderToggle = (icon: any, title: string, value: boolean, onToggle: (v: boolean) => void) => (
        <View style={styles.toggleRow}>
            <View style={styles.toggleLeft}>
                <Feather name={icon} size={20} color={value ? Colors.kineticGreen : Colors.textSecondary} />
                <Text style={styles.toggleTitle}>{title}</Text>
            </View>
            <Switch
                value={value}
                onValueChange={onToggle}
                trackColor={{ false: Colors.titaniumGray, true: 'rgba(0, 255, 65, 0.2)' }}
                thumbColor={value ? Colors.kineticGreen : Colors.slateNeutral}
            />
        </View>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <LinearGradient colors={Gradients.obsidianDeep as any} style={StyleSheet.absoluteFill as any} />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Feather name="chevron-left" size={24} color={Colors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.title}>Notifications</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Notification Channels</Text>
                    <View style={styles.headerLine} />
                </View>

                <GlassCard style={styles.card} variant="default" intensity={15}>
                    {renderToggle('activity', 'Trading Execution', preferences.trading, (v) => updatePreference('trading', v))}
                    <View style={styles.divider} />
                    {renderToggle('trending-up', 'Price Threshold', preferences.priceThreshold, (v) => updatePreference('priceThreshold', v))}
                    <View style={styles.divider} />
                    {renderToggle('target', 'Arena Resolution', preferences.arenaResolution, (v) => updatePreference('arenaResolution', v))}
                </GlassCard>

                <View style={styles.infoBox}>
                    <Feather name="info" size={14} color={Colors.textTertiary} />
                    <Text style={styles.infoText}>
                        System alerts remain active by default
                    </Text>
                </View>
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
    toggleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: Spacing.md,
    },
    toggleLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
    },
    toggleTitle: {
        ...Typography.dataLabel,
        color: Colors.textPrimary,
        fontSize: 12,
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    infoBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
        marginTop: Spacing.xl,
        justifyContent: 'center',
        opacity: 0.6,
    },
    infoText: {
        ...Typography.dataLabel,
        color: Colors.textTertiary,
        fontSize: 10,
    },
});
