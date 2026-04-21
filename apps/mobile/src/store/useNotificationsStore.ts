import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createJSONStorage, persist } from 'zustand/middleware';
import { api } from '../services/api';

interface Notification {
    notification_id: string;
    title: string;
    message: string;
    type: 'TRADING' | 'PRICE_ALERT' | 'ARENA' | 'SYSTEM';
    is_read: boolean;
    created_at: string;
}

interface NotificationsState {
    notifications: Notification[];
    unreadCount: number;
    isLoading: boolean;
    preferences: {
        trading: boolean;
        priceThreshold: boolean;
        arenaResolution: boolean;
    };

    // Actions
    fetchNotifications: () => Promise<void>;
    fetchPreferences: () => Promise<void>;
    updatePreference: (key: keyof NotificationsState['preferences'], value: boolean) => Promise<void>;
    markAsRead: (id: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    clearNotifications: () => void;
}

export const useNotificationsStore = create<NotificationsState>()(
    persist(
        (set, get) => ({
            notifications: [],
            unreadCount: 0,
            isLoading: false,
            preferences: {
                trading: true,
                priceThreshold: true,
                arenaResolution: true,
            },

            fetchNotifications: async () => {
                set({ isLoading: true });
                try {
                    const data = await api.getNotifications();
                    const unread = data.filter((n: any) => !n.is_read).length;
                    set({ notifications: data, unreadCount: unread, isLoading: false });
                } catch (error) {
                    console.error('Failed to fetch notifications:', error);
                    set({ isLoading: false });
                }
            },

            fetchPreferences: async () => {
                try {
                    const profile = await api.getProfile();
                    set({
                        preferences: {
                            trading: profile.notify_trading,
                            priceThreshold: profile.notify_price_threshold,
                            arenaResolution: profile.notify_arena_resolution,
                        }
                    });
                } catch (error) {
                    console.error('Failed to fetch notification preferences:', error);
                }
            },

            updatePreference: async (key, value) => {
                set((state) => ({
                    preferences: { ...state.preferences, [key]: value }
                }));
                try {
                    const fieldMap: any = {
                        trading: 'notify_trading',
                        priceThreshold: 'notify_price_threshold',
                        arenaResolution: 'notify_arena_resolution',
                    };
                    await api.updateProfile({ [fieldMap[key]]: value });
                } catch (error) {
                    console.error('Failed to update preference on server:', error);
                }
            },

            markAsRead: async (id) => {
                try {
                    await api.markAsRead(id);
                    const notifications = get().notifications.map(n => 
                        n.notification_id === id ? { ...n, is_read: true } : n
                    );
                    const unread = notifications.filter(n => !n.is_read).length;
                    set({ notifications, unreadCount: unread });
                } catch (error) {
                    console.error('Failed to mark notification as read:', error);
                }
            },

            markAllAsRead: async () => {
                try {
                    await api.markAllAsRead();
                    const notifications = get().notifications.map(n => ({ ...n, is_read: true }));
                    set({ notifications, unreadCount: 0 });
                } catch (error) {
                    console.error('Failed to mark all as read:', error);
                }
            },

            clearNotifications: () => {
                set({ notifications: [], unreadCount: 0 });
            },
        }),
        {
            name: 'blitzr-notifications',
            storage: createJSONStorage(() => AsyncStorage),
        },
    ),
);
