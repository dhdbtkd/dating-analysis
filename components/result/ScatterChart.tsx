'use client';

import {
  ScatterChart as ReScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts';

interface ScatterChartProps {
  anxietyScore: number;
  avoidanceScore: number;
}

interface TooltipPayload {
  payload: { name: string; anxiety: number; avoidance: number };
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: TooltipPayload[] }) {
  if (active && payload && payload.length) {
    const d = payload[0].payload;
    return (
      <div
        className="px-3 py-2 rounded-lg text-xs border"
        style={{ backgroundColor: '#111118', borderColor: '#1e1e2e', color: '#e8e8f0' }}
      >
        <p className="font-bold" style={{ color: '#c8a96e' }}>{d.name}</p>
        <p>불안: {d.anxiety.toFixed(1)}</p>
        <p>회피: {d.avoidance.toFixed(1)}</p>
      </div>
    );
  }
  return null;
}

export function ScatterChart({ anxietyScore, avoidanceScore }: ScatterChartProps) {
  const userData = [{ name: '나', avoidance: avoidanceScore, anxiety: anxietyScore }];

  return (
    <div className="w-full">
      <div className="flex justify-between text-xs mb-1 px-2" style={{ color: '#8a8a9a' }}>
        <span>불안 ↑</span>
        <span>회피 →</span>
      </div>
      <ResponsiveContainer width="100%" height={250}>
        <ReScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
          <defs>
            <linearGradient id="q1" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#22c55e" stopOpacity={0.05} />
            </linearGradient>
            <linearGradient id="q2" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.05} />
            </linearGradient>
            <linearGradient id="q3" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.05} />
            </linearGradient>
            <linearGradient id="q4" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#ef4444" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#1e1e2e" strokeDasharray="3 3" />
          <XAxis
            type="number"
            dataKey="avoidance"
            domain={[1, 7]}
            ticks={[1, 2, 3, 4, 5, 6, 7]}
            tick={{ fill: '#8a8a9a', fontSize: 10 }}
            label={{ value: '회피', position: 'insideBottom', offset: -5, fill: '#8a8a9a', fontSize: 11 }}
          />
          <YAxis
            type="number"
            dataKey="anxiety"
            domain={[1, 7]}
            ticks={[1, 2, 3, 4, 5, 6, 7]}
            tick={{ fill: '#8a8a9a', fontSize: 10 }}
            label={{ value: '불안', angle: -90, position: 'insideLeft', fill: '#8a8a9a', fontSize: 11 }}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine x={4} stroke="#1e1e2e" strokeWidth={1.5} strokeDasharray="4 4" />
          <ReferenceLine y={4} stroke="#1e1e2e" strokeWidth={1.5} strokeDasharray="4 4" />
          <Scatter data={userData} shape="circle" fill="#c8a96e" />
        </ReScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
