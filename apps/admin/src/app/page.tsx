/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useMemo, useState } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import { adminApi } from '@/lib/api';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Activity, Users, AlertOctagon } from 'lucide-react';

interface AnalyticsSnapshot {
    avg_score_change: number;
    active_users: number;
    flagged_posts: number;
    total_trades: number;
    dept_sentiment: Record<string, number>;
    computed_at: string;
}

export default function CampusPulseDashboard() {
    const [history, setHistory] = useState<AnalyticsSnapshot[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadAnalytics = async () => {
        try {
            const data = await adminApi.getAnalytics(672);
            setHistory(data.reverse());
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAnalytics();
        const interval = setInterval(loadAnalytics, 60000);
        return () => clearInterval(interval);
    }, []);

    const latest = history.length > 0
        ? history[history.length - 1]
        : { avg_score_change: 0, active_users: 0, flagged_posts: 0, total_trades: 0, dept_sentiment: {}, computed_at: new Date().toISOString() };

    const chartData = history.map((d) => ({
        time: new Date(d.computed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        avg: Number(d.avg_score_change ?? 0),
    }));

    const totalTradesToday = useMemo(() => {
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        return history
            .filter((d) => new Date(d.computed_at) >= startOfDay)
            .reduce((sum, d) => sum + Number(d.total_trades ?? 0), 0);
    }, [history]);

    const deptEntries = Object.entries(latest.dept_sentiment ?? {});
    const maxDeptValue = Math.max(1, ...deptEntries.map(([, value]) => Number(value)));

    return (
        <AdminLayout>
            <div className="mb-6">
                <h2 className="text-3xl font-light tracking-[0.2em] text-white">CAMPUS PULSE REPORT</h2>
                <p className="text-xs text-text-secondary tracking-widest mt-2">AGGREGATED &amp; ANONYMIZED</p>
                <div className="h-px w-full bg-glass-border mt-4" />
            </div>

            {error && <div className="p-4 bg-thermal-red/20 border border-thermal-red text-thermal-red mb-6">{error}</div>}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="border border-glass-border p-6 bg-obsidian/50 backdrop-blur">
                    <div className="flex justify-between items-start mb-4">
                        <span className="text-xs text-text-secondary tracking-widest">ACTIVE USERS (15 MIN)</span>
                        <Users className="text-pulse-blue w-4 h-4" />
                    </div>
                    <div className="text-4xl text-pulse-blue font-light tracking-wider">
                        {loading ? '---' : latest.active_users.toLocaleString()}
                    </div>
                </div>

                <div className="border border-glass-border p-6 bg-obsidian/50 backdrop-blur">
                    <div className="flex justify-between items-start mb-4">
                        <span className="text-xs text-text-secondary tracking-widest">FLAGGED POSTS</span>
                        <AlertOctagon className={latest.flagged_posts > 0 ? "text-thermal-red w-4 h-4" : "text-text-secondary w-4 h-4"} />
                    </div>
                    <div className={`text-4xl font-light tracking-wider ${latest.flagged_posts > 0 ? 'text-thermal-red' : 'text-text-secondary'}`}>
                        {loading ? '---' : latest.flagged_posts.toLocaleString()}
                    </div>
                </div>

                <div className="border border-glass-border p-6 bg-obsidian/50 backdrop-blur">
                    <div className="flex justify-between items-start mb-4">
                        <span className="text-xs text-text-secondary tracking-widest">TOTAL TRADES TODAY</span>
                        <Activity className="text-kinetic-green w-4 h-4" />
                    </div>
                    <div className="text-4xl text-kinetic-green font-light tracking-wider">
                        {loading ? '---' : totalTradesToday.toLocaleString()}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="border border-glass-border p-6 bg-obsidian/50 backdrop-blur lg:col-span-2 h-96">
                    <span className="text-xs text-text-secondary tracking-widest block mb-6">AVG SCORE CHANGE (15 MIN)</span>
                    {loading ? (
                        <div className="w-full h-full flex items-center justify-center text-text-secondary animate-pulse">FETCHING TELEMETRY...</div>
                    ) : (
                        <ResponsiveContainer width="100%" height="85%">
                            <LineChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                <XAxis dataKey="time" stroke="#8e8e93" fontSize={10} tickLine={false} axisLine={false} />
                                <YAxis stroke="#8e8e93" fontSize={10} tickLine={false} axisLine={false} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#0f1115', border: '1px solid rgba(255,255,255,0.1)' }}
                                    itemStyle={{ color: '#00ff66' }}
                                    labelStyle={{ color: '#8e8e93' }}
                                />
                                <Line type="monotone" dataKey="avg" stroke="#00ff66" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    )}
                </div>

                <div className="border border-glass-border p-6 bg-obsidian/50 backdrop-blur">
                    <span className="text-xs text-text-secondary tracking-widest block mb-6">DEPARTMENT HEATMAP</span>
                    {deptEntries.length === 0 ? (
                        <div className="text-text-secondary text-xs">No department data.</div>
                    ) : (
                        <div className="grid grid-cols-1 gap-3">
                            {deptEntries.map(([dept, value]) => {
                                const intensity = Number(value) / maxDeptValue;
                                return (
                                    <div
                                        key={dept}
                                        className="flex items-center justify-between px-3 py-2 border border-glass-border text-xs tracking-widest"
                                        style={{ backgroundColor: `rgba(0,255,102,${0.08 + intensity * 0.35})` }}
                                    >
                                        <span className="text-white">{dept}</span>
                                        <span className="text-text-secondary">{Number(value).toFixed(2)}</span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}
