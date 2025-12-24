import React, { useState } from 'react';
import { ArrowRight, MonitorPlay, Loader2, Sparkles, User, Mail } from 'lucide-react';

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
                // Pass token and user object back up
                onLogin(data.access_token, data.user);
            } else {
                setError(data.detail || 'Kon de omgeving niet aanmaken.');
            }
        } catch (err) {
            setError('Verbinding mislukt. Draait de backend?');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center p-4 text-white relative overflow-hidden font-sans">

            {/* Dynamic Background */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-50" />
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[100px] -z-10 animate-pulse" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-[100px] -z-10 animate-pulse delay-700" />

            <div className="max-w-md w-full bg-neutral-900/80 backdrop-blur-xl border border-neutral-800 rounded-3xl p-8 shadow-2xl animate-in slide-in-from-bottom-8 duration-700 relative overflow-hidden">

                {/* Decorative sheen */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />

                <div className="relative z-10">
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 mb-6 shadow-lg shadow-blue-900/20 group cursor-default transition-transform hover:scale-105">
                            <MonitorPlay size={32} className="text-white group-hover:rotate-3 transition-transform" />
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight mb-3">Welkom bij Stelly</h1>
                        <p className="text-neutral-400 text-sm leading-relaxed max-w-xs mx-auto">
                            Vul je gegevens in om een persoonlijke, tijdelijke demo-omgeving te starten.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-4">
                            {/* Name Input */}
                            <div className="relative group">
                                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500 group-focus-within:text-blue-500 transition-colors" size={18} />
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-3.5 pl-11 pr-4 text-white placeholder-neutral-600 focus:ring-2 focus:ring-blue-600/50 focus:border-blue-600 outline-none transition-all"
                                    placeholder="Jouw Naam"
                                />
                            </div>

                            {/* Email Input */}
                            <div className="relative group">
                                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500 group-focus-within:text-blue-500 transition-colors" size={18} />
                                <input
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-3.5 pl-11 pr-4 text-white placeholder-neutral-600 focus:ring-2 focus:ring-blue-600/50 focus:border-blue-600 outline-none transition-all"
                                    placeholder="E-mailadres"
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm text-center animate-in fade-in slide-in-from-top-2">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-white text-black font-bold py-3.5 rounded-xl hover:bg-neutral-200 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-lg hover:shadow-white/10 active:scale-[0.98]"
                        >
                            {loading ? (
                                <>
                                    <Loader2 size={18} className="animate-spin" />
                                    <span className="animate-pulse">Omgeving klaarzetten...</span>
                                </>
                            ) : (
                                <>
                                    <Sparkles size={18} className="text-blue-600 fill-blue-600/20" />
                                    Start Omgeving <ArrowRight size={18} className="opacity-50" />
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};