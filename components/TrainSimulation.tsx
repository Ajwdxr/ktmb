'use client';

import { useState, useEffect, useMemo } from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { TrainFront } from 'lucide-react';
import { renderToStaticMarkup } from 'react-dom/server';
import { GTFSData } from '@/types/gtfs';
import { getPolylineLength, getPointAtDistance, getBearing } from '@/lib/polylineUtils';

// Custom Train Icon
const createTrainIcon = (color: string, bearing: number) => L.divIcon({
  html: renderToStaticMarkup(
    <div className="relative flex items-center justify-center w-8 h-8 rounded-full shadow-[0_0_10px_rgba(0,0,0,0.5)] border-2 transition-transform duration-1000" style={{ backgroundColor: '#111', borderColor: color }}>
      <TrainFront size={16} color={color} />
      {bearing !== undefined && (
        <div 
          className="absolute top-0 left-0 w-full h-full pointer-events-none"
          style={{ transform: `rotate(${bearing}deg)` }}
        >
          {/* A small arrow on the border pointing towards the bearing */}
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-b-[6px]" style={{ borderBottomColor: color }} />
        </div>
      )}
    </div>
  ),
  className: 'train-icon',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

interface TrainSimulationProps {
  data: GTFSData;
  selectedRouteId: string | null;
}

export default function TrainSimulation({ data, selectedRouteId }: TrainSimulationProps) {
  const [timestamp, setTimestamp] = useState<number | null>(null);

  // Update simulation every second
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTimestamp(Date.now());
    const interval = setInterval(() => {
      setTimestamp(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // For each route, simulate a few trains
  // In a real app, this would use stop_times and actual current time
  const simulatedTrains = useMemo(() => {
    if (timestamp === null) return [];
    
    const trains: any[] = [];
    
    // Default routes to simulate if none selected, or just the selected one
    const routesToSimulate = selectedRouteId 
      ? data.routes.filter(r => r.route_id === selectedRouteId)
      : data.routes.slice(0, 10); // Limit to 10 for performance if none selected

    routesToSimulate.forEach(route => {
      const trips = data.trips.filter(t => t.route_id === route.route_id);
      if (trips.length === 0) return;

      // Pick a few trips to simulate per route
      const tripsToSimulate = trips.slice(0, 2); 
      
      tripsToSimulate.forEach((trip, idx) => {
        const shape = data.shapes[trip.shape_id];
        if (!shape) return;

        const totalLength = getPolylineLength(shape);
        // Simulate movement: move 5% of the route per minute, offset by trip index
        const speedFactor = 0.0005; // speed multiplier
        const progress = ((timestamp / 5000 + idx * 0.3) % 1); // pseudo progress 0-1
        
        const currentPos = getPointAtDistance(shape, progress * totalLength);
        
        // Calculate bearing using a point slightly ahead
        const nextPos = getPointAtDistance(shape, Math.min((progress + 0.001) * totalLength, totalLength));
        const bearing = getBearing(currentPos, nextPos);
        
        trains.push({
          id: `${trip.trip_id}-${idx}`,
          position: currentPos,
          route_name: route.route_long_name,
          headsign: trip.trip_headsign,
          status: Math.random() > 0.8 ? 'Delayed' : 'On Time',
          color: route.route_color ? `#${route.route_color}` : (route.route_type === 100 ? '#ef4444' : '#3b82f6'), // Red for Intercity, Blue for Komuter/ETS
          bearing,
          speed: Math.floor(Math.random() * (120 - 40 + 1) + 40) // Simulate speed 40-120 km/h
        });
      });
    });

    return trains;
  }, [data, selectedRouteId, timestamp]);

  return (
    <>
      {simulatedTrains.map(train => (
        <Marker 
          key={train.id} 
          position={train.position} 
          icon={createTrainIcon(train.color, train.bearing)}
        >
          <Popup>
            <div className="p-2 space-y-1">
              <div className="flex items-center justify-between gap-4">
                <span className="text-[10px] font-bold text-blue-400 uppercase tracking-tight">{train.route_name}</span>
                <span className={`text-[9px] px-1.5 py-0.5 rounded ${train.status === 'On Time' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                  {train.status}
                </span>
              </div>
              <h4 className="font-bold text-sm leading-tight text-white mb-2">{train.headsign}</h4>
              
              <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-white/10">
                <div className="flex flex-col">
                  <span className="text-[8px] text-white/40 uppercase">Speed</span>
                  <span className="text-xs font-mono text-white flex items-baseline gap-0.5">{train.speed} <span className="text-[9px] text-white/50">km/h</span></span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[8px] text-white/40 uppercase">Bearing</span>
                  <span className="text-xs font-mono text-white flex items-baseline gap-0.5">{train.bearing ? Math.round(train.bearing) : '--'} <span className="text-[9px] text-white/50">deg</span></span>
                </div>
              </div>

              <div className="flex flex-col gap-0.5 text-[9px] text-white/40 font-mono mt-2 pt-2 border-t border-white/10">
                <span>Trip ID: {train.id}</span>
                <span>Simulated Feed</span>
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </>
  );
}
