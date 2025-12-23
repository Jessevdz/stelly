import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTenantConfig } from '../hooks/useTenantConfig';
import { LayoutGrid, Utensils, Users, LogOut, Store, Settings } from 'lucide-react';

export const TenantLayout = () => {
    const { logout } = useAuth();
    const { config } = useTenantConfig();
    const navigate = useNavigate();
    const location = useLocation();

    // Determine the base path based on current context
    // If we are inside the demo shell, keep the /demo prefix
    const basePath = location.pathname.startsWith('/demo') ? '/demo/admin' : '/admin';

    const handleLogout = () => {
        logout();
        navigate('/admin/login');
    };

    return (
        <div className="min-h-screen flex bg-gray-50 font-sans text-gray-900">
            {/* Restaurant Admin Sidebar */}
            <aside className="w-64 bg-white border-r border-gray-200 flex flex-col z-20">
                <div className="h-16 flex items-center px-6 border-b border-gray-100">
                    <div className="flex items-center gap-2 font-bold text-lg text-gray-800">
                        <Store className="text-primary" />
                        <span className="truncate">{config?.name || 'Loading...'}</span>
                    </div>
                </div>

                <div className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Restaurant Operations
                </div>

                <nav className="flex-1 px-3 space-y-1">
                    <NavLink
                        to={`${basePath}/dashboard`}
                        className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-md transition-all font-medium ${isActive ? 'bg-gray-100 text-primary' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
                    >
                        <LayoutGrid size={18} />
                        Overview
                    </NavLink>
                    <NavLink
                        to={`${basePath}/menu`}
                        className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-md transition-all font-medium ${isActive ? 'bg-gray-100 text-primary' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
                    >
                        <Utensils size={18} />
                        Menu Builder
                    </NavLink>
                    <NavLink
                        to={`${basePath}/staff`}
                        className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-md transition-all font-medium ${isActive ? 'bg-gray-100 text-primary' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
                    >
                        <Users size={18} />
                        Staff Accounts
                    </NavLink>
                    <NavLink
                        to={`${basePath}/settings`}
                        className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-md transition-all font-medium ${isActive ? 'bg-gray-100 text-primary' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
                    >
                        <Settings size={18} />
                        Settings
                    </NavLink>
                </nav>

                <div className="p-4 border-t border-gray-100">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 w-full px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-md transition-colors text-sm"
                    >
                        <LogOut size={18} />
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col h-screen overflow-hidden">
                <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8">
                    <h2 className="font-semibold text-gray-500">Manager Dashboard</h2>
                    <div className="text-sm text-gray-400">
                        Domain: <span className="font-mono text-gray-600">{window.location.host}</span>
                    </div>
                </header>
                <main className="flex-1 overflow-y-auto p-8">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};