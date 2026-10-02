import type { SimulationEvent } from '@/simulation/types';
import { Info, AlertTriangle, Lock, Route, ListTodo, AlertCircle, CheckCircle, type LucideIcon } from 'lucide-react';

interface ActivityFeedProps {
  events: SimulationEvent[];
  maxItems?: number;
}

const categoryConfig: Record<string, { icon: LucideIcon; color: string; bg: string }> = {
  INFO: { icon: Info, color: 'text-blue-400', bg: 'bg-blue-500/10' },
  CONFLICT: { icon: AlertTriangle, color: 'text-orange-400', bg: 'bg-orange-500/10' },
  DEADLOCK: { icon: Lock, color: 'text-red-400', bg: 'bg-red-500/10' },
  REROUTE: { icon: Route, color: 'text-blue-400', bg: 'bg-blue-500/10' },
  TASK: { icon: ListTodo, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
  WARNING: { icon: AlertCircle, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
  SUCCESS: { icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-500/10' },
};

export default function ActivityFeed({ events, maxItems = 40 }: ActivityFeedProps) {
  const sorted = [...events].reverse().slice(0, maxItems);

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-xl overflow-hidden flex flex-col h-full">
      <div className="px-4 py-3 border-b border-slate-700 flex items-center justify-between">
        <h3 className="text-white font-semibold text-sm">Activity Feed</h3>
        <span className="flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
          <span className="text-[10px] text-slate-400 font-medium">LIVE</span>
        </span>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-1.5" style={{ maxHeight: '400px' }}>
        {sorted.length === 0 ? (
          <p className="text-slate-500 text-xs text-center py-4">No events yet. Start the simulation to see activity.</p>
        ) : (
          sorted.map((event) => {
            const config = categoryConfig[event.category] || categoryConfig.INFO;
            const Icon = config.icon;
            return (
              <div
                key={event.id}
                className="flex items-start gap-2.5 px-2.5 py-2 rounded-lg hover:bg-slate-800/50 transition-colors group"
              >
                <div className={`w-6 h-6 rounded-md ${config.bg} flex items-center justify-center shrink-0`}>
                  <Icon size={12} className={config.color} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-slate-200 text-xs leading-snug">{event.message}</p>
                  <p className="text-slate-500 text-[10px] font-mono mt-0.5">{event.timeString}</p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
