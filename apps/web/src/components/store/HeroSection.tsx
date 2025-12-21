import React, { useState } from 'react';
import { MapPin, Clock, Phone, Info, X, Calendar, ArrowRight } from 'lucide-react';
import { BrandButton } from '../common/BrandButton';

// --- Types ---

interface HeroProps {
    name: string;
    coverImage?: string;
    preset?: string;
}

// --- SUB-COMPONENT: Restaurant Info Modal ---
const RestaurantInfoModal = ({ isOpen, onClose, name }: { isOpen: boolean; onClose: () => void; name: string }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="absolute inset-0" onClick={onClose} />
            <div className="relative bg-surface w-full max-w-md rounded-[var(--radius-lg)] shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 border border-border">

                {/* Header */}
                <div className="bg-[var(--color-bg-app)] p-6 border-b border-border flex justify-between items-start">
                    <div>
                        <h3 className="text-xl font-bold font-heading case-brand text-text-main">{name}</h3>
                        <p className="text-sm text-text-muted mt-1">Est. 2023</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-black/5 rounded-full transition-colors text-text-main">
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6">
                    {/* Location */}
                    <div className="flex gap-4">
                        <div className="bg-primary/10 p-3 rounded-full h-fit shrink-0">
                            <MapPin className="text-primary" size={20} />
                        </div>
                        <div>
                            <h4 className="font-bold text-text-main text-sm uppercase tracking-wide mb-1">Visit Us</h4>
                            <p className="text-text-muted text-sm leading-relaxed">
                                123 Culinary Avenue<br />
                                Food District, FD 90210
                            </p>
                            <a href="#" className="text-primary text-xs font-bold mt-2 inline-block hover:underline">Get Directions &rarr;</a>
                        </div>
                    </div>

                    {/* Hours */}
                    <div className="flex gap-4">
                        <div className="bg-primary/10 p-3 rounded-full h-fit shrink-0">
                            <Clock className="text-primary" size={20} />
                        </div>
                        <div>
                            <h4 className="font-bold text-text-main text-sm uppercase tracking-wide mb-1">Opening Hours</h4>
                            <ul className="text-text-muted text-sm space-y-1">
                                <li className="flex justify-between w-48"><span>Mon - Fri</span> <span>11:00 AM - 10:00 PM</span></li>
                                <li className="flex justify-between w-48"><span>Sat - Sun</span> <span>10:00 AM - 11:00 PM</span></li>
                            </ul>
                        </div>
                    </div>

                    {/* Contact */}
                    <div className="flex gap-4">
                        <div className="bg-primary/10 p-3 rounded-full h-fit shrink-0">
                            <Phone className="text-primary" size={20} />
                        </div>
                        <div>
                            <h4 className="font-bold text-text-main text-sm uppercase tracking-wide mb-1">Contact</h4>
                            <p className="text-text-muted text-sm">(555) 123-4567</p>
                            <p className="text-text-muted text-sm">hello@{window.location.host}</p>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 bg-[var(--color-bg-app)] border-t border-border text-center">
                    <BrandButton fullWidth onClick={onClose}>Close Info</BrandButton>
                </div>
            </div>
        </div>
    );
};

// --- MAIN COMPONENT ---

export const HeroSection: React.FC<HeroProps> = ({
    name,
    coverImage,
    preset = 'mono-luxe'
}) => {
    const [showInfo, setShowInfo] = useState(false);

    // Default fallback image
    const bgImage = coverImage || "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=1600&q=80";

    // Layout Mode logic
    const layoutMode = {
        'mono-luxe': 'centered',
        'fresh-market': 'split',
        'tech-ocean': 'banner'
    }[preset] || 'centered';

    const StatusBadge = () => (
        <div className="inline-flex items-center gap-2 mb-4 bg-surface/90 backdrop-blur-[var(--glass-blur)] px-4 py-1.5 rounded-[var(--radius-lg)] border border-border shadow-sm">
            <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
            </span>
            <span className="text-xs font-bold uppercase tracking-widest text-text-main font-heading">
                Open for Dining
            </span>
        </div>
    );

    return (
        <>
            <RestaurantInfoModal isOpen={showInfo} onClose={() => setShowInfo(false)} name={name} />

            {/* --- LAYOUT A: Centered (Mono Luxe) --- 
                Cinematic, brand-heavy, less clutter. */}
            {layoutMode === 'centered' && (
                <div className="relative h-[65vh] min-h-[500px] w-full overflow-hidden flex items-center justify-center text-center group">
                    {/* Parallax BG */}
                    <div
                        className="absolute inset-0 bg-cover bg-center transition-transform duration-[5s] ease-out group-hover:scale-105"
                        style={{ backgroundImage: `url(${bgImage})` }}
                    />
                    {/* Heavy Vignette Overlay */}
                    <div className="absolute inset-0 bg-black/40" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

                    <div className="relative z-10 p-8 max-w-4xl flex flex-col items-center animate-in fade-in slide-in-from-bottom-8 duration-700">
                        <div className="mb-6 opacity-80">
                            <span className="text-white text-xs font-bold tracking-[0.2em] uppercase border-b border-white/30 pb-1">
                                Est. 2023 • Fine Dining
                            </span>
                        </div>

                        <h1 className="text-5xl md:text-7xl font-black font-heading text-white tracking-tighter uppercase case-brand drop-shadow-2xl mb-6">
                            {name}
                        </h1>

                        <p className="text-white/80 text-lg md:text-xl max-w-xl font-light mb-10 leading-relaxed">
                            Experience authentic flavors crafted with passion.
                            Welcome to our digital home.
                        </p>

                        <div className="flex flex-col md:flex-row gap-4">
                            <BrandButton
                                onClick={() => document.getElementById('cat-list')?.scrollIntoView({ behavior: 'smooth' })}
                                size="lg"
                                variant="inverse"
                                className="min-w-[160px]"
                            >
                                View Menu
                            </BrandButton>
                            <BrandButton
                                onClick={() => setShowInfo(true)}
                                variant="outline-inverse"
                                size="lg"
                                className="min-w-[160px]"
                            >
                                Location & Info
                            </BrandButton>
                        </div>
                    </div>
                </div>
            )}

            {/* --- LAYOUT B: Split (Fresh Market) --- 
                Friendly, informative, storytelling focus. */}
            {layoutMode === 'split' && (
                <div className="relative w-full bg-[var(--color-bg-app)] pt-12 md:pt-20 pb-12 px-6 overflow-hidden">
                    <div className="max-w-screen-xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                        {/* Left: Content */}
                        <div className="order-2 md:order-1 space-y-6 z-10">
                            <StatusBadge />

                            <h1 className="text-4xl md:text-6xl font-bold font-heading text-text-main leading-[1.1] case-brand">
                                Welcome to <br />
                                <span className="text-primary">{name}</span>
                            </h1>

                            <p className="text-lg text-text-muted max-w-md leading-relaxed">
                                We believe in fresh ingredients, local sourcing, and food that makes you feel good. Order online or visit us today.
                            </p>

                            <div className="flex gap-4 pt-4">
                                <BrandButton
                                    size="lg"
                                    onClick={() => document.getElementById('cat-list')?.scrollIntoView({ behavior: 'smooth' })}
                                >
                                    Order Now <ArrowRight size={18} />
                                </BrandButton>
                                <BrandButton
                                    variant="ghost"
                                    icon={<Info size={18} />}
                                    onClick={() => setShowInfo(true)}
                                >
                                    Store Details
                                </BrandButton>
                            </div>

                            {/* Trust signals */}
                            <div className="pt-6 flex items-center gap-6 text-sm font-bold text-text-muted opacity-80">
                                <span className="flex items-center gap-2"><MapPin size={16} /> Local Favorite</span>
                                <span className="flex items-center gap-2"><Calendar size={16} /> Open 7 Days</span>
                            </div>
                        </div>

                        {/* Right: Organic Shape Image */}
                        <div className="order-1 md:order-2 relative">
                            <div className="aspect-[4/3] rounded-[var(--radius-lg)] overflow-hidden shadow-depth rotate-1 hover:rotate-0 transition-transform duration-500 z-10 relative">
                                <img src={bgImage} className="w-full h-full object-cover" alt="Hero" />

                                {/* Overlay Card */}
                                <div className="absolute bottom-4 left-4 bg-surface/90 backdrop-blur-md p-4 rounded-[var(--radius-md)] shadow-lg max-w-[200px] border border-border">
                                    <p className="text-xs font-bold text-primary uppercase mb-1">Today's Special</p>
                                    <p className="text-sm font-semibold text-text-main">Seasonal Harvest Bowl</p>
                                </div>
                            </div>

                            {/* Decorative Blobs */}
                            <div className="absolute top-10 -right-10 w-64 h-64 bg-primary/20 rounded-full blur-3xl -z-0" />
                            <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-secondary/20 rounded-full blur-3xl -z-0" />
                        </div>
                    </div>
                </div>
            )}

            {/* --- LAYOUT C: Banner (Tech Ocean) --- 
                Corporate, sleek, informative header. */}
            {layoutMode === 'banner' && (
                <div className="relative w-full bg-[var(--color-bg-surface)] border-b border-border">
                    {/* Top Banner Image */}
                    <div className="h-[200px] md:h-[300px] w-full relative overflow-hidden">
                        <div
                            className="absolute inset-0 bg-cover bg-center"
                            style={{ backgroundImage: `url(${bgImage})` }}
                        />
                        <div className="absolute inset-0 bg-black/50" />
                    </div>

                    {/* Floating Content Box */}
                    <div className="max-w-screen-xl mx-auto px-6 relative -mt-16 md:-mt-20 mb-8">
                        <div className="bg-surface rounded-[var(--radius-md)] shadow-depth border border-border p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">

                            <div className="space-y-3">
                                <div className="flex gap-2">
                                    <span className="bg-primary text-primary-fg px-2 py-0.5 rounded-[var(--radius-sm)] text-xs font-bold uppercase tracking-wide">
                                        Verified Store
                                    </span>
                                    <span className="bg-green-100 text-green-700 border border-green-200 px-2 py-0.5 rounded-[var(--radius-sm)] text-xs font-bold uppercase tracking-wide flex items-center gap-1">
                                        <div className="w-1.5 h-1.5 bg-green-600 rounded-full animate-pulse" /> Online
                                    </span>
                                </div>
                                <h1 className="text-3xl md:text-5xl font-bold font-heading text-text-main case-brand">
                                    {name}
                                </h1>
                                <p className="text-text-muted flex items-center gap-2 text-sm md:text-base">
                                    <MapPin size={16} /> San Francisco, CA • Open until 10:00 PM
                                </p>
                            </div>

                            <div className="flex gap-3 w-full md:w-auto">
                                <BrandButton
                                    variant="outline"
                                    onClick={() => setShowInfo(true)}
                                    className="flex-1 md:flex-none justify-center"
                                >
                                    <Info size={18} /> More Info
                                </BrandButton>
                                <BrandButton
                                    className="flex-1 md:flex-none justify-center"
                                    onClick={() => document.getElementById('cat-list')?.scrollIntoView({ behavior: 'smooth' })}
                                >
                                    Start Order
                                </BrandButton>
                            </div>

                        </div>
                    </div>
                </div>
            )}
        </>
    );
};