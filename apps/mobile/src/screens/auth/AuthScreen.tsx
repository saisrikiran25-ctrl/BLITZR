import React, { useState, useEffect } from 'react';

import {
    View,
    Text,
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
    const [authError, setAuthError] = useState<string | null>(null);
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



    const handleGoogleSignIn = async () => {
        if (googleLoading) {
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
                        AUTHENTICATION
                    </Text>

                    {authError && (
                        <View style={styles.errorContainer}>
                            <Text style={styles.errorText}>{authError}</Text>
                        </View>
                    )}

                    <Button
                        title="SIGN IN WITH GOOGLE"
                        variant="secondary"
                        size="lg"
                        fullWidth
                        loading={googleLoading}
                        disabled={googleLoading || !!googleConfigError}
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
    // Footer
    footer: {
        ...Typography.caption,
        color: Colors.textTertiary,
        textAlign: 'center',
        marginTop: Spacing.xxl,
        fontStyle: 'italic',
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
    googleButton: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderColor: Colors.glassBorder,
    },
});
