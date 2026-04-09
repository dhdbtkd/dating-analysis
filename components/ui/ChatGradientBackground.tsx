'use client';

import { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useReducedMotion } from 'framer-motion';
import * as THREE from 'three';

/* ── 타입 ── */
export type ChatBgPattern = 'mesh' | 'swirl' | 'wave' | 'aurora' | 'ripple';

export interface ChatBgConfig {
  colorA: string;
  colorB: string;
  colorC: string;
  colorD: string;
  colorE: string;
  pattern: ChatBgPattern;
  speed: number;
  warpStrength: number;
  glowIntensity: number;
  reactivity: number; // 0 = 반응 없음, 1 = 최대 반응
}

export const DEFAULT_CHAT_BG_CONFIG: ChatBgConfig = {
  colorA: '#0a3868',
  colorB: '#2278c8',
  colorC: '#8fc4ff',
  colorD: '#d4905a',
  colorE: '#5a8fd4',
  pattern: 'mesh',
  speed: 0.7,
  warpStrength: 0.8,
  glowIntensity: 1.0,
  reactivity: 0.4,
};

export const CHAT_BG_PATTERN_LABELS: Record<ChatBgPattern, string> = {
  mesh:   'Mesh',
  swirl:  'Swirl',
  wave:   'Wave',
  aurora: 'Aurora',
  ripple: 'Ripple',
};

const PATTERN_INDEX: Record<ChatBgPattern, number> = {
  mesh: 0, swirl: 1, wave: 2, aurora: 3, ripple: 4,
};

const ENERGY_EVENT_NAME = 'chat-bg-energy';

/* ── GLSL ── */
const vertexShader = `
  varying vec2 vUv;
  void main(){
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
  }
`;

const fragmentShader = `
  precision highp float;
  varying vec2 vUv;

  uniform float uTime;
  uniform float uEnergy;
  uniform float uSpeed;
  uniform float uWarp;
  uniform float uGlow;
  uniform int   uPattern;
  uniform vec2  uResolution;
  uniform vec3  uA;
  uniform vec3  uB;
  uniform vec3  uC;
  uniform vec3  uD;
  uniform vec3  uE;

  float hash(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
  float noise(vec2 p){
    vec2 i=floor(p),f=fract(p);
    float a=hash(i),b=hash(i+vec2(1,0)),c=hash(i+vec2(0,1)),d=hash(i+vec2(1,1));
    vec2 u=f*f*f*(f*(f*6.0-15.0)+10.0);
    return mix(a,b,u.x)+(c-a)*u.y*(1.0-u.x)+(d-b)*u.x*u.y;
  }
  float fbm(vec2 p,int oct){
    float v=0.0,a=0.5;
    mat2 m=mat2(1.7,1.3,-1.3,1.7);
    for(int i=0;i<6;i++){ if(i>=oct)break; v+=a*noise(p); p=m*p; a*=0.48; }
    return v;
  }
  vec3 tonemap(vec3 c){
    c=max(vec3(0.0),c);
    float lum=dot(c,vec3(0.2126,0.7152,0.0722));
    c=mix(c,vec3(lum),-0.14);
    c=c/(vec3(0.88)+c);
    return pow(c,vec3(0.82));
  }

  void main(){
    vec2 uv=vUv;
    float ar=uResolution.x/max(1.0,uResolution.y);
    vec2 p=(uv-0.5)*vec2(ar,1.0);

    float e=uEnergy;
    float ts=uTime*uSpeed*(0.28+0.16*e);
    float ws=uWarp;
    float gi=uGlow;

    float n1=fbm(p*1.30+vec2( ts*0.95,-ts*0.80),5);
    float n2=fbm(p*2.50+vec2(-ts*1.30, ts*1.10),5);
    vec2 p3; float n3; float n4;

    if(uPattern==1){
      float r=length(p);
      float ang=r*4.5*ws-ts*1.8+n1*1.5*ws;
      float ca=cos(ang),sa=sin(ang);
      vec2 sp=vec2(ca*p.x-sa*p.y, sa*p.x+ca*p.y);
      n3=fbm(sp*2.5+vec2(ts*0.6,-ts*0.5),4);
      vec2 w1=vec2(n2-0.5,n1-0.5)*(ws*0.18);
      p3=sp+w1;
      n4=fbm(p3*5.0+vec2(ts*2.0,-ts*1.7),4);
    } else if(uPattern==2){
      float wx= sin(p.y*5.0+ts*2.2)*0.18*ws
               +sin(p.y*11.0-ts*3.8+n1*2.0)*0.08*ws
               +sin(p.x*3.5+p.y*2.0+ts*1.4)*0.10*ws;
      float wy= sin(p.x*6.0-ts*1.8)*0.18*ws
               +sin(p.x*9.0+ts*2.9+n2*2.0)*0.08*ws
               +cos(p.x*2.8-p.y*4.0-ts*2.1)*0.10*ws;
      p3=p+vec2(wx,wy);
      n3=fbm(p3*3.5+vec2(ts*1.2,-ts*1.0),4);
      n4=fbm(p3*5.5+vec2(-ts*1.8,ts*1.5),3);
    } else if(uPattern==3){
      float bx=sin(p.y*2.2+ts*0.9)*0.35*ws
              +fbm(vec2(p.y*1.8+ts*0.3, ts*0.25),3)*0.45*ws
              +sin(p.y*5.5-ts*1.6)*0.12*ws;
      float by=fbm(vec2(p.x*1.2,p.y+ts*0.5),3)*0.15*ws;
      p3=p+vec2(bx,by);
      n3=fbm(p3*2.8+vec2(ts*0.5,-ts*0.3),4);
      n4=fbm(p3*6.0+vec2(ts*1.5,-ts*1.2),3);
    } else if(uPattern==4){
      float r=length(p);
      float ripple=sin(r*10.0*ws-ts*3.5)*0.18
                  +sin(r*17.0*ws-ts*5.5+n1*2.0)*0.08
                  +sin(r*6.0 *ws-ts*2.0)*0.12;
      float ang2=atan(p.y,p.x)+ripple*ws*0.8;
      float rmod=r*(1.0+ripple*ws*0.4);
      p3=vec2(cos(ang2),sin(ang2))*rmod;
      n3=fbm(p3*3.0+vec2(ts*0.8,-ts*0.6),4);
      n4=fbm(p3*5.5+vec2(-ts*1.4,ts*1.2),3);
    } else {
      vec2 w1=vec2(n2-0.5,n1-0.5)*(ws*(0.22+0.26*e));
      vec2 p2=p+w1;
      n3=fbm(p2*2.20+vec2(ts*0.70,-ts*0.60),4);
      vec2 w2=vec2(n3-0.5,n2-0.5)*(ws*(0.10+0.14*e));
      p3=p2+w2;
      n4=fbm(p3*4.50+vec2(ts*1.80,-ts*1.55),4);
    }

    float hm=smoothstep(-0.35,1.35,uv.x+0.20*(n1-0.5)+0.11*sin(uv.y*3.2+ts*3.0));
    float vm=smoothstep(-0.18,1.18,uv.y+0.14*(n2-0.5)+0.08*sin(uv.x*2.8-ts*3.5));
    float dm=smoothstep( 0.10,0.90,fbm(p*0.80+vec2(ts*0.35,ts*0.25),3));

    vec3 col=mix(uB,uA,hm);
    col=mix(col,uD,vm*(0.72+0.14*e));
    col=mix(col,uA*0.4+uD*0.6,dm*0.28);

    vec2 f1=vec2(-0.30+0.26*sin(ts*0.78+0.5),-0.24+0.20*cos(ts*0.65));
    float d1=length(p3-f1);
    col+=uC*gi*(0.80*exp(-d1*(4.2+2.0*e))+1.30*exp(-d1*d1*(6.0+3.5*e)))*(0.80+0.65*e);

    vec2 f2=vec2(0.32+0.18*cos(ts*0.92+1.2),0.06+0.22*sin(ts*0.80+0.8));
    float d2=length(p3-f2);
    vec3 mg=mix(uD,uE,0.5+0.5*sin(ts*0.55));
    col+=mg*gi*(0.65*exp(-d2*(3.8+1.8*e))+1.10*exp(-d2*d2*(5.5+3.0*e)))*(0.70+0.55*e);

    vec2 f3=vec2(0.08*sin(ts*1.05+2.1),0.32+0.16*cos(ts*0.88));
    float d3=length(p3-f3);
    col+=uE*gi*(1.10*exp(-d3*d3*(4.5+2.5*e)))*(0.55+0.45*e);

    float streak=p3.x*0.72-p3.y*0.68+ts*0.18;
    float sMask=exp(-abs(p3.y+0.08*sin(ts*1.1))*6.0);
    col+=(uC*0.10+uE*0.08)*pow(max(0.0,sin(streak*7.5+n3*4.5)*0.5+0.5),4.0)*sMask*(0.25+0.45*e);

    float ridge=smoothstep(0.50,0.88,n4)*max(0.0,0.6+0.4*sin(ts*(4.5+2.5*e)+n3*6.5));
    col+=(uC*0.20+uD*0.14)*ridge*(0.28+0.60*e);
    float caus=pow(max(0.0,sin((p3.x*3.5-p3.y*2.8)*(2.6+0.5*e)+ts*(9.0+7.0*e)+n4*6.0)),3.2);
    col+=(uC*0.12+uD*0.09)*caus*(0.40+0.60*e);

    float rim=1.0-smoothstep(0.55,1.0,length(p));
    col+=uC*0.06*rim*(0.5+0.5*sin(ts*2.2+n2*4.0));

    col*=0.78+0.22*smoothstep(1.15,0.22,length(p));
    col+=(uC*0.04+uE*0.03)*exp(-length(p)*3.0)*(0.6+0.4*e);

    col=tonemap(col*(1.55+0.25*e));
    float g=hash(uv*uResolution+vec2(uTime*97.0,uTime*31.0));
    col+=(g-0.5)*0.016;
    gl_FragColor=vec4(clamp(col,0.0,1.0),1.0);
  }
`;

function clamp01(v: number) { return Math.min(1, Math.max(0, v)); }

/* ── ShaderPlane (energy-reactive) ── */
function ChatShaderPlane({
  configRef,
  energyTargetRef,
  energyPulseRef,
}: {
  configRef: React.MutableRefObject<ChatBgConfig>;
  energyTargetRef: React.MutableRefObject<number>;
  energyPulseRef: React.MutableRefObject<number>;
}) {
  const { viewport, size } = useThree();
  const energyRef = useRef(0.22);

  const uniforms = useMemo(() => {
    const cfg = configRef.current;
    return {
      uTime:       { value: 0 },
      uEnergy:     { value: 0.22 },
      uSpeed:      { value: cfg.speed },
      uWarp:       { value: cfg.warpStrength },
      uGlow:       { value: cfg.glowIntensity },
      uPattern:    { value: PATTERN_INDEX[cfg.pattern] },
      uResolution: { value: new THREE.Vector2(1, 1) },
      uA:          { value: new THREE.Color(cfg.colorA) },
      uB:          { value: new THREE.Color(cfg.colorB) },
      uC:          { value: new THREE.Color(cfg.colorC) },
      uD:          { value: new THREE.Color(cfg.colorD) },
      uE:          { value: new THREE.Color(cfg.colorE) },
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useFrame((state, delta) => {
    const cfg = configRef.current;
    uniforms.uTime.value = state.clock.getElapsedTime();
    uniforms.uResolution.value.set(size.width, size.height);
    uniforms.uSpeed.value   = cfg.speed;
    uniforms.uWarp.value    = cfg.warpStrength;
    uniforms.uGlow.value    = cfg.glowIntensity;
    uniforms.uPattern.value = PATTERN_INDEX[cfg.pattern];
    uniforms.uA.value.set(cfg.colorA);
    uniforms.uB.value.set(cfg.colorB);
    uniforms.uC.value.set(cfg.colorC);
    uniforms.uD.value.set(cfg.colorD);
    uniforms.uE.value.set(cfg.colorE);

    const BASE_ENERGY = 0.22;
    const reactivity = clamp01(configRef.current.reactivity ?? 1.0);
    const rawTarget = clamp01(energyTargetRef.current ?? BASE_ENERGY);
    const scaledTarget = BASE_ENERGY + (rawTarget - BASE_ENERGY) * reactivity;
    const pulse  = Math.max(0, energyPulseRef.current ?? 0) * reactivity;
    const follow = 1 - Math.exp(-delta * 1.15);
    const next   = energyRef.current + (scaledTarget - energyRef.current) * follow;
    const pulseNext = pulse * Math.exp(-delta * 1.45);
    energyPulseRef.current = pulseNext / (reactivity || 1);
    energyRef.current = next;
    uniforms.uEnergy.value = clamp01(next + pulseNext * 0.6);
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

/* ── 전체화면 배경 (채팅용) ── */
interface ChatGradientBackgroundProps {
  className?: string;
  config?: Partial<ChatBgConfig>;
}

export function ChatGradientBackground({ className = '', config: configProp }: ChatGradientBackgroundProps) {
  const reducedMotion = useReducedMotion();
  const energyTargetRef = useRef(0.22);
  const energyPulseRef  = useRef(0);
  const configRef = useRef<ChatBgConfig>({ ...DEFAULT_CHAT_BG_CONFIG, ...configProp });

  useEffect(() => {
    configRef.current = { ...DEFAULT_CHAT_BG_CONFIG, ...configProp };
  }, [configProp]);

  useEffect(() => {
    function onEnergyEvent(evt: Event) {
      const custom = evt as CustomEvent<{ energy?: number; pulse?: number }>;
      const energy = typeof custom.detail?.energy === 'number' ? custom.detail.energy : undefined;
      const pulse  = typeof custom.detail?.pulse  === 'number' ? custom.detail.pulse  : undefined;
      if (energy !== undefined) energyTargetRef.current = clamp01(energy);
      if (pulse  !== undefined) energyPulseRef.current  = Math.max(energyPulseRef.current, clamp01(pulse) * 0.65);
    }
    globalThis.addEventListener(ENERGY_EVENT_NAME, onEnergyEvent);
    return () => globalThis.removeEventListener(ENERGY_EVENT_NAME, onEnergyEvent);
  }, []);

  return (
    <div
      aria-hidden="true"
      className={className}
      style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', background: '#0a1628' }}
    >
      <Canvas
        orthographic
        frameloop={reducedMotion ? 'never' : 'always'}
        camera={{ position: [0, 0, 1], zoom: 1 }}
        dpr={[1, 2]}
        gl={{ antialias: false, alpha: false, powerPreference: 'low-power' }}
        style={{ position: 'absolute', inset: 0, pointerEvents: 'none', display: 'block' }}
      >
        <ChatShaderPlane configRef={configRef} energyTargetRef={energyTargetRef} energyPulseRef={energyPulseRef} />
      </Canvas>
    </div>
  );
}

/* ── 어드민 미리보기용 ── */
export function ChatBgPreviewCanvas({ config: configProp }: { config?: Partial<ChatBgConfig> }) {
  const configRef = useRef<ChatBgConfig>({ ...DEFAULT_CHAT_BG_CONFIG, ...configProp });
  useEffect(() => { configRef.current = { ...DEFAULT_CHAT_BG_CONFIG, ...configProp }; }, [configProp]);
  const energyTargetRef = useRef(0.26);
  const energyPulseRef  = useRef(0);

  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <Canvas
        orthographic
        frameloop="always"
        camera={{ position: [0, 0, 1], zoom: 1 }}
        dpr={[1, 1.5]}
        gl={{ antialias: false, alpha: false, powerPreference: 'low-power' }}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
      >
        <ChatShaderPlane configRef={configRef} energyTargetRef={energyTargetRef} energyPulseRef={energyPulseRef} />
      </Canvas>
    </div>
  );
}
