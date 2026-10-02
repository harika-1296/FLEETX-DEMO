import ConflictPanel from '@/components/ConflictPanel';
import CommPanel from '@/components/CommPanel';
import ActivityFeed from '@/components/ActivityFeed';
import KPIBar from '@/components/KPIBar';
import type { SimulationState } from '@/simulation/simulationEngine';

interface ConflictCenterProps {
  state: SimulationState;
}

export default function ConflictCenter({ state }: ConflictCenterProps) {
  const activeConflicts = state.conflicts.filter(c => c.status !== 'RESOLVED');
  const resolvedConflicts = state.conflicts.filter(c => c.status === 'RESOLVED');

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-white">Conflict Center</h1>
        <p className="text-slate-400 text-sm mt-0.5">
          Active conflicts, deadlocks, reroutes and communication events — SIMULATION
        </p>
      </div>

      <KPIBar metrics={state.metrics} />

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-4">
          <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-1">Active Conflicts</p>
          <p className={`text-2xl font-bold ${activeConflicts.length > 0 ? 'text-red-400' : 'text-green-400'}`}>
            {activeConflicts.length}
          </p>
        </div>
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-4">
          <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-1">Negotiating</p>
          <p className={`text-2xl font-bold ${state.conflicts.filter(c => c.status === 'NEGOTIATING').length > 0 ? 'text-orange-400' : 'text-slate-400'}`}>
            {state.conflicts.filter(c => c.status === 'NEGOTIATING').length}
          </p>
        </div>
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-4">
          <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-1">Resolved</p>
          <p className="text-2xl font-bold text-green-400">{resolvedConflicts.length}</p>
        </div>
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-4">
          <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-1">Deadlocks</p>
          <p className={`text-2xl font-bold ${state.deadlocks.filter(d => !d.resolved).length > 0 ? 'text-red-400' : 'text-slate-400'}`}>
            {state.deadlocks.filter(d => !d.resolved).length}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Conflicts */}
        <div>
          <h3 className="text-white font-semibold text-sm mb-3">All Conflicts & Deadlocks</h3>
          <ConflictPanel
            conflicts={state.conflicts}
            deadlocks={state.deadlocks}
            showResolved={true}
          />
        </div>

        {/* Communication + Activity */}
        <div className="space-y-4">
          <CommPanel messages={state.messages} maxItems={20} />
          <ActivityFeed events={state.events} maxItems={20} />
        </div>
      </div>
    </div>
  );
}
