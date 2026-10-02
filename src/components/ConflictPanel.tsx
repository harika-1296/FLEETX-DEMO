import type { Conflict, Deadlock } from '@/simulation/types';
import { AlertTriangle, CheckCircle, Lock, Route, Radio } from 'lucide-react';

interface ConflictPanelProps {
  conflicts: Conflict[];
  deadlocks: Deadlock[];
  showResolved?: boolean;
}

const statusConfig: Record<string, { color: string; bg: string; border: string; label: string }> = {
  ACTIVE: { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30', label: 'ACTIVE' },
  NEGOTIATING: { color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/30', label: 'NEGOTIATING' },
  RESOLVED: { color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/30', label: 'RESOLVED' },
};

const riskConfig: Record<string, string> = {
  HIGH: 'text-red-400 bg-red-500/10',
  MEDIUM: 'text-orange-400 bg-orange-500/10',
  LOW: 'text-yellow-400 bg-yellow-500/10',
};

export default function ConflictPanel({ conflicts, deadlocks, showResolved = true }: ConflictPanelProps) {
  const visibleConflicts = showResolved ? conflicts : conflicts.filter(c => c.status !== 'RESOLVED');
  const sorted = [...visibleConflicts].sort((a, b) => b.detectionTime - a.detectionTime);

  return (
    <div className="space-y-3">
      {/* Active conflicts */}
      {sorted.length === 0 && deadlocks.filter(d => !d.resolved).length === 0 ? (
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-8 text-center">
          <CheckCircle size={32} className="text-green-400 mx-auto mb-2" />
          <p className="text-slate-300 text-sm font-medium">No active conflicts</p>
          <p className="text-slate-500 text-xs mt-1">Fleet operating normally</p>
        </div>
      ) : (
        sorted.map((conflict) => {
          const sc = statusConfig[conflict.status] || statusConfig.ACTIVE;
          return (
            <div
              key={conflict.id}
              className={`bg-slate-900 border ${sc.border} rounded-xl p-4 transition-all hover:scale-[1.01]`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  {conflict.status === 'RESOLVED' ? (
                    <CheckCircle size={16} className={sc.color} />
                  ) : (
                    <AlertTriangle size={16} className={sc.color} />
                  )}
                  <span className="text-white font-semibold text-sm font-mono">{conflict.id}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${riskConfig[conflict.risk]}`}>
                    {conflict.risk}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${sc.bg} ${sc.color} ${sc.border}`}>
                    {sc.label}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <p className="text-slate-500 mb-0.5">Robots</p>
                  <p className="text-white font-mono font-semibold">{conflict.robots.join(' ↔ ')}</p>
                </div>
                <div>
                  <p className="text-slate-500 mb-0.5">Location</p>
                  <p className="text-white font-mono">{conflict.location}</p>
                </div>
                <div>
                  <p className="text-slate-500 mb-0.5">Type</p>
                  <p className="text-slate-300 font-mono">{conflict.type.replace(/_/g, ' ')}</p>
                </div>
                <div>
                  <p className="text-slate-500 mb-0.5">Detection Time</p>
                  <p className="text-slate-300 font-mono">T+{conflict.detectionTime}s</p>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-700/50">
                <p className="text-slate-500 text-[10px] uppercase tracking-wider mb-1">Resolution</p>
                <p className="text-cyan-400 text-xs font-medium">{conflict.resolution}</p>
                <p className="text-slate-400 text-xs mt-1">Reason: {conflict.reason}</p>
              </div>

              {conflict.details && (
                <div className="mt-2 grid grid-cols-2 gap-2 text-[10px]">
                  <div className="bg-slate-800/50 rounded p-2">
                    <p className="text-slate-400">{conflict.robots[0]}</p>
                    <p className="text-white font-mono">ETA: {conflict.details.etaA.toFixed(1)}s</p>
                    <p className="text-slate-400">Priority: {conflict.details.priorityA}</p>
                  </div>
                  <div className="bg-slate-800/50 rounded p-2">
                    <p className="text-slate-400">{conflict.robots[1]}</p>
                    <p className="text-white font-mono">ETA: {conflict.details.etaB.toFixed(1)}s</p>
                    <p className="text-slate-400">Priority: {conflict.details.priorityB}</p>
                  </div>
                </div>
              )}
            </div>
          );
        })
      )}

      {/* Deadlocks */}
      {deadlocks.map((dl) => (
        <div
          key={dl.id}
          className={`bg-slate-900 border ${dl.resolved ? 'border-green-500/30' : 'border-red-500/30'} rounded-xl p-4`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Lock size={16} className={dl.resolved ? 'text-green-400' : 'text-red-400'} />
              <span className="text-white font-semibold text-sm font-mono">{dl.id}</span>
              <span className="text-[10px] text-slate-500">DEADLOCK</span>
            </div>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${dl.resolved ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
              {dl.resolved ? 'RESOLVED' : 'ACTIVE'}
            </span>
          </div>
          <div className="text-xs space-y-1.5">
            <div>
              <span className="text-slate-500">Affected Robots: </span>
              <span className="text-white font-mono">{dl.robots.join(' ↔ ')}</span>
            </div>
            <div>
              <span className="text-slate-500">Location: </span>
              <span className="text-white font-mono">{dl.location}</span>
            </div>
            <div>
              <span className="text-slate-500">Resolution: </span>
              <span className="text-cyan-400">{dl.resolution}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
