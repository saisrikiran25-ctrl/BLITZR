import { create } from 'zustand';

interface PropEvent {
    event_id: string;
    title: string;
    category: string;
    yes_pool: number;
    no_pool: number;
    total_pool: number;
    yes_odds: number;
    no_odds: number;
    time_remaining_ms: number;
    status: string;
}

interface PropState {
    events: PropEvent[];
    isLoading: boolean;

    // Actions
    setEvents: (events: any[]) => void;
    setLoading: (loading: boolean) => void;
    fetchInitialData: () => Promise<void>;
    updateEventPools: (eventId: string, yesPool: number, noPool: number) => void;
}

export const usePropStore = create<PropState>((set, get) => ({
    events: [],
    isLoading: true,

    setEvents: (events) => {
        const processed = events.map(e => {
            const yes = parseFloat(e.yes_pool || '0');
            const no = parseFloat(e.no_pool || '0');
            const total = yes + no || 1;
            return {
                event_id: e.event_id,
                title: e.title,
                category: e.category,
                yes_pool: yes,
                no_pool: no,
                total_pool: total,
                yes_odds: total / (yes || 1),
                no_odds: total / (no || 1),
                time_remaining_ms: new Date(e.expiry_timestamp).getTime() - Date.now(),
                status: e.status,
            };
        });
        set({ events: processed, isLoading: false });
    },

    setLoading: (loading) => set({ isLoading: loading }),

    fetchInitialData: async () => {
        const { api } = await import('../services/api');
        set({ isLoading: true });
        try {
            const events = await api.getActiveEvents();
            get().setEvents(events);
        } catch (error) {
            console.error('Failed to fetch prop events:', error);
            set({ isLoading: false });
        }
    },

    updateEventPools: (eventId: string, yesPool: number, noPool: number) => {
        set((state) => {
            const updatedEvents = state.events.map((e) => {
                if (e.event_id === eventId) {
                    const total = yesPool + noPool || 1; // Prevent div by 0
                    return {
                        ...e,
                        yes_pool: yesPool,
                        no_pool: noPool,
                        total_pool: total,
                        yes_odds: total / (yesPool || 1),
                        no_odds: total / (noPool || 1),
                    };
                }
                return e;
            });
            return { events: updatedEvents };
        });
    },
}));
