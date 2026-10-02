import { Play, Pause, RotateCcw, Gauge, Ban, Lock, Trophy } from 'lucide-react';
import type { SimulationMode } from '@/simulation/types';

interface SimulationControlsProps {
  running: boolean;
  speed: number;
  mode: SimulationMode;
  onToggleRun: () => void;
  onReset: () => void;
  onSpeedChange: (speed: number) => void;
  onModeChange: (mode: SimulationMode) => void;
  onBlockAisle: () => void;
  onTriggerDeadlock: () => void;
  onScenario: (scenario: string) => void;
  onBenchmark: () => void;
  onDemoMode: () => void;
}

const scenarios = [
  { id: 'normal', label: 'Normal Operations' },
  { id: 'crossing', label: 'Crossing Conflict' },
  { id: 'blocked', label: 'Blocked Aisle' },
  { id: 'deadlock', label: 'Deadlock' },
  { id: 'failure', label: 'AMR Failure' },
  { id: 'congestion', label: 'Heavy Congestion' },
];

export default function SimulationControls({
  running,
  speed,
  mode,
  onToggleRun,
  onReset,
  onSpeedChange,
  onModeChange,
  onBlockAisle,
  onTriggerDeadlock,
  onScenario,
  onBenchmark,
  onDemoMode,
}: SimulationControlsProps) {
  const speeds = [1, 2, 4];

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 space-y-3">
      {/* Playback controls */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={onToggleRun}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            running
              ? 'bg-orange-500/10 text-orange-400 border border-orange-500/30 hover:bg-orange-500/20'
              : 'bg-green-500/10 text-green-400 border border-green-500/30 hover:bg-green-500/20'
          }`}
        >
          {running ? <Pause size={16} /> : <Play size={16} />}
          {running ? 'Pause' : 'Start'}
        </button>
        <button
          onClick={onReset}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-slate-800 text-slate-300 border border-slate-600 hover:bg-slate-700 transition-colors"
        >
          <RotateCcw size={16} /> Reset
        </button>
        <div className="flex items-center gap-1.5 ml-2">
          <Gauge size={16} className="text-slate-400" />
          <div className="flex gap-1">
            {speeds.map((s) => (
              <button
                key={s}
                onClick={() => onSpeedChange(s)}
                className={`px-2.5 py-1 rounded text-xs font-bold transition-colors ${
                  speed === s
                    ? 'bg-cyan-500 text-white'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-1.5 ml-2">
          <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Mode</span>
          <div className="flex gap-1">
            <button
              onClick={() => onModeChange('FLEETX')}
              className={`px-3 py-1 rounded text-xs font-bold transition-colors ${
                mode === 'FLEETX' ? 'bg-cyan-500 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              FLEETX
            </button>
            <button
              onClick={() => onModeChange('STOP_AND_WAIT')}
              className={`px-3 py-1 rounded text-xs font-bold transition-colors ${
                mode === 'STOP_AND_WAIT' ? 'bg-orange-500 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              STOP-WAIT
            </button>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={onBlockAisle}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors"
        >
          <Ban size={14} /> Block Aisle
        </button>
        <button
          onClick={onTriggerDeadlock}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-orange-500/10 text-orange-400 border border-orange-500/20 hover:bg-orange-500/20 transition-colors"
        >
          <Lock size={14} /> Trigger Deadlock
        </button>
        <button
          onClick={onBenchmark}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 transition-colors"
        >
          <Trophy size={14} /> Run Benchmark
        </button>
        <button
          onClick={onDemoMode}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-400 hover:to-blue-500 transition-colors"
        >
          <Play size={14} /> SIH Demo Mode
        </button>
      </div>

      {/* Scenario buttons */}
      <div>
        <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-1.5">Scenarios</p>
        <div className="flex flex-wrap gap-1.5">
          {scenarios.map((s) => (
            <button
              key={s.id}
              onClick={() => onScenario(s.id)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 hover:text-white transition-colors"
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
