import React from 'react';
import { ArrowRight, ChefHat, Store, MonitorPlay } from 'lucide-react';
import { BrandButton } from '../common/BrandButton';

interface WelcomeOverlayProps {
    currentStep: number;
    onStepChange: (step: number) => void;
    onComplete: () => void;
}

export const WelcomeOverlay: React.FC<WelcomeOverlayProps> = ({ currentStep, onStepChange, onComplete }) => {

    // Check if mobile
    const isMobile = window.innerWidth < 768;

    // --- POSITIONING LOGIC ---

    // Desktop: Spatial positioning (Left/Right panes)
    const getDesktopClasses = () => {
        switch (currentStep) {
            case 0: return 'items-center justify-center';
            case 1: return 'items-center justify-end pr-20'; // Point to Store (Left)
            case 2: return 'items-center justify-start pl-20'; // Point to Kitchen (Right)
            default: return 'items-center justify-center';
        }
    };

    // Mobile: Vertical positioning relative to the top Tab Switcher
    const getMobileClasses = () => {
        switch (currentStep) {
            case 0: return 'items-center justify-center p-4'; // Center
            case 1: return 'items-start justify-center pt-24 px-4'; // Below Tab Switcher
            case 2: return 'items-start justify-center pt-24 px-4'; // Below Tab Switcher
            default: return 'items-end justify-center pb-24 px-4'; // Bottom (for final step)
        }
    };

    const containerClasses = isMobile ? getMobileClasses() : getDesktopClasses();

    // --- CONTENT CONFIG ---
    const content = [
        {
            title: "Welkom bij Pakmee.be!",
            text: "Dit is een live demonstratie van ons bestelplatform. We leggen snel uit hoe het werkt.",
            icon: <MonitorPlay size={48} className="text-blue-500" />,
            action: "Start Tour"
        },
        {
            title: "Voor de Klant",
            text: isMobile
                ? "Hierboven staat de tab op 'Winkel'. Dit zien je klanten op hun telefoon."
                : "Links zie de website van je zaak. Klanten gebruiken dit om bestellingen te plaatsen.",
            icon: <Store size={32} className="text-green-500" />,
            action: "Volgende"
        },
        {
            title: "Voor de Keuken",
            text: isMobile
                ? "We hebben gewisseld naar de tab 'Keuken'. Hier komen bestellingen binnen."
                : "Rechts zie je het keukenscherm. Bestellingen komen hier live binnen.",
            icon: <ChefHat size={32} className="text-orange-500" />,
            action: "Volgende"
        },
        {
            title: "Probeer het Zelf",
            text: isMobile
                ? "1. Plaats een bestelling via de winkel.\n2. Verwerk de bestelling via de keuken.\n3. Wissel van design met de \'Vibe\' knop.\n4. Pas de menu aan via de \'Manager\' knop."
                : "1. Plaats links een bestelling.\n2. Verwerk de bestelling rechts.\n3. Wissel van design met de \'Vibe\' knop.\n4. Pas de menu aan via de \'Manager\' knop.",
            icon: <ArrowRight size={48} className="text-purple-500" />,
            action: "Naar de Demo"
        }
    ];

    const stepData = content[currentStep];

    return (
        <div className={`fixed inset-0 z-[200] bg-black/40 transition-all duration-500 flex ${containerClasses}`}>
            <div className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-sm animate-in fade-in zoom-in-95 duration-300 relative border border-white/20">

                {/* Mobile Arrow Pointer */}
                {isMobile && (currentStep === 1 || currentStep === 2) && (
                    <div
                        className={`absolute -top-3 w-6 h-6 bg-white rotate-45 transform transition-all duration-500`}
                        style={{
                            left: currentStep === 1 ? '35%' : '65%', // Points to Left Tab or Right Tab
                            marginLeft: '-12px'
                        }}
                    />
                )}

                <div className="flex flex-col items-center text-center space-y-3 relative z-10">
                    <div className="bg-gray-50 p-3 rounded-full">
                        {stepData.icon}
                    </div>

                    <h2 className="text-xl md:text-2xl font-bold text-gray-900 font-heading">{stepData.title}</h2>
                    <p className="text-gray-600 leading-relaxed whitespace-pre-line text-sm">{stepData.text}</p>

                    <div className="pt-4 w-full">
                        <BrandButton
                            fullWidth
                            size="md"
                            onClick={() => {
                                if (currentStep < 3) {
                                    onStepChange(currentStep + 1);
                                } else {
                                    onComplete();
                                }
                            }}
                        >
                            {stepData.action}
                        </BrandButton>
                    </div>

                    {currentStep >= 0 && (
                        <button
                            onClick={() => onComplete()}
                            className="text-xs text-gray-400 hover:text-gray-600 underline pt-2"
                        >
                            Overslaan
                        </button>
                    )}
                </div>

                {/* Progress Dots */}
                <div className="flex justify-center gap-1.5 mt-4">
                    {[0, 1, 2, 3].map(i => (
                        <div
                            key={i}
                            className={`h-1.5 rounded-full transition-all ${i === currentStep ? 'bg-blue-600 w-6' : 'bg-gray-200 w-1.5'}`}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};