'use client';

interface ProgressBarProps {
  current: number;
  total: number;
}

export function ProgressBar({ current, total }: ProgressBarProps) {
  const pct = Math.round((current / total) * 100);
  return (
    <div className="w-full mb-6">
      <div className="flex justify-between text-xs mb-1" style={{ color: '#8a8a9a' }}>
        <span>{current} / {total}</span>
        <span>{pct}%</span>
      </div>
      <div className="w-full h-1 rounded-full" style={{ backgroundColor: '#1e1e2e' }}>
        <div
          className="h-1 rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: '#c8a96e' }}
        />
      </div>
    </div>
  );
}
