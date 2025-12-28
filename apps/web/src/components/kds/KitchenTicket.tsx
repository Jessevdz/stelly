import React, { useState, useEffect } from 'react';
import { Clock, Users, ArrowLeft, ArrowRight, Check, Play, Flame, ChefHat } from 'lucide-react';
import { trackEvent } from '../../utils/analytics';

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
    status: string;
    items: OrderItem[];
    created_at: string;
}

interface KitchenTicketProps {
    order: Order;
    onStatusChange: (orderId: string, newStatus: string) => void;
}

const STATUS_FLOW = ['PENDING', 'QUEUED', 'PREPARING', 'READY', 'COMPLETED'];

// Helper to get actionable labels
const getNextAction = (status: string) => {
    switch (status) {
        case 'PENDING': return { label: 'Accept', icon: <Play size={18} fill="currentColor" /> };
        case 'QUEUED': return { label: 'Cook', icon: <Flame size={18} /> };
        case 'PREPARING': return { label: 'Ready', icon: <ChefHat size={18} /> };
        case 'READY': return { label: 'Clear', icon: <Check size={18} /> };
        default: return { label: 'Next', icon: <ArrowRight size={18} /> };
    }
};

export const KitchenTicket: React.FC<KitchenTicketProps> = ({ order, onStatusChange }) => {
    const [elapsed, setElapsed] = useState(0);

    useEffect(() => {
        const dateStr = order.created_at.endsWith('Z')
            ? order.created_at
            : `${order.created_at}Z`;

        const startTime = new Date(dateStr).getTime();

        const updateTimer = () => {
            const now = new Date().getTime();
            const diffInSeconds = Math.floor((now - startTime) / 1000);
            setElapsed(diffInSeconds > 0 ? diffInSeconds : 0);
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
    }, [order.created_at]);

    const getHeaderColor = () => {
        if (order.status === 'READY') return 'bg-green-600 text-white';
        if (elapsed > 1200) return 'bg-red-600 text-white';
        if (elapsed > 600) return 'bg-yellow-500 text-black';
        return 'bg-slate-700 text-white';
    };

    const formatTime = (totalSeconds: number) => {
        const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
        const s = (totalSeconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    const handleMove = (direction: 'next' | 'prev') => {
        const currentIndex = STATUS_FLOW.indexOf(order.status);
        if (currentIndex === -1) return;

        let nextIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
        const newStatus = STATUS_FLOW[nextIndex];

        trackEvent('kds_status_update', {
            status: newStatus,
            order_id: order.id,
            ticket_number: order.ticket_number
        });

        if (nextIndex < 0) nextIndex = 0;
        if (nextIndex >= STATUS_FLOW.length) nextIndex = STATUS_FLOW.length - 1;

        if (nextIndex !== currentIndex) {
            onStatusChange(order.id, STATUS_FLOW[nextIndex]);
        }
    };

    const isFirstStep = order.status === 'PENDING';
    const nextAction = getNextAction(order.status);

    return (
        <div className="flex flex-col w-full shrink-0 bg-slate-800 border border-slate-600 shadow-xl rounded-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header Strip */}
            <div className={`p-2 flex justify-between items-center ${getHeaderColor()} font-mono`}>
                <span className="text-xl font-black">
                    #{order.ticket_number.toString().padStart(3, '0')}
                </span>
                <div className="flex items-center gap-1 font-bold text-sm">
                    <Clock size={16} strokeWidth={2.5} />
                    <span>{formatTime(elapsed)}</span>
                </div>
            </div>

            {/* Meta Data */}
            <div className="bg-slate-900 px-3 py-2 border-b border-slate-700 flex flex-col text-xs font-mono gap-1">
                <div className="flex justify-between items-center">
                    <span className="truncate font-bold text-base text-white">{order.customer_name}</span>
                </div>
                {order.table_number && (
                    <div className="flex items-center gap-1 text-blue-400">
                        <Users size={12} />
                        <span className="font-bold">Table {order.table_number}</span>
                    </div>
                )}
            </div>

            {/* Items List */}
            <div className="p-3 flex-1 space-y-2 overflow-y-auto min-h-[150px] max-h-[300px]">
                {order.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-start text-gray-200 border-b border-gray-700/50 pb-2 last:border-0 last:pb-0">
                        <div>
                            <div className="text-sm font-bold leading-tight">{item.name}</div>
                            {item.modifiers && item.modifiers.length > 0 && (
                                <div className="text-xs text-gray-400 mt-0.5">
                                    {item.modifiers.map(m => m.name).join(', ')}
                                </div>
                            )}
                        </div>
                        <span className="text-lg font-black text-gray-400 ml-2">x{item.qty}</span>
                    </div>
                ))}
            </div>

            {/* Actions */}
            <div className="flex border-t border-slate-700 mt-auto bg-slate-900/50">
                {/* Back Button */}
                <button
                    onClick={() => handleMove('prev')}
                    disabled={isFirstStep}
                    className={`
                        px-4 py-3 flex items-center justify-center transition-colors
                        ${isFirstStep
                            ? 'text-slate-600 cursor-not-allowed bg-slate-800/50'
                            : 'text-slate-400 hover:text-white hover:bg-slate-800'
                        }
                    `}
                    title="Move Back"
                >
                    <ArrowLeft size={20} />
                </button>

                <div className="w-px bg-slate-700"></div>

                {/* Primary Action Button (Dynamic Verb) */}
                <button
                    onClick={() => handleMove('next')}
                    className={`
                        flex-1 py-3 font-bold uppercase tracking-wider transition-colors flex justify-center items-center gap-2
                        ${order.status === 'READY'
                            ? 'bg-green-600 hover:bg-green-500 text-white'
                            : 'bg-slate-800 hover:bg-slate-700 text-white hover:text-blue-200'
                        }
                    `}
                >
                    {nextAction.label} {nextAction.icon}
                </button>
            </div>
        </div>
    );
};