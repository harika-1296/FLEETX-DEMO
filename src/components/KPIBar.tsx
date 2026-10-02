import type { Metrics } from '@/simulation/types';
import { Cpu, ListTodo, AlertTriangle, Lock, BarChart3, Clock, Zap, Radio, type LucideIcon } from 'lucide-react';

interface KPIBarProps {
  metrics: Metrics;
}

interface KPICard {
  label: string;
  value: string;
  icon: LucideIcon;
  color: string;
  bg: string;
}

export default function KPIBar({ metrics }: KPIBarProps) {
  const cards: KPICard[] = [
    { label: 'Active AMRs', value: String(metrics.activeAMRs), icon: Cpu, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
    { label: 'Active Tasks', value: String(metrics.activeTasks), icon: ListTodo, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { label: 'Conflicts', value: String(metrics.conflicts), icon: AlertTriangle, color: metrics.conflicts > 0 ? 'text-orange-400' : 'text-slate-400', bg: metrics.conflicts > 0 ? 'bg-orange-500/10' : 'bg-slate-700/20' },
    { label: 'Deadlocks', value: String(metrics.deadlocks), icon: Lock, color: metrics.deadlocks > 0 ? 'text-red-400' : 'text-slate-400', bg: metrics.deadlocks > 0 ? 'bg-red-500/10' : 'bg-slate-700/20' },
    { label: 'Fleet Utilization', value: `${metrics.fleetUtilization}%`, icon: BarChart3, color: 'text-green-400', bg: 'bg-green-500/10' },
    { label: 'Task Completion', value: `${metrics.taskCompletionTime}s`, icon: Clock, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { label: 'Collisions', value: String(metrics.collisionCount), icon: Zap, color: metrics.collisionCount > 0 ? 'text-red-400' : 'text-green-400', bg: metrics.collisionCount > 0 ? 'bg-red-500/10' : 'bg-green-500/10' },
    { label: 'Network', value: metrics.networkStatus, icon: Radio, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.label}
            className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-3 hover:border-slate-600 transition-colors"
          >
            <div className={`w-8 h-8 rounded-lg ${card.bg} flex items-center justify-center mb-2`}>
              <Icon size={16} className={card.color} />
            </div>
            <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-0.5">{card.label}</p>
            <p className={`text-base font-bold ${card.color}`}>{card.value}</p>
          </div>
        );
      })}
    </div>
  );
}
