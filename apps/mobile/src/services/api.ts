import { useAuthStore } from '../store/useAuthStore';
import { Platform } from 'react-native';

const DEFAULT_BASE_URL = Platform.select({
    android: 'http://10.0.2.2:3000/api/v1',
    ios: 'http://localhost:3000/api/v1',
    default: 'http://localhost:3000/api/v1',
});
const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? DEFAULT_BASE_URL;

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
        const response = await fetch(`${BASE_URL}${path}`, {
            method,
            headers: this.getHeaders(),
            body: body ? JSON.stringify(body) : undefined,
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ message: 'Request failed' }));
            throw new Error(error.message || `HTTP ${response.status}`);
        }

        return response.json();
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

    async getProfile() {
        return this.request<any>('GET', '/users/me');
    }

    async acceptTos() {
        return this.request<{ success: boolean }>('POST', '/auth/accept-tos');
    }

    // === IPO ===
    async createIpo(tickerSymbol: string, category?: string) {
        return this.request('POST', '/ipo/create', { ticker_symbol: tickerSymbol, category });
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
