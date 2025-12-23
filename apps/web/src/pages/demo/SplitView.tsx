import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { MenuPage } from '../../components/store/MenuPage';
import { KitchenDisplay } from '../kitchen/KitchenDisplay';
import { ThemeWidget } from '../../components/demo/ThemeWidget';
import { WelcomeOverlay } from '../../components/demo/WelcomeOverlay'; // <--- Imported
import { useTenantConfig, TenantConfig } from '../../hooks/useTenantConfig';
import { applyTheme } from '../../utils/theme';
import { FontLoader } from '../../components/FontLoader';
import { CartDrawer } from '../../components/CartDrawer';
import { CartFloatingButton } from '../../components/store/CartFloatingButton';
import { OrderStatusBanner } from '../../components/store/OrderStatusBanner';
import { CartProvider } from '../../context/CartContext';

export function SplitView() {
    const { config: initialConfig, loading } = useTenantConfig();
    const [tourActive, setTourActive] = useState(true);
    const [tourStep, setTourStep] = useState(0);
    const [localPreset, setLocalPreset] = useState<string | null>(null);
    const [demoToken, setDemoToken] = useState<string | null>(null);

    useEffect(() => {
        const authenticateDemo = async () => {
            try {
                // 1. Check if we already have a token in session
                const existing = sessionStorage.getItem('demo_token');
                if (existing) {
                    setDemoToken(existing);
                    return;
                }

                // 2. Perform Magic Login
                const res = await fetch('/api/v1/sys/demo-login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ code: 'OMNI2025' }) // Hardcoded demo code
                });

                if (res.ok) {
                    const data = await res.json();
                    setDemoToken(data.access_token);
                    sessionStorage.setItem('demo_token', data.access_token);
                }
            } catch (e) {
                console.error("Demo Auth failed", e);
            }
        };
        authenticateDemo();
    }, []);

    if (loading) return <div className="h-screen bg-neutral-900 text-white flex items-center justify-center">Loading Demo Experience...</div>;

    const activeConfig = {
        ...initialConfig,
        preset: localPreset || initialConfig?.preset || 'mono-luxe'
    } as TenantConfig;

    const themeStyles = applyTheme(activeConfig.preset, {
        primary_color: activeConfig.primary_color,
        font_family: activeConfig.font_family,
    });

    const updateTheme = async (presetId: string) => {
        setLocalPreset(presetId);
        if (!demoToken) return;

        try {
            await fetch('/api/v1/admin/settings', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${demoToken}` // Inject Magic Token
                },
                body: JSON.stringify({ ...activeConfig, preset: presetId })
            });
        } catch (e) {
            console.warn("Failed to persist theme", e);
        }
    };

    const leftPaneClass = tourActive && tourStep === 2 ? 'opacity-30 blur-sm scale-[0.98]' : 'opacity-100 scale-100';
    const rightPaneClass = tourActive && tourStep === 1 ? 'opacity-30 blur-sm scale-[0.98]' : 'opacity-100 scale-100';

    return (
        <div className="flex h-screen w-full bg-neutral-950 p-2 md:p-4 gap-4 relative">

            {/* Tour Overlay */}
            {tourActive && (
                <WelcomeOverlay
                    currentStep={tourStep}
                    onStepChange={setTourStep}
                    onComplete={() => setTourActive(false)}
                />
            )}

            {/* --- LEFT: The Customer (Storefront) --- */}
            <div className={`flex-1 relative bg-white rounded-2xl overflow-hidden shadow-2xl border border-neutral-800 flex flex-col max-w-[500px] mx-auto md:mx-0 md:max-w-none transition-all duration-700 ease-in-out ${leftPaneClass}`}>
                <div className="absolute top-0 left-0 w-full h-8 bg-neutral-100 border-b border-gray-200 z-50 flex items-center justify-center gap-2">
                    <div className="w-16 h-4 bg-black rounded-full" />
                </div>

                <div style={themeStyles} className="flex-1 overflow-y-auto bg-app text-text-main font-body pt-8 relative scroll-smooth no-scrollbar">
                    <FontLoader fontFamily={activeConfig.font_family} />

                    <CartProvider>
                        <ThemeWidget currentPreset={activeConfig.preset} onPresetChange={updateTheme} />
                        <OrderStatusBanner />
                        <Outlet context={{ config: activeConfig }} />
                        <div className="pb-24">
                            <MenuPage />
                        </div>
                        <CartFloatingButton />
                        <CartDrawer />
                    </CartProvider>
                </div>
            </div>

            {/* --- RIGHT: The Kitchen (KDS) --- */}
            <div className={`flex-[1.5] hidden md:flex relative bg-neutral-900 rounded-2xl overflow-hidden shadow-2xl border border-neutral-800 flex-col transition-all duration-700 ease-in-out ${rightPaneClass}`}>
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 z-50 opacity-50" />
                <div className="flex-1 overflow-hidden">
                    <KitchenDisplay />
                </div>
            </div>

        </div>
    );
}