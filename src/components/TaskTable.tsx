import type { Task, AMR, TaskPriority, TaskStatus } from '@/simulation/types';
import { Plus, RefreshCw, ArrowRight, AlertCircle } from 'lucide-react';
import { useState } from 'react';

interface TaskTableProps {
  tasks: Task[];
  robots: AMR[];
  onAddTask: (pickup: string, drop: string, priority: TaskPriority) => void;
  onReassign: (taskId: string) => void;
  onChangePriority: (taskId: string, priority: TaskPriority) => void;
  onToggleRobotFailure: (robotId: string) => void;
}

const statusColors: Record<string, string> = {
  ASSIGNED: 'bg-blue-500/20 text-blue-400',
  IN_PROGRESS: 'bg-cyan-500/20 text-cyan-400',
  REASSIGNED: 'bg-orange-500/20 text-orange-400',
  COMPLETED: 'bg-green-500/20 text-green-400',
  BLOCKED: 'bg-red-500/20 text-red-400',
  PENDING: 'bg-slate-500/20 text-slate-400',
};

const priorityColors: Record<string, string> = {
  LOW: 'text-slate-400',
  NORMAL: 'text-blue-400',
  HIGH: 'text-orange-400',
  CRITICAL: 'text-red-400',
};

const pickupOptions = ['Pickup A', 'Pickup B', 'Pickup C'];
const dropOptions = ['Drop D', 'Drop E', 'Drop F'];
const priorityOptions: TaskPriority[] = ['LOW', 'NORMAL', 'HIGH', 'CRITICAL'];

export default function TaskTable({
  tasks,
  robots,
  onAddTask,
  onReassign,
  onChangePriority,
  onToggleRobotFailure,
}: TaskTableProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newPickup, setNewPickup] = useState(pickupOptions[0]);
  const [newDrop, setNewDrop] = useState(dropOptions[0]);
  const [newPriority, setNewPriority] = useState<TaskPriority>('NORMAL');

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-700 flex items-center justify-between">
        <h3 className="text-white font-semibold text-sm">Task Manager</h3>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 text-xs font-medium transition-colors border border-cyan-500/20"
        >
          <Plus size={14} /> Create Task
        </button>
      </div>

      {showAddForm && (
        <div className="px-4 py-3 bg-slate-800/50 border-b border-slate-700 flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-[10px] uppercase tracking-wider text-slate-500 mb-1">Pickup</label>
            <select
              value={newPickup}
              onChange={(e) => setNewPickup(e.target.value)}
              className="bg-slate-800 text-white text-sm rounded-lg px-3 py-1.5 border border-slate-600 focus:border-cyan-500 outline-none"
            >
              {pickupOptions.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-wider text-slate-500 mb-1">Drop</label>
            <select
              value={newDrop}
              onChange={(e) => setNewDrop(e.target.value)}
              className="bg-slate-800 text-white text-sm rounded-lg px-3 py-1.5 border border-slate-600 focus:border-cyan-500 outline-none"
            >
              {dropOptions.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-wider text-slate-500 mb-1">Priority</label>
            <select
              value={newPriority}
              onChange={(e) => setNewPriority(e.target.value as TaskPriority)}
              className="bg-slate-800 text-white text-sm rounded-lg px-3 py-1.5 border border-slate-600 focus:border-cyan-500 outline-none"
            >
              {priorityOptions.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <button
            onClick={() => {
              onAddTask(newPickup, newDrop, newPriority);
              setShowAddForm(false);
            }}
            className="px-4 py-1.5 rounded-lg bg-cyan-500 text-white text-sm font-medium hover:bg-cyan-400 transition-colors"
          >
            Create
          </button>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-700 text-[10px] uppercase tracking-wider text-slate-500">
              <th className="px-4 py-2.5 text-left font-semibold">Task ID</th>
              <th className="px-4 py-2.5 text-left font-semibold">Pickup</th>
              <th className="px-4 py-2.5 text-left font-semibold">Destination</th>
              <th className="px-4 py-2.5 text-left font-semibold">Assigned AMR</th>
              <th className="px-4 py-2.5 text-left font-semibold">Priority</th>
              <th className="px-4 py-2.5 text-left font-semibold">Status</th>
              <th className="px-4 py-2.5 text-left font-semibold">ETA</th>
              <th className="px-4 py-2.5 text-left font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((task) => (
              <tr key={task.id} className="border-b border-slate-800 hover:bg-slate-800/30 transition-colors">
                <td className="px-4 py-3 text-white font-mono text-xs font-semibold">{task.id}</td>
                <td className="px-4 py-3 text-slate-300 text-xs">{task.pickup}</td>
                <td className="px-4 py-3 text-slate-300 text-xs">
                  <div className="flex items-center gap-1">
                    {task.pickup.split(' ')[1] || task.pickup}
                    <ArrowRight size={10} className="text-slate-500" />
                    {task.drop.split(' ')[1] || task.drop}
                  </div>
                </td>
                <td className="px-4 py-3 text-xs">
                  {task.assignedAMR ? (
                    <span className="font-mono text-cyan-400">{task.assignedAMR}</span>
                  ) : (
                    <span className="text-slate-500">Unassigned</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <select
                    value={task.priority}
                    onChange={(e) => onChangePriority(task.id, e.target.value as TaskPriority)}
                    className={`bg-transparent text-xs font-semibold cursor-pointer outline-none ${priorityColors[task.priority]}`}
                  >
                    {priorityOptions.map((p) => <option key={p} value={p} className="bg-slate-800 text-white">{p}</option>)}
                  </select>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${statusColors[task.status] || ''}`}>
                    {task.status.replace(/_/g, ' ')}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-300 text-xs font-mono">{task.eta > 0 ? `${task.eta.toFixed(0)}s` : '—'}</td>
                <td className="px-4 py-3">
                  {task.status !== 'COMPLETED' && (
                    <button
                      onClick={() => onReassign(task.id)}
                      className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                      title="Reassign task"
                    >
                      <RefreshCw size={12} /> Reassign
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Robot failure controls */}
      <div className="px-4 py-3 border-t border-slate-700">
        <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-2">Simulate AMR Failure</p>
        <div className="flex flex-wrap gap-2">
          {robots.map((r) => (
            <button
              key={r.id}
              onClick={() => onToggleRobotFailure(r.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                r.online
                  ? 'bg-slate-800 text-slate-300 border-slate-600 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30'
                  : 'bg-red-500/10 text-red-400 border-red-500/30 hover:bg-green-500/10 hover:text-green-400 hover:border-green-500/30'
              }`}
            >
              {r.online ? <AlertCircle size={12} /> : <RefreshCw size={12} />}
              {r.online ? `Take ${r.id} offline` : `Bring ${r.id} online`}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
