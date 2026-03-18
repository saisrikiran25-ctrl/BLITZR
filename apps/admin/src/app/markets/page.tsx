/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import { adminApi } from '@/lib/api';

interface MarketRow {
    event_id: string;
    title: string;
    yes_pool: number;
    no_pool: number;
    expiry_timestamp: string;
}

export default function PredictionIntelligence() {
    const [events, setEvents] = useState<MarketRow[]>([]);
    const [loading, setLoading] = useState(true);

    const loadMarkets = async () => {
        try {
            const data = await adminApi.getMarkets('LOCAL');
            setEvents(data);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadMarkets();
    }, []);

    return (
        <AdminLayout>
            <div className="mb-6">
                <h2 className="text-3xl font-light tracking-[0.2em] text-white">PREDICTION INTELLIGENCE</h2>
                <p className="text-xs text-text-secondary tracking-widest mt-2">STUDENT PREDICTION INTELLIGENCE — POWERED BY BLITZR</p>
                <div className="h-px w-full bg-glass-border mt-4" />
            </div>

            <div className="border border-glass-border p-6 bg-obsidian/50 backdrop-blur min-h-[400px]">
                {loading ? (
                    <div className="text-text-secondary animate-pulse tracking-widest text-center mt-20">LOADING MARKETS...</div>
                ) : events.length === 0 ? (
                    <div className="text-text-secondary tracking-widest text-center mt-20">NO ACTIVE MARKETS</div>
                ) : (
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="text-text-secondary border-b border-glass-border">
                                <th className="pb-4 font-normal tracking-widest">EVENT TITLE</th>
                                <th className="pb-4 font-normal tracking-widest">YES%</th>
                                <th className="pb-4 font-normal tracking-widest">NO%</th>
                                <th className="pb-4 font-normal tracking-widest">TOTAL CHIPS</th>
                                <th className="pb-4 font-normal tracking-widest">EXPIRY</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-glass-border/50">
                            {events.map((event) => {
                                const total = Number(event.yes_pool) + Number(event.no_pool);
                                const yesPct = total > 0 ? Math.round((Number(event.yes_pool) / total) * 100) : 50;
                                const noPct = 100 - yesPct;
                                return (
                                    <tr key={event.event_id} className="hover:bg-white/5 transition-colors">
                                        <td className="py-4 pr-4">
                                            <div>{event.title}</div>
                                            <div className="mt-2 h-2 w-full bg-black/40 rounded overflow-hidden flex">
                                                <div
                                                    className="bg-kinetic-green"
                                                    style={{ width: `${yesPct}%` }}
                                                />
                                                <div
                                                    className="bg-thermal-red"
                                                    style={{ width: `${noPct}%` }}
                                                />
                                            </div>
                                        </td>
                                        <td className="py-4 text-kinetic-green">{yesPct}%</td>
                                        <td className="py-4 text-thermal-red">{noPct}%</td>
                                        <td className="py-4 text-text-secondary">{total.toFixed(2)}</td>
                                        <td className="py-4 text-text-secondary text-xs tracking-widest">
                                            {new Date(event.expiry_timestamp).toLocaleString()}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>
        </AdminLayout>
    );
}
