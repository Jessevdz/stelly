import { useEffect, useState, useRef } from "react"; // Added useRef
import { useOutletContext } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
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
    const config = propConfig || outletCtx?.config || { preset: 'mono-luxe', name: 'Loading...' };

    // <--- 2. Get Token from Auth Context
    const { token } = useAuth();

    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState<string>('');
    const { addToCart } = useCart();

    // Modal State
    const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Ref to prevent observer loops if user clicks nav manually
    const isManualScroll = useRef(false);

    const presetName = config.preset || 'mono-luxe';

    // 3. Data Fetching
    useEffect(() => {
        const headers: HeadersInit = {};
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        fetch('/api/v1/store/menu', { headers })
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
    }, [token]);

    // --- NEW: Scroll Spy Logic ---
    useEffect(() => {
        if (loading || categories.length === 0) return;

        const observerOptions = {
            root: null,
            // rootMargin defines the "active area". 
            // -100px from top accounts for the sticky header.
            // -60% from bottom means we only care about the top 40% of the screen.
            rootMargin: '-100px 0px -60% 0px',
            threshold: 0
        };

        const observer = new IntersectionObserver((entries) => {
            // If we are scrolling via click, ignore observer updates briefly
            if (isManualScroll.current) return;

            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    const id = entry.target.id.replace('cat-', '');
                    setActiveCategory(id);
                }
            });
        }, observerOptions);

        categories.forEach((cat) => {
            const element = document.getElementById(`cat-${cat.id}`);
            if (element) observer.observe(element);
        });

        return () => observer.disconnect();
    }, [loading, categories]);

    // 4. Interaction Handlers
    const handleItemClick = (item: any) => {
        setSelectedItem(item);
        setIsModalOpen(true);
    };

    const handleConfirmAdd = (item: any, qty: number) => {
        for (let i = 0; i < qty; i++) {
            addToCart(item);
        }
    };

    // Callback passed to CategoryNav to signal manual navigation
    const onCategoryClick = (id: string) => {
        setActiveCategory(id);
        isManualScroll.current = true;
        setTimeout(() => { isManualScroll.current = false; }, 800);
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

            <CategoryNav
                categories={categories}
                activeCategory={activeCategory}
                onCategorySelect={onCategoryClick} // Pass the handler
            />

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