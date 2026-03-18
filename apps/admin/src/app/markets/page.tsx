"use client";

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';

export default function PropMarketsPanel() {
    return (
        <AdminLayout>
            <div className="mb-8">
                <h2 className="text-3xl font-light tracking-[0.2em] text-white">ACTIVE PROP MARKETS</h2>
                <div className="h-px w-full bg-glass-border mt-4" />
            </div>

            <div className="border border-glass-border p-6 bg-obsidian/50 backdrop-blur min-h-96 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-2 border-pulse-blue rounded-full border-t-transparent animate-spin mx-auto mb-6 opacity-80" />
                    <p className="text-text-secondary tracking-widest text-sm">TELEMETRY LINK PENDING...</p>
                    <p className="text-glass-border text-xs mt-2">Requires direct Postgres replica connection for live market resolution.</p>
                </div>
            </div>
        </AdminLayout>
    );
}
