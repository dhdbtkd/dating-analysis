'use client';

import { useEffect, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useReducedMotion } from 'framer-motion';
import * as THREE from 'three';
import { useAppStore } from '@/store/useAppStore';

/* ─────────────────────────────────────────
   GLSL 셰이더 — 메시 그라디언트 배경
───────────────────────────────────────── */
const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  precision highp float;

  varying vec2 vUv;

  uniform float uTime;
  uniform float uEnergy;
  uniform vec2  uResolution;
  uniform vec3  uA;   /* deep navy */
  uniform vec3  uB;   /* sky blue  */
  uniform vec3  uC;   /* cyan      */
  uniform vec3  uD;   /* violet    */
  uniform vec3  uE;   /* lavender  */

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
  }
  float fbm(vec2 p) {
    float v = 0.0; float a = 0.5;
    mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
    for (int i = 0; i < 5; i++) { v += a * noise(p); p = m * p; a *= 0.5; }
    return v;
  }
  vec3 tonemap(vec3 c) {
    c = max(vec3(0.0), c);
    c = c / (vec3(0.9) + c);
    return pow(c, vec3(0.84));
  }

  void main() {
    vec2 uv = vUv;
    float aspect = uResolution.x / max(1.0, uResolution.y);
    vec2 p = (uv - 0.5) * vec2(aspect, 1.0);

    float e = uEnergy;
    float t = uTime * (0.22 + 0.14 * e);

    /* 두 겹의 FBM 워프 */
    float n1 = fbm(p * 1.4  + vec2( t * 0.90, -t * 0.75));
    float n2 = fbm(p * 2.60 + vec2(-t * 1.20,  t * 1.05));
    vec2  warp = vec2(n2 - 0.5, n1 - 0.5) * (0.18 + 0.22 * e);
    vec2  p2 = p + warp;
    float n3 = fbm(p2 * 3.8 + vec2(t * 1.6, -t * 1.4));

    /* 블루 → 다크 (좌→우) */
    float hMix = smoothstep(-0.30, 1.30,
      uv.x + 0.18 * (n1 - 0.5) + 0.10 * sin(uv.y * 3.0 + t * 2.5));
    /* 바이올렛 리프트 (아래 → 위) */
    float vMix = smoothstep(-0.15, 1.15,
      uv.y + 0.12 * (n2 - 0.5) + 0.07 * sin(uv.x * 2.6 - t * 3.0));

    vec3 col = mix(uB, uA, hMix);          /* 블루 ↔ 다크 네이비 */
    col = mix(col, uD, vMix * (0.68 + 0.12 * e)); /* 바이올렛 오버레이 */

    /* 시안 글로우 — 좌상단 떠다니는 핫스팟 */
    vec2 focal1 = vec2(-0.28 + 0.20 * sin(t * 0.85), -0.22 + 0.16 * cos(t * 0.70));
    float d1 = length(p2 - focal1);
    float glow1 = exp(-d1 * d1 * (5.0 + 3.0 * e));
    float halo1 = exp(-d1 * (3.8 + 1.8 * e));
    col += uC * (0.70 * halo1 + 1.10 * glow1) * (0.75 + 0.60 * e);

    /* 라벤더 글로우 — 하단 이동 */
    vec2 focal2 = vec2(0.10 * cos(t * 1.10), 0.28 + 0.18 * sin(t * 0.95));
    float d2 = length(p2 - focal2);
    float glow2 = exp(-d2 * d2 * (7.0 + 4.0 * e));
    col += uE * (0.90 * glow2) * (0.60 + 0.50 * e);

    /* 리지 & 코스틱 */
    float ridge = smoothstep(0.52, 0.90, n3);
    ridge *= 0.6 + 0.4 * sin(t * (4.0 + 2.0 * e) + n2 * 6.2);
    col += (uC * 0.18 + uD * 0.12) * max(0.0, ridge) * (0.30 + 0.55 * e);

    float caustic = sin((p2.x * 3.2 - p2.y * 2.5) * (2.4 + 0.4 * e)
                      + t * (8.0 + 6.0 * e) + n3 * 5.5);
    caustic = pow(max(0.0, caustic), 3.0);
    col += (uC * 0.10 + uD * 0.07) * caustic * (0.45 + 0.55 * e);

    /* 비네트 */
    float vign = smoothstep(1.10, 0.28, length(p));
    col *= 0.82 + 0.18 * vign;

    col = tonemap(col * (1.45 + 0.20 * e));

    /* 필름 그레인 */
    float g = hash(uv * uResolution + vec2(uTime * 80.0, uTime * 23.0));
    col += (g - 0.5) * 0.018;

    gl_FragColor = vec4(col, 1.0);
  }
`;

/* ─────────────────────────────────────────
   ShaderPlane — 자동 고에너지 펄스
───────────────────────────────────────── */
function SplashShaderPlane() {
    const { viewport, size } = useThree();
    const uniforms = useMemo(() => ({
        uTime:       { value: 0 },
        uEnergy:     { value: 0.5 },
        uResolution: { value: new THREE.Vector2(1, 1) },
        uA:          { value: new THREE.Color('#030314') }, /* deep navy */
        uB:          { value: new THREE.Color('#1460c8') }, /* sky blue  */
        uC:          { value: new THREE.Color('#3ad4f0') }, /* cyan      */
        uD:          { value: new THREE.Color('#6018c0') }, /* violet    */
        uE:          { value: new THREE.Color('#9060e0') }, /* lavender  */
    }), []);

    useFrame((state, delta) => {
        const t = state.clock.getElapsedTime();
        uniforms.uTime.value = t;
        uniforms.uResolution.value.set(size.width, size.height);
        /* 부드럽게 맥박치는 에너지 0.4 ~ 0.75 */
        uniforms.uEnergy.value = 0.55 + 0.20 * Math.sin(t * 0.55);
    });

    return (
        <mesh scale={[viewport.width, viewport.height, 1]}>
            <planeGeometry args={[1, 1]} />
            <shaderMaterial
                vertexShader={vertexShader}
                fragmentShader={fragmentShader}
                uniforms={uniforms}
                depthTest={false}
                depthWrite={false}
            />
        </mesh>
    );
}

function SplashBackground() {
    const reducedMotion = useReducedMotion();
    return (
        <div aria-hidden style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
            <Canvas
                orthographic
                frameloop={reducedMotion ? 'never' : 'always'}
                camera={{ position: [0, 0, 1], zoom: 1 }}
                dpr={[1, 1.5]}
                gl={{ antialias: false, alpha: false, powerPreference: 'low-power' }}
                style={{ position: 'absolute', inset: 0 }}
            >
                <SplashShaderPlane />
            </Canvas>
        </div>
    );
}

/* ─────────────────────────────────────────
   SplashScreen
───────────────────────────────────────── */
export function SplashScreen() {
    const { setStep } = useAppStore();

    useEffect(() => {
        const timer = setTimeout(() => setStep('intro'), 3200);
        return () => clearTimeout(timer);
    }, [setStep]);

    return (
        <div className="fixed inset-0 overflow-hidden" suppressHydrationWarning>
            <SplashBackground />

            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6 }}
                className="relative z-10 flex flex-col items-center justify-center h-full text-center px-8"
            >
                {/* 아이콘 */}
                <motion.div
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.8, ease: [0.34, 1.56, 0.64, 1] }}
                    className="mb-8"
                >
                    <div
                        className="w-20 h-20 rounded-full mx-auto"
                        style={{
                            background: 'radial-gradient(circle, rgba(255,255,255,0.14) 0%, transparent 70%)',
                            border: '1px solid rgba(255,255,255,0.25)',
                            boxShadow: '0 0 40px rgba(58,212,240,0.25), 0 0 80px rgba(96,24,192,0.20)',
                        }}
                    />
                </motion.div>

                {/* 타이틀 */}
                <motion.h1
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.7, ease: 'easeOut' }}
                    className="text-3xl font-bold leading-snug mb-3"
                    style={{ fontFamily: 'Paperozi', color: '#f0eaff' }}
                >
                    알고보면 보이는 <br />
                    나의 연애
                </motion.h1>

                {/* 구분선 */}
                <motion.div
                    initial={{ scaleX: 0, opacity: 0 }}
                    animate={{ scaleX: 1, opacity: 1 }}
                    transition={{ delay: 1.0, duration: 0.8, ease: 'easeOut' }}
                    className="mb-8"
                    style={{
                        width: 120,
                        height: 1,
                        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)',
                    }}
                />

                {/* 로딩 닷 */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.4, duration: 0.5 }}
                    className="flex gap-2 items-center"
                >
                    {[0, 1, 2].map((i) => (
                        <motion.div
                            key={i}
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ backgroundColor: 'rgba(255,255,255,0.7)' }}
                            animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1.2, 0.8] }}
                            transition={{
                                delay: 1.6 + i * 0.18,
                                duration: 0.9,
                                repeat: Infinity,
                                ease: 'easeInOut',
                            }}
                        />
                    ))}
                </motion.div>
            </motion.div>
        </div>
    );
}
