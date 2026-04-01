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
      <div className="flex justify-between text-xs mb-1" style={{ color: '#8a8a9a' }}>
        <span>{getPhrase(pct)}</span>
      </div>
    </div>
  );
}
