import React, { createContext, useContext, useState, useEffect } from 'react';
import { nanoid } from 'nanoid';

export interface CartModifier {
    groupId: string;
    groupName: string;
    optionId: string;
    optionName: string;
    price: number;
}

export interface CartItem {
    cartId: string; // Unique ID for this instance in cart
    id: string;     // Product ID
    name: string;
    price: number;
    qty: number;
    image_url?: string;
    modifiers: CartModifier[];
    notes?: string;
}

interface CartContextType {
    items: CartItem[];
    addToCart: (item: Omit<CartItem, 'qty' | 'cartId'>) => void;
    removeFromCart: (cartId: string) => void;
    clearCart: () => void;
    cartTotal: number;
    cartCount: number;
    isDrawerOpen: boolean;
    toggleDrawer: (open?: boolean) => void;
}

const CartContext = createContext<CartContextType | null>(null);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [items, setItems] = useState<CartItem[]>([]);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    useEffect(() => {
        const saved = localStorage.getItem('omni_cart');
        if (saved) setItems(JSON.parse(saved));
    }, []);

    useEffect(() => {
        localStorage.setItem('omni_cart', JSON.stringify(items));
    }, [items]);

    const addToCart = (newItem: Omit<CartItem, 'qty' | 'cartId'>) => {
        setItems(prev => {
            // Check if exact same item configuration exists
            const existingIndex = prev.findIndex(i =>
                i.id === newItem.id &&
                JSON.stringify(i.modifiers) === JSON.stringify(newItem.modifiers) &&
                i.notes === newItem.notes
            );

            if (existingIndex > -1) {
                const updated = [...prev];
                updated[existingIndex].qty += 1;
                return updated;
            }

            return [...prev, { ...newItem, qty: 1, cartId: nanoid() }];
        });
        setIsDrawerOpen(true);
    };

    const removeFromCart = (cartId: string) => {
        setItems(prev => prev.filter(i => i.cartId !== cartId));
    };

    const clearCart = () => setItems([]);

    const cartTotal = items.reduce((sum, item) => {
        const modsTotal = item.modifiers.reduce((mSum, mod) => mSum + mod.price, 0);
        return sum + ((item.price + modsTotal) * item.qty);
    }, 0);

    const cartCount = items.reduce((sum, item) => sum + item.qty, 0);

    const toggleDrawer = (open?: boolean) => {
        setIsDrawerOpen(prev => open !== undefined ? open : !prev);
    };

    return (
        <CartContext.Provider value={{
            items, addToCart, removeFromCart, clearCart,
            cartTotal, cartCount, isDrawerOpen, toggleDrawer
        }}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) throw new Error('useCart must be used within CartProvider');
    return context;
};