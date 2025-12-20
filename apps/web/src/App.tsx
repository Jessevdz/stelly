import React from 'react';
import { useTenantConfig } from './hooks/useTenantConfig';
import { MenuGrid } from './components/MenuGrid';

function App() {
    const { config, loading, error } = useTenantConfig();

    if (loading) return (
        <div className="flex h-screen items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
    );

    if (error || !config) return (
        <div className="flex h-screen items-center justify-center bg-red-50 text-red-600 p-4">
            <div className="text-center">
                <h1 className="text-2xl font-bold">Store Unavailable</h1>
                <p>{error || "Configuration missing"}</p>
                <p className="text-xs text-gray-500 mt-4">Host: {window.location.host}</p>
            </div>
        </div>
    );

    // Dynamic Style Injection
    // We explicitly cast to CSSProperties to allow custom variables
    const themeStyles = {
        '--primary': config.primary_color,
        '--primary-fg': '#ffffff', // Could be calculated dynamically for contrast
    } as React.CSSProperties;

    return (
        <div style={themeStyles} className="min-h-screen bg-gray-50 text-gray-900 font-sans">
            {/* Header */}
            <header className="bg-primary text-white shadow-lg transition-colors duration-500">
                <div className="max-w-4xl mx-auto px-4 py-6">
                    <h1 className="text-3xl font-bold">{config.name}</h1>
                    <p className="opacity-90 text-sm mt-1">Order Online</p>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-4xl mx-auto mt-8">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-4 border-b border-gray-100 bg-gray-50">
                        <h2 className="font-semibold text-gray-700">Menu</h2>
                    </div>
                    <MenuGrid />
                </div>
            </main>

            {/* Footer */}
            <footer className="text-center text-gray-400 text-sm py-8">
                Powered by OmniOrder
            </footer>
        </div>
    );
}

export default App;