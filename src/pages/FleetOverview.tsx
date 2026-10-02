import KPIBar from '@/components/KPIBar';
import WarehouseMap from '@/components/WarehouseMap';
import AMRCard from '@/components/AMRCard';
import AMRDetailPanel from '@/components/AMRDetailPanel';
import ActivityFeed from '@/components/ActivityFeed';
import MapLegend from '@/components/MapLegend';
import { Activity, Map as MapIcon } from 'lucide-react';
import type { SimulationState } from '@/simulation/simulationEngine';

interface FleetOverviewProps {
  state: SimulationState;
  onSelectRobot: (id: string) => void;
}

export default function FleetOverview({ state, onSelectRobot }: FleetOverviewProps) {
  const selectedRobot = state.robots.find(r => r.id === state.selectedRobotId);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-white">Fleet Overview</h1>
        <p className="text-slate-400 text-sm mt-0.5">Real-time fleet monitoring — SIMULATION</p>
      </div>

      <KPIBar metrics={state.metrics} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Map */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-700 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <MapIcon size={16} className="text-cyan-400" />
              <h3 className="text-white font-semibold text-sm">Warehouse Mini-Map</h3>
            </div>
            <span className="text-[10px] text-slate-500 bg-slate-800 px-2 py-0.5 rounded">SIMULATION</span>
          </div>
          <div className="overflow-x-auto pb-2">
            <WarehouseMap
              warehouse={state.warehouse}
              robots={state.robots}
              selectedRobotId={state.selectedRobotId}
              onSelectRobot={onSelectRobot}
              cellSize={26}
              blockedAisleCell={state.blockedAisleCell}
            />
          </div>
          <div className="mt-3 pt-3 border-t border-slate-800">
            <MapLegend />
          </div>
        </div>

        {/* Detail Panel / Robot List */}
        <div className="space-y-4">
          {selectedRobot ? (
            <AMRDetailPanel robot={selectedRobot} onClose={() => onSelectRobot('')} />
          ) : (
            <div className="bg-slate-900 border border-slate-700 rounded-xl p-5 text-center">
              <Activity size={28} className="text-slate-600 mx-auto mb-2" />
              <p className="text-slate-400 text-sm">Click a robot on the map</p>
              <p className="text-slate-500 text-xs mt-1">to view its edge agent details</p>
            </div>
          )}
        </div>
      </div>

      {/* AMR Cards */}
      <div>
        <h3 className="text-white font-semibold text-sm mb-3">Active Robots</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
          {state.robots.map(robot => (
            <AMRCard
              key={robot.id}
              robot={robot}
              onClick={() => onSelectRobot(robot.id)}
              isSelected={state.selectedRobotId === robot.id}
            />
          ))}
        </div>
      </div>

      {/* Activity Feed */}
      <div className="grid grid-cols-1 gap-5">
        <ActivityFeed events={state.events} />
      </div>
    </div>
  );
}
