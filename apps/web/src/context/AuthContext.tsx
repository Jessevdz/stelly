import React from 'react';
import { AuthProvider as OidcProvider, useAuth as useOidcAuth, AuthProviderProps } from "react-oidc-context";

const oidcConfig: AuthProviderProps = {
    authority: "http://auth.localhost/application/o/omniorder/",
    client_id: "omniorder-web",
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

    // UPDATED CHECK: Trust the domain OR the path
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
                    name: "Demo Admin",
                    email: "demo@omniorder.localhost",
                    sub: "demo_admin"
                },
                access_token: demoToken
            },
            login: () => { }, // No-op
            logout: () => {
                sessionStorage.removeItem('demo_token');
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