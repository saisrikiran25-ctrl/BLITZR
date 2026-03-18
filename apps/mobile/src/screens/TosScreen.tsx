/**
 * F2: TOS Screen — Onboarding Screen 3
 *
 * Appears before the user can access any part of the app.
 * Cannot be skipped. CTA disabled until checkbox is ticked.
 * On tap: calls POST /api/v1/auth/accept-tos then navigates to main app.
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Colors, Spacing } from '../constants/theme';
import { Strings } from '../constants/strings';
import { authApi } from '../services/api';
import { useAuthStore } from '../store/auth.store';

interface TosScreenProps {
  onAccepted: () => void;
}

export default function TosScreen({ onAccepted }: TosScreenProps) {
  const [checked, setChecked] = useState(false);
  const [loading, setLoading] = useState(false);
  const { setTosAccepted } = useAuthStore();

  const handleEnter = async () => {
    if (!checked) return;
    setLoading(true);
    try {
      await authApi.acceptTos();
      setTosAccepted();
      onAccepted();
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Could not accept TOS. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Title */}
        <Text style={styles.title}>{Strings.tosTitle}</Text>

        {/* Body */}
        <Text style={styles.body}>{Strings.tosBody}</Text>

        {/* Mandatory checkbox */}
        <TouchableOpacity
          style={styles.checkboxRow}
          onPress={() => setChecked((prev) => !prev)}
          activeOpacity={0.8}
        >
          <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
            {checked && <Text style={styles.checkmark}>✓</Text>}
          </View>
          <Text style={styles.checkboxLabel}>{Strings.tosCheckboxLabel}</Text>
        </TouchableOpacity>

        {/* CTA — disabled until checked */}
        <TouchableOpacity
          style={[styles.ctaButton, !checked && styles.ctaDisabled]}
          onPress={handleEnter}
          disabled={!checked || loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color={Colors.obsidian} />
          ) : (
            <Text style={[styles.ctaText, !checked && styles.ctaTextDisabled]}>
              {Strings.tosCta}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.obsidian,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: 0.5,
    marginBottom: Spacing.lg,
  },
  body: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 22,
    marginBottom: Spacing.xl,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.xl,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderWidth: 1.5,
    borderColor: Colors.glassBorder,
    borderRadius: 4,
    marginRight: Spacing.sm,
    marginTop: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: Colors.kineticGreen,
    borderColor: Colors.kineticGreen,
  },
  checkmark: {
    color: Colors.obsidian,
    fontSize: 14,
    fontWeight: '700',
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  ctaButton: {
    backgroundColor: Colors.kineticGreen,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  ctaDisabled: {
    backgroundColor: Colors.surfaceElevated,
  },
  ctaText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.obsidian,
    letterSpacing: 1,
  },
  ctaTextDisabled: {
    color: Colors.textSecondary,
  },
});
