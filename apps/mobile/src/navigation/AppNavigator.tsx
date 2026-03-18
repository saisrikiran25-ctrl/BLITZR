/**
 * BLITZR Main App Entry
 *
 * Onboarding flow:
 *   1. Login/Register
 *   2. TOS Screen (F2) — mandatory, cannot be skipped
 *   3. Main Tab Navigator
 *
 * Main tabs:
 *   - Clout Exchange (F1: Trading Floor renamed)
 *   - Arena (Prop Markets with scope selector F4)
 *   - Rumor Feed (F6, F7)
 *   - Profile
 */
import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar, View, Text, StyleSheet, SafeAreaView } from 'react-native';

import { useAuthStore } from '../store/auth.store';
import { Colors, Spacing } from '../constants/theme';
import { Strings } from '../constants/strings';

import TosScreen from '../screens/TosScreen';
import CloutExchangeScreen from '../screens/CloutExchangeScreen';
import ArenaScreen from '../screens/ArenaScreen';
import RumorFeedScreen from '../screens/RumorFeedScreen';
import LoginScreen from '../screens/LoginScreen';

const Tab = createBottomTabNavigator();

function ProfilePlaceholder() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.obsidian, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: Colors.textSecondary }}>Profile coming soon</Text>
    </SafeAreaView>
  );
}

function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: Colors.glassBorder,
          borderTopWidth: 1,
        },
        tabBarActiveTintColor: Colors.kineticGreen,
        tabBarInactiveTintColor: Colors.textSecondary,
        tabBarLabelStyle: { fontSize: 10, letterSpacing: 0.5 },
      }}
    >
      {/* F1: "Clout Exchange" instead of "Trading Floor" */}
      <Tab.Screen
        name="CloutExchange"
        component={CloutExchangeScreen}
        options={{ title: Strings.tabCloutExchange, tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>📈</Text> }}
      />
      <Tab.Screen
        name="Arena"
        component={ArenaScreen}
        options={{ title: Strings.tabArena, tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>🏟</Text> }}
      />
      <Tab.Screen
        name="RumorFeed"
        component={RumorFeedScreen}
        options={{ title: Strings.tabRumorFeed, tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>💬</Text> }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfilePlaceholder}
        options={{ title: Strings.tabProfile, tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>👤</Text> }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { token, tosAccepted } = useAuthStore();

  if (!token) {
    return (
      <NavigationContainer>
        <LoginScreen />
      </NavigationContainer>
    );
  }

  // F2: TOS gate — shown after login, before any app content
  if (!tosAccepted) {
    return (
      <NavigationContainer>
        <TosScreen onAccepted={() => {}} />
      </NavigationContainer>
    );
  }

  return (
    <NavigationContainer>
      <MainTabNavigator />
    </NavigationContainer>
  );
}
