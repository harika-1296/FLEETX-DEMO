import ArchitectureDiagram from '@/components/ArchitectureDiagram';

export default function Architecture() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-white">System Architecture</h1>
        <p className="text-slate-400 text-sm mt-0.5">
          Decentralized edge-first architecture — EDGE AGENT SIMULATION
        </p>
      </div>

      <ArchitectureDiagram />
    </div>
  );
}
