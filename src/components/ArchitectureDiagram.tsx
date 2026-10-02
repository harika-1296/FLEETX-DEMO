import { Cpu, Radio, AlertTriangle, Scale, Route, ListTodo, LayoutDashboard, Warehouse, ArrowDown, ArrowRight, Zap } from 'lucide-react';

export default function ArchitectureDiagram() {
  const layers = [
    {
      title: 'WAREHOUSE LAYER',
      icon: Warehouse,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/30',
      items: ['Grid-based navigation', 'Aisles & intersections', 'Pickup / Drop zones', 'Charging station'],
    },
    {
      title: 'EDGE AGENT LAYER',
      icon: Cpu,
      color: 'text-cyan-400',
      bg: 'bg-cyan-500/10',
      border: 'border-cyan-500/30',
      items: ['AMR-01 Edge Agent', 'AMR-02 Edge Agent', 'AMR-03 Edge Agent', 'Local decision-making'],
      isAgentLayer: true,
    },
    {
      title: 'P2P COMMUNICATION',
      icon: Radio,
      color: 'text-green-400',
      bg: 'bg-green-500/10',
      border: 'border-green-500/30',
      items: ['State sharing', 'Intent broadcasting', 'Acknowledgment protocol', 'Yield / Proceed signals'],
    },
    {
      title: 'CONFLICT DETECTION',
      icon: AlertTriangle,
      color: 'text-orange-400',
      bg: 'bg-orange-500/10',
      border: 'border-orange-500/30',
      items: ['Route overlap check', 'Intersection prediction', 'ETA comparison', 'Risk assessment'],
    },
    {
      title: 'PRIORITY NEGOTIATION',
      icon: Scale,
      color: 'text-yellow-400',
      bg: 'bg-yellow-500/10',
      border: 'border-yellow-500/30',
      items: ['Task urgency', 'Route reservation', 'Battery level', 'Distance to intersection'],
    },
    {
      title: 'PATH PLANNING',
      icon: Route,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/30',
      items: ['A* pathfinding', 'Dynamic rerouting', 'Blocked cell avoidance', 'Alternate route calculation'],
    },
    {
      title: 'TASK ALLOCATION',
      icon: ListTodo,
      color: 'text-cyan-400',
      bg: 'bg-cyan-500/10',
      border: 'border-cyan-500/30',
      items: ['Cost estimation', 'Lowest-cost assignment', 'Failure reassignment', 'Priority-based preemption'],
    },
    {
      title: 'FLEET DASHBOARD',
      icon: LayoutDashboard,
      color: 'text-green-400',
      bg: 'bg-green-500/10',
      border: 'border-green-500/30',
      items: ['Real-time monitoring', 'KPI metrics', 'Activity feed', 'Performance benchmark'],
    },
  ];

  return (
    <div className="space-y-4">
      {/* Pipeline */}
      <div className="bg-slate-900 border border-slate-700 rounded-xl p-4">
        <h3 className="text-white font-semibold text-sm mb-3">Core Pipeline</h3>
        <div className="flex flex-wrap items-center gap-2">
          {['SENSE', 'SHARE', 'PREDICT', 'NEGOTIATE', 'REROUTE', 'EXECUTE', 'UPDATE'].map((step, i) => (
            <div key={step} className="flex items-center gap-2">
              <div className="px-3 py-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 text-xs font-bold border border-cyan-500/20">
                {step}
              </div>
              {i < 6 && <ArrowRight size={14} className="text-slate-500" />}
            </div>
          ))}
        </div>
      </div>

      {/* Architecture layers */}
      <div className="space-y-2">
        {layers.map((layer, i) => {
          const Icon = layer.icon;
          return (
            <div key={i}>
              <div className={`bg-slate-900 border ${layer.border} rounded-xl p-4`}>
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-8 h-8 rounded-lg ${layer.bg} flex items-center justify-center`}>
                    <Icon size={16} className={layer.color} />
                  </div>
                  <h4 className={`font-semibold text-sm ${layer.color}`}>{layer.title}</h4>
                </div>
                <div className="flex flex-wrap gap-2 ml-11">
                  {layer.items.map((item, j) => (
                    <span
                      key={j}
                      className="px-2.5 py-1 rounded-md bg-slate-800/60 text-slate-300 text-xs"
                    >
                      {item}
                    </span>
                  ))}
                </div>
                {layer.isAgentLayer && (
                  <div className="mt-3 ml-11 flex items-center gap-2 text-[10px] text-slate-400">
                    <Radio size={12} className="text-green-400" />
                    <span>Each AMR makes LOCAL decisions independently — no central AI controller</span>
                  </div>
                )}
              </div>
              {i < layers.length - 1 && (
                <div className="flex justify-center py-1">
                  <ArrowDown size={16} className="text-slate-600" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Deployment target */}
      <div className="bg-slate-900 border border-slate-700 rounded-xl p-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
            <Zap size={16} className="text-purple-400" />
          </div>
          <h4 className="text-purple-400 font-semibold text-sm">Deployment Target</h4>
        </div>
        <p className="text-slate-300 text-sm ml-11">
          Edge Deployment Target: Raspberry Pi / NVIDIA Jetson Nano
        </p>
        <p className="text-slate-500 text-xs ml-11 mt-1">
          This is the intended deployment target — not currently connected hardware. The simulation demonstrates the software concept and architecture.
        </p>
      </div>

      {/* Labels */}
      <div className="flex flex-wrap gap-2">
        {['SIMULATION', 'EDGE AGENT SIMULATION', 'SIMULATED P2P', 'BENCHMARK RESULT'].map((label) => (
          <span key={label} className="px-3 py-1 rounded-lg bg-slate-800 text-slate-400 text-[10px] font-bold border border-slate-700">
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
