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
        id: 'stelly',
        name: 'Stelly',
        desc: 'De kenmerkende platformstijl.',
        previewBg: '#FFFFFF',
        previewFg: '#2563EB'
    },
    {
        id: 'mono-luxe',
        name: 'Mono Luxe',
        desc: 'Hoog contrast, minimaal.',
        previewBg: '#F5F5F5',
        previewFg: '#000000'
    },
    {
        id: 'fresh-market',
        name: 'Fresh Market',
        desc: 'Organisch, vriendelijk, afgeronde hoeken.',
        previewBg: '#F1F8E9',
        previewFg: '#16A34A'
    },
    {
        id: 'tech-ocean',
        name: 'Tech Ocean',
        desc: 'Modern, betrouwbaar, geoptimaliseerd voor dark mode.',
        previewBg: '#0F172A',
        previewFg: '#3B82F6'
    },
];

export function TenantSettings() {
    const { token } = useAuth();
    const [config, setConfig] = useState<ThemeConfig>({
        preset: 'stelly',
        primary_color: '#2563EB',
        font_family: 'Inter',
        address: '',
        phone: '',
        email: '',
        operating_hours: [
            { label: 'Ma - Vr', time: '11:00 - 22:00' }
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
                    preset: data.preset || 'stelly',
                    primary_color: data.primary_color || '#2563EB',
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
                alert("Thema bijgewerkt! Refresh uw winkelpagina om de wijzigingen te zien.");
            }
        } catch (e) {
            alert("Instellingen opslaan mislukt");
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

    if (loading) return <div>Instellingen laden...</div>;

    return (
        <div className="max-w-4xl mx-auto pb-20">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Design</h1>
                    <p className="text-gray-500">Pas aan hoe klanten uw pagina zien.</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 bg-primary text-white px-6 py-2.5 rounded-lg font-bold shadow-lg hover:brightness-110 disabled:opacity-50 transition-all"
                    style={{ backgroundColor: config.primary_color }}
                >
                    <Save size={18} />
                    {saving ? 'Opslaan...' : 'Publiceren'}
                </button>
            </div>

            {/* 1. Preset Selection */}
            <section className="mb-10">
                <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <Palette size={20} className="text-gray-500" /> Thema
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {PRESETS.map(p => (
                        <div
                            key={p.id}
                            onClick={() => selectPreset(p.id)}
                            className={`
                                cursor-pointer rounded-xl border-2 overflow-hidden transition-all flex flex-col
                                ${config.preset === p.id
                                    ? 'border-blue-600 ring-4 ring-blue-500/20 shadow-xl scale-105'
                                    : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                                }
                            `}
                        >
                            <div className="h-24 flex items-center justify-center relative shrink-0" style={{ backgroundColor: p.previewBg }}>
                                <div className="bg-white p-2 rounded shadow-sm w-3/4 space-y-2">
                                    <div className="h-1.5 w-1/2 rounded-full" style={{ backgroundColor: p.previewFg }}></div>
                                    <div className="h-1.5 w-3/4 bg-gray-100 rounded-full"></div>
                                </div>
                                {config.preset === p.id && (
                                    <div className="absolute top-2 right-2 bg-blue-600 text-white p-1 rounded-full">
                                        <Check size={12} strokeWidth={4} />
                                    </div>
                                )}
                            </div>
                            <div className="p-3 bg-white flex-1 border-t border-gray-100">
                                <h3 className="font-bold text-gray-900 text-sm">{p.name}</h3>
                                <p className="text-[10px] text-gray-500 mt-1 leading-tight">{p.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* 4. Store Information */}
            <section className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm mt-8">
                <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <MapPin size={20} className="text-gray-500" /> Winkelgegevens
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Volledig Adres</label>
                        <input
                            type="text"
                            value={config.address}
                            onChange={(e) => setConfig({ ...config, address: e.target.value })}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="bv. Nieuwstraat 123, 1000 Brussel"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Telefoonnummer</label>
                        <input
                            type="text"
                            value={config.phone}
                            onChange={(e) => setConfig({ ...config, phone: e.target.value })}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="bv. 02 123 45 67"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">E-mailadres</label>
                        <input
                            type="email"
                            value={config.email}
                            onChange={(e) => setConfig({ ...config, email: e.target.value })}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="info@restaurant.be"
                        />
                    </div>
                </div>

                {/* --- Dynamic Hours Section --- */}
                <div className="border-t border-gray-100 pt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-3">Openingsuren</label>

                    <div className="space-y-3">
                        {config.operating_hours.map((hour, index) => (
                            <div key={index} className="flex gap-3 items-center">
                                <input
                                    type="text"
                                    value={hour.label}
                                    onChange={(e) => handleHourChange(index, 'label', e.target.value)}
                                    className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                    placeholder="bv. Weekdagen"
                                />
                                <input
                                    type="text"
                                    value={hour.time}
                                    onChange={(e) => handleHourChange(index, 'time', e.target.value)}
                                    className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                    placeholder="bv. 09:00 - 17:00"
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
                        <Plus size={16} /> Rij toevoegen
                    </button>
                </div>
            </section>
        </div>
    );
}