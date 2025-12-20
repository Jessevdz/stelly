import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTenantConfig } from '../../hooks/useTenantConfig';

// Types matching backend
interface Category { id: string; name: string; rank: number; }
interface MenuItem {
    id?: string;
    name: string;
    description: string;
    price: number;
    image_url: string;
    category_id: string;
    is_available: boolean;
}

export function MenuBuilder() {
    const { token } = useAuth();
    const { config } = useTenantConfig();

    const [categories, setCategories] = useState<Category[]>([]);
    const [items, setItems] = useState<MenuItem[]>([]);
    const [loading, setLoading] = useState(true);

    // Form State
    const [activeTab, setActiveTab] = useState<'categories' | 'items'>('items');
    const [newItem, XZ] = useState<MenuItem>({
        name: '', description: '', price: 0, image_url: '', category_id: '', is_available: true
    });
    const [newCat, setNewCat] = useState({ name: '' });

    // Fetch Data
    const fetchData = async () => {
        const headers = { 'Authorization': `Bearer ${token}` };
        const [catRes, itemRes] = await Promise.all([
            fetch('/api/v1/admin/categories', { headers }),
            fetch('/api/v1/admin/items', { headers })
        ]);
        setCategories(await catRes.json());
        setItems(await itemRes.json());
        setLoading(false);
    };

    useEffect(() => { fetchData(); }, []);

    // Handlers
    const handleAddCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        await fetch('/api/v1/admin/categories', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(newCat)
        });
        setNewCat({ name: '' });
        fetchData();
    };

    const handleAddItem = async (e: React.FormEvent) => {
        e.preventDefault();
        await fetch('/api/v1/admin/items', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(newItem)
        });
        // Reset but keep category for rapid entry
        XZ(prev => ({ ...prev, name: '', description: '', price: 0, image_url: '' }));
        fetchData();
    };

    if (loading) return <div>Loading Builder...</div>;

    // --- RENDER ---
    return (
        <div className="flex h-screen bg-gray-100 overflow-hidden">

            {/* LEFT PANEL: CMS Editors */}
            <div className="w-1/2 p-8 overflow-y-auto border-r border-gray-200 bg-white">
                <h1 className="text-3xl font-bold mb-6 text-gray-800">Menu Engineering</h1>

                <div className="flex space-x-4 mb-6 border-b">
                    <button
                        className={`pb-2 ${activeTab === 'items' ? 'border-b-2 border-blue-500 font-bold' : ''}`}
                        onClick={() => setActiveTab('items')}
                    >
                        Items
                    </button>
                    <button
                        className={`pb-2 ${activeTab === 'categories' ? 'border-b-2 border-blue-500 font-bold' : ''}`}
                        onClick={() => setActiveTab('categories')}
                    >
                        Categories
                    </button>
                </div>

                {activeTab === 'categories' && (
                    <div className="space-y-6">
                        <form onSubmit={handleAddCategory} className="bg-gray-50 p-4 rounded-lg border">
                            <label className="block text-sm font-bold mb-2">New Category Name</label>
                            <div className="flex gap-2">
                                <input
                                    className="flex-1 p-2 border rounded"
                                    value={newCat.name}
                                    onChange={e => setNewCat({ ...newCat, name: e.target.value })}
                                    placeholder="e.g., Starters"
                                />
                                <button className="bg-blue-600 text-white px-4 rounded">Add</button>
                            </div>
                        </form>
                        <ul className="space-y-2">
                            {categories.map(c => (
                                <li key={c.id} className="p-3 bg-white border rounded shadow-sm flex justify-between">
                                    <span>{c.name}</span>
                                    <span className="text-xs text-gray-400">Rank: {c.rank}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {activeTab === 'items' && (
                    <form onSubmit={handleAddItem} className="space-y-4 max-w-lg">
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mb-6">
                            <h3 className="font-bold text-blue-800 mb-2">Create New Item</h3>
                            <div className="space-y-3">
                                <input
                                    className="w-full p-2 border rounded"
                                    placeholder="Item Name (e.g. Super Burger)"
                                    value={newItem.name}
                                    onChange={e => XZ({ ...newItem, name: e.target.value })}
                                />
                                <textarea
                                    className="w-full p-2 border rounded"
                                    placeholder="Description"
                                    value={newItem.description}
                                    onChange={e => XZ({ ...newItem, description: e.target.value })}
                                />
                                <div className="flex gap-4">
                                    <input
                                        type="number" className="w-1/2 p-2 border rounded"
                                        placeholder="Price (cents)"
                                        value={newItem.price || ''}
                                        onChange={e => XZ({ ...newItem, price: parseInt(e.target.value) })}
                                    />
                                    <select
                                        className="w-1/2 p-2 border rounded"
                                        value={newItem.category_id}
                                        onChange={e => XZ({ ...newItem, category_id: e.target.value })}
                                    >
                                        <option value="">Select Category</option>
                                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                                <input
                                    className="w-full p-2 border rounded"
                                    placeholder="Image URL (https://...)"
                                    value={newItem.image_url}
                                    onChange={e => XZ({ ...newItem, image_url: e.target.value })}
                                />
                                <button className="w-full bg-green-600 text-white py-2 rounded font-bold hover:bg-green-700">
                                    Save Item to Database
                                </button>
                            </div>
                        </div>
                    </form>
                )}
            </div>

            {/* RIGHT PANEL: Live Mobile Preview */}
            <div className="w-1/2 bg-gray-800 flex items-center justify-center p-8">
                <div className="mockup-phone border-gray-700 border-8 rounded-[3rem] h-[700px] w-[380px] bg-white overflow-hidden shadow-2xl relative">
                    <div className="absolute top-0 w-full h-8 bg-black opacity-10 flex justify-center items-center z-10">
                        <div className="w-20 h-4 bg-black rounded-b-xl"></div>
                    </div>

                    {/* Simulated App View */}
                    <div className="h-full overflow-y-auto pb-20">
                        {/* Header */}
                        <div
                            style={{ backgroundColor: config?.primary_color || '#000' }}
                            className="h-32 p-6 flex items-end"
                        >
                            <h2 className="text-white text-2xl font-bold">{config?.name || 'Store Name'}</h2>
                        </div>

                        {/* Content */}
                        <div className="p-4 space-y-6">
                            {/* PREVIEW: Currently Editing Item (Ghost Card) */}
                            {newItem.name && (
                                <div className="border-2 border-dashed border-blue-300 bg-blue-50 rounded-lg p-3 opacity-80">
                                    <span className="text-xs font-bold text-blue-500 uppercase">Live Preview</span>
                                    <div className="flex gap-3 mt-1">
                                        <div className="h-16 w-16 bg-gray-200 rounded-md bg-cover bg-center" style={{ backgroundImage: `url(${newItem.image_url})` }} />
                                        <div className="flex-1">
                                            <div className="font-bold">{newItem.name}</div>
                                            <div className="text-xs text-gray-500 line-clamp-2">{newItem.description}</div>
                                            <div className="mt-1 font-semibold text-sm">${(newItem.price / 100).toFixed(2)}</div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Actual Items grouped by Category */}
                            {categories.map(cat => {
                                const catItems = items.filter(i => i.category_id === cat.id);
                                if (catItems.length === 0) return null;
                                return (
                                    <div key={cat.id}>
                                        <h3 className="font-bold text-lg text-gray-800 mb-2">{cat.name}</h3>
                                        <div className="space-y-3">
                                            {catItems.map(item => (
                                                <div key={item.id} className="flex gap-3 bg-white shadow-sm border rounded-lg p-3">
                                                    {item.image_url && (
                                                        <img src={item.image_url} alt="" className="h-16 w-16 object-cover rounded-md" />
                                                    )}
                                                    <div className="flex-1">
                                                        <div className="font-semibold text-gray-900">{item.name}</div>
                                                        <div className="text-xs text-gray-500 mb-1">{item.description}</div>
                                                        <div className="font-bold text-sm text-gray-700">${(item.price / 100).toFixed(2)}</div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>
                <p className="text-gray-400 mt-4 absolute bottom-8 text-sm">Live Store Preview</p>
            </div>
        </div>
    );
}