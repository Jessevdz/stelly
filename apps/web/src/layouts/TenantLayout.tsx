import { useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTenantConfig } from '../hooks/useTenantConfig';
import { LayoutGrid, Utensils, Settings, LogOut, Store, Menu, X } from 'lucide-react';

export const TenantLayout = () => {
    const { logout } = useAuth();
    const { config } = useTenantConfig();
    const [sidebarOpen, setSidebarOpen] = useState(false); // Mobile state

    const basePath = '/demo/admin';

    const handleLogout = () => {
        logout();
    };

    // Sidebar Content Component
    const SidebarContent = () => (
        <>
            <div className="h-16 flex items-center px-6 border-b border-gray-100 shrink-0">
                <div className="flex items-center gap-2 font-bold text-lg text-gray-800">
                    <Store className="text-primary" />
                    <span className="truncate max-w-[150px]">{config?.name || 'Loading...'}</span>
                </div>
                {/* Mobile Close Button */}
                <button
                    onClick={() => setSidebarOpen(false)}
                    className="md:hidden ml-auto p-2 text-gray-500"
                >
                    <X size={20} />
                </button>
            </div>

            <nav className="flex-1 px-3 space-y-1 pt-4">
                {[
                    { to: 'dashboard', icon: LayoutGrid, label: 'Overzicht' },
                    { to: 'menu', icon: Utensils, label: 'Menu' },
                    { to: 'settings', icon: Settings, label: 'Instellingen' }
                ].map((item) => (
                    <NavLink
                        key={item.to}
                        to={`${basePath}/${item.to}`}
                        onClick={() => setSidebarOpen(false)}
                        className={({ isActive }) => `
                            flex items-center gap-3 px-3 py-2.5 rounded-md transition-all font-medium
                            ${isActive ? 'bg-gray-100 text-primary' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}
                        `}
                    >
                        <item.icon size={18} />
                        {item.label}
                    </NavLink>
                ))}
            </nav>

            <div className="p-4 border-t border-gray-100 shrink-0">
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 w-full px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-md transition-colors text-sm"
                >
                    <LogOut size={18} />
                    End Session
                </button>
            </div>
        </>
    );

    return (
        <div className="min-h-screen flex flex-col bg-gray-50 font-sans text-gray-900 overflow-hidden h-full">

            <div className="flex flex-1 overflow-hidden relative">

                {/* DESKTOP SIDEBAR */}
                <aside className="hidden md:flex w-64 bg-white border-r border-gray-200 flex-col z-20">
                    <SidebarContent />
                </aside>

                {/* MOBILE SIDEBAR (Slide-over) */}
                {sidebarOpen && (
                    <div className="fixed inset-0 z-50 flex md:hidden">
                        {/* Backdrop */}
                        <div
                            className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in"
                            onClick={() => setSidebarOpen(false)}
                        />
                        {/* Drawer */}
                        <aside className="relative w-64 bg-white shadow-2xl flex flex-col h-full animate-in slide-in-from-left duration-300">
                            <SidebarContent />
                        </aside>
                    </div>
                )}

                {/* MAIN CONTENT */}
                <div className="flex-1 flex flex-col h-full overflow-hidden relative w-full">
                    {/* Mobile Header */}
                    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 md:px-8 shrink-0">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setSidebarOpen(true)}
                                className="md:hidden p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-md"
                            >
                                <Menu size={24} />
                            </button>
                            <h2 className="font-semibold text-gray-700">Dashboard</h2>
                        </div>
                        <div className="text-sm text-gray-400 hidden sm:block">
                            Context: <span className="font-mono text-gray-600">Demo Mode</span>
                        </div>
                    </header>

                    <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-gray-50">
                        <Outlet />
                    </main>
                </div>
            </div>
        </div>
    );
};