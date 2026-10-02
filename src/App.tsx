import { useState, useEffect, useRef } from 'react';
import Sidebar from '@/components/Sidebar';
import FleetOverview from '@/pages/FleetOverview';
import LiveSimulation from '@/pages/LiveSimulation';
import TaskManager from '@/pages/TaskManager';
import ConflictCenter from '@/pages/ConflictCenter';
import Performance from '@/pages/Performance';
import Architecture from '@/pages/Architecture';
import { useSimulation } from '@/hooks/useSimulation';
import type { SimulationState } from '@/simulation/simulationEngine';
import {
  applyScenario, blockAisle, triggerDeadlock, toggleRobotFailure,
} from '@/simulation/simulationEngine';
import { Cpu, CheckCircle, Trophy, Zap, Lock, Route } from 'lucide-react';

type Page = 'overview' | 'simulation' | 'tasks' | 'conflicts' | 'performance' | 'architecture';

interface DemoSummary {
  collisions: number;
  deadlocksResolved: number;
  tasksCompleted: number;
  reroutes: number;
}

export default function App() {
  const { state, updateState } = useSimulation();
  const [page, setPage] = useState<Page>('overview');
  const [demoSummary, setDemoSummary] = useState<DemoSummary | null>(null);
  const demoTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const demoStartRef = useRef<number>(0);

  const handleSelectRobot = (id: string) => {
    updateState(prev => ({ ...prev, selectedRobotId: id || null }));
  };

  // Demo mode logic
  useEffect(() => {
    if (!state.demoActive) return;

    // Clear any existing timers
    demoTimersRef.current.forEach(t => clearTimeout(t));
    demoTimersRef.current = [];

    // Start fresh
    updateState(prev => ({ ...applyScenario(prev, 'normal'), demoActive: true }));
    demoStartRef.current = Date.now();
    setDemoSummary(null);

    const schedule = (delaySec: number, fn: () => void) => {
      const t = setTimeout(fn, delaySec * 1000);
      demoTimersRef.current.push(t);
    };

    // 0-10s: Normal operations (already started)
    schedule(2, () => updateState(prev => ({ ...prev, running: true })));

    // 10-25s: AMR-01 and AMR-02 approach intersection
    schedule(10, () => {
      updateState(prev => applyScenario({ ...prev, demoActive: true }, 'crossing'));
    });

    // 25s: Conflict detected (happens automatically from simulation)
    // 26s: Priority negotiation (automatic)
    // 28s: AMR-02 yields (automatic)

    // 35s: Aisle becomes blocked
    schedule(35, () => {
      updateState(prev => blockAisle({ ...prev, demoActive: true }));
    });

    // 45s: AMR-02 becomes unavailable
    schedule(45, () => {
      updateState(prev => toggleRobotFailure({ ...prev, demoActive: true }, 'AMR-02'));
    });

    // 55s: Deadlock scenario triggered
    schedule(55, () => {
      updateState(prev => triggerDeadlock({ ...prev, demoActive: true }));
    });

    // 70s: Fleet returns to normal
    schedule(70, () => {
      updateState(prev => applyScenario({ ...prev, demoActive: true }, 'normal'));
    });

    // 85s: Demo complete — show summary
    schedule(85, () => {
      updateState(prev => {
        const reroutes = prev.events.filter(e => e.category === 'REROUTE').length;
        const deadlocksResolved = prev.deadlocks.filter(d => d.resolved).length;
        const tasksCompleted = prev.tasks.filter(t => t.status === 'COMPLETED').length;
        const summary: DemoSummary = {
          collisions: prev.collisionCount,
          deadlocksResolved,
          tasksCompleted,
          reroutes,
        };
        setDemoSummary(summary);
        return { ...prev, running: false, demoActive: false };
      });
    });

    return () => {
      demoTimersRef.current.forEach(t => clearTimeout(t));
      demoTimersRef.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.demoActive]);

  const navigateTo = (p: string) => {
    setPage(p as Page);
    if (p === 'simulation') setDemoSummary(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex">
      <Sidebar currentPage={page} onNavigate={navigateTo} />

      <main className="flex-1 overflow-y-auto" style={{ maxHeight: '100vh' }}>
        {/* Top bar */}
        <div className="sticky top-0 z-10 bg-slate-950/80 backdrop-blur-md border-b border-slate-800 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Cpu size={18} className="text-cyan-400" />
            <span className="text-slate-300 text-sm font-medium">FLEETX Control Center</span>
          </div>
          <div className="flex items-center gap-4 text-xs text-slate-400">
            <span>SIH26123</span>
            <span className="text-slate-600">|</span>
            <span>Bharat Electronics Limited</span>
            <span className="text-slate-600">|</span>
            <span>Smart Automation</span>
          </div>
        </div>

        <div className="p-6">
          {page === 'overview' && <FleetOverview state={state} onSelectRobot={handleSelectRobot} />}
          {page === 'simulation' && (
            <LiveSimulation
              state={state}
              updateState={updateState}
              onSelectRobot={handleSelectRobot}
            />
          )}
          {page === 'tasks' && <TaskManager state={state} updateState={updateState} />}
          {page === 'conflicts' && <ConflictCenter state={state} />}
          {page === 'performance' && <Performance state={state} updateState={updateState} />}
          {page === 'architecture' && <Architecture />}
        </div>
      </main>

      {/* Demo Complete Modal */}
      {demoSummary && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-slate-900 border border-cyan-500/30 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl shadow-cyan-500/10">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={32} className="text-green-400" />
              </div>
              <h2 className="text-white text-xl font-bold mb-1">DEMO COMPLETE</h2>
              <p className="text-slate-400 text-sm mb-5">SIH Demonstration Summary</p>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className="bg-slate-800/50 rounded-xl p-3 text-center">
                <Zap size={18} className="text-green-400 mx-auto mb-1" />
                <p className="text-slate-500 text-xs">Collisions</p>
                <p className="text-white text-lg font-bold">{demoSummary.collisions}</p>
              </div>
              <div className="bg-slate-800/50 rounded-xl p-3 text-center">
                <Lock size={18} className="text-green-400 mx-auto mb-1" />
                <p className="text-slate-500 text-xs">Deadlocks Resolved</p>
                <p className="text-white text-lg font-bold">{demoSummary.deadlocksResolved}</p>
              </div>
              <div className="bg-slate-800/50 rounded-xl p-3 text-center">
                <CheckCircle size={18} className="text-cyan-400 mx-auto mb-1" />
                <p className="text-slate-500 text-xs">Tasks Completed</p>
                <p className="text-white text-lg font-bold">{demoSummary.tasksCompleted}</p>
              </div>
              <div className="bg-slate-800/50 rounded-xl p-3 text-center">
                <Route size={18} className="text-blue-400 mx-auto mb-1" />
                <p className="text-slate-500 text-xs">Reroutes</p>
                <p className="text-white text-lg font-bold">{demoSummary.reroutes}</p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setDemoSummary(null);
                  setPage('performance');
                  updateState(prev => ({
                    ...prev,
                    benchmark: null,
                  }));
                }}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-sm font-bold hover:from-cyan-400 hover:to-blue-500 transition-colors"
              >
                <Trophy size={16} /> Run Benchmark
              </button>
              <button
                onClick={() => setDemoSummary(null)}
                className="px-4 py-2.5 rounded-lg bg-slate-800 text-slate-300 text-sm font-medium hover:bg-slate-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
