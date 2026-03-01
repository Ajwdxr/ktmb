'use client';

import { useState, useEffect, useMemo } from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { TrainFront } from 'lucide-react';
import { renderToStaticMarkup } from 'react-dom/server';
import { GTFSData } from '@/types/gtfs';

const createTrainIcon = (color: string, bearing?: number) => L.divIcon({
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

interface RealtimeVehicle {
  id: string;
  vehicleId?: string;
  label?: string;
  latitude: number;
  longitude: number;
  bearing?: number;
  speed?: number;
  timestamp?: number;
  tripId?: string;
  routeId?: string;
}

interface TrainLiveLayerProps {
  data: GTFSData;
  realtimeData?: RealtimeVehicle[];
  selectedRouteId: string | null;
}

export default function TrainLiveLayer({ data, realtimeData, selectedRouteId }: TrainLiveLayerProps) {
  // If we have realtime data, use it. Otherwise, use simulation as fallback or nothing?
  // User asked "nak guna api yang realtime", so we prioritize that.

  const activeTrains = useMemo(() => {
    if (!Array.isArray(realtimeData) || realtimeData.length === 0) return [];

    return realtimeData
      .map(v => {
        // Find routeId from static trips if missing in realtime feed
        let effectiveRouteId = v.routeId;
        if (!effectiveRouteId && v.tripId) {
          const trip = data.trips.find(t => t.trip_id === v.tripId);
          effectiveRouteId = trip?.route_id;
        }

        // Only include if no filter or matches selected route
        if (selectedRouteId && String(effectiveRouteId) !== String(selectedRouteId)) {
          return null;
        }

        const route = data.routes.find(r => String(r.route_id) === String(effectiveRouteId));
        const trip = data.trips.find(t => t.trip_id === v.tripId);
        
        return {
          id: v.id,
          position: [v.latitude, v.longitude] as [number, number],
          route_name: route?.route_long_name || route?.route_short_name || 'In Transit',
          headsign: trip?.trip_headsign || v.label || 'KTMB Train',
          status: 'Live',
          bearing: v.bearing,
          speed: v.speed || 0,
          color: route?.route_color ? `#${route.route_color}` : (route?.route_type === 100 ? '#ef4444' : '#3b82f6'),
          timestamp: v.timestamp
        };
      })
      .filter((t): t is NonNullable<typeof t> => t !== null);
  }, [realtimeData, data, selectedRouteId]);

  return (
    <>
      {activeTrains.map(train => (
        <Marker 
          key={train.id} 
          position={train.position} 
          icon={createTrainIcon(train.color, train.bearing)}
        >
          <Popup>
            <div className="p-2 space-y-1">
              <div className="flex items-center justify-between gap-4">
                <span className="text-[10px] font-bold text-blue-400 uppercase tracking-tight">{train.route_name}</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-green-500/20 text-green-400">
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
                {train.timestamp && <span>Updated: {new Date(Number(train.timestamp) * 1000).toLocaleTimeString()}</span>}
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </>
  );
}
