import { create } from 'zustand';

interface Holding {
    ticker_id: string;
    shares_held: number;
    avg_buy_price: number;
    current_price: number;
    current_value: number;
    profit_loss: number;
    profit_loss_pct: number;
}

interface PortfolioState {
    credBalance: number;
    chipBalance: number;
    netWorth: number;
    credibilityScore: number;
    holdings: Holding[];
    isLoading: boolean;

    // Actions
    setBalances: (creds: number, chips: number) => void;
    setHoldings: (holdings: Holding[]) => void;
    updateHolding: (tickerId: string, data: Partial<Holding>) => void;
    setLoading: (loading: boolean) => void;
    performExchange: (amount: number, type: 'cred_to_chip' | 'chip_to_cred') => Promise<boolean>;
    fetchInitialData: () => Promise<void>;
    clearData: () => void;
}

export const usePortfolioStore = create<PortfolioState>((set, get) => ({
    credBalance: 100,
    chipBalance: 200,
    netWorth: 200,
    credibilityScore: 0,
    holdings: [],
    isLoading: true,

    setBalances: (creds, chips) =>
        set((state) => {
            const numCreds = typeof creds === 'string' ? parseFloat(creds) : creds;
            const numChips = typeof chips === 'string' ? parseFloat(chips) : chips;
            const holdingsValue = state.holdings.reduce(
                (sum, h) => sum + h.current_value,
                0,
            );
            return {
                credBalance: numCreds,
                chipBalance: numChips,
                netWorth: numCreds + (numChips / 2) + holdingsValue,
            };
        }),

    setHoldings: (holdings) =>
        set((state) => {
            const holdingsValue = holdings.reduce(
                (sum, h) => sum + h.current_value,
                0,
            );
            return {
                holdings,
                netWorth: state.credBalance + (state.chipBalance / 2) + holdingsValue,
                isLoading: false,
            };
        }),

    updateHolding: (tickerId, data) =>
        set((state) => {
            const holdings = state.holdings.map((h) =>
                h.ticker_id === tickerId ? { ...h, ...data } : h,
            );
            const holdingsValue = holdings.reduce(
                (sum, h) => sum + h.current_value,
                0,
            );
            return {
                holdings,
                netWorth: state.credBalance + (state.chipBalance / 2) + holdingsValue,
            };
        }),

    setLoading: (loading) => set({ isLoading: loading }),

    performExchange: async (amount: number, type: 'cred_to_chip' | 'chip_to_cred') => {
        const { api } = await import('../services/api');
        try {
            const result = await api.exchange(amount, type);
            // Instant update from API response
            get().setBalances(
                Number(result.balances.cred_balance),
                Number(result.balances.chip_balance)
            );
            return true;
        } catch (error) {
            console.error('Exchange failed:', error);
            return false;
        }
    },

    fetchInitialData: async () => {
        const { api } = await import('../services/api');
        set({ isLoading: true });
        try {
            const [holdings, profile] = await Promise.all([
                api.getUserHoldings(),
                api.getProfile(),
            ]);

            get().setBalances(
                parseFloat(profile.cred_balance),
                parseFloat(profile.chip_balance)
            );

            set({ credibilityScore: profile.credibility_score || 0 });

            get().setHoldings(holdings.map(h => ({
                ticker_id: h.ticker_id,
                shares_held: parseInt(h.shares_held || '0'),
                avg_buy_price: parseFloat(h.avg_buy_price || '0'),
                current_price: parseFloat(h.current_price || '0'),
                current_value: parseFloat(h.current_value || '0'),
                profit_loss: parseFloat(h.profit_loss || '0'),
                profit_loss_pct: parseFloat(h.profit_loss_pct || '0'),
            })));
        } catch (error) {
            console.error('Failed to fetch portfolio data:', error);
            set({ isLoading: false });
        }
    },
    clearData: () =>
        set({
            credBalance: 100,
            chipBalance: 200,
            netWorth: 200,
            credibilityScore: 0,
            holdings: [],
            isLoading: false,
        }),
}));
