import React, { useState, useEffect } from 'react';
import { X, Minus, Plus } from 'lucide-react';
import { BrandButton } from '../common/BrandButton';
import { useCart } from '../../context/CartContext';

interface ModifierOption {
    id: string;
    name: string;
    price_adjustment: number;
}

interface ModifierGroup {
    id: string;
    name: string;
    min_selection: number;
    max_selection: number;
    options: ModifierOption[];
}

interface ItemDetailModalProps {
    item: any;
    isOpen: boolean;
    onClose: () => void;
    preset?: string;
}

export const ItemDetailModal: React.FC<ItemDetailModalProps> = ({
    item,
    isOpen,
    onClose,
    preset = 'mono-luxe'
}) => {
    const { addToCart } = useCart();
    const [qty, setQty] = useState(1);
    const [notes, setNotes] = useState('');

    // State to track selected modifiers: { groupId: [optionId, optionId] }
    const [selections, setSelections] = useState<Record<string, string[]>>({});

    // Reset state when item changes
    useEffect(() => {
        setQty(1);
        setNotes('');
        setSelections({});
    }, [item, isOpen]);

    if (!isOpen || !item) return null;

    // --- Helpers ---

    const handleOptionToggle = (group: ModifierGroup, optionId: string) => {
        setSelections(prev => {
            const current = prev[group.id] || [];

            // Radio Logic
            if (group.max_selection === 1) {
                return { ...prev, [group.id]: [optionId] };
            }

            // Checkbox Logic
            if (current.includes(optionId)) {
                return { ...prev, [group.id]: current.filter(id => id !== optionId) };
            } else {
                return { ...prev, [group.id]: [...current, optionId] };
            }
        });
    };

    const getSelectionTotal = () => {
        let total = 0;
        item.modifier_groups?.forEach((group: ModifierGroup) => {
            const selectedIds = selections[group.id] || [];
            selectedIds.forEach(id => {
                const opt = group.options.find(o => o.id === id);
                if (opt) total += opt.price_adjustment;
            });
        });
        return total;
    };

    const isSelectionValid = () => {
        if (!item.modifier_groups) return true;
        for (const group of item.modifier_groups) {
            const count = (selections[group.id] || []).length;
            if (count < group.min_selection) return false;
        }
        return true;
    };

    const handleAddToCart = () => {
        // Build modifiers list for cart
        const cartModifiers: any[] = [];
        item.modifier_groups?.forEach((group: ModifierGroup) => {
            const selectedIds = selections[group.id] || [];
            selectedIds.forEach(id => {
                const opt = group.options.find(o => o.id === id);
                if (opt) {
                    cartModifiers.push({
                        groupId: group.id,
                        groupName: group.name,
                        optionId: opt.id,
                        optionName: opt.name,
                        price: opt.price_adjustment
                    });
                }
            });
        });

        addToCart({
            id: item.id,
            name: item.name,
            price: item.price,
            image_url: item.image_url,
            modifiers: cartModifiers,
            notes
        });
        onClose();
    };

    const basePrice = item.price;
    const modTotal = getSelectionTotal();
    const finalPrice = basePrice + modTotal;
    const isValid = isSelectionValid();

    // --- Styles ---
    const backdropStyles = {
        'mono-luxe': 'bg-black/80 backdrop-blur-sm',
        'fresh-market': 'bg-green-900/20 backdrop-blur-md',
        'tech-ocean': 'bg-[#0F172A]/70 backdrop-blur-[var(--glass-blur)]'
    }[preset] || 'bg-black/50';

    const modalStyles = {
        'mono-luxe': 'rounded-none border border-white/10 max-w-2xl',
        'fresh-market': 'rounded-[32px] border-none shadow-2xl max-w-lg',
        'tech-ocean': 'rounded-xl border border-primary/30 shadow-[0_0_40px_rgba(59,130,246,0.2)] max-w-xl'
    }[preset] || 'rounded-lg';

    return (
        <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${backdropStyles} animate-in fade-in`}>
            <div className="absolute inset-0" onClick={onClose} />
            <div className={`relative w-full bg-surface overflow-hidden flex flex-col max-h-[90vh] ${modalStyles} animate-in zoom-in-95 slide-in-from-bottom-4 duration-300`}>

                <button onClick={onClose} className="absolute top-4 right-4 z-20 bg-black/20 hover:bg-black/40 text-white p-2 rounded-full backdrop-blur-md transition-all">
                    <X size={20} />
                </button>

                <div className="flex-1 overflow-y-auto">
                    {/* Image Header */}
                    <div className="relative h-48 sm:h-64 bg-gray-100 shrink-0">
                        {item.image_url && <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />}
                    </div>

                    <div className="p-6 md:p-8 space-y-6">
                        <div>
                            <h2 className="text-3xl font-bold font-heading text-text-main case-brand leading-none mb-2">{item.name}</h2>
                            <p className="text-text-muted leading-relaxed">{item.description}</p>
                        </div>

                        {/* Modifiers Section */}
                        {item.modifier_groups?.map((group: ModifierGroup) => (
                            <div key={group.id} className="border-t border-border pt-4">
                                <div className="flex justify-between items-center mb-3">
                                    <h3 className="font-bold text-lg">{group.name}</h3>
                                    {group.min_selection > 0 && (
                                        <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded font-bold uppercase">Required</span>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    {group.options.map((opt) => {
                                        const isSelected = (selections[group.id] || []).includes(opt.id);
                                        return (
                                            <div
                                                key={opt.id}
                                                onClick={() => handleOptionToggle(group, opt.id)}
                                                className={`
                                                    flex justify-between items-center p-3 rounded cursor-pointer border transition-all
                                                    ${isSelected ? 'border-primary bg-primary/5' : 'border-border hover:bg-gray-50'}
                                                `}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${isSelected ? 'border-primary bg-primary' : 'border-gray-400'}`}>
                                                        {isSelected && <div className="w-2 h-2 bg-white rounded-full" />}
                                                    </div>
                                                    <span className={isSelected ? 'font-bold text-primary' : ''}>{opt.name}</span>
                                                </div>
                                                {opt.price_adjustment > 0 && (
                                                    <span className="text-sm text-text-muted">+${(opt.price_adjustment / 100).toFixed(2)}</span>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}

                        {/* Notes */}
                        <div className="border-t border-border pt-4">
                            <label className="block text-sm font-bold text-text-main mb-2 uppercase tracking-wide">Special Instructions</label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                className="w-full bg-[var(--color-bg-app)] border-border border rounded-[var(--radius-md)] p-3 outline-none resize-none h-24"
                                placeholder="Allergies, etc."
                            />
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-border bg-surface/50 backdrop-blur-sm flex items-center gap-4">
                    <div className="flex items-center gap-3 bg-[var(--color-bg-app)] p-1 rounded-[var(--radius-lg)] border border-border">
                        <button onClick={() => setQty(Math.max(1, qty - 1))} className="p-3 hover:bg-white rounded-[var(--radius-lg)]" disabled={qty <= 1}><Minus size={18} /></button>
                        <span className="font-bold text-lg w-6 text-center">{qty}</span>
                        <button onClick={() => setQty(qty + 1)} className="p-3 hover:bg-white rounded-[var(--radius-lg)]"><Plus size={18} /></button>
                    </div>
                    <BrandButton fullWidth size="lg" onClick={handleAddToCart} disabled={!isValid}>
                        Add - ${((finalPrice * qty) / 100).toFixed(2)}
                    </BrandButton>
                </div>
            </div>
        </div>
    );
};