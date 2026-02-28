'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import useSWR from 'swr';
import { GTFSData } from '@/types/gtfs';
import RouteSelector from '@/components/RouteSelector';
import Legend from '@/components/Legend';

const Map = dynamic(() => import('@/components/Map'), { 
  ssr: false,
  loading: () => <div className="h-full w-full bg-[#0d1117] animate-pulse flex items-center justify-center text-white/20">Initialising Map Radar...</div>
});

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function App() {
  const { data, error } = useSWR<GTFSData>('/api/ktmb', fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false
  });

  const { data: realtimeData } = useSWR('/api/ktmb/realtime', fetcher, {
    refreshInterval: 10000, // Refresh every 10 seconds
  });
  
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);

  if (error) return <div className="h-screen flex items-center justify-center bg-black text-red-500">System Error: Failed to link with GTFS Satellite</div>;
  if (!data) return <div className="h-screen flex items-center justify-center bg-black text-blue-500 animate-pulse font-mono">ESTABLISHING CONNECTION TO MALAYSIA TRANSPORT GRID...</div>;

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-black">
      <div className="absolute inset-0 z-0">
        <Map data={data} realtimeData={realtimeData} selectedRouteId={selectedRouteId} />
      </div>

      {/* Overlay UI */}
      <div className="absolute top-6 left-6 z-10 flex flex-col gap-4 pointer-events-auto">
        <RouteSelector 
          routes={data.routes} 
          selectedRouteId={selectedRouteId} 
          onSelect={setSelectedRouteId} 
        />
      </div>

      <div className="absolute bottom-6 right-6 z-10 pointer-events-auto">
        <Legend />
      </div>

      {/* Scanning effect */}
      <div className="absolute inset-0 pointer-events-none border-[20px] border-black/10 z-20" />
      <div className="absolute top-0 left-0 w-full h-[2px] bg-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.5)] animate-[scan_4s_linear_infinite] z-20" />
      
      <style jsx global>{`
        @keyframes scan {
          0% { top: 0; }
          100% { top: 100%; }
        }
      `}</style>

      {/* Status Bar */}
      <div className="absolute top-6 right-6 z-10 glass-panel px-4 py-2 rounded-full flex items-center gap-3 text-[10px] font-mono tracking-tighter uppercase">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        <span className="text-white/80">Satellite Link: Optimal</span>
        <span className="text-white/40">|</span>
        <span className="text-white/80">{data?.routes.length} Routes Identified</span>
      </div>
    </main>
  );
}
