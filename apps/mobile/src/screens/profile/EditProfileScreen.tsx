import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    StatusBar,
    TextInput,
    Alert,
    KeyboardAvoidingView,
    Platform,
    TouchableOpacity,
    ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useAuthStore } from '../../store/useAuthStore';
import { useNotificationsStore } from '../../store/useNotificationsStore';
import { GlassCard } from '../../components/common/GlassCard';
import { Button } from '../../components/common/Button';
import { Colors, Typography, Spacing, Gradients } from '../../theme';
import { api } from '../../services/api';
import { useNavigation } from '@react-navigation/native';

export const EditProfileScreen: React.FC = () => {
    const navigation = useNavigation();
    const { username: currentUsername, updateProfile } = useAuthStore();
    const { fetchNotifications } = useNotificationsStore();

    const [username, setUsername] = useState(currentUsername || '');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        if (!username.trim()) {
            Alert.alert('Error', 'Username cannot be empty.');
            return;
        }

        const updateData: any = {};

        // Only send username if it actually changed
        const trimmedUsername = username.trim();
        if (trimmedUsername !== currentUsername) {
            updateData.username = trimmedUsername;
        }

        if (newPassword) {
            if (!currentPassword) {
                Alert.alert('Authorization Required', 'Current password is required to authorize security changes.');
                return;
            }
            if (newPassword.length < 8) {
                Alert.alert('Security Protocol', 'New password must be at least 8 characters.');
                return;
            }
            if (newPassword !== confirmPassword) {
                Alert.alert('Error', 'The new passwords do not match.');
                return;
            }
            updateData.password = newPassword;
            updateData.currentPassword = currentPassword;
        }

        if (Object.keys(updateData).length === 0) {
            navigation.goBack();
            return;
        }

        setIsSaving(true);
        try {
            // Call backend — the server validates uniqueness, bcrypt, etc.
            const updatedUser = await api.updateProfile(updateData);

            // ── CRITICAL: Update the Zustand store with the CONFIRMED server response ──
            // This ensures the username shown everywhere reflects reality in the DB.
            if (updatedUser && updatedUser.username) {
                updateProfile({ username: updatedUser.username });
            }

            // Refresh notification bell — the backend just created a SYSTEM notification
            await fetchNotifications();

            // Clear sensitive fields
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');

            Alert.alert(
                '✅ Profile Updated',
                updateData.username && updateData.password
                    ? 'Your username and password have been updated.'
                    : updateData.username
                        ? `Your username is now @${updatedUser.username}.`
                        : 'Your password has been updated.',
                [{ text: 'OK', onPress: () => navigation.goBack() }]
            );
        } catch (error: any) {
            console.error('[PROFILE_UPDATE_ERROR]', error);
            // Surface the exact backend error (e.g. "username already taken", "wrong password")
            const msg = error.message || 'The profile update failed. Please try again.';
            Alert.alert('Update Failed', msg);
        } finally {
            setIsSaving(false);
        }
    };

    const hasChanges = username.trim() !== currentUsername || newPassword.length > 0;

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <LinearGradient colors={Gradients.obsidianDeep as any} style={StyleSheet.absoluteFill as any} />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.content}
            >
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Feather name="chevron-left" size={24} color={Colors.textPrimary} />
                    </TouchableOpacity>
                    <Text style={styles.title}>Edit Profile</Text>
                    <View style={{ width: 40 }} />
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Identity Parameters</Text>
                        <View style={styles.headerLine} />
                    </View>

                    <GlassCard style={styles.card} variant="default" intensity={20}>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Username</Text>
                            <View style={styles.inputWrapper}>
                                <Feather name="at-sign" size={16} color={Colors.kineticGreen} style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    value={username}
                                    onChangeText={setUsername}
                                    placeholder="Enter Username"
                                    placeholderTextColor={Colors.textTertiary}
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                    selectionColor={Colors.kineticGreen}
                                />
                            </View>
                            <Text style={styles.hint}>Must be unique within your institution.</Text>
                        </View>
                    </GlassCard>

                    <View style={[styles.sectionHeader, { marginTop: Spacing.sm }]}>
                        <Text style={styles.sectionTitle}>Security Parameters</Text>
                        <View style={styles.headerLine} />
                    </View>

                    <GlassCard style={styles.card} variant="default" intensity={20}>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Current Password</Text>
                            <View style={styles.inputWrapper}>
                                <Feather name="lock" size={16} color={Colors.kineticGreen} style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    value={currentPassword}
                                    onChangeText={setCurrentPassword}
                                    placeholder="Required to authorize change"
                                    placeholderTextColor={Colors.textTertiary}
                                    secureTextEntry
                                    autoCapitalize="none"
                                    selectionColor={Colors.kineticGreen}
                                />
                            </View>
                        </View>

                        <View style={[styles.inputGroup, { marginTop: Spacing.md }]}>
                            <Text style={styles.label}>New Password</Text>
                            <View style={styles.inputWrapper}>
                                <Feather name="shield" size={16} color={Colors.kineticGreen} style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    value={newPassword}
                                    onChangeText={setNewPassword}
                                    placeholder="Enter New Password"
                                    placeholderTextColor={Colors.textTertiary}
                                    secureTextEntry
                                    autoCapitalize="none"
                                    selectionColor={Colors.kineticGreen}
                                />
                            </View>
                        </View>

                        <View style={[styles.inputGroup, { marginTop: Spacing.md }]}>
                            <Text style={styles.label}>Confirm New Password</Text>
                            <View style={styles.inputWrapper}>
                                <Feather name="check-circle" size={16} color={Colors.kineticGreen} style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    value={confirmPassword}
                                    onChangeText={setConfirmPassword}
                                    placeholder="Confirm New Password"
                                    placeholderTextColor={Colors.textTertiary}
                                    secureTextEntry
                                    autoCapitalize="none"
                                    selectionColor={Colors.kineticGreen}
                                />
                            </View>
                        </View>
                    </GlassCard>

                    <Button
                        title={isSaving ? 'Saving...' : 'Save Changes'}
                        onPress={handleSave}
                        loading={isSaving}
                        disabled={isSaving || !hasChanges}
                        variant="primary"
                        style={styles.saveButton}
                    />
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.obsidianBase,
    },
    content: {
        flex: 1,
        padding: Spacing.lg,
    },
    scrollContent: {
        paddingBottom: Spacing.xl,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: Platform.OS === 'ios' ? 40 : 20,
        marginBottom: Spacing.xl,
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
    card: {
        padding: Spacing.lg,
        marginBottom: Spacing.xl,
    },
    inputGroup: {
        gap: Spacing.xs,
    },
    label: {
        ...Typography.dataLabel,
        color: Colors.textSecondary,
        fontSize: 11,
        marginBottom: 2,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 8,
        paddingHorizontal: Spacing.md,
        height: 48,
    },
    inputIcon: {
        marginRight: Spacing.md,
    },
    input: {
        flex: 1,
        color: Colors.textPrimary,
        fontFamily: Typography.body.fontFamily,
        fontSize: 16,
    },
    hint: {
        ...Typography.dataLabel,
        color: Colors.textTertiary,
        fontSize: 9,
        marginTop: 4,
    },
    saveButton: {
        marginTop: Spacing.md,
        marginBottom: Spacing.xl,
    },
});
