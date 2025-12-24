import React from 'react';
import { AuthProvider as OidcProvider, useAuth as useOidcAuth, AuthProviderProps } from "react-oidc-context";

const oidcConfig: AuthProviderProps = {
    authority: "http://auth.localhost/application/o/stelly/",
    client_id: "stelly-web",
    redirect_uri: window.location.origin + "/admin/dashboard",
    onSigninCallback: () => {
        window.history.replaceState({}, document.title, window.location.pathname);
    }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
        <OidcProvider {...oidcConfig}>
            {children}
        </OidcProvider>
    );
};

// Compatibility Hook: Maps OIDC state OR Demo state to the interface
export const useAuth = () => {
    const auth = useOidcAuth();

    // Check if we are in the demo environment and have a token stored
    const demoToken = typeof window !== 'undefined' ? sessionStorage.getItem('demo_token') : null;

    // UPDATED: Attempt to parse demo user info
    let demoUser = null;
    try {
        const storedUser = sessionStorage.getItem('demo_user');
        if (storedUser) demoUser = JSON.parse(storedUser);
    } catch (e) {
        console.error("Failed to parse demo user", e);
    }

    const isDemoContext = typeof window !== 'undefined' && (
        window.location.pathname.startsWith('/demo') ||
        window.location.hostname.startsWith('demo.')
    );

    if (isDemoContext && demoToken) {
        return {
            token: demoToken,
            isAuthenticated: true,
            isLoading: false,
            user: {
                profile: {
                    // UPDATED: Use dynamic name if available
                    name: demoUser?.name || "Demo Admin",
                    email: demoUser?.email || "demo@stelly.localhost",
                    sub: "demo_admin",
                    // Also expose schema for debugging if needed
                    schema: demoUser?.schema
                },
                access_token: demoToken
            },
            login: () => { }, // No-op
            logout: () => {
                sessionStorage.removeItem('demo_token');
                sessionStorage.removeItem('demo_user'); // Clean up user too
                window.location.href = '/demo/split';
            },
            ...auth // fallback properties
        };
    }

    return {
        // Map OIDC 'access_token' to the generic 'token' used by fetch calls
        token: auth.user?.access_token || null,

        // Expose auth state
        isAuthenticated: auth.isAuthenticated,
        isLoading: auth.isLoading,
        user: auth.user,

        // Map generic actions to OIDC methods
        login: () => auth.signinRedirect(),
        logout: () => auth.signoutRedirect(),

        // Expose raw auth object for advanced usage
        ...auth
    };
};