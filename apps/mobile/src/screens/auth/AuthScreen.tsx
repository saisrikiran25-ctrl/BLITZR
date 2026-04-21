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
    ActivityIndicator,
} from 'react-native';
// Mocking the import for the environment, in reality: import { GoogleSignin } from '@react-native-google-signin/google-signin';
const GoogleSignin: any = {
    configure: (config: any) => {},
    signIn: async () => ({ idToken: 'google_id_token_mock' }),
    hasPlayServices: async () => true,
};
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
    const [authError, setAuthError] = useState<string | null>(null);
    const [tosChecked, setTosChecked] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const login = useAuthStore((s) => s.login);

    useEffect(() => {
        GoogleSignin.configure({
            webClientId: 'PLACEHOLDER_GOOGLE_WEB_CLIENT_ID', // Replaced by user in .env
            offlineAccess: true,
        });
    }, []);

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

    const handleFormChange = (setter: (v: string) => void, value: string) => {
        setter(value);
        if (authError) setAuthError(null);
    };

    const handleGoogleSignIn = async () => {
        setGoogleLoading(true);
        setAuthError(null);
        try {
            await GoogleSignin.hasPlayServices();
            const userInfo = await GoogleSignin.signIn();
            
            if (!userInfo.idToken) {
                throw new Error('Google Sign-In failed: No ID Token received.');
            }

            const result = await api.googleLogin(userInfo.idToken);

            if (result.isNewUser) {
                // If it's a new user, they might need to set a custom username
                // For now, we'll auto-login them with the generated one, 
                // but we could redirect to a profile-setup screen.
                Alert.alert('Welcome!', `Your basic account is ready. Your ticker name is currently $${result.user.username}. You can change this in Profile later.`);
            }

            login(
                result.user.user_id, 
                result.user.username, 
                result.token, 
                result.user.tos_accepted || false, 
                result.user.is_ipo_active || false, 
                result.user.rumor_disclosure_accepted || false
            );
        } catch (error: any) {
            console.log('Google Sign-In Error:', error);
            setAuthError(error.message || 'Google Authentication failed.');
        } finally {
            setGoogleLoading(false);
        }
    };

    const handleSubmit = async () => {
        if (isRegistering && !tosChecked) {
            Alert.alert('Terms of Service', 'You must understand that BLITZR operates with virtual credits to create an account.');
            return;
        }

        setIsLoading(true);
        setAuthError(null);
        try {
            let result: any;
            if (isRegistering) {
                if (!username) {
                    setAuthError('Username is required.');
                    setIsLoading(false);
                    return;
                }
                if (campuses.length > 0 && !selectedCampus) {
                    setAuthError('Please select your Campus from the dropdown.');
                    setIsLoading(false);
                    return;
                }
                result = await api.register(email, username, password, selectedCampus);
            } else {
                result = await api.login(email, password);
            }

            login(result.user.user_id, result.user.username, result.token, result.user.tos_accepted || false, result.user.is_ipo_active || false, result.user.rumor_disclosure_accepted || false);
        } catch (error: any) {
            const msg = error?.message || 'Unknown error';
            const lowerMsg = String(msg).toLowerCase();

            if (lowerMsg.includes('waitlist')) {
                setAuthError(msg);
            } else if (lowerMsg.includes('already registered') || lowerMsg.includes('conflict')) {
                setAuthError('Account Exists: This email is already registered. Please Login.');
            } else {
                setAuthError(msg);
            }
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

                    {authError && (
                        <View style={styles.errorContainer}>
                            <Text style={styles.errorText}>{authError}</Text>
                        </View>
                    )}

                    <TextInput
                        style={styles.input}
                        value={email}
                        onChangeText={(v) => handleFormChange(setEmail, v)}
                        placeholder="Email (.edu)"
                        placeholderTextColor={Colors.textTertiary}
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />

                    {isRegistering && campuses.length > 0 && (
                        <View style={styles.pickerContainer}>
                            <RNPickerSelect
                                onValueChange={(value) => {
                                    setSelectedCampus(value || undefined);
                                    if (authError) setAuthError(null);
                                }}
                                items={campuses.map(c => ({ label: `${c} Campus`, value: c }))}
                                placeholder={{ label: 'Select Your Campus...', value: '' }}
                                value={selectedCampus || ''}
                                style={pickerSelectStyles}
                                useNativeAndroidPickerStyle={false}
                            />
                        </View>
                    )}

                    {isRegistering && (
                        <TextInput
                            style={styles.input}
                            value={username}
                            onChangeText={(v) => handleFormChange(setUsername, v)}
                            placeholder="Username (your $TICKER name)"
                            placeholderTextColor={Colors.textTertiary}
                            autoCapitalize="none"
                        />
                    )}

                    <TextInput
                        style={styles.input}
                        value={password}
                        onChangeText={(v) => handleFormChange(setPassword, v)}
                        placeholder="Password"
                        placeholderTextColor={Colors.textTertiary}
                        secureTextEntry
                    />

                    {isRegistering && (
                        <Pressable 
                            style={styles.checkboxContainer} 
                            onPress={() => setTosChecked(!tosChecked)}
                        >
                            <View style={[styles.checkbox, tosChecked && styles.checkboxActive]}>
                                {tosChecked && <Text style={styles.checkmark}>✓</Text>}
                            </View>
                            <Text style={styles.checkboxText}>
                                I understand that Creds and Chips are virtual game currency with no real-world monetary value.
                            </Text>
                        </Pressable>
                    )}

                    <Button
                        title={isRegistering ? 'REGISTER' : 'LOGIN'}
                        variant="buy"
                        size="lg"
                        fullWidth
                        loading={isLoading}
                        disabled={isRegistering && !tosChecked}
                        onPress={handleSubmit}
                        style={{ marginTop: Spacing.sm }}
                    />

                    <Button
                        title={isRegistering ? 'Already have an account? LOGIN' : 'New? CREATE ACCOUNT'}
                        variant="secondary"
                        size="sm"
                        fullWidth
                        onPress={() => {
                            setIsRegistering(!isRegistering);
                            setAuthError(null);
                        }}
                        style={{ marginTop: Spacing.md }}
                    />

                    <View style={styles.dividerContainer}>
                        <View style={styles.dividerLine} />
                        <Text style={styles.dividerText}>IDENTITY VERIFICATION</Text>
                        <View style={styles.dividerLine} />
                    </View>

                    <Button
                        title="SIGN IN WITH GOOGLE"
                        variant="secondary"
                        size="lg"
                        fullWidth
                        loading={googleLoading}
                        onPress={handleGoogleSignIn}
                        style={styles.googleButton}
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
    errorContainer: {
        backgroundColor: '#440000',
        padding: Spacing.md,
        borderRadius: BorderRadius.card,
        marginBottom: Spacing.xl,
        borderWidth: 1,
        borderColor: '#ff0000',
    },
    errorText: {
        ...Typography.caption,
        color: '#ffffff',
        textAlign: 'center',
        fontWeight: 'bold',
    },
    dividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: Spacing.xl,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: Colors.glassBorder,
        opacity: 0.5,
    },
    dividerText: {
        ...Typography.caption,
        color: Colors.textTertiary,
        marginHorizontal: Spacing.md,
        letterSpacing: 1.5,
    },
    googleButton: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderColor: Colors.glassBorder,
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
