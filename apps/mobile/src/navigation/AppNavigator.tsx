import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StyleSheet, View, Image, Platform } from 'react-native';
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

// SVG Icons for Web Fallback (prevents font-loading failures in prod)
const WebTabIcons: Record<string, string> = {
    activity: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="COLOR" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>`,
    crosshair: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="COLOR" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="22" y1="12" x2="18" y2="12"></line><line x1="6" y1="12" x2="2" y2="12"></line><line x1="12" y1="6" x2="12" y2="2"></line><line x1="12" y1="22" x2="12" y2="18"></line></svg>`,
    radio: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="COLOR" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="2"></circle><path d="M16.24 7.76a6 6 0 1 0 0 8.48"></path><path d="M19.07 4.93a10 10 0 1 0 0 14.14"></path></svg>`,
    user: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="COLOR" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>`,
    hexagon: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="COLOR" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path></svg>`,
};

function TabIcon({ name, focused }: { name: string; focused: boolean }) {
    const color = focused ? Colors.kineticGreen : Colors.slateNeutral;

    if (Platform.OS === 'web') {
        const svgData = WebTabIcons[name]?.replace('COLOR', encodeURIComponent(color));
        return (
            <Image
                source={{ uri: svgData }}
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
