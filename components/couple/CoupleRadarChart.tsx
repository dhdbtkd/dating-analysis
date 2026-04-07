'use client';

import {
    Radar,
    RadarChart as ReRadarChart,
    PolarGrid,
    PolarAngleAxis,
    ResponsiveContainer,
    Legend,
} from 'recharts';
import type { SessionRow } from '@/types';

interface CoupleRadarChartProps {
    session1: SessionRow;
    session2: SessionRow;
}

function toPercent(score: number) {
    return Math.round(((score - 1) / 6) * 100);
}

export function CoupleRadarChart({ session1: s1, session2: s2 }: CoupleRadarChartProps) {
    const data = [
        {
            axis: '안정감',
            [s1.nickname]: toPercent(8 - s1.ecr_anxiety),
            [s2.nickname]: toPercent(8 - s2.ecr_anxiety),
        },
        {
            axis: '신뢰',
            [s1.nickname]: toPercent(s1.score_trust ?? 4),
            [s2.nickname]: toPercent(s2.score_trust ?? 4),
        },
        {
            axis: '속마음\n표현력',
            [s1.nickname]: toPercent(s1.score_self_disclosure ?? 4),
            [s2.nickname]: toPercent(s2.score_self_disclosure ?? 4),
        },
        {
            axis: '갈등\n해결력',
            [s1.nickname]: toPercent(s1.score_conflict ?? 4),
            [s2.nickname]: toPercent(s2.score_conflict ?? 4),
        },
        {
            axis: '관계\n자존감',
            [s1.nickname]: toPercent(s1.score_rel_self_esteem ?? 4),
            [s2.nickname]: toPercent(s2.score_rel_self_esteem ?? 4),
        },
        {
            axis: '친밀감',
            [s1.nickname]: toPercent(8 - s1.ecr_avoidance),
            [s2.nickname]: toPercent(8 - s2.ecr_avoidance),
        },
    ];

    const color1 = s1.gender === 'female' ? '#c2185b' : '#1565c0';
    const color2 = s2.gender === 'female' ? '#c2185b' : '#1565c0';

    return (
        <ResponsiveContainer width="100%" height={280}>
            <ReRadarChart data={data} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
                <PolarGrid stroke="#e6e8ea" />
                <PolarAngleAxis
                    dataKey="axis"
                    tick={{ fontSize: 11, fill: '#43474e', fontWeight: 600 }}
                />
                <Radar
                    name={s1.nickname}
                    dataKey={s1.nickname}
                    stroke={color1}
                    fill={color1}
                    fillOpacity={0.15}
                    strokeWidth={2}
                    dot={{ r: 3, fill: color1, strokeWidth: 0 }}
                />
                <Radar
                    name={s2.nickname}
                    dataKey={s2.nickname}
                    stroke={color2}
                    fill={color2}
                    fillOpacity={0.15}
                    strokeWidth={2}
                    dot={{ r: 3, fill: color2, strokeWidth: 0 }}
                />
                <Legend
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }}
                />
            </ReRadarChart>
        </ResponsiveContainer>
    );
}
