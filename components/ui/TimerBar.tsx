'use client';

function lerpColor(a: string, b: string, t: number): string {
  const ah = parseInt(a.slice(1), 16);
  const bh = parseInt(b.slice(1), 16);
  const ar = (ah >> 16) & 0xff, ag = (ah >> 8) & 0xff, ab = ah & 0xff;
  const br = (bh >> 16) & 0xff, bg = (bh >> 8) & 0xff, bb = bh & 0xff;
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const b_ = Math.round(ab + (bb - ab) * t);
  return `rgb(${r},${g},${b_})`;
}

function timerColor(timeLeft: number, duration: number): string {
  const ratio = Math.max(0, timeLeft / duration);
  if (ratio > 0.6) {
    const t = 1 - (ratio - 0.6) / 0.4;
    return lerpColor('#22c55e', '#f97316', t);
  }
  const t = 1 - ratio / 0.6;
  return lerpColor('#f97316', '#ef4444', t);
}

interface TimerBarProps {
  timeLeft: number;
  duration: number;
}

export function TimerBar({ timeLeft, duration }: TimerBarProps) {
  const ratio = Math.max(0, timeLeft / duration);
  const color = timerColor(timeLeft, duration);
  const seconds = Math.ceil(timeLeft);

  return (
    <div className="flex items-center gap-2">
      <div
        className="flex-1 rounded-full overflow-hidden"
        style={{ height: 4, backgroundColor: '#1e1e2e' }}
      >
        <div
          style={{
            height: '100%',
            width: `${ratio * 100}%`,
            backgroundColor: color,
            transition: 'width 0.1s linear, background-color 0.3s ease',
          }}
        />
      </div>
      <span
        className="text-xs tabular-nums w-5 text-right flex-shrink-0"
        style={{ color, transition: 'color 0.3s ease', fontSize: '11px' }}
      >
        {seconds}
      </span>
    </div>
  );
}
