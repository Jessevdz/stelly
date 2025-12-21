import React from 'react';
import { Outlet } from 'react-router-dom';
import { useTenantConfig } from '../hooks/useTenantConfig';
import { FontLoader } from '../components/FontLoader';
import { CartDrawer } from '../components/CartDrawer';
import { CartFloatingButton } from '../components/store/CartFloatingButton';
import { applyTheme } from '../utils/theme';

export const StoreLayout = () => {
    const { config, loading, error } = useTenantConfig();

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

    return (
        <div style={themeStyles} className="min-h-screen bg-app text-text-main font-body">
            <FontLoader fontFamily={config.font_family} />

            <main className="pb-24 md:pb-12">
                <Outlet context={{ config }} />
            </main>

            <footer className="text-center text-text-muted text-sm py-8 border-t border-border">
                <p>© {new Date().getFullYear()} {config.name}</p>
                <p className="text-xs mt-1 opacity-60">Powered by OmniOrder</p>
            </footer>

            <CartDrawer />
            <CartFloatingButton />
        </div>
    );
};