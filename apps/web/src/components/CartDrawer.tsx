import { useCart } from '../context/CartContext';
import { X, ShoppingBag, Trash2 } from 'lucide-react';

export function CartDrawer() {
    const {
        items, isDrawerOpen, toggleDrawer, removeFromCart,
        cartTotal, clearCart
    } = useCart();

    const handleCheckout = async () => {
        if (items.length === 0) return;

        const payload = {
            customer_name: "Online Guest",
            total_amount: cartTotal,
            items: items.map(i => ({ id: i.id, qty: i.qty, name: i.name }))
        };

        try {
            const res = await fetch('/api/v1/store/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                alert("Order Placed Successfully!");
                clearCart();
                toggleDrawer(false);
            } else {
                alert("Failed to place order.");
            }
        } catch (e) {
            console.error(e);
            alert("Network Error");
        }
    };

    if (!isDrawerOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 z-40 transition-opacity"
                onClick={() => toggleDrawer(false)}
            />

            {/* Drawer */}
            <div className="fixed inset-y-0 right-0 w-full md:w-96 bg-white shadow-2xl z-50 flex flex-col transform transition-transform">
                <div className="p-4 bg-primary text-primary-fg flex justify-between items-center shadow-md">
                    <div className="flex items-center gap-2">
                        <ShoppingBag size={20} />
                        <h2 className="font-bold text-lg">Your Order</h2>
                    </div>
                    <button onClick={() => toggleDrawer(false)} className="hover:opacity-80">
                        <X size={24} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {items.length === 0 ? (
                        <div className="text-center text-gray-500 mt-10">
                            <p>Your cart is empty.</p>
                            <button
                                onClick={() => toggleDrawer(false)}
                                className="mt-4 text-primary font-medium hover:underline"
                            >
                                Browse Menu
                            </button>
                        </div>
                    ) : (
                        items.map(item => (
                            <div key={item.id} className="flex gap-3 border-b pb-4">
                                {item.image_url && (
                                    <div
                                        className="h-16 w-16 bg-cover bg-center rounded-md bg-gray-100"
                                        style={{ backgroundImage: `url(${item.image_url})` }}
                                    />
                                )}
                                <div className="flex-1">
                                    <h4 className="font-semibold text-gray-800">{item.name}</h4>
                                    <p className="text-sm text-gray-500">Qty: {item.qty}</p>
                                </div>
                                <div className="flex flex-col items-end justify-between">
                                    <span className="font-bold">${((item.price * item.qty) / 100).toFixed(2)}</span>
                                    <button
                                        onClick={() => removeFromCart(item.id)}
                                        className="text-red-500 hover:bg-red-50 p-1 rounded"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {items.length > 0 && (
                    <div className="p-6 bg-gray-50 border-t">
                        <div className="flex justify-between text-lg font-bold mb-4">
                            <span>Total</span>
                            <span>${(cartTotal / 100).toFixed(2)}</span>
                        </div>
                        <button
                            onClick={handleCheckout}
                            className="w-full bg-primary text-primary-fg py-3 rounded-lg font-bold text-lg hover:brightness-110 transition shadow-lg"
                        >
                            Checkout
                        </button>
                    </div>
                )}
            </div>
        </>
    );
}