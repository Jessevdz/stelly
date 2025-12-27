import { useState, useEffect, useRef } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { MenuPage } from '../../components/store/MenuPage';
import { KitchenDisplay } from '../kitchen/KitchenDisplay';
import { WelcomeOverlay } from '../../components/demo/WelcomeOverlay';
import { applyTheme, THEME_PRESETS } from '../../utils/theme';
import { FontLoader } from '../../components/FontLoader';
import { CartDrawer } from '../../components/CartDrawer';
import { CartFloatingButton } from '../../components/store/CartFloatingButton';
import { OrderStatusBanner } from '../../components/store/OrderStatusBanner';
import { CartProvider } from '../../context/CartContext';
import { DemoContextType } from '../../layouts/DemoLayout';
import { Store, ChefHat, RotateCcw, Palette, Settings, Check } from 'lucide-react';
import { trackEvent } from '../../utils/analytics';

// Map IDs to Display Names manually since they aren't in the CSS object
const DISPLAY_NAMES: Record<string, string> = {
    'stelly': 'Stelly',
    'mono-luxe': 'Mono Luxe',
    'fresh-market': 'Fresh Market',
    'tech-ocean': 'Tech Ocean'
};

export function SplitView() {
    const { config, preset, updatePreset } = useOutletContext<DemoContextType>();
    const navigate = useNavigate();

    // Tour State
    const [tourActive, setTourActive] = useState(() => !sessionStorage.getItem('omni_demo_tour_seen'));
    const [tourStep, setTourStep] = useState(0);

    // Mobile UI State
    const [mobileTab, setMobileTab] = useState<'store' | 'kitchen'>('store');
    const [showMobileMenu, setShowMobileMenu] = useState(false);

    // Click outside handler for mobile menu
    const menuRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setShowMobileMenu(false);
            }
        };
        if (showMobileMenu) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showMobileMenu]);

    // Handle Reset
    const handleReset = async () => {
        if (!confirm("Reset Demo? Dit wist alle bestellingen en reset het menu.")) return;
        trackEvent('demo_reset', { from_path: 'mobile_header' });

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
        window.location.reload();
    };

    const handleTourComplete = () => {
        setTourActive(false);
        setMobileTab('store');
        sessionStorage.setItem('omni_demo_tour_seen', 'true');
    };

    // Auto-switch tabs during tour on mobile
    useEffect(() => {
        if (!tourActive) return;
        if (tourStep === 1) setMobileTab('store');
        if (tourStep === 2) setMobileTab('kitchen');
    }, [tourStep, tourActive]);

    if (!config) return <div className="h-screen bg-neutral-950 text-white flex items-center justify-center">Loading Demo...</div>;

    const themeStyles = applyTheme(preset, {
        primary_color: config.primary_color,
        font_family: config.font_family,
    });

    const isLeftSpotlight = tourActive && tourStep === 1;
    const isRightSpotlight = tourActive && tourStep === 2;

    // --- Layout Classes ---
    const mobileHiddenClass = "absolute opacity-0 pointer-events-none z-0 h-0 overflow-hidden";
    const mobileVisibleClass = "relative opacity-100 z-10 flex-1 min-h-0 flex flex-col";

    const leftPaneClass = `
        bg-white md:rounded-2xl overflow-hidden shadow-2xl border-neutral-800 flex flex-col transition-all duration-300 ease-in-out
        ${mobileTab === 'store' ? mobileVisibleClass : `hidden md:flex ${mobileHiddenClass} md:h-auto md:opacity-100 md:relative md:pointer-events-auto`}
        ${tourActive && tourStep === 2 ? 'md:opacity-30 md:blur-sm md:scale-[0.98]' : 'md:opacity-100 md:scale-100'}
        ${isLeftSpotlight ? 'z-[110] ring-4 ring-blue-500/50 shadow-[0_0_50px_rgba(0,0,0,0.5)]' : ''}
        w-full md:flex-1
    `;

    const rightPaneClass = `
        bg-neutral-900 md:rounded-2xl overflow-hidden shadow-2xl border-neutral-800 flex flex-col transition-all duration-300 ease-in-out
        ${mobileTab === 'kitchen' ? mobileVisibleClass : `hidden md:flex ${mobileHiddenClass} md:h-auto md:opacity-100 md:relative md:pointer-events-auto`}
        ${tourActive && tourStep === 1 ? 'md:opacity-30 md:blur-sm md:scale-[0.98]' : 'md:opacity-100 md:scale-100'}
        ${isRightSpotlight ? 'z-[110] ring-4 ring-blue-500/50 shadow-[0_0_50px_rgba(0,0,0,0.5)]' : ''}
        w-full md:flex-1
    `;

    return (
        // CHANGED: Use h-[100dvh] instead of h-screen to handle mobile browser address bars gracefully
        <div className="flex flex-col md:flex-row h-[100dvh] w-full bg-neutral-950 md:p-4 gap-0 md:gap-4 relative overflow-hidden">

            {/* --- STATIC HEADER (MOBILE ONLY) --- */}
            {/* CHANGED: Added 'sticky top-0' so it never scrolls away. Removed 'relative' from conditional as sticky handles it. */}
            <div className={`md:hidden shrink-0 sticky top-0 z-50 bg-neutral-900 border-b border-neutral-800 p-3 flex items-center justify-between gap-3 ${tourActive ? 'z-[201]' : ''}`}>

                {/* 1. Left: Reset Button */}
                <button
                    onClick={handleReset}
                    className="p-2.5 text-neutral-400 hover:text-red-400 hover:bg-white/5 rounded-full transition-colors flex items-center justify-center"
                    title="Reset Demo"
                >
                    <RotateCcw size={18} />
                </button>

                {/* 2. Center: View Toggle */}
                <div className="flex-1 bg-neutral-950 p-1 rounded-lg border border-neutral-800 flex relative max-w-[200px]">
                    <div
                        className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-neutral-800 border border-neutral-700 rounded-md transition-all duration-300 shadow-sm ${mobileTab === 'kitchen' ? 'left-[calc(50%+2px)]' : 'left-1'}`}
                    />

                    <button
                        onClick={() => setMobileTab('store')}
                        className={`flex-1 relative z-10 flex items-center justify-center gap-2 text-xs font-bold py-1.5 transition-colors ${mobileTab === 'store' ? 'text-white' : 'text-neutral-500'}`}
                    >
                        <Store size={14} /> Winkel
                    </button>
                    <button
                        onClick={() => setMobileTab('kitchen')}
                        className={`flex-1 relative z-10 flex items-center justify-center gap-2 text-xs font-bold py-1.5 transition-colors ${mobileTab === 'kitchen' ? 'text-blue-400' : 'text-neutral-500'}`}
                    >
                        <ChefHat size={14} /> Keuken
                    </button>
                </div>

                {/* 3. Right: Actions Group */}
                <div className="flex items-center gap-1" ref={menuRef}>
                    {/* Vibe Picker */}
                    <div className="relative">
                        <button
                            onClick={() => setShowMobileMenu(!showMobileMenu)}
                            className={`p-2.5 rounded-full transition-all border ${showMobileMenu ? 'bg-blue-600 text-white border-blue-500' : 'bg-transparent text-neutral-400 border-transparent hover:bg-neutral-800'}`}
                            title="Theme"
                        >
                            <Palette size={18} />
                        </button>

                        {/* Dropdown Menu */}
                        {showMobileMenu && (
                            <div className="absolute right-0 top-full mt-2 w-48 bg-neutral-800 border border-neutral-700 rounded-xl shadow-2xl p-2 animate-in slide-in-from-top-2 fade-in origin-top-right z-[60]">
                                <div className="px-3 py-2 text-[10px] font-bold text-neutral-500 uppercase tracking-wider border-b border-neutral-700 mb-1">
                                    Kies een stijl
                                </div>
                                <div className="space-y-1">
                                    {Object.keys(THEME_PRESETS).map((key) => {
                                        const isActive = preset === key;
                                        // FIX: Use the lookup map instead of trying to read property from CSS object
                                        const pName = DISPLAY_NAMES[key] || key;

                                        return (
                                            <button
                                                key={key}
                                                onClick={() => {
                                                    updatePreset(key);
                                                    setShowMobileMenu(false);
                                                }}
                                                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-blue-600 text-white' : 'text-gray-200 hover:bg-neutral-700'}`}
                                            >
                                                {pName}
                                                {isActive && <Check size={14} />}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Manager Dashboard (Top Level) */}
                    <button
                        onClick={() => navigate('/demo/admin/dashboard')}
                        className="p-2.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-full transition-colors"
                        title="Manager Dashboard"
                    >
                        <Settings size={18} />
                    </button>
                </div>
            </div>

            {tourActive && (
                <WelcomeOverlay
                    currentStep={tourStep}
                    onStepChange={setTourStep}
                    onComplete={handleTourComplete}
                />
            )}

            {/* LEFT: Customer View */}
            <div className={leftPaneClass}>
                {/* Desktop Notch */}
                <div className="hidden md:flex absolute top-0 left-0 w-full h-8 bg-neutral-100 border-b border-gray-200 z-50 items-center justify-center gap-2">
                    <div className="w-16 h-4 bg-black rounded-full" />
                </div>

                <div style={themeStyles} className="flex-1 overflow-y-auto bg-app text-text-main font-body pt-0 md:pt-8 relative scroll-smooth no-scrollbar h-full">
                    <FontLoader fontFamily={config.font_family} />
                    <CartProvider>
                        {/* Status Banner */}
                        <OrderStatusBanner className="absolute top-2 left-2 right-2 z-40 md:fixed md:top-8 md:left-auto md:right-auto md:w-[calc(50%-2rem)]" />

                        <div className="pb-24 min-h-full">
                            <MenuPage config={config} />
                        </div>
                        <CartFloatingButton />
                        <CartDrawer />
                    </CartProvider>
                </div>
            </div>

            {/* RIGHT: Kitchen View */}
            <div className={rightPaneClass}>
                <div className="hidden md:block absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 z-50 opacity-50" />
                <div className="flex-1 overflow-hidden h-full">
                    <KitchenDisplay />
                </div>
            </div>
        </div>
    );
}