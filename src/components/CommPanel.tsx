import type { CommMessage } from '@/simulation/types';
import { ArrowRight, Radio } from 'lucide-react';

interface CommPanelProps {
  messages: CommMessage[];
  maxItems?: number;
}

const typeColors: Record<string, string> = {
  INTENT: 'text-cyan-400',
  ACK: 'text-blue-400',
  YIELD: 'text-orange-400',
  PROCEED: 'text-green-400',
  REROUTE: 'text-blue-400',
  BLOCKED: 'text-red-400',
  REQUEST: 'text-yellow-400',
  BROADCAST: 'text-purple-400',
};

export default function CommPanel({ messages, maxItems = 30 }: CommPanelProps) {
  const sorted = [...messages].reverse().slice(0, maxItems);

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-xl overflow-hidden flex flex-col h-full">
      <div className="px-4 py-3 border-b border-slate-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Radio size={16} className="text-cyan-400" />
          <h3 className="text-white font-semibold text-sm">Simulated P2P Edge Communication</h3>
        </div>
        <span className="text-[10px] text-slate-500 font-medium bg-slate-800 px-2 py-0.5 rounded">SIMULATION</span>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-1.5" style={{ maxHeight: '350px' }}>
        {sorted.length === 0 ? (
          <p className="text-slate-500 text-xs text-center py-4">No messages yet. Robots communicate during simulation.</p>
        ) : (
          sorted.map((msg) => (
            <div
              key={msg.id}
              className="px-2.5 py-2 rounded-lg bg-slate-800/40 hover:bg-slate-800/70 transition-colors"
            >
              <div className="flex items-center gap-1.5 text-[10px] mb-1">
                <span className="font-mono font-semibold text-slate-300">{msg.from}</span>
                <ArrowRight size={10} className="text-slate-500" />
                <span className="font-mono font-semibold text-slate-300">{msg.to}</span>
                <span className={`ml-auto font-mono font-bold ${typeColors[msg.type] || 'text-slate-400'}`}>
                  {msg.type}
                </span>
              </div>
              <p className="text-slate-200 text-xs font-mono leading-snug">{msg.content}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
