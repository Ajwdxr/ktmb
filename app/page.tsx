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
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCountdown(10);
    }
  }, [realtimeData, isMounted]);

  // Tick the countdown every second
  useEffect(() => {
    if (!isMounted) return;
    const timer = setInterval(() => {
      setCountdown((prev) => (prev !== null && prev > 0 ? prev - 1 : 10));
    }, 1000);
    return () => clearInterval(timer);
  }, [isMounted]);

  const activeTrainCount = isMounted && realtimeData ? realtimeData.length : '--';

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
      <div className="absolute top-6 right-6 z-10 glass-panel px-4 py-2 rounded-lg flex items-center gap-4 text-xs font-mono tracking-tighter uppercase min-w-[300px]">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.8)]" />
        <div className="flex flex-col gap-1 w-full">
          <div className="flex justify-between w-full text-white/80">
            <span>System Status</span>
            <span className="text-green-400 font-bold">Optimal</span>
          </div>
          <div className="w-full h-[1px] bg-white/10" />
          <div className="flex justify-between w-full text-white/60">
            <span>Active Trains</span>
            <span className="text-white font-bold">{activeTrainCount}</span>
          </div>
          <div className="flex justify-between w-full text-white/60">
            <span>Next Refresh</span>
            <span className={countdown !== null && countdown <= 3 ? "text-yellow-400 font-bold" : "text-white font-bold"}>
              {countdown !== null ? `${countdown}s` : '--'}
            </span>
          </div>
        </div>
      </div>
    </main>
  );
}
