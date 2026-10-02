import type {
  AMR, Task, Conflict, Deadlock, CommMessage, SimulationEvent,
  Warehouse, SimulationMode, Metrics, Position, RobotStatus,
} from './types';
import { warehouse as defaultWarehouse, isPassable } from './warehouse';
import { findPath, computeETA, nextWaypoint, atPosition, manhattan } from './pathPlanner';
import { detectRouteConflicts, resolveConflict } from './conflictEngine';
import { detectDeadlocks, resolveDeadlock } from './deadlockDetector';
import { updateTaskProgress, reassignTask, assignTask } from './taskAllocator';
import { createInitialRobots } from './robots';
import { createInitialTasks, generateTaskId } from './tasks';
import { runBenchmark, type BenchmarkComparison } from './benchmarkEngine';

export interface SimulationState {
  tick: number;
  running: boolean;
  speed: number;
  mode: SimulationMode;
  robots: AMR[];
  tasks: Task[];
  conflicts: Conflict[];
  deadlocks: Deadlock[];
  messages: CommMessage[];
  events: SimulationEvent[];
  warehouse: Warehouse;
  metrics: Metrics;
  collisionCount: number;
  benchmark: BenchmarkComparison | null;
  selectedRobotId: string | null;
  demoActive: boolean;
  demoPhase: number;
  blockedAisleCell: Position | null;
}

let messageIdCounter = 0;
let eventIdCounter = 0;
let conflictIdCounter = 0;

function makeEventId(): string {
  return `EVT-${String(eventIdCounter++).padStart(5, '0')}`;
}

function makeMessageId(): string {
  return `MSG-${String(messageIdCounter++).padStart(5, '0')}`;
}

function timeString(tick: number): string {
  const totalSeconds = tick;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function createInitialState(): SimulationState {
  const robots = createInitialRobots();
  const tasks = createInitialTasks();
  const warehouse = { ...defaultWarehouse, blockedAisles: [] as string[] };

  // Compute initial routes for active robots
  for (const robot of robots) {
    if (robot.taskId && robot.status !== 'CHARGING' && robot.status !== 'COMPLETED') {
      const task = tasks.find(t => t.id === robot.taskId);
      if (task) {
        const route = findPath(warehouse, robot.position, task.dropPos);
        robot.route = { waypoints: route, currentIndex: 0, blocked: false };
        robot.destination = task.dropPos;
        robot.destinationLabel = task.drop;
      }
    } else if (robot.status === 'CHARGING') {
      const route = findPath(warehouse, robot.position, warehouse.chargingStation.pos);
      robot.route = { waypoints: route, currentIndex: 0, blocked: false };
    }
  }

  const metrics: Metrics = {
    activeAMRs: robots.filter(r => r.online && r.status !== 'OFFLINE').length,
    activeTasks: tasks.filter(t => t.status !== 'COMPLETED' && t.status !== 'PENDING').length,
    conflicts: 0,
    deadlocks: 0,
    fleetUtilization: 82,
    taskCompletionTime: 0,
    collisionCount: 0,
    networkStatus: 'P2P ACTIVE',
    totalWaitingTime: 0,
    distanceTravelled: 0,
    tasksCompleted: 0,
  };

  return {
    tick: 0,
    running: false,
    speed: 1,
    mode: 'FLEETX',
    robots,
    tasks,
    conflicts: [],
    deadlocks: [],
    messages: [],
    events: [],
    warehouse,
    metrics,
    collisionCount: 0,
    benchmark: null,
    selectedRobotId: null,
    demoActive: false,
    demoPhase: 0,
    blockedAisleCell: null,
  };
}

export function tickSimulation(state: SimulationState): SimulationState {
  let {
    tick, robots, tasks, conflicts, deadlocks, messages, events,
    warehouse, mode, collisionCount, blockedAisleCell,
  } = state;

  tick++;

  const newMessages: CommMessage[] = [];
  const newEvents: SimulationEvent[] = [];

  // 1. Update robot positions
  for (const robot of robots) {
    if (!robot.online || robot.status === 'OFFLINE') continue;
    if (robot.status === 'COMPLETED' || robot.status === 'CHARGING') {
      // If charging and at station, increment battery
      if (robot.status === 'CHARGING' && atPosition(robot.position, warehouse.chargingStation.pos)) {
        robot.battery = Math.min(100, robot.battery + 2);
        if (robot.battery >= 100) {
          robot.status = 'COMPLETED';
          robot.intent = 'FULLY CHARGED — STANDBY';
          newEvents.push({
            id: makeEventId(),
            timestamp: tick,
            timeString: timeString(tick),
            category: 'SUCCESS',
            message: `${robot.id} fully charged — standby`,
          });
        }
      }
      continue;
    }

    if (robot.status === 'WAITING' || robot.status === 'BLOCKED' || robot.status === 'NEGOTIATING') {
      robot.waitingTime += 1;
      // Battery drains slowly while waiting
      robot.battery = Math.max(0, robot.battery - 0.05);
      continue;
    }

    if (robot.status === 'REROUTING') {
      // Recalculate route
      const task = tasks.find(t => t.id === robot.taskId);
      if (task) {
        const blockedCells = new Set<string>();
        if (blockedAisleCell) {
          blockedCells.add(`${blockedAisleCell.x},${blockedAisleCell.y}`);
        }
        const newRoute = findPath(warehouse, robot.position, task.dropPos, blockedCells);
        robot.route = { waypoints: newRoute, currentIndex: 0, blocked: false };
        robot.status = 'MOVING';
        robot.intent = 'PROCEEDING VIA ALTERNATE ROUTE';
        robot.decision = 'REROUTE COMPLETE';
        robot.confidence = 88;
        robot.decisionReason = ['Original route blocked', 'Alternate path calculated', 'No conflicts on new route'];

        newEvents.push({
          id: makeEventId(),
          timestamp: tick,
          timeString: timeString(tick),
          category: 'REROUTE',
          message: `${robot.id} rerouted via alternate path`,
        });
      }
    }

    if (robot.status === 'MOVING') {
      // Move along route
      const next = nextWaypoint(robot.route.waypoints, robot.route.currentIndex);
      if (next) {
        // Check if next cell is blocked
        if (blockedAisleCell && next.x === blockedAisleCell.x && next.y === blockedAisleCell.y) {
          robot.status = 'REROUTING';
          robot.intent = 'ROUTE BLOCKED — REROUTING';
          newEvents.push({
            id: makeEventId(),
            timestamp: tick,
            timeString: timeString(tick),
            category: 'REROUTE',
            message: `${robot.id} detected blocked aisle at (${next.x},${next.y})`,
          });
          continue;
        }

        // Check if another robot is at the next cell
        const occupiedBy = robots.find(r =>
          r.id !== robot.id && r.online &&
          r.position.x === next.x && r.position.y === next.y
        );

        if (occupiedBy) {
          // Potential collision — check if we need to negotiate
          if (mode === 'STOP_AND_WAIT') {
            // Just stop and wait
            robot.status = 'WAITING';
            robot.intent = `WAITING FOR ${occupiedBy.id}`;
            robot.decision = 'WAIT';
            robot.confidence = 80;
            robot.decisionReason = [`Path occupied by ${occupiedBy.id}`, 'Stop-and-wait protocol'];
            newMessages.push({
              id: makeMessageId(),
              timestamp: tick,
              from: robot.id,
              to: occupiedBy.id,
              type: 'REQUEST',
              content: `WAITING — path occupied`,
            });
          } else {
            // FLEETX: negotiate
            robot.status = 'NEGOTIATING';
            robot.intent = `NEGOTIATING WITH ${occupiedBy.id}`;
            robot.decision = 'YIELD';
            robot.confidence = 85;
            robot.decisionReason = [`Path occupied by ${occupiedBy.id}`, 'Yielding to avoid collision'];

            newMessages.push({
              id: makeMessageId(),
              timestamp: tick,
              from: robot.id,
              to: occupiedBy.id,
              type: 'INTENT',
              content: `INTENT: MOVE TO (${next.x},${next.y}) — REQUESTING PRIORITY`,
            });
          }
          continue;
        }

        // Move to next cell
        robot.position = { ...next };
        robot.route.currentIndex++;
        robot.distanceTravelled += 1;
        robot.battery = Math.max(0, robot.battery - 0.15);
        robot.intent = 'PROCEEDING TO DESTINATION';
        robot.decision = 'PROCEED';
        robot.confidence = 94;
        robot.decisionReason = ['No collision predicted', 'Route reservation available', 'Path is clear'];

        // Check if arrived at destination
        if (atPosition(robot.position, robot.destination)) {
          const task = tasks.find(t => t.id === robot.taskId);
          if (task) {
            task.status = 'COMPLETED';
            task.completedAt = tick;
            task.progress = 100;
            tasks = tasks.map(t => t.id === task.id ? task : t);
          }
          robot.status = 'COMPLETED';
          robot.intent = 'TASK COMPLETED';
          robot.decision = 'COMPLETE';
          robot.task = null;
          robot.taskId = null;

          newEvents.push({
            id: makeEventId(),
            timestamp: tick,
            timeString: timeString(tick),
            category: 'SUCCESS',
            message: `${robot.id} completed task ${task?.id ?? ''} at ${robot.destinationLabel}`,
          });

          // Assign next pending task
          const pendingTask = tasks.find(t => t.status === 'PENDING' || (t.status === 'ASSIGNED' && t.assignedAMR === null));
          if (pendingTask) {
            const assignedId = assignTask(pendingTask, robots);
            if (assignedId === robot.id) {
              pendingTask.assignedAMR = robot.id;
              pendingTask.status = 'IN_PROGRESS';
              robot.taskId = pendingTask.id;
              robot.task = pendingTask.id;
              robot.status = 'MOVING';
              robot.priority = pendingTask.priority;
              const route = findPath(warehouse, robot.position, pendingTask.dropPos);
              robot.route = { waypoints: route, currentIndex: 0, blocked: false };
              robot.destination = pendingTask.dropPos;
              robot.destinationLabel = pendingTask.drop;
              tasks = tasks.map(t => t.id === pendingTask.id ? pendingTask : t);

              newEvents.push({
                id: makeEventId(),
                timestamp: tick,
                timeString: timeString(tick),
                category: 'TASK',
                message: `${pendingTask.id} assigned to ${robot.id}`,
              });
            }
          }
        }
      }
    }
  }

  // 2. Detect conflicts
  const { newConflicts } = detectRouteConflicts(robots, mode, conflicts, tick);
  if (newConflicts.length > 0) {
    for (const cf of newConflicts) {
      conflicts = [...conflicts, cf];
      const [r1, r2] = cf.robots;
      newEvents.push({
        id: makeEventId(),
        timestamp: tick,
        timeString: timeString(tick),
        category: 'CONFLICT',
        message: `Conflict detected: ${r1} ↔ ${r2} at ${cf.location} — ${cf.resolution}`,
      });
      newMessages.push({
        id: makeMessageId(),
        timestamp: tick,
        from: r1,
        to: r2,
        type: 'INTENT',
        content: `INTENT: ENTERING ${cf.location.toUpperCase()} — ETA: ${cf.details?.etaA.toFixed(1)}s`,
      });
      newMessages.push({
        id: makeMessageId(),
        timestamp: tick,
        from: r2,
        to: r1,
        type: 'ACK',
        content: `ACK — EVALUATING PRIORITY`,
      });
    }
  }

  // 3. Resolve active conflicts
  conflicts = conflicts.map(cf => {
    if (cf.status === 'RESOLVED') return cf;

    // Check if robots are still in conflict
    const robotsInConflict = cf.robots.every(rid => {
      const r = robots.find(r => r.id === rid);
      return r && r.online && r.status !== 'COMPLETED' && r.status !== 'CHARGING' && r.status !== 'OFFLINE';
    });

    if (!robotsInConflict) {
      return { ...cf, status: 'RESOLVED' as const, resolvedAt: tick };
    }

    // Resolve conflict
    const { yieldingRobot, proceedingRobot } = resolveConflict(cf, robots, mode);
    const yielding = robots.find(r => r.id === yieldingRobot);
    const proceeding = robots.find(r => r.id === proceedingRobot);

    if (yielding && proceeding) {
      // If robots are far enough apart, conflict is resolved
      const dist = manhattan(yielding.position, proceeding.position);
      if (dist > 5) {
        newEvents.push({
          id: makeEventId(),
          timestamp: tick,
          timeString: timeString(tick),
          category: 'SUCCESS',
          message: `Conflict resolved: ${cf.id} — ${cf.resolution}`,
        });
        return { ...cf, status: 'RESOLVED' as const, resolvedAt: tick };
      }

      // Apply resolution
      if (mode === 'STOP_AND_WAIT') {
        // Yielding robot stops completely
        if (yielding.status !== 'WAITING') {
          yielding.status = 'WAITING';
          yielding.intent = `WAITING FOR ${proceedingRobot}`;
          yielding.decision = 'WAIT';
          yielding.confidence = 75;
          yielding.decisionReason = [`Yielding to ${proceedingRobot}`, 'Stop-and-wait protocol', `Distance: ${dist} cells`];
        }
      } else {
        // FLEETX: yield or reroute
        if (dist <= 2 && yielding.status !== 'NEGOTIATING') {
          yielding.status = 'NEGOTIATING';
          yielding.intent = `YIELDING TO ${proceedingRobot}`;
          yielding.decision = 'YIELD';
          yielding.confidence = 87;
          yielding.decisionReason = [`Yielding to ${proceedingRobot}`, `Priority: ${proceeding.priority} > ${yielding.priority}`, 'Negotiation complete'];

          newMessages.push({
            id: makeMessageId(),
            timestamp: tick,
            from: yieldingRobot,
            to: proceedingRobot,
            type: 'YIELD',
            content: `YIELDING — ${proceedingRobot} HAS PRIORITY`,
          });

          newEvents.push({
            id: makeEventId(),
            timestamp: tick,
            timeString: timeString(tick),
            category: 'CONFLICT',
            message: `${yieldingRobot} yielded to ${proceedingRobot}`,
          });

          // After a tick of negotiation, let yielding robot proceed or reroute
          if (cf.status === 'NEGOTIATING') {
            // Conflict is being resolved — mark as resolved after yield
            newEvents.push({
              id: makeEventId(),
              timestamp: tick,
              timeString: timeString(tick),
              category: 'SUCCESS',
              message: `Conflict resolved: ${cf.id} — ${cf.resolution}`,
            });
            yielding.status = 'WAITING';
            return { ...cf, status: 'RESOLVED' as const, resolvedAt: tick };
          }
        } else if (dist <= 2) {
          // Already negotiating — proceed
          return { ...cf, status: 'NEGOTIATING' as const };
        }
      }

      // Proceeding robot continues
      if (proceeding.status === 'WAITING' || proceeding.status === 'NEGOTIATING') {
        proceeding.status = 'MOVING';
        proceeding.intent = 'PROCEEDING — PRIORITY GRANTED';
        proceeding.decision = 'PROCEED';
        proceeding.confidence = 96;
        proceeding.decisionReason = ['Priority granted by negotiation', 'No conflicts ahead', `Task priority: ${proceeding.priority}`];

        newMessages.push({
          id: makeMessageId(),
          timestamp: tick,
          from: proceedingRobot,
          to: yieldingRobot,
          type: 'PROCEED',
          content: `PROCEEDING — PRIORITY CONFIRMED`,
        });
      }
    }

    return cf;
  });

  // Clear waiting states for robots that no longer have conflicts
  for (const robot of robots) {
    if (robot.status === 'WAITING' || robot.status === 'NEGOTIATING') {
      const hasActiveConflict = conflicts.some(cf =>
        cf.status !== 'RESOLVED' && cf.robots.includes(robot.id)
      );
      if (!hasActiveConflict) {
        robot.status = 'MOVING';
        robot.intent = 'PROCEEDING TO DESTINATION';
        robot.decision = 'PROCEED';
        robot.confidence = 92;
        robot.decisionReason = ['Conflict resolved', 'Path is now clear', 'Resuming route'];
      }
    }
  }

  // 4. Detect deadlocks
  const { newDeadlocks, resolvedDeadlockIds } = detectDeadlocks(robots, deadlocks, tick);
  if (newDeadlocks.length > 0) {
    for (const dl of newDeadlocks) {
      deadlocks = [...deadlocks, dl];
      newEvents.push({
        id: makeEventId(),
        timestamp: tick,
        timeString: timeString(tick),
        category: 'DEADLOCK',
        message: `Deadlock detected: ${dl.robots.join(' ↔ ')} — ${dl.resolution}`,
      });
      newMessages.push({
        id: makeMessageId(),
        timestamp: tick,
        from: 'FLEET',
        to: 'ALL',
        type: 'BROADCAST',
        content: `DEADLOCK DETECTED — INITIATING RESOLUTION`,
      });
    }
  }

  // Resolve deadlocks
  deadlocks = deadlocks.map(dl => {
    if (dl.resolved) return dl;
    if (resolvedDeadlockIds.includes(dl.id)) {
      return { ...dl, resolved: true, resolvedAt: tick };
    }

    // Resolve: reroute the lowest-priority robot
    const { rerouteRobotId, newPriority } = resolveDeadlock(dl, robots);
    const rerouteRobot = robots.find(r => r.id === rerouteRobotId);
    if (rerouteRobot) {
      rerouteRobot.priority = newPriority;
      rerouteRobot.status = 'REROUTING';
      rerouteRobot.intent = 'DEADLOCK RESOLUTION — REROUTING';
      rerouteRobot.confidence = 90;
      rerouteRobot.decisionReason = ['Deadlock detected', 'Priority reassigned', 'Calculating alternate route'];

      newEvents.push({
        id: makeEventId(),
        timestamp: tick,
        timeString: timeString(tick),
        category: 'DEADLOCK',
        message: `Deadlock ${dl.id} resolved — ${rerouteRobotId} rerouted with CRITICAL priority`,
      });
    }
    return { ...dl, resolved: true, resolvedAt: tick };
  });

  // 5. Update task progress
  for (const task of tasks) {
    if (task.status === 'COMPLETED' || task.status === 'PENDING') continue;
    const robot = robots.find(r => r.id === task.assignedAMR);
    if (robot) {
      const { progress, status } = updateTaskProgress(task, robot);
      task.progress = progress;
      task.status = status;
      task.eta = Math.max(0, computeETA(robot.route.waypoints, robot.route.currentIndex, robot.speed));

      // Check if robot is offline — reassign task
      if (!robot.online && task.status !== 'COMPLETED') {
        const reassignment = reassignTask(task, robots.filter(r => r.id !== robot.id));
        if (reassignment) {
          task.assignedAMR = reassignment.newRobotId;
          task.status = 'REASSIGNED';
          const newRobot = robots.find(r => r.id === reassignment.newRobotId);
          if (newRobot) {
            newRobot.taskId = task.id;
            newRobot.task = task.id;
            newRobot.status = 'MOVING';
            newRobot.priority = task.priority;
            const route = findPath(warehouse, newRobot.position, task.dropPos);
            newRobot.route = { waypoints: route, currentIndex: 0, blocked: false };
            newRobot.destination = task.dropPos;
            newRobot.destinationLabel = task.drop;

            newEvents.push({
              id: makeEventId(),
              timestamp: tick,
              timeString: timeString(tick),
              category: 'TASK',
              message: `${task.id} reassigned from ${robot.id} to ${reassignment.newRobotId} — ${reassignment.reason}`,
            });
            newMessages.push({
              id: makeMessageId(),
              timestamp: tick,
              from: 'FLEET',
              to: reassignment.newRobotId,
              type: 'BROADCAST',
              content: `TASK REASSIGNED: ${task.id} → ${reassignment.newRobotId}`,
            });
          }
        } else {
          task.status = 'BLOCKED';
        }
      }
    }
  }

  // 6. Update metrics
  const activeRobots = robots.filter(r => r.online && r.status !== 'OFFLINE');
  const movingRobots = robots.filter(r => r.status === 'MOVING');
  const totalDistance = robots.reduce((sum, r) => sum + r.distanceTravelled, 0);
  const totalWaiting = robots.reduce((sum, r) => sum + r.waitingTime, 0);
  const completedTasks = tasks.filter(t => t.status === 'COMPLETED').length;

  const productiveTime = movingRobots.length;
  const totalTime = activeRobots.length || 1;
  const utilization = Math.min(100, Math.round((productiveTime / totalTime) * 100 + 40));

  const metrics: Metrics = {
    activeAMRs: activeRobots.length,
    activeTasks: tasks.filter(t => t.status !== 'COMPLETED' && t.status !== 'PENDING').length,
    conflicts: conflicts.filter(c => c.status !== 'RESOLVED').length,
    deadlocks: deadlocks.filter(d => !d.resolved).length,
    fleetUtilization: utilization,
    taskCompletionTime: tick,
    collisionCount,
    networkStatus: 'P2P ACTIVE',
    totalWaitingTime: totalWaiting,
    distanceTravelled: totalDistance,
    tasksCompleted: completedTasks,
  };

  // Combine messages and events (keep last 50)
  const allMessages = [...messages, ...newMessages].slice(-80);
  const allEvents = [...events, ...newEvents].slice(-80);

  return {
    ...state,
    tick,
    robots: [...robots],
    tasks: [...tasks],
    conflicts: [...conflicts],
    deadlocks: [...deadlocks],
    messages: allMessages,
    events: allEvents,
    metrics,
    collisionCount,
  };
}

// Scenario functions
export function applyScenario(state: SimulationState, scenario: string): SimulationState {
  let newState = { ...state };

  switch (scenario) {
    case 'normal':
      newState = createInitialState();
      newState.running = true;
      newState.events = [{
        id: makeEventId(),
        timestamp: 0,
        timeString: '00:00',
        category: 'INFO',
        message: 'Scenario: Normal Operations — 3 AMRs on standard tasks',
      }];
      break;

    case 'crossing': {
      const robots = createInitialRobots();
      // Position two robots to cross at an intersection
      robots[0].position = { x: 5, y: 3 };
      robots[0].destination = { x: 12, y: 3 };
      robots[0].route = { waypoints: findPath(newState.warehouse, { x: 5, y: 3 }, { x: 12, y: 3 }), currentIndex: 0, blocked: false };
      robots[0].status = 'MOVING';
      robots[0].taskId = 'TASK-101';
      robots[0].priority = 'HIGH';

      robots[1].position = { x: 7, y: 0 };
      robots[1].destination = { x: 7, y: 12 };
      robots[1].route = { waypoints: findPath(newState.warehouse, { x: 7, y: 0 }, { x: 7, y: 12 }), currentIndex: 0, blocked: false };
      robots[1].status = 'MOVING';
      robots[1].taskId = 'TASK-102';
      robots[1].priority = 'NORMAL';

      robots[2].position = { x: 1, y: 14 };
      robots[2].destination = { x: 22, y: 14 };
      robots[2].route = { waypoints: findPath(newState.warehouse, { x: 1, y: 14 }, { x: 22, y: 14 }), currentIndex: 0, blocked: false };
      robots[2].status = 'MOVING';
      robots[2].taskId = 'TASK-103';

      newState.robots = robots;
      newState.running = true;
      newState.tick = 0;
      newState.conflicts = [];
      newState.deadlocks = [];
      newState.events = [{
        id: makeEventId(),
        timestamp: 0,
        timeString: '00:00',
        category: 'INFO',
        message: 'Scenario: Crossing Conflict — AMR-01 and AMR-02 approaching Intersection A',
      }];
      break;
    }

    case 'blocked': {
      // Block an aisle
      const blockedCell = { x: 11, y: 7 };
      newState.blockedAisleCell = blockedCell;
      newState.warehouse = {
        ...newState.warehouse,
        grid: newState.warehouse.grid.map((row, y) =>
          row.map((cell, x) => {
            if (x === blockedCell.x && y === blockedCell.y) {
              return { ...cell, type: 'blocked' as const };
            }
            return cell;
          })
        ),
        blockedAisles: [...newState.warehouse.blockedAisles, 'C7'],
      };

      // Reroute affected robots
      for (const robot of newState.robots) {
        if (robot.online && robot.status === 'MOVING') {
          const routePassesBlocked = robot.route.waypoints.some(
            wp => wp.x === blockedCell.x && wp.y === blockedCell.y
          );
          if (routePassesBlocked) {
            robot.status = 'REROUTING';
            robot.intent = 'ROUTE BLOCKED — REROUTING';
          }
        }
      }

      newState.events = [{
        id: makeEventId(),
        timestamp: newState.tick,
        timeString: timeString(newState.tick),
        category: 'REROUTE',
        message: 'Scenario: Aisle C7 BLOCKED — affected AMRs rerouting',
      }];
      newState.running = true;
      break;
    }

    case 'deadlock': {
      // Position robots in a circular wait pattern at chokepoints
      const robots = createInitialRobots();

      // AMR-01 at chokepoint 1 going right, needs to pass where AMR-02 is
      robots[0].position = { x: 10, y: 3 };
      robots[0].destination = { x: 15, y: 3 };
      robots[0].route = { waypoints: findPath(newState.warehouse, { x: 10, y: 3 }, { x: 15, y: 3 }), currentIndex: 0, blocked: false };
      robots[0].status = 'WAITING';
      robots[0].intent = 'WAITING FOR AMR-02';
      robots[0].priority = 'HIGH';
      robots[0].taskId = 'TASK-101';

      // AMR-02 going through intersection, waiting for AMR-03
      robots[1].position = { x: 11, y: 4 };
      robots[1].destination = { x: 11, y: 11 };
      robots[1].route = { waypoints: findPath(newState.warehouse, { x: 11, y: 4 }, { x: 11, y: 11 }), currentIndex: 0, blocked: false };
      robots[1].status = 'WAITING';
      robots[1].intent = 'WAITING FOR AMR-03';
      robots[1].priority = 'NORMAL';
      robots[1].taskId = 'TASK-102';

      // AMR-03 going through where AMR-01 is
      robots[2].position = { x: 12, y: 3 };
      robots[2].destination = { x: 7, y: 3 };
      robots[2].route = { waypoints: findPath(newState.warehouse, { x: 12, y: 3 }, { x: 7, y: 3 }), currentIndex: 0, blocked: false };
      robots[2].status = 'WAITING';
      robots[2].intent = 'WAITING FOR AMR-01';
      robots[2].priority = 'HIGH';
      robots[2].taskId = 'TASK-103';

      newState.robots = robots;
      newState.running = true;
      newState.tick = 0;
      newState.conflicts = [];
      newState.deadlocks = [];
      newState.events = [{
        id: makeEventId(),
        timestamp: 0,
        timeString: '00:00',
        category: 'INFO',
        message: 'Scenario: Deadlock — AMR-01 ↔ AMR-02 ↔ AMR-03 circular wait at Chokepoint',
      }];
      break;
    }

    case 'failure': {
      // Take AMR-02 offline and reassign its tasks
      const robot = newState.robots.find(r => r.id === 'AMR-02');
      if (robot) {
        robot.online = false;
        robot.status = 'OFFLINE';
        robot.intent = 'AMR OFFLINE — SIMULATED FAILURE';
        robot.taskId = null;
        robot.task = null;
      }

      newState.events = [{
        id: makeEventId(),
        timestamp: newState.tick,
        timeString: timeString(newState.tick),
        category: 'WARNING',
        message: 'Scenario: AMR-02 OFFLINE — task reassignment initiated',
      }];
      newState.running = true;
      break;
    }

    case 'congestion': {
      // Add more robots and tasks for heavy congestion
      const robots = createInitialRobots();
      // Position all 5 robots with overlapping routes
      const positions: Position[] = [
        { x: 3, y: 3 }, { x: 3, y: 7 }, { x: 3, y: 11 },
        { x: 20, y: 3 }, { x: 20, y: 11 },
      ];
      const dests: Position[] = [
        { x: 22, y: 14 }, { x: 22, y: 0 }, { x: 1, y: 7 },
        { x: 1, y: 14 }, { x: 1, y: 0 },
      ];

      for (let i = 0; i < 5; i++) {
        robots[i].position = positions[i];
        robots[i].destination = dests[i];
        robots[i].route = { waypoints: findPath(newState.warehouse, positions[i], dests[i]), currentIndex: 0, blocked: false };
        robots[i].status = 'MOVING';
        robots[i].online = true;
        robots[i].taskId = `TASK-${101 + i}`;
      }

      newState.robots = robots;
      newState.running = true;
      newState.tick = 0;
      newState.events = [{
        id: makeEventId(),
        timestamp: 0,
        timeString: '00:00',
        category: 'INFO',
        message: 'Scenario: Heavy Congestion — 5 AMRs with crossing routes',
      }];
      break;
    }

    case 'benchmark': {
      const comparison = runBenchmark(newState.tasks);
      newState.benchmark = comparison;
      newState.events = [{
        id: makeEventId(),
        timestamp: newState.tick,
        timeString: timeString(newState.tick),
        category: 'INFO',
        message: 'Benchmark executed — Stop-and-Wait vs FLEETX comparison complete',
      }];
      break;
    }
  }

  return newState;
}

export function blockAisle(state: SimulationState): SimulationState {
  // Pick a cell in the middle of a frequently-used aisle
  const blockedCell = { x: 11, y: 7 };
  const newWarehouse = {
    ...state.warehouse,
    grid: state.warehouse.grid.map((row, y) =>
      row.map((cell, x) => {
        if (x === blockedCell.x && y === blockedCell.y) {
          return { ...cell, type: 'blocked' as const };
        }
        return cell;
      })
    ),
    blockedAisles: [...state.warehouse.blockedAisles, 'C7'],
  };

  const robots = state.robots.map(r => {
    if (r.online && r.status === 'MOVING') {
      const routePassesBlocked = r.route.waypoints.some(
        wp => wp.x === blockedCell.x && wp.y === blockedCell.y
      );
      if (routePassesBlocked) {
        return { ...r, status: 'REROUTING' as const, intent: 'ROUTE BLOCKED — REROUTING' };
      }
    }
    return r;
  });

  return {
    ...state,
    warehouse: newWarehouse,
    blockedAisleCell: blockedCell,
    robots,
    events: [...state.events, {
      id: makeEventId(),
      timestamp: state.tick,
      timeString: timeString(state.tick),
      category: 'REROUTE',
      message: 'AISLE C7 BLOCKED — affected AMRs initiating reroute',
    }],
  };
}

export function toggleRobotFailure(state: SimulationState, robotId: string): SimulationState {
  const robots = state.robots.map(r => {
    if (r.id === robotId) {
      if (r.online) {
        return { ...r, online: false, status: 'OFFLINE' as const, intent: 'AMR OFFLINE — SIMULATED FAILURE', taskId: null, task: null };
      } else {
        return { ...r, online: true, status: 'COMPLETED' as const, intent: 'AMR BACK ONLINE — STANDBY' };
      }
    }
    return r;
  });

  const failedRobot = robots.find(r => r.id === robotId);
  const events = [...state.events];
  if (failedRobot) {
    events.push({
      id: makeEventId(),
      timestamp: state.tick,
      timeString: timeString(state.tick),
      category: failedRobot.online ? 'SUCCESS' : 'WARNING',
      message: failedRobot.online
        ? `${robotId} back online — standby`
        : `${robotId} OFFLINE — task reassignment initiated`,
    });
  }

  return { ...state, robots, events };
}

export function runBenchmarkCalculation(state: SimulationState): SimulationState {
  const comparison = runBenchmark(state.tasks);
  return {
    ...state,
    benchmark: comparison,
    events: [...state.events, {
      id: makeEventId(),
      timestamp: state.tick,
      timeString: timeString(state.tick),
      category: 'INFO',
      message: `Benchmark: ${comparison.targetAchieved ? 'TARGET ACHIEVED' : 'TARGET NOT YET'} — ${comparison.timeReductionPct.toFixed(1)}% time reduction`,
    }],
  };
}

export function triggerDeadlock(state: SimulationState): SimulationState {
  return applyScenario({ ...state }, 'deadlock');
}

export function addTask(
  state: SimulationState,
  pickup: string,
  drop: string,
  priority: Task['priority'],
): SimulationState {
  const taskId = generateTaskId();
  const pickupZone = state.warehouse.pickupZones.find(z => z.label === pickup || z.id === pickup);
  const dropZone = state.warehouse.dropZones.find(z => z.label === drop || z.id === drop);

  if (!pickupZone || !dropZone) return state;

  const newTask: Task = {
    id: taskId,
    pickup: pickupZone.label,
    pickupPos: pickupZone.pos,
    drop: dropZone.label,
    dropPos: dropZone.pos,
    assignedAMR: null,
    priority,
    status: 'PENDING',
    eta: 0,
    createdAt: state.tick,
    completedAt: null,
    progress: 0,
  };

  // Try to assign immediately
  const assignedId = assignTask(newTask, state.robots);
  if (assignedId) {
    newTask.assignedAMR = assignedId;
    newTask.status = 'ASSIGNED';
    const robot = state.robots.find(r => r.id === assignedId);
    if (robot) {
      robot.taskId = taskId;
      robot.task = taskId;
      robot.status = 'MOVING';
      robot.priority = priority;
      const route = findPath(state.warehouse, robot.position, newTask.dropPos);
      robot.route = { waypoints: route, currentIndex: 0, blocked: false };
      robot.destination = newTask.dropPos;
      robot.destinationLabel = newTask.drop;
    }
  }

  return {
    ...state,
    tasks: [...state.tasks, newTask],
    events: [...state.events, {
      id: makeEventId(),
      timestamp: state.tick,
      timeString: timeString(state.tick),
      category: 'TASK',
      message: `${taskId} created — Pickup: ${pickup}, Drop: ${drop}, Priority: ${priority}${assignedId ? ` → Assigned to ${assignedId}` : ' (PENDING)'}`,
    }],
  };
}

export function reassignTaskAction(state: SimulationState, taskId: string): SimulationState {
  const task = state.tasks.find(t => t.id === taskId);
  if (!task) return state;

  const reassignment = reassignTask(task, state.robots);
  if (!reassignment) return state;

  const oldRobot = task.assignedAMR;
  task.assignedAMR = reassignment.newRobotId;
  task.status = 'REASSIGNED';

  const newRobot = state.robots.find(r => r.id === reassignment.newRobotId);
  if (newRobot) {
    newRobot.taskId = task.id;
    newRobot.task = task.id;
    newRobot.status = 'MOVING';
    newRobot.priority = task.priority;
    const route = findPath(state.warehouse, newRobot.position, task.dropPos);
    newRobot.route = { waypoints: route, currentIndex: 0, blocked: false };
    newRobot.destination = task.dropPos;
    newRobot.destinationLabel = task.drop;
  }

  return {
    ...state,
    tasks: state.tasks.map(t => t.id === taskId ? task : t),
    events: [...state.events, {
      id: makeEventId(),
      timestamp: state.tick,
      timeString: timeString(state.tick),
      category: 'TASK',
      message: `${taskId} reassigned from ${oldRobot} to ${reassignment.newRobotId} — ${reassignment.reason}`,
    }],
  };
}

export function changeTaskPriority(state: SimulationState, taskId: string, priority: Task['priority']): SimulationState {
  const task = state.tasks.find(t => t.id === taskId);
  if (!task) return state;

  task.priority = priority;
  const robot = state.robots.find(r => r.id === task.assignedAMR);
  if (robot) {
    robot.priority = priority;
  }

  return {
    ...state,
    tasks: state.tasks.map(t => t.id === taskId ? task : t),
  };
}

export function setSimulationMode(state: SimulationState, mode: SimulationMode): SimulationState {
  return { ...state, mode };
}

export function setSpeed(state: SimulationState, speed: number): SimulationState {
  return { ...state, speed };
}

export function toggleRunning(state: SimulationState): SimulationState {
  return { ...state, running: !state.running };
}

export function resetSimulation(): SimulationState {
  messageIdCounter = 0;
  eventIdCounter = 0;
  conflictIdCounter = 0;
  return createInitialState();
}
