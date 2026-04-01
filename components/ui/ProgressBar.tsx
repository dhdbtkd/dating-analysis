'use client';

interface ProgressBarProps {
  current: number;
  total: number;
}

function getPhrase(pct: number): string {
  if (pct <= 5)  return '첫 발을 내딛었어요';
  if (pct <= 20) return '마음의 문이 열리기 시작해요';
  if (pct <= 40) return '조금씩 당신의 색이 보여요';
  if (pct <= 55) return '흥미로운 지점에 왔네요';
  if (pct <= 70) return '깊은 곳까지 왔어요';
  if (pct <= 85) return '거의 다 왔어요, 솔직하게';
  return '마지막이에요, 진심을 담아요';
}

export function ProgressBar({ current, total }: ProgressBarProps) {
  const pct = Math.round((current / total) * 100);
  return (
    <div className="w-full mb-6">
      <div className="flex justify-between items-end mb-3">
        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#43474e' }}>
          {getPhrase(pct)}
        </span>
        <span className="text-xs font-semibold" style={{ color: '#43474e' }}>
          {current} / {total}
        </span>
      </div>
      <div className="w-full rounded-full overflow-hidden" style={{ height: '6px', backgroundColor: '#e6e8ea' }}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${pct}%`,
            background: 'linear-gradient(90deg, #0060ac 0%, #64a8fe 100%)',
          }}
        />
      </div>
    </div>
  );
}
