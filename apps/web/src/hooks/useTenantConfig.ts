import { useState, useEffect } from 'react';

export interface TenantConfig {
    name: string;
    primary_color: string;
    currency: string;
}

export function useTenantConfig() {
    const [config, setConfig] = useState<TenantConfig | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Determine the host (e.g., pizza.localhost)
        // In Docker/Nginx, this header is forwarded correctly.
        // Ensure you are accessing via port 80 (Nginx), not 5173 (Vite Direct) for this to work fully 
        // in a real domain scenario, though Vite proxy handles localhost dev.

        fetch('/api/v1/store/config')
            .then(async (res) => {
                if (!res.ok) throw new Error("Tenant not found");
                return res.json();
            })
            .then((data) => {
                setConfig(data);
                setLoading(false);
            })
            .catch((err) => {
                console.error(err);
                setError("Failed to load store configuration.");
                setLoading(false);
            });
    }, []);

    return { config, loading, error };
}