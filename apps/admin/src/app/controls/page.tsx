/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
"use client";

import { useState } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import { adminApi } from '@/lib/api';
import { ShieldAlert, ZapOff, PauseCircle, UserX } from 'lucide-react';

export default function EmergencyControls() {
    const [delistTarget, setDelistTarget] = useState('');
    const [delistEmail, setDelistEmail] = useState('');
    const [pauseConfirmText, setPauseConfirmText] = useState('');
    const [status, setStatus] = useState<string | null>(null);

    const handleFreezeAll = async () => {
        if (!confirm('WARNING: This will instantly halt trading on ALL active markets for 24 hours. Proceed?')) return;
        try {
            setStatus('Executing global freeze...');
            const res = await adminApi.freezeAllMarkets();
            setStatus(`SUCCESS: ${res.message || 'Markets frozen.'}`);
        } catch (e: any) {
            setStatus(`ERROR: ${e.message}`);
        }
    };

    /**
     * Pause all campus markets — requires typing "CONFIRM PAUSE" exactly.
     * Safety gate prevents accidental trigger.
     */
    const handlePauseCampus = async () => {
        try {
            setStatus('Pausing all campus markets...');
            const res = await adminApi.pauseAllCampusMarkets(pauseConfirmText);
            setStatus(`SUCCESS: ${res.message}`);
            setPauseConfirmText('');
        } catch (e: any) {
            setStatus(`ERROR: ${e.message}`);
        }
    };

    const handleDelist = async () => {
        if (!delistTarget) return;
        if (!confirm(`WARNING: Delisting ${delistTarget} is irreversible. Proceed?`)) return;
        try {
            setStatus(`Executing hard delist on ${delistTarget}...`);
            await adminApi.delistTicker(delistTarget);
            setStatus(`SUCCESS: ${delistTarget} has been removed from the exchange.`);
            setDelistTarget('');
        } catch (e: any) {
            setStatus(`ERROR: ${e.message}`);
        }
    };

    const handleDelistByEmail = async () => {
        if (!delistEmail) return;
        if (!confirm(`WARNING: Delisting ticker for ${delistEmail} is irreversible. Proceed?`)) return;
        try {
            setStatus(`Looking up and delisting ticker for ${delistEmail}...`);
            const res = await adminApi.delistByEmail(delistEmail);
            setStatus(`SUCCESS: ${res.message}`);
            setDelistEmail('');
        } catch (e: any) {
            setStatus(`ERROR: ${e.message}`);
        }
    };

    const pauseReady = pauseConfirmText === 'CONFIRM PAUSE';

    return (
        <AdminLayout>
            <div className="mb-8 flex items-center gap-4">
                <ShieldAlert className="text-thermal-red w-8 h-8" />
                <h2 className="text-3xl font-light tracking-[0.2em] text-thermal-red">EMERGENCY CONTROLS</h2>
            </div>
            <div className="h-px w-full bg-thermal-red/50 mt-4 mb-8" />

            {status && (
                <div className="mb-8 p-4 border border-pulse-blue bg-pulse-blue/10 text-pulse-blue text-sm tracking-widest font-mono">
                    &gt; {status}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                {/* Global Kill Switch */}
                <div className="border border-thermal-red/50 p-8 bg-obsidian/80 backdrop-blur relative overflow-hidden group hover:border-thermal-red transition-colors">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-thermal-red/5 rounded-full blur-2xl group-hover:bg-thermal-red/20 transition-all" />

                    <ZapOff className="text-thermal-red w-12 h-12 mb-6" />
                    <h3 className="text-xl tracking-widest mb-2 text-white">GLOBAL CIRCUIT BREAKER</h3>
                    <p className="text-text-secondary text-sm mb-8 leading-relaxed">
                        Instantly triggers a 24-hour hard-freeze on every active market. Use only in event of catastrophic systemic failure or mass coordinated manipulation.
                    </p>

                    <button
                        onClick={handleFreezeAll}
                        className="w-full py-4 bg-thermal-red/20 text-thermal-red border border-thermal-red/50 hover:bg-thermal-red hover:text-white transition-all tracking-[0.3em] text-sm"
                    >
                        INITIATE GLOBAL HALT
                    </button>
                </div>

                {/* Pause All Campus Markets with CONFIRM PAUSE gate */}
                <div className="border border-amber-500/50 p-8 bg-obsidian/80 backdrop-blur relative">
                    <PauseCircle className="text-amber-400 w-12 h-12 mb-6" />
                    <h3 className="text-xl tracking-widest mb-2 text-amber-400">PAUSE ALL CAMPUS MARKETS</h3>
                    <p className="text-text-secondary text-sm mb-4 leading-relaxed">
                        Sets all tickers to MANUAL_FROZEN and all open prop events to PAUSED. Auto-resumes after 24 hours via cron.
                    </p>
    <p className="text-text-secondary text-xs mb-4 tracking-widest">
                        Type <span className="text-amber-400 font-mono">CONFIRM PAUSE</span> to activate
                        (this exact text is validated server-side):
                    </p>
                    <input
                        type="text"
                        placeholder="CONFIRM PAUSE"
                        className="w-full bg-black/50 border border-glass-border p-3 text-white placeholder-text-secondary focus:outline-none focus:border-amber-500 font-mono text-sm tracking-widest mb-4"
                        value={pauseConfirmText}
                        onChange={(e) => setPauseConfirmText(e.target.value)}
                    />
                    <button
                        onClick={handlePauseCampus}
                        disabled={!pauseReady}
                        className={`w-full py-4 border transition-all tracking-[0.2em] text-sm ${
                            pauseReady
                                ? 'bg-amber-400/20 text-amber-400 border-amber-400/50 hover:bg-amber-400 hover:text-black'
                                : 'bg-surface text-text-secondary border-glass-border cursor-not-allowed opacity-50'
                        }`}
                    >
                        PAUSE ALL MARKETS
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Targeted Delist by Ticker ID */}
                <div className="border border-glass-border p-8 bg-obsidian/80 backdrop-blur relative">
                    <h3 className="text-xl tracking-widest mb-2 text-pulse-blue">TARGETED TERMINATION</h3>
                    <p className="text-text-secondary text-sm mb-8 leading-relaxed">
                        Force-delist a specific ticker by ID. All outstanding shares will be voided. This action cannot be undone.
                    </p>

                    <div className="space-y-4">
                        <input
                            type="text"
                            placeholder="Enter Ticker ID (e.g. PRIYA)"
                            className="w-full bg-black/50 border border-glass-border p-4 text-white placeholder-text-secondary focus:outline-none focus:border-pulse-blue font-mono text-sm tracking-wide"
                            value={delistTarget}
                            onChange={(e) => setDelistTarget(e.target.value)}
                        />
                        <button
                            onClick={handleDelist}
                            className="w-full py-4 bg-pulse-blue/10 text-pulse-blue border border-pulse-blue/30 hover:bg-pulse-blue hover:text-black transition-all tracking-[0.2em] text-sm"
                        >
                            EXECUTE PURGE
                        </button>
                    </div>
                </div>

                {/* Manual Delist by Email */}
                <div className="border border-glass-border p-8 bg-obsidian/80 backdrop-blur relative">
                    <UserX className="text-thermal-red w-10 h-10 mb-4" />
                    <h3 className="text-xl tracking-widest mb-2 text-thermal-red">DELIST BY EMAIL</h3>
                    <p className="text-text-secondary text-sm mb-8 leading-relaxed">
                        Enter a student&apos;s college email to look up and delist their ticker. All backers will be refunded.
                    </p>

                    <div className="space-y-4">
                        <input
                            type="email"
                            placeholder="student@college.edu"
                            className="w-full bg-black/50 border border-glass-border p-4 text-white placeholder-text-secondary focus:outline-none focus:border-thermal-red font-mono text-sm tracking-wide"
                            value={delistEmail}
                            onChange={(e) => setDelistEmail(e.target.value)}
                        />
                        <button
                            onClick={handleDelistByEmail}
                            className="w-full py-4 bg-thermal-red/10 text-thermal-red border border-thermal-red/30 hover:bg-thermal-red hover:text-white transition-all tracking-[0.2em] text-sm"
                        >
                            DELIST BY EMAIL
                        </button>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
