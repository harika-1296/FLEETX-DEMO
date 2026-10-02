import type { AMR, Warehouse, Position } from '@/simulation/types';

interface WarehouseMapProps {
  warehouse: Warehouse;
  robots: AMR[];
  selectedRobotId: string | null;
  onSelectRobot: (id: string) => void;
  cellSize?: number;
  showRoutes?: boolean;
  showLabels?: boolean;
  blockedAisleCell?: Position | null;
}

export default function WarehouseMap({
  warehouse,
  robots,
  selectedRobotId,
  onSelectRobot,
  cellSize = 28,
  showRoutes = true,
  showLabels = true,
  blockedAisleCell,
}: WarehouseMapProps) {
  const W = warehouse.width;
  const H = warehouse.height;
  const widthPx = W * cellSize;
  const heightPx = H * cellSize;

  function cellColor(x: number, y: number): string {
    const cell = warehouse.grid[y]?.[x];
    if (!cell) return '#04201e';
    switch (cell.type) {
      case 'shelf': return '#0a3f3b';
      case 'pickup': return '#065f46';
      case 'drop': return '#1e3a8a';
      case 'charging': return '#78350f';
      case 'blocked': return '#7f1d1d';
      case 'intersection': return '#052b28';
      case 'chokepoint': return '#1a1208';
      default: return '#04201e';
    }
  }

  function cellBorder(x: number, y: number): string {
    const cell = warehouse.grid[y]?.[x];
    if (!cell) return '#0a3f3b';
    switch (cell.type) {
      case 'shelf': return '#0f4f4a';
      case 'pickup': return '#10b981';
      case 'drop': return '#3b82f6';
      case 'charging': return '#f59e0b';
      case 'blocked': return '#ef4444';
      case 'intersection': return '#0891b2';
      case 'chokepoint': return '#d97706';
      default: return '#0a3f3b';
    }
  }

  // Render route lines for robots
  function renderRoute(robot: AMR): React.ReactNode {
    if (!showRoutes || robot.route.waypoints.length < 2) return null;
    const pts = robot.route.waypoints.slice(robot.route.currentIndex);
    if (pts.length < 2) return null;

    const pathD = pts
      .map((p, i) => {
        const cx = p.x * cellSize + cellSize / 2;
        const cy = p.y * cellSize + cellSize / 2;
        return i === 0 ? `M ${cx} ${cy}` : `L ${cx} ${cy}`;
      })
      .join(' ');

    const isSelected = selectedRobotId === robot.id;
    const opacity = robot.status === 'COMPLETED' || robot.status === 'OFFLINE' ? 0.15 : isSelected ? 0.8 : 0.4;
    const dashArray = robot.status === 'REROUTING' ? '4 3' : undefined;

    return (
      <path
        d={pathD}
        stroke={robot.color}
        strokeWidth={isSelected ? 2.5 : 1.5}
        fill="none"
        opacity={opacity}
        strokeDasharray={dashArray}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    );
  }

  // Direction arrow for route
  function renderRouteArrow(robot: AMR): React.ReactNode {
    if (!showRoutes || robot.route.waypoints.length < 2) return null;
    const pts = robot.route.waypoints.slice(robot.route.currentIndex);
    if (pts.length < 2) return null;
    const p1 = pts[0];
    const p2 = pts[Math.min(1, pts.length - 1)];
    const cx = ((p1.x + p2.x) / 2) * cellSize + cellSize / 2;
    const cy = ((p1.y + p2.y) / 2) * cellSize + cellSize / 2;
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
    return (
      <g transform={`translate(${cx}, ${cy}) rotate(${angle})`}>
        <path d="M -3 -3 L 3 0 L -3 3 Z" fill={robot.color} opacity={0.6} />
      </g>
    );
  }

  return (
    <div className="relative" style={{ width: widthPx, height: heightPx }}>
      <svg width={widthPx} height={heightPx} className="rounded-lg overflow-visible">
        {/* Grid cells */}
        {Array.from({ length: H }, (_, y) =>
          Array.from({ length: W }, (_, x) => {
            const cell = warehouse.grid[y]?.[x];
            if (!cell) return null;
            const isSpecial = cell.type !== 'aisle';
            const isIntersection = cell.type === 'intersection';
            const isChokepoint = cell.type === 'chokepoint';
            const isBlocked = cell.type === 'blocked' || (blockedAisleCell && blockedAisleCell.x === x && blockedAisleCell.y === y);

            return (
              <g key={`${x},${y}`}>
                <rect
                  x={x * cellSize}
                  y={y * cellSize}
                  width={cellSize}
                  height={cellSize}
                  fill={isBlocked ? '#7f1d1d' : cellColor(x, y)}
                  stroke={isSpecial || isBlocked ? cellBorder(x, y) : '#07302d'}
                  strokeWidth={isSpecial || isBlocked ? 1 : 0.5}
                  rx={cell.type === 'shelf' ? 2 : 0}
                />
                {(isIntersection || isChokepoint) && (
                  <circle
                    cx={x * cellSize + cellSize / 2}
                    cy={y * cellSize + cellSize / 2}
                    r={3}
                    fill={isIntersection ? '#0891b2' : '#d97706'}
                    opacity={0.5}
                  />
                )}
                {isBlocked && (
                  <g transform={`translate(${x * cellSize + cellSize / 2}, ${y * cellSize + cellSize / 2})`}>
                    <path d="M -6 -6 L 6 6 M -6 6 L 6 -6" stroke="#ef4444" strokeWidth="2" opacity={0.8} />
                  </g>
                )}
                {showLabels && cell.type === 'shelf' && cell.label && (
                  <text
                    x={x * cellSize + cellSize / 2}
                    y={y * cellSize + cellSize / 2}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize={7}
                    fill="#64748b"
                  >
                    {cell.label}
                  </text>
                )}
                {showLabels && (cell.type === 'pickup' || cell.type === 'drop') && cell.label && (
                  <text
                    x={x * cellSize + cellSize / 2}
                    y={y * cellSize + cellSize / 2}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize={6.5}
                    fill="white"
                    fontWeight="bold"
                  >
                    {cell.label.split(' ')[0]}
                  </text>
                )}
                {showLabels && cell.type === 'charging' && (
                  <text
                    x={x * cellSize + cellSize / 2}
                    y={y * cellSize + cellSize / 2}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize={7}
                    fill="#fbbf24"
                    fontWeight="bold"
                  >
                    CHG
                  </text>
                )}
              </g>
            );
          })
        )}

        {/* Route lines */}
        {robots.map((r) => renderRoute(r))}
        {robots.map((r) => renderRouteArrow(r))}

        {/* Robot markers */}
        {robots.map((robot) => {
          const cx = robot.position.x * cellSize + cellSize / 2;
          const cy = robot.position.y * cellSize + cellSize / 2;
          const isSelected = selectedRobotId === robot.id;
          const isMoving = robot.status === 'MOVING';
          const isConflict = robot.status === 'NEGOTIATING' || robot.status === 'WAITING' || robot.status === 'BLOCKED';
          const isOffline = !robot.online;

          return (
            <g
              key={robot.id}
              transform={`translate(${cx}, ${cy})`}
              className="cursor-pointer"
              onClick={() => onSelectRobot(robot.id)}
            >
              {/* Pulse ring for selected robot */}
              {isSelected && (
                <circle r={cellSize * 0.7} fill="none" stroke={robot.color} strokeWidth={1.5} opacity={0.4}>
                  <animate attributeName="r" values={`${cellSize * 0.5};${cellSize * 0.8};${cellSize * 0.5}`} dur="1.5s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.5;0.1;0.5" dur="1.5s" repeatCount="indefinite" />
                </circle>
              )}
              {/* Conflict flash */}
              {isConflict && (
                <circle r={cellSize * 0.6} fill="#ef4444" opacity={0.15}>
                  <animate attributeName="opacity" values="0.15;0.35;0.15" dur="0.8s" repeatCount="indefinite" />
                </circle>
              )}
              {/* Robot body */}
              <circle
                r={isSelected ? 11 : 9}
                fill={isOffline ? '#0f4f4a' : robot.color}
                stroke="#04201e"
                strokeWidth={2}
                opacity={isOffline ? 0.5 : 1}
              />
              {/* Robot ID */}
              <text
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={7}
                fill="white"
                fontWeight="bold"
                pointerEvents="none"
              >
                {robot.id.split('-')[1]}
              </text>
              {/* Moving indicator */}
              {isMoving && (
                <circle r={3} fill="white" opacity={0.8} pointerEvents="none">
                  <animate attributeName="opacity" values="0.8;0.2;0.8" dur="1s" repeatCount="indefinite" />
                </circle>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
