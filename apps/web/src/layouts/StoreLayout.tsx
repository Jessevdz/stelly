import React from 'react';
import { Outlet } from 'react-router-dom';
import { useTenantConfig, TenantConfig } from '../hooks/useTenantConfig';
import { FontLoader } from '../components/FontLoader';
import { CartDrawer } from '../components/CartDrawer';
import { CartFloatingButton } from '../components/store/CartFloatingButton';
import { OrderStatusBanner } from '../components/store/OrderStatusBanner';
import { applyTheme } from '../utils/theme';

interface StoreLayoutProps {
    overrideConfig?: TenantConfig | null;
}

export const StoreLayout: React.FC<StoreLayoutProps> = ({ overrideConfig }) => {
    // 1. Fetch Data (Always call hook to maintain order, even if unused)
    const { config: fetchedConfig, loading: fetchLoading, error: fetchError } = useTenantConfig();

    // 2. Determine Source of Truth
    // If overrideConfig is present (Demo Mode), use it. Otherwise use API data.
    const config = overrideConfig || fetchedConfig;
    const loading = overrideConfig ? false : fetchLoading;
    const error = overrideConfig ? null : fetchError;

    if (loading) return (
        <div className="h-screen flex items-center justify-center bg-gray-50">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
    );

    if (error || !config) return (
        <div className="h-screen flex items-center justify-center bg-red-50 text-red-600 p-4">
            <div className="text-center">
                <h1 className="text-2xl font-bold">Store Unavailable</h1>
                <p className="mt-2 text-sm">{error || "Configuration missing"}</p>
                <p className="text-xs text-gray-500 mt-4">Host: {window.location.host}</p>
            </div>
        </div>
    );

    const themeStyles = applyTheme(config.preset, {
        primary_color: config.primary_color,
        font_family: config.font_family,
    });

    const isStellyTheme = config.preset === 'stelly';

    return (
        <div style={themeStyles} className="min-h-screen bg-app text-text-main font-body relative isolation-auto">
            <FontLoader fontFamily={config.font_family} />

            {/* --- Stelly Theme Architecture --- */}
            {isStellyTheme && (
                <>
                    {/* Subtle Grid Pattern */}
                    <div className="absolute inset-0 h-full w-full bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none -z-10" />
                    {/* Top gradient fade */}
                    <div className="absolute top-0 left-0 right-0 h-[500px] bg-gradient-to-b from-blue-50/50 to-transparent pointer-events-none -z-10" />
                </>
            )}

            <OrderStatusBanner />

            <main className="pb-24 md:pb-12 pt-12 relative z-0">
                {/* Pass config down to pages via Context */}
                <Outlet context={{ config }} />
            </main>

            <footer className={`text-center text-text-muted text-sm py-8 border-t border-border ${isStellyTheme ? 'bg-white/50 backdrop-blur-sm' : ''}`}>
                <p>© {new Date().getFullYear()} {config.name}</p>
                <p className="text-xs mt-1 opacity-60">Powered by Stelly</p>
            </footer>

            <CartDrawer />
            <CartFloatingButton />
        </div>
    );
};