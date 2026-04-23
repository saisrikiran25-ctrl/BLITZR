import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    StatusBar,
    TouchableOpacity,
    Platform,
    FlatList,
    RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BIcon } from '../common/BIcon';
import { Colors, Typography, Spacing, Gradients } from '../../theme';
import { useNavigation } from '@react-navigation/native';
import { useNotificationsStore } from '../../store/useNotificationsStore';

export const NotificationCenter: React.FC = () => {
    const navigation = useNavigation();
    const { notifications, isLoading, fetchNotifications, markAsRead, markAllAsRead } = useNotificationsStore();

    React.useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    const getIcon = (type: string) => {
        switch (type) {
            case 'TRADING': return 'activity';
            case 'ARENA': return 'target';
            case 'PRICE_ALERT': return 'trending-up';
            default: return 'bell';
        }
    };

    const getIconColor = (type: string) => {
        switch (type) {
            case 'TRADING': return Colors.kineticGreen;
            case 'ARENA': return Colors.activeGold;
            case 'PRICE_ALERT': return Colors.neuralBlue;
            default: return Colors.textSecondary;
        }
    };

    const renderNotification = ({ item }: { item: any }) => (
        <TouchableOpacity 
            onPress={() => !item.is_read && markAsRead(item.notification_id)}
            style={[styles.notificationItem, !item.is_read && styles.unreadItem]}
        >
            <View style={styles.notificationLeft}>
                <View style={[styles.iconBox, { borderColor: getIconColor(item.type) + '33' }]}>
                    <BIcon name={getIcon(item.type) as any} size={16} color={getIconColor(item.type)} />
                </View>
                <View style={styles.notificationText}>
                    <View style={styles.notificationHeader}>
                        <Text style={styles.notificationTitle}>{item.title}</Text>
                        {!item.is_read && <View style={styles.unreadIndicator} />}
                    </View>
                    <Text style={styles.notificationMessage}>{item.message}</Text>
                    <Text style={styles.notificationTime}>
                        {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <LinearGradient colors={Gradients.obsidianDeep as any} style={StyleSheet.absoluteFill as any} />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <BIcon name="chevron-left" size={24} color={Colors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.title}>Notifications</Text>
                <TouchableOpacity onPress={markAllAsRead} style={styles.markAllButton}>
                    <BIcon name="check-square" size={20} color={Colors.textSecondary} />
                </TouchableOpacity>
            </View>

            <FlatList
                data={notifications}
                renderItem={renderNotification}
                keyExtractor={(item) => item.notification_id}
                contentContainerStyle={styles.content}
                refreshControl={
                    <RefreshControl 
                        refreshing={isLoading} 
                        onRefresh={fetchNotifications} 
                        tintColor={Colors.kineticGreen} 
                    />
                }
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <BIcon name="bell-off" size={48} color={Colors.textTertiary} style={{ opacity: 0.2 }} />
                        <Text style={styles.emptyText}>No Transmissions</Text>
                        <Text style={styles.emptySubtext}>Awaiting market activity</Text>
                    </View>
                }
            />
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
    markAllButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    content: {
        padding: Spacing.lg,
    },
    notificationItem: {
        padding: Spacing.md,
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 12,
        marginBottom: Spacing.sm,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    unreadItem: {
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderColor: 'rgba(255,255,255,0.1)',
    },
    notificationLeft: {
        flexDirection: 'row',
        gap: Spacing.md,
    },
    iconBox: {
        width: 36,
        height: 36,
        borderRadius: 18,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.2)',
    },
    notificationText: {
        flex: 1,
    },
    notificationHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 2,
    },
    notificationTitle: {
        ...Typography.bodyMedium,
        color: Colors.textPrimary,
        fontSize: 14,
    },
    unreadIndicator: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: Colors.kineticGreen,
    },
    notificationMessage: {
        ...Typography.caption,
        color: Colors.textSecondary,
        fontSize: 11,
        lineHeight: 16,
    },
    notificationTime: {
        ...Typography.dataLabel,
        color: Colors.textTertiary,
        fontSize: 9,
        marginTop: 6,
    },
    emptyState: {
        paddingVertical: 100,
        alignItems: 'center',
    },
    emptyText: {
        ...Typography.h3,
        color: Colors.textTertiary,
        marginTop: Spacing.lg,
    },
    emptySubtext: {
        ...Typography.body,
        color: 'rgba(255,255,255,0.2)',
        fontSize: 12,
        marginTop: Spacing.sm,
    },
});
