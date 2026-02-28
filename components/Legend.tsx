import { Info, MapPin, Navigation, Activity } from 'lucide-react';

export default function Legend() {
  const items = [
    { icon: <Navigation size={14} className="text-blue-400 rotate-45" />, label: 'Live Train', color: 'text-blue-400' },
    { icon: <MapPin size={14} className="text-gray-400" />, label: 'Station', color: 'text-gray-400' },
    { icon: <div className="w-3 h-1 bg-blue-500/80 rounded" />, label: 'Selected Route', color: 'text-gray-300' },
    { icon: <Activity size={14} className="text-green-500" />, label: 'Verified Live', color: 'text-green-500' },
    { icon: <Activity size={14} className="text-red-500" />, label: 'Delayed (Est)', color: 'text-red-500' },
  ];

  return (
    <div className="glass-panel p-3 rounded-lg flex flex-col gap-2 w-44">
      <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-white/40 font-bold mb-1">
        <Info size={12} />
        <span>Map Legend</span>
      </div>
      {items.map((item, idx) => (
        <div key={idx} className="flex items-center gap-3 text-xs">
          {item.icon}
          <span className={item.color}>{item.label}</span>
        </div>
      ))}
    </div>
  );
}
