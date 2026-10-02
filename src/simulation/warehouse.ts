import type { Warehouse, WarehouseCell } from './types';

const W = 24;
const H = 16;

function makeGrid(): Warehouse {
  const grid: WarehouseCell[][] = [];
  for (let y = 0; y < H; y++) {
    const row: WarehouseCell[] = [];
    for (let x = 0; x < W; x++) {
      row.push({ type: 'aisle' as const });
    }
    grid.push(row);
  }

  // Shelves occupy blocks. Aisles run between shelves.
  // Horizontal shelf rows at y=1-2, 5-6, 9-10, 13-14 (each 2 rows tall)
  // Aisles at y=0, 3-4, 7-8, 11-12, 15 (gaps between shelf rows)
  const shelfRows: { y: number; h: number; label: string }[] = [
    { y: 1, h: 2, label: 'A' },
    { y: 5, h: 2, label: 'B' },
    { y: 9, h: 2, label: 'C' },
    { y: 13, h: 2, label: 'D' },
  ];

  for (const sr of shelfRows) {
    // Shelves from x=2 to x=21, with gaps at x=7 and x=15 for cross aisles
    for (let y = sr.y; y < sr.y + sr.h; y++) {
      for (let x = 2; x <= 21; x++) {
        if (x === 7 || x === 15) continue; // vertical cross-aisles
        grid[y][x] = { type: 'shelf', label: `${sr.label}${x - 1}`, zone: sr.label };
      }
    }
  }

  // Pickup zones (left side)
  grid[0][1] = { type: 'pickup', label: 'Pickup A', zone: 'PA' };
  grid[7][1] = { type: 'pickup', label: 'Pickup B', zone: 'PB' };
  grid[15 - 1][1] = { type: 'pickup', label: 'Pickup C', zone: 'PC' };

  // Drop zones (right side)
  grid[0][22] = { type: 'drop', label: 'Drop D', zone: 'DD' };
  grid[7][22] = { type: 'drop', label: 'Drop E', zone: 'DE' };
  grid[15 - 1][22] = { type: 'drop', label: 'Drop F', zone: 'DF' };

  // Charging station (bottom center)
  grid[15][11] = { type: 'charging', label: 'Charging Station', zone: 'CHG' };

  // Intersections — where cross-aisles meet horizontal aisles
  const intersections = [
    { id: 'INT-A', pos: { x: 7, y: 3 } },
    { id: 'INT-B', pos: { x: 15, y: 3 } },
    { id: 'INT-C', pos: { x: 7, y: 7 } },
    { id: 'INT-D', pos: { x: 15, y: 7 } },
    { id: 'INT-E', pos: { x: 7, y: 11 } },
    { id: 'INT-F', pos: { x: 15, y: 11 } },
  ];

  // Chokepoints — narrow passages
  const chokepoints = [
    { id: 'CP-1', pos: { x: 11, y: 3 } },
    { id: 'CP-2', pos: { x: 11, y: 11 } },
  ];

  // Mark intersections and chokepoints on grid (keep as aisle but tag)
  for (const i of intersections) {
    grid[i.pos.y][i.pos.x] = { type: 'intersection', label: i.id };
  }
  for (const c of chokepoints) {
    grid[c.pos.y][c.pos.x] = { type: 'chokepoint', label: c.id };
  }

  // Shelves list for rendering
  const shelves = [
    ...shelfRows.flatMap((sr) => {
      const blocks: { id: string; pos: { x: number; y: number }; w: number; h: number }[] = [];
      // Left shelf block: x=2..6
      blocks.push({ id: `${sr.label}-L`, pos: { x: 2, y: sr.y }, w: 5, h: sr.h });
      // Middle shelf block: x=8..14
      blocks.push({ id: `${sr.label}-M`, pos: { x: 8, y: sr.y }, w: 7, h: sr.h });
      // Right shelf block: x=16..21
      blocks.push({ id: `${sr.label}-R`, pos: { x: 16, y: sr.y }, w: 6, h: sr.h });
      return blocks;
    }),
  ];

  const pickupZones = [
    { id: 'PA', label: 'Pickup A', pos: { x: 1, y: 0 } },
    { id: 'PB', label: 'Pickup B', pos: { x: 1, y: 7 } },
    { id: 'PC', label: 'Pickup C', pos: { x: 1, y: 14 } },
  ];

  const dropZones = [
    { id: 'DD', label: 'Drop D', pos: { x: 22, y: 0 } },
    { id: 'DE', label: 'Drop E', pos: { x: 22, y: 7 } },
    { id: 'DF', label: 'Drop F', pos: { x: 22, y: 14 } },
  ];

  return {
    width: W,
    height: H,
    grid,
    intersections,
    chokepoints,
    pickupZones,
    dropZones,
    chargingStation: { id: 'CHG', pos: { x: 11, y: 15 } },
    shelves,
    blockedAisles: [],
  };
}

export const warehouse: Warehouse = makeGrid();

// Check if a position is passable (not a shelf, not blocked)
export function isPassable(grid: WarehouseCell[][], x: number, y: number): boolean {
  if (x < 0 || x >= W || y < 0 || y >= H) return false;
  const cell = grid[y][x];
  return cell.type !== 'shelf' && cell.type !== 'blocked';
}

export function cellAt(grid: WarehouseCell[][], x: number, y: number): WarehouseCell {
  return grid[y][x];
}

// Label for a grid position
export function posLabel(x: number, y: number): string {
  return `(${x},${y})`;
}
