import { TrendingUp, Users, ShoppingCart, Activity } from 'lucide-react';

export function Dashboard() {
    return (
        <div className="max-w-6xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Platform Health</h1>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                {[
                    { label: 'Active Tenants', val: '2', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
                    { label: 'Total Orders (24h)', val: '1,248', icon: ShoppingCart, color: 'text-green-600', bg: 'bg-green-50' },
                    { label: 'API Latency', val: '45ms', icon: Activity, color: 'text-purple-600', bg: 'bg-purple-50' },
                    { label: 'Revenue (MTD)', val: '$12.4k', icon: TrendingUp, color: 'text-orange-600', bg: 'bg-orange-50' },
                ].map((stat, i) => (
                    <div key={i} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
                        <div className={`p-3 rounded-lg ${stat.bg}`}>
                            <stat.icon size={24} className={stat.color} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 font-medium">{stat.label}</p>
                            <p className="text-2xl font-bold text-gray-900">{stat.val}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm text-center">
                <div className="max-w-md mx-auto">
                    <h3 className="text-lg font-bold text-gray-900">System Status</h3>
                    <p className="text-gray-500 mt-2">
                        All systems operational. Worker nodes are processing async migrations normally.
                    </p>
                </div>
            </div>
        </div>
    );
}