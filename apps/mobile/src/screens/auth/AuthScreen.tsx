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
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import * as AuthSession from 'expo-auth-session';
import * as GoogleAuth from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';

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

WebBrowser.maybeCompleteAuthSession();
const GOOGLE_REDIRECT_SCHEME = 'blitzrmobile';
const GOOGLE_REDIRECT_PATH = 'auth';
const GOOGLE_WEB_ORIGIN_FALLBACK = 'http://localhost:8081';
type GooglePromptResultLike = {
    authentication?: {
        idToken?: string | null;
    };
    params?: {
        id_token?: string;
        error?: string;
    };
    error?: {
        message?: string;
    };
    type?: string;
};

const extractIdTokenFromWebResult = (
    promptResult: GooglePromptResultLike | null | undefined,
    responseResult: GooglePromptResultLike | null | undefined,
): string | null => {
    const idToken =
        promptResult?.authentication?.idToken ||
        promptResult?.params?.id_token ||
        responseResult?.authentication?.idToken ||
        responseResult?.params?.id_token ||
        null;

    return typeof idToken === 'string' && idToken.length > 0 ? idToken : null;
};

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
    const isWeb = Platform.OS === 'web';
    const googleWebClientId = (process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '').trim();
    const googleAndroidClientId = (process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || '').trim();
    const googleIosClientId = (process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || '').trim();
    const redirectUri = Platform.OS === 'web'
        ? (typeof window !== 'undefined'
            ? `${window.location.origin}/auth`
            : 'https://monkfish-app-r6nxh.ondigitalocean.app/auth')
        : AuthSession.makeRedirectUri({ scheme: GOOGLE_REDIRECT_SCHEME, path: GOOGLE_REDIRECT_PATH });

    const [webRequest, webResponse, promptWebGoogleAuth] = GoogleAuth.useIdTokenAuthRequest({
        webClientId: googleWebClientId || undefined,
        androidClientId: googleAndroidClientId || undefined,
        iosClientId: googleIosClientId || undefined,
        redirectUri,
        selectAccount: true,
    });

    const googleConfigError = (() => {
        const missingEnvVars: string[] = [];

        if (!googleWebClientId) {
            missingEnvVars.push('EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID');
        }

        if (Platform.OS === 'android' && !googleAndroidClientId) {
            missingEnvVars.push('EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID');
        }

        if (Platform.OS === 'ios' && !googleIosClientId) {
            missingEnvVars.push('EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID');
        }

        if (missingEnvVars.length === 0) {
            return null;
        }

        const baseMessage = `Google Sign-In is not configured for ${Platform.OS}. Missing: ${missingEnvVars.join(', ')}.`;
        if (!isWeb) {
            return `${baseMessage} Set these in your mobile env configuration and restart the app.`;
        }

        const webOrigin = (globalThis as any)?.location?.origin || GOOGLE_WEB_ORIGIN_FALLBACK;
        return `${baseMessage} Add ${webOrigin} as an Authorized JavaScript Origin and ${redirectUri} as an Authorized Redirect URI in Google Cloud Console, then restart the app.`;
    })();

    useEffect(() => {
        if (googleConfigError) {
            setAuthError(googleConfigError);
        }
    }, [googleConfigError]);

    useEffect(() => {
        if (isWeb || googleConfigError) {
            return;
        }

        // The Web Client ID is required for identity verification on the backend.
        // It should be provided by the environment configuration.
        GoogleSignin.configure({
            webClientId: googleWebClientId,
            androidClientId: googleAndroidClientId || undefined,
            iosClientId: googleIosClientId || undefined,
            offlineAccess: true,
            forceCodeForRefreshToken: true,
        });
    }, [googleAndroidClientId, googleConfigError, googleIosClientId, googleWebClientId, isWeb]);

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
        if (googleLoading || isLoading) {
            return;
        }

        if (googleConfigError) {
            setAuthError(googleConfigError);
            return;
        }

        setGoogleLoading(true);
        setAuthError(null);
        try {
            let idToken: string | null = null;

            if (isWeb) {
                if (!webRequest) {
                    throw new Error('Google Sign-In is still initializing. Please try again.');
                }

                const promptResult = await promptWebGoogleAuth();
                if (promptResult.type !== 'success') {
                    const typedPromptResult = promptResult as GooglePromptResultLike;
                    const providerError = String(typedPromptResult?.params?.error || typedPromptResult?.error?.message || '');

                    if (promptResult.type === 'dismiss' || promptResult.type === 'cancel') {
                        throw new Error('Google Sign-In was cancelled.');
                    }

                    if (/popup|block/i.test(providerError)) {
                        throw new Error('Google Sign-In popup was blocked. Enable popups for this site and try again.');
                    }

                    if (promptResult.type === 'error') {
                        throw new Error(providerError || 'Google Sign-In failed due to an OAuth error.');
                    }

                    throw new Error('Google Sign-In did not complete. Please try again.');
                }

                idToken = extractIdTokenFromWebResult(
                    promptResult as GooglePromptResultLike,
                    webResponse as GooglePromptResultLike,
                );
            } else {
                await GoogleSignin.hasPlayServices();
                const userInfo = await GoogleSignin.signIn();
                idToken = userInfo.idToken || null;
            }

            if (!idToken) {
                throw new Error('Google Sign-In failed: No ID Token received.');
            }

            const result = await api.googleLogin(idToken);

            if (result.isNewUser) {
                // If it's a new user, they might need to set a custom username
                // For now, we'll auto-login them with the generated one, 
                // but we could redirect to a profile-setup screen.
                Alert.alert('Welcome!', `Your basic account is ready. Your ticker name is currently $${result.user.username}. You can change this in Profile later.`);
            }

            login(
                result.user.user_id, 
                result.user.username, 
                result.user.email,
                result.token, 
                result.user.tos_accepted || false, 
                result.user.is_ipo_active || false, 
                result.user.rumor_disclosure_accepted || false
            );
        } catch (error: any) {
            console.log('Google Sign-In Error:', error);
            const rawMessage = String(error?.message || 'Google Authentication failed.');
            const normalized = rawMessage.toLowerCase();

            if (normalized.includes('cancel')) {
                setAuthError('Google Sign-In was cancelled.');
            } else if (normalized.includes('popup') || normalized.includes('block')) {
                setAuthError('Google Sign-In popup was blocked. Enable popups for this site and try again.');
            } else if (normalized.includes('network') || normalized.includes('unable to connect')) {
                setAuthError('Network error during Google authentication. Check your connection and try again.');
            } else if (normalized.includes('token')) {
                setAuthError('Google authentication failed because no valid token was returned.');
            } else {
                setAuthError(rawMessage);
            }
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

            login(result.user.user_id, result.user.username, result.user.email, result.token, result.user.tos_accepted || false, result.user.is_ipo_active || false, result.user.rumor_disclosure_accepted || false);
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
                            setGoogleLoading(false);
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
                        disabled={googleLoading || isLoading || !!googleConfigError}
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
