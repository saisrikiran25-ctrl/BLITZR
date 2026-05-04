import React, { useState, useEffect } from 'react';

import {
    View,
    Text,
    StyleSheet,
    Alert,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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
import { Colors, Typography, Spacing, BorderRadius, Gradients } from '../../theme';
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
    const [campusPending, setCampusPending] = useState<{
        tempToken: string;
        campuses: Array<{ id: string; name: string; short_code: string }>;
    } | null>(null);
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
            opacity: withTiming(0.8 + hoverProgress.value * 0.2, { duration: 150 }),
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

            if (result.status === 'REQUIRES_CAMPUS_SELECTION') {
                // Multiple campuses share the same email domain — let the user pick.
                setCampusPending({ tempToken: result.tempToken, campuses: result.campuses });
                return;
            }

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

    const handleCampusSelect = async (institutionId: string) => {
        if (!campusPending) return;
        setGoogleLoading(true);
        setAuthError(null);
        try {
            const result = await api.selectCampus(campusPending.tempToken, institutionId);
            if (result.isNewUser) {
                Alert.alert('Welcome!', `Your account is ready. Your ticker name is currently $${result.user.username}. You can change this in Profile later.`);
            }
            // Clear pending campus state only after a successful response.
            setCampusPending(null);
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
            // Keep campusPending so the user can choose a different campus or retry.
            setAuthError(String(error?.message || 'Campus selection failed. Please try again.'));
        } finally {
            setGoogleLoading(false);
        }
    };



    return (
        <LinearGradient
            colors={Gradients.obsidianDeep}
            style={styles.container}
        >
            <KeyboardAvoidingView
                style={{ flex: 1 }}
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

                <View style={styles.terminalContainer}>
                    <GlassCard style={styles.formCard} intensity={40}>
                        {/* Terminal Header Decor */}
                        <View style={styles.terminalHeader}>
                            <View style={styles.terminalDots}>
                                <View style={[styles.dot, { backgroundColor: '#FF5F56' }]} />
                                <View style={[styles.dot, { backgroundColor: '#FFBD2E' }]} />
                                <View style={[styles.dot, { backgroundColor: '#27C93F' }]} />
                            </View>
                            <Text style={styles.terminalHeaderText}>AUTH_MODULE.SH</Text>
                        </View>

                        <View style={styles.authBody}>
                            <View style={styles.authHeader}>
                                <View style={styles.authPulse} />
                                <Text style={styles.formTitle}>
                                    {campusPending ? 'SELECT YOUR CAMPUS' : 'ENCRYPTED ACCESS'}
                                </Text>
                            </View>

                            {authError && (
                                <View style={styles.errorContainer}>
                                    <Text style={styles.errorText}>{authError}</Text>
                                </View>
                            )}

                            {campusPending ? (
                                <ScrollView style={styles.campusList} showsVerticalScrollIndicator={false}>
                                    {campusPending.campuses.map((campus) => (
                                        <TouchableOpacity
                                            key={campus.id}
                                            style={styles.campusItem}
                                            onPress={() => handleCampusSelect(campus.id)}
                                            disabled={googleLoading}
                                        >
                                            <Text style={styles.campusName}>{campus.name}</Text>
                                            <Text style={styles.campusCode}>{campus.short_code}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            ) : (
                                <Button
                                    title="CONTINUE WITH GOOGLE"
                                    variant="buy"
                                    size="xl"
                                    fullWidth
                                    loading={googleLoading}
                                    disabled={googleLoading || !!googleConfigError}
                                    onPress={handleGoogleSignIn}
                                    style={styles.googleButton}
                                />
                            )}

                            <Text style={styles.securityNote}>
                                Institutional Verification Required
                            </Text>
                        </View>
                    </GlassCard>

                    {/* Footer / Credits */}
                    <View style={styles.footerContainer}>
                        <Text style={styles.footerText}>
                            Information is the ultimate campus currency.
                        </Text>
                        
                        <View style={styles.promoBadge}>
                            <Text style={styles.promoPrefix}>CORE DEV</Text>
                            <Text style={styles.promoName}>SAI KIRAN</Text>
                        </View>
                    </View>
                </View>
                </View>
            </KeyboardAvoidingView>
        </LinearGradient>
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
        alignItems: 'center',
        padding: Spacing.xl,
    },
    terminalContainer: {
        width: '100%',
        maxWidth: 420,
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
        fontSize: 56,
        fontWeight: '900',
        color: Colors.kineticGreen,
        letterSpacing: 12,
    },
    tagline: {
        ...Typography.dataLabel,
        color: Colors.textSecondary,
        fontSize: 10,
        letterSpacing: 4,
        marginTop: Spacing.md,
        opacity: 0.8,
    },
    logoLine: {
        width: 100,
        height: 1,
        backgroundColor: Colors.kineticGreen,
        marginTop: Spacing.lg,
        opacity: 0.3,
    },
    // Terminal Decor
    terminalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: Colors.glassBorder,
    },
    terminalDots: {
        flexDirection: 'row',
        gap: 6,
    },
    dot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        opacity: 0.7,
    },
    terminalHeaderText: {
        ...Typography.caption,
        color: Colors.textTertiary,
        fontSize: 10,
        fontFamily: 'monospace',
        marginLeft: Spacing.lg,
        letterSpacing: 1,
    },
    authBody: {
        padding: Spacing.xxl,
    },
    // Form Header
    authHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.xxl,
    },
    authPulse: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: Colors.kineticGreen,
        marginRight: Spacing.md,
        shadowColor: Colors.kineticGreen,
        shadowRadius: 8,
        shadowOpacity: 1,
    },
    // Form
    formCard: {
        width: '100%',
        padding: 0, // Let body handle padding
        backgroundColor: 'rgba(5, 5, 12, 0.95)',
    },
    formTitle: {
        ...Typography.bodyMedium,
        color: Colors.textPrimary,
        fontWeight: 'bold',
        letterSpacing: 3,
        textAlign: 'center',
    },
    securityNote: {
        ...Typography.caption,
        color: Colors.textTertiary,
        textAlign: 'center',
        marginTop: Spacing.xl,
        fontSize: 10,
        letterSpacing: 1,
    },
    // Footer
    footerContainer: {
        marginTop: Spacing.xxxl,
        alignItems: 'center',
        width: '100%',
    },
    footerText: {
        ...Typography.caption,
        color: Colors.textTertiary,
        textAlign: 'center',
        fontStyle: 'italic',
        opacity: 0.7,
    },
    promoBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 250, 154, 0.05)',
        borderWidth: 1,
        borderColor: 'rgba(0, 250, 154, 0.2)',
        borderRadius: 100,
        paddingLeft: Spacing.md,
        paddingRight: Spacing.lg,
        paddingVertical: Spacing.xs,
        marginTop: Spacing.xl,
    },
    promoPrefix: {
        fontSize: 8,
        fontWeight: '900',
        color: Colors.obsidianBase,
        backgroundColor: Colors.kineticGreen,
        paddingHorizontal: 4,
        paddingVertical: 2,
        borderRadius: 2,
        marginRight: Spacing.sm,
    },
    promoName: {
        fontSize: 10,
        fontWeight: 'bold',
        color: Colors.kineticGreen,
        letterSpacing: 1,
    },
    errorContainer: {
        backgroundColor: 'rgba(255, 51, 102, 0.1)',
        padding: Spacing.md,
        borderRadius: BorderRadius.card,
        marginBottom: Spacing.xl,
        borderWidth: 1,
        borderColor: 'rgba(255, 51, 102, 0.4)',
    },
    errorText: {
        ...Typography.caption,
        color: Colors.thermalRed,
        textAlign: 'center',
        fontWeight: 'bold',
    },
    googleButton: {
        height: 56,
        borderRadius: 12,
        shadowColor: Colors.kineticGreen,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
    },
    campusList: {
        maxHeight: 220,
        marginBottom: Spacing.xl,
    },
    campusItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.lg,
        marginBottom: Spacing.sm,
        borderRadius: BorderRadius.card,
        borderWidth: 1,
        borderColor: 'rgba(0, 250, 154, 0.25)',
        backgroundColor: 'rgba(0, 250, 154, 0.05)',
    },
    campusName: {
        ...Typography.bodyMedium,
        color: Colors.textPrimary,
        flex: 1,
    },
    campusCode: {
        ...Typography.dataLabel,
        color: Colors.kineticGreen,
        fontSize: 11,
        letterSpacing: 1,
        marginLeft: Spacing.sm,
    },
});
