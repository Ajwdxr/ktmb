'use client';

import { GTFSRoute } from '@/types/gtfs';
import { Train, Filter } from 'lucide-react';

interface RouteSelectorProps {
  routes: GTFSRoute[];
  selectedRouteId: string | null;
  onSelect: (id: string | null) => void;
}

export default function RouteSelector({ routes, selectedRouteId, onSelect }: RouteSelectorProps) {
  // Simple grouping but for now just list all
  const sortedRoutes = [...routes].sort((a, b) => a.route_long_name.localeCompare(b.route_long_name));

  return (
    <div className="glass-panel p-4 rounded-xl flex flex-col gap-3 w-72">
      <div className="flex items-center gap-2 text-blue-400 font-semibold mb-1">
        <Train size={18} />
        <span>KTMB Live Control</span>
      </div>
      
      <div className="relative">
        <select 
          value={selectedRouteId || ''} 
          onChange={(e) => onSelect(e.target.value || null)}
          className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 appearance-none cursor-pointer"
        >
          <option value="">Select Route</option>
          {sortedRoutes.map(route => (
            <option key={route.route_id} value={route.route_id}>
              {route.route_short_name} - {route.route_long_name}
            </option>
          ))}
        </select>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-white/40">
          <Filter size={14} />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mt-2">
        <button className="text-[10px] bg-blue-500/20 border border-blue-500/30 rounded px-2 py-1 text-blue-200 hover:bg-blue-500/30 transition-colors">ETS</button>
        <button className="text-[10px] bg-green-500/20 border border-green-500/30 rounded px-2 py-1 text-green-200 hover:bg-green-500/30 transition-colors">KOMUTER</button>
        <button className="text-[10px] bg-yellow-500/20 border border-yellow-500/30 rounded px-2 py-1 text-yellow-200 hover:bg-yellow-500/30 transition-colors">INTERCITY</button>
      </div>
    </div>
  );
}
