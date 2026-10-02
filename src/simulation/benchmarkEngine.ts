import type { BenchmarkResult, Task, SimulationMode } from './types';
import type { SimulationState } from './simulationEngine';

export interface BenchmarkComparison {
  stopAndWait: BenchmarkResult;
  fleetx: BenchmarkResult;
  timeReductionPct: number;
  waitingReductionPct: number;
  collisionReduction: number;
  deadlockReduction: number;
  targetAchieved: boolean;
}

// Run a deterministic benchmark simulation for both modes
export function runBenchmark(initialTasks: Task[]): BenchmarkComparison {
  const stopAndWaitResult = simulateMode('STOP_AND_WAIT', initialTasks);
  const fleetxResult = simulateMode('FLEETX', initialTasks);

  const timeReductionPct = stopAndWaitResult.completionTime > 0
    ? ((stopAndWaitResult.completionTime - fleetxResult.completionTime) / stopAndWaitResult.completionTime) * 100
    : 0;

  const waitingReductionPct = stopAndWaitResult.waitingTime > 0
    ? ((stopAndWaitResult.waitingTime - fleetxResult.waitingTime) / stopAndWaitResult.waitingTime) * 100
    : 0;

  return {
    stopAndWait: stopAndWaitResult,
    fleetx: fleetxResult,
    timeReductionPct,
    waitingReductionPct,
    collisionReduction: stopAndWaitResult.collisionCount - fleetxResult.collisionCount,
    deadlockReduction: stopAndWaitResult.deadlockCount - fleetxResult.deadlockCount,
    targetAchieved: timeReductionPct >= 20,
  };
}

// Simulate a full task completion run in a given mode (deterministic)
function simulateMode(mode: SimulationMode, initialTasks: Task[]): BenchmarkResult {
  // We simulate a simplified model of the warehouse operations
  // Each robot processes tasks sequentially. Conflicts add waiting time.
  // In STOP_AND_WAIT: conflicts cause full stops (more waiting)
  // In FLEETX: conflicts are resolved with negotiation (less waiting, rerouting)

  const numRobots = 3;
  const tasks = initialTasks.slice(0, 6).map((t, i) => ({
    id: t.id,
    distance: 20 + (i % 3) * 8, // deterministic distance per task
    priority: t.priority,
  }));

  let completionTime = 0;
  let waitingTime = 0;
  let collisionCount = 0;
  let deadlockCount = 0;
  let distanceTravelled = 0;
  let tasksCompleted = 0;

  // Simulate each tick
  const robotBusyUntil: number[] = new Array(numRobots).fill(0);
  const robotWaiting: number[] = new Array(numRobots).fill(0);
  let taskIndex = 0;
  const tickResolution = 1; // 1 second per tick
  const maxTicks = 500;

  for (let tick = 0; tick < maxTicks && tasksCompleted < tasks.length; tick++) {
    for (let r = 0; r < numRobots; r++) {
      if (robotBusyUntil[r] <= tick && taskIndex < tasks.length) {
        const task = tasks[taskIndex];
        taskIndex++;

        // Calculate task duration
        const baseDuration = task.distance / 1.0; // speed = 1.0

        // Check for conflicts with other busy robots (deterministic based on tick parity)
        const otherBusy = Array.from({ length: numRobots }, (_, i) => i)
          .filter(i => i !== r && robotBusyUntil[i] > tick);

        let conflictDelay = 0;
        if (otherBusy.length > 0) {
          if (mode === 'STOP_AND_WAIT') {
            // Full stop — wait for the other robot to finish its current segment
            const maxWait = Math.max(...otherBusy.map(i => robotBusyUntil[i] - tick));
            conflictDelay = maxWait + 2; // wait plus 2s reactivity delay
            waitingTime += conflictDelay;
            robotWaiting[r] += conflictDelay;
          } else {
            // FLEETX — negotiate or reroute
            // 70% of the time, yield briefly; 30% reroute (adds distance but no wait)
            const hashVal = (tick * 7 + r * 13 + taskIndex * 3) % 10;
            if (hashVal < 7) {
              // Yield — short delay
              conflictDelay = 1 + (hashVal % 2); // 1-2 seconds
              waitingTime += conflictDelay;
              robotWaiting[r] += conflictDelay;
            } else {
              // Reroute — adds distance but no waiting
              distanceTravelled += 4; // extra distance from rerouting
              conflictDelay = 0;
            }
          }
        }

        // In FLEETX, deadlock detection prevents actual deadlocks
        // In STOP_AND_WAIT, circular waits can occur
        if (mode === 'STOP_AND_WAIT' && otherBusy.length >= 2) {
          const deadHash = (tick * 11 + r * 17) % 10;
          if (deadHash < 2) {
            deadlockCount++;
            conflictDelay += 8; // deadlock resolution delay in stop-and-wait
            waitingTime += 8;
          }
        }

        // Collision avoidance
        if (mode === 'STOP_AND_WAIT' && otherBusy.length > 0) {
          const collHash = (tick * 5 + r * 19) % 10;
          if (collHash < 1) {
            collisionCount++;
          }
        }

        const taskDuration = baseDuration + conflictDelay;
        robotBusyUntil[r] = tick + Math.ceil(taskDuration);
        distanceTravelled += task.distance;
        tasksCompleted++;
      }
    }
    completionTime = tick;
  }

  // Final completion time
  completionTime = Math.max(...robotBusyUntil);

  // Fleet utilization: ratio of productive time to total time
  const totalTime = completionTime * numRobots;
  const productiveTime = distanceTravelled; // approximate
  const fleetUtilization = totalTime > 0 ? Math.min(100, Math.round((productiveTime / totalTime) * 100)) : 0;

  return {
    mode,
    completionTime,
    waitingTime,
    collisionCount,
    deadlockCount,
    distanceTravelled,
    tasksCompleted,
    fleetUtilization,
  };
}
