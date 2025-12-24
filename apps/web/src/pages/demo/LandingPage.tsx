import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Hexagon,
    ArrowRight,
    Smartphone,
    ChefHat,
    Globe,
    Percent,
    BarChart3,
    Zap,
    CheckCircle2,
    ShieldCheck,
    MousePointerClick
} from 'lucide-react';

export const LandingPage = () => {
    const navigate = useNavigate();

    const handleStartDemo = () => {
        navigate('/demo/split');
    };

    return (
        <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-blue-100 selection:text-blue-900 relative overflow-hidden">

            {/* --- Background Architecture --- */}
            {/* Subtle Grid Pattern for "Infrastructure" feel */}
            <div className="absolute inset-0 h-full w-full bg-white bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none z-0"></div>
            {/* Top gradient fade */}
            <div className="absolute top-0 left-0 right-0 h-[500px] bg-gradient-to-b from-blue-50/80 to-transparent pointer-events-none z-0"></div>

            {/* --- Navigation --- */}
            <nav className="fixed w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 transition-all">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-xl tracking-tight text-slate-900">
                        <Hexagon className="text-blue-600 fill-blue-600/10" size={28} strokeWidth={2} />
                        <span>OmniOrder</span>
                    </div>
                    <div className="flex items-center gap-6">
                        <button
                            onClick={handleStartDemo}
                            className="bg-slate-900 text-white text-sm font-bold px-5 py-2.5 rounded-full hover:bg-blue-600 transition-all active:scale-95 shadow-lg shadow-slate-900/10 hover:shadow-blue-600/20"
                        >
                            Start Demo
                        </button>
                    </div>
                </div>
            </nav>

            <main className="relative z-10 pt-32 pb-20">

                {/* --- Hero Section --- */}
                <section className="max-w-5xl mx-auto px-6 text-center mb-32">

                    <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 mb-6 leading-[1.1] animate-in slide-in-from-bottom-4 duration-700">
                        Jouw eigen bestelplatform. <br className="hidden md:block" />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Zonder gedoe.</span>
                    </h1>

                    <p className="text-xl text-slate-500 font-normal mb-10 max-w-2xl mx-auto leading-relaxed animate-in slide-in-from-bottom-6 duration-700 delay-100">
                        Zet jouw horecazaak onmiddellijk online. Geen vaste kosten, geen technische kennis nodig.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in slide-in-from-bottom-8 duration-700 delay-200">
                        <button
                            onClick={handleStartDemo}
                            className="w-full sm:w-auto group relative px-8 py-4 bg-blue-600 text-white font-bold rounded-full text-lg hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-600/30 transition-all active:scale-95 flex items-center justify-center gap-2"
                        >
                            Probeer De Demo
                            <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />
                        </button>
                    </div>
                </section>

                {/* --- Unified Features & Advantages --- */}
                <section className="max-w-7xl mx-auto px-6 mb-32">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">

                        {/* Visual Column (Dashboard & Mobile Mockup) */}
                        <div className="lg:col-span-5 order-2 lg:order-1 relative">
                            {/* Abstract Decor Elements */}
                            <div className="absolute -top-10 -left-10 w-64 h-64 bg-blue-400/10 rounded-full blur-3xl -z-10"></div>
                            <div className="absolute top-20 right-0 w-72 h-72 bg-indigo-400/10 rounded-full blur-3xl -z-10"></div>

                            {/* --- Mockup 1: Sales Dashboard --- */}
                            <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl shadow-slate-200/50 p-6 transform hover:scale-[1.02] transition-transform duration-500 relative z-10 mb-6">
                                <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-4">
                                    <div>
                                        <div className="text-xs text-slate-400 uppercase font-bold tracking-wider">Dagomzet</div>
                                        <div className="text-3xl font-bold text-slate-900 mt-1">€1.240,50</div>
                                    </div>
                                    <div className="bg-green-50 text-green-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 border border-green-100">
                                        <Zap size={12} className="fill-green-700" /> +12%
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="flex items-center gap-4 group cursor-default">
                                            <div className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 font-bold text-xs group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                                                #{100 + i}
                                            </div>
                                            <div className="flex-1">
                                                <div className="h-2.5 w-24 bg-slate-100 rounded-full mb-1.5 group-hover:bg-slate-200 transition-colors"></div>
                                                <div className="h-2 w-12 bg-slate-50 rounded-full"></div>
                                            </div>
                                            <div className="text-sm font-bold text-slate-700">€45.00</div>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-6 pt-4 border-t border-slate-100 flex justify-between items-center">
                                    <div className="flex -space-x-2">
                                        {[1, 2, 3].map(i => (
                                            <div key={i} className="w-8 h-8 rounded-full bg-slate-200 border-2 border-white"></div>
                                        ))}
                                    </div>
                                    <span className="text-xs text-slate-400 font-medium">Live bestellingen</span>
                                </div>
                            </div>

                            {/* --- Mockup 2: Floating Mobile Menu --- */}
                            <div className="absolute -bottom-12 -right-4 md:-right-12 w-48 bg-slate-900 text-white rounded-[2rem] p-4 shadow-2xl border-4 border-white transform rotate-[-6deg] hover:rotate-0 transition-all duration-500 z-20 hidden sm:block">
                                <div className="w-8 h-1 bg-slate-700 rounded-full mx-auto mb-4"></div>
                                <div className="space-y-3">
                                    <div className="bg-white/10 p-2 rounded-xl flex gap-3 items-center">
                                        <div className="w-8 h-8 rounded bg-orange-500/20"></div>
                                        <div className="flex-1 space-y-1">
                                            <div className="w-12 h-1.5 bg-white/40 rounded"></div>
                                            <div className="w-8 h-1.5 bg-white/20 rounded"></div>
                                        </div>
                                    </div>
                                    <div className="bg-white/10 p-2 rounded-xl flex gap-3 items-center">
                                        <div className="w-8 h-8 rounded bg-green-500/20"></div>
                                        <div className="flex-1 space-y-1">
                                            <div className="w-16 h-1.5 bg-white/40 rounded"></div>
                                            <div className="w-10 h-1.5 bg-white/20 rounded"></div>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-4 bg-blue-600 h-8 rounded-lg w-full flex items-center justify-center text-[10px] font-bold">
                                    Bestellen • €24.50
                                </div>
                            </div>
                        </div>

                        {/* Content Column */}
                        <div className="lg:col-span-7 order-1 lg:order-2">
                            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">
                                Alles wat je nodig hebt om <span className="text-blue-600">online te groeien</span>.
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-10">
                                {/* Benefit 1 */}
                                <div className="flex gap-4">
                                    <div className="shrink-0">
                                        <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                                            <Smartphone size={24} />
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900 text-lg mb-1">Geoptimaliseerd voor Smartphones</h3>
                                        <p className="text-slate-500 text-sm leading-relaxed">
                                            Je klanten moeten geen app downloaden. Je menu ziet er prachtig uit op elke smartphone.
                                        </p>
                                    </div>
                                </div>

                                {/* Benefit 2 */}
                                <div className="flex gap-4">
                                    <div className="shrink-0">
                                        <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600">
                                            <Percent size={24} />
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900 text-lg mb-1">Transparante Pricing</h3>
                                        <p className="text-slate-500 text-sm leading-relaxed">
                                            Geen vaste maandelijkse kosten. Je betaalt slechts <strong>1%</strong> per transactie, de laagste commissie op de markt.
                                        </p>
                                    </div>
                                </div>

                                {/* Benefit 3 */}
                                <div className="flex gap-4">
                                    <div className="shrink-0">
                                        <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center text-green-600">
                                            <ChefHat size={24} />
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900 text-lg mb-1">Smart Kitchen Display</h3>
                                        <p className="text-slate-500 text-sm leading-relaxed">
                                            Organiseer je bestellingen digitaal. Geen rondslingerende bonnetjes meer, maar een strakke workflow.
                                        </p>
                                    </div>
                                </div>

                                {/* Benefit 4 */}
                                <div className="flex gap-4">
                                    <div className="shrink-0">
                                        <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
                                            <BarChart3 size={24} />
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900 text-lg mb-1">Gratis Analytics</h3>
                                        <p className="text-slate-500 text-sm leading-relaxed">
                                            Inzichten in je piekuren en best verkopende producten, standaard inbegrepen.
                                        </p>
                                    </div>
                                </div>

                                {/* Benefit 5 */}
                                <div className="flex gap-4">
                                    <div className="shrink-0">
                                        <div className="w-12 h-12 rounded-xl bg-pink-50 flex items-center justify-center text-pink-600">
                                            <MousePointerClick size={24} />
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900 text-lg mb-1">Brand Customization</h3>
                                        <p className="text-slate-500 text-sm leading-relaxed">
                                            Jouw logo, jouw kleuren. Pas de look & feel aan zodat het past bij jouw zaak.
                                        </p>
                                    </div>
                                </div>

                                {/* Benefit 6 */}
                                <div className="flex gap-4">
                                    <div className="shrink-0">
                                        <div className="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600">
                                            <Globe size={24} />
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900 text-lg mb-1">Direct Online</h3>
                                        <p className="text-slate-500 text-sm leading-relaxed">
                                            Heb je nog geen website? Wij zetten je onmiddellijk op de kaart.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* --- Trust / Simplicity Bar --- */}
                <section className="bg-slate-50 border-y border-slate-100 py-16">
                    <div className="max-w-4xl mx-auto px-6 text-center">
                        <h2 className="text-2xl font-bold text-slate-900 mb-8">Groei zonder risico</h2>
                        <div className="flex flex-wrap justify-center gap-4 md:gap-12">
                            <div className="flex items-center gap-2 text-slate-600 font-medium bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm">
                                <CheckCircle2 className="text-blue-600" size={20} />
                                <span>Geen opstartkosten</span>
                            </div>
                            <div className="flex items-center gap-2 text-slate-600 font-medium bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm">
                                <CheckCircle2 className="text-blue-600" size={20} />
                                <span>Geen maandelijkse kosten</span>
                            </div>
                            <div className="flex items-center gap-2 text-slate-600 font-medium bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm">
                                <ShieldCheck className="text-blue-600" size={20} />
                                <span>1% bestelcommissie</span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* --- Final CTA --- */}
                <section className="pt-24 pb-12 text-center">
                    <div className="max-w-3xl mx-auto px-6">
                        <h2 className="text-4xl font-bold mb-6 text-slate-900">Klaar om te moderniseren?</h2>
                        <button
                            onClick={handleStartDemo}
                            className="bg-blue-600 text-white font-bold px-10 py-4 rounded-full text-lg hover:bg-blue-700 transition-all active:scale-95 shadow-xl shadow-blue-600/20"
                        >
                            Lanceer De Demo
                        </button>
                    </div>
                </section>

                {/* --- Footer --- */}
                <footer className="pt-16 pb-10 text-center border-t border-slate-100 bg-white">
                    <div className="flex items-center justify-center gap-2 mb-6 opacity-80">
                        <Hexagon size={20} className="text-blue-600" />
                        <span className="font-bold tracking-tight text-slate-900">OmniOrder</span>
                    </div>
                    <p className="text-slate-400 text-sm">
                        &copy; {new Date().getFullYear()} OmniOrder Platform. <br />
                        Gemaakt voor de Belgische horeca.
                    </p>
                </footer>

            </main>
        </div>
    );
};