import { create } from 'zustand';

interface TickerData {
    ticker_id: string;
    price: number;
    change_pct: number;
    supply: number;
    volume: number;
    category?: string;
}

interface MarketState {
    // Live ticker data
    tickers: Record<string, TickerData>;
    topGainers: string[];
    topLosers: string[];
    tickerTapeItems: TickerData[];
    globalMarketCap: number;

    // Loading / connection
    isConnected: boolean;
    isLoading: boolean;

    // Actions
    updateTicker: (tickerId: string, data: Partial<TickerData>) => void;
    setTickers: (tickers: any[]) => void;
    setConnected: (connected: boolean) => void;
    setLoading: (loading: boolean) => void;
    fetchInitialData: () => Promise<void>;
}

export const useMarketStore = create<MarketState>((set, get) => ({
    tickers: {},
    topGainers: [],
    topLosers: [],
    tickerTapeItems: [],
    globalMarketCap: 0,
    isConnected: false,
    isLoading: true,

    updateTicker: (tickerId, data) =>
        set((state) => {
            const existing = state.tickers[tickerId] || {
                ticker_id: tickerId,
                price: 0,
                change_pct: 0,
                supply: 0,
                volume: 0,
            };
            const updated = { ...existing, ...data };
            const newTickers = { ...state.tickers, [tickerId]: updated };

            const allTickers = Object.values(newTickers) as TickerData[];

            // Recalculate top gainers/losers
            const sorted = [...allTickers].sort(
                (a, b) => b.change_pct - a.change_pct,
            );
            const topGainers = sorted.slice(0, 10).map((t) => t.ticker_id);
            const topLosers = sorted
                .slice(-10)
                .reverse()
                .map((t) => t.ticker_id);

            // Ticker tape: top 10 most volatile
            const volatile = [...allTickers]
                .sort((a, b) => Math.abs(b.change_pct) - Math.abs(a.change_pct))
                .slice(0, 10);

            // Global market cap
            const globalMarketCap = allTickers.reduce(
                (sum, t) => sum + t.price * t.supply,
                0,
            );

            return {
                tickers: newTickers,
                topGainers,
                topLosers,
                tickerTapeItems: volatile,
                globalMarketCap,
            };
        }),

    setTickers: (tickers) => {
        const { wsService } = require('../services/websocket');
        tickers.forEach((t) => {
            get().updateTicker(t.ticker_id, {
                price: parseFloat(t.current_price || t.price || '0'),
                supply: parseInt(t.current_supply || t.supply || '0'),
                change_pct: parseFloat(t.change_percentage || t.change_pct || '0'),
                volume: parseFloat(t.total_volume || t.volume || '0'),
                category: t.category,
            });
            // Subscribe to live price updates for this ticker
            if (wsService) {
                wsService.subscribeTicker(t.ticker_id);
            }
        });
        set({ isLoading: false });
    },

    setConnected: (connected) => set({ isConnected: connected }),
    setLoading: (loading) => set({ isLoading: loading }),

    fetchInitialData: async () => {
        const { api } = await import('../services/api');
        const { wsService } = await import('../services/websocket');
        set({ isLoading: true });
        try {
            wsService.connect();
            const tickers = await api.getActiveTickers();
            get().setTickers(tickers);
        } catch (error) {
            console.error('Failed to fetch tickers:', error);
            set({ isLoading: false });
        }
    },
}));
