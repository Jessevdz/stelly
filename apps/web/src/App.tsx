import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';

// Layouts
import { StoreLayout } from './layouts/StoreLayout';
import { AdminLayout } from './layouts/AdminLayout';

// Public Pages
import { MenuPage } from './components/store/MenuPage';

// Tenant Admin Pages
import { LoginPage } from './pages/admin/Login';
import { MenuBuilder } from './pages/admin/MenuBuilder';

// Platform Admin Pages
import { TenantsPage } from './pages/admin/Tenants';
import { Dashboard } from './pages/admin/Dashboard';

// KDS
import { KitchenDisplay } from './pages/kitchen/KitchenDisplay';

function App() {
    return (
        <AuthProvider>
            <CartProvider>
                <BrowserRouter>
                    <Routes>
                        {/* 1. Public Storefront */}
                        <Route element={<StoreLayout />}>
                            <Route path="/" element={<MenuPage />} />
                        </Route>

                        {/* 2. Kitchen Display System (Standalone) */}
                        <Route path="/kitchen" element={<KitchenDisplay />} />

                        {/* 3. Tenant Manager Login */}
                        <Route path="/admin/login" element={<LoginPage />} />

                        {/* 4. Super Admin Portal (Protected Layout) */}
                        <Route path="/admin" element={<AdminLayout />}>
                            {/* Redirect root /admin to dashboard */}
                            <Route index element={<Navigate to="dashboard" replace />} />

                            <Route path="dashboard" element={<Dashboard />} />
                            <Route path="tenants" element={<TenantsPage />} />

                            {/* Re-using MenuBuilder for now, though conceptually it belongs to Tenant Manager */}
                            <Route path="menu" element={<MenuBuilder />} />
                        </Route>

                    </Routes>
                </BrowserRouter>
            </CartProvider>
        </AuthProvider>
    );
}

export default App;