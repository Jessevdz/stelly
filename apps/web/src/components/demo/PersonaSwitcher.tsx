import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Settings, SplitSquareVertical, RotateCcw, Palette, Check, Store, ChefHat, X, SlidersHorizontal } from 'lucide-react';
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

    // Default to minimized on mobile to prevent immediate obstruction
    const [isMinimized, setIsMinimized] = useState(() => window.innerWidth < 768);

    // Check for mobile to adjust layout logic (Top-Right vs Bottom-Left)
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

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

    const tabs = [
        { id: 'split', label: 'Split', path: '/demo/split', icon: SplitSquareVertical, showOnMobile: true },
        { id: 'store', label: 'Winkel', path: '/demo/store', icon: Store, showOnMobile: false },
        { id: 'kitchen', label: 'Keuken', path: '/demo/kitchen', icon: ChefHat, showOnMobile: false },
        { id: 'admin', label: 'Manager', path: '/demo/admin/dashboard', icon: Settings, showOnMobile: true },
    ];

    // --- Minimized State (Floating Action Button) ---
    if (isMinimized) {
        return (
            <button
                onClick={() => setIsMinimized(false)}
                // Positioning Logic:
                // Mobile: Fixed Top-Right (Avoids Cart overlapping at bottom). Shape: Pill.
                // Desktop: Fixed Bottom-Left (Standard Admin area). Shape: Circle.
                className={`
                    fixed z-[150] flex items-center gap-2 bg-neutral-900 text-white shadow-2xl border border-neutral-700/50 backdrop-blur-sm
                    transition-all active:scale-95 animate-in fade-in duration-300 hover:bg-neutral-800
                    ${isMobile
                        ? 'top-20 right-4 px-4 py-3 rounded-full' // Mobile Pill
                        : 'bottom-8 left-8 w-14 h-14 justify-center rounded-full hover:scale-105' // Desktop Circle
                    }
                `}
                title="Open Demo Controls"
            >
                <SlidersHorizontal size={20} />
                {isMobile && <span className="font-bold text-sm tracking-wide">Demo</span>}

                {/* Attention Grabber: Pulsing Dot (To solve "users don't notice it") */}
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-blue-500 rounded-full animate-ping" />
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-blue-500 rounded-full border-2 border-white" />
            </button>
        );
    }

    // --- Expanded State ---
    // Mobile: Align End (Right), Top-down stack
    // Desktop: Align Start (Left), Bottom-up stack
    const containerPosition = isMobile
        ? 'top-20 right-4 items-end'
        : 'bottom-8 left-8 items-start';

    return (
        <div
            ref={switcherRef}
            className={`fixed z-[150] flex flex-col gap-2 animate-in fade-in zoom-in-95 duration-200 ${containerPosition}`}
        >
            {/* Theme Picker Popover */}
            {/* Mobile: Show BELOW main pill (order-last). Desktop: Show ABOVE (order-first). */}
            {showThemes && (
                <div className={`
                    bg-white/90 backdrop-blur-md border border-gray-200 p-2 rounded-2xl shadow-2xl w-64
                    ${isMobile ? 'order-last mt-1 origin-top-right' : 'order-first mb-1 origin-bottom-left'}
                `}>
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
            <div className="bg-neutral-900/95 backdrop-blur-md border border-neutral-700 p-1.5 rounded-full shadow-2xl flex items-center gap-1">

                {/* Minimize Button */}
                <button
                    onClick={() => setIsMinimized(true)}
                    className="w-8 h-8 flex items-center justify-center rounded-full text-neutral-400 hover:text-white hover:bg-white/10 transition-all mr-1"
                >
                    <X size={16} />
                </button>

                {/* Navigation Group */}
                <div className="flex gap-1">
                    {tabs.map(tab => {
                        const isActive = location.pathname.startsWith(tab.path);
                        const displayClass = tab.showOnMobile ? 'flex' : 'hidden md:flex';

                        return (
                            <button
                                key={tab.id}
                                onClick={() => navigate(tab.path)}
                                className={`${displayClass} items-center gap-2 px-4 py-2.5 rounded-full text-sm font-bold transition-all ${isActive ? 'bg-white text-black shadow-lg' : 'text-neutral-400 hover:text-white hover:bg-white/10'}`}
                            >
                                <tab.icon size={18} />
                                <span className="hidden md:inline">{tab.label}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Vertical Divider */}
                <div className="w-px h-6 bg-neutral-700 mx-1 shrink-0 hidden md:block"></div>

                {/* Actions Group */}
                <div className="flex gap-1">
                    <button
                        onClick={() => {
                            if (!showThemes) trackEvent('demo_theme_menu_open');
                            setShowThemes(!showThemes);
                        }}
                        className={`flex items-center gap-2 px-3 md:px-4 py-2.5 rounded-full text-sm font-bold transition-all ${showThemes ? 'bg-blue-600 text-white shadow-lg' : 'text-neutral-400 hover:text-white hover:bg-white/10'}`}
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