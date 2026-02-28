'use client';

import { useState, useEffect, useMemo } from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { Navigation } from 'lucide-react';
import { renderToStaticMarkup } from 'react-dom/server';
import { GTFSData } from '@/types/gtfs';
import { getPolylineLength, getPointAtDistance } from '@/lib/polylineUtils';

// Custom Train Icon
const createTrainIcon = (color: string) => L.divIcon({
  html: renderToStaticMarkup(
    <div style={{ color }} className="transition-all duration-1000">
      <Navigation size={24} fill={color} className="rotate-45" />
    </div>
  ),
  className: 'train-icon',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

interface TrainSimulationProps {
  data: GTFSData;
  selectedRouteId: string | null;
}

export default function TrainSimulation({ data, selectedRouteId }: TrainSimulationProps) {
  const [timestamp, setTimestamp] = useState(Date.now());

  // Update simulation every second
  useEffect(() => {
    const interval = setInterval(() => {
      setTimestamp(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // For each route, simulate a few trains
  // In a real app, this would use stop_times and actual current time
  const simulatedTrains = useMemo(() => {
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
        
        trains.push({
          id: `${trip.trip_id}-${idx}`,
          position: currentPos,
          route_name: route.route_long_name,
          headsign: trip.trip_headsign,
          status: Math.random() > 0.8 ? 'Delayed' : 'On Time',
          color: route.route_type === 100 ? '#ef4444' : '#3b82f6' // Red for Intercity, Blue for Komuter/ETS
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
          icon={createTrainIcon(train.color)}
        >
          <Popup>
            <div className="p-2 space-y-1">
              <div className="flex items-center justify-between gap-4">
                <span className="text-[10px] font-bold text-blue-400 uppercase tracking-tight">{train.route_name}</span>
                <span className={`text-[9px] px-1.5 py-0.5 rounded ${train.status === 'On Time' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                  {train.status}
                </span>
              </div>
              <h4 className="font-bold text-sm leading-tight text-white">{train.headsign}</h4>
              <p className="text-[10px] text-white/40 font-mono">ID: {train.id}</p>
            </div>
          </Popup>
        </Marker>
      ))}
    </>
  );
}
