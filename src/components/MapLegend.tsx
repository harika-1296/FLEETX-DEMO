export default function MapLegend() {
  const items = [
    { label: 'Aisle', color: '#04201e', border: '#0a3f3b' },
    { label: 'Shelf', color: '#0a3f3b', border: '#0f4f4a' },
    { label: 'Pickup Zone', color: '#065f46', border: '#10b981' },
    { label: 'Drop Zone', color: '#1e3a8a', border: '#3b82f6' },
    { label: 'Charging', color: '#78350f', border: '#f59e0b' },
    { label: 'Intersection', color: '#052b28', border: '#0891b2' },
    { label: 'Chokepoint', color: '#1a1208', border: '#d97706' },
    { label: 'Blocked', color: '#7f1d1d', border: '#ef4444' },
  ];

  return (
    <div className="flex flex-wrap gap-x-4 gap-y-2">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-1.5">
          <div
            className="w-3 h-3 rounded"
            style={{ backgroundColor: item.color, border: `1px solid ${item.border}` }}
          />
          <span className="text-[10px] text-slate-400">{item.label}</span>
        </div>
      ))}
    </div>
  );
}
