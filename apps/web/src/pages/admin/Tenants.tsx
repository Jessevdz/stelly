import React, { useState } from 'react';
import { Plus, Search, ExternalLink, CheckCircle, XCircle, Globe, Server } from 'lucide-react';

interface TenantForm {
    name: string;
    domain: string;
    primary_color: string;
    font_family: string;
}

const DEFAULT_FORM: TenantForm = {
    name: '',
    domain: '',
    primary_color: '#000000',
    font_family: 'Inter'
};

export function TenantsPage() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [form, setForm] = useState<TenantForm>(DEFAULT_FORM);
    const [error, setError] = useState('');

    // Mock Data for UI demonstration (GET /tenants not yet implemented in backend)
    const [tenants, setTenants] = useState([
        { id: '1', name: 'Pizza Hut', domain: 'pizza.localhost', status: 'active', plan: 'Enterprise', created: '2023-10-01' },
        { id: '2', name: 'Burger King', domain: 'burger.localhost', status: 'active', plan: 'Standard', created: '2023-10-05' },
    ]);

    const handleProvision = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const res = await fetch('/api/v1/sys/provision', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...form,
                    seed_data: true // Always seed for MVP
                })
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.detail || 'Provisioning failed');
            }

            const newTenantData = await res.json();

            // Optimistic update for UI
            setTenants(prev => [...prev, {
                id: newTenantData.id || Date.now().toString(),
                name: form.name,
                domain: form.domain,
                status: 'active',
                plan: 'Standard',
                created: new Date().toISOString().split('T')[0]
            }]);

            setIsModalOpen(false);
            setForm(DEFAULT_FORM);
            alert(`Successfully provisioned schema: ${newTenantData.schema_name}`);

        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto">
            {/* Header / Actions */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Tenant Overview</h1>
                    <p className="text-gray-500 text-sm mt-1">Manage restaurant instances and domains.</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium shadow-md shadow-blue-900/10 transition-all"
                >
                    <Plus size={18} />
                    Provision Tenant
                </button>
            </div>

            {/* Filter Bar */}
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm mb-6 flex gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search tenants..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                </div>
            </div>

            {/* Data Table */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 text-gray-500 font-semibold text-xs uppercase tracking-wider border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4">Tenant Name</th>
                            <th className="px-6 py-4">Domain</th>
                            <th className="px-6 py-4">Plan</th>
                            <th className="px-6 py-4">Created</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {tenants.map(tenant => (
                            <tr key={tenant.id} className="hover:bg-gray-50/50 transition-colors">
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${tenant.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                        }`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${tenant.status === 'active' ? 'bg-green-500' : 'bg-red-500'
                                            }`} />
                                        {tenant.status === 'active' ? 'Healthy' : 'Error'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 font-medium text-gray-900">{tenant.name}</td>
                                <td className="px-6 py-4 text-gray-600 font-mono text-sm">{tenant.domain}</td>
                                <td className="px-6 py-4">
                                    <span className="inline-block bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded border border-gray-200">
                                        {tenant.plan}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-gray-500 text-sm">{tenant.created}</td>
                                <td className="px-6 py-4 text-right">
                                    <a
                                        href={`http://${tenant.domain}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-blue-600 hover:text-blue-800 text-sm font-medium inline-flex items-center gap-1"
                                    >
                                        Visit <ExternalLink size={14} />
                                    </a>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Provisioning Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                                <Server size={18} className="text-blue-600" />
                                Provision New Tenant
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <XCircle size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleProvision} className="p-6 space-y-5">
                            {error && (
                                <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm flex gap-2 items-start">
                                    <XCircle size={16} className="mt-0.5 shrink-0" />
                                    {error}
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Restaurant Name</label>
                                <input
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="e.g. Joe's Pizza"
                                    value={form.name}
                                    onChange={e => setForm({ ...form, name: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Full Domain</label>
                                <div className="relative">
                                    <Globe size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        required
                                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm"
                                        placeholder="e.g. pizza.localhost"
                                        value={form.domain}
                                        onChange={e => setForm({ ...form, domain: e.target.value })}
                                    />
                                </div>
                                <p className="text-xs text-gray-500 mt-1">Must map to 127.0.0.1 in hosts file for local dev.</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Brand Color</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="color"
                                            className="h-10 w-10 p-1 border rounded cursor-pointer"
                                            value={form.primary_color}
                                            onChange={e => setForm({ ...form, primary_color: e.target.value })}
                                        />
                                        <input
                                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono uppercase"
                                            value={form.primary_color}
                                            onChange={e => setForm({ ...form, primary_color: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Font Family</label>
                                    <select
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white"
                                        value={form.font_family}
                                        onChange={e => setForm({ ...form, font_family: e.target.value })}
                                    >
                                        <option value="Inter">Inter (Clean)</option>
                                        <option value="Playfair Display">Playfair (Serif)</option>
                                        <option value="Oswald">Oswald (Bold)</option>
                                        <option value="Lato">Lato (Friendly)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="pt-4">
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold py-3 rounded-lg shadow-lg shadow-blue-900/20 transition-all flex justify-center items-center gap-2"
                                >
                                    {isLoading ? 'Provisioning...' : 'Create Tenant Infrastructure'}
                                    {!isLoading && <CheckCircle size={18} />}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}