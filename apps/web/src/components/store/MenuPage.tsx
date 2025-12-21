import { useEffect, useState, useRef } from "react";
import { useOutletContext } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import { HeroSection } from "../../components/store/HeroSection";
import { CategoryNav } from "../../components/store/CategoryNav";
import { MenuGridItem } from "../../components/store/MenuGridItem";
import { ItemDetailModal } from "../../components/store/ItemDetailModal";

// Types
interface MenuItem {
    id: string;
    name: string;
    description?: string;
    price: number;
    image_url?: string;
    is_available: boolean;
    category_id: string;
}

interface Category {
    id: string;
    name: string;
    items: MenuItem[];
}

export function MenuPage() {
    // 1. Context & State
    const { config } = useOutletContext<any>();
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState<string>('');
    const { addToCart } = useCart();

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
                        // ID format is "cat-UUID", strip prefix to get raw ID
                        const id = entry.target.id.replace('cat-', '');
                        setActiveCategory(id);
                    }
                });
            },
            {
                // Trigger when section hits the top area of viewport
                rootMargin: '-100px 0px -60% 0px',
                threshold: 0
            }
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
        // MVP Compatibility: Loop to add quantity since Context assumes single item add
        // In a production refactor, update `addToCart` to accept { ...item, qty, notes }
        for (let i = 0; i < qty; i++) {
            addToCart(item);
        }
        // Note: 'notes' would be sent to API in checkout payload in full version
    };

    // 5. Loading State
    if (loading) return (
        <div className="min-h-screen bg-app animate-pulse">
            <div className="h-[45vh] min-h-[350px] w-full bg-gray-300" />
            <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-200">
                <div className="max-w-screen-lg mx-auto px-4 py-4 flex gap-3 overflow-hidden">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="h-9 w-24 bg-gray-300 rounded-full shrink-0" />
                    ))}
                </div>
            </div>
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
            {/* Dynamic Hero based on Preset (Centered vs Split vs Banner) */}
            <HeroSection name={config.name} preset={presetName} />

            {/* Sticky Navigation */}
            <CategoryNav categories={categories} activeCategory={activeCategory} />

            {/* Menu Grid Canvas */}
            <div id="cat-list" className="max-w-screen-xl mx-auto px-4 py-8 md:px-8 scroll-mt-24">
                {categories.map((cat) => {
                    if (cat.items.length === 0) return null;

                    return (
                        <div key={cat.id} id={`cat-${cat.id}`} className="mb-16 scroll-mt-32">
                            {/* Category Header */}
                            <h2 className="text-3xl font-bold font-heading mb-6 text-text-main case-brand flex items-center gap-4">
                                {cat.name}
                                {/* Decorative separator line */}
                                <span className="h-px flex-1 bg-border/60"></span>
                            </h2>

                            {/* Responsive Grid Layout */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                                {cat.items.map((item) => (
                                    <MenuGridItem
                                        key={item.id}
                                        item={item}
                                        onAdd={handleItemClick} // Triggers Modal
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

            {/* Themed Item Details Modal */}
            <ItemDetailModal
                isOpen={isModalOpen}
                item={selectedItem}
                onClose={() => setIsModalOpen(false)}
                onAddToCart={handleConfirmAdd}
                preset={presetName}
            />
        </>
    );
}