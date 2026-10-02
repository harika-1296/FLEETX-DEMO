import type { AMR } from '@/simulation/types';
import { Battery, Activity, Gauge, MapPin, Zap } from 'lucide-react';

interface AMRCardProps {
  robot: AMR;
  onClick: () => void;
  isSelected: boolean;
}

const statusColors: Record<string, string> = {
  MOVING: 'bg-green-500/20 text-green-400 border-green-500/30',
  WAITING: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  NEGOTIATING: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  REROUTING: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  BLOCKED: 'bg-red-500/20 text-red-400 border-red-500/30',
  COMPLETED: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  CHARGING: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  OFFLINE: 'bg-red-500/20 text-red-400 border-red-500/30',
};

export default function AMRCard({ robot, onClick, isSelected }: AMRCardProps) {
  const batteryColor = robot.battery > 60 ? 'text-green-400' : robot.battery > 30 ? 'text-yellow-400' : 'text-red-400';

  return (
    <button
      onClick={onClick}
      className={`text-left bg-slate-900 border rounded-xl p-4 transition-all hover:scale-[1.02] ${
        isSelected ? 'border-cyan-500/50 ring-1 ring-cyan-500/20' : 'border-slate-700 hover:border-slate-600'
      } ${!robot.online ? 'opacity-50' : ''}`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs"
            style={{ backgroundColor: robot.color }}
          >
            {robot.id.split('-')[1]}
          </div>
          <span className="text-white font-semibold text-sm">{robot.id}</span>
        </div>
        <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${statusColors[robot.status] || ''}`}>
          {robot.status}
        </span>
      </div>

      <div className="space-y-1.5 text-xs">
        <div className="flex items-center justify-between">
          <span className="text-slate-400 flex items-center gap-1"><Battery size={11} /> Battery</span>
          <span className={`font-mono font-bold ${batteryColor}`}>{robot.battery.toFixed(0)}%</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-400 flex items-center gap-1"><Activity size={11} /> Task</span>
          <span className="text-white font-mono">{robot.taskId || '—'}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-400 flex items-center gap-1"><Zap size={11} /> Priority</span>
          <span className="text-white font-mono">{robot.priority}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-400 flex items-center gap-1"><Gauge size={11} /> Speed</span>
          <span className="text-white font-mono">{robot.speed.toFixed(1)} m/s</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-400 flex items-center gap-1"><MapPin size={11} /> Position</span>
          <span className="text-white font-mono">({robot.position.x},{robot.position.y})</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-400 flex items-center gap-1"><MapPin size={11} /> Destination</span>
          <span className="text-white font-mono">{robot.destinationLabel}</span>
        </div>
        <div className="flex items-center justify-between pt-1 border-t border-slate-800">
          <span className="text-slate-400">Next Decision</span>
          <span className={`font-bold ${
            robot.decision === 'PROCEED' ? 'text-green-400' :
            robot.decision === 'YIELD' || robot.decision === 'WAIT' ? 'text-orange-400' :
            robot.decision === 'REROUTE' ? 'text-blue-400' : 'text-slate-400'
          }`}>
            {robot.decision}
          </span>
        </div>
      </div>
    </button>
  );
}
