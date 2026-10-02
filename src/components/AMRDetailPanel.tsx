import type { AMR } from '@/simulation/types';
import { Battery, Activity, MapPin, Zap, Gauge, Radio, X } from 'lucide-react';

interface AMRDetailPanelProps {
  robot: AMR;
  onClose: () => void;
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

export default function AMRDetailPanel({ robot, onClose }: AMRDetailPanelProps) {
  const batteryColor = robot.battery > 60 ? 'text-green-400' : robot.battery > 30 ? 'text-yellow-400' : 'text-red-400';

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-xl p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm"
            style={{ backgroundColor: robot.color }}
          >
            {robot.id.split('-')[1]}
          </div>
          <div>
            <h3 className="text-white font-bold text-base">EDGE AGENT — {robot.id}</h3>
            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold border ${statusColors[robot.status] || ''}`}>
              {robot.status}
            </span>
          </div>
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
          <X size={18} />
        </button>
      </div>

      {/* Local State */}
      <div>
        <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-2">LOCAL STATE</p>
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-slate-800/50 rounded-lg p-2.5">
            <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
              <MapPin size={12} /> Position
            </div>
            <p className="text-white text-sm font-mono">({robot.position.x}, {robot.position.y})</p>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-2.5">
            <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
              <Battery size={12} /> Battery
            </div>
            <p className={`text-sm font-mono font-bold ${batteryColor}`}>{robot.battery.toFixed(0)}%</p>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-2.5">
            <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
              <Activity size={12} /> Current Task
            </div>
            <p className="text-white text-sm font-mono">{robot.taskId || 'None'}</p>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-2.5">
            <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
              <MapPin size={12} /> Destination
            </div>
            <p className="text-white text-sm font-mono">{robot.destinationLabel}</p>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-2.5">
            <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
              <Gauge size={12} /> Speed
            </div>
            <p className="text-white text-sm font-mono">{robot.speed.toFixed(1)} m/s</p>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-2.5">
            <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
              <Zap size={12} /> Priority
            </div>
            <p className="text-white text-sm font-mono">{robot.priority}</p>
          </div>
        </div>
      </div>

      {/* Current Intent */}
      <div>
        <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-1.5">CURRENT INTENT</p>
        <div className="bg-slate-800/50 rounded-lg p-2.5">
          <p className="text-cyan-400 text-sm font-medium">{robot.intent}</p>
        </div>
      </div>

      {/* Edge Decision */}
      <div>
        <div className="flex items-center gap-1.5 mb-2">
          <Radio size={12} className="text-cyan-400" />
          <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">SIMULATED EDGE DECISION SCORE</p>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-slate-300 text-sm">Local Decision</span>
            <span className={`text-sm font-bold ${robot.decision === 'PROCEED' ? 'text-green-400' : robot.decision === 'YIELD' || robot.decision === 'WAIT' ? 'text-orange-400' : robot.decision === 'REROUTE' ? 'text-blue-400' : 'text-slate-400'}`}>
              {robot.decision}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-300 text-sm">Confidence</span>
            <div className="flex items-center gap-2">
              <div className="w-24 h-2 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-300"
                  style={{ width: `${robot.confidence}%` }}
                />
              </div>
              <span className="text-white text-sm font-mono font-bold">{robot.confidence}%</span>
            </div>
          </div>
          <div>
            <p className="text-slate-400 text-xs mb-1">Decision Reason</p>
            <ul className="space-y-0.5">
              {robot.decisionReason.map((reason, i) => (
                <li key={i} className="text-slate-300 text-xs flex items-start gap-1.5">
                  <span className="text-cyan-500 mt-0.5">›</span>
                  {reason}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Route Info */}
      <div>
        <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-1.5">ROUTE</p>
        <div className="bg-slate-800/50 rounded-lg p-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Progress</span>
            <span className="text-white font-mono">
              {robot.route.currentIndex}/{robot.route.waypoints.length} waypoints
            </span>
          </div>
          <div className="mt-1.5 w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${robot.route.waypoints.length > 0 ? (robot.route.currentIndex / robot.route.waypoints.length) * 100 : 0}%`,
                backgroundColor: robot.color,
              }}
            />
          </div>
          <div className="mt-2 flex items-center justify-between text-xs">
            <span className="text-slate-400">Distance Travelled</span>
            <span className="text-white font-mono">{robot.distanceTravelled.toFixed(0)} units</span>
          </div>
          <div className="mt-1 flex items-center justify-between text-xs">
            <span className="text-slate-400">Waiting Time</span>
            <span className="text-white font-mono">{robot.waitingTime.toFixed(0)}s</span>
          </div>
        </div>
      </div>
    </div>
  );
}
