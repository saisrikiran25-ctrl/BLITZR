/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import { adminApi } from '@/lib/api';
import { ClipboardList, CheckCircle, XCircle, RefreshCw } from 'lucide-react';

export default function ModerationQueuePage() {
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('PENDING');

    const loadQueue = async () => {
        setLoading(true);
        try {
            const data = await adminApi.getModerationQueue(filter);
            setItems(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadQueue(); }, [filter]);

    const handleClear = async (queueId: string) => {
        try {
            await adminApi.clearModerationItem(queueId);
            setItems((prev) => prev.filter((i) => i.queue_id !== queueId));
        } catch {
            alert('Clear action failed');
        }
    };

    const handleRemove = async (queueId: string) => {
        try {
            await adminApi.removeModerationItem(queueId);
            setItems((prev) => prev.filter((i) => i.queue_id !== queueId));
        } catch {
            alert('Remove action failed');
        }
    };

    const STATUS_FILTERS = ['PENDING', 'REVIEWED_CLEARED', 'REVIEWED_REMOVED'];

    return (
        <AdminLayout>
            <div className="mb-8 flex items-center gap-4">
                <ClipboardList className="text-pulse-blue w-8 h-8" />
                <h2 className="text-3xl font-light tracking-[0.2em] text-pulse-blue">MODERATION QUEUE</h2>
            </div>
            <div className="h-px w-full bg-pulse-blue/50 mt-4 mb-8" />

            {/* Status filter */}
            <div className="flex gap-4 mb-6">
                {STATUS_FILTERS.map((s) => (
                    <button
                        key={s}
                        onClick={() => setFilter(s)}
                        className={`px-4 py-2 text-xs tracking-widest border transition-all ${
                            filter === s
                                ? 'border-pulse-blue bg-pulse-blue/10 text-pulse-blue'
                                : 'border-glass-border text-text-secondary hover:border-pulse-blue'
                        }`}
                    >
                        {s.replace('_', ' ')}
                    </button>
                ))}
                <button onClick={loadQueue} className="ml-auto text-text-secondary hover:text-pulse-blue transition-colors">
                    <RefreshCw className="w-4 h-4" />
                </button>
            </div>

            {loading ? (
                <div className="text-text-secondary animate-pulse tracking-widest text-center mt-20">LOADING...</div>
            ) : items.length === 0 ? (
                <div className="text-kinetic-green tracking-widest text-center mt-20 flex flex-col items-center">
                    <CheckCircle className="w-12 h-12 mb-4 opacity-50" />
                    Queue clear.
                </div>
            ) : (
                <div className="space-y-4">
                    {items.map((item: any) => (
                        <div key={item.queue_id} className="border border-glass-border p-6 bg-obsidian/50 backdrop-blur">
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className="text-xs text-text-secondary font-mono tracking-widest">
                                            QUEUE ID: {item.queue_id?.slice(0, 8)}...
                                        </span>
                                        <span className="text-xs text-amber-400 border border-amber-400/30 px-2 py-0.5">
                                            {item.reason ?? 'No reason'}
                                        </span>
                                    </div>
                                    {item.post_preview ? (
                                        <p className="text-sm text-white leading-relaxed mb-1 font-mono">
                                            &quot;{item.post_preview}&quot;
                                        </p>
                                    ) : (
                                        <p className="text-xs text-text-secondary italic">Post content unavailable</p>
                                    )}
                                    <span className="text-[10px] text-text-secondary tracking-wider">
                                        {item.created_at ? new Date(item.created_at).toLocaleString() : '—'}
                                    </span>
                                </div>

                                {filter === 'PENDING' && (
                                    <div className="flex gap-3 flex-shrink-0">
                                        <button
                                            onClick={() => handleClear(item.queue_id)}
                                            className="flex items-center gap-2 px-4 py-2 bg-kinetic-green/10 text-kinetic-green border border-kinetic-green/30 hover:bg-kinetic-green hover:text-black transition-all text-xs tracking-widest"
                                        >
                                            <CheckCircle className="w-3 h-3" /> CLEAR
                                        </button>
                                        <button
                                            onClick={() => handleRemove(item.queue_id)}
                                            className="flex items-center gap-2 px-4 py-2 bg-thermal-red/10 text-thermal-red border border-thermal-red/30 hover:bg-thermal-red hover:text-white transition-all text-xs tracking-widest"
                                        >
                                            <XCircle className="w-3 h-3" /> REMOVE
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </AdminLayout>
    );
}
