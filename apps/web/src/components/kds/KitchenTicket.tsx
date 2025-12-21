import React, { useState, useEffect } from 'react';
import { Clock, Check } from 'lucide-react';

interface OrderItem {
    id: string;
    name: string;
    qty: number;
}

interface Order {
    id: string;
    customer_name: string;
    status: string;
    items: OrderItem[];
    created_at: string;
}

interface KitchenTicketProps {
    order: Order;
    onBump: () => void;
}

export const KitchenTicket: React.FC<KitchenTicketProps> = ({ order, onBump }) => {
    const [elapsed, setElapsed] = useState(0);

    // Calculate initial elapsed time and set up interval
    useEffect(() => {
        const startTime = new Date(order.created_at).getTime();

        const updateTimer = () => {
            const now = new Date().getTime();
            const diffInSeconds = Math.floor((now - startTime) / 1000);
            setElapsed(diffInSeconds > 0 ? diffInSeconds : 0);
        };

        updateTimer(); // Initial run
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
    }, [order.created_at]);

    // Design Doc 7.B: Color Logic
    // 0-10 mins (600s): Green
    // 10-20 mins (1200s): Yellow
    // 20+ mins: Red
    const getHeaderColor = () => {
        if (elapsed > 1200) return 'bg-red-600';
        if (elapsed > 600) return 'bg-yellow-600 text-black';
        return 'bg-green-600';
    };

    const formatTime = (totalSeconds: number) => {
        const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
        const s = (totalSeconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    return (
        <div className="flex flex-col bg-gray-800 border-2 border-gray-700 shadow-xl h-full animate-in fade-in zoom-in-95 duration-200">
            {/* Header Strip */}
            <div className={`p-3 flex justify-between items-center ${getHeaderColor()} font-mono`}>
                <span className="text-xl font-black">#{order.id.slice(0, 4)}</span>
                <div className="flex items-center gap-2 font-bold text-lg">
                    <Clock size={20} strokeWidth={2.5} />
                    <span>{formatTime(elapsed)}</span>
                </div>
            </div>

            {/* Meta Data */}
            <div className="bg-gray-900 px-4 py-2 border-b border-gray-700 flex justify-between text-gray-400 text-sm font-mono">
                <span className="truncate max-w-[60%]">{order.customer_name}</span>
                <span>Dine-in</span>
            </div>

            {/* Items List */}
            <div className="p-4 flex-1 space-y-3 overflow-y-auto min-h-[120px]">
                {order.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-start text-gray-100 border-b border-gray-700/50 pb-2 last:border-0">
                        <span className="text-lg font-bold leading-tight">{item.name}</span>
                        <span className="text-xl font-black text-gray-300 ml-4">x{item.qty}</span>
                    </div>
                ))}
            </div>

            {/* Footer Action */}
            <button
                onClick={onBump}
                className="w-full py-4 bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-2 border-t border-gray-600"
            >
                <Check size={24} strokeWidth={3} />
                Bump Ticket
            </button>
        </div>
    );
};