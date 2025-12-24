import { useState, useRef, useEffect } from 'react'; // <--- Added useRef, useEffect
import { useNavigate, useLocation } from 'react-router-dom';
import { ChefHat, Store, Settings, SplitSquareVertical, RotateCcw, Palette, Check } from 'lucide-react';
import { THEME_PRESETS } from '../../utils/theme';

interface PersonaSwitcherProps {
    currentPreset: string;
    onPresetChange: (preset: string) => void;
}

export const PersonaSwitcher: React.FC<PersonaSwitcherProps> = ({ currentPreset, onPresetChange }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [showThemes, setShowThemes] = useState(false);

    // 1. Create a ref for the container
    const switcherRef = useRef<HTMLDivElement>(null);

    // 2. Add Click Outside Logic
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (switcherRef.current && !switcherRef.current.contains(event.target as Node)) {
                setShowThemes(false);
            }
        };

        // Only add listener if menu is open
        if (showThemes) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showThemes]);

    const tabs = [
        { id: 'split', label: 'Naast elkaar', path: '/demo/split', icon: SplitSquareVertical },
        { id: 'store', label: 'Website', path: '/demo/store', icon: Store },
        { id: 'kds', label: 'Keuken', path: '/demo/kitchen', icon: ChefHat },
        { id: 'admin', label: 'Manager', path: '/demo/admin/dashboard', icon: Settings },
    ];

    const handleReset = async () => {
        if (!confirm("Reset Demo?\n\nThis will clear all orders and reset branding.")) return;
        const token = sessionStorage.getItem('demo_token');
        if (token) {
            try {
                await fetch('/api/v1/sys/reset-demo', {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
            } catch (e) { console.error(e); }
        }
        sessionStorage.removeItem('omni_demo_tour_seen');
        window.location.href = '/demo/split';
    };

    return (
        // 3. Attach ref to the main wrapper
        <div
            ref={switcherRef}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] flex flex-col items-center gap-4"
        >

            {/* Theme Picker Popover (Appears Above) */}
            {showThemes && (
                <div className="bg-white/90 backdrop-blur-md border border-gray-200 p-2 rounded-2xl shadow-2xl animate-in slide-in-from-bottom-4 zoom-in-95 duration-200 mb-2 w-64">
                    <div className="px-3 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100 mb-1">
                        Selecteer design:
                    </div>
                    <div className="space-y-1">
                        {Object.keys(THEME_PRESETS).map((key) => {
                            const isActive = currentPreset === key;
                            // @ts-ignore
                            const presetName = THEME_PRESETS[key]['name'] || key;

                            return (
                                <button
                                    key={key}
                                    onClick={() => {
                                        onPresetChange(key);
                                        setShowThemes(false);
                                    }}
                                    className={`
                                        w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-between
                                        ${isActive ? 'bg-black text-white shadow-md' : 'text-gray-700 hover:bg-gray-100'}
                                    `}
                                >
                                    {presetName}
                                    {isActive && <Check size={14} />}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Main Navigation Pill */}
            <div className="bg-neutral-900/90 backdrop-blur-md border border-neutral-700 p-1.5 rounded-full shadow-2xl flex items-center gap-1 animate-in slide-in-from-bottom-10 duration-500">
                {tabs.map((tab) => {
                    const isActive = location.pathname === tab.path;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => navigate(tab.path)}
                            className={`
                                flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-bold transition-all
                                ${isActive
                                    ? 'bg-white text-black shadow-lg scale-105'
                                    : 'text-neutral-400 hover:text-white hover:bg-white/10'
                                }
                            `}
                        >
                            <tab.icon size={18} />
                            <span className="hidden md:inline">{tab.label}</span>
                        </button>
                    );
                })}

                {/* Divider */}
                <div className="w-px h-6 bg-neutral-700 mx-2"></div>

                {/* Theme Toggle */}
                <button
                    onClick={() => setShowThemes(!showThemes)}
                    className={`
                        flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-bold transition-all
                        ${showThemes
                            ? 'bg-blue-600 text-white shadow-lg'
                            : 'text-neutral-400 hover:text-white hover:bg-white/10'
                        }
                    `}
                    title="Switch Brand Vibe"
                >
                    <Palette size={18} />
                    <span className="hidden md:inline">Vibe</span>
                </button>

                {/* Reset Button */}
                <button
                    onClick={handleReset}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-full text-sm font-bold text-red-400 hover:text-white hover:bg-red-500/20 transition-all ml-1"
                    title="Reset Demo Environment"
                >
                    <RotateCcw size={18} />
                </button>
            </div>
        </div>
    );
};