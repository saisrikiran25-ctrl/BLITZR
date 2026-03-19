/**
 * Rumor Feed Screen
 *
 * F6: FACTUAL_CLAIM posts show:
 *   - 1px amber left border
 *   - "⚠ Factual Claim — tap flag to dispute" in 10px #8E8E93
 *   - Flag icon tappable → calls POST /api/v1/rumor/:postId/dispute
 *   - After tap: icon turns grey, label changes to "Disputed"
 *
 * F7: Credibility gate:
 *   - If credibility_score < 50 and user types a FACTUAL_CLAIM:
 *     Show bottom sheet with "Unlock Factual Claims" message
 *   - If >= 50: normal posting flow
 */
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  RefreshControl,
  Modal,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { Colors, Spacing } from '../constants/theme';
import { Strings } from '../constants/strings';
import { rumorApi } from '../services/api';
import { useAuthStore } from '../store/auth.store';

// F7: Client-side keyword list matching the backend classifier (approximate).
// NOTE: This list mirrors the backend's FACTUAL_CLAIM_KEYWORDS in rumor-feed/rumor.service.ts.
// Keep in sync — backend is authoritative; this list only gates the UI lock icon.
const FACTUAL_CLAIM_KEYWORDS = [
  'just saw',
  'i heard',
  'confirmed',
  'sources say',
  'apparently',
  'walking into',
  'coming out of',
  'was at',
  'got caught',
  'failed',
  'expelled',
  'arrested',
  'cheated',
  'broke up',
  'escorted',
  'suspended',
  'rumor is',
  'word is',
];

const CREDIBILITY_THRESHOLD = 50;

type RootTabParamList = {
  CloutExchange: undefined;
  Arena: undefined;
  RumorFeed: undefined;
  Profile: undefined;
};

function detectsFactualClaim(text: string): boolean {
  const lower = text.toLowerCase();
  return FACTUAL_CLAIM_KEYWORDS.some((kw) => lower.includes(kw));
}

interface Rumor {
  post_id: string;
  text: string;
  ghost_id: string;
  post_type: 'FACTUAL_CLAIM' | 'OPINION' | 'NEUTRAL';
  risk_score: number;
  upvotes: number;
  downvotes: number;
  created_at: string;
}

export default function RumorFeedScreen() {
  const [rumors, setRumors] = useState<Rumor[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [postText, setPostText] = useState('');
  const [posting, setPosting] = useState(false);
  const [disputedIds, setDisputedIds] = useState<Set<string>>(new Set());
  const [showCredGate, setShowCredGate] = useState(false);

  const { credibilityScore } = useAuthStore();
  const navigation = useNavigation<NavigationProp<RootTabParamList>>();

  const fetchFeed = useCallback(async () => {
    try {
      const data = await rumorApi.getFeed(1, 20);
      setRumors(data);
    } catch {
      setRumors([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchFeed(); }, [fetchFeed]);

  const handlePost = async () => {
    if (!postText.trim()) return;

    // F7: Gate check
    if (detectsFactualClaim(postText) && credibilityScore < CREDIBILITY_THRESHOLD) {
      setShowCredGate(true);
      return;
    }

    setPosting(true);
    try {
      await rumorApi.createPost(postText.trim());
      setPostText('');
      fetchFeed();
    } catch (e: any) {
      Alert.alert('Post Failed', e.message);
    } finally {
      setPosting(false);
    }
  };

  const handleDispute = async (postId: string) => {
    if (disputedIds.has(postId)) return;
    try {
      await rumorApi.dispute(postId);
      setDisputedIds((prev) => new Set(prev).add(postId));
    } catch (e: any) {
      Alert.alert('Dispute Failed', e.message);
    }
  };

  const isFactualClaim = detectsFactualClaim(postText);

  const renderRumor = ({ item }: { item: Rumor }) => {
    const isFactual = item.post_type === 'FACTUAL_CLAIM';
    const isDisputed = disputedIds.has(item.post_id);

    return (
      <View style={[styles.rumorCard, isFactual && styles.factualCard]}>
        <View style={styles.rumorRow}>
          <Text style={styles.ghostId}>{item.ghost_id}</Text>
          <Text style={styles.timestamp}>
            {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
        <Text style={styles.content}>{item.text}</Text>

        {/* F6: Factual Claim badge */}
        {isFactual && (
          <View style={styles.factualBadgeRow}>
            <Text style={styles.factualBadgeText}>
              {isDisputed ? Strings.disputed : Strings.factualClaimBadge}
            </Text>
            {!isDisputed && (
              <TouchableOpacity onPress={() => handleDispute(item.post_id)}>
                <Text style={styles.flagIcon}>🚩</Text>
              </TouchableOpacity>
            )}
            {isDisputed && <Text style={styles.flagIconGrey}>🚩</Text>}
          </View>
        )}

        {/* Votes */}
        <View style={styles.votesRow}>
          <TouchableOpacity onPress={() => rumorApi.upvote(item.post_id)} style={styles.voteBtn}>
            <Text style={styles.voteText}>▲ {item.upvotes}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => rumorApi.downvote(item.post_id)} style={styles.voteBtn}>
            <Text style={[styles.voteText, { color: Colors.thermalRed }]}>▼ {item.downvotes}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}
      >
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator color={Colors.kineticGreen} />
          </View>
        ) : (
          <FlatList
            data={rumors}
            keyExtractor={(item) => item.post_id}
            renderItem={renderRumor}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchFeed(); }} tintColor={Colors.kineticGreen} />
            }
          />
        )}

        {/* F7: Post input bar */}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            placeholder="Post anonymously..."
            placeholderTextColor={Colors.textSecondary}
            value={postText}
            onChangeText={setPostText}
            multiline
            maxLength={280}
          />
          <View style={styles.sendArea}>
            {/* F7: Lock icon shown when credibility score < 50 */}
            {credibilityScore < CREDIBILITY_THRESHOLD && <Text style={styles.lockBadge}>🔒</Text>}
            <TouchableOpacity
              style={styles.sendBtn}
              onPress={handlePost}
              disabled={posting || !postText.trim()}
              activeOpacity={0.8}
            >
              {posting ? (
                <ActivityIndicator color={Colors.obsidian} size="small" />
              ) : (
                <Text style={styles.sendIcon}>➤</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* F7: Credibility Gate Bottom Sheet */}
      <Modal visible={showCredGate} animationType="slide" transparent>
        <View style={styles.gateOverlay}>
          <View style={styles.gateSheet}>
            <Text style={styles.gateTitle}>{Strings.unlockFactualClaims}</Text>
            <Text style={styles.gateBody}>
              {Strings.credibilityGateBody.replace('{score}', String(credibilityScore))}
            </Text>
            <TouchableOpacity
              style={styles.gateCtaBtn}
              onPress={() => {
                setShowCredGate(false);
                navigation.navigate('Arena');
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.gateCtaText}>{Strings.goToArena}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowCredGate(false)}>
              <Text style={styles.gateDismiss}>Dismiss</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.obsidian },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  listContent: { paddingHorizontal: Spacing.md, paddingBottom: 100 },
  rumorCard: {
    backgroundColor: Colors.surface,
    borderRadius: 10,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  // F6: Amber left border for FACTUAL_CLAIM
  factualCard: {
    borderLeftWidth: 1,
    borderLeftColor: Colors.amber,
  },
  rumorRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  ghostId: { fontSize: 11, color: Colors.textSecondary, fontFamily: 'Courier' },
  timestamp: { fontSize: 11, color: Colors.textSecondary },
  content: { fontSize: 14, color: Colors.textPrimary, lineHeight: 20, marginBottom: 8 },
  // F6: Factual claim badge
  factualBadgeRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  factualBadgeText: { fontSize: 10, color: Colors.textSecondary, flex: 1 },
  flagIcon: { fontSize: 14 },
  flagIconGrey: { fontSize: 14, opacity: 0.4 },
  votesRow: { flexDirection: 'row', gap: 12 },
  voteBtn: { paddingVertical: 4 },
  voteText: { fontSize: 12, color: Colors.kineticGreen },
  // Input bar
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.glassBorder,
    backgroundColor: Colors.surface,
  },
  input: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: 14,
    maxHeight: 80,
    marginRight: Spacing.sm,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  sendArea: { flexDirection: 'row', alignItems: 'center' },
  lockBadge: { fontSize: 14, color: Colors.textSecondary, marginRight: Spacing.xs },
  sendBtn: {
    width: 40,
    height: 40,
    backgroundColor: Colors.kineticGreen,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendIcon: { fontSize: 18, color: Colors.obsidian },
  // Credibility gate
  gateOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  gateSheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: Spacing.lg,
    paddingBottom: 40,
  },
  gateTitle: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary, marginBottom: Spacing.sm },
  gateBody: { fontSize: 14, color: Colors.textSecondary, lineHeight: 20, marginBottom: Spacing.lg },
  gateCtaBtn: {
    backgroundColor: Colors.kineticGreen,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  gateCtaText: { fontSize: 16, fontWeight: '700', color: Colors.obsidian },
  gateDismiss: { textAlign: 'center', color: Colors.textSecondary, fontSize: 14, paddingVertical: 8 },
});
