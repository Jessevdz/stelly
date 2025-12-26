import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { MenuPage } from '../../components/store/MenuPage';
import { KitchenDisplay } from '../kitchen/KitchenDisplay';
import { WelcomeOverlay } from '../../components/demo/WelcomeOverlay';
import { applyTheme } from '../../utils/theme';
import { FontLoader } from '../../components/FontLoader';
import { CartDrawer } from '../../components/CartDrawer';
import { CartFloatingButton } from '../../components/store/CartFloatingButton';
import { OrderStatusBanner } from '../../components/store/OrderStatusBanner';
import { CartProvider } from '../../context/CartContext';
import { DemoContextType } from '../../layouts/DemoLayout';
import { Store, ChefHat } from 'lucide-react';

export function SplitView() {
    const { config, preset } = useOutletContext<DemoContextType>();
    const [tourActive, setTourActive] = useState(() => !sessionStorage.getItem('omni_demo_tour_seen'));
    const [tourStep, setTourStep] = useState(0);

    // Mobile Tab State
    const [mobileTab, setMobileTab] = useState<'store' | 'kitchen'>('store');

    const handleTourComplete = () => {
        setTourActive(false);
        // Reset to Store view so the user can start ordering immediately
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

    // Mobile Visibility Classes
    // We use absolute positioning/opacity on mobile to keep both mounted (for WebSockets)
    // but switch visibility. 
    const mobileHiddenClass = "absolute opacity-0 pointer-events-none z-0";
    const mobileVisibleClass = "relative opacity-100 z-10 flex-1 h-full";

    // UPDATED: Removed max-w on desktop, added md:flex-1 for equal width
    const leftPaneClass = `
        bg-white md:rounded-2xl overflow-hidden shadow-2xl border-neutral-800 flex flex-col transition-all duration-700 ease-in-out
        ${mobileTab === 'store' ? mobileVisibleClass : `hidden md:flex ${mobileHiddenClass} md:opacity-100 md:relative md:pointer-events-auto`}
        ${tourActive && tourStep === 2 ? 'md:opacity-30 md:blur-sm md:scale-[0.98]' : 'md:opacity-100 md:scale-100'}
        ${isLeftSpotlight ? 'z-[110] ring-4 ring-blue-500/50 shadow-[0_0_50px_rgba(0,0,0,0.5)]' : ''}
        w-full md:flex-1 h-full md:h-auto
    `;

    // UPDATED: Changed md:flex-[1.5] to md:flex-1 for equal width
    const rightPaneClass = `
        bg-neutral-900 md:rounded-2xl overflow-hidden shadow-2xl border-neutral-800 flex-col transition-all duration-700 ease-in-out
        ${mobileTab === 'kitchen' ? mobileVisibleClass : `hidden md:flex ${mobileHiddenClass} md:opacity-100 md:relative md:pointer-events-auto`}
        ${tourActive && tourStep === 1 ? 'md:opacity-30 md:blur-sm md:scale-[0.98]' : 'md:opacity-100 md:scale-100'}
        ${isRightSpotlight ? 'z-[110] ring-4 ring-blue-500/50 shadow-[0_0_50px_rgba(0,0,0,0.5)]' : ''}
        w-full md:flex-1 h-full md:h-auto
    `;

    return (
        <div className="flex flex-col md:flex-row h-screen w-full bg-neutral-950 md:p-4 gap-4 relative overflow-hidden">

            {/* Mobile View Toggler */}
            <div className={`md:hidden fixed top-4 left-1/2 -translate-x-1/2 ${tourActive ? 'z-[201]' : 'z-[100]'} bg-neutral-800/90 backdrop-blur border border-neutral-700 p-1 rounded-full flex gap-1 shadow-xl transition-all duration-300`}>
                <button
                    onClick={() => setMobileTab('store')}
                    className={`px-4 py-2 rounded-full flex items-center gap-2 text-sm font-bold transition-all ${mobileTab === 'store' ? 'bg-white text-black' : 'text-neutral-400'}`}
                >
                    <Store size={16} /> Winkel
                </button>
                <button
                    onClick={() => setMobileTab('kitchen')}
                    className={`px-4 py-2 rounded-full flex items-center gap-2 text-sm font-bold transition-all ${mobileTab === 'kitchen' ? 'bg-blue-600 text-white' : 'text-neutral-400'}`}
                >
                    <ChefHat size={16} /> Keuken
                </button>
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
                {/* Notch only on desktop */}
                <div className="hidden md:flex absolute top-0 left-0 w-full h-8 bg-neutral-100 border-b border-gray-200 z-50 items-center justify-center gap-2">
                    <div className="w-16 h-4 bg-black rounded-full" />
                </div>

                <div style={themeStyles} className="flex-1 overflow-y-auto bg-app text-text-main font-body pt-16 md:pt-8 relative scroll-smooth no-scrollbar">
                    <FontLoader fontFamily={config.font_family} />
                    <CartProvider>
                        <OrderStatusBanner className="fixed top-16 md:top-8 left-0 w-full z-40 animate-in slide-in-from-top duration-300" />
                        <div className="pb-24">
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
                <div className="flex-1 overflow-hidden pt-16 md:pt-0">
                    <KitchenDisplay />
                </div>
            </div>
        </div>
    );
}