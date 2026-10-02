import TaskTable from '@/components/TaskTable';
import KPIBar from '@/components/KPIBar';
import ActivityFeed from '@/components/ActivityFeed';
import type { SimulationState } from '@/simulation/simulationEngine';
import type { TaskPriority } from '@/simulation/types';
import {
  addTask, reassignTaskAction, changeTaskPriority, toggleRobotFailure,
} from '@/simulation/simulationEngine';

interface TaskManagerProps {
  state: SimulationState;
  updateState: (updater: (prev: SimulationState) => SimulationState) => void;
}

export default function TaskManager({ state, updateState }: TaskManagerProps) {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-white">Task Manager</h1>
        <p className="text-slate-400 text-sm mt-0.5">Create, assign, reassign and manage warehouse tasks — SIMULATION</p>
      </div>

      <KPIBar metrics={state.metrics} />

      <TaskTable
        tasks={state.tasks}
        robots={state.robots}
        onAddTask={(pickup, drop, priority: TaskPriority) =>
          updateState(prev => addTask(prev, pickup, drop, priority))
        }
        onReassign={(taskId) => updateState(prev => reassignTaskAction(prev, taskId))}
        onChangePriority={(taskId, priority: TaskPriority) =>
          updateState(prev => changeTaskPriority(prev, taskId, priority))
        }
        onToggleRobotFailure={(robotId) => updateState(prev => toggleRobotFailure(prev, robotId))}
      />

      <ActivityFeed events={state.events} maxItems={20} />
    </div>
  );
}
