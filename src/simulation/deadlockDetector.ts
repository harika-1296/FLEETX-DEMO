import type { AMR, Deadlock, Position } from './types';

let deadlockCounter = 1;

export function generateDeadlockId(): string {
  return `DLK-${String(deadlockCounter++).padStart(4, '0')}`;
}

// Detect circular wait: A waits for B, B waits for C, C waits for A
export function detectDeadlocks(
  robots: AMR[],
  existingDeadlocks: Deadlock[],
  tick: number,
): { newDeadlocks: Deadlock[]; resolvedDeadlockIds: string[] } {
  const newDeadlocks: Deadlock[] = [];
  const resolvedDeadlockIds: string[] = [];

  // Build waiting graph: robot -> robot it's waiting for
  const waitingMap = new Map<string, string | null>();

  for (const r of robots) {
    if (!r.online || r.status === 'COMPLETED' || r.status === 'CHARGING') {
      waitingMap.set(r.id, null);
      continue;
    }
    if (r.status === 'WAITING' || r.status === 'BLOCKED' || r.status === 'NEGOTIATING') {
      // Find who this robot is waiting for by checking intent
      const intentMatch = r.intent.match(/WAITING FOR (AMR-\d+)/);
      if (intentMatch) {
        waitingMap.set(r.id, intentMatch[1]);
      } else {
        waitingMap.set(r.id, null);
      }
    } else {
      waitingMap.set(r.id, null);
    }
  }

  // Detect cycles in the waiting graph
  const visited = new Set<string>();
  const inStack = new Set<string>();
  const path: string[] = [];

  function dfs(node: string): string[] | null {
    if (inStack.has(node)) {
      // Found cycle — extract it
      const cycleStart = path.indexOf(node);
      return path.slice(cycleStart);
    }
    if (visited.has(node)) return null;

    visited.add(node);
    inStack.add(node);
    path.push(node);

    const waitingFor = waitingMap.get(node);
    if (waitingFor) {
      const cycle = dfs(waitingFor);
      if (cycle) return cycle;
    }

    inStack.delete(node);
    path.pop();
    return null;
  }

  for (const r of robots) {
    if (!visited.has(r.id)) {
      const cycle = dfs(r.id);
      if (cycle && cycle.length >= 2) {
        // Check if this deadlock already exists
        const cycleKey = [...cycle].sort().join(',');
        const existing = existingDeadlocks.find(
          d => !d.resolved && [...d.robots].sort().join(',') === cycleKey
        );
        if (!existing) {
          const deadlock: Deadlock = {
            id: generateDeadlockId(),
            robots: [...cycle],
            location: 'Chokepoint',
            detectionTime: tick,
            resolution: 'Priority reassignment + alternate route',
            resolved: false,
            resolvedAt: null,
          };
          newDeadlocks.push(deadlock);
        }
      }
    }
  }

  // Check if any existing deadlocks are now resolved
  for (const d of existingDeadlocks) {
    if (d.resolved) continue;
    const stillDeadlocked = d.robots.every(rid => {
      const r = robots.find(r => r.id === rid);
      if (!r) return false;
      return r.status === 'WAITING' || r.status === 'BLOCKED' || r.status === 'NEGOTIATING';
    });
    if (!stillDeadlocked) {
      resolvedDeadlockIds.push(d.id);
    }
  }

  return { newDeadlocks, resolvedDeadlockIds };
}

// Resolve a deadlock by reassigning priorities and rerouting
export function resolveDeadlock(deadlock: Deadlock, robots: AMR[]): {
  rerouteRobotId: string;
  newPriority: 'HIGH' | 'CRITICAL';
} {
  // The robot with lowest priority gets rerouted
  const affectedRobots = deadlock.robots
    .map(id => robots.find(r => r.id === id))
    .filter((r): r is AMR => r !== undefined);

  if (affectedRobots.length === 0) {
    return { rerouteRobotId: deadlock.robots[0], newPriority: 'CRITICAL' };
  }

  const priorityOrder: Record<string, number> = { LOW: 1, NORMAL: 2, HIGH: 3, CRITICAL: 4 };
  affectedRobots.sort((a, b) => (priorityOrder[a.priority] || 2) - (priorityOrder[b.priority] || 2));

  // Give the lowest-priority robot a CRITICAL priority and reroute it
  return { rerouteRobotId: affectedRobots[0].id, newPriority: 'CRITICAL' };
}

// Create an artificial deadlock scenario
export function createDeadlockScenario(robots: AMR[]): void {
  // Position robots in a circular wait at chokepoints
  // This is called by the engine to set up the scenario
}
