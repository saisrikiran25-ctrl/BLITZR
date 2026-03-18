/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
"use client";

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import { adminApi } from '@/lib/api';
import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

export default function ContentSafetyReport() {
    const [rumors, setRumors] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const loadFlagged = async () => {
        try {
            const data = await adminApi.getFlaggedRumors();
            setRumors(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadFlagged();
    }, []);

    const handleAction = async (id: string, action: 'RESTORE' | 'DELETE') => {
        try {
            await adminApi.moderateRumor(id, action);
            loadFlagged();
        } catch (err) {
            alert('Moderation action failed');
        }
    };

    return (
        <AdminLayout>
            <div className="mb-8 flex items-center gap-4">
                <AlertTriangle className="text-thermal-red w-8 h-8" />
                <h2 className="text-3xl font-light tracking-[0.2em] text-thermal-red">CONTENT SAFETY REPORT</h2>
            </div>
            <div className="h-px w-full bg-thermal-red/50 mt-4 mb-8" />

            <div className="border border-glass-border p-6 bg-obsidian/50 backdrop-blur min-h-[500px]">
                {loading ? (
                    <div className="text-text-secondary animate-pulse tracking-widest text-center mt-20">SCANNING QUARANTINE...</div>
                ) : rumors.length === 0 ? (
                    <div className="text-kinetic-green tracking-widest text-center mt-20 flex flex-col items-center">
                        <CheckCircle className="w-12 h-12 mb-4 opacity-50" />
                        NO PENDING REVIEWS
                    </div>
                ) : (
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="text-text-secondary border-b border-glass-border">
                                <th className="pb-4 font-normal tracking-widest">ID</th>
                                <th className="pb-4 font-normal tracking-widest">CONTENT TRACE</th>
                                <th className="pb-4 font-normal tracking-widest">AUTHOR</th>
                                <th className="pb-4 font-normal tracking-widest">TIME</th>
                                <th className="pb-4 font-normal tracking-widest text-right">ACTION</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-glass-border/50">
                            {rumors.map(r => (
                                <tr key={r.rumor_id} className="hover:bg-white/5 transition-colors">
                                    <td className="py-4 text-xs font-mono text-pulse-blue">{r.rumor_id.substring(0, 8)}</td>
                                    <td className="py-4 max-w-md truncate pr-8">{r.content}</td>
                                    <td className="py-4 text-text-secondary">{r.author?.username || 'ANON'}</td>
                                    <td className="py-4 text-xs tracking-widest text-text-secondary">
                                        {new Date(r.created_at).toLocaleTimeString()}
                                    </td>
                                    <td className="py-4 text-right space-x-4">
                                        <button 
                                            onClick={() => handleAction(r.rumor_id, 'RESTORE')}
                                            className="text-kinetic-green hover:text-white transition-colors tracking-widest text-xs"
                                        >
                                            [RESTORE]
                                        </button>
                                        <button 
                                            onClick={() => handleAction(r.rumor_id, 'DELETE')}
                                            className="text-thermal-red hover:text-white transition-colors tracking-widest text-xs"
                                        >
                                            [DELETE]
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
