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
  uniform vec3  uA;
  uniform vec3  uB;
  uniform vec3  uC;
  uniform vec3  uD;
  uniform vec3  uE;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }
  float noise(vec2 p) {
    vec2 i = floor(p); vec2 f = fract(p);
    float a = hash(i), b = hash(i+vec2(1,0)), c = hash(i+vec2(0,1)), d = hash(i+vec2(1,1));
    vec2 u = f*f*(3.0-2.0*f);
    return mix(a,b,u.x)+(c-a)*u.y*(1.0-u.x)+(d-b)*u.x*u.y;
  }
  float fbm(vec2 p, int oct) {
    float v=0.0, a=0.5;
    mat2 m = mat2(1.7,1.3,-1.3,1.7);
    for(int i=0;i<6;i++){
      if(i>=oct) break;
      v+=a*noise(p); p=m*p; a*=0.48;
    }
    return v;
  }

  /* 부드러운 최대값 — 선명한 경계 없이 두 글로우 합산 */
  float smax(float a, float b, float k){
    float h = clamp(0.5+0.5*(b-a)/k,0.0,1.0);
    return mix(a,b,h)+k*h*(1.0-h);
  }

  vec3 tonemap(vec3 c){
    c = max(vec3(0.0),c);
    float lum = dot(c,vec3(0.2126,0.7152,0.0722));
    c = mix(c, vec3(lum), -0.12);       /* 채도 살짝 부스트 */
    c = c/(vec3(0.88)+c);
    return pow(c, vec3(0.82));
  }

  void main(){
    vec2 uv  = vUv;
    float ar = uResolution.x/max(1.0,uResolution.y);
    vec2 p   = (uv-0.5)*vec2(ar,1.0);

    float e  = uEnergy;
    float t  = uTime;
    float ts = t*(0.28+0.16*e);

    /* ── 삼중 FBM 워프 ── */
    float n1 = fbm(p*1.30 + vec2( ts*0.95,-ts*0.80), 5);
    float n2 = fbm(p*2.50 + vec2(-ts*1.30, ts*1.10), 5);
    vec2 w1  = vec2(n2-0.5, n1-0.5)*(0.22+0.26*e);
    vec2 p2  = p + w1;

    float n3 = fbm(p2*2.20 + vec2(ts*0.70,-ts*0.60), 4);
    vec2 w2  = vec2(n3-0.5, n2-0.5)*(0.10+0.14*e);
    vec2 p3  = p2 + w2;                         /* 삼중 워프 완성 */

    float n4 = fbm(p3*4.50 + vec2(ts*1.80,-ts*1.55), 4);

    /* ── 베이스 컬러 ── */
    float hm = smoothstep(-0.35,1.35, uv.x+0.20*(n1-0.5)+0.11*sin(uv.y*3.2+ts*3.0));
    float vm = smoothstep(-0.18,1.18, uv.y+0.14*(n2-0.5)+0.08*sin(uv.x*2.8-ts*3.5));
    float dm = smoothstep( 0.10,0.90, fbm(p*0.80+vec2(ts*0.35,ts*0.25),3));

    vec3 col = mix(uB, uA, hm);
    col = mix(col, uD, vm*(0.72+0.14*e));
    col = mix(col, uA*0.4+uD*0.6, dm*0.28);

    /* ── 핫스팟 3개 ── */
    /* 1: 시안 — 좌상 궤도 */
    vec2 f1 = vec2(-0.30+0.26*sin(ts*0.78+0.5), -0.24+0.20*cos(ts*0.65));
    float d1 = length(p3-f1);
    col += uC*(0.80*exp(-d1*(4.2+2.0*e)) + 1.30*exp(-d1*d1*(6.0+3.5*e)))*(0.80+0.65*e);

    /* 2: 마젠타-바이올렛 — 우측 이동 */
    vec2 f2 = vec2(0.32+0.18*cos(ts*0.92+1.2), 0.06+0.22*sin(ts*0.80+0.8));
    float d2 = length(p3-f2);
    vec3 mg  = mix(uD, uE, 0.5+0.5*sin(ts*0.55));
    col += mg*(0.65*exp(-d2*(3.8+1.8*e)) + 1.10*exp(-d2*d2*(5.5+3.0*e)))*(0.70+0.55*e);

    /* 3: 라벤더 — 하단 넓은 필 */
    vec2 f3 = vec2(0.08*sin(ts*1.05+2.1), 0.32+0.16*cos(ts*0.88));
    float d3 = length(p3-f3);
    col += uE*(1.10*exp(-d3*d3*(4.5+2.5*e)))*(0.55+0.45*e);

    /* ── 라이트 스트릭 (대각 흐름) ── */
    float streak = p3.x*0.72 - p3.y*0.68 + ts*0.18;
    float sRaw   = sin(streak*7.5 + n3*4.5)*0.5+0.5;
    float sMask  = exp(-abs(p3.y+0.08*sin(ts*1.1))*6.0);
    col += (uC*0.10+uE*0.08) * pow(sRaw,4.0) * sMask * (0.25+0.45*e);

    /* ── 리지 & 코스틱 ── */
    float ridge = smoothstep(0.50,0.88,n4)*max(0.0,0.6+0.4*sin(ts*(4.5+2.5*e)+n3*6.5));
    col += (uC*0.20+uD*0.14)*ridge*(0.28+0.60*e);

    float caus  = pow(max(0.0,sin((p3.x*3.5-p3.y*2.8)*(2.6+0.5*e)+ts*(9.0+7.0*e)+n4*6.0)),3.2);
    col += (uC*0.12+uD*0.09)*caus*(0.40+0.60*e);

    /* ── 엣지 크로매틱 림 ── */
    float rim = 1.0-smoothstep(0.55,1.0,length(p));
    col += uC*0.06*rim*(0.5+0.5*sin(ts*2.2+n2*4.0));

    /* ── 비네트 + 센터 브라이트 ── */
    float vign   = smoothstep(1.15,0.22,length(p));
    float center = exp(-length(p)*3.0);
    col *= 0.78+0.22*vign;
    col += (uC*0.04+uE*0.03)*center*(0.6+0.4*e);

    col = tonemap(col*(1.55+0.25*e));

    /* 필름 그레인 */
    float g = hash(uv*uResolution+vec2(t*97.0,t*31.0));
    col += (g-0.5)*0.016;

    gl_FragColor = vec4(clamp(col,0.0,1.0), 1.0);
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
        uA:          { value: new THREE.Color('#02020f') }, /* void black  */
        uB:          { value: new THREE.Color('#0f50d8') }, /* electric blue */
        uC:          { value: new THREE.Color('#18e0f8') }, /* bright cyan  */
        uD:          { value: new THREE.Color('#7010d0') }, /* deep violet  */
        uE:          { value: new THREE.Color('#c060ff') }, /* neon lavender */
    }), []);

    useFrame((state) => {
        const t = state.clock.getElapsedTime();
        uniforms.uTime.value = t;
        uniforms.uResolution.value.set(size.width, size.height);
        /* 불규칙 맥박 — 세 주파수 합산으로 유기적 변화 */
        uniforms.uEnergy.value =
            0.55
            + 0.18 * Math.sin(t * 0.62)
            + 0.10 * Math.sin(t * 1.85 + 1.3)
            + 0.06 * Math.sin(t * 3.40 + 2.7);
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
