import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend, RadialBarChart, RadialBar,
} from 'recharts';
import type { BenchmarkComparison } from '@/simulation/benchmarkEngine';
import { Trophy, Target, TrendingDown, Clock, Zap, AlertTriangle, Lock, CheckCircle } from 'lucide-react';

interface PerformanceChartProps {
  benchmark: BenchmarkComparison | null;
  onRunBenchmark: () => void;
}

export default function PerformanceChart({ benchmark, onRunBenchmark }: PerformanceChartProps) {
  if (!benchmark) {
    return (
      <div className="bg-slate-900 border border-slate-700 rounded-xl p-8 text-center">
        <Trophy size={40} className="text-slate-600 mx-auto mb-3" />
        <h3 className="text-white font-semibold text-base mb-1">Benchmark Not Yet Run</h3>
        <p className="text-slate-400 text-sm mb-4">Run a benchmark to compare FLEETX vs Stop-and-Wait coordination</p>
        <button
          onClick={onRunBenchmark}
          className="px-5 py-2 rounded-lg bg-cyan-500 text-white text-sm font-medium hover:bg-cyan-400 transition-colors"
        >
          Run Benchmark
        </button>
      </div>
    );
  }

  const completionData = [
    { name: 'Stop-and-Wait', value: benchmark.stopAndWait.completionTime, fill: '#f97316' },
    { name: 'FLEETX', value: benchmark.fleetx.completionTime, fill: '#06b6d4' },
  ];

  const waitingData = [
    { name: 'Stop-and-Wait', value: benchmark.stopAndWait.waitingTime, fill: '#f97316' },
    { name: 'FLEETX', value: benchmark.fleetx.waitingTime, fill: '#06b6d4' },
  ];

  const utilizationData = [
    {
      name: 'Fleet Utilization',
      'Stop-and-Wait': benchmark.stopAndWait.fleetUtilization,
      FLEETX: benchmark.fleetx.fleetUtilization,
    },
  ];

  const metricsData = [
    { metric: 'Completion Time', stopWait: benchmark.stopAndWait.completionTime, fleetx: benchmark.fleetx.completionTime },
    { metric: 'Waiting Time', stopWait: benchmark.stopAndWait.waitingTime, fleetx: benchmark.fleetx.waitingTime },
    { metric: 'Collisions', stopWait: benchmark.stopAndWait.collisionCount, fleetx: benchmark.fleetx.collisionCount },
    { metric: 'Deadlocks', stopWait: benchmark.stopAndWait.deadlockCount, fleetx: benchmark.fleetx.deadlockCount },
    { metric: 'Tasks Done', stopWait: benchmark.stopAndWait.tasksCompleted, fleetx: benchmark.fleetx.tasksCompleted },
  ];

  return (
    <div className="space-y-4">
      {/* Target banner */}
      <div className={`rounded-xl p-4 border ${benchmark.targetAchieved ? 'bg-green-500/10 border-green-500/30' : 'bg-orange-500/10 border-orange-500/30'}`}>
        <div className="flex items-center gap-3">
          {benchmark.targetAchieved ? (
            <Target size={28} className="text-green-400" />
          ) : (
            <Target size={28} className="text-orange-400" />
          )}
          <div>
            <p className={`font-bold text-sm ${benchmark.targetAchieved ? 'text-green-400' : 'text-orange-400'}`}>
              {benchmark.targetAchieved ? 'TARGET ACHIEVED — ≥20% faster task completion' : 'TARGET NOT YET ACHIEVED'}
            </p>
            <p className="text-slate-300 text-xs mt-0.5">
              Time Reduction: {benchmark.timeReductionPct.toFixed(1)}% • Waiting Reduction: {benchmark.waitingReductionPct.toFixed(1)}% • Benchmark Result
            </p>
          </div>
        </div>
      </div>

      {/* Key metrics cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingDown size={16} className="text-cyan-400" />
            <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Time Reduction</span>
          </div>
          <p className="text-2xl font-bold text-cyan-400">{benchmark.timeReductionPct.toFixed(1)}%</p>
        </div>
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <Clock size={16} className="text-green-400" />
            <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Waiting Reduction</span>
          </div>
          <p className="text-2xl font-bold text-green-400">{benchmark.waitingReductionPct.toFixed(1)}%</p>
        </div>
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <Zap size={16} className="text-orange-400" />
            <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Collisions Avoided</span>
          </div>
          <p className="text-2xl font-bold text-orange-400">{benchmark.collisionReduction}</p>
        </div>
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <Lock size={16} className="text-red-400" />
            <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Deadlocks Prevented</span>
          </div>
          <p className="text-2xl font-bold text-red-400">{benchmark.deadlockReduction}</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Completion Time */}
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-4">
          <h4 className="text-white font-semibold text-sm mb-3">Total Task Completion Time</h4>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={completionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#0a3f3b" />
              <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={11} unit="s" />
              <Tooltip contentStyle={{ backgroundColor: '#04201e', border: '1px solid #334155', borderRadius: '8px' }} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Waiting Time */}
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-4">
          <h4 className="text-white font-semibold text-sm mb-3">Total Waiting Time</h4>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={waitingData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#0a3f3b" />
              <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={11} unit="s" />
              <Tooltip contentStyle={{ backgroundColor: '#04201e', border: '1px solid #334155', borderRadius: '8px' }} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Combined metrics chart */}
      <div className="bg-slate-900 border border-slate-700 rounded-xl p-4">
        <h4 className="text-white font-semibold text-sm mb-3">Full Benchmark Comparison</h4>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={metricsData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#0a3f3b" />
            <XAxis dataKey="metric" stroke="#64748b" fontSize={10} />
            <YAxis stroke="#64748b" fontSize={11} />
            <Tooltip contentStyle={{ backgroundColor: '#04201e', border: '1px solid #334155', borderRadius: '8px' }} />
            <Legend wrapperStyle={{ fontSize: '12px' }} />
            <Bar dataKey="stopWait" name="Stop-and-Wait" fill="#f97316" radius={[4, 4, 0, 0]} />
            <Bar dataKey="fleetx" name="FLEETX" fill="#06b6d4" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Fleet utilization radial */}
      <div className="bg-slate-900 border border-slate-700 rounded-xl p-4">
        <h4 className="text-white font-semibold text-sm mb-3">Fleet Utilization</h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <p className="text-xs text-slate-400 mb-2">Stop-and-Wait</p>
            <ResponsiveContainer width="100%" height={140}>
              <RadialBarChart
                innerRadius="60%"
                outerRadius="100%"
                data={[{ name: 'Util', value: benchmark.stopAndWait.fleetUtilization, fill: '#f97316' }]}
                startAngle={90}
                endAngle={-270}
              >
                <RadialBar dataKey="value" cornerRadius={6} background={{ fill: '#0a3f3b' }} />
                <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" fill="#f97316" fontSize="20" fontWeight="bold">
                  {benchmark.stopAndWait.fleetUtilization}%
                </text>
              </RadialBarChart>
            </ResponsiveContainer>
          </div>
          <div className="text-center">
            <p className="text-xs text-slate-400 mb-2">FLEETX</p>
            <ResponsiveContainer width="100%" height={140}>
              <RadialBarChart
                innerRadius="60%"
                outerRadius="100%"
                data={[{ name: 'Util', value: benchmark.fleetx.fleetUtilization, fill: '#06b6d4' }]}
                startAngle={90}
                endAngle={-270}
              >
                <RadialBar dataKey="value" cornerRadius={6} background={{ fill: '#0a3f3b' }} />
                <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" fill="#06b6d4" fontSize="20" fontWeight="bold">
                  {benchmark.fleetx.fleetUtilization}%
                </text>
              </RadialBarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
