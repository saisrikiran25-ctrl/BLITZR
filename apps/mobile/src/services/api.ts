import { useAuthStore } from '../store/useAuthStore';
import { Platform } from 'react-native';

const PRODUCTION_BASE_URL = 'https://monkfish-app-r6nxh.ondigitalocean.app/api/v1';
const LOCAL_DEV_BASE_URL = 'http://localhost:3001/api/v1';
const DEFAULT_BASE_URL = Platform.select({
    android: PRODUCTION_BASE_URL,
    ios: PRODUCTION_BASE_URL,
    web: PRODUCTION_BASE_URL,
    default: PRODUCTION_BASE_URL,
});

const normalizeBaseUrl = (url: string) => url.replace(/\/+$/, '');
const configuredBaseUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
const API_HTTP_ERROR_NAME = 'ApiHttpError';
// Browsers can expose IPv6 hosts as bracketed strings (e.g. "[::1]"); strip brackets for consistent checks.
const normalizeHostname = (hostname: string) => hostname.trim().toLowerCase().replace(/^\[(.*)\]$/, '$1');
const isLocalHostname = (hostname: string) => {
    const normalized = normalizeHostname(hostname);
    return normalized === 'localhost'
        || /^127\./.test(normalized)
        || normalized === '::'
        || normalized === '::1';
};

const getBaseUrls = (): string[] => {
    const urls: string[] = [];
    const currentLocation = typeof window !== 'undefined' ? window.location : undefined;
    const currentHostname = currentLocation?.hostname ? normalizeHostname(currentLocation.hostname) : undefined;
    const isLocalWebHost = currentHostname ? isLocalHostname(currentHostname) : false;

    const add = (value?: string) => {
        if (!value) return;
        const normalized = normalizeBaseUrl(value);
        if (!urls.includes(normalized)) {
            urls.push(normalized);
        }
    };

    // 1. First priority: Explicitly configured API URL
    add(configuredBaseUrl);

    // 2. Second priority: If running on a non-local web host, try its own origin
    if (currentLocation?.origin && !isLocalWebHost) {
        add(`${currentLocation.origin}/api/v1`);
    }

    // 3. Third priority: Known Production URL
    add(PRODUCTION_BASE_URL);

    // 4. Fourth priority: Default Platform URL (usually production)
    add(DEFAULT_BASE_URL);

    // 5. Fifth priority: Fallback to localhost if on a local host
    if (isLocalWebHost) {
        add(LOCAL_DEV_BASE_URL);
    }

    return urls;
};


/**
 * BLITZR API Client
 * Handles all REST communication with the NestJS backend.
 */
class ApiClient {
    private getHeaders(): Record<string, string> {
        const token = useAuthStore.getState().token;
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        return headers;
    }

    private async request<T>(
        method: string,
        path: string,
        body?: any,
    ): Promise<T> {
        const urls = getBaseUrls();
        const attemptErrors: string[] = [];

        for (const [urlIndex, baseUrl] of urls.entries()) {
            try {
                const response = await fetch(`${baseUrl}${path}`, {
                    method,
                    headers: this.getHeaders(),
                    body: body ? JSON.stringify(body) : undefined,
                }).catch(err => {
                    // This handles network-level errors (e.g. ERR_CONNECTION_REFUSED)
                    throw err;
                });

                if (!response.ok) {
                    const errorBody = await response.json().catch(() => ({ message: 'Request failed' }));
                    const message = errorBody.message || `HTTP ${response.status}`;

                    // If it's a 5xx error, it might be worth trying the next URL
                    if (response.status >= 500 && urlIndex < urls.length - 1) {
                        console.warn(`[API] 5xx error from ${baseUrl}, trying next candidate...`);
                        attemptErrors.push(`${baseUrl}: ${message}`);
                        continue;
                    }

                    const httpError = new Error(message);
                    httpError.name = API_HTTP_ERROR_NAME;
                    throw httpError;
                }

                return response.json();
            } catch (error) {
                if (error instanceof Error && error.name === API_HTTP_ERROR_NAME) {
                    throw error;
                }
                const message = error instanceof Error ? error.message : 'Network request failed';
                console.warn(`[API] Failed to reach ${baseUrl}: ${message}`);
                attemptErrors.push(`${baseUrl}: ${message}`);
            }
        }


        const fallbackMessage = attemptErrors.length > 0
            ? `Unable to connect to BLITZR services. Tried: ${attemptErrors.join(' | ')}`
            : 'Unable to connect to BLITZR services.';
        throw new Error(fallbackMessage);
    }

    // === AUTH ===
    async getCampuses(domain: string) {
        return this.request<{ campuses: string[] }>('GET', `/auth/campuses?domain=${domain}`);
    }

    async register(email: string, username: string, password: string, campus?: string) {
        return this.request<{ user: any; token: string }>('POST', '/auth/register', {
            email, username, password, campus
        });
    }

    async login(email: string, password: string) {
        return this.request<{ user: any; token: string }>('POST', '/auth/login', {
            email, password,
        });
    }

    async googleLogin(idToken: string) {
        return this.request<{ user: any; token: string; isNewUser: boolean }>('POST', '/auth/google', {
            idToken,
        });
    }

    async getProfile() {
        return this.request<any>('GET', '/users/me');
    }

    async updateProfile(data: any) {
        return this.request<any>('PATCH', '/users/me', data);
    }

    async getNotifications(limit = 20) {
        return this.request<any[]>('GET', `/notifications?limit=${limit}`);
    }

    async markAsRead(id: string) {
        return this.request<any>('POST', `/notifications/${id}/read`);
    }

    async markAllAsRead() {
        return this.request<any>('POST', '/notifications/read-all');
    }

    async deleteAccount() {
        return this.request<any>('DELETE', '/users/me');
    }

    async acceptTos() {
        return this.request<{ success: boolean }>('POST', '/auth/accept-tos');
    }

    // === IPO ===
    async createIpo(tickerSymbol: string, category?: string) {
        return this.request('POST', '/ipo/create', { ticker_symbol: tickerSymbol, category });
    }

    async delistIpo() {
        return this.request('POST', '/ipo/delist');
    }

    async getActiveTickers() {
        return this.request<any[]>('GET', '/ipo/tickers');
    }

    async getTicker(tickerId: string) {
        return this.request('GET', `/ipo/ticker/${tickerId}`);
    }

    async getUserHoldings() {
        return this.request<any[]>('GET', '/ipo/holdings');
    }

    // === TRADING ===
    async previewBuy(tickerId: string, shares: number) {
        return this.request('POST', '/trading/preview/buy', { ticker_id: tickerId, shares });
    }

    async executeBuy(tickerId: string, shares: number) {
        return this.request('POST', '/trading/buy', { ticker_id: tickerId, shares });
    }

    async executeSell(tickerId: string, shares: number) {
        return this.request('POST', '/trading/sell', { ticker_id: tickerId, shares });
    }

    // === PROP MARKET ===
    async getActiveEvents() {
        return this.request<any[]>('GET', '/prop-market/events');
    }

    async placeBet(eventId: string, outcome: 'YES' | 'NO', chipAmount: number) {
        return this.request('POST', '/prop-market/bet', {
            event_id: eventId, outcome, chip_amount: chipAmount,
        });
    }

    async createPropEvent(title: string, expiryTimestamp: string, description?: string, category?: string, initialLiquidity: number = 0) {
        return this.request('POST', '/prop-market/create', {
            title, description, category, expiry_timestamp: expiryTimestamp, initial_liquidity: initialLiquidity,
        });
    }

    // === RUMORS ===
    async getRumors(page: number = 1, limit: number = 20) {
        return this.request<any[]>('GET', `/rumors?page=${page}&limit=${limit}`);
    }

    async createRumor(content: string) {
        return this.request('POST', '/rumors', { content });
    }

    async upvoteRumor(rumorId: string) {
        return this.request('POST', `/rumors/${rumorId}/upvote`);
    }

    async downvoteRumor(rumorId: string) {
        return this.request('POST', `/rumors/${rumorId}/downvote`);
    }

    async disputeRumor(rumorId: string) {
        return this.request('POST', `/rumors/${rumorId}/dispute`);
    }

    // === WALLET ===
    async exchange(amount: number, type: 'cred_to_chip' | 'chip_to_cred') {
        const path = type === 'cred_to_chip'
            ? '/wallet/exchange/creds-to-chips'
            : '/wallet/exchange/chips-to-creds';
        return this.request<{ message: string; balances: { cred_balance: string; chip_balance: string } }>('POST', path, { amount });
    }

    async exchangeCredsToChips(amount: number) {
        return this.request('POST', '/wallet/exchange/creds-to-chips', { amount });
    }

    async exchangeChipsToCreds(amount: number) {
        return this.request('POST', '/wallet/exchange/chips-to-creds', { amount });
    }
}

export const api = new ApiClient();
