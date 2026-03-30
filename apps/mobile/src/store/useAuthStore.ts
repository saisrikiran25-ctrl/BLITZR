import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createJSONStorage, persist } from 'zustand/middleware';

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

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
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
                    tosAccepted: false,
                }),
        }),
        {
            name: 'blitzr-auth',
            storage: createJSONStorage(() => AsyncStorage),
        },
    ),
);
