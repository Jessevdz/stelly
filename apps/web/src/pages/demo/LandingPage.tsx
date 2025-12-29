import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Hexagon,
    ArrowRight,
    ChefHat,
    Globe,
    Percent,
    BarChart3,
    Zap,
    CheckCircle2,
    Check,
    Building2,
    Mail,
    Send,
    User,
    PhoneOff,
    ShoppingBag,
    Smartphone,
    Star
} from 'lucide-react';
import { trackEvent } from '../../utils/analytics';

// --- LEAD CAPTURE COMPONENT ---
const LeadCaptureForm = () => {
    const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
    const [formData, setFormData] = useState({ name: '', email: '', business: '' });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.email) return;

        setStatus('submitting');

        try {
            const res = await fetch('/api/v1/sys/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.name,
                    email: formData.email,
                    business_name: formData.business
                })
            });

            if (res.ok) {
                trackEvent('lead_capture_success', { source: 'landing_page' }); // Track Form Submit
                setStatus('success');
                setFormData({ name: '', email: '', business: '' });
            } else {
                setStatus('error');
            }
        } catch (e) {
            console.error(e);
            setStatus('error');
        }
    };

    if (status === 'success') {
        return (
            <div className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center animate-in zoom-in-95 duration-300">
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 size={32} />
                </div>
                <h3 className="text-xl font-bold text-green-800 mb-2">Bedankt!</h3>
                <p className="text-green-700">We hebben je gegevens ontvangen.</p>
                <button
                    onClick={() => setStatus('idle')}
                    className="mt-6 text-sm text-green-600 hover:text-green-800 font-bold underline"
                >
                    Nog een aanvraag versturen
                </button>
            </div>
        );
    }

    return (
        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-xl shadow-slate-200/40 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-full -mr-16 -mt-16 z-0" />

            <div className="relative z-10">
                <h3 className="text-2xl font-bold text-slate-900 mb-2">Samenwerken?</h3>
                <p className="text-slate-500 mb-6">Laat je gegevens achter voor een vrijblijvend gesprek.</p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="relative group">
                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 size-5" />
                        <input
                            type="text"
                            placeholder="Jouw Naam"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-11 pr-4 text-slate-900 focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>

                    <div className="relative group">
                        <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 size-5" />
                        <input
                            type="text"
                            placeholder="Naam van de zaak"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-11 pr-4 text-slate-900 focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all"
                            value={formData.business}
                            onChange={e => setFormData({ ...formData, business: e.target.value })}
                        />
                    </div>

                    <div className="relative group">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 size-5" />
                        <input
                            type="email"
                            required
                            placeholder="E-mailadres"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-11 pr-4 text-slate-900 focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all"
                            value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={status === 'submitting'}
                        className="w-full bg-slate-900 text-white font-bold py-3.5 rounded-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                    >
                        {status === 'submitting' ? 'Versturen...' : 'Versturen'}
                        {!status && <Send size={18} />}
                    </button>
                </form>
            </div>
        </div>
    );
};

// --- CSS PHONE MOCKUP COMPONENT ---
// This provides visual context immediately without relying on external assets
const PhoneMockup = () => (
    <div className="relative mx-auto border-gray-800 dark:border-gray-800 bg-gray-800 border-[10px] rounded-[2.5rem] h-[400px] w-[240px] shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 duration-1000 delay-200">
        <div className="h-[32px] w-[3px] bg-gray-800 absolute -start-[13px] top-[72px] rounded-s-lg"></div>
        <div className="h-[46px] w-[3px] bg-gray-800 absolute -start-[13px] top-[124px] rounded-s-lg"></div>
        <div className="h-[46px] w-[3px] bg-gray-800 absolute -start-[13px] top-[178px] rounded-s-lg"></div>
        <div className="h-[64px] w-[3px] bg-gray-800 absolute -end-[13px] top-[142px] rounded-e-lg"></div>
        <div className="rounded-[2rem] overflow-hidden w-full h-full bg-white flex flex-col relative">
            <div className="bg-blue-600 h-24 w-full p-4 text-white flex flex-col justify-end relative">
                <div className="absolute top-0 right-0 p-3 opacity-50"><ShoppingBag size={16} /></div>
                <div className="font-bold text-lg leading-tight">Bistro Stelly</div>
                <div className="text-[10px] opacity-80">Open tot 23:00</div>
            </div>

            {/* Menu Items */}
            <div className="flex-1 p-3 space-y-3 overflow-hidden bg-gray-50">
                <div className="flex gap-2 items-center bg-white p-2 rounded-xl shadow-sm border border-gray-100">
                    <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center text-xl">🍔</div>
                    <div className="flex-1">
                        <div className="h-2 w-16 bg-gray-800 rounded-full mb-1"></div>
                        <div className="h-1.5 w-8 bg-blue-500 rounded-full"></div>
                    </div>
                    <div className="bg-blue-50 text-blue-600 p-1.5 rounded-lg"><ArrowRight size={12} /></div>
                </div>
                <div className="flex gap-2 items-center bg-white p-2 rounded-xl shadow-sm border border-gray-100">
                    <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center text-xl">🍟</div>
                    <div className="flex-1">
                        <div className="h-2 w-12 bg-gray-800 rounded-full mb-1"></div>
                        <div className="h-1.5 w-8 bg-blue-500 rounded-full"></div>
                    </div>
                    <div className="bg-blue-50 text-blue-600 p-1.5 rounded-lg"><ArrowRight size={12} /></div>
                </div>
                <div className="flex gap-2 items-center bg-white p-2 rounded-xl shadow-sm border border-gray-100">
                    <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center text-xl">🥤</div>
                    <div className="flex-1">
                        <div className="h-2 w-14 bg-gray-800 rounded-full mb-1"></div>
                        <div className="h-1.5 w-8 bg-blue-500 rounded-full"></div>
                    </div>
                    <div className="bg-blue-50 text-blue-600 p-1.5 rounded-lg"><ArrowRight size={12} /></div>
                </div>
            </div>
            {/* Floating Action Button inside Phone */}
            <div className="absolute bottom-4 left-4 right-4 bg-black text-white p-3 rounded-full flex justify-between items-center shadow-lg text-xs font-bold">
                <span>1 Item</span>
                <span>€12.50</span>
            </div>
        </div>
    </div>
);

export const LandingPage = () => {
    const navigate = useNavigate();

    const handleStartDemo = () => {
        trackEvent('demo_start_click', { position: 'hero_cta' });
        navigate('/demo/split');
    };

    // --- NEW SUBTLE LOGO COMPONENT ---
    const StellyLogo = ({ className = "" }: { className?: string }) => (
        <div className={`flex items-center gap-2.5 cursor-pointer group ${className}`} onClick={() => navigate('/')}>
            {/* The Layered Hexagon Icon */}
            <div className="relative w-7 h-7">
                {/* 1. Red Base Layer (Shadow) */}
                <Hexagon
                    className="absolute top-[2px] left-[2px] text-red-600 fill-red-600 opacity-90"
                    size={27}
                    strokeWidth={0}
                />
                {/* 2. Yellow Middle Layer (Fill) */}
                <Hexagon
                    className="absolute top-[1px] left-[1px] text-yellow-400 fill-yellow-400"
                    size={26}
                    strokeWidth={0}
                />
                {/* 3. Black Top Layer (Outline Structure) */}
                <Hexagon
                    className="relative z-10 text-slate-900 fill-none"
                    size={26}
                    strokeWidth={2.5}
                />
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-900 leading-none mt-0.5">Pakmee.be!</span>
        </div>
    );

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
                        <StellyLogo />
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
                {/* <section className="max-w-5xl mx-auto px-6 text-center mb-32">

                    <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 mb-6 leading-[1.1] animate-in slide-in-from-bottom-4 duration-700">
                        Jouw eigen bestelplatform. <br className="hidden md:block" />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Zonder gedoe.</span>
                    </h1>

                    <p className="text-xl text-slate-500 font-normal mb-10 max-w-2xl mx-auto leading-relaxed animate-in slide-in-from-bottom-6 duration-700 delay-100">
                        Zet jouw horecazaak onmiddellijk online. Geen rinkelende telefoons of vergeten e-mails meer. Gewoon koken en inpakken.
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
                </section> */}

                {/* --- 1. HERO SECTION (Optimized for 5-Second Rule) --- */}
                <section className="max-w-7xl mx-auto px-6 mb-24">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

                        {/* LEFT: Copy & CTA */}
                        <div className="text-center lg:text-left order-1">

                            {/* Headline: Concrete USP */}
                            <h1 className="text-4xl md:text-7xl font-extrabold tracking-tight text-slate-900 mb-6 leading-[1.1] animate-in slide-in-from-bottom-4 duration-700 delay-100">
                                Jouw eigen bestelplatform<br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                                    Zonder gedoe
                                </span>
                            </h1>

                            {/* Subhead: Clarity */}
                            <p className="text-lg md:text-xl text-slate-500 font-medium mb-8 max-w-lg mx-auto lg:mx-0 leading-relaxed animate-in slide-in-from-bottom-6 duration-700 delay-200">
                                Zet jouw horecazaak onmiddellijk online, zonder de hoge kosten.
                            </p>

                            {/* CTA: Next Step */}
                            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 animate-in slide-in-from-bottom-8 duration-700 delay-300">
                                <button
                                    onClick={handleStartDemo}
                                    className="w-full sm:w-auto px-8 py-4 bg-blue-600 text-white font-bold rounded-full text-lg hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-600/30 transition-all active:scale-95 flex items-center justify-center gap-2"
                                >
                                    Start Demo
                                    <ArrowRight size={20} />
                                </button>
                            </div>
                        </div>

                        {/* RIGHT: Visual Proof (Phone Mockup) */}
                        <div className="order-2 flex justify-center lg:justify-end relative">
                            {/* Decorative Blob */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-blue-400/20 rounded-full blur-[80px] -z-10 animate-pulse"></div>
                            <PhoneMockup />

                            {/* Floating "Notification" Badge for extra context */}
                            <div className="absolute top-1/4 -right-4 md:right-10 bg-white p-3 rounded-xl shadow-xl border border-gray-100 flex items-center gap-3 animate-in slide-in-from-right duration-700 delay-500 max-w-[200px]">
                                <div className="bg-green-100 text-green-600 p-2 rounded-full">
                                    <Smartphone size={18} />
                                </div>
                                <div>
                                    <div className="text-xs text-slate-400 font-bold uppercase">Nieuwe Bestelling</div>
                                    <div className="text-sm font-bold text-slate-900">€ 45,00 ontvangen</div>
                                </div>
                            </div>
                        </div>
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

                            {/* --- Mockup 1: Sales Dashboard (HIDDEN ON MOBILE) --- */}
                            <div className="hidden md:block bg-white border border-slate-200 rounded-2xl shadow-2xl shadow-slate-200/50 p-6 transform hover:scale-[1.02] transition-transform duration-500 relative z-10 mb-6">
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

                                <div className="flex gap-4">
                                    <div className="shrink-0">
                                        <div className="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600">
                                            <Globe size={24} />
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900 text-lg mb-1">Direct Online</h3>
                                        <p className="text-slate-500 text-sm leading-relaxed">
                                            Nog geen website? Wij zetten je zaak onmiddellijk op de kaart met je eigen domeinnaam.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <div className="shrink-0">
                                        <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600">
                                            <Percent size={24} />
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900 text-lg mb-1">Transparante Pricing</h3>
                                        <p className="text-slate-500 text-sm leading-relaxed">
                                            Geen vaste maandelijkse kosten. Je betaalt slechts <strong>1%</strong> per bestelling, de laagste commissie op de markt.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <div className="shrink-0">
                                        <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center text-red-600">
                                            <PhoneOff size={24} />
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900 text-lg mb-1">Weg met de telefoon</h3>
                                        <p className="text-slate-500 text-sm leading-relaxed">
                                            Geen onderbrekingen meer tijdens de service. Laat klanten digitaal bestellen en krijg rust in de zaak.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <div className="shrink-0">
                                        <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                                            <ShoppingBag size={24} />
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900 text-lg mb-1">Puur Afhaal, Geen Delivery</h3>
                                        <p className="text-slate-500 text-sm leading-relaxed">
                                            Geen gedoe met koeriers of koude maaltijden. Pakmee.be! is voor klanten die zelf komen afhalen.
                                        </p>
                                    </div>
                                </div>

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
                            </div>
                        </div>
                    </div>
                </section>

                {/* --- Pricing / Risk Free Section --- */}
                <section className="bg-slate-900 py-24 relative overflow-hidden">
                    {/* Background decoration */}
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3"></div>
                    <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/3"></div>

                    <div className="max-w-5xl mx-auto px-6 relative z-10">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">

                            {/* Left: Value Prop */}
                            <div>
                                <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                                    Transparant en eerlijk. <br />
                                    <span className="text-blue-400">Betaal enkel voor gebruik.</span>
                                </h2>

                                <ul className="space-y-4">
                                    {[
                                        "Geen opstartkosten",
                                        "Geen maandelijkse abonnementskosten",
                                        "Geen vaste contracten (maandelijks opzegbaar)",
                                        "Inclusief hosting & updates"
                                    ].map((item, idx) => (
                                        <li key={idx} className="flex items-center gap-3 text-slate-200">
                                            <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
                                                <Check size={14} className="text-blue-400" strokeWidth={3} />
                                            </div>
                                            <span className="font-medium">{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Right: The "Card" */}
                            <div className="relative">
                                <div className="absolute inset-0 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-3xl blur-xl opacity-20"></div>
                                <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-3xl p-8 md:p-12 text-center relative hover:border-blue-500/30 transition-colors">

                                    <div className="text-slate-400 font-medium mb-2 uppercase tracking-widest text-sm">Commissie</div>
                                    <div className="flex items-baseline justify-center gap-1 mb-4">
                                        <span className="text-7xl md:text-8xl font-black text-white tracking-tighter">1</span>
                                        <span className="text-4xl md:text-5xl font-bold text-blue-400">%</span>
                                    </div>
                                    <p className="text-slate-300 max-w-xs mx-auto mb-8">
                                        Per bestelling. <br />
                                    </p>
                                </div>
                            </div>

                        </div>
                    </div>
                </section>

                {/* --- Final CTA --- */}
                <section className="pt-24 pb-12 text-center">
                    <div className="max-w-3xl mx-auto px-6">


                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">

                            {/* Left: Standard Demo CTA */}
                            <div className="text-center md:text-left">
                                <h2 className="text-4xl font-bold mb-6 text-slate-900">Klaar om te moderniseren?</h2>
                                <button
                                    onClick={handleStartDemo}
                                    className="bg-blue-600 text-white font-bold px-10 py-4 rounded-full text-lg hover:bg-blue-700 transition-all active:scale-95 shadow-xl shadow-blue-600/20"
                                >
                                    Lanceer De Demo
                                </button>
                            </div>

                            {/* Right: Lead Capture Form */}
                            <div>
                                <LeadCaptureForm />
                            </div>

                        </div>
                    </div>
                </section>

                {/* --- Footer --- */}
                <footer className="pt-16 pb-10 text-center border-t border-slate-200 bg-white">
                    <div className="flex items-center justify-center gap-2 mb-6 opacity-80">
                        <StellyLogo />
                    </div>
                    <p className="text-slate-400 text-sm">
                        Gemaakt voor de Belgische horeca.
                    </p>
                </footer>
            </main>
        </div>
    );
};