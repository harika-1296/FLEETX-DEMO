import PerformanceChart from '@/components/PerformanceChart';
import KPIBar from '@/components/KPIBar';
import ActivityFeed from '@/components/ActivityFeed';
import type { SimulationState } from '@/simulation/simulationEngine';
import { runBenchmarkCalculation } from '@/simulation/simulationEngine';

interface PerformanceProps {
  state: SimulationState;
  updateState: (updater: (prev: SimulationState) => SimulationState) => void;
}

export default function Performance({ state, updateState }: PerformanceProps) {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-white">Performance Benchmark</h1>
        <p className="text-slate-400 text-sm mt-0.5">
          Stop-and-Wait vs FLEETX Decentralized Coordination — BENCHMARK RESULT
        </p>
      </div>

      <KPIBar metrics={state.metrics} />

      {/* Real-time metrics summary */}
      <div className="bg-slate-900 border border-slate-700 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-white font-semibold text-sm">Real-Time Fleet Metrics</h3>
          <span className="text-[10px] text-slate-500 bg-slate-800 px-2 py-0.5 rounded">LIVE SIMULATION</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div>
            <p className="text-slate-500 text-xs">Total Waiting Time</p>
            <p className="text-white font-mono font-bold text-lg">{state.metrics.totalWaitingTime.toFixed(0)}s</p>
          </div>
          <div>
            <p className="text-slate-500 text-xs">Distance Travelled</p>
            <p className="text-white font-mono font-bold text-lg">{state.metrics.distanceTravelled.toFixed(0)} u</p>
          </div>
          <div>
            <p className="text-slate-500 text-xs">Tasks Completed</p>
            <p className="text-white font-mono font-bold text-lg">{state.metrics.tasksCompleted}</p>
          </div>
          <div>
            <p className="text-slate-500 text-xs">Fleet Utilization</p>
            <p className="text-white font-mono font-bold text-lg">{state.metrics.fleetUtilization}%</p>
          </div>
        </div>
      </div>

      <PerformanceChart
        benchmark={state.benchmark}
        onRunBenchmark={() => updateState(prev => runBenchmarkCalculation(prev))}
      />

      <ActivityFeed events={state.events} maxItems={15} />
    </div>
  );
}
