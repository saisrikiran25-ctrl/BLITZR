import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createJSONStorage, persist } from 'zustand/middleware';

interface AuthState {
    isAuthenticated: boolean;
    userId: string | null;
    username: string | null;
    email: string | null;
    token: string | null;
    tosAccepted: boolean;
    isIpoActive: boolean;
    rumorDisclosureAccepted: boolean;

    // Actions
    login: (userId: string, username: string, email: string, token: string, tosAccepted: boolean, isIpoActive: boolean, rumorDisclosureAccepted: boolean) => void;
    acceptTos: () => void;
    updateProfile: (data: Partial<AuthState>) => void;
    logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            isAuthenticated: false,
            userId: null,
            username: null,
            token: null,
            tosAccepted: false,

            login: (userId, username, email, token, tosAccepted, isIpoActive, rumorDisclosureAccepted) =>
                set({
                    isAuthenticated: true,
                    userId,
                    username,
                    email,
                    token,
                    tosAccepted,
                    isIpoActive,
                    rumorDisclosureAccepted,
                }),

            acceptTos: () => set({ tosAccepted: true }),
            
            updateProfile: (data) => set((state) => ({ 
                ...state, 
                username: data.username ?? state.username,
                tosAccepted: (data.tosAccepted !== undefined ? data.tosAccepted : (data as any).tos_accepted) ?? state.tosAccepted,
                isIpoActive: (data.isIpoActive !== undefined ? data.isIpoActive : (data as any).is_ipo_active) ?? state.isIpoActive,
                rumorDisclosureAccepted: (data.rumorDisclosureAccepted !== undefined ? data.rumorDisclosureAccepted : (data as any).rumor_disclosure_accepted) ?? state.rumorDisclosureAccepted,
            })),

            logout: async () => {
                // Synchronously clear Zustand state first
                set({
                    isAuthenticated: false,
                    userId: null,
                    username: null,
                    token: null,
                    tosAccepted: false,
                });
                // Then purge all persisted blitzr keys from AsyncStorage
                // so the next app launch starts completely fresh
                try {
                    const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
                    await AsyncStorage.multiRemove([
                        'blitzr-auth',
                        'blitzr-notifications',
                    ]);
                } catch {
                    // Ignore storage errors — state is already wiped above
                }
            },
        }),
        {
            name: 'blitzr-auth',
            storage: createJSONStorage(() => AsyncStorage),
        },
    ),
);
