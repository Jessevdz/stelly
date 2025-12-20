import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useTenantConfig } from './hooks/useTenantConfig';
import { MenuGrid } from './components/MenuGrid';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginPage } from './pages/admin/Login';
import { MenuBuilder } from './pages/admin/MenuBuilder';

// --- Layouts ---

const StoreLayout = () => {
    const { config, loading, error } = useTenantConfig();

    if (loading) return <div className="h-screen flex items-center justify-center">Loading Store...</div>;

    if (error || !config) return (
        <div className="h-screen flex items-center justify-center bg-red-50 text-red-600 p-4">
            <div>
                <h1 className="text-2xl font-bold">Store Unavailable</h1>
                <p className="mt-2 text-sm">{error || "Configuration missing"}</p>
                <p className="text-xs text-gray-500 mt-4">Host: {window.location.host}</p>
            </div>
        </div>
    );

    const themeStyles = {
        '--primary': config.primary_color,
        '--primary-fg': '#ffffff',
    } as React.CSSProperties;

    return (
        <div style={themeStyles} className="min-h-screen bg-gray-50 text-gray-900 font-sans">
            <header className="bg-primary text-white shadow-lg transition-colors duration-500">
                <div className="max-w-4xl mx-auto px-4 py-6 flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold">{config.name}</h1>
                        <p className="opacity-90 text-sm mt-1">Order Online</p>
                    </div>
                </div>
            </header>
            <main className="max-w-4xl mx-auto mt-8">
                <Outlet />
            </main>
            <footer className="text-center text-gray-400 text-sm py-8">
                Powered by OmniOrder
            </footer>
        </div>
    );
};

const ProtectedRoute = () => {
    const { isAuthenticated } = useAuth();
    return isAuthenticated ? <Outlet /> : <Navigate to="/admin/login" replace />;
};

// --- Main App Component ---

function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    {/* Public Storefront Routes */}
                    <Route element={<StoreLayout />}>
                        <Route path="/" element={
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                                <div className="p-4 border-b border-gray-100 bg-gray-50">
                                    <h2 className="font-semibold text-gray-700">Menu</h2>
                                </div>
                                <MenuGrid />
                            </div>
                        } />
                    </Route>

                    {/* Admin Routes */}
                    <Route path="/admin/login" element={<LoginPage />} />

                    <Route element={<ProtectedRoute />}>
                        <Route path="/admin/dashboard" element={
                            <div className="p-8">
                                <h1 className="text-2xl font-bold mb-4">Manager Dashboard</h1>
                                <div className="grid grid-cols-3 gap-4">
                                    <a href="/admin/menu" className="block p-6 bg-white shadow rounded hover:shadow-md transition">
                                        <h3 className="font-bold text-lg text-blue-600">Menu Builder &rarr;</h3>
                                        <p className="text-sm text-gray-500">Add items, categories, and photos.</p>
                                    </a>
                                    {/* Other cards */}
                                </div>
                            </div>
                        } />
                    </Route>
                    {/* Kitchen Route (Future) */}
                    <Route path="/kitchen" element={<div>Kitchen Display System (Coming Soon)</div>} />

                    <Route path="/admin/menu" element={<MenuBuilder />} /> {/* New Route */}

                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
}

export default App;