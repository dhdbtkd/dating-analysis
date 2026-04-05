'use client';

import { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useReducedMotion } from 'framer-motion';
import * as THREE from 'three';

interface ChatGradientBackgroundProps {
  className?: string;
}

const ENERGY_EVENT_NAME = 'chat-bg-energy';

function clamp01(v: number) {
  return Math.min(1, Math.max(0, v));
}

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
  uniform vec2 uResolution;
  uniform vec3 uA;
  uniform vec3 uB;
  uniform vec3 uC;
  uniform vec3 uD;
  uniform vec3 uSurface;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
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
    float v = 0.0;
    float a = 0.5;
    mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
    for (int i = 0; i < 4; i++) {
      v += a * noise(p);
      p = m * p;
      a *= 0.5;
    }
    return v;
  }

  vec3 tonemap(vec3 c) {
    c = max(vec3(0.0), c);
    c = c / (vec3(0.92) + c);
    return pow(c, vec3(0.86));
  }

  void main() {
    vec2 uv = vUv;
    float aspect = uResolution.x / max(1.0, uResolution.y);
    vec2 p = (uv - 0.5) * vec2(aspect, 1.0);

    float eRaw = clamp(uEnergy, 0.0, 1.0);
    float e = eRaw * eRaw * (3.0 - 2.0 * eRaw);
    float t = uTime * (0.16 + 0.10 * e);
    float pulse = 0.5 + 0.5 * sin(uTime * (0.45 + 0.70 * e));

    float n1 = fbm(p * 1.55 + vec2(t * 0.85, -t * 0.70));
    float n2 = fbm(p * 2.75 + vec2(-t * 1.10, t * 0.95));
    vec2 warp = vec2(n2 - 0.5, n1 - 0.5);
    warp *= (0.10 + 0.18 * e);

    vec2 p2 = p + warp;
    float n3 = fbm(p2 * 4.15 + vec2(t * 1.55, -t * 1.35));

    float baseMix = smoothstep(-0.22, 1.18, uv.x + 0.14 * (n1 - 0.5) + 0.08 * sin(uv.y * 3.2 + t * 2.2));
    float liftMix = smoothstep(-0.10, 1.10, uv.y + 0.10 * (n2 - 0.5) + 0.06 * sin(uv.x * 2.4 - t * 2.8));

    vec3 col = mix(uA, uB, baseMix);
    col = mix(col, uC, liftMix * (0.62 + 0.10 * e));

    vec2 focal = vec2(0.20 * sin(t * 1.10), -0.06 + 0.18 * cos(t * 0.85));
    float d = length(p2 - focal);
    float glow = exp(-d * d * (6.0 + 4.0 * e));
    float halo = exp(-d * (4.8 + 2.0 * e));
    vec3 glowCol = mix(uC, uD, 0.35 + 0.35 * pulse);
    col += glowCol * (0.55 * halo + 0.95 * glow) * (0.84 + 0.55 * e);

    float ridge = smoothstep(0.55, 0.92, n3);
    ridge *= 0.55 + 0.45 * sin(t * (3.8 + 2.0 * e) + n2 * 6.0);
    ridge = max(0.0, ridge);
    col += (uC * 0.22 + uD * 0.14) * ridge * (0.35 + 0.55 * e);

    float caustic = sin((p2.x * 3.1 - p2.y * 2.4) * (2.2 + 0.35 * e) + t * (7.0 + 6.0 * e) + n3 * 5.0);
    caustic = pow(max(0.0, caustic), 2.8);
    col += (uC * 0.12 + uD * 0.08) * caustic * (0.52 + 0.55 * e);

    float depthFog = smoothstep(0.95, 0.05, length(p + vec2(0.0, 0.06)));
    col *= 0.86 + 0.14 * depthFog;

    float vign = smoothstep(1.05, 0.30, length(p));
    col *= 0.88 + 0.12 * vign;

    col = mix(col, uSurface, 0.30);
    col = tonemap(col * (1.38 + 0.18 * e));

    float g = hash(uv * uResolution + vec2(uTime * 80.0, uTime * 23.0));
    col += (g - 0.5) * (0.015 + 0.008 * e);

    gl_FragColor = vec4(col, 1.0);
  }
`;

function ShaderPlane({ energyTargetRef, energyPulseRef }: { energyTargetRef: { current: number }; energyPulseRef: { current: number } }) {
  const materialRef = useRef<THREE.ShaderMaterial | null>(null);
  const { viewport, size } = useThree();
  const energyRef = useRef(0.22);

  const uniforms = useMemo(() => {
    return {
      uTime: { value: 0 },
      uEnergy: { value: 0.22 },
      uResolution: { value: new THREE.Vector2(1, 1) },
      uA: { value: new THREE.Color('#0a3868') },
      uB: { value: new THREE.Color('#2278c8') },
      uC: { value: new THREE.Color('#8fc4ff') },
      uD: { value: new THREE.Color('#d4905a') },
      uSurface: { value: new THREE.Color('#f7f9fb') },
    };
  }, []);

  useFrame((state, delta) => {
    uniforms.uTime.value = state.clock.getElapsedTime();
    uniforms.uResolution.value.set(size.width, size.height);
    const target = clamp01(energyTargetRef.current ?? 0.22);
    const pulse = Math.max(0, energyPulseRef.current ?? 0);
    const follow = 1 - Math.exp(-delta * 1.15);
    const next = energyRef.current + (target - energyRef.current) * follow;
    const pulseNext = pulse * Math.exp(-delta * 1.45);
    energyPulseRef.current = pulseNext;
    const combined = clamp01(next + pulseNext * 0.6);
    energyRef.current = next;
    uniforms.uEnergy.value = combined;
    if (materialRef.current) materialRef.current.needsUpdate = false;
  });

  return (
    <mesh scale={[viewport.width, viewport.height, 1]} position={[0, 0, 0]}>
      <planeGeometry args={[1, 1, 1, 1]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        depthTest={false}
        depthWrite={false}
        transparent={false}
      />
    </mesh>
  );
}

export function ChatGradientBackground({ className = '' }: ChatGradientBackgroundProps) {
  const reducedMotion = useReducedMotion();
  const energyTargetRef = useRef(0.22);
  const energyPulseRef = useRef(0);

  useEffect(() => {
    function onEnergyEvent(evt: Event) {
      const custom = evt as CustomEvent<{ energy?: number; pulse?: number }>;
      const energy = typeof custom.detail?.energy === 'number' ? custom.detail.energy : undefined;
      const pulse = typeof custom.detail?.pulse === 'number' ? custom.detail.pulse : undefined;
      if (energy !== undefined) energyTargetRef.current = clamp01(energy);
      if (pulse !== undefined) energyPulseRef.current = Math.max(energyPulseRef.current, clamp01(pulse) * 0.65);
    }

    globalThis.addEventListener(ENERGY_EVENT_NAME, onEnergyEvent);
    return () => globalThis.removeEventListener(ENERGY_EVENT_NAME, onEnergyEvent);
  }, []);

  return (
    <div
      aria-hidden="true"
      className={className}
      style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}
    >
      <Canvas
        orthographic
        frameloop={reducedMotion ? 'never' : 'always'}
        camera={{ position: [0, 0, 1], zoom: 1 }}
        dpr={[1, 1.5]}
        gl={{ antialias: false, alpha: true, powerPreference: 'low-power' }}
        style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
      >
        <ShaderPlane energyTargetRef={energyTargetRef} energyPulseRef={energyPulseRef} />
      </Canvas>
    </div>
  );
}
