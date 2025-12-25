import { DollarSign, ClipboardList, Clock } from 'lucide-react';

export function TenantDashboard() {
    return (
        <div className="max-w-5xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Overzicht</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-lg border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-gray-500 text-sm font-medium">Dagomzet</h3>
                        <div className="p-2 bg-green-50 text-green-600 rounded-md"><DollarSign size={20} /></div>
                    </div>
                    <p className="text-3xl font-bold text-gray-900">€684.32</p>
                    <p className="text-xs text-green-600 mt-2">↑ 12% sinds gisteren</p>
                </div>

                <div className="bg-white p-6 rounded-lg border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-gray-500 text-sm font-medium">Bestellingen verwerkt</h3>
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-md"><ClipboardList size={20} /></div>
                    </div>
                    <p className="text-3xl font-bold text-gray-900">45</p>
                    <p className="text-xs text-gray-400 mt-2">8 bezig in de keuken</p>
                </div>

                <div className="bg-white p-6 rounded-lg border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-gray-500 text-sm font-medium">Gem. Bereidings Tijd</h3>
                        <div className="p-2 bg-orange-50 text-orange-600 rounded-md"><Clock size={20} /></div>
                    </div>
                    <p className="text-3xl font-bold text-gray-900">14m</p>
                    <p className="text-xs text-green-600 mt-2">↑ 2m sneller dan doel</p>
                </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-6">
                <h3 className="font-bold text-lg mb-4">Meest recente bestellingen</h3>
                <div className="text-center py-10 text-gray-400 bg-gray-50 rounded border border-dashed">
                    Grafiek met overzicht.
                </div>
            </div>
        </div>
    );
}