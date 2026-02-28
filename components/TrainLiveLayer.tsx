'use client';

import { useState, useEffect, useMemo } from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { Navigation } from 'lucide-react';
import { renderToStaticMarkup } from 'react-dom/server';
import { GTFSData } from '@/types/gtfs';

const createTrainIcon = (color: string, bearing?: number) => L.divIcon({
  html: renderToStaticMarkup(
    <div 
      style={{ color, transform: bearing ? `rotate(${bearing}deg)` : 'rotate(45deg)' }} 
      className="transition-all duration-1000"
    >
      <Navigation size={24} fill={color} />
    </div>
  ),
  className: 'train-icon',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

interface RealtimeVehicle {
  id: string;
  vehicleId?: string;
  label?: string;
  latitude: number;
  longitude: number;
  bearing?: number;
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
          color: route?.route_type === 100 ? '#ef4444' : '#3b82f6',
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
              <h4 className="font-bold text-sm leading-tight text-white">{train.headsign}</h4>
              <div className="flex flex-col gap-0.5 text-[9px] text-white/40 font-mono mt-1">
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
