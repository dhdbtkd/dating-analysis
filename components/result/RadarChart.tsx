'use client';

import {
    Radar,
    RadarChart as ReRadarChart,
    PolarGrid,
    PolarAngleAxis,
    ResponsiveContainer,
} from 'recharts';

interface RadarChartProps {
    anxiety: number;
    avoidance: number;
    trust: number | null;
    selfDisclosure: number | null;
    conflict: number | null;
    relSelfEsteem: number | null;
}

// 불안·회피는 낮을수록 건강 → 반전해서 "안정감"·"친밀감"으로 표시
// 나머지는 높을수록 건강
export function RadarChart({ anxiety, avoidance, trust, selfDisclosure, conflict, relSelfEsteem }: RadarChartProps) {
    const toPercent = (score: number) => Math.round(((score - 1) / 6) * 100);

    const data = [
        { axis: '안정감', value: toPercent(8 - anxiety) },
        { axis: '신뢰', value: toPercent(trust ?? 4) },
        { axis: '자기개방', value: toPercent(selfDisclosure ?? 4) },
        { axis: '갈등 건강도', value: toPercent(conflict ?? 4) },
        { axis: '관계 자존감', value: toPercent(relSelfEsteem ?? 4) },
        { axis: '친밀감', value: toPercent(8 - avoidance) },
    ];

    return (
        <ResponsiveContainer width="100%" height={260}>
            <ReRadarChart data={data} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
                <PolarGrid stroke="#e6e8ea" />
                <PolarAngleAxis
                    dataKey="axis"
                    tick={{ fontSize: 11, fill: '#43474e', fontWeight: 600 }}
                />
                <Radar
                    dataKey="value"
                    stroke="#0060ac"
                    fill="#0060ac"
                    fillOpacity={0.18}
                    strokeWidth={2}
                    dot={{ r: 3, fill: '#0060ac', strokeWidth: 0 }}
                />
            </ReRadarChart>
        </ResponsiveContainer>
    );
}
