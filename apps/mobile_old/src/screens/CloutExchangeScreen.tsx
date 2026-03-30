/**
 * Clout Exchange Screen (formerly "Trading Floor" — F1 language reframe)
 *
 * Shows:
 * - Top Gainers / Top Losers
 * - F5: National Top Stocks horizontal scroll below gainers/losers
 * - F3: Disclaimer on Buy/Sell confirmation modals
 */
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Modal,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Colors, Spacing } from '../constants/theme';
import { Strings } from '../constants/strings';
import { ipoApi, tradingApi } from '../services/api';
import NationalLeaderboard from '../components/NationalLeaderboard';
import DisclaimerBanner from '../components/DisclaimerBanner';

interface Ticker {
  ticker_id: string;
  price: number;
  change_pct: number;
}

interface TradeModal {
  tickerId: string;
  action: 'BUY' | 'SELL';
}

export default function CloutExchangeScreen() {
  const [gainers, setGainers] = useState<Ticker[]>([]);
  const [losers, setLosers] = useState<Ticker[]>([]);
  const [loading, setLoading] = useState(true);
  const [tradeModal, setTradeModal] = useState<TradeModal | null>(null);
  const [tradeShares, setTradeShares] = useState(1);
  const [trading, setTrading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [g, l] = await Promise.all([ipoApi.getTopGainers(), ipoApi.getTopLosers()]);
        setGainers(g);
        setLosers(l);
      } catch {
        // pass
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const executeTradeViaQueue = async () => {
    if (!tradeModal) return;
    setTrading(true);
    try {
      const result =
        tradeModal.action === 'BUY'
          ? await tradingApi.buy(tradeModal.tickerId, tradeShares)
          : await tradingApi.sell(tradeModal.tickerId, tradeShares);
      Alert.alert('Trade Queued', result.message);
      setTradeModal(null);
    } catch (e: any) {
      Alert.alert('Trade Failed', e.message);
    } finally {
      setTrading(false);
    }
  };

  const renderTicker = ({ item, isGainer }: { item: Ticker; isGainer: boolean }) => (
    <View style={styles.tickerRow}>
      <Text style={styles.tickerId}>${item.ticker_id}</Text>
      <Text style={styles.tickerPrice}>{Number(item.price).toFixed(2)}</Text>
      <Text style={[styles.changePct, { color: isGainer ? Colors.kineticGreen : Colors.thermalRed }]}>
        {isGainer ? '+' : ''}{Number(item.change_pct).toFixed(1)}%
      </Text>
      <TouchableOpacity
        style={styles.boostBtn}
        onPress={() => setTradeModal({ tickerId: item.ticker_id, action: 'BUY' })}
      >
        {/* F1: "Boost Score" instead of "Buy stock" */}
        <Text style={styles.boostBtnText}>{Strings.actionBuy}</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={Colors.kineticGreen} />
        </View>
      ) : (
        <FlatList
          data={[]}
          keyExtractor={() => 'dummy'}
          renderItem={null}
          ListHeaderComponent={
            <>
              {/* Top Gainers */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>TOP GAINERS</Text>
                {gainers.slice(0, 5).map((item) => (
                  <View key={item.ticker_id}>
                    {renderTicker({ item, isGainer: true })}
                  </View>
                ))}
              </View>

              {/* Top Losers */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>TOP LOSERS</Text>
                {losers.slice(0, 5).map((item) => (
                  <View key={item.ticker_id}>
                    {renderTicker({ item, isGainer: false })}
                  </View>
                ))}
              </View>

              {/* F5: National Top Stocks */}
              <NationalLeaderboard />
            </>
          }
        />
      )}

      {/* F3: Buy/Sell confirmation modal with disclaimer */}
      <Modal visible={!!tradeModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {tradeModal && (
              <>
                <Text style={styles.modalTitle}>
                  {tradeModal.action === 'BUY' ? Strings.actionBuy : Strings.actionSell}
                </Text>
                <Text style={styles.modalSubtitle}>${tradeModal.tickerId}</Text>
                <Text style={styles.modalLabel}>Shares: {tradeShares}</Text>

                {/* Adjust shares */}
                <View style={styles.sharesRow}>
                  <TouchableOpacity
                    style={styles.sharesBtn}
                    onPress={() => setTradeShares((s) => Math.max(1, s - 1))}
                  >
                    <Text style={styles.sharesBtnText}>−</Text>
                  </TouchableOpacity>
                  <Text style={styles.sharesValue}>{tradeShares}</Text>
                  <TouchableOpacity
                    style={styles.sharesBtn}
                    onPress={() => setTradeShares((s) => s + 1)}
                  >
                    <Text style={styles.sharesBtnText}>+</Text>
                  </TouchableOpacity>
                </View>

                {/* Confirm CTA */}
                <TouchableOpacity
                  style={[styles.confirmBtn, trading && styles.confirmBtnDisabled]}
                  onPress={executeTradeViaQueue}
                  disabled={trading}
                  activeOpacity={0.8}
                >
                  {trading ? (
                    <ActivityIndicator color={Colors.obsidian} />
                  ) : (
                    <Text style={styles.confirmBtnText}>Confirm</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity onPress={() => setTradeModal(null)}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>

                {/* F3: Disclaimer banner — persistent, non-dismissible */}
                <DisclaimerBanner />
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.obsidian },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  section: { paddingHorizontal: Spacing.md, marginTop: Spacing.lg },
  sectionTitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    letterSpacing: 2,
    marginBottom: Spacing.sm,
  },
  tickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.glassBorder,
  },
  tickerId: { flex: 1, fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  tickerPrice: { fontSize: 14, color: Colors.textPrimary, marginRight: Spacing.sm, fontFamily: 'Courier' },
  changePct: { fontSize: 13, fontWeight: '600', width: 60, textAlign: 'right', marginRight: Spacing.sm },
  boostBtn: {
    backgroundColor: Colors.kineticGreen,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  boostBtnText: { fontSize: 11, fontWeight: '700', color: Colors.obsidian },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: Spacing.lg,
    paddingBottom: 40,
  },
  modalTitle: { fontSize: 22, fontWeight: '700', color: Colors.textPrimary, marginBottom: 4 },
  modalSubtitle: { fontSize: 16, color: Colors.textSecondary, marginBottom: Spacing.md },
  modalLabel: { fontSize: 14, color: Colors.textSecondary, marginBottom: Spacing.sm },
  sharesRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.lg },
  sharesBtn: {
    width: 40,
    height: 40,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sharesBtnText: { fontSize: 20, color: Colors.textPrimary },
  sharesValue: { flex: 1, textAlign: 'center', fontSize: 22, fontWeight: '700', color: Colors.textPrimary },
  confirmBtn: {
    backgroundColor: Colors.kineticGreen,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  confirmBtnDisabled: { opacity: 0.6 },
  confirmBtnText: { fontSize: 16, fontWeight: '700', color: Colors.obsidian },
  cancelText: { textAlign: 'center', color: Colors.textSecondary, fontSize: 14, paddingVertical: 8 },
});
