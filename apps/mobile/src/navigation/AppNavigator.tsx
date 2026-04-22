import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StyleSheet, View, Image, Platform, Text } from 'react-native';

import { Feather } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '../theme';
import { Fonts } from '../theme/typography';

import { useAuthStore } from '../store/useAuthStore';

// Screens
import { TradingFloorScreen } from '../screens/trading/TradingFloorScreen';
import { TickerDetailScreen } from '../screens/trading/TickerDetailScreen';
import { ArenaScreen } from '../screens/arena/ArenaScreen';
import { RumorFeedScreen } from '../screens/feed/RumorFeedScreen';
import { DossierScreen } from '../screens/profile/DossierScreen';
import { VaultScreen } from '../screens/vault/VaultScreen';
import { AuthScreen } from '../screens/auth/AuthScreen';
import { TosScreen } from '../screens/auth/TosScreen';
import { EditProfileScreen } from '../screens/profile/EditProfileScreen';
import { PrivacyScreen } from '../screens/profile/PrivacyScreen';
import { PrivacyDetailScreen } from '../screens/profile/PrivacyDetailScreen';
import { NotificationsScreen } from '../screens/profile/NotificationsScreen';
import { NotificationCenter } from '../components/notifications/NotificationCenter';

/**
 * BLITZR Tab Navigation — "The Control Panel"
 * 
 * 5 tabs per Design Doc §2.1:
 * 1. Floor (Trading Floor — IPO market)
 * 2. Arena (Prop Market — YES/NO bets)
 * 3. Feed (Rumor Feed — anonymous posts)
 * 4. Dossier (Profile — portfolio & stats)
 * 5. Vault (Wallet — Cred/Chip exchange)
 * 
 * Tab bar: Titanium Gray background, 1.5px line-weight icons,
 * Kinetic Green active state, Slate neutral inactive.
 */

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function TabIcon({ name, focused }: { name: string; focused: boolean }) {
    const color = focused ? Colors.kineticGreen : Colors.slateNeutral;

    if (Platform.OS === 'web') {
        // High-contrast Base64 SVG Icons for absolute visibility on Web (Terminal aesthetic)
        const svgs: Record<string, string> = {
            activity: 'PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IkNPTE9SIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHBvbHlsaW5lIHBvaW50cz0iMjIgMTIgMTggMTIgMTUgMjEgOSAzIDYgMTIgMiAxMiI+PC9wb2x5bGluZT48L3N2Zz4=',
            crosshair: 'PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IkNPTE9SIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMTAiPjwvY2lyY2xlPjxsaW5lIHgxPSIyMiIgeTE9IjEyIiB4Mj0iMTgiIHkyPSIxMiI+PC9saW5lPjxsaW5lIHgxPSI2IiB5MT0iMTIiIHgyPSIyIiB5Mj0iMTIiPjwvbGluZT48bGluZSB4MT0iMTIiIHkxPSI2IiB4Mj0iMTIiIHkyPSIyIj48L2xpbmU+PGxpbmUgeDE9IjEyIiB5MT0iMjIiIHgyPSIxMiIgeTI9IjE4Ij48L2xpbmU+PC9zdmc+',
            radio: 'PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IkNPTE9SIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMiI+PC9jaXJjbGU+PHBhdGggZD0iTTE2LjI0IDcuNzZhNiA2IDAgMSAwIDAgOC40OCI+PC9wYXRoPjxwYXRoIGQ9Ik0xOS4wNyA0LjkzYTEwIDEwIDAgMSAwIDAgMTQuMTQiPjwvcGF0aD48L3N2Zz4=',
            user: 'PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IkNPTE9SIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHBhdGggZD0iTTIwIDIxdi0yYTQgNCAwIDAgMC00LTRIOGE0IDQgMCAwIDAtNCA0djIiPjwvcGF0aD48Y2lyY2xlIGN4PSIxMiIgY3k9IjciIHI9IjQiPjwvY2lyY2xlPjwvc3ZnPg==',
            hexagon: 'PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IkNPTE9SIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHBhdGggZD0iTTIxIDE2VjhhMiAyIDAgMCAwLTEtMS43M2wtNy00YTIgMiAwIDAgMC0yIDBsLTcgNEEyIDIgMCAwIDAgMyA4djhhMiAyIDAgMCAwIDEgMS43M2w3IDRhMiAyIDAgMCAwIDIgMGw3LTRBMiAyIDAgMCAwIDIxIDE2eiI+PC9wYXRoPjwvc3ZnPg==',
        };

        const base64 = svgs[name].replace('PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IkNPTE9SIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+', 
            atob('PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IkNPTE9SIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+'));
        // Wait, replacing color in base64 is not feasible. I'll use URI encoded SVG instead.
        
        const rawSvg = `
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                ${name === 'activity' ? '<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>' : ''}
                ${name === 'crosshair' ? '<circle cx="12" cy="12" r="10"></circle><line x1="22" y1="12" x2="18" y2="12"></line><line x1="6" y1="12" x2="2" y2="12"></line><line x1="12" y1="6" x2="12" y2="2"></line><line x1="12" y1="22" x2="12" y2="18"></line>' : ''}
                ${name === 'radio' ? '<circle cx="12" cy="12" r="2"></circle><path d="M16.24 7.76a6 6 0 1 0 0 8.48"></path><path d="M19.07 4.93a10 10 0 1 0 0 14.14"></path>' : ''}
                ${name === 'user' ? '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle>' : ''}
                ${name === 'hexagon' ? '<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>' : ''}
            </svg>
        `.trim();

        const encoded = `data:image/svg+xml;base64,${btoa(rawSvg)}`;
        return (
            <Image
                source={{ uri: encoded }}
                style={{ width: 22, height: 22, tintColor: color }}
                resizeMode="contain"
            />
        );
    }

    return (
        <Feather
            name={name as any}
            size={20}
            color={color}
        />
    );
}

function TabNavigator() {
    return (
        <Tab.Navigator
            id="main-tabs"
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarStyle: styles.tabBar,
                tabBarActiveTintColor: Colors.kineticGreen,
                tabBarInactiveTintColor: Colors.slateNeutral,
                tabBarLabelStyle: styles.tabLabel,
                tabBarIcon: ({ focused }) => {
                    let iconName = 'circle';
                    switch (route.name) {
                        case 'Floor': iconName = 'activity'; break;
                        case 'Arena': iconName = 'crosshair'; break;
                        case 'Feed': iconName = 'radio'; break;
                        case 'Dossier': iconName = 'user'; break;
                        case 'Vault': iconName = 'hexagon'; break;
                    }
                    return <TabIcon name={iconName} focused={focused} />;
                },

            })}
        >
            <Tab.Screen name="Floor" component={TradingFloorScreen} />
            <Tab.Screen name="Arena" component={ArenaScreen} />
            <Tab.Screen name="Feed" component={RumorFeedScreen} />
            <Tab.Screen name="Dossier" component={DossierScreen} />
            <Tab.Screen name="Vault" component={VaultScreen} />
        </Tab.Navigator>
    );
}

import { useInitialData } from '../hooks/useInitialData';

export function AppNavigator() {
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
    const tosAccepted = useAuthStore((s) => s.tosAccepted);
    useInitialData();

    return (
        <Stack.Navigator
            id="root-stack"
            screenOptions={{
                headerShown: false,
                animation: 'slide_from_right',
                contentStyle: { backgroundColor: Colors.obsidianBase },
            }}
        >
            {isAuthenticated ? (
                tosAccepted ? (
                    <>
                        <Stack.Screen name="Main" component={TabNavigator} />
                        <Stack.Screen name="TickerDetail" component={TickerDetailScreen} />
                        <Stack.Screen name="EditProfile" component={EditProfileScreen} />
                        <Stack.Screen name="Privacy" component={PrivacyScreen} />
                        <Stack.Screen name="PrivacyDetail" component={PrivacyDetailScreen} />
                        <Stack.Screen name="Notifications" component={NotificationsScreen} />
                        <Stack.Screen name="NotificationCenter" component={NotificationCenter} />
                    </>
                ) : (
                    <Stack.Screen name="Tos" component={TosScreen} />
                )
            ) : (
                <Stack.Screen name="Auth" component={AuthScreen} />
            )}
        </Stack.Navigator>
    );
}

const styles = StyleSheet.create({
    tabBar: {
        backgroundColor: Colors.titaniumGray,
        borderTopWidth: 0.5,
        borderTopColor: Colors.glassBorder,
        height: 60,
        paddingBottom: Spacing.xs,
        paddingTop: Spacing.xs,
    },
    tabLabel: {
        ...Typography.dataLabel,
        fontFamily: Fonts.bold,
        fontSize: 10,
        fontWeight: 'bold',
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    tabIcon: {
        fontSize: 20,
        fontWeight: '300',
    },
    tabIconActive: {
        color: Colors.kineticGreen,
    },
    tabIconInactive: {
        color: Colors.slateNeutral,
    },
});
