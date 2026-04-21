import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StyleSheet } from 'react-native';
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

// Removed manual text icon mapping, using pure SVG Feather icons below

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
                    let iconName: any = 'circle';
                    switch (route.name) {
                        case 'Floor': iconName = 'activity'; break;
                        case 'Arena': iconName = 'crosshair'; break;
                        case 'Feed': iconName = 'radio'; break;
                        case 'Dossier': iconName = 'user'; break;
                        case 'Vault': iconName = 'hexagon'; break;
                    }
                    return (
                        <Feather
                            name={iconName}
                            size={20}
                            color={focused ? Colors.kineticGreen : Colors.slateNeutral}
                        />
                    );
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
