'use client';

import { useState } from 'react';
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

const LEGEND = [
    { label: '안정감',        desc: '관계가 흔들릴까봐 불안해하지 않는 정도' },
    { label: '친밀감',        desc: '가까워지는 것을 편안하게 받아들이는 정도' },
    { label: '신뢰',          desc: '상대의 말과 행동을 믿고 의지하는 정도' },
    { label: '속마음 표현력', desc: '감정과 생각을 솔직하게 꺼낼 수 있는 정도' },
    { label: '갈등 해결력',   desc: '다툼이 생겼을 때 대화로 풀어가는 정도' },
    { label: '관계 자존감',   desc: '나는 사랑받을 자격이 있다는 믿음의 정도' },
];

export function RadarChart({ anxiety, avoidance, trust, selfDisclosure, conflict, relSelfEsteem }: RadarChartProps) {
    const [open, setOpen] = useState(false);

    const toPercent = (score: number) => Math.round(((score - 1) / 6) * 100);

    const data = [
        { axis: '안정감',        value: toPercent(8 - anxiety) },
        { axis: '신뢰',          value: toPercent(trust ?? 4) },
        { axis: '속마음 표현력', value: toPercent(selfDisclosure ?? 4) },
        { axis: '갈등 해결력',   value: toPercent(conflict ?? 4) },
        { axis: '관계 자존감',   value: toPercent(relSelfEsteem ?? 4) },
        { axis: '친밀감',        value: toPercent(8 - avoidance) },
    ];

    return (
        <div>
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

            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className="mx-auto flex items-center gap-1 transition-opacity active:opacity-60"
                style={{ display: 'flex' }}
            >
                <span className="text-xs" style={{ color: '#9ca3af' }}>
                    {open ? '지표 설명 닫기' : '지표 설명 보기'}
                </span>
                <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#9ca3af"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
                >
                    <polyline points="6 9 12 15 18 9" />
                </svg>
            </button>

            {open && (
                <div className="mt-3 grid grid-cols-1 gap-2">
                    {LEGEND.map(({ label, desc }) => (
                        <div
                            key={label}
                            className="rounded-2xl px-3 py-2.5"
                            style={{ backgroundColor: '#f7f9fb' }}
                        >
                            <p className="mb-0.5 text-xs font-semibold" style={{ color: '#0060ac' }}>
                                {label}
                            </p>
                            <p className="text-xs leading-relaxed" style={{ color: '#74777f' }}>
                                {desc}
                            </p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
