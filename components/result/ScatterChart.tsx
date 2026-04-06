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
                className="px-3 py-2.5 rounded-2xl text-xs soft-lift"
                style={{ backgroundColor: '#ffffff', color: '#191c1e' }}
            >
                <p className="font-bold mb-1" style={{ color: '#002045' }}>
                    {d.name}
                </p>
                <p style={{ color: '#43474e' }}>불안: {d.anxiety.toFixed(1)}</p>
                <p style={{ color: '#43474e' }}>회피: {d.avoidance.toFixed(1)}</p>
            </div>
        );
    }
    return null;
}

export function ScatterChart({ anxietyScore, avoidanceScore }: ScatterChartProps) {
    const userData = [{ name: '나', avoidance: avoidanceScore, anxiety: anxietyScore }];

    return (
        <div className="w-full">
            <ResponsiveContainer width="100%" height={240}>
                <ReScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
                    <CartesianGrid stroke="#eceef0" strokeDasharray="3 3" />
                    <XAxis
                        type="number"
                        dataKey="avoidance"
                        domain={[1, 7]}
                        ticks={[1, 2, 3, 4, 5, 6, 7]}
                        tick={{ fill: '#74777f', fontSize: 10 }}
                        label={{ value: '회피', position: 'insideBottom', offset: -5, fill: '#74777f', fontSize: 11 }}
                    />
                    <YAxis
                        type="number"
                        dataKey="anxiety"
                        domain={[1, 7]}
                        ticks={[1, 2, 3, 4, 5, 6, 7]}
                        tick={{ fill: '#74777f', fontSize: 10 }}
                        label={{ value: '불안', angle: -90, position: 'insideLeft', fill: '#74777f', fontSize: 11 }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <ReferenceLine x={4} stroke="#c4c6cf" strokeWidth={1.5} strokeDasharray="4 4" />
                    <ReferenceLine y={4} stroke="#c4c6cf" strokeWidth={1.5} strokeDasharray="4 4" />
                    <Scatter data={userData} shape="circle" fill="#0060ac" />
                </ReScatterChart>
            </ResponsiveContainer>
        </div>
    );
}
