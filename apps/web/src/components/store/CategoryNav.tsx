import React, { useEffect, useRef } from 'react';

interface Category {
    id: string;
    name: string;
}

interface CategoryNavProps {
    categories: Category[];
    activeCategory?: string;
    onCategorySelect?: (id: string) => void;
}

export const CategoryNav: React.FC<CategoryNavProps> = ({ categories, activeCategory, onCategorySelect }) => {
    // 1. Create a ref to store references to specific category buttons
    const itemsRef = useRef<Map<string, HTMLButtonElement>>(new Map());

    // 2. Effect: Scroll the active button into view whenever activeCategory changes
    useEffect(() => {
        if (activeCategory) {
            const node = itemsRef.current.get(activeCategory);
            if (node) {
                node.scrollIntoView({
                    behavior: 'smooth',
                    block: 'nearest',
                    inline: 'center' // This centers the active button horizontally
                });
            }
        }
    }, [activeCategory]);

    const scrollToCategory = (id: string) => {
        // 1. Trigger parent callback (to pause scroll spy & update active state)
        if (onCategorySelect) {
            onCategorySelect(id);
        }

        // 2. Perform Scroll
        // FIX: Wrap in setTimeout to prevent conflict with the 'useEffect' scroll above.
        // If both fire simultaneously (Nav Button Scroll + Page Scroll), browsers may cancel one.
        setTimeout(() => {
            const element = document.getElementById(`cat-${id}`);
            if (element) {
                // Use scrollIntoView to support nested scroll containers (like in SplitView)
                element.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }, 10);
    };

    return (
        <div className="sticky top-0 z-30 bg-surface/85 backdrop-blur-md border-b border-border/50 transition-all duration-300 supports-[backdrop-filter]:bg-surface/60">
            <nav className="max-w-screen-lg mx-auto flex overflow-x-auto whitespace-nowrap hide-scrollbar px-4 py-4 gap-3 items-center">
                {categories.map((cat) => (
                    <button
                        key={cat.id}
                        // 3. Store the DOM element in our ref map
                        ref={(el) => {
                            if (el) itemsRef.current.set(cat.id, el);
                            else itemsRef.current.delete(cat.id);
                        }}
                        onClick={() => scrollToCategory(cat.id)}
                        className={`
              px-5 py-2 rounded-full text-sm font-bold tracking-wide transition-all duration-200 active:scale-95 border
              ${activeCategory === cat.id
                                ? 'bg-primary text-primary-fg border-primary shadow-md shadow-primary/20 scale-105'
                                : 'bg-transparent text-text-muted border-transparent hover:bg-gray-100 hover:text-text-main'}
            `}
                    >
                        {cat.name}
                    </button>
                ))}
                {/* Spacer to ensure the last item isn't flush with the edge */}
                <div className="w-4 shrink-0" />
            </nav>

            {/* Mobile Scroll Indicator: Gradient Fade on the right */}
            <div className="absolute right-0 top-0 h-full w-12 bg-gradient-to-l from-surface to-transparent pointer-events-none md:hidden" />
        </div>
    );
};