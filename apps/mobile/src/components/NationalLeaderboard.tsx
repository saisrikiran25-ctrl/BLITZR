/**
 * F5: National Leaderboard Component
 *
 * Horizontally scrollable FlatList of cards below Top Gainers/Losers.
 * Each card: 140×80, background #1C1C1E
 *   - Row 1: Ticker symbol in white bold (e.g. "$PRIYA")
 *   - Row 2: College badge in #8E8E93 (e.g. "IIFT-D")
 *   - Row 3: Price in white monospace
 *   - Row 4: 24h change in Kinetic Green or Thermal Red
 * On tap: READ-ONLY mode — BUY/SELL replaced with "CROSS-CAMPUS TRADING COMING SOON"
 * Data: GET /api/v1/leaderboard/national?limit=50 — refreshes every 30 min
 */
import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Modal,
  SafeAreaView,
  Pressable,
} from 'react-native';
import { Colors, Spacing } from '../constants/theme';
import { Strings } from '../constants/strings';
import { leaderboardApi } from '../services/api';

interface LeaderboardEntry {
  entry_id: string;
  ticker_id: string;
  institution_short_code: string;
  institution_name: string;
  owner_display_name: string;
  snapshot_price: number;
  snapshot_volume: number;
  campus_rank: number;
  national_rank: number;
  featured: boolean;
}

const REFRESH_INTERVAL_MS = 30 * 60 * 1000; // 30 minutes

export default function NationalLeaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [selected, setSelected] = useState<LeaderboardEntry | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchData = async () => {
    try {
      const data = await leaderboardApi.getNational(50);
      setEntries(data);
    } catch {
      // Silently fail — stale data acceptable for leaderboard
    }
  };

  useEffect(() => {
    fetchData();
    intervalRef.current = setInterval(fetchData, REFRESH_INTERVAL_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  if (!entries.length) return null;

  const renderCard = ({ item }: { item: LeaderboardEntry }) => {
    const price = Number(item.snapshot_price);
    const priceStr = price > 0 ? price.toFixed(2) : '—';
    const volume = Number(item.snapshot_volume);
    const volumeStr = volume >= 1000
      ? `${(volume / 1000).toFixed(1)}k`
      : volume.toFixed(0);

    return (
      <TouchableOpacity style={styles.card} onPress={() => setSelected(item)} activeOpacity={0.85}>
        <Text style={styles.ticker}>${item.ticker_id}</Text>
        <Text style={styles.college}>{item.institution_short_code ?? '—'}</Text>
        <Text style={styles.price}>{priceStr}</Text>
        <Text style={styles.volume}>
          Vol: {volumeStr}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Section header */}
      <Text style={styles.sectionHeader}>{Strings.nationalTopStocks}</Text>

      <FlatList
        data={entries}
        keyExtractor={(item) => item.entry_id}
        renderItem={renderCard}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />

      {/* Read-only Dossier modal */}
      <Modal visible={!!selected} animationType="slide" transparent>
        <SafeAreaView style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Pressable style={styles.closeButton} onPress={() => setSelected(null)}>
              <Text style={styles.closeText}>✕</Text>
            </Pressable>

            {selected && (
              <>
                <Text style={styles.modalTicker}>${selected.ticker_id}</Text>
                <Text style={styles.modalCollege}>{selected.institution_name}</Text>
                <Text style={styles.modalPrice}>
                  {Number(selected.snapshot_price).toFixed(4)} Creds
                </Text>
                <Text style={styles.modalOwner}>{selected.owner_display_name}</Text>
                <Text style={styles.modalRank}>National Rank #{selected.national_rank}</Text>

                {/* F5: Read-only CTA — non-tappable */}
                <View style={styles.crossCampusCta}>
                  <Text style={styles.crossCampusText}>{Strings.crossCampusCta}</Text>
                </View>
              </>
            )}
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: Spacing.lg },
  sectionHeader: {
    fontSize: 12,
    color: Colors.textSecondary,
    letterSpacing: 2,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
  },
  listContent: { paddingHorizontal: Spacing.md },
  card: {
    width: 140,
    height: 80,
    backgroundColor: Colors.surface,
    borderRadius: 8,
    padding: Spacing.sm,
    marginRight: Spacing.sm,
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  ticker: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  college: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  price: {
    fontSize: 13,
    color: Colors.textPrimary,
    fontFamily: 'Courier',
  },
  change: {
    fontSize: 11,
    fontWeight: '600',
  },
  volume: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: Spacing.lg,
    paddingBottom: Spacing.xl,
    minHeight: 300,
  },
  closeButton: { alignSelf: 'flex-end', padding: 4 },
  closeText: { fontSize: 18, color: Colors.textSecondary },
  modalTicker: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  modalCollege: { fontSize: 14, color: Colors.textSecondary, marginBottom: 8 },
  modalPrice: { fontSize: 20, color: Colors.kineticGreen, fontFamily: 'Courier', marginBottom: 4 },
  modalOwner: { fontSize: 13, color: Colors.textSecondary, marginBottom: 4 },
  modalRank: { fontSize: 13, color: Colors.amber, marginBottom: Spacing.xl },
  crossCampusCta: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  crossCampusText: {
    fontSize: 13,
    color: Colors.textSecondary,
    letterSpacing: 0.5,
  },
});
