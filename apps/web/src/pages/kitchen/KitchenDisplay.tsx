import { useEffect, useState, useRef } from 'react';
import { useTenantConfig } from '../../hooks/useTenantConfig';
import { useAuth } from '../../context/AuthContext';
import { Wifi, WifiOff, Loader2 } from 'lucide-react';
import { KitchenTicket } from '../../components/kds/KitchenTicket';

// --- Types ---
interface OrderItem {
    id: string;
    name: string;
    qty: number;
    modifiers?: { name: string; price: number }[];
}

interface Order {
    id: string;
    ticket_number: number;
    customer_name: string;
    table_number?: string;
    total_amount: number;
    items: OrderItem[];
    status: string;
    created_at: string;
}

// Simple Base64 "Ding" Sound
const ALERT_SOUND = "data:audio/mp3;base64,//NExAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//NExAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//NExAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq";

// Lane Configuration
const LANES = [
    { id: 'PENDING', label: 'Bestellingen', color: 'border-blue-500', bg: 'bg-blue-500/10 text-blue-500' },
    { id: 'QUEUED', label: 'To Do', color: 'border-yellow-500', bg: 'bg-yellow-500/10 text-yellow-500' },
    { id: 'PREPARING', label: 'Koken', color: 'border-orange-500', bg: 'bg-orange-500/10 text-orange-500' },
    { id: 'READY', label: 'Klaar', color: 'border-green-500', bg: 'bg-green-500/10 text-green-500' },
];

export function KitchenDisplay() {
    const { config } = useTenantConfig();
    const { token } = useAuth();
    const [orders, setOrders] = useState<Order[]>([]);
    const [isConnected, setIsConnected] = useState(false);
    const [isActive, setIsActive] = useState(false);
    const [loading, setLoading] = useState(true);

    // NEW: Active Tab State for Mobile View
    const [activeTab, setActiveTab] = useState('PENDING');

    // Refs
    const ws = useRef<WebSocket | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // --- 1. Audio & WakeLock Setup ---
    useEffect(() => {
        audioRef.current = new Audio(ALERT_SOUND);
    }, []);

    const enableSystem = async () => {
        setIsActive(true);
        audioRef.current?.play().catch(() => { });
        if ('wakeLock' in navigator) {
            try {
                // @ts-ignore 
                await navigator.wakeLock.request('screen');
                console.log("Wake Lock Active");
            } catch (err) {
                console.error("Wake Lock failed:", err);
            }
        }
    };

    // --- 2. Initial Data Fetch (Persistence) ---
    useEffect(() => {
        if (!config || !isActive) return;

        const headers: HeadersInit = token ? { 'Authorization': `Bearer ${token}` } : {};

        fetch('/api/v1/store/orders', { headers })
            .then(res => res.json())
            .then(data => {
                setOrders(data);
                setLoading(false);
            })
            .catch(err => console.error("Failed to fetch KDS orders", err));
    }, [config, isActive, token]);

    // --- 3. WebSocket Connection & Sync ---
    useEffect(() => {
        if (!config || !isActive) return;

        const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
        const wsUrl = `${protocol}://${window.location.host}/api/v1/ws/kitchen${token ? `?token=${token}` : ''}`;

        let isMounted = true;
        let reconnectTimeout: ReturnType<typeof setTimeout>;

        const connect = () => {
            if (!isMounted) return;
            if (ws.current) ws.current.close();

            ws.current = new WebSocket(wsUrl);

            ws.current.onopen = () => {
                if (isMounted) setIsConnected(true);
            };

            ws.current.onmessage = (event) => {
                if (!isMounted) return;
                const data = JSON.parse(event.data);

                if (data.event === 'new_order') {
                    setOrders(prev => {
                        if (prev.some(o => o.id === data.order.id)) return prev;
                        return [...prev, data.order];
                    });
                    audioRef.current?.play().catch(e => console.error("Audio failed", e));
                }

                if (data.event === 'order_update') {
                    const { id, status } = data.order;
                    setOrders(prev => {
                        if (status === 'COMPLETED') {
                            return prev.filter(o => o.id !== id);
                        }
                        return prev.map(o => o.id === id ? { ...o, status } : o);
                    });
                }
            };

            ws.current.onclose = () => {
                if (isMounted) {
                    setIsConnected(false);
                    reconnectTimeout = setTimeout(connect, 3000);
                }
            };
        };

        connect();

        return () => {
            isMounted = false;
            clearTimeout(reconnectTimeout);
            ws.current?.close();
        };
    }, [config, isActive, token]);

    // --- 4. Logic ---
    const handleStatusChange = async (orderId: string, newStatus: string) => {
        setOrders(prev => {
            if (newStatus === 'COMPLETED') {
                return prev.filter(o => o.id !== orderId);
            }
            return prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o);
        });

        // Optimistic UI: If moving from active tab to another, we don't strictly need to switch tabs, 
        // allowing the chef to process multiple tickets in the current lane efficiently.

        try {
            const headers: HeadersInit = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;

            await fetch(`/api/v1/store/orders/${orderId}/status`, {
                method: 'PUT',
                headers,
                body: JSON.stringify({ status: newStatus })
            });
        } catch (err) {
            console.error("Failed to update order status", err);
        }
    };

    if (!config) return <div className="bg-neutral-950 h-screen text-white flex items-center justify-center">Loading KDS...</div>;

    if (!isActive) {
        return (
            <div className="bg-neutral-950 h-screen text-white flex flex-col items-center justify-center gap-8 p-4">
                <div className="bg-neutral-900 p-8 rounded-full border border-neutral-800 shadow-2xl">
                    <Loader2 size={64} className="text-blue-500 animate-spin-slow" />
                </div>
                <div className="text-center">
                    <h1 className="text-3xl font-bold mb-2">Keukendisplay</h1>
                    <p className="text-gray-400">Audio en scherm worden geactiveerd</p>
                </div>
                <button
                    onClick={enableSystem}
                    className="bg-green-600 hover:bg-green-500 text-white font-bold py-4 px-12 rounded-full text-xl transition-all shadow-[0_0_30px_rgba(22,163,74,0.4)] hover:scale-105 active:scale-95"
                >
                    START SHIFT
                </button>
            </div>
        );
    }

    return (
        <div className="h-full bg-[#121212] text-gray-100 font-sans flex flex-col overflow-hidden">
            {/* Header */}
            <header className="bg-neutral-900 border-b border-gray-800 px-4 py-3 flex justify-between items-center shrink-0 z-20 relative">
                <div className="flex items-center gap-4">
                    <h1 className="text-lg font-bold tracking-wider text-gray-200">KDS</h1>
                    <span className="hidden md:inline bg-gray-800 text-gray-400 px-3 py-1 rounded text-xs font-mono border border-gray-700 truncate max-w-[150px]">
                        {config.name}
                    </span>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 bg-neutral-800 px-3 py-1 rounded-full border border-neutral-700">
                        <span className="text-xs text-gray-400 uppercase font-bold">Total</span>
                        <span className="text-sm font-black text-white">{orders.length}</span>
                    </div>
                    {isConnected ? (
                        <Wifi size={18} className="text-green-500" />
                    ) : (
                        <WifiOff size={18} className="text-red-500 animate-pulse" />
                    )}
                </div>
            </header>

            {/* MOBILE: Tab Bar (Sticky) */}
            <div className="md:hidden flex bg-neutral-900 border-b border-gray-800 sticky top-0 z-10 overflow-x-auto no-scrollbar">
                {LANES.map(lane => {
                    const count = orders.filter(o => o.status === lane.id).length;
                    const isActiveTab = activeTab === lane.id;

                    return (
                        <button
                            key={lane.id}
                            onClick={() => setActiveTab(lane.id)}
                            className={`
                                flex-1 py-3 px-2 flex flex-col items-center gap-1 min-w-[80px] transition-colors relative
                                ${isActiveTab ? 'text-white bg-neutral-800' : 'text-gray-500 hover:bg-neutral-800/50'}
                            `}
                        >
                            <span className="text-[10px] font-bold uppercase tracking-wider">{lane.label}</span>
                            <span className={`
                                text-xs font-mono font-bold px-2 py-0.5 rounded-full
                                ${isActiveTab ? lane.bg : 'bg-gray-800 text-gray-400'}
                            `}>
                                {count}
                            </span>
                            {/* Active Indicator Line */}
                            {isActiveTab && (
                                <div className={`absolute bottom-0 left-0 w-full h-0.5 ${lane.bg.split(' ')[1].replace('text-', 'bg-')}`} />
                            )}
                        </button>
                    );
                })}
            </div>

            <main className="flex-1 p-2 md:p-4 overflow-hidden relative">
                {loading ? (
                    <div className="h-full flex items-center justify-center">
                        <Loader2 className="animate-spin text-gray-600" size={48} />
                    </div>
                ) : (
                    <div className="h-full w-full">
                        {/* RESPONSIVE LAYOUT STRATEGY:
                            - Mobile: Single column list (filtered by activeTab).
                            - Desktop: 4-Column Grid (all lanes visible).
                        */}
                        <div className="flex flex-col h-full md:grid md:grid-cols-4 md:gap-4">
                            {LANES.map(lane => {
                                const laneOrders = orders.filter(o => o.status === lane.id);
                                const isVisibleOnMobile = activeTab === lane.id;

                                return (
                                    <div
                                        key={lane.id}
                                        className={`
                                            flex-col h-full bg-neutral-900/50 md:bg-neutral-900/30 md:rounded-lg md:border md:border-gray-800 overflow-hidden
                                            ${isVisibleOnMobile ? 'flex' : 'hidden md:flex'}
                                        `}
                                    >
                                        {/* Desktop Lane Header (Hidden on Mobile as Tabs replace it) */}
                                        <div className={`hidden md:flex p-3 border-b-2 ${lane.color} bg-neutral-900 justify-between items-center sticky top-0 z-10`}>
                                            <h2 className="font-bold uppercase tracking-wider text-sm text-gray-300">{lane.label}</h2>
                                            <span className="bg-gray-800 text-gray-400 text-xs px-2 py-0.5 rounded-full font-mono">
                                                {laneOrders.length}
                                            </span>
                                        </div>

                                        {/* Scrollable Order List */}
                                        <div className="flex-1 overflow-y-auto p-2 space-y-3">
                                            {laneOrders.length === 0 && (
                                                <div className="h-full flex flex-col items-center justify-center text-gray-700 space-y-2 opacity-50 min-h-[200px]">
                                                    <div className="w-12 h-1 bg-gray-800 rounded-full" />
                                                    <span className="text-sm font-medium">Geen tickets</span>
                                                </div>
                                            )}
                                            {laneOrders.map(order => (
                                                <KitchenTicket
                                                    key={order.id}
                                                    order={order}
                                                    onStatusChange={handleStatusChange}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}