const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

export const adminApi = {
    async getSentimentHistory() {
        const res = await fetch(`${BASE_URL}/admin/sentiment`, { cache: 'no-store' });
        if (!res.ok) throw new Error('Failed to fetch sentiment history');
        return res.json();
    },

    async getFlaggedRumors() {
        const res = await fetch(`${BASE_URL}/admin/flagged-rumors`, { cache: 'no-store' });
        if (!res.ok) throw new Error('Failed to fetch flagged rumors');
        return res.json();
    },

    async getModerationQueue(status = 'PENDING') {
        const res = await fetch(`${BASE_URL}/admin/moderation-queue?status=${status}`, { cache: 'no-store' });
        if (!res.ok) throw new Error('Failed to fetch moderation queue');
        return res.json();
    },

    async clearModerationItem(queueId: string) {
        const res = await fetch(`${BASE_URL}/admin/moderation/${queueId}/clear`, { method: 'PATCH' });
        if (!res.ok) throw new Error('Failed to clear moderation item');
        return res.json();
    },

    async removeModerationItem(queueId: string) {
        const res = await fetch(`${BASE_URL}/admin/moderation/${queueId}/remove`, { method: 'PATCH' });
        if (!res.ok) throw new Error('Failed to remove moderation item');
        return res.json();
    },

    async moderateRumor(rumorId: string, action: 'RESTORE' | 'DELETE') {
        const res = await fetch(`${BASE_URL}/admin/rumors/${rumorId}/moderate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action })
        });
        if (!res.ok) throw new Error('Failed to moderate rumor');
        return res.json();
    },

    async pauseAllCampusMarkets(confirmText: string) {
        const res = await fetch(`${BASE_URL}/admin/campus/pause`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ confirm_text: confirmText })
        });
        if (!res.ok) throw new Error('Failed to pause campus markets');
        return res.json();
    },

    async freezeAllMarkets() {
        const res = await fetch(`${BASE_URL}/admin/emergency/freeze-all`, { method: 'POST' });
        if (!res.ok) throw new Error('Failed to freeze markets');
        return res.json();
    },

    async delistTicker(tickerId: string) {
        const res = await fetch(`${BASE_URL}/admin/emergency/delist/${tickerId}`, { method: 'POST' });
        if (!res.ok) throw new Error('Failed to delist ticker');
        return res.json();
    },

    async delistByEmail(email: string) {
        const res = await fetch(`${BASE_URL}/admin/emergency/delist-by-email`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });
        if (!res.ok) throw new Error('Failed to delist by email');
        return res.json();
    }
};
