import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Settings, SplitSquareVertical, RotateCcw, Palette, Check } from 'lucide-react';
import { THEME_PRESETS } from '../../utils/theme';
import { trackEvent } from '../../utils/analytics';

interface PersonaSwitcherProps {
    currentPreset: string;
    onPresetChange: (preset: string) => void;
}

export const PersonaSwitcher: React.FC<PersonaSwitcherProps> = ({ currentPreset, onPresetChange }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [showThemes, setShowThemes] = useState(false);

    // Ref for click-outside detection
    const switcherRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (switcherRef.current && !switcherRef.current.contains(event.target as Node)) {
                setShowThemes(false);
            }
        };

        if (showThemes) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showThemes]);

    const handleReset = async () => {
        if (!confirm("Reset Demo? Dit wist alle bestellingen en reset het menu.")) return;

        trackEvent('demo_reset', { from_path: location.pathname });

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
        <div
            ref={switcherRef}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[150] flex flex-col items-center gap-4 w-full max-w-sm px-4 md:w-auto"
        >
            {/* Theme Picker Popover (Appears Above) */}
            {showThemes && (
                <div className="bg-white/90 backdrop-blur-md border border-gray-200 p-2 rounded-2xl shadow-2xl animate-in slide-in-from-bottom-4 zoom-in-95 duration-200 mb-2 w-64">
                    <div className="px-3 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100 mb-1">
                        Selecteer Vibe:
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
                                        trackEvent('demo_theme_change', {
                                            preset: key,
                                            previous_preset: currentPreset
                                        });
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
            <div className="bg-neutral-900/95 backdrop-blur-md border border-neutral-700 p-1.5 rounded-full shadow-2xl flex items-center justify-between w-full md:w-auto md:justify-center gap-1">

                {/* Navigation Group */}
                <div className="flex gap-1 flex-1 md:flex-none justify-center md:justify-start">
                    <button
                        onClick={() => navigate('/demo/split')}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-bold transition-all ${location.pathname === '/demo/split' ? 'bg-white text-black shadow-lg' : 'text-neutral-400 hover:text-white hover:bg-white/10'}`}
                    >
                        <SplitSquareVertical size={18} />
                        <span className="hidden md:inline">Demo</span>
                    </button>

                    <button
                        onClick={() => navigate('/demo/admin/dashboard')}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-bold transition-all ${location.pathname.includes('admin') ? 'bg-white text-black shadow-lg' : 'text-neutral-400 hover:text-white hover:bg-white/10'}`}
                    >
                        <Settings size={18} />
                        <span className="hidden md:inline">Manager</span>
                    </button>
                </div>

                {/* Vertical Divider */}
                <div className="w-px h-6 bg-neutral-700 mx-1 shrink-0"></div>

                {/* Actions Group */}
                <div className="flex gap-1 flex-1 md:flex-none justify-center md:justify-start">
                    <button
                        onClick={() => {
                            if (!showThemes) trackEvent('demo_theme_menu_open');
                            setShowThemes(!showThemes);
                        }}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-bold transition-all ${showThemes ? 'bg-blue-600 text-white shadow-lg' : 'text-neutral-400 hover:text-white hover:bg-white/10'}`}
                        title="Switch Brand Vibe"
                    >
                        <Palette size={18} />
                        <span className="hidden md:inline">Vibe</span>
                    </button>

                    <button
                        onClick={handleReset}
                        className="flex items-center justify-center w-10 h-10 rounded-full text-red-400 hover:text-white hover:bg-red-500/20 transition-all shrink-0"
                        title="Reset Demo Environment"
                    >
                        <RotateCcw size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
};