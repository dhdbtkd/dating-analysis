import { ImageResponse } from 'next/og';
import type { NextRequest } from 'next/server';

export const runtime = 'edge';

const AXES = ['안정감', '신뢰', '속마음\n표현력', '갈등\n해결력', '관계\n자존감', '친밀감'];
const ANGLE_OFFSET = -Math.PI / 2; // 12시 방향부터 시작

function hexPoint(cx: number, cy: number, r: number, i: number): [number, number] {
    const angle = ANGLE_OFFSET + (i * 2 * Math.PI) / 6;
    return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)];
}

function radarPolygon(cx: number, cy: number, maxR: number, values: number[]): string {
    return values
        .map((v, i) => {
            const r = maxR * (v / 100);
            const [x, y] = hexPoint(cx, cy, r, i);
            return `${x},${y}`;
        })
        .join(' ');
}

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);

    const nickname = searchParams.get('nickname') ?? '익명';
    const typeName = searchParams.get('type') ?? '나만의 유형';
    const tagline = searchParams.get('tagline') ?? '';

    const scores = [
        Number(searchParams.get('s0') ?? 50),
        Number(searchParams.get('s1') ?? 50),
        Number(searchParams.get('s2') ?? 50),
        Number(searchParams.get('s3') ?? 50),
        Number(searchParams.get('s4') ?? 50),
        Number(searchParams.get('s5') ?? 50),
    ];

    const CX = 130;
    const CY = 130;
    const MAX_R = 90;

    // 배경 격자 3단계
    const gridLevels = [1, 0.67, 0.33];
    const gridPolygons = gridLevels.map((level) => {
        const pts = Array.from({ length: 6 }, (_, i) => {
            const [x, y] = hexPoint(CX, CY, MAX_R * level, i);
            return `${x},${y}`;
        }).join(' ');
        return pts;
    });

    // 축 라인 포인트
    const axisLines = Array.from({ length: 6 }, (_, i) => {
        const [x, y] = hexPoint(CX, CY, MAX_R, i);
        return { x, y };
    });

    // 라벨 포인트 (격자 밖)
    const labelPoints = Array.from({ length: 6 }, (_, i) => {
        const [x, y] = hexPoint(CX, CY, MAX_R + 22, i);
        return { x, y, label: AXES[i] };
    });

    const dataPolygon = radarPolygon(CX, CY, MAX_R, scores);

    return new ImageResponse(
        (
            <div
                style={{
                    width: '600px',
                    height: '315px',
                    background: '#f7f9fb',
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    padding: '32px 36px',
                    gap: '32px',
                    fontFamily: 'sans-serif',
                }}
            >
                {/* 레이더 차트 */}
                <svg width="260" height="260" viewBox="0 0 260 260" style={{ flexShrink: 0 }}>
                    {/* 격자 */}
                    {gridPolygons.map((pts, i) => (
                        <polygon
                            key={i}
                            points={pts}
                            fill="none"
                            stroke="#d1d5db"
                            strokeWidth="1"
                        />
                    ))}
                    {/* 축 라인 */}
                    {axisLines.map((pt, i) => (
                        <line
                            key={i}
                            x1={CX} y1={CY}
                            x2={pt.x} y2={pt.y}
                            stroke="#d1d5db"
                            strokeWidth="1"
                        />
                    ))}
                    {/* 데이터 폴리곤 */}
                    <polygon
                        points={dataPolygon}
                        fill="#0060ac"
                        fillOpacity="0.2"
                        stroke="#0060ac"
                        strokeWidth="2"
                    />
                    {/* 데이터 점 */}
                    {scores.map((v, i) => {
                        const r = MAX_R * (v / 100);
                        const [x, y] = hexPoint(CX, CY, r, i);
                        return <circle key={i} cx={x} cy={y} r="4" fill="#0060ac" />;
                    })}
                    {/* 라벨 */}
                    {labelPoints.map(({ x, y, label }, i) => (
                        <text
                            key={i}
                            x={x}
                            y={y}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            fontSize="10"
                            fontWeight="600"
                            fill="#43474e"
                        >
                            {label}
                        </text>
                    ))}
                </svg>

                {/* 텍스트 영역 */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
                    <div style={{ fontSize: '13px', color: '#0060ac', fontWeight: 700, letterSpacing: '0.05em' }}>
                        나의 연애 패턴
                    </div>
                    <div style={{ fontSize: '13px', color: '#74777f' }}>
                        {nickname}님은
                    </div>
                    <div style={{
                        fontSize: '22px',
                        fontWeight: 800,
                        color: '#002045',
                        lineHeight: 1.3,
                    }}>
                        {typeName}
                    </div>
                    {tagline && (
                        <div style={{
                            fontSize: '12px',
                            color: '#43474e',
                            lineHeight: 1.6,
                            borderLeft: '3px solid #0060ac',
                            paddingLeft: '10px',
                            marginTop: '4px',
                        }}>
                            {tagline}
                        </div>
                    )}
                    <div style={{
                        marginTop: 'auto',
                        fontSize: '11px',
                        color: '#9ca3af',
                    }}>
                        나도 내 연애 유형 알아보기 →
                    </div>
                </div>
            </div>
        ),
        {
            width: 600,
            height: 315,
        },
    );
}
