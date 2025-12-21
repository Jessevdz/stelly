import { useState, useEffect } from 'react';

export interface TenantConfig {
    name: string;
    primary_color: string;
    font_family: string;
    currency: string;
    preset: string;
}

export function useTenantConfig() {
    const [config, setConfig] = useState<TenantConfig | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
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