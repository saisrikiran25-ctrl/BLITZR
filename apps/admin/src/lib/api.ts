const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';
const TOKEN_KEY = 'blitzr_admin_token';

const getToken = () => (typeof window === 'undefined' ? null : localStorage.getItem(TOKEN_KEY));

export const setAdminToken = (token: string) => {
    if (typeof window !== 'undefined') {
        localStorage.setItem(TOKEN_KEY, token);
    }
};

export const clearAdminToken = () => {
    if (typeof window !== 'undefined') {
        localStorage.removeItem(TOKEN_KEY);
    }
};

const adminFetch = async (path: string, options: RequestInit = {}) => {
    const token = getToken();
    const headers: Record<string, string> = {
        ...(options.headers as Record<string, string>),
        'Content-Type': 'application/json',
    };
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
    if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload.message || 'Request failed');
    }
    return res.json();
};

export const adminApi = {
    login: (email: string, password: string) =>
        adminFetch('/admin/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        }),

    getAnalytics: (limit = 672) =>
        adminFetch(`/admin/analytics?limit=${limit}`, { cache: 'no-store' as RequestCache }),

    getModerationQueue: (status = 'PENDING') =>
        adminFetch(`/admin/moderation-queue?status=${status}`, { cache: 'no-store' as RequestCache }),

    getMarkets: (scope = 'LOCAL') =>
        adminFetch(`/markets?scope=${scope}`, { cache: 'no-store' as RequestCache }),

    clearModerationItem: (queueId: string) =>
        adminFetch(`/admin/moderation/${queueId}/clear`, { method: 'PATCH' }),

    removeModerationItem: (queueId: string) =>
        adminFetch(`/admin/moderation/${queueId}/remove`, { method: 'PATCH' }),

    pauseAllCampusMarkets: (confirmText: string) =>
        adminFetch('/admin/campus/pause', {
            method: 'POST',
            body: JSON.stringify({ confirm_text: confirmText }),
        }),

    freezeAllMarkets: () =>
        adminFetch('/admin/emergency/freeze-all', { method: 'POST' }),

    delistTicker: (tickerId: string) =>
        adminFetch(`/admin/emergency/delist/${tickerId}`, { method: 'POST' }),

    delistByEmail: (email: string) =>
        adminFetch('/admin/emergency/delist-by-email', {
            method: 'POST',
            body: JSON.stringify({ email }),
        }),
};
