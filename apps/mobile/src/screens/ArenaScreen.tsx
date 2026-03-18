/**
 * Arena Tab — Prop Markets
 *
 * F4: Segmented control at top: MY CAMPUS | REGIONAL | NATIONAL
 * Default: MY CAMPUS
 * National events show a globe icon on their card.
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Colors, Spacing } from '../constants/theme';
import { Strings } from '../constants/strings';
import { propMarketApi, PropScope } from '../services/api';
import DisclaimerBanner from '../components/DisclaimerBanner';

type ScopeTab = 'LOCAL' | 'REGIONAL' | 'NATIONAL';

interface PropEvent {
  event_id: string;
  title: string;
  yes_pool: number;
  no_pool: number;
  total_pool: number;
  expiry_timestamp: string;
  scope: PropScope;
  featured: boolean;
}

const SCOPE_TABS: { label: string; value: ScopeTab }[] = [
  { label: Strings.arenaScopeMyCampus, value: 'LOCAL' },
  { label: Strings.arenaScopeRegional, value: 'REGIONAL' },
  { label: Strings.arenaScopeNational, value: 'NATIONAL' },
];

export default function ArenaScreen() {
  const [activeScope, setActiveScope] = useState<ScopeTab>('LOCAL');
  const [events, setEvents] = useState<PropEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchEvents = useCallback(async (scope: ScopeTab) => {
    try {
      const data = await propMarketApi.getEvents(scope);
      setEvents(data);
    } catch {
      setEvents([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchEvents(activeScope);
  }, [activeScope, fetchEvents]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchEvents(activeScope);
  };

  const renderEvent = ({ item }: { item: PropEvent }) => {
    const totalPool = Number(item.yes_pool) + Number(item.no_pool);
    const yesPct = totalPool > 0 ? Math.round((Number(item.yes_pool) / totalPool) * 100) : 50;
    const noPct = 100 - yesPct;

    return (
      <View style={styles.eventCard}>
        <View style={styles.eventHeader}>
          <Text style={styles.eventTitle}>{item.title}</Text>
          {/* F4: Globe icon for national events */}
          {item.scope === 'NATIONAL' && (
            <Text style={styles.globeIcon}>🌐</Text>
          )}
        </View>

        {/* Yes/No bar */}
        <View style={styles.poolBar}>
          <View style={[styles.yesBar, { flex: yesPct }]} />
          <View style={[styles.noBar, { flex: noPct }]} />
        </View>
        <View style={styles.poolLabels}>
          <Text style={[styles.poolLabel, { color: Colors.kineticGreen }]}>YES {yesPct}%</Text>
          <Text style={[styles.poolLabel, { color: Colors.thermalRed }]}>NO {noPct}%</Text>
        </View>

        <Text style={styles.poolTotal}>
          Pool: {totalPool.toFixed(2)} Chips
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* F4: Scope Selector segmented control */}
      <View style={styles.segmentedControl}>
        {SCOPE_TABS.map((tab) => (
          <TouchableOpacity
            key={tab.value}
            style={[styles.segment, activeScope === tab.value && styles.segmentActive]}
            onPress={() => setActiveScope(tab.value)}
            activeOpacity={0.8}
          >
            <Text style={[styles.segmentText, activeScope === tab.value && styles.segmentTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={Colors.kineticGreen} />
        </View>
      ) : (
        <FlatList
          data={events}
          keyExtractor={(item) => item.event_id}
          renderItem={renderEvent}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.kineticGreen} />
          }
          ListEmptyComponent={
            <View style={styles.centered}>
              <Text style={styles.emptyText}>No markets available for {activeScope}</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.obsidian },
  segmentedControl: {
    flexDirection: 'row',
    margin: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: 8,
    padding: 2,
  },
  segment: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  segmentActive: {
    backgroundColor: Colors.kineticGreen,
  },
  segmentText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
    letterSpacing: 0.5,
  },
  segmentTextActive: {
    color: Colors.obsidian,
  },
  listContent: { paddingHorizontal: Spacing.md, paddingBottom: Spacing.xl },
  eventCard: {
    backgroundColor: Colors.surface,
    borderRadius: 10,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  eventTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginRight: Spacing.sm,
  },
  globeIcon: { fontSize: 18 },
  poolBar: {
    flexDirection: 'row',
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 4,
  },
  yesBar: { backgroundColor: Colors.kineticGreen },
  noBar: { backgroundColor: Colors.thermalRed },
  poolLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  poolLabel: { fontSize: 11, fontWeight: '600' },
  poolTotal: { fontSize: 11, color: Colors.textSecondary },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
  emptyText: { color: Colors.textSecondary, fontSize: 14 },
});
