import { useEffect, useState, useRef } from "react";
import { useOutletContext } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import { HeroSection } from "../../components/store/HeroSection";
import { CategoryNav } from "../../components/store/CategoryNav";
import { MenuGridItem } from "../../components/store/MenuGridItem";
import { ItemDetailModal } from "../../components/store/ItemDetailModal";
import { Zap } from "lucide-react";
import { BrandButton } from "../common/BrandButton";

// Types
interface MenuItem {
    id: string;
    name: string;
    description?: string;
    price: number;
    image_url?: string;
    is_available: boolean;
    category_id: string;
    modifier_groups?: any[];
}

interface Category {
    id: string;
    name: string;
    items: MenuItem[];
}

interface MenuPageProps {
    config?: any;
}

export function MenuPage({ config: propConfig }: MenuPageProps) {
    // 1. Context & State
    const outletCtx = useOutletContext<any>();
    // Priority: Prop Config > Outlet Config > Default
    const config = propConfig || outletCtx?.config || { preset: 'mono-luxe', name: 'Loading...' };

    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState<string>('');
    const { addToCart, toggleDrawer } = useCart();

    // Modal State
    const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Read directly from the flattened config object provided by the API
    const presetName = config.preset || 'mono-luxe';

    // Refs
    const observerRef = useRef<IntersectionObserver | null>(null);

    // 2. Data Fetching
    useEffect(() => {
        fetch('/api/v1/store/menu')
            .then(res => res.json())
            .then(data => {
                setCategories(data);
                if (data.length > 0) setActiveCategory(data[0].id);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, []);

    // 3. Scroll Spy / Intersection Observer
    useEffect(() => {
        if (loading || categories.length === 0) return;

        if (observerRef.current) observerRef.current.disconnect();

        observerRef.current = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        const id = entry.target.id.replace('cat-', '');
                        setActiveCategory(id);
                    }
                });
            },
            { rootMargin: '-100px 0px -60% 0px', threshold: 0 }
        );

        categories.forEach((cat) => {
            const el = document.getElementById(`cat-${cat.id}`);
            if (el) observerRef.current?.observe(el);
        });

        return () => observerRef.current?.disconnect();
    }, [loading, categories]);

    // 4. Interaction Handlers
    const handleItemClick = (item: any) => {
        setSelectedItem(item);
        setIsModalOpen(true);
    };

    const handleConfirmAdd = (item: any, qty: number, notes: string) => {
        for (let i = 0; i < qty; i++) {
            addToCart(item);
        }
    };

    // QUICK BUNDLE LOGIC ---
    const handleQuickDemoOrder = () => {
        if (categories.length === 0) return;

        // Flatten all items
        const allItems = categories.flatMap(c => c.items);

        // Strategy: Try to find a Main, a Side, and a Drink
        // Heuristic: Search by name keywords, fallback to first item of first 3 categories
        const findItem = (keywords: string[]) =>
            allItems.find(i => keywords.some(k => i.name.toLowerCase().includes(k)));

        const burgerOrMain = findItem(['burger', 'pizza', 'whopper', 'steak']) || allItems[0];
        const fryOrSide = findItem(['fry', 'fries', 'salad', 'wings']) || allItems[1] || allItems[0];
        const drink = findItem(['shake', 'coke', 'soda', 'water']) || allItems[2] || allItems[0];

        // Add to cart (filter duplicates if menu is small)
        const bundle = new Set([burgerOrMain, fryOrSide, drink]);

        bundle.forEach(item => {
            if (item) addToCart({
                id: item.id,
                name: item.name,
                price: item.price,
                image_url: item.image_url,
                modifiers: [], // Quick add skips modifiers
                notes: 'Demo Quick Add'
            });
        });

        // Open drawer to show result
        toggleDrawer(true);
    };

    // 5. Loading State
    if (loading) return (
        <div className="min-h-screen bg-app animate-pulse">
            <div className="h-[45vh] min-h-[350px] w-full bg-gray-300" />
            <div className="max-w-screen-xl mx-auto px-4 py-8 space-y-12">
                {[1, 2].map((section) => (
                    <div key={section} className="space-y-6">
                        <div className="h-8 w-48 bg-gray-300 rounded" />
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[1, 2, 3].map((item) => (
                                <div key={item} className="h-64 bg-white rounded-xl border border-gray-200" />
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    // 6. Main Render
    return (
        <>
            <HeroSection name={config.name} preset={presetName} />

            <CategoryNav categories={categories} activeCategory={activeCategory} />

            {/* Quick Add Banner for Demo */}
            <div className="max-w-screen-xl mx-auto px-4 mt-6">
                <button
                    onClick={handleQuickDemoOrder}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-3 rounded-lg shadow-md flex items-center justify-center gap-2 hover:shadow-lg hover:scale-[1.01] transition-all group"
                >
                    <div className="bg-white/20 p-1 rounded-full group-hover:rotate-12 transition-transform">
                        <Zap size={16} fill="currentColor" />
                    </div>
                    <span className="font-bold text-sm">Demo Shortcut: Add "Full Meal" Bundle Instantly</span>
                </button>
            </div>

            <div id="cat-list" className="max-w-screen-xl mx-auto px-4 py-8 md:px-8 scroll-mt-24">
                {categories.map((cat) => {
                    if (cat.items.length === 0) return null;

                    return (
                        <div key={cat.id} id={`cat-${cat.id}`} className="mb-16 scroll-mt-32">
                            <h2 className="text-3xl font-bold font-heading mb-6 text-text-main case-brand flex items-center gap-4">
                                {cat.name}
                                <span className="h-px flex-1 bg-border/60"></span>
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                                {cat.items.map((item) => (
                                    <MenuGridItem
                                        key={item.id}
                                        item={item}
                                        onAdd={handleItemClick}
                                        preset={presetName}
                                    />
                                ))}
                            </div>
                        </div>
                    );
                })}

                {categories.length === 0 && (
                    <div className="text-center py-20 text-text-muted">
                        No menu items found.
                    </div>
                )}
            </div>

            <ItemDetailModal
                isOpen={isModalOpen}
                item={selectedItem}
                onClose={() => setIsModalOpen(false)}
                // @ts-ignore
                onAddToCart={handleConfirmAdd}
                preset={presetName}
            />
        </>
    );
}