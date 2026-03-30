import { create } from 'zustand';

interface AuthState {
    isAuthenticated: boolean;
    userId: string | null;
    username: string | null;
    token: string | null;
    tosAccepted: boolean;

    // Actions
    login: (userId: string, username: string, token: string, tosAccepted: boolean) => void;
    acceptTos: () => void;
    logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    isAuthenticated: false,
    userId: null,
    username: null,
    token: null,
    tosAccepted: false,

    login: (userId, username, token, tosAccepted) =>
        set({
            isAuthenticated: true,
            userId,
            username,
            token,
            tosAccepted,
        }),

    acceptTos: () => set({ tosAccepted: true }),

    logout: () =>
        set({
            isAuthenticated: false,
            userId: null,
            username: null,
            token: null,
        }),
}));
