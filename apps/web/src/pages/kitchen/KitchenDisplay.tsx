import { useEffect, useState, useRef } from 'react';
import { useTenantConfig } from '../../hooks/useTenantConfig';
import { useAuth } from '../../context/AuthContext';
import { Wifi, WifiOff, ChefHat, Loader2 } from 'lucide-react';
import { KitchenTicket } from '../../components/kds/KitchenTicket';

// --- Types ---
interface OrderItem {
    id: string;
    name: string;
    qty: number;
    modifiers?: { name: string; price: number }[]; // Updated type definition to match usage
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
    { id: 'PENDING', label: 'Bestellingen', color: 'border-blue-500/50' },
    { id: 'QUEUED', label: 'To Do', color: 'border-yellow-500/50' },
    { id: 'PREPARING', label: 'Koken', color: 'border-orange-500/50' },
    { id: 'READY', label: 'Klaar / Ophalen', color: 'border-green-500/50' },
];

export function KitchenDisplay() {
    const { config } = useTenantConfig();
    const { token } = useAuth(); // <--- Get Token
    const [orders, setOrders] = useState<Order[]>([]);
    const [isConnected, setIsConnected] = useState(false);
    const [isActive, setIsActive] = useState(false);
    const [loading, setLoading] = useState(true);

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

        // Pass headers to ensure we fetch orders for the correct schema
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

        // Append Token to Query String
        // This ensures the backend knows WHICH demo schema to subscribe to
        const wsUrl = `${protocol}://${window.location.host}/api/v1/ws/kitchen${token ? `?token=${token}` : ''}`;

        let isMounted = true;
        let reconnectTimeout: ReturnType<typeof setTimeout>;

        const connect = () => {
            if (!isMounted) return;

            // Close existing connection if any
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
    }, [config, isActive, token]); // Re-run if token changes

    // --- 4. Logic ---
    const handleStatusChange = async (orderId: string, newStatus: string) => {
        setOrders(prev => {
            if (newStatus === 'COMPLETED') {
                return prev.filter(o => o.id !== orderId);
            }
            return prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o);
        });

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
            <div className="bg-neutral-950 h-screen text-white flex flex-col items-center justify-center gap-8">
                <ChefHat size={80} className="text-blue-500" />
                <div className="text-center">
                    <h1 className="text-4xl font-bold mb-2">Keukendisplay</h1>
                    {/* Show connection context for debugging */}
                    {token && <p className="text-xs text-gray-500 font-mono">Secure Context Active</p>}
                </div>
                <button
                    onClick={enableSystem}
                    className="bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-12 rounded-full text-2xl transition-all shadow-[0_0_20px_rgba(22,163,74,0.5)]"
                >
                    START SHIFT
                </button>
            </div>
        );
    }

    return (
        <div className="h-full bg-[#121212] text-gray-100 font-sans flex flex-col overflow-hidden">
            <header className="bg-neutral-900 border-b border-gray-800 p-4 flex justify-between items-center h-16 shadow-md shrink-0">
                <div className="flex items-center gap-4">
                    <h1 className="text-xl font-bold tracking-wider text-gray-200">KEUKEN</h1>
                    <span className="hidden md:inline bg-gray-800 text-gray-400 px-3 py-1 rounded text-sm font-mono border border-gray-700">
                        {config.name}
                    </span>
                </div>

                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                        <span className="text-gray-400 text-sm uppercase tracking-widest font-bold">Bestellingen:</span>
                        <span className="text-2xl font-black text-white">{orders.length}</span>
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

            <main className="flex-1 p-2 md:p-4 overflow-hidden">
                {loading ? (
                    <div className="h-full flex items-center justify-center">
                        <Loader2 className="animate-spin text-gray-600" size={48} />
                    </div>
                ) : (
                    // RESPONSIVE GRID CONFIGURATION
                    // Mobile: Flex row with horizontal scrolling + Snap behavior
                    // Desktop: 4 Column Grid
                    <div className="flex flex-row overflow-x-auto snap-x snap-mandatory gap-4 h-full md:grid md:grid-cols-4 md:overflow-hidden pb-4 md:pb-0">
                        {LANES.map(lane => {
                            const laneOrders = orders.filter(o => o.status === lane.id);

                            return (
                                <div
                                    key={lane.id}
                                    className="flex flex-col h-full bg-neutral-900/50 rounded-lg border border-gray-800 min-w-[85vw] md:min-w-0 snap-center"
                                >
                                    <div className={`p-3 border-b-2 ${lane.color} bg-neutral-900 flex justify-between items-center sticky top-0`}>
                                        <h2 className="font-bold uppercase tracking-wider text-sm text-gray-300">{lane.label}</h2>
                                        <span className="bg-gray-800 text-gray-400 text-xs px-2 py-0.5 rounded-full font-mono">
                                            {laneOrders.length}
                                        </span>
                                    </div>

                                    <div className="flex-1 overflow-y-auto p-2 space-y-3">
                                        {laneOrders.length === 0 && (
                                            <div className="text-center text-gray-600 italic text-sm mt-10">Empty</div>
                                        )}
                                        {laneOrders.map(order => (
                                            <KitchenTicket
                                                key={order.id}
                                                // @ts-ignore
                                                order={order}
                                                onStatusChange={handleStatusChange}
                                            />
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>
        </div>
    );
}