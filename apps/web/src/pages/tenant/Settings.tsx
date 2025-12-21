import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Check, Palette, Save, Type } from 'lucide-react';
import { THEME_PRESETS } from '../../utils/theme';

interface ThemeConfig {
    preset: string;
    primary_color: string;
    font_family: string;
}

const PRESETS = [
    {
        id: 'mono-luxe',
        name: 'Mono Luxe',
        desc: 'High contrast, sophisticated, minimal.',
        previewBg: '#F5F5F5',
        previewFg: '#000000'
    },
    {
        id: 'fresh-market',
        name: 'Fresh Market',
        desc: 'Organic, friendly, rounded corners.',
        previewBg: '#F1F8E9',
        previewFg: '#4CAF50'
    },
    {
        id: 'tech-ocean',
        name: 'Tech Ocean',
        desc: 'Modern, trustworthy, dark mode optimized.',
        previewBg: '#0F172A',
        previewFg: '#2563EB'
    },
];

export function TenantSettings() {
    const { token } = useAuth();
    const [config, setConfig] = useState<ThemeConfig>({
        preset: 'mono-luxe',
        primary_color: '#000000',
        font_family: 'Inter'
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Fetch existing settings
    useEffect(() => {
        if (!token) return;

        fetch('/api/v1/admin/settings', {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(res => res.json())
            .then(data => {
                // Ensure we have a valid preset default if the DB returns null/empty
                setConfig({
                    preset: data.preset || 'mono-luxe',
                    primary_color: data.primary_color || '#000000',
                    font_family: data.font_family || 'Inter'
                });
                setLoading(false);
            })
            .catch(err => console.error(err));
    }, [token]);

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch('/api/v1/admin/settings', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(config)
            });
            if (res.ok) {
                alert("Theme updated! Refresh your store page to see changes.");
            }
        } catch (e) {
            alert("Failed to save settings");
        } finally {
            setSaving(false);
        }
    };

    // When a preset is clicked, auto-fill the defaults from that preset
    const selectPreset = (id: string) => {
        const styles = THEME_PRESETS[id] as React.CSSProperties;
        // Extract the default primary color from the preset definition for the input
        const defaultPrimary = styles['--color-primary' as keyof React.CSSProperties] as string;

        setConfig(prev => ({
            ...prev,
            preset: id,
            primary_color: defaultPrimary
        }));
    };

    if (loading) return <div>Loading Settings...</div>;

    return (
        <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Storefront Appearance</h1>
                    <p className="text-gray-500">Customize how your customers see your brand.</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 bg-primary text-white px-6 py-2.5 rounded-lg font-bold shadow-lg hover:brightness-110 disabled:opacity-50 transition-all"
                    style={{ backgroundColor: config.primary_color }}
                >
                    <Save size={18} />
                    {saving ? 'Saving...' : 'Publish Changes'}
                </button>
            </div>

            {/* 1. Preset Selection */}
            <section className="mb-10">
                <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <Palette size={20} className="text-gray-500" /> Theme Preset
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {PRESETS.map(p => (
                        <div
                            key={p.id}
                            onClick={() => selectPreset(p.id)}
                            className={`
                                cursor-pointer rounded-xl border-2 overflow-hidden transition-all
                                ${config.preset === p.id
                                    ? 'border-blue-600 ring-4 ring-blue-500/20 shadow-xl scale-105'
                                    : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                                }
                            `}
                        >
                            {/* Preview Window */}
                            <div className="h-32 flex items-center justify-center relative" style={{ backgroundColor: p.previewBg }}>
                                <div className="bg-white p-3 rounded shadow-sm w-3/4 space-y-2">
                                    <div className="h-2 w-1/2 rounded-full" style={{ backgroundColor: p.previewFg }}></div>
                                    <div className="h-2 w-3/4 bg-gray-100 rounded-full"></div>
                                </div>
                                {config.preset === p.id && (
                                    <div className="absolute top-2 right-2 bg-blue-600 text-white p-1 rounded-full">
                                        <Check size={14} strokeWidth={4} />
                                    </div>
                                )}
                            </div>
                            {/* Meta */}
                            <div className="p-4 bg-white">
                                <h3 className="font-bold text-gray-900">{p.name}</h3>
                                <p className="text-xs text-gray-500 mt-1">{p.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* 2. Color Overrides */}
                <section className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full border border-gray-300" style={{ backgroundColor: config.primary_color }} />
                        Brand Color
                    </h2>
                    <div className="flex gap-4">
                        <input
                            type="color"
                            value={config.primary_color}
                            onChange={(e) => setConfig({ ...config, primary_color: e.target.value })}
                            className="h-12 w-12 p-1 border rounded cursor-pointer"
                        />
                        <div className="flex-1">
                            <input
                                type="text"
                                value={config.primary_color}
                                onChange={(e) => setConfig({ ...config, primary_color: e.target.value })}
                                className="w-full px-4 py-3 border rounded-lg font-mono uppercase text-gray-700 focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                            <p className="text-xs text-gray-400 mt-2">Overrides the preset's default primary color.</p>
                        </div>
                    </div>
                </section>

                {/* 3. Typography */}
                <section className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <Type size={20} className="text-gray-500" /> Typography
                    </h2>
                    <select
                        value={config.font_family}
                        onChange={(e) => setConfig({ ...config, font_family: e.target.value })}
                        className="w-full px-4 py-3 border rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                        <option value="Inter">Inter (Clean Sans)</option>
                        <option value="Playfair Display">Playfair Display (Elegant Serif)</option>
                        <option value="Oswald">Oswald (Strong Condensed)</option>
                        <option value="Lato">Lato (Humanist Sans)</option>
                    </select>
                    <div className="mt-4 p-4 bg-gray-50 rounded border text-center">
                        <p style={{ fontFamily: config.font_family }} className="text-xl">The quick brown fox jumps.</p>
                    </div>
                </section>
            </div>
        </div>
    );
}