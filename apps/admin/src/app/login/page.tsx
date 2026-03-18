"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { adminApi, setAdminToken } from '@/lib/api';

export default function AdminLoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const data = await adminApi.login(email, password);
            setAdminToken(data.token);
            router.push('/');
        } catch (err: any) {
            setError(err.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-obsidian text-white flex items-center justify-center p-6">
            <div className="w-full max-w-md border border-glass-border bg-obsidian/70 backdrop-blur p-8">
                <h1 className="text-2xl tracking-[0.3em] text-kinetic-green mb-2">BLITZR ADMIN</h1>
                <p className="text-text-secondary text-xs tracking-widest mb-8">SECURE ACCESS TERMINAL</p>

                {error && (
                    <div className="mb-6 text-thermal-red text-xs tracking-widest border border-thermal-red/40 p-3">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-xs tracking-widest text-text-secondary mb-2">ADMIN EMAIL</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-black/40 border border-glass-border p-3 text-sm text-white focus:outline-none focus:border-kinetic-green"
                            placeholder="admin@campus.edu"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-xs tracking-widest text-text-secondary mb-2">PASSWORD</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-black/40 border border-glass-border p-3 text-sm text-white focus:outline-none focus:border-kinetic-green"
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 text-xs tracking-[0.3em] bg-kinetic-green/20 border border-kinetic-green text-kinetic-green hover:bg-kinetic-green hover:text-black transition-all disabled:opacity-50"
                    >
                        {loading ? 'AUTHORIZING...' : 'ACCESS DASHBOARD'}
                    </button>
                </form>
            </div>
        </div>
    );
}
