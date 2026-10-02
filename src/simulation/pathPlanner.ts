import type { Position, Warehouse, WarehouseCell } from './types';
import { isPassable } from './warehouse';

interface PathNode {
  pos: Position;
  g: number;
  h: number;
  f: number;
  parent: PathNode | null;
}

function heuristic(a: Position, b: Position): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

function posKey(p: Position): string {
  return `${p.x},${p.y}`;
}

function neighbors(grid: WarehouseCell[][], p: Position): Position[] {
  const dirs = [
    { x: 1, y: 0 },
    { x: -1, y: 0 },
    { x: 0, y: 1 },
    { x: 0, y: -1 },
  ];
  const result: Position[] = [];
  for (const d of dirs) {
    const nx = p.x + d.x;
    const ny = p.y + d.y;
    if (isPassable(grid, nx, ny)) {
      result.push({ x: nx, y: ny });
    }
  }
  return result;
}

export function findPath(
  warehouse: Warehouse,
  start: Position,
  goal: Position,
  blockedCells: Set<string> = new Set(),
): Position[] {
  const grid = warehouse.grid;

  // If start or goal is blocked in our set, try to find nearest open cell
  const startKey = posKey(start);
  const goalKey = posKey(goal);

  if (blockedCells.has(startKey) || blockedCells.has(goalKey)) {
    // Try to find a nearby unblocked cell
    // For simplicity, just return a direct path
  }

  const open: PathNode[] = [];
  const closed = new Set<string>();
  const openMap = new Map<string, PathNode>();

  const startNode: PathNode = {
    pos: start,
    g: 0,
    h: heuristic(start, goal),
    f: heuristic(start, goal),
    parent: null,
  };

  open.push(startNode);
  openMap.set(posKey(start), startNode);

  let iterations = 0;
  const maxIter = 1000;

  while (open.length > 0 && iterations < maxIter) {
    iterations++;

    // Find node with lowest f
    open.sort((a, b) => a.f - b.f);
    const current = open.shift()!;
    openMap.delete(posKey(current.pos));
    closed.add(posKey(current.pos));

    if (current.pos.x === goal.x && current.pos.y === goal.y) {
      // Reconstruct path
      const path: Position[] = [];
      let node: PathNode | null = current;
      while (node) {
        path.unshift(node.pos);
        node = node.parent;
      }
      return path;
    }

    for (const n of neighbors(grid, current.pos)) {
      const nKey = posKey(n);
      if (closed.has(nKey)) continue;
      if (blockedCells.has(nKey)) continue;

      const tentativeG = current.g + 1;
      const existing = openMap.get(nKey);

      if (!existing) {
        const node: PathNode = {
          pos: n,
          g: tentativeG,
          h: heuristic(n, goal),
          f: tentativeG + heuristic(n, goal),
          parent: current,
        };
        open.push(node);
        openMap.set(nKey, node);
      } else if (tentativeG < existing.g) {
        existing.g = tentativeG;
        existing.f = tentativeG + existing.h;
        existing.parent = current;
      }
    }
  }

  // Fallback: direct line path
  return [start, goal];
}

// Compute ETA based on distance and speed
export function computeETA(route: Position[], currentIndex: number, speed: number): number {
  if (route.length === 0 || currentIndex >= route.length) return 0;
  let dist = 0;
  for (let i = currentIndex; i < route.length - 1; i++) {
    dist += Math.abs(route[i + 1].x - route[i].x) + Math.abs(route[i + 1].y - route[i].y);
  }
  if (speed <= 0) return 999;
  return dist / speed;
}

// Get the next position to move to
export function nextWaypoint(route: Position[], currentIndex: number): Position | null {
  if (currentIndex < route.length - 1) {
    return route[currentIndex + 1];
  }
  return null;
}

// Check if position is at a specific coordinate (with tolerance)
export function atPosition(a: Position, b: Position): boolean {
  return a.x === b.x && a.y === b.y;
}

// Manhattan distance
export function manhattan(a: Position, b: Position): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}
