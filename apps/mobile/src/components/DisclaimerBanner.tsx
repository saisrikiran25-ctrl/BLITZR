/**
 * F3: Disclaimer Banner
 *
 * Persistent, non-dismissible text displayed at the bottom of:
 * - Buy Confirmation screen
 * - Sell Confirmation screen
 * - Prop Bet Confirmation screen
 *
 * Style: 10px, #8E8E93, centered, 8px padding
 * Position: below CTA button, above system home indicator
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../constants/theme';
import { Strings } from '../constants/strings';

export default function DisclaimerBanner() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>{Strings.disclaimer}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  text: {
    fontSize: 10,
    color: Colors.disclaimerText,
    textAlign: 'center',
    lineHeight: 14,
  },
});
