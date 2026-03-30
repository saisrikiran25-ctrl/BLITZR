import { create } from 'zustand';

interface Rumor {
    rumor_id: string;
    ghost_id: string;
    content: string;
    tagged_tickers: string[];
    upvotes: number;
    downvotes: number;
    is_pinned: boolean;
    created_at: string;
}

interface FeedState {
    rumors: Rumor[];
    userVotes: Record<string, 'UP' | 'DOWN'>;
    isLoading: boolean;
    hasMore: boolean;
    page: number;

    // Actions
    setRumors: (rumors: Rumor[]) => void;
    addRumor: (rumor: Rumor) => void;
    appendRumors: (rumors: Rumor[]) => void;
    setLoading: (loading: boolean) => void;
    fetchInitialData: () => Promise<void>;
    updateRumorVotes: (rumorId: string, upvotes: number, downvotes: number, userVote?: 'UP' | 'DOWN') => void;
}

export const useFeedStore = create<FeedState>((set) => ({
    rumors: [],
    userVotes: {},
    isLoading: true,
    hasMore: true,
    page: 1,

    setRumors: (rumors) => set({ rumors, isLoading: false, page: 1 }),

    addRumor: (rumor) =>
        set((state) => ({ rumors: [rumor, ...state.rumors] })),

    appendRumors: (rumors) =>
        set((state) => ({
            rumors: [...state.rumors, ...rumors],
            hasMore: rumors.length > 0,
            page: state.page + 1,
        })),

    setLoading: (loading) => set({ isLoading: loading }),

    fetchInitialData: async () => {
        const { api } = await import('../services/api');
        set({ isLoading: true });
        try {
            const rumors = await api.getRumors(1, 20);
            set({ rumors, isLoading: false, hasMore: rumors.length === 20 });
        } catch (error) {
            console.error('Failed to fetch rumors:', error);
            set({ isLoading: false });
        }
    },

    updateRumorVotes: (rumorId, upvotes, downvotes, userVote) =>
        set((state) => ({
            rumors: state.rumors.map((r) =>
                r.rumor_id === rumorId ? { ...r, upvotes, downvotes } : r
            ),
            userVotes: userVote ? { ...state.userVotes, [rumorId]: userVote } : state.userVotes,
        })),
}));
