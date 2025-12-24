import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useOutletContext } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';

// Layouts
import { StoreLayout } from './layouts/StoreLayout';
import { TenantLayout } from './layouts/TenantLayout';
import { DemoLayout, DemoContextType } from './layouts/DemoLayout';

// Public Store Pages
import { MenuPage } from './components/store/MenuPage';

// Tenant Pages (Restaurant Admin) - Reused inside Demo
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
    return (
        <AuthProvider>
            <CartProvider>
                <BrowserRouter>
                    <Routes>
                        {/* -----------------------------------------------------
                            1. ENTRY POINT: LANDING PAGE
                           ----------------------------------------------------- */}
                        <Route path="/" element={<LandingPage />} />

                        {/* -----------------------------------------------------
                            2. THE DEMO EXPERIENCE (Restricted Scope)
                           ----------------------------------------------------- */}
                        <Route path="/demo" element={<DemoLayout />}>
                            {/* Default to Split View */}
                            <Route index element={<Navigate to="split" replace />} />

                            {/* The Main "Omni" View */}
                            <Route path="split" element={<SplitView />} />

                            {/* Individual Views (Wrapped in Demo Context) */}
                            <Route path="store" element={<DemoStoreAdapter />}>
                                <Route index element={<MenuPage />} />
                            </Route>

                            <Route path="kitchen" element={<KitchenDisplay />} />

                            {/* Embedded Admin Dashboard for Demo Users */}
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

                        {/* -----------------------------------------------------
                            3. CATCH ALL - Redirect everything else to Landing
                           ----------------------------------------------------- */}
                        <Route path="*" element={<Navigate to="/" replace />} />

                        {/* -----------------------------------------------------
                            DISABLED ROUTES (Platform/Production)
                            To re-enable production features, uncomment below.
                           ----------------------------------------------------- */}
                        {/* <Route path="/kitchen" element={<KitchenDisplay />} />
                        <Route path="/admin/login" element={<LoginPage />} />
                        
                        <Route path="/platform" element={<PlatformLayout />}>
                            <Route index element={<Navigate to="dashboard" replace />} />
                            <Route path="dashboard" element={<PlatformDashboard />} />
                            <Route path="tenants" element={<TenantsPage />} />
                        </Route>

                        <Route path="/admin" element={<TenantLayout />}>
                            <Route index element={<Navigate to="dashboard" replace />} />
                            <Route path="dashboard" element={<TenantDashboard />} />
                            <Route path="menu" element={<MenuBuilder />} />
                            <Route path="settings" element={<TenantSettings />} />
                        </Route> 
                        */}

                    </Routes>
                </BrowserRouter>
            </CartProvider>
        </AuthProvider>
    );
}

export default App;