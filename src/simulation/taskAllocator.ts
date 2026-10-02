import type { AMR, Task, TaskPriority } from './types';
import { manhattan } from './pathPlanner';

// Assign a task to the best available robot
export function assignTask(
  task: Task,
  robots: AMR[],
): string | null {
  const available = robots.filter(
    r => r.online && r.taskId === null && r.status !== 'CHARGING' && r.status !== 'OFFLINE'
  );

  if (available.length === 0) return null;

  // Calculate cost for each robot: distance to pickup + distance pickup to drop
  let best: { robot: AMR; cost: number } | null = null;

  for (const r of available) {
    const distToPickup = manhattan(r.position, task.pickupPos);
    const distPickupToDrop = manhattan(task.pickupPos, task.dropPos);
    const batteryPenalty = r.battery < 30 ? 50 : 0; // penalize low battery
    const cost = distToPickup + distPickupToDrop + batteryPenalty;

    if (!best || cost < best.cost) {
      best = { robot: r, cost };
    }
  }

  return best ? best.robot.id : null;
}

// Reassign a task when a robot becomes unavailable
export function reassignTask(
  task: Task,
  robots: AMR[],
): { newRobotId: string; reason: string } | null {
  const available = robots.filter(
    r => r.online && r.taskId === null && r.status !== 'CHARGING' && r.status !== 'OFFLINE'
  );

  if (available.length === 0) {
    // Try to assign to a robot that currently has a lower-priority task
    const busy = robots.filter(
      r => r.online && r.taskId !== null && r.status !== 'CHARGING' && r.status !== 'OFFLINE'
    );

    const priorityOrder: Record<string, number> = { LOW: 1, NORMAL: 2, HIGH: 3, CRITICAL: 4 };

    // Find a robot whose current task has lower priority than this one
    const candidates = busy.filter(r => {
      const currentTask = { priority: r.priority };
      return (priorityOrder[currentTask.priority] || 2) < (priorityOrder[task.priority] || 2);
    });

    if (candidates.length === 0) return null;

    // Pick the one with lowest cost
    let best: { id: string; cost: number; reason: string } | null = null;
    for (const r of candidates) {
      const cost = manhattan(r.position, task.pickupPos) + manhattan(task.pickupPos, task.dropPos);
      if (!best || cost < best.cost) {
        best = {
          id: r.id,
          cost,
          reason: `Lowest estimated completion cost (${cost} units) and preempts lower-priority task`,
        };
      }
    }
    return best ? { newRobotId: best.id, reason: best.reason } : null;
  }

  // Assign to available robot with lowest cost
  let best: { id: string; cost: number } | null = null;
  for (const r of available) {
    const cost = manhattan(r.position, task.pickupPos) + manhattan(task.pickupPos, task.dropPos);
    const batteryPenalty = r.battery < 30 ? 50 : 0;
    const totalCost = cost + batteryPenalty;
    if (!best || totalCost < best.cost) {
      best = { id: r.id, cost: totalCost };
    }
  }

  if (!best) return null;
  return {
    newRobotId: best.id,
    reason: `Lowest estimated completion cost (${best.cost} units)`,
  };
}

// Update task progress based on robot position
export function updateTaskProgress(
  task: Task,
  robot: AMR,
): { progress: number; status: Task['status'] } {
  if (!robot.online) {
    return { progress: task.progress, status: 'BLOCKED' };
  }

  const totalDist = manhattan(task.pickupPos, task.dropPos);
  if (totalDist === 0) return { progress: 100, status: 'COMPLETED' };

  const remainingDist = manhattan(robot.position, task.dropPos);
  const progress = Math.max(0, Math.min(100, Math.round((1 - remainingDist / (totalDist + 1)) * 100)));

  let status: Task['status'] = 'IN_PROGRESS';
  if (progress >= 100) {
    status = 'COMPLETED';
  } else if (robot.status === 'REROUTING') {
    status = 'IN_PROGRESS';
  } else if (robot.status === 'BLOCKED') {
    status = 'BLOCKED';
  }

  return { progress, status };
}
