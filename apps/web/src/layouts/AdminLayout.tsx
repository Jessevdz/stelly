import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Users, Settings, LogOut, Hexagon } from 'lucide-react';

export const AdminLayout = () => {
    const { logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/admin/login');
    };

    return (
        <div className="min-h-screen flex bg-gray-100 font-sans text-gray-900">
            {/* Sidebar */}
            <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shadow-xl z-20">
                <div className="h-16 flex items-center px-6 border-b border-slate-800">
                    <div className="flex items-center gap-2 text-white font-bold text-lg tracking-tight">
                        <Hexagon className="text-blue-500 fill-blue-500/20" />
                        OMNI<span className="text-blue-500">ADMIN</span>
                    </div>
                </div>

                <nav className="flex-1 p-4 space-y-1">
                    <NavLink
                        to="/admin/dashboard"
                        className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-md transition-all ${isActive ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'hover:bg-slate-800 hover:text-white'}`}
                    >
                        <LayoutDashboard size={20} />
                        Dashboard
                    </NavLink>
                    <NavLink
                        to="/admin/tenants"
                        className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-md transition-all ${isActive ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'hover:bg-slate-800 hover:text-white'}`}
                    >
                        <Users size={20} />
                        Tenants
                    </NavLink>
                    <NavLink
                        to="/admin/settings"
                        className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-md transition-all ${isActive ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'hover:bg-slate-800 hover:text-white'}`}
                    >
                        <Settings size={20} />
                        Platform Settings
                    </NavLink>
                </nav>

                <div className="p-4 border-t border-slate-800">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 w-full px-4 py-3 text-red-400 hover:bg-red-950/30 rounded-md transition-colors"
                    >
                        <LogOut size={20} />
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 shadow-sm z-10">
                    <div className="text-sm breadcrumbs text-gray-500">
                        <span className="font-semibold text-gray-800">Admin Portal</span>
                        <span className="mx-2">/</span>
                        <span className="capitalize">{window.location.pathname.split('/').pop()}</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="h-8 w-8 rounded-full bg-blue-100 border-2 border-blue-200 flex items-center justify-center text-blue-700 font-bold text-xs">
                            SA
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-8">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};