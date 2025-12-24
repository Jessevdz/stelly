import { useState, useEffect } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { PersonaSwitcher } from '../components/demo/PersonaSwitcher';
import { useTenantConfig, TenantConfig } from '../hooks/useTenantConfig';
import { DemoLogin } from '../pages/demo/DemoLogin';

export interface DemoContextType {
    config: TenantConfig | null;
    preset: string;
    updatePreset: (newPreset: string) => Promise<void>;
}

export const DemoLayout = () => {
    // 1. Environment Check
    const isDemoDomain = window.location.hostname.includes('demo') || window.location.hostname.includes('localhost');
    const { config: initialConfig } = useTenantConfig();

    // 2. State
    const [demoToken, setDemoToken] = useState<string | null>(() => sessionStorage.getItem('demo_token'));
    const [activePreset, setActivePreset] = useState<string>('mono-luxe');

    useEffect(() => {
        if (initialConfig?.preset) {
            setActivePreset(initialConfig.preset);
        }
    }, [initialConfig]);

    // UPDATED: Accept user object
    const handleLoginSuccess = (token: string, user: any) => {
        sessionStorage.setItem('demo_token', token);
        sessionStorage.setItem('demo_user', JSON.stringify(user)); // Persist user details
        setDemoToken(token);
    };

    const handlePresetChange = async (newPreset: string) => {
        setActivePreset(newPreset);
        if (!demoToken || !initialConfig) return;

        try {
            await fetch('/api/v1/admin/settings', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${demoToken}`
                },
                body: JSON.stringify({
                    ...initialConfig,
                    preset: newPreset,
                    primary_color: getPresetDefaultColor(newPreset)
                })
            });
        } catch (e) {
            console.warn("Failed to persist theme", e);
        }
    };

    if (!isDemoDomain) return <Navigate to="/" replace />;

    // If no token, show the Login Screen
    if (!demoToken) {
        return <DemoLogin onLogin={handleLoginSuccess} />;
    }

    const demoContext: DemoContextType = {
        config: initialConfig ? { ...initialConfig, preset: activePreset } : null,
        preset: activePreset,
        updatePreset: handlePresetChange
    };

    return (
        <div className="min-h-screen bg-neutral-950 font-sans selection:bg-blue-500 selection:text-white">
            <main className="relative h-screen w-screen overflow-hidden">
                <Outlet context={demoContext} />
            </main>

            <PersonaSwitcher
                currentPreset={activePreset}
                onPresetChange={handlePresetChange}
            />
        </div>
    );
};

function getPresetDefaultColor(preset: string): string {
    switch (preset) {
        case 'fresh-market': return '#16A34A';
        case 'tech-ocean': return '#3B82F6';
        default: return '#000000';
    }
}