import { Cpu, Radio, LayoutDashboard, Play, ListTodo, AlertTriangle, BarChart3, Network } from 'lucide-react';

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

const navItems = [
  { id: 'overview', label: 'Fleet Overview', icon: LayoutDashboard },
  { id: 'simulation', label: 'Live Simulation', icon: Play },
  { id: 'tasks', label: 'Task Manager', icon: ListTodo },
  { id: 'conflicts', label: 'Conflict Center', icon: AlertTriangle },
  { id: 'performance', label: 'Performance', icon: BarChart3 },
  { id: 'architecture', label: 'Architecture', icon: Network },
];

export default function Sidebar({ currentPage, onNavigate }: SidebarProps) {
  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-screen sticky top-0 shrink-0">
      <div className="px-5 py-5 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Cpu size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight">FLEETX</h1>
            <p className="text-[10px] text-slate-400 leading-tight">Edge Fleet Intelligence</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <p className="px-2 pb-2 text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Navigation</p>
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                active
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50 border border-transparent'
              }`}
            >
              <Icon size={18} />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="px-3 py-4 border-t border-slate-800 space-y-3">
        <div className="flex items-center gap-2 px-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
          </span>
          <span className="text-xs text-slate-300 font-medium">EDGE SIMULATION ONLINE</span>
        </div>
        <div className="flex items-center gap-2 px-2">
          <Radio size={14} className="text-cyan-400" />
          <span className="text-xs text-slate-300 font-medium">P2P NETWORK ACTIVE</span>
        </div>
        <div className="px-2 pt-2 border-t border-slate-800/50">
          <p className="text-[10px] text-slate-500 leading-relaxed">
            SIH26123 • Bharat Electronics Limited<br />Smart Automation
          </p>
        </div>
      </div>
    </aside>
  );
}
