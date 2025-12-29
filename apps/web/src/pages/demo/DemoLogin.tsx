import React, { useState } from 'react';
import { ArrowRight, Loader2, Sparkles, User, Mail, ShoppingBag } from 'lucide-react';
import { trackEvent, identifyUser } from '../../utils/analytics';

interface DemoLoginProps {
    onLogin: (token: string, user: any) => void;
}

export const DemoLogin: React.FC<DemoLoginProps> = ({ onLogin }) => {
    const [formData, setFormData] = useState({ name: '', email: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.email) return;

        setLoading(true);
        setError('');

        try {
            // Updated Endpoint: Generates ephemeral schema + seeds data
            const res = await fetch('/api/v1/sys/generate-demo-session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await res.json();

            if (res.ok) {
                // 1. Identify the session with the lead's email/name
                identifyUser({
                    email: formData.email,
                    name: formData.name,
                    is_demo_user: true
                });

                // 2. Track the conversion event
                trackEvent('demo_session_generated', {
                    schema: data.user.schema // Useful to debug specific tenant issues
                });
                // Pass token and user object back up
                onLogin(data.access_token, data.user);
            } else {
                trackEvent('demo_login_failed', { error: data.detail });
                setError(data.detail || 'Kon de omgeving niet aanmaken.');
            }
        } catch (err) {
            setError('Verbinding mislukt. Draait de backend?');
        } finally {
            setLoading(false);
        }
    };

    // Reusing the StellyLogo component from LandingPage for consistency
    const StellyLogo = ({ className = "" }: { className?: string }) => (
        <div className={`flex items-center gap-2.5 cursor-pointer group ${className}`}>
            {/* The Layered Bag Icon */}
            <div className="relative w-8 h-8">
                {/* 1. Red Base Layer (Shadow/Depth) */}
                {/* Represents the Red in the Belgian flag & adds depth */}
                <ShoppingBag
                    className="absolute top-[3px] left-[3px] text-red-600 fill-red-600 opacity-90 transition-transform duration-300 group-hover:translate-x-[1px] group-hover:translate-y-[1px]"
                    size={26}
                    strokeWidth={0}
                />

                {/* 2. Yellow Middle Layer (The 'Fries/Gold' Fill) */}
                {/* Represents the Yellow in the Belgian flag */}
                <ShoppingBag
                    className="absolute top-[1.5px] left-[1.5px] text-yellow-400 fill-yellow-400 transition-transform duration-300 group-hover:translate-x-[0.5px] group-hover:translate-y-[0.5px]"
                    size={26}
                    strokeWidth={0}
                />

                {/* 3. Black Top Layer (Structure/Outline) */}
                {/* Represents the Black in the Belgian flag & provides high contrast */}
                <ShoppingBag
                    className="relative z-10 text-slate-900 fill-none"
                    size={26}
                    strokeWidth={2.5}
                />
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-900 leading-none mt-0.5 group-hover:text-blue-600 transition-colors">
                Pakmee.be!
            </span>
        </div>
    );

    return (
        <div className="min-h-screen bg-white text-slate-900 font-sans flex flex-col items-center justify-center p-4 relative overflow-hidden">

            {/* --- Background Architecture (Matches LandingPage) --- */}
            {/* Subtle Grid Pattern */}
            <div className="absolute inset-0 h-full w-full bg-white bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none z-0"></div>
            {/* Top gradient fade */}
            <div className="absolute top-0 left-0 right-0 h-[500px] bg-gradient-to-b from-blue-50/80 to-transparent pointer-events-none z-0"></div>

            {/* Decorative Blobs (Subtle) */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-400/10 rounded-full blur-[100px] -z-10" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-400/10 rounded-full blur-[100px] -z-10" />

            <div className="max-w-md w-full bg-white border border-slate-200 rounded-2xl p-8 shadow-2xl shadow-slate-200/50 animate-in slide-in-from-bottom-8 duration-700 relative z-10">

                <div className="text-center mb-8">
                    <StellyLogo />

                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 mb-2">Start de Demo</h1>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-4">
                        {/* Name Input */}
                        <div className="relative group">
                            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={18} />
                            <input
                                type="text"
                                required
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full bg-white border border-slate-200 rounded-xl py-3 pl-11 pr-4 text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all shadow-sm"
                                placeholder="Jouw Naam"
                            />
                        </div>

                        {/* Email Input */}
                        <div className="relative group">
                            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={18} />
                            <input
                                type="email"
                                required
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="w-full bg-white border border-slate-200 rounded-xl py-3 pl-11 pr-4 text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all shadow-sm"
                                placeholder="E-mailadres"
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-red-600 text-sm text-center animate-in fade-in slide-in-from-top-2 font-medium">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-full hover:bg-blue-700 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-xl shadow-blue-600/20 active:scale-[0.98]"
                    >
                        {loading ? (
                            <>
                                <Loader2 size={18} className="animate-spin" />
                                <span>Omgeving klaarzetten...</span>
                            </>
                        ) : (
                            <>
                                <Sparkles size={18} className="text-blue-100" />
                                Start <ArrowRight size={18} className="opacity-80" />
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};