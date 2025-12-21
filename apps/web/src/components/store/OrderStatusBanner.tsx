import { useEffect, useState } from 'react';
import { useCart } from '../../context/CartContext';
import { Loader2, CheckCircle2, ChefHat, X } from 'lucide-react';

interface OrderStatus {
    id: string;
    ticket_number: number;
    status: 'PENDING' | 'PREPARING' | 'READY' | 'COMPLETED';
}

export const OrderStatusBanner = () => {
    const { activeOrderId, setActiveOrderId } = useCart();
    const [order, setOrder] = useState<OrderStatus | null>(null);
    const [isMinimized, setIsMinimized] = useState(false);

    useEffect(() => {
        if (!activeOrderId) return;

        let pollingInterval: number;

        const fetchStatus = async () => {
            try {
                const res = await fetch(`/api/v1/store/orders/${activeOrderId}`);
                if (res.ok) {
                    const data = await res.json();
                    setOrder(data);

                    // Stop polling if completed, or user can manually dismiss
                    if (data.status === 'COMPLETED') {
                        clearInterval(pollingInterval);
                    }
                } else if (res.status === 404) {
                    // Order lost or bad ID, clear it
                    setActiveOrderId(null);
                }
            } catch (err) {
                console.error("Polling error", err);
            }
        };

        // Initial fetch
        fetchStatus();

        // Poll every 5 seconds
        pollingInterval = setInterval(fetchStatus, 5000);

        return () => clearInterval(pollingInterval);
    }, [activeOrderId, setActiveOrderId]);

    if (!activeOrderId || !order) return null;

    // --- Status Logic ---
    const getStatusConfig = (status: string) => {
        switch (status) {
            case 'PENDING':
                return {
                    label: 'Order Sent',
                    desc: 'Waiting for kitchen confirmation...',
                    icon: <Loader2 className="animate-spin" />,
                    bg: 'bg-blue-600',
                    progress: 'w-1/4'
                };
            case 'PREPARING':
                return {
                    label: 'Preparing',
                    desc: 'Chef is working on your food.',
                    icon: <ChefHat className="animate-pulse" />,
                    bg: 'bg-orange-500',
                    progress: 'w-3/4'
                };
            case 'READY':
                return {
                    label: 'Ready for Pickup!',
                    desc: `Please pick up order #${order.ticket_number}`,
                    icon: <CheckCircle2 />,
                    bg: 'bg-green-600',
                    progress: 'w-full'
                };
            default:
                return { label: 'Completed', icon: <CheckCircle2 />, bg: 'bg-gray-600', progress: 'w-full' };
        }
    };

    const config = getStatusConfig(order.status);

    if (isMinimized) {
        return (
            <button
                onClick={() => setIsMinimized(false)}
                className={`fixed top-4 right-4 z-50 ${config.bg} text-white px-4 py-2 rounded-full shadow-lg font-bold text-sm flex items-center gap-2 animate-in slide-in-from-top-2`}
            >
                {config.icon}
                <span>#{order.ticket_number}</span>
            </button>
        );
    }

    return (
        <div className="fixed top-0 left-0 w-full z-50 animate-in slide-in-from-top duration-300">
            <div className={`${config.bg} text-white shadow-xl p-4 md:px-8`}>
                <div className="max-w-screen-xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="bg-white/20 p-2 rounded-full backdrop-blur-sm">
                            {config.icon}
                        </div>
                        <div>
                            <h3 className="font-bold text-lg leading-none">
                                Ticket #{order.ticket_number}: {config.label}
                            </h3>
                            <p className="text-white/80 text-sm mt-1">{config.desc}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setIsMinimized(true)}
                            className="text-sm font-medium hover:underline opacity-80 hidden md:block"
                        >
                            Minimize
                        </button>
                        <button
                            onClick={() => setActiveOrderId(null)}
                            className="bg-black/20 hover:bg-black/40 p-1 rounded-full transition-colors"
                            title="Dismiss"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* Progress Bar Loader */}
                <div className="absolute bottom-0 left-0 w-full h-1.5 bg-black/20">
                    <div className={`h-full bg-white/50 transition-all duration-1000 ${config.progress}`} />
                </div>
            </div>
        </div>
    );
};