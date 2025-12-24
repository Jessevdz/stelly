import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useOutletContext } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';

// Layouts
import { StoreLayout } from './layouts/StoreLayout';
import { PlatformLayout } from './layouts/PlatformLayout';
import { TenantLayout } from './layouts/TenantLayout';
import { DemoLayout, DemoContextType } from './layouts/DemoLayout';

// Public Store Pages
import { MenuPage } from './components/store/MenuPage';

// Shared Pages
import { LoginPage } from './pages/admin/Login';

// Platform Pages (Super Admin)
import { TenantsPage } from './pages/platform/Tenants';
import { PlatformDashboard } from './pages/platform/Dashboard';

// Tenant Pages (Restaurant Admin)
import { MenuBuilder } from './pages/tenant/MenuBuilder';
import { TenantDashboard } from './pages/tenant/Dashboard';
import { TenantSettings } from './pages/tenant/Settings';

// KDS
import { KitchenDisplay } from './pages/kitchen/KitchenDisplay';

// Demo Pages
import { SplitView } from './pages/demo/SplitView';
import { LandingPage } from './pages/demo/LandingPage';

// --- ADAPTER COMPONENT ---
// Bridges the DemoContext (theme override) to the StoreLayout props
function DemoStoreAdapter() {
    const { config } = useOutletContext<DemoContextType>();
    return (
        <div className="h-full w-full bg-white overflow-y-auto">
            <StoreLayout overrideConfig={config} />
        </div>
    );
}

function App() {
    // Helper to determine if we are on the dedicated demo domain
    const isDemoDomain = window.location.hostname.includes('demo');

    return (
        <AuthProvider>
            <CartProvider>
                <BrowserRouter>
                    <Routes>
                        {/* -----------------------------------------------------
                            0. LANDING PAGE (Demo Domain Only)
                           ----------------------------------------------------- */}
                        {isDemoDomain && (
                            <Route path="/" element={<LandingPage />} />
                        )}

                        {/* -----------------------------------------------------
                            1. PUBLIC STOREFRONT (Default Tenant Route)
                           ----------------------------------------------------- */}
                        <Route element={<StoreLayout />}>
                            <Route path="/" element={<MenuPage />} />
                        </Route>

                        {/* -----------------------------------------------------
                            2. KITCHEN DISPLAY SYSTEM 
                           ----------------------------------------------------- */}
                        <Route path="/kitchen" element={<KitchenDisplay />} />

                        {/* -----------------------------------------------------
                            3. AUTHENTICATION 
                           ----------------------------------------------------- */}
                        <Route path="/admin/login" element={<LoginPage />} />

                        {/* -----------------------------------------------------
                            4. SUPER ADMIN / PLATFORM PORTAL 
                           ----------------------------------------------------- */}
                        <Route path="/platform" element={<PlatformLayout />}>
                            <Route index element={<Navigate to="dashboard" replace />} />
                            <Route path="dashboard" element={<PlatformDashboard />} />
                            <Route path="tenants" element={<TenantsPage />} />
                            <Route path="settings" element={<div>Global Settings Placeholder</div>} />
                        </Route>

                        {/* -----------------------------------------------------
                            5. TENANT ADMIN / MANAGER PORTAL 
                           ----------------------------------------------------- */}
                        <Route path="/admin" element={<TenantLayout />}>
                            <Route index element={<Navigate to="dashboard" replace />} />
                            <Route path="dashboard" element={<TenantDashboard />} />
                            <Route path="menu" element={<MenuBuilder />} />
                            <Route path="staff" element={<div>Staff Management Placeholder</div>} />
                            <Route path="settings" element={<TenantSettings />} />
                        </Route>

                        {/* -----------------------------------------------------
                            6. DEMO EXPERIENCE (The "Omni-Shell") 
                           ----------------------------------------------------- */}
                        <Route path="/demo" element={<DemoLayout />}>
                            {/* Redirect root /demo to split view */}
                            <Route index element={<Navigate to="split" replace />} />
                            <Route path="split" element={<SplitView />} />

                            {/* UPDATED: Use Adapter to inject Demo Context */}
                            <Route path="store" element={<DemoStoreAdapter />}>
                                <Route index element={<MenuPage />} />
                            </Route>

                            <Route path="kitchen" element={<KitchenDisplay />} />

                            <Route path="admin" element={
                                <div className="h-full w-full bg-gray-50 overflow-y-auto">
                                    <TenantLayout />
                                </div>
                            }>
                                <Route index element={<Navigate to="dashboard" replace />} />
                                <Route path="dashboard" element={<TenantDashboard />} />
                                <Route path="menu" element={<MenuBuilder />} />
                                <Route path="settings" element={<TenantSettings />} />
                            </Route>
                        </Route>

                    </Routes>
                </BrowserRouter>
            </CartProvider>
        </AuthProvider>
    );
}

export default App;