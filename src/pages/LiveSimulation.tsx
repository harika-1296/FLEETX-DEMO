import WarehouseMap from '@/components/WarehouseMap';
import AMRDetailPanel from '@/components/AMRDetailPanel';
import SimulationControls from '@/components/SimulationControls';
import ActivityFeed from '@/components/ActivityFeed';
import CommPanel from '@/components/CommPanel';
import ConflictPanel from '@/components/ConflictPanel';
import MapLegend from '@/components/MapLegend';
import { Play } from 'lucide-react';
import type { SimulationState } from '@/simulation/simulationEngine';
import type { SimulationMode } from '@/simulation/types';
import {
  applyScenario, blockAisle, triggerDeadlock, runBenchmarkCalculation,
  toggleRunning, setSpeed, setSimulationMode, resetSimulation,
  toggleRobotFailure, addTask, reassignTaskAction, changeTaskPriority,
} from '@/simulation/simulationEngine';

interface LiveSimulationProps {
  state: SimulationState;
  updateState: (updater: (prev: SimulationState) => SimulationState) => void;
  onSelectRobot: (id: string) => void;
}

export default function LiveSimulation({ state, updateState, onSelectRobot }: LiveSimulationProps) {
  const selectedRobot = state.robots.find(r => r.id === state.selectedRobotId);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Live Simulation</h1>
          <p className="text-slate-400 text-sm mt-0.5">
            Interactive warehouse simulation — Tick T+{state.tick}s — Mode: {state.mode === 'FLEETX' ? 'FLEETX Decentralized' : 'Stop-and-Wait'}
          </p>
        </div>
        <span className="flex items-center gap-1.5 text-xs text-slate-400">
          <span className="relative flex h-2 w-2">
            {state.running && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            )}
            <span className={`relative inline-flex rounded-full h-2 w-2 ${state.running ? 'bg-green-500' : 'bg-slate-600'}`}></span>
          </span>
          {state.running ? 'RUNNING' : 'PAUSED'}
        </span>
      </div>

      {/* Controls */}
      <SimulationControls
        running={state.running}
        speed={state.speed}
        mode={state.mode}
        onToggleRun={() => updateState(prev => toggleRunning(prev))}
        onReset={() => updateState(() => resetSimulation())}
        onSpeedChange={(s) => updateState(prev => setSpeed(prev, s))}
        onModeChange={(m: SimulationMode) => updateState(prev => setSimulationMode(prev, m))}
        onBlockAisle={() => updateState(prev => blockAisle(prev))}
        onTriggerDeadlock={() => updateState(prev => triggerDeadlock(prev))}
        onScenario={(s) => updateState(prev => applyScenario(prev, s))}
        onBenchmark={() => updateState(prev => runBenchmarkCalculation(prev))}
        onDemoMode={() => updateState(prev => ({ ...prev, demoActive: true, running: true }))}
      />

      {/* Main simulation area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Warehouse map */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-700 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-white font-semibold text-sm">Warehouse Grid — {state.warehouse.width}×{state.warehouse.height}</h3>
            <span className="text-[10px] text-slate-500 bg-slate-800 px-2 py-0.5 rounded">SIMULATION</span>
          </div>
          <div className="overflow-x-auto pb-2">
            <WarehouseMap
              warehouse={state.warehouse}
              robots={state.robots}
              selectedRobotId={state.selectedRobotId}
              onSelectRobot={onSelectRobot}
              cellSize={30}
              blockedAisleCell={state.blockedAisleCell}
            />
          </div>
          <div className="mt-3 pt-3 border-t border-slate-800">
            <MapLegend />
          </div>
        </div>

        {/* Side panel */}
        <div className="space-y-4">
          {selectedRobot ? (
            <AMRDetailPanel robot={selectedRobot} onClose={() => onSelectRobot('')} />
          ) : (
            <div className="bg-slate-900 border border-slate-700 rounded-xl p-5 text-center">
              <Play size={28} className="text-slate-600 mx-auto mb-2" />
              <p className="text-slate-400 text-sm">Click a robot to inspect</p>
              <p className="text-slate-500 text-xs mt-1">its edge agent decision panel</p>
            </div>
          )}

          {/* Quick conflict summary */}
          {(state.conflicts.filter(c => c.status !== 'RESOLVED').length > 0 || state.deadlocks.filter(d => !d.resolved).length > 0) && (
            <ConflictPanel
              conflicts={state.conflicts.filter(c => c.status !== 'RESOLVED').slice(0, 3)}
              deadlocks={state.deadlocks.filter(d => !d.resolved).slice(0, 2)}
              showResolved={false}
            />
          )}
        </div>
      </div>

      {/* Bottom panels: Comm + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <CommPanel messages={state.messages} />
        <ActivityFeed events={state.events} />
      </div>
    </div>
  );
}
