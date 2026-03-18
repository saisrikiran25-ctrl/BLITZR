import Link from 'next/link';
import { ReactNode } from 'react';

export default function AdminLayout({ children }: { children: ReactNode }) {
    return (
        <div className="flex h-screen bg-obsidian text-white overflow-hidden">
            {/* Sidebar */}
            <aside className="w-64 border-r border-glass-border p-6 flex flex-col justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-widest text-kinetic-green mb-10">BLITZR<span className="text-pulse-blue text-sm align-top ml-1">ADMIN</span></h1>
                    <nav className="space-y-4 text-sm tracking-wider flex flex-col">
                        <Link href="/" className="hover:text-pulse-blue transition-colors">[/] SENTIMENT HUD</Link>
                        <Link href="/markets" className="hover:text-pulse-blue transition-colors">[/] PROP MARKETS</Link>
                        <Link href="/safety" className="hover:text-pulse-blue transition-colors">[/] CONTENT SAFETY</Link>
                        <Link href="/moderation" className="hover:text-pulse-blue transition-colors">[/] MODERATION QUEUE</Link>
                        <Link href="/controls" className="hover:thermal-red text-thermal-red transition-colors mt-8">[/] EMERGENCY</Link>
                    </nav>
                </div>
                <div className="text-[10px] text-text-secondary tracking-widest uppercase">
                    SYSTEM STATUS: NORMAL<br />
                    CONNECTION: SECURE
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto p-8 relative">
                {/* Ambient glow effects */}
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-pulse-blue opacity-5 rounded-full blur-[120px] pointer-events-none" />
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-kinetic-green opacity-5 rounded-full blur-[120px] pointer-events-none" />

                <div className="relative z-10">
                    {children}
                </div>
            </main>
        </div>
    );
}
