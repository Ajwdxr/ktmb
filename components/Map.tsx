'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { GTFSData, GTFSStop } from '@/types/gtfs';
import TrainLiveLayer from './TrainLiveLayer';

// Fix Leaflet icon issue
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

interface MapProps {
  data: GTFSData | null;
  realtimeData?: any[];
  selectedRouteId: string | null;
}

function MapUpdater({ selectedRouteId, data }: { selectedRouteId: string | null, data: GTFSData | null }) {
  const map = useMap();

  useEffect(() => {
    if (selectedRouteId && data) {
      const tripsForRoute = data.trips.filter(t => t.route_id === selectedRouteId);
      const shapeIds = Array.from(new Set(tripsForRoute.map(t => t.shape_id)));
      
      const bounds = L.latLngBounds([]);
      shapeIds.forEach(id => {
        if (data.shapes[id]) {
          data.shapes[id].forEach(pt => bounds.extend(pt));
        }
      });

      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    }
  }, [selectedRouteId, data, map]);

  return null;
}

export default function Map({ data, realtimeData, selectedRouteId }: MapProps) {
  const center: [number, number] = [4.2105, 101.9758]; // Malaysia center

  const filteredShapes = selectedRouteId && data
    ? Array.from(new Set(data.trips.filter(t => t.route_id === selectedRouteId).map(t => t.shape_id)))
        .map(id => data.shapes[id])
        .filter(Boolean)
    : [];

  const filteredStops = selectedRouteId && data
    ? data.stops.filter(stop => 
        data.stop_times.some(st => 
          st.stop_id === stop.stop_id && 
          data.trips.some(t => t.trip_id === st.trip_id && t.route_id === selectedRouteId)
        )
      )
    : [];

  return (
    <div className="h-full w-full">
      <MapContainer 
        center={center} 
        zoom={6} 
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {filteredShapes.map((shape, idx) => (
          <Polyline 
            key={idx} 
            positions={shape} 
            pathOptions={{ color: '#3b82f6', weight: 4, opacity: 0.8 }} 
          />
        ))}

        {filteredStops.map((stop) => (
          <Marker key={stop.stop_id} position={[stop.stop_lat, stop.stop_lon]}>
            <Popup>
              <div className="p-1">
                <h3 className="font-bold text-sm">{stop.stop_name}</h3>
                <p className="text-xs text-gray-400">ID: {stop.stop_id}</p>
              </div>
            </Popup>
          </Marker>
        ))}

        {data && <TrainLiveLayer data={data} realtimeData={realtimeData} selectedRouteId={selectedRouteId} />}

        <MapUpdater selectedRouteId={selectedRouteId} data={data} />
      </MapContainer>
    </div>
  );
}
