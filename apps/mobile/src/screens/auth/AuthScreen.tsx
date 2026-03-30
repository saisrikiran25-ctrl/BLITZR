import React, { useState, useEffect } from 'react';
import RNPickerSelect from 'react-native-picker-select';
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    Alert,
    KeyboardAvoidingView,
    Platform,
    Pressable,
} from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming,
} from 'react-native-reanimated';
import { GlassCard } from '../../components/common/GlassCard';
import { Button } from '../../components/common/Button';
import { Colors, Typography, Spacing, BorderRadius } from '../../theme';
import { useAuthStore } from '../../store/useAuthStore';
import { api } from '../../services/api';

/**
 * AuthScreen — Login / Register flow
 * 
 * Campus-specific: validates .edu email domain.
 * Dark industrial design matching the trading terminal aesthetic.
 */
export const AuthScreen: React.FC = () => {
    const [isRegistering, setIsRegistering] = useState(false);
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [campuses, setCampuses] = useState<string[]>([]);
    const [selectedCampus, setSelectedCampus] = useState<string | undefined>(undefined);
    const [tosAccepted, setTosAccepted] = useState(false);
    const login = useAuthStore((s) => s.login);

    // Fetch strict campuses on email domain change (debounced)
    useEffect(() => {
        if (!isRegistering) {
            setCampuses([]);
            setSelectedCampus(undefined);
            return;
        }

        const match = email.match(/@([^@\s]+)$/);
        if (match && match[1]) {
            const domain = match[1];
            const timer = setTimeout(async () => {
                try {
                    const data = await api.getCampuses(domain);
                    setCampuses(data.campuses || []);
                    if (!data.campuses || data.campuses.length === 0) {
                        setSelectedCampus(undefined);
                    }
                } catch (err) {
                    console.log('Failed to fetch campuses', err);
                }
            }, 500);
            return () => clearTimeout(timer);
        } else {
            setCampuses([]);
            setSelectedCampus(undefined);
        }
    }, [email, isRegistering]);

    // Interactive Hover Physics
    const hoverProgress = useSharedValue(0);

    const animatedLogoStyle = useAnimatedStyle(() => {
        return {
            transform: [
                { scale: withSpring(1 + hoverProgress.value * 0.05, { damping: 10, stiffness: 200 }) }
            ],
            textShadowRadius: withTiming(hoverProgress.value * 25, { duration: 150 }),
            textShadowColor: Colors.kineticGreen,
            textShadowOffset: { width: 0, height: 0 },
        };
    });

    const handleSubmit = async () => {
        if (!email || !password) {
            Alert.alert('Missing Fields', 'Email and password are required.');
            return;
        }

        setIsLoading(true);
        try {
            let result: any;
            if (isRegistering) {
                if (!username) {
                    Alert.alert('Missing Fields', 'Username is required.');
                    setIsLoading(false);
                    return;
                }
                if (campuses.length > 0 && !selectedCampus) {
                    Alert.alert('Missing Field', 'Please select your Campus from the dropdown.');
                    setIsLoading(false);
                    return;
                }
                result = await api.register(email, username, password, selectedCampus);
            } else {
                result = await api.login(email, password);
            }

            // Backend now includes tos_accepted boolean
            login(result.user.user_id, result.user.username, result.token, result.user.tos_accepted || false);
        } catch (error: any) {
            Alert.alert('Authentication Failed', error.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <View style={styles.content}>
                <View style={styles.logoSection}>
                    <Pressable
                        onHoverIn={() => { hoverProgress.value = 1; }}
                        onHoverOut={() => { hoverProgress.value = 0; }}
                        style={styles.logoPressable}
                    >
                        <Animated.Text style={[styles.logoText, animatedLogoStyle]}>
                            BLITZR
                        </Animated.Text>
                    </Pressable>
                    <Text style={styles.tagline}>CAMPUS SOCIAL-EQUITY EXCHANGE</Text>
                    <View style={styles.logoLine} />
                </View>

                {/* Form */}
                <GlassCard style={styles.formCard}>
                    <Text style={styles.formTitle}>
                        {isRegistering ? 'CREATE ACCOUNT' : 'LOGIN'}
                    </Text>

                    <TextInput
                        style={styles.input}
                        value={email}
                        onChangeText={setEmail}
                        placeholder="Email (.edu)"
                        placeholderTextColor={Colors.textTertiary}
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />

                    {isRegistering && campuses.length > 0 && (
                        <View style={styles.pickerContainer}>
                            <RNPickerSelect
                                onValueChange={(value) => setSelectedCampus(value)}
                                items={campuses.map(c => ({ label: `${c} Campus`, value: c }))}
                                placeholder={{ label: 'Select Your Campus...', value: null }}
                                value={selectedCampus}
                                style={pickerSelectStyles}
                                useNativeAndroidPickerStyle={false}
                            />
                        </View>
                    )}

                    {isRegistering && (
                        <TextInput
                            style={styles.input}
                            value={username}
                            onChangeText={setUsername}
                            placeholder="Username (your $TICKER name)"
                            placeholderTextColor={Colors.textTertiary}
                            autoCapitalize="none"
                        />
                    )}

                    <TextInput
                        style={styles.input}
                        value={password}
                        onChangeText={setPassword}
                        placeholder="Password"
                        placeholderTextColor={Colors.textTertiary}
                        secureTextEntry
                    />



                    <Button
                        title={isRegistering ? 'REGISTER' : 'LOGIN'}
                        variant="buy"
                        size="lg"
                        fullWidth
                        loading={isLoading}
                        onPress={handleSubmit}
                        style={{ marginTop: Spacing.lg }}
                    />

                    <Button
                        title={isRegistering ? 'Already have an account? LOGIN' : 'New? CREATE ACCOUNT'}
                        variant="secondary"
                        size="sm"
                        fullWidth
                        onPress={() => setIsRegistering(!isRegistering)}
                        style={{ marginTop: Spacing.md }}
                    />
                </GlassCard>

                {/* Footer */}
                <Text style={styles.footer}>
                    Information is the ultimate campus currency.
                </Text>
            </View>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.obsidianBase,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        padding: Spacing.xxl,
    },
    // Logo
    logoSection: {
        alignItems: 'center',
        marginBottom: Spacing.xxxl,
    },
    logoPressable: {
        paddingHorizontal: Spacing.md,
    },
    logoText: {
        fontFamily: 'monospace',
        fontSize: 48,
        fontWeight: '900',
        color: Colors.kineticGreen,
        letterSpacing: 8,
    },
    tagline: {
        ...Typography.dataLabel,
        color: Colors.textTertiary,
        letterSpacing: 3,
        marginTop: Spacing.sm,
    },
    logoLine: {
        width: 60,
        height: 2,
        backgroundColor: Colors.kineticGreen,
        marginTop: Spacing.md,
        opacity: 0.6,
    },
    // Form
    formCard: {
        padding: Spacing.xxl,
    },
    formTitle: {
        ...Typography.h3,
        color: Colors.textPrimary,
        letterSpacing: 2,
        textAlign: 'center',
        marginBottom: Spacing.xl,
    },
    input: {
        ...Typography.body,
        color: Colors.textPrimary,
        backgroundColor: Colors.obsidianBase,
        borderWidth: 1,
        borderColor: Colors.glassBorder,
        borderRadius: BorderRadius.card,
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
        marginBottom: Spacing.md,
    },
    checkboxContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Spacing.lg,
        paddingHorizontal: Spacing.xs,
    },
    checkbox: {
        width: 20,
        height: 20,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: Colors.glassBorder,
        backgroundColor: Colors.obsidianBase,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: Spacing.md,
    },
    checkboxActive: {
        backgroundColor: Colors.kineticGreen,
        borderColor: Colors.kineticGreen,
    },
    checkmark: {
        color: Colors.obsidianBase,
        fontSize: 12,
        fontWeight: 'bold',
    },
    checkboxText: {
        ...Typography.caption,
        color: Colors.textSecondary,
        flex: 1,
        lineHeight: 16,
    },
    // Footer
    footer: {
        ...Typography.caption,
        color: Colors.textTertiary,
        textAlign: 'center',
        marginTop: Spacing.xxl,
        fontStyle: 'italic',
    },
    pickerContainer: {
        backgroundColor: Colors.obsidianBase,
        borderWidth: 1,
        borderColor: Colors.glassBorder,
        borderRadius: BorderRadius.card,
        marginBottom: Spacing.md,
        // Overflow hidden if we wanted it, but let's keep it clean
    },
});

const pickerSelectStyles = StyleSheet.create({
    inputIOS: {
        ...Typography.body,
        color: Colors.kineticGreen,
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
    },
    inputAndroid: {
        ...Typography.body,
        color: Colors.kineticGreen,
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
    },
    placeholder: {
        color: Colors.textTertiary,
    },
});
