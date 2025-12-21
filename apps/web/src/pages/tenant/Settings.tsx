import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Check, Palette, Save, Type, MapPin, Trash2, Plus } from 'lucide-react';
import { THEME_PRESETS } from '../../utils/theme';

interface OperatingHour {
    label: string;
    time: string;
}

interface ThemeConfig {
    preset: string;
    primary_color: string;
    font_family: string;
    address: string;
    phone: string;
    email: string;
    operating_hours: OperatingHour[];
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
        font_family: 'Inter',
        address: '',
        phone: '',
        email: '',
        operating_hours: [
            { label: 'Mon - Fri', time: '11:00 AM - 10:00 PM' }
        ]
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
                setConfig({
                    preset: data.preset || 'mono-luxe',
                    primary_color: data.primary_color || '#000000',
                    font_family: data.font_family || 'Inter',
                    address: data.address || '',
                    phone: data.phone || '',
                    email: data.email || '',
                    operating_hours: data.operating_hours || []
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

    const selectPreset = (id: string) => {
        const styles = THEME_PRESETS[id] as React.CSSProperties;
        const defaultPrimary = styles['--color-primary' as keyof React.CSSProperties] as string;

        setConfig(prev => ({
            ...prev,
            preset: id,
            primary_color: defaultPrimary
        }));
    };

    // --- Dynamic Hours Handlers ---
    const handleHourChange = (index: number, field: keyof OperatingHour, value: string) => {
        const updated = [...config.operating_hours];
        updated[index][field] = value;
        setConfig({ ...config, operating_hours: updated });
    };

    const addHourRow = () => {
        setConfig({
            ...config,
            operating_hours: [...config.operating_hours, { label: '', time: '' }]
        });
    };

    const removeHourRow = (index: number) => {
        const updated = config.operating_hours.filter((_, i) => i !== index);
        setConfig({ ...config, operating_hours: updated });
    };

    if (loading) return <div>Loading Settings...</div>;

    return (
        <div className="max-w-4xl mx-auto pb-20">
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

            {/* 4. Store Information */}
            <section className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm mt-8">
                <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <MapPin size={20} className="text-gray-500" /> Store Information
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Full Address</label>
                        <input
                            type="text"
                            value={config.address}
                            onChange={(e) => setConfig({ ...config, address: e.target.value })}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="e.g. 123 Culinary Ave, New York, NY"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                        <input
                            type="text"
                            value={config.phone}
                            onChange={(e) => setConfig({ ...config, phone: e.target.value })}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="(555) 123-4567"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email</label>
                        <input
                            type="email"
                            value={config.email}
                            onChange={(e) => setConfig({ ...config, email: e.target.value })}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="hello@restaurant.com"
                        />
                    </div>
                </div>

                {/* --- Dynamic Hours Section --- */}
                <div className="border-t border-gray-100 pt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-3">Operating Hours</label>

                    <div className="space-y-3">
                        {config.operating_hours.map((hour, index) => (
                            <div key={index} className="flex gap-3 items-center">
                                <input
                                    type="text"
                                    value={hour.label}
                                    onChange={(e) => handleHourChange(index, 'label', e.target.value)}
                                    className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                    placeholder="e.g. Weekdays"
                                />
                                <input
                                    type="text"
                                    value={hour.time}
                                    onChange={(e) => handleHourChange(index, 'time', e.target.value)}
                                    className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                    placeholder="e.g. 9:00 AM - 5:00 PM"
                                />
                                <button
                                    onClick={() => removeHourRow(index)}
                                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={addHourRow}
                        className="mt-3 flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-700"
                    >
                        <Plus size={16} /> Add Hours Row
                    </button>
                </div>
            </section>
        </div>
    );
}