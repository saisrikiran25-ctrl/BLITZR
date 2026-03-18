/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
"use client";

import { useState } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import { adminApi } from '@/lib/api';
import { ShieldAlert, ZapOff } from 'lucide-react';

export default function EmergencyControls() {
    const [delistTarget, setDelistTarget] = useState('');
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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

                {/* Targeted Delist */}
                <div className="border border-glass-border p-8 bg-obsidian/80 backdrop-blur relative">
                    <h3 className="text-xl tracking-widest mb-2 text-pulse-blue">TARGETED TERMINATION</h3>
                    <p className="text-text-secondary text-sm mb-8 leading-relaxed">
                        Force-delist a specific ticker by ID. All outstanding shares will be voided. This action cannot be undone. 
                    </p>

                    <div className="space-y-4">
                        <input 
                            type="text" 
                            placeholder="Enter Ticker ID (UUID)"
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
            </div>
        </AdminLayout>
    );
}
