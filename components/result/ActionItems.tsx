'use client';

interface ActionItemsProps {
  items: string[];
}

export function ActionItems({ items }: ActionItemsProps) {
  return (
    <div className="flex flex-col gap-3">
      {items.map((item, i) => (
        <div key={i} className="flex gap-3 items-start">
          <span
            className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5"
            style={{ backgroundColor: '#c8a96e', color: '#0a0a0f' }}
          >
            {i + 1}
          </span>
          <p className="text-sm leading-relaxed" style={{ color: '#e8e8f0' }}>{item}</p>
        </div>
      ))}
    </div>
  );
}
