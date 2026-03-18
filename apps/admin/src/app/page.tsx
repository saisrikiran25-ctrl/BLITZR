/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
"use client";

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import { adminApi } from '@/lib/api';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Activity, Users, AlertOctagon } from 'lucide-react';

export default function SentimentOverview() {
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadHistory = async () => {
            try {
                const data = await adminApi.getSentimentHistory();
                const formatted = data.map((d: any) => ({
                    time: new Date(d.recorded_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    clout: Number(d.total_clout),
                    users: d.active_users,
                    flags: d.flagged_posts_count
                })).reverse();
                setHistory(formatted);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        loadHistory();
        const interval = setInterval(loadHistory, 60000); // refresh every minute
        return () => clearInterval(interval);
    }, []);

    const latest = history.length > 0 ? history[history.length - 1] : { clout: 0, users: 0, flags: 0 };

    return (
        <AdminLayout>
            <div className="mb-8">
                <h2 className="text-3xl font-light tracking-[0.2em] text-white">CAMPUS SENTIMENT OVERVIEW</h2>
                <div className="h-px w-full bg-glass-border mt-4" />
            </div>

            {error && <div className="p-4 bg-thermal-red/20 border border-thermal-red text-thermal-red mb-6">{error}</div>}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {/* Stats Matrix */}
                <div className="border border-glass-border p-6 bg-obsidian/50 backdrop-blur">
                    <div className="flex justify-between items-start mb-4">
                        <span className="text-xs text-text-secondary tracking-widest">GROSS CLOUT VALUE</span>
                        <Activity className="text-kinetic-green w-4 h-4" />
                    </div>
                    <div className="text-4xl text-kinetic-green font-light tracking-wider">
                        {loading ? '---' : `¢${latest.clout.toLocaleString()}`}
                    </div>
                </div>

                <div className="border border-glass-border p-6 bg-obsidian/50 backdrop-blur">
                    <div className="flex justify-between items-start mb-4">
                        <span className="text-xs text-text-secondary tracking-widest">ACTIVE TERMINALS</span>
                        <Users className="text-pulse-blue w-4 h-4" />
                    </div>
                    <div className="text-4xl text-pulse-blue font-light tracking-wider">
                        {loading ? '---' : latest.users.toLocaleString()}
                    </div>
                </div>

                <div className="border border-glass-border p-6 bg-obsidian/50 backdrop-blur">
                    <div className="flex justify-between items-start mb-4">
                        <span className="text-xs text-text-secondary tracking-widest">PENDING REVIEWS</span>
                        <AlertOctagon className={latest.flags > 0 ? "text-thermal-red w-4 h-4" : "text-text-secondary w-4 h-4"} />
                    </div>
                    <div className={`text-4xl font-light tracking-wider ${latest.flags > 0 ? 'text-thermal-red' : 'text-text-secondary'}`}>
                        {loading ? '---' : latest.flags.toLocaleString()}
                    </div>
                </div>
            </div>

            {/* Main Telemetry Chart */}
            <div className="border border-glass-border p-6 bg-obsidian/50 backdrop-blur h-96">
                <span className="text-xs text-text-secondary tracking-widest block mb-6">MACRO SENTIMENT TRACE</span>
                {loading ? (
                    <div className="w-full h-full flex items-center justify-center text-text-secondary animate-pulse">FETCHING TELEMETRY...</div>
                ) : (
                    <ResponsiveContainer width="100%" height="85%">
                        <LineChart data={history}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                            <XAxis dataKey="time" stroke="#8e8e93" fontSize={10} tickLine={false} axisLine={false} />
                            <YAxis stroke="#8e8e93" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => `¢${val / 1000}k`} />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#0f1115', border: '1px solid rgba(255,255,255,0.1)' }}
                                itemStyle={{ color: '#00ff66' }}
                                labelStyle={{ color: '#8e8e93' }}
                            />
                            <Line type="monotone" dataKey="clout" stroke="#00ff66" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                        </LineChart>
                    </ResponsiveContainer>
                )}
            </div>
        </AdminLayout>
    );
}
