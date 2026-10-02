export interface Position {
  x: number;
  y: number;
}

export type RobotStatus =
  | 'MOVING'
  | 'WAITING'
  | 'NEGOTIATING'
  | 'REROUTING'
  | 'BLOCKED'
  | 'COMPLETED'
  | 'CHARGING'
  | 'OFFLINE';

export type TaskPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';

export type TaskStatus =
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'REASSIGNED'
  | 'COMPLETED'
  | 'BLOCKED'
  | 'PENDING';

export interface Route {
  waypoints: Position[];
  currentIndex: number;
  blocked: boolean;
}

export interface AMR {
  id: string;
  name: string;
  color: string;
  position: Position;
  destination: Position;
  destinationLabel: string;
  route: Route;
  task: string | null;
  battery: number;
  speed: number;
  status: RobotStatus;
  priority: TaskPriority;
  intent: string;
  decision: string;
  confidence: number;
  decisionReason: string[];
  waitingTime: number;
  distanceTravelled: number;
  taskId: string | null;
  online: boolean;
}

export interface Task {
  id: string;
  pickup: string;
  pickupPos: Position;
  drop: string;
  dropPos: Position;
  assignedAMR: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  eta: number;
  createdAt: number;
  completedAt: number | null;
  progress: number;
}

export type ConflictType = 'INTERSECTION' | 'CHOKEPOINT' | 'ROUTE_OVERLAP' | 'HEADON';
export type ConflictRisk = 'LOW' | 'MEDIUM' | 'HIGH';
export type ConflictStatus = 'ACTIVE' | 'NEGOTIATING' | 'RESOLVED';

export interface Conflict {
  id: string;
  robots: string[];
  location: string;
  locationPos: Position;
  risk: ConflictRisk;
  type: ConflictType;
  detectionTime: number;
  resolution: string;
  reason: string;
  status: ConflictStatus;
  resolvedAt: number | null;
  details?: {
    etaA: number;
    etaB: number;
    priorityA: TaskPriority;
    priorityB: TaskPriority;
  };
}

export interface Deadlock {
  id: string;
  robots: string[];
  location: string;
  detectionTime: number;
  resolution: string;
  resolved: boolean;
  resolvedAt: number | null;
}

export interface CommMessage {
  id: string;
  timestamp: number;
  from: string;
  to: string;
  type: 'INTENT' | 'ACK' | 'YIELD' | 'PROCEED' | 'REROUTE' | 'BLOCKED' | 'REQUEST' | 'BROADCAST';
  content: string;
}

export interface SimulationEvent {
  id: string;
  timestamp: number;
  timeString: string;
  category: 'INFO' | 'CONFLICT' | 'DEADLOCK' | 'REROUTE' | 'TASK' | 'WARNING' | 'SUCCESS';
  message: string;
}

export interface BenchmarkResult {
  mode: 'STOP_AND_WAIT' | 'FLEETX';
  completionTime: number;
  waitingTime: number;
  collisionCount: number;
  deadlockCount: number;
  distanceTravelled: number;
  tasksCompleted: number;
  fleetUtilization: number;
}

export interface WarehouseCell {
  type: 'aisle' | 'shelf' | 'pickup' | 'drop' | 'charging' | 'blocked' | 'intersection' | 'chokepoint';
  label?: string;
  zone?: string;
}

export interface Warehouse {
  width: number;
  height: number;
  grid: WarehouseCell[][];
  intersections: { id: string; pos: Position }[];
  chokepoints: { id: string; pos: Position }[];
  pickupZones: { id: string; label: string; pos: Position }[];
  dropZones: { id: string; label: string; pos: Position }[];
  chargingStation: { id: string; pos: Position };
  shelves: { id: string; pos: Position; w: number; h: number }[];
  blockedAisles: string[];
}

export type SimulationMode = 'FLEETX' | 'STOP_AND_WAIT';

export interface Metrics {
  activeAMRs: number;
  activeTasks: number;
  conflicts: number;
  deadlocks: number;
  fleetUtilization: number;
  taskCompletionTime: number;
  collisionCount: number;
  networkStatus: string;
  totalWaitingTime: number;
  distanceTravelled: number;
  tasksCompleted: number;
}
