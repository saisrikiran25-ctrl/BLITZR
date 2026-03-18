/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import { adminApi } from '@/lib/api';
import { AlertTriangle } from 'lucide-react';

export default function ContentSafetyReport() {
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const loadQueue = async () => {
        try {
            const data = await adminApi.getModerationQueue('PENDING');
            setItems(data);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadQueue();
    }, []);

    const handleClear = async (queueId: string) => {
        await adminApi.clearModerationItem(queueId);
        setItems((prev) => prev.filter((i) => i.queue_id !== queueId));
    };

    const handleRemove = async (queueId: string) => {
        await adminApi.removeModerationItem(queueId);
        setItems((prev) => prev.filter((i) => i.queue_id !== queueId));
    };

    return (
        <AdminLayout>
            <div className="mb-6 flex items-center gap-4">
                <AlertTriangle className="text-thermal-red w-8 h-8" />
                <div>
                    <h2 className="text-3xl font-light tracking-[0.2em] text-thermal-red">CONTENT SAFETY REPORT</h2>
                    <p className="text-xs text-text-secondary tracking-widest mt-2">AGGREGATED REVIEW QUEUE</p>
                </div>
            </div>
            <div className="h-px w-full bg-thermal-red/50 mt-4 mb-8" />

            <div className="border border-glass-border p-6 bg-obsidian/50 backdrop-blur min-h-[400px]">
                {loading ? (
                    <div className="text-text-secondary animate-pulse tracking-widest text-center mt-20">SCANNING QUARANTINE...</div>
                ) : items.length === 0 ? (
                    <div className="text-kinetic-green tracking-widest text-center mt-20">NO PENDING REVIEWS</div>
                ) : (
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="text-text-secondary border-b border-glass-border">
                                <th className="pb-4 font-normal tracking-widest">TIMESTAMP</th>
                                <th className="pb-4 font-normal tracking-widest">FLAG TYPE</th>
                                <th className="pb-4 font-normal tracking-widest">STATUS</th>
                                <th className="pb-4 font-normal tracking-widest text-right">ACTION</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-glass-border/50">
                            {items.map((item: any) => (
                                <tr key={item.queue_id} className="hover:bg-white/5 transition-colors">
                                    <td className="py-4 text-xs tracking-widest text-text-secondary">
                                        {item.created_at ? new Date(item.created_at).toLocaleString() : '—'}
                                    </td>
                                    <td className="py-4 text-amber-400">{item.flag_type}</td>
                                    <td className="py-4 text-text-secondary">{item.status}</td>
                                    <td className="py-4 text-right space-x-3">
                                        <button
                                            onClick={() => handleClear(item.queue_id)}
                                            className="text-kinetic-green hover:text-white transition-colors tracking-widest text-xs"
                                        >
                                            [CLEAR]
                                        </button>
                                        <button
                                            onClick={() => handleRemove(item.queue_id)}
                                            className="text-thermal-red hover:text-white transition-colors tracking-widest text-xs"
                                        >
                                            [REMOVE]
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </AdminLayout>
    );
}
