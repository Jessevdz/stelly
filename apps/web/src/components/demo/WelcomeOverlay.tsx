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

    // Mobile Logic: Always center bottom
    // Desktop Logic: Spatial positioning
    const getPositionClasses = () => {
        if (isMobile) return 'items-end justify-center pb-24'; // Bottom center on mobile

        switch (currentStep) {
            case 0: return 'items-center justify-center';
            case 1: return 'items-center justify-end pr-20';
            case 2: return 'items-center justify-start pl-20';
            default: return 'items-center justify-center';
        }
    };

    const content = [
        {
            title: "Welkom bij Stelly",
            text: "Dit is een live demonstratie van ons bestelplatform. We leggen snel uit wat je mag verwachten.",
            icon: <MonitorPlay size={48} className="text-blue-500" />,
            action: "Start Tour"
        },
        {
            title: "Voor de Klant",
            text: isMobile
                ? "Hier zie je de mobiele website. Klanten bestellen hiermee op hun smartphone."
                : "Links zie de website van je zaak. Deze is volledig aanpasbaar. Klanten gebruiken dit om bestellingen te plaatsen.",
            icon: <Store size={48} className="text-green-500" />,
            action: "Volgende"
        },
        {
            title: "Voor de Keuken",
            text: isMobile
                ? "We switchen nu naar het keukenscherm. Bestellingen komen hier live binnen."
                : "Rechts zie je het bestelscherm voor de keuken. Alle bestellingen van de website komen hier onmiddellijk binnen.",
            icon: <ChefHat size={48} className="text-orange-500" />,
            action: "Volgende"
        },
        {
            title: "Probeer het Zelf",
            text: "1. Maak links een bestelling.\n2. Verwerk de bestelling rechts.\n3. Wissel van design met de \'Vibe\' knop.\n4. Pas de menu aan via de \'Manager\' knop.",
            icon: <ArrowRight size={48} className="text-purple-500" />,
            action: "Naar de Demo"
        }
    ];

    const stepData = content[currentStep];

    return (
        <div className={`fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm transition-all duration-500 flex ${getPositionClasses()}`}>
            <div className="bg-white p-6 md:p-8 rounded-2xl shadow-2xl w-full max-w-md animate-in fade-in zoom-in-95 slide-in-from-bottom-8 duration-300 mx-4 border border-white/20">
                <div className="flex flex-col items-center text-center space-y-4">
                    <div className="bg-gray-50 p-4 rounded-full mb-2">
                        {stepData.icon}
                    </div>

                    <h2 className="text-2xl md:text-3xl font-bold text-gray-900 font-heading">{stepData.title}</h2>
                    <p className="text-gray-600 leading-relaxed whitespace-pre-line text-sm md:text-base">{stepData.text}</p>

                    <div className="pt-4 w-full">
                        <BrandButton
                            fullWidth
                            size="lg"
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
                            className="text-xs text-gray-400 hover:text-gray-600 underline"
                        >
                            Overslaan
                        </button>
                    )}
                </div>

                {/* Progress Dots */}
                <div className="flex justify-center gap-2 mt-6">
                    {[0, 1, 2, 3].map(i => (
                        <div
                            key={i}
                            className={`h-2 w-2 rounded-full transition-all ${i === currentStep ? 'bg-blue-600 w-6' : 'bg-gray-200'}`}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};