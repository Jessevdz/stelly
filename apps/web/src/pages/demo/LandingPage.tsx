import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Hexagon,
    ArrowRight,
    Smartphone,
    ChefHat,
    Globe,
    Percent,
    LayoutTemplate,
    BarChart3,
    Monitor,
    CheckCircle2,
    Zap
} from 'lucide-react';

export const LandingPage = () => {
    const navigate = useNavigate();

    const handleStartDemo = () => {
        navigate('/demo/split');
    };

    return (
        <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-blue-100 selection:text-blue-900 relative">

            {/* Background Texture */}
            <div className="absolute inset-0 h-full w-full bg-white bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none z-0"></div>
            <div className="absolute top-0 left-0 right-0 h-96 bg-gradient-to-b from-blue-50/50 to-transparent pointer-events-none z-0"></div>

            {/* --- Navigation --- */}
            <nav className="fixed w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 transition-all">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-xl tracking-tight text-slate-900">
                        <Hexagon className="text-blue-600 fill-blue-600/10" size={28} strokeWidth={2} />
                        <span>OmniOrder</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={handleStartDemo}
                            className="bg-blue-600 text-white text-sm font-bold px-6 py-2.5 rounded-full hover:bg-blue-700 transition-all active:scale-95 shadow-lg shadow-blue-600/20"
                        >
                            Probeer De Demo
                        </button>
                    </div>
                </div>
            </nav>

            <main className="relative z-10 pt-32 pb-20">

                {/* --- Hero Section --- */}
                <section className="max-w-4xl mx-auto px-6 text-center mb-24">

                    <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 mb-6 leading-[1.1] animate-in slide-in-from-bottom-4 duration-700">
                        Get a professional website for your restaurant. <br className="hidden md:block" />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Instantly.</span>
                    </h1>

                    <p className="text-xl text-slate-500 font-normal mb-10 max-w-2xl mx-auto leading-relaxed animate-in slide-in-from-bottom-6 duration-700 delay-100">
                        Stop paying huge commissions to delivery apps. Launch your own ordering site today. No technical skills required.
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

                {/* --- Core Benefits --- */}
                <section className="bg-slate-50 py-24 border-y border-slate-100">
                    <div className="max-w-6xl mx-auto px-6">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl font-bold text-slate-900 mb-4">Everything you need to run online.</h2>
                            <p className="text-slate-500 max-w-2xl mx-auto">We handle the technology so you can focus on the food. One platform covers your menu, orders, and payments.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {/* Benefit 1 */}
                            <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all hover:-translate-y-1">
                                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 mb-6">
                                    <Smartphone size={24} />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-3">Mobile Optimized</h3>
                                <p className="text-slate-500 leading-relaxed text-sm">
                                    Your menu looks beautiful on every device. Customers can order easily from their phones without downloading an app.
                                </p>
                            </div>

                            {/* Benefit 2 */}
                            <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all hover:-translate-y-1">
                                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center text-orange-600 mb-6">
                                    <LayoutTemplate size={24} />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-3">Brand Customization</h3>
                                <p className="text-slate-500 leading-relaxed text-sm">
                                    Don't look like everyone else. Choose your colors, fonts, and layout to match your restaurant's unique vibe.
                                </p>
                            </div>

                            {/* Benefit 3 */}
                            <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all hover:-translate-y-1">
                                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-green-600 mb-6">
                                    <ChefHat size={24} />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-3">Kitchen Display</h3>
                                <p className="text-slate-500 leading-relaxed text-sm">
                                    Replace paper tickets. Orders appear instantly on a tablet in your kitchen, complete with timers and alerts.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* --- Business Advantages --- */}
                <section className="max-w-5xl mx-auto px-6 py-24">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                        <div>
                            <h2 className="text-3xl font-bold text-slate-900 mb-6">Grow your business without the risk.</h2>
                            <div className="space-y-6">
                                <div className="flex gap-4">
                                    <div className="shrink-0 mt-1"><Globe className="text-blue-600" /></div>
                                    <div>
                                        <h4 className="font-bold text-slate-900">Instant Online Presence</h4>
                                        <p className="text-sm text-slate-500 mt-1">Perfect for businesses that don't have a website yet. We get you online immediately.</p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="shrink-0 mt-1"><Percent className="text-blue-600" /></div>
                                    <div>
                                        <h4 className="font-bold text-slate-900">Pay Only When You Sell</h4>
                                        <p className="text-sm text-slate-500 mt-1">Just a 1% transaction fee on orders. No monthly fees, no upfront costs, no hidden risks.</p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="shrink-0 mt-1"><BarChart3 className="text-blue-600" /></div>
                                    <div>
                                        <h4 className="font-bold text-slate-900">Free Analytics</h4>
                                        <p className="text-sm text-slate-500 mt-1">Understand your peak hours and best-selling items with our built-in dashboard.</p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="shrink-0 mt-1"><Monitor className="text-blue-600" /></div>
                                    <div>
                                        <h4 className="font-bold text-slate-900">Works Everywhere</h4>
                                        <p className="text-sm text-slate-500 mt-1">Runs on any laptop, tablet, or phone you already own. No expensive hardware to buy.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-full blur-3xl opacity-50 -z-10"></div>
                            <div className="bg-white border border-slate-200 rounded-2xl shadow-xl p-8 transform rotate-3 hover:rotate-0 transition-transform duration-500">
                                <div className="flex items-center justify-between mb-8 border-b border-slate-100 pb-4">
                                    <div>
                                        <div className="text-xs text-slate-400 uppercase font-bold">Total Sales</div>
                                        <div className="text-2xl font-bold text-slate-900">$1,240.50</div>
                                    </div>
                                    <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold">+12%</div>
                                </div>
                                <div className="space-y-4">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 font-bold text-xs">
                                                #{100 + i}
                                            </div>
                                            <div className="flex-1">
                                                <div className="h-2 w-24 bg-slate-200 rounded mb-1"></div>
                                                <div className="h-2 w-12 bg-slate-100 rounded"></div>
                                            </div>
                                            <div className="text-sm font-bold text-slate-700">$45.00</div>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-8 pt-4 border-t border-slate-100 text-center">
                                    <button className="text-blue-600 text-sm font-bold flex items-center justify-center gap-1">
                                        View Full Report <ArrowRight size={14} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* --- Final CTA --- */}
                <section className="bg-slate-900 text-white py-20 text-center">
                    <div className="max-w-3xl mx-auto px-6">
                        <Zap size={48} className="mx-auto text-yellow-400 mb-6" />
                        <h2 className="text-4xl font-bold mb-6">Ready to upgrade your restaurant?</h2>
                        <p className="text-slate-400 text-lg mb-10">Join thousands of restaurants taking control of their online orders.</p>
                        <button
                            onClick={handleStartDemo}
                            className="bg-white text-slate-900 font-bold px-10 py-4 rounded-full text-lg hover:bg-blue-50 hover:text-blue-700 transition-all active:scale-95 shadow-xl"
                        >
                            Launch Free Demo
                        </button>
                        <p className="mt-6 text-sm text-slate-500">Takes 30 seconds. No signup required.</p>
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
                        Made for hospitality.
                    </p>
                </footer>

            </main>
        </div>
    );
};