import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
    Upload, Image as ImageIcon, Loader2, ArrowUp, ArrowDown,
    Pencil, Trash2, Plus, X, Save, AlertCircle, Eye
} from 'lucide-react';

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
    rank?: number;
    modifier_groups?: any[];
}

export function MenuBuilder() {
    const { token, isLoading: authLoading } = useAuth();

    // Data State
    const [categories, setCategories] = useState<Category[]>([]);
    const [items, setItems] = useState<MenuItem[]>([]);

    const [dataLoading, setDataLoading] = useState(true);

    // Form State
    const [activeTab, setActiveTab] = useState<'items' | 'categories'>('items');
    const [formMode, setFormMode] = useState<'create' | 'edit'>('create');

    // Item Form
    const [itemForm, setItemForm] = useState<MenuItem>({
        name: '', description: '', price: 0, image_url: '', category_id: '', is_available: true
    });

    // Category Form
    const [catForm, setCatForm] = useState({ id: '', name: '' });

    // Upload State
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Initial Fetch
    const fetchData = async () => {
        if (!token) {
            if (!authLoading) setDataLoading(false);
            return;
        }

        const headers = { 'Authorization': `Bearer ${token}` };
        try {
            const [catRes, itemRes] = await Promise.all([
                fetch('/api/v1/admin/categories', { headers }),
                fetch('/api/v1/admin/items', { headers })
            ]);

            if (!catRes.ok || !itemRes.ok) {
                console.error("API Error", catRes.status, itemRes.status);
                setCategories([]);
                setItems([]);
                return;
            }

            const catData = await catRes.json();
            const itemData = await itemRes.json();

            setCategories(Array.isArray(catData) ? catData : []);
            setItems(Array.isArray(itemData) ? itemData : []);

        } catch (error) {
            console.error("Failed to fetch menu data", error);
            setCategories([]);
            setItems([]);
        } finally {
            setDataLoading(false);
        }
    };

    useEffect(() => {
        if (!authLoading) {
            if (token) {
                fetchData();
            } else {
                setDataLoading(false);
            }
        }
    }, [token, authLoading]);

    // --- GENERIC API HELPERS ---
    const apiCall = async (endpoint: string, method: string, body?: any) => {
        const res = await fetch(`/api/v1/admin${endpoint}`, {
            method,
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: body ? JSON.stringify(body) : undefined
        });

        if (!res.ok) {
            try {
                const errData = await res.json();
                console.error("API Validation Error:", errData);
                throw new Error(JSON.stringify(errData.detail || errData));
            } catch (e) {
                throw new Error(`API Failed: ${res.statusText}`);
            }
        }
        return res.json();
    };

    // --- CATEGORY HANDLERS ---

    const handleCategorySubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const nextRank = categories.length > 0 ? Math.max(...categories.map(c => c.rank)) + 1 : 0;
            await apiCall('/categories', 'POST', { name: catForm.name, rank: nextRank });
            setCatForm({ id: '', name: '' });
            fetchData();
        } catch (e) { alert("Opslaan van categorie mislukt"); }
    };

    const handleDeleteCategory = async (id: string) => {
        if (categories.length <= 1) {
            alert("Demo Beveiliging: Je kan de laatste categorie niet verwijderen. Voeg eerst een andere categorie toe alvorens deze te verwijderen.");
            return;
        }
        if (!confirm("Deze categorie verwijderen? Alle items hierin worden ook verwijderd.")) return;
        try {
            await apiCall(`/categories/${id}`, 'DELETE');
            fetchData();
        } catch (e) { alert("Verwijderen van categorie mislukt"); }
    };

    const handleReorderCategory = async (index: number, direction: 'up' | 'down') => {
        const newCats = [...categories];
        const swapIndex = direction === 'up' ? index - 1 : index + 1;
        if (swapIndex < 0 || swapIndex >= newCats.length) return;

        [newCats[index], newCats[swapIndex]] = [newCats[swapIndex], newCats[index]];

        const reordered = newCats.map((cat, idx) => ({ ...cat, rank: idx }));
        setCategories(reordered);

        const payload = reordered.map(c => ({ id: c.id, rank: c.rank }));
        await apiCall('/categories/reorder', 'PUT', payload);
    };

    // --- ITEM HANDLERS ---

    const resetItemForm = () => {
        setItemForm({ name: '', description: '', price: 0, image_url: '', category_id: '', is_available: true });
        setFormMode('create');
    };

    const handleEditItemClick = (item: MenuItem) => {
        setItemForm(item);
        setFormMode('edit');
        setActiveTab('items');
        document.getElementById('editor-panel')?.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleItemSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (formMode === 'create') {
                await apiCall('/items', 'POST', itemForm);
            } else {
                if (!itemForm.id) return;
                await apiCall(`/items/${itemForm.id}`, 'PUT', itemForm);
            }
            resetItemForm();
            fetchData();
        } catch (e) { alert("Opslaan van item mislukt"); }
    };

    const handleDeleteItem = async (id: string) => {
        const itemToDelete = items.find(i => i.id === id);
        if (itemToDelete) {
            const catItems = items.filter(i => i.category_id === itemToDelete.category_id);
            if (catItems.length <= 1) {
                alert("Demo Beveiliging: Laat minstens één item in deze categorie staan voor de visuele structuur.");
                return;
            }
        }

        if (!confirm("Ben je zeker dat je dit item wil verwijderen?")) return;
        try {
            await apiCall(`/items/${id}`, 'DELETE');
            if (itemForm.id === id) resetItemForm();
            fetchData();
        } catch (e) { alert("Verwijderen van item mislukt"); }
    };

    const handleReorderItem = async (category_id: string, item_id: string, direction: 'up' | 'down') => {
        const catItems = items
            .filter(i => i.category_id === category_id)
            .sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0));

        const currentIndex = catItems.findIndex(i => i.id === item_id);
        if (currentIndex === -1) return;

        const swapIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
        if (swapIndex < 0 || swapIndex >= catItems.length) return;

        const itemA = catItems[currentIndex];
        const itemB = catItems[swapIndex];

        const rankA = itemA.rank ?? 0;
        const rankB = itemB.rank ?? 0;

        let newRankA, newRankB;

        if (rankA === rankB) {
            if (direction === 'up') {
                newRankA = swapIndex;
                newRankB = currentIndex;
            } else {
                newRankA = swapIndex;
                newRankB = currentIndex;
            }
        } else {
            newRankA = rankB;
            newRankB = rankA;
        }

        const updatedItems = items.map(i => {
            if (i.id === itemA.id) return { ...i, rank: newRankA };
            if (i.id === itemB.id) return { ...i, rank: newRankB };
            return i;
        });
        setItems(updatedItems);

        const payload = [
            { id: itemA.id!, rank: newRankA },
            { id: itemB.id!, rank: newRankB }
        ];

        try {
            await apiCall('/items/reorder', 'PUT', payload);
        } catch (e) {
            console.error("Reorder failed", e);
            fetchData();
        }
    };

    // --- IMAGE UPLOAD ---
    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch('/api/v1/media/upload', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });
            if (!res.ok) throw new Error('Upload failed');
            const data = await res.json();
            setItemForm(prev => ({ ...prev, image_url: data.url }));
        } catch (err) { alert("Afbeelding uploaden mislukt"); }
        finally { setUploading(false); }
    };

    if (authLoading || dataLoading) {
        return <div className="p-8 flex items-center gap-2"><Loader2 className="animate-spin" /> Menu gegevens laden...</div>;
    }

    return (
        <div className="flex h-[calc(100vh-64px)] bg-gray-50 overflow-hidden">

            {/* LEFT: Editor Panel */}
            <div id="editor-panel" className="w-[450px] bg-white border-r border-gray-200 flex flex-col shadow-xl z-10 overflow-y-auto">
                <div className="p-6">
                    <h2 className="text-2xl font-bold text-gray-800 mb-6">Menu Editor</h2>

                    {/* Tab Switcher */}
                    <div className="flex bg-gray-100 p-1 rounded-lg mb-6">
                        <button
                            onClick={() => { setActiveTab('items'); resetItemForm(); }}
                            className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all ${activeTab === 'items' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Items
                        </button>
                        <button
                            onClick={() => setActiveTab('categories')}
                            className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all ${activeTab === 'categories' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Categorieën
                        </button>
                    </div>

                    {/* --- ITEMS FORM --- */}
                    {activeTab === 'items' && (
                        <div className="animate-in fade-in slide-in-from-left-4 duration-300">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold text-lg text-gray-700">
                                    {formMode === 'create' ? 'Nieuw Item Aanmaken' : 'Item Bewerken'}
                                </h3>

                                {/* Added: Navigation controls */}
                                <div className="flex items-center gap-2">
                                    {/* Contextual link to see changes */}
                                    {window.location.pathname.includes('/demo') && (
                                        <a
                                            href="/demo/split"
                                            className="text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-2 py-1 rounded flex items-center gap-1 border border-indigo-200"
                                            title="Bekijk wijzigingen in Live View"
                                        >
                                            <Eye size={12} /> Live Bekijken
                                        </a>
                                    )}

                                    {formMode === 'edit' && (
                                        <button onClick={resetItemForm} className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded flex items-center gap-1 text-gray-600">
                                            <X size={12} /> Annuleren
                                        </button>
                                    )}
                                </div>
                            </div>


                            <form onSubmit={handleItemSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Naam</label>
                                    <input
                                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                        placeholder="bv. Truffelburger"
                                        value={itemForm.name}
                                        onChange={e => setItemForm({ ...itemForm, name: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="flex gap-4">
                                    <div className="flex-1">
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Prijs (Centen)</label>
                                        <input
                                            type="number"
                                            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                            placeholder="1200 = €12,00"
                                            value={itemForm.price || ''}
                                            onChange={e => setItemForm({ ...itemForm, price: parseInt(e.target.value) || 0 })}
                                            required
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Categorie</label>
                                        <select
                                            className="w-full p-2 border border-gray-300 rounded bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                                            value={itemForm.category_id}
                                            onChange={e => setItemForm({ ...itemForm, category_id: e.target.value })}
                                            required
                                        >
                                            <option value="">Selecteer...</option>
                                            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Beschrijving</label>
                                    <textarea
                                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none h-24 resize-none"
                                        placeholder="Beschrijf de ingrediënten..."
                                        value={itemForm.description}
                                        onChange={e => setItemForm({ ...itemForm, description: e.target.value })}
                                    />
                                </div>

                                {/* Image Uploader */}
                                <div className="border border-gray-200 rounded-lg p-3 bg-gray-50/50">
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Afbeelding Item</label>
                                    <div className="flex items-center gap-3">
                                        <div className="h-14 w-14 bg-gray-200 rounded-md border border-gray-300 flex items-center justify-center overflow-hidden shrink-0">
                                            {itemForm.image_url ? (
                                                <img src={itemForm.image_url} className="w-full h-full object-cover" />
                                            ) : (
                                                <ImageIcon className="text-gray-400" size={20} />
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
                                            <button
                                                type="button"
                                                disabled={uploading}
                                                onClick={() => fileInputRef.current?.click()}
                                                className="text-sm bg-white border border-gray-300 px-3 py-1.5 rounded hover:bg-gray-50 w-full flex justify-center items-center gap-2"
                                            >
                                                {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                                                {uploading ? 'Uploaden...' : 'Foto Uploaden'}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <button type="submit" className={`w-full py-3 rounded-lg font-bold text-white shadow-md transition-all flex justify-center items-center gap-2 ${formMode === 'create' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700'}`}>
                                    {formMode === 'create' ? <Plus size={18} /> : <Save size={18} />}
                                    {formMode === 'create' ? 'Item Toevoegen' : 'Wijzigingen Opslaan'}
                                </button>
                            </form>
                        </div>
                    )}

                    {/* --- CATEGORIES FORM --- */}
                    {activeTab === 'categories' && (
                        <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                            <h3 className="font-bold text-lg text-gray-700 mb-4">Categorieën Beheren</h3>
                            <form onSubmit={handleCategorySubmit} className="flex gap-2 mb-6">
                                <input
                                    className="flex-1 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="Naam Nieuwe Categorie"
                                    value={catForm.name}
                                    onChange={e => setCatForm({ ...catForm, name: e.target.value })}
                                    required
                                />
                                <button className="bg-blue-600 text-white px-4 rounded hover:bg-blue-700 font-medium">Toevoegen</button>
                            </form>

                            <div className="space-y-2">
                                {categories.sort((a, b) => a.rank - b.rank).map((c, idx) => (
                                    <div key={c.id} className="bg-white border border-gray-200 p-3 rounded-lg flex justify-between items-center shadow-sm group hover:border-blue-300 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <span className="text-gray-400 font-mono text-xs w-6">#{idx + 1}</span>
                                            <span className="font-semibold text-gray-800">{c.name}</span>
                                        </div>
                                        <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => handleReorderCategory(idx, 'up')} disabled={idx === 0} className="p-1 hover:bg-gray-100 rounded disabled:opacity-30"><ArrowUp size={16} /></button>
                                            <button onClick={() => handleReorderCategory(idx, 'down')} disabled={idx === categories.length - 1} className="p-1 hover:bg-gray-100 rounded disabled:opacity-30"><ArrowDown size={16} /></button>
                                            <div className="w-px h-4 bg-gray-300 mx-1"></div>
                                            <button onClick={() => handleDeleteCategory(c.id)} className="p-1 text-red-500 hover:bg-red-50 rounded"><Trash2 size={16} /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* RIGHT: Live Preview & Management List */}
            <div className="flex-1 overflow-y-auto p-8">
                <div className="max-w-3xl mx-auto">
                    <div className="flex items-center gap-2 mb-6">
                        <h1 className="text-2xl font-bold text-gray-800">Huidig Menu</h1>
                        <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-medium">Live Voorbeeld</span>
                    </div>

                    <div className="space-y-8 pb-20">
                        {categories.sort((a, b) => a.rank - b.rank).map(cat => {
                            const catItems = items
                                .filter(i => i.category_id === cat.id)
                                .sort((a, b) => (a.rank || 0) - (b.rank || 0));

                            return (
                                <div key={cat.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                                    <div className="bg-gray-50 border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                                        <h2 className="font-bold text-lg text-gray-800">{cat.name}</h2>
                                        <span className="text-xs text-gray-500 font-medium">{catItems.length} Items</span>
                                    </div>

                                    {catItems.length === 0 ? (
                                        <div className="p-8 text-center text-gray-400 text-sm">
                                            Nog geen items in deze categorie.
                                        </div>
                                    ) : (
                                        <div className="divide-y divide-gray-100">
                                            {catItems.map((item, idx) => (
                                                <div key={item.id} className="p-4 flex items-start gap-4 hover:bg-blue-50/30 transition-colors group">
                                                    {/* Reorder Handles */}
                                                    <div className="flex flex-col gap-1 pt-1 opacity-0 group-hover:opacity-50 hover:!opacity-100 transition-opacity">
                                                        <button onClick={() => handleReorderItem(cat.id, item.id!, 'up')} disabled={idx === 0} className="hover:text-blue-600 disabled:opacity-20"><ArrowUp size={14} /></button>
                                                        <button onClick={() => handleReorderItem(cat.id, item.id!, 'down')} disabled={idx === catItems.length - 1} className="hover:text-blue-600 disabled:opacity-20"><ArrowDown size={14} /></button>
                                                    </div>

                                                    {/* Image */}
                                                    <div className="h-16 w-16 bg-gray-100 rounded-md border border-gray-200 shrink-0 overflow-hidden">
                                                        {item.image_url ? (
                                                            <img src={item.image_url} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-gray-300"><ImageIcon size={20} /></div>
                                                        )}
                                                    </div>

                                                    {/* Info */}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex justify-between items-start">
                                                            <h3 className="font-bold text-gray-900 truncate">{item.name}</h3>
                                                            <span className="font-mono text-sm font-semibold text-gray-600">€ {(item.price / 100).toFixed(2).replace('.', ',')}</span>
                                                        </div>
                                                        <p className="text-sm text-gray-500 line-clamp-1 mt-0.5">{item.description}</p>

                                                        {/* Actions */}
                                                        <div className="flex gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0 duration-200">
                                                            <button
                                                                onClick={() => handleEditItemClick(item)}
                                                                className="flex items-center gap-1 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded"
                                                            >
                                                                <Pencil size={12} /> Bewerken
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteItem(item.id!)}
                                                                className="flex items-center gap-1 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 px-2 py-1 rounded"
                                                            >
                                                                <Trash2 size={12} /> Verwijderen
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}

                        {categories.length === 0 && (
                            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-8 text-center text-yellow-800">
                                <AlertCircle className="mx-auto mb-2 opacity-50" />
                                <p className="font-bold">Je menu is leeg.</p>
                                <p className="text-sm opacity-80">Begin met het aanmaken van een Categorie (bv. "Hoofdgerechten") in het bewerkingspaneel.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}