import { useEffect, useState, useRef } from 'react';
import { useTenantConfig } from '../../hooks/useTenantConfig';
import { Wifi, WifiOff, ChefHat, Bell } from 'lucide-react';
import { KitchenTicket } from '../../components/kds/KitchenTicket';

// --- Types ---
interface OrderItem {
    id: string;
    name: string;
    qty: number;
}

interface Order {
    id: string;
    customer_name: string;
    total_amount: number;
    items: OrderItem[];
    status: 'PENDING' | 'PREPARING' | 'READY';
    created_at: string;
}

// Simple Base64 "Ding" Sound
const ALERT_SOUND = "data:audio/mp3;base64,//NExAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//NExAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//NExAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq";

export function KitchenDisplay() {
    const { config } = useTenantConfig();
    const [orders, setOrders] = useState<Order[]>([]);
    const [isConnected, setIsConnected] = useState(false);
    const [isActive, setIsActive] = useState(false);

    // Refs
    const ws = useRef<WebSocket | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // --- 1. Audio & WakeLock Setup ---
    useEffect(() => {
        audioRef.current = new Audio(ALERT_SOUND);
    }, []);

    const enableSystem = async () => {
        setIsActive(true);
        // 1. Unlock AudioContext
        audioRef.current?.play().catch(() => { });
        // 2. Request Wake Lock
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

    // --- 2. WebSocket Connection ---
    useEffect(() => {
        if (!config) return;

        const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
        const wsUrl = `${protocol}://${window.location.host}/api/v1/ws/kitchen`;
        let isMounted = true;
        let reconnectTimeout: ReturnType<typeof setTimeout>;

        const connect = () => {
            if (!isMounted) return;
            ws.current = new WebSocket(wsUrl);

            ws.current.onopen = () => {
                if (isMounted) setIsConnected(true);
            };

            ws.current.onmessage = (event) => {
                if (isMounted) {
                    const data = JSON.parse(event.data);
                    if (data.event === 'new_order') {
                        handleNewOrder(data.order);
                    }
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
    }, [config]);

    // --- 3. Logic ---
    const handleNewOrder = (order: Order) => {
        setOrders(prev => {
            if (prev.some(o => o.id === order.id)) return prev;
            return [...prev, order];
        });
        audioRef.current?.play().catch(e => console.error("Audio failed", e));
    };

    const handleBump = (orderId: string) => {
        // Optimistic: Mark as READY immediately
        // In KDS view, READY means "Done and off the screen"
        setOrders(prev => prev.map(o =>
            o.id === orderId ? { ...o, status: 'READY' } : o
        ));

        // In a real app, send API request here
        // fetch(`/api/v1/orders/${orderId}/status`, { method: 'PUT', body: ... })
    };

    const activeOrders = orders.filter(o => o.status !== 'READY');

    // --- 4. Render ---
    if (!config) return <div className="bg-neutral-950 h-screen text-white flex items-center justify-center">Loading KDS...</div>;

    if (!isActive) {
        return (
            <div className="bg-neutral-950 h-screen text-white flex flex-col items-center justify-center gap-8">
                <ChefHat size={80} className="text-primary" />
                <div className="text-center">
                    <h1 className="text-4xl font-bold mb-2">Kitchen Display System</h1>
                    <p className="text-gray-400 text-lg">Station: {config.name}</p>
                </div>
                <button
                    onClick={enableSystem}
                    className="bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-12 rounded-full text-2xl transition-all shadow-[0_0_20px_rgba(22,163,74,0.5)]"
                >
                    START SHIFT
                </button>
                <p className="text-gray-500 text-sm mt-4">Enables Audio Alerts & Always-On Screen</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#121212] text-gray-100 font-sans flex flex-col">
            {/* Top Bar */}
            <header className="bg-neutral-900 border-b border-gray-800 p-4 flex justify-between items-center h-16 shadow-md z-10 sticky top-0">
                <div className="flex items-center gap-4">
                    <h1 className="text-xl font-bold tracking-wider text-gray-200">
                        OMNI<span className="text-primary">KDS</span>
                    </h1>
                    <span className="bg-gray-800 text-gray-400 px-3 py-1 rounded text-sm font-mono border border-gray-700">
                        {config.name}
                    </span>
                </div>

                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                        <span className="text-gray-400 text-sm uppercase tracking-widest font-bold">Ticket Count:</span>
                        <span className="text-2xl font-black text-white">{activeOrders.length}</span>
                    </div>
                    <div className="h-6 w-px bg-gray-700"></div>
                    <div className="flex items-center gap-2">
                        {isConnected ? (
                            <Wifi size={20} className="text-green-500" />
                        ) : (
                            <WifiOff size={20} className="text-red-500 animate-pulse" />
                        )}
                    </div>
                </div>
            </header>

            {/* Grid Canvas */}
            <main className="flex-1 p-4 overflow-y-auto">
                {activeOrders.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center opacity-20">
                        <Bell size={120} />
                        <h2 className="text-4xl font-bold mt-8">All Caught Up</h2>
                        <p className="text-xl mt-2">Waiting for new orders...</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 auto-rows-max">
                        {activeOrders.map(order => (
                            <KitchenTicket
                                key={order.id}
                                order={order}
                                onBump={() => handleBump(order.id)}
                            />
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}