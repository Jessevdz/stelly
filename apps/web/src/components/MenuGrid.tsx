import { useEffect, useState } from "react";

interface MenuItem {
    id: string;
    name: string;
    price: number; // in cents
    is_available: boolean;
}

export function MenuGrid() {
    const [items, setItems] = useState<MenuItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/v1/store/menu')
            .then(res => res.json())
            .then(data => {
                setItems(data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to fetch menu", err);
                setLoading(false);
            });
    }, []);

    if (loading) return <div className="p-4 text-center">Loading Menu...</div>;
    if (items.length === 0) return <div className="p-4 text-center">No items on the menu yet!</div>;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
            {items.map((item) => (
                <div key={item.id} className="bg-white shadow-md rounded-lg p-4 flex justify-between items-center border-l-4 border-primary">
                    <div>
                        <h3 className="font-bold text-lg text-gray-800">{item.name}</h3>
                        <span className="text-gray-500 text-sm">
                            {/* Simple currency formatter */}
                            ${(item.price / 100).toFixed(2)}
                        </span>
                    </div>
                    <button
                        className="bg-primary text-white px-4 py-2 rounded hover:opacity-90 transition-opacity font-medium"
                        onClick={() => alert(`Added ${item.name} to cart!`)}
                    >
                        Add
                    </button>
                </div>
            ))}
        </div>
    );
}