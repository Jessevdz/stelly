import React from 'react';
import { Plus } from 'lucide-react';
import { BrandCard } from '../common/BrandCard';
import { BrandButton } from '../common/BrandButton';

interface MenuItemProps {
    item: any;
    onAdd: (item: any) => void;
    preset?: string;
}

export const MenuGridItem: React.FC<MenuItemProps> = ({ item, onAdd, preset = 'mono-luxe' }) => {

    const renderAddButton = () => {
        if (preset === 'fresh-market' || preset === 'stelly') {
            return (
                <div className="mt-2 md:mt-4">
                    <BrandButton
                        fullWidth
                        // Use small button on mobile, medium on desktop
                        size="sm"
                        className="md:text-sm md:py-2.5"
                        onClick={(e) => {
                            e.stopPropagation();
                            onAdd(item);
                        }}
                    >
                        {/* Compact text on mobile: Just "Add" or "+" */}
                        <span className="md:hidden flex items-center gap-1">
                            <Plus size={14} /> Add
                        </span>
                        <span className="hidden md:inline">
                            Add ${(item.price / 100).toFixed(2)}
                        </span>
                    </BrandButton>
                </div>
            );
        }

        if (preset === 'tech-ocean') {
            return (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onAdd(item);
                    }}
                    className="absolute top-2 right-2 md:top-3 md:right-3 bg-primary text-white p-1.5 md:p-2 rounded-[var(--radius-sm)] shadow-lg hover:brightness-110 active:scale-95 transition-all"
                >
                    <Plus size={16} className="md:w-5 md:h-5" />
                </button>
            );
        }

        // Default: Mono Luxe
        return (
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onAdd(item);
                }}
                className="
                    absolute bottom-0 right-0 
                    bg-primary text-primary-fg 
                    p-2 md:p-3 
                    rounded-tl-[var(--radius-lg)] 
                    hover:scale-110 transition-transform
                "
            >
                <Plus size={16} className="md:w-5 md:h-5" />
            </button>
        );
    };

    return (
        <BrandCard
            hoverEffect
            interactive
            className="flex flex-col h-full"
            onClick={() => onAdd(item)}
        >
            {/* Image Area - Aspect Ratio */}
            <div className="relative aspect-[4/3] w-full overflow-hidden bg-gray-100 group">
                {item.image_url ? (
                    <img
                        src={item.image_url}
                        alt={item.name}
                        loading="lazy"
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-text-muted text-xs md:text-sm">
                        No Image
                    </div>
                )}

                {preset === 'tech-ocean' && renderAddButton()}
            </div>

            {/* Content Area - Reduced Padding */}
            <div className="flex flex-col flex-1 p-3 md:p-5">
                <div className="flex justify-between items-start mb-1 md:mb-2 gap-2">
                    {/* Smaller Title Font */}
                    <h3 className="text-sm md:text-lg font-bold font-heading text-text-main leading-tight case-brand line-clamp-2">
                        {item.name}
                    </h3>

                    {(preset !== 'fresh-market' && preset !== 'stelly') && (
                        <span className="font-bold text-primary text-xs md:text-lg whitespace-nowrap">
                            ${(item.price / 100).toFixed(2)}
                        </span>
                    )}
                </div>

                {/* Hide Description on Mobile to save space, or make it very small/truncated */}
                <p className="text-xs md:text-sm text-text-muted line-clamp-2 mb-2 md:mb-4 flex-1 hidden md:block">
                    {item.description || "No description available."}
                </p>
                {/* Mobile-only price display for themes that put price in button usually */}
                {(preset === 'fresh-market' || preset === 'stelly') && (
                    <p className="text-xs font-bold text-primary md:hidden mb-1">
                        ${(item.price / 100).toFixed(2)}
                    </p>
                )}

                {(preset === 'fresh-market' || preset === 'stelly') && renderAddButton()}
            </div>

            {preset === 'mono-luxe' && renderAddButton()}
        </BrandCard>
    );
};