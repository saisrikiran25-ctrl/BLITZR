/**
 * BLITZR API Service
 * Centralised HTTP client for all backend calls.
 */

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';
const API_PREFIX = BASE_URL.endsWith('/api/v1') ? '' : '/api/v1';

let authToken: string | null = null;

export function setAuthToken(token: string) {
  authToken = token;
}

export function clearAuthToken() {
  authToken = null;
}

async function request<T>(
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  path: string,
  body?: unknown,
): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

  const res = await fetch(`${BASE_URL}${API_PREFIX}/${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message ?? `Request failed: ${res.status}`);
  }

  return res.json() as Promise<T>;
}

// ─── Auth ────────────────────────────────────────────────────────────────────

export const authApi = {
  register: (email: string, username: string, password: string, displayName?: string) =>
    request<{ token: string; user: { user_id: string; username: string } }>(
      'POST', 'auth/register', { email, username, password, displayName },
    ),

  login: (email: string, password: string) =>
    request<{ token: string; user: { user_id: string; username: string; tos_accepted: boolean; credibility_score: number } }>(
      'POST', 'auth/login', { email, password },
    ),

  acceptTos: () => request<{ success: boolean }>('POST', 'auth/accept-tos'),
};

// ─── IPO / Clout Exchange (Trading Floor) ────────────────────────────────────

export const ipoApi = {
  listMyself: (tickerId: string, initialSupply?: number) =>
    request<unknown>('POST', 'ipo/list', { ticker_id: tickerId, initial_supply: initialSupply }),

  getTicker: (tickerId: string) =>
    request<{ ticker_id: string; current_supply: number; price: number; total_volume: number }>(
      'GET', `ipo/ticker/${tickerId}`,
    ),

  getTopGainers: () =>
    request<Array<{ ticker_id: string; price: number; change_pct: number }>>('GET', 'ipo/top-gainers'),

  getTopLosers: () =>
    request<Array<{ ticker_id: string; price: number; change_pct: number }>>('GET', 'ipo/top-losers'),
};

// ─── Trading ─────────────────────────────────────────────────────────────────

export const tradingApi = {
  /** B12: returns { status: 'QUEUED' } immediately — trade processed via Redis queue */
  buy: (tickerId: string, shares: number) =>
    request<{ status: 'QUEUED'; message: string }>('POST', 'trading/buy', { ticker_id: tickerId, shares }),

  /** B12: returns { status: 'QUEUED' } immediately */
  sell: (tickerId: string, shares: number) =>
    request<{ status: 'QUEUED'; message: string }>('POST', 'trading/sell', { ticker_id: tickerId, shares }),

  previewBuy: (tickerId: string, shares: number) =>
    request<{ net_cost: number; price_per_share: number; burn: number; dividend: number }>(
      'POST', 'trading/preview/buy', { ticker_id: tickerId, shares },
    ),

  getCandles: (tickerId: string, interval = '1h', limit = 100) =>
    request<Array<{ open: number; high: number; low: number; close: number; time: string }>>(
      'GET', `trading/candles/${tickerId}?interval=${interval}&limit=${limit}`,
    ),
};

// ─── Prop Market (Arena) ─────────────────────────────────────────────────────

export type PropScope = 'LOCAL' | 'REGIONAL' | 'NATIONAL' | 'ALL';

export const propMarketApi = {
  /** B3: fetch events filtered by scope */
  getEvents: (scope: PropScope = 'LOCAL') =>
    request<Array<{
      event_id: string;
      title: string;
      yes_pool: number;
      no_pool: number;
      total_pool: number;
      expiry_timestamp: string;
      scope: PropScope;
      featured: boolean;
    }>>('GET', `markets?scope=${scope}`),

  placeBet: (eventId: string, outcome: 'YES' | 'NO', chipAmount: number) =>
    request<unknown>('POST', 'prop-market/bet', { event_id: eventId, outcome, chip_amount: chipAmount }),
};

// ─── Rumor Feed ───────────────────────────────────────────────────────────────

export const rumorApi = {
  getFeed: (page = 1, limit = 20) =>
    request<Array<{
      post_id: string;
      text: string;
      ghost_id: string;
      post_type: 'FACTUAL_CLAIM' | 'OPINION' | 'NEUTRAL';
      risk_score: number;
      upvotes: number;
      downvotes: number;
      created_at: string;
    }>>('GET', `rumor?page=${page}&limit=${limit}`),

  createPost: (text: string) =>
    request<{ post: { post_id: string }; visibility: string }>('POST', 'rumor', { text }),

  /** B10: dispute a post */
  dispute: (postId: string) =>
    request<{ success: boolean; total_disputes: number }>('POST', `rumor/${postId}/dispute`),

  upvote: (postId: string) => request<unknown>('POST', `rumor/${postId}/upvote`),
  downvote: (postId: string) => request<unknown>('POST', `rumor/${postId}/downvote`),
};

// ─── National Leaderboard ─────────────────────────────────────────────────────

export const leaderboardApi = {
  /** B5: fetch national leaderboard snapshot (refreshed every 30 minutes) */
  getNational: (limit = 50) =>
    request<Array<{
      entry_id: string;
      ticker_id: string;
      institution_short_code: string;
      institution_name: string;
      owner_display_name: string;
      snapshot_price: number;
      snapshot_volume: number;
      change_pct: number;
      campus_rank: number;
      national_rank: number;
      featured: boolean;
    }>>('GET', `leaderboard/national?limit=${limit}`),
};

// ─── Wallet ───────────────────────────────────────────────────────────────────

export const walletApi = {
  getBalance: () =>
    request<{ cred_balance: number; chip_balance: number; net_worth: number }>('GET', 'wallet/balance'),
};
