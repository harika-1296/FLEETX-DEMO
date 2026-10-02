import type { AMR, Conflict, Position, ConflictRisk, ConflictType, SimulationMode } from './types';
import { manhattan } from './pathPlanner';

let conflictCounter = 1;

export function generateConflictId(): string {
  return `CFL-${String(conflictCounter++).padStart(4, '0')}`;
}

// Priority weight for comparison
const PRIORITY_WEIGHT: Record<string, number> = {
  LOW: 1,
  NORMAL: 2,
  HIGH: 3,
  CRITICAL: 4,
};

// Check if two robots have routes that will cross at the same cell
export function detectRouteConflicts(
  robots: AMR[],
  mode: SimulationMode,
  existingConflicts: Conflict[],
  tick: number,
): { conflicts: Conflict[]; newConflicts: Conflict[] } {
  const newConflicts: Conflict[] = [];
  const activeRobotIds = new Set(existingConflicts.filter(c => c.status !== 'RESOLVED').flatMap(c => c.robots));

  for (let i = 0; i < robots.length; i++) {
    for (let j = i + 1; j < robots.length; j++) {
      const a = robots[i];
      const b = robots[j];
      if (!a.online || !b.online) continue;
      if (a.status === 'COMPLETED' || b.status === 'COMPLETED') continue;
      if (a.status === 'CHARGING' || b.status === 'CHARGING') continue;

      // Check if they'll be near each other soon
      const dist = manhattan(a.position, b.position);

      // Check if routes share a common cell in the near future
      const aRoute = a.route.waypoints.slice(a.route.currentIndex, a.route.currentIndex + 6);
      const bRoute = b.route.waypoints.slice(b.route.currentIndex, b.route.currentIndex + 6);

      let conflictCell: Position | null = null;
      let conflictType: ConflictType = 'ROUTE_OVERLAP';
      let conflictLocation = '';

      // Check for shared cells in upcoming route
      for (let k = 0; k < aRoute.length; k++) {
        for (let l = 0; l < bRoute.length; l++) {
          if (aRoute[k].x === bRoute[l].x && aRoute[k].y === bRoute[l].y) {
            // Same cell in future path — check if time steps overlap
            if (Math.abs(k - l) <= 2) {
              conflictCell = aRoute[k];
              conflictType = k === l ? 'INTERSECTION' : 'ROUTE_OVERLAP';
              // Find intersection/chokepoint label
              conflictLocation = getCellLabel(conflictCell);
              break;
            }
          }
        }
        if (conflictCell) break;
      }

      // Check for head-on collision (adjacent, moving toward each other)
      if (!conflictCell && dist === 1) {
        const aNext = a.route.waypoints[a.route.currentIndex + 1];
        const bNext = b.route.waypoints[b.route.currentIndex + 1];
        if (aNext && bNext && aNext.x === b.position.x && aNext.y === b.position.y && bNext.x === a.position.x && bNext.y === a.position.y) {
          conflictCell = a.position;
          conflictType = 'HEADON';
          conflictLocation = `Corridor ${posStr(a.position)}`;
        }
      }

      // Check intersection approach
      if (!conflictCell && dist <= 4) {
        // Check if both approaching same intersection
        for (const cell of [a.position, b.position]) {
          const aNextCells = aRoute.slice(0, 4);
          const bNextCells = bRoute.slice(0, 4);
          const aNearInt = aNextCells.some(c => isIntersection(c));
          const bNearInt = bNextCells.some(c => isIntersection(c));
          if (aNearInt && bNearInt) {
            // Find the common intersection they're both heading to
            for (const ac of aNextCells) {
              for (const bc of bNextCells) {
                if (ac.x === bc.x && ac.y === bc.y && isIntersection(ac)) {
                  conflictCell = ac;
                  conflictType = 'INTERSECTION';
                  conflictLocation = getCellLabel(ac);
                  break;
                }
              }
              if (conflictCell) break;
            }
          }
          if (conflictCell) break;
        }
      }

      if (conflictCell) {
        // Check if this conflict pair already exists and is active
        const pairKey = [a.id, b.id].sort().join('-');
        const existing = existingConflicts.find(
          c => c.status !== 'RESOLVED' && c.robots.length === 2 &&
               [c.robots[0], c.robots[1]].sort().join('-') === pairKey
        );

        if (existing) {
          // Update existing conflict
          continue; // don't create duplicate
        }

        // Calculate ETA for both robots to conflict cell
        const aETA = computeRouteETA(a, conflictCell);
        const bETA = computeRouteETA(b, conflictCell);

        const risk: ConflictRisk = determineRisk(a, b, aETA, bETA);

        // Determine resolution based on priority
        const aPri = PRIORITY_WEIGHT[a.priority] || 2;
        const bPri = PRIORITY_WEIGHT[b.priority] || 2;

        let resolution: string;
        let reason: string;

        if (mode === 'STOP_AND_WAIT') {
          // In stop-and-wait, the robot that arrives first proceeds, other stops and waits
          if (aETA <= bETA) {
            resolution = `${a.id} PROCEEDS — ${b.id} STOPS AND WAITS`;
          } else {
            resolution = `${b.id} PROCEEDS — ${a.id} STOPS AND WAITS`;
          }
          reason = 'Stop-and-wait: first arrival gets right of way, other halts completely';
        } else {
          // FLEETX: priority-based negotiation with yield
          if (aPri > bPri || (aPri === bPri && aETA <= bETA)) {
            resolution = `${a.id} PROCEEDS — ${b.id} YIELDS`;
            reason = aPri > bPri
              ? `Higher task priority (${a.priority} > ${b.priority})`
              : `Equal priority, earlier arrival (${aETA.toFixed(1)}s vs ${bETA.toFixed(1)}s)`;
          } else {
            resolution = `${b.id} PROCEEDS — ${a.id} YIELDS`;
            reason = bPri > aPri
              ? `Higher task priority (${b.priority} > ${a.priority})`
              : `Equal priority, earlier arrival (${bETA.toFixed(1)}s vs ${aETA.toFixed(1)}s)`;
          }
        }

        const conflict: Conflict = {
          id: generateConflictId(),
          robots: [a.id, b.id],
          location: conflictLocation,
          locationPos: conflictCell,
          risk,
          type: conflictType,
          detectionTime: tick,
          resolution,
          reason,
          status: 'NEGOTIATING',
          resolvedAt: null,
          details: {
            etaA: aETA,
            etaB: bETA,
            priorityA: a.priority,
            priorityB: b.priority,
          },
        };

        newConflicts.push(conflict);
      }
    }
  }

  return { conflicts: existingConflicts, newConflicts };
}

function computeRouteETA(robot: AMR, target: Position): number {
  const route = robot.route.waypoints;
  let dist = 0;
  let found = false;
  for (let i = robot.route.currentIndex; i < route.length - 1; i++) {
    dist += Math.abs(route[i + 1].x - route[i].x) + Math.abs(route[i + 1].y - route[i].y);
    if (route[i].x === target.x && route[i].y === target.y) {
      found = true;
      break;
    }
  }
  if (!found) dist = manhattan(robot.position, target);
  if (robot.speed <= 0) return 999;
  return dist / robot.speed;
}

function determineRisk(a: AMR, b: AMR, aETA: number, bETA: number): ConflictRisk {
  const timeDiff = Math.abs(aETA - bETA);
  if (timeDiff < 1.5) return 'HIGH';
  if (timeDiff < 3) return 'MEDIUM';
  return 'LOW';
}

function isIntersection(p: Position): boolean {
  // Check against known intersection positions
  const intPositions = [
    { x: 7, y: 3 }, { x: 15, y: 3 },
    { x: 7, y: 7 }, { x: 15, y: 7 },
    { x: 7, y: 11 }, { x: 15, y: 11 },
  ];
  return intPositions.some(i => i.x === p.x && i.y === p.y);
}

function isChokepoint(p: Position): boolean {
  return (p.x === 11 && p.y === 3) || (p.x === 11 && p.y === 11);
}

function getCellLabel(p: Position): string {
  if (isIntersection(p)) {
    const ids = ['INT-A', 'INT-B', 'INT-C', 'INT-D', 'INT-E', 'INT-F'];
    const intPositions = [
      { x: 7, y: 3 }, { x: 15, y: 3 },
      { x: 7, y: 7 }, { x: 15, y: 7 },
      { x: 7, y: 11 }, { x: 15, y: 11 },
    ];
    const idx = intPositions.findIndex(i => i.x === p.x && i.y === p.y);
    if (idx >= 0) return `Intersection ${ids[idx].replace('INT-', '')}`;
  }
  if (isChokepoint(p)) {
    return `Chokepoint ${p.x === 11 && p.y === 3 ? 'CP-1' : 'CP-2'}`;
  }
  return `Corridor (${p.x},${p.y})`;
}

function posStr(p: Position): string {
  return `(${p.x},${p.y})`;
}

// Resolve a conflict — determine which robot yields
export function resolveConflict(conflict: Conflict, robots: AMR[], mode: SimulationMode): {
  yieldingRobot: string;
  proceedingRobot: string;
} {
  const [r1Id, r2Id] = conflict.robots;
  const r1 = robots.find(r => r.id === r1Id);
  const r2 = robots.find(r => r.id === r2Id);
  if (!r1 || !r2) return { yieldingRobot: r2Id, proceedingRobot: r1Id };

  const p1 = PRIORITY_WEIGHT[r1.priority] || 2;
  const p2 = PRIORITY_WEIGHT[r2.priority] || 2;

  if (mode === 'STOP_AND_WAIT') {
    // First arrival proceeds
    if ((conflict.details?.etaA ?? 0) <= (conflict.details?.etaB ?? 0)) {
      return { yieldingRobot: r2Id, proceedingRobot: r1Id };
    }
    return { yieldingRobot: r1Id, proceedingRobot: r2Id };
  }

  // FLEETX mode
  if (p1 > p2 || (p1 === p2 && (conflict.details?.etaA ?? 0) <= (conflict.details?.etaB ?? 0))) {
    return { yieldingRobot: r2Id, proceedingRobot: r1Id };
  }
  return { yieldingRobot: r1Id, proceedingRobot: r2Id };
}
