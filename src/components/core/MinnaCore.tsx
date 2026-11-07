"use client";

import { Line } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

export type CoreState = "idle" | "listening" | "thinking" | "executing" | "complete" | "error" | "mom";

interface Look {
  speed: number;
  glow: number;
  particles: number;
  inner: string;
  rim: string;
  thread: string;
}

/** How the core looks in each state */
const LOOKS: Record<CoreState, Look> = {
  idle: { speed: 0.25, glow: 1, particles: 0.3, inner: "#8b5cf6", rim: "#22d3ee", thread: "#7dd3fc" },
  listening: { speed: 0.35, glow: 1.25, particles: 0.45, inner: "#a78bfa", rim: "#22d3ee", thread: "#a5f3fc" },
  thinking: { speed: 1.4, glow: 1.5, particles: 1.6, inner: "#a78bfa", rim: "#60a5fa", thread: "#c4b5fd" },
  executing: { speed: 2.2, glow: 1.8, particles: 2.2, inner: "#c4b5fd", rim: "#22d3ee", thread: "#67e8f9" },
  complete: { speed: 0.6, glow: 2.2, particles: 0.8, inner: "#67e8f9", rim: "#22d3ee", thread: "#a5f3fc" },
  error: { speed: 0.3, glow: 0.9, particles: 0.25, inner: "#fb7185", rim: "#f472b6", thread: "#fda4af" },
  mom: { speed: 0.7, glow: 1.6, particles: 0.6, inner: "#fbbf24", rim: "#f59e0b", thread: "#fde68a" },
};

/* Fresnel shader: glass-like glowing edges */
const fresnelVertex = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vView;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vNormal = normalize(normalMatrix * normal);
    vView = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }
`;
const fresnelFragment = /* glsl */ `
  uniform vec3 uColor;
  uniform float uPower;
  uniform float uIntensity;
  uniform float uBase;
  varying vec3 vNormal;
  varying vec3 vView;
  void main() {
    float f = pow(1.0 - abs(dot(vNormal, vView)), uPower);
    float a = clamp(f * uIntensity + uBase, 0.0, 1.0);
    gl_FragColor = vec4(uColor * (0.6 + f), a);
  }
`;

function useFresnel(color: string, power: number, intensity: number, base: number, side: THREE.Side = THREE.FrontSide) {
  return useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: fresnelVertex,
        fragmentShader: fresnelFragment,
        uniforms: {
          uColor: { value: new THREE.Color(color) },
          uPower: { value: power },
          uIntensity: { value: intensity },
          uBase: { value: base },
        },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side,
      }),
    [color, power, intensity, base, side],
  );
}

/** Soft round sprite texture for glow and particles */
function useGlowTexture() {
  return useMemo(() => {
    const size = 128;
    const c = document.createElement("canvas");
    c.width = c.height = size;
    const ctx = c.getContext("2d")!;
    const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(0.25, "rgba(255,255,255,0.55)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, []);
}

function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/** Light threads that swirl out from the center */
function useThreads(count: number) {
  return useMemo(() => {
    const rand = seeded(7);
    return Array.from({ length: count }, (_, i) => {
      const theta = (i / count) * Math.PI * 2 + rand() * 0.4;
      const phi = Math.acos(2 * rand() - 1);
      const dir = new THREE.Vector3(Math.sin(phi) * Math.cos(theta), Math.cos(phi) * 0.6, Math.sin(phi) * Math.sin(theta));
      const twist = 0.9 + rand() * 0.8;
      const lift = (rand() - 0.5) * 0.35;
      const pts: THREE.Vector3[] = [];
      for (let t = 0; t <= 1.0001; t += 0.125) {
        const r = 0.18 + t * 0.64;
        const v = dir.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), t * twist).multiplyScalar(r);
        v.y += Math.sin(t * Math.PI) * lift;
        pts.push(v);
      }
      return new THREE.CatmullRomCurve3(pts, false, "centripetal").getPoints(64);
    });
  }, [count]);
}

function Core({ state, interactive }: { state: CoreState; interactive: boolean }) {
  const root = useRef<THREE.Group>(null);
  const spin = useRef<THREE.Group>(null);
  const ringA = useRef<THREE.Mesh>(null);
  const ringB = useRef<THREE.Mesh>(null);
  const inner = useRef<THREE.Mesh>(null);
  const halo = useRef<THREE.Sprite>(null);
  const pulse = useRef<THREE.Mesh>(null);
  const points = useRef<THREE.Points>(null);
  const threadsGroup = useRef<THREE.Group>(null);

  const glowTex = useGlowTexture();
  const outer = useFresnel("#22d3ee", 3.2, 0.7, 0.0);
  const middle = useFresnel("#6366f1", 3.5, 0.45, 0.012);
  const deep = useFresnel("#8b5cf6", 2.5, 0.5, 0.05);
  const ringMat = useFresnel("#a5f3fc", 1.4, 0.55, 0.02, THREE.DoubleSide);
  const pulseMat = useFresnel("#67e8f9", 1.5, 1.4, 0);
  const threads = useThreads(16);

  const particleGeo = useMemo(() => {
    const rand = seeded(42);
    const n = 700;
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const r = 0.25 + Math.cbrt(rand()) * 0.75;
      const th = rand() * Math.PI * 2;
      const ph = Math.acos(2 * rand() - 1);
      pos.set([r * Math.sin(ph) * Math.cos(th), r * Math.cos(ph), r * Math.sin(ph) * Math.sin(th)], i * 3);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    return g;
  }, []);

  // Smoothly animated values
  const cur = useRef({ ...LOOKS.idle, innerC: new THREE.Color(LOOKS.idle.inner), rimC: new THREE.Color(LOOKS.idle.rim), threadC: new THREE.Color(LOOKS.idle.thread) });
  const pulseT = useRef(1);
  const prevState = useRef<CoreState>(state);
  const threadMats = useRef<THREE.LineBasicMaterial[]>([]);

  useFrame((three, delta) => {
    const dt = Math.min(delta, 0.05);
    const target = LOOKS[state];
    const c = cur.current;
    const k = 1 - Math.exp(-dt * 3);
    c.speed += (target.speed - c.speed) * k;
    c.glow += (target.glow - c.glow) * k;
    c.particles += (target.particles - c.particles) * k;
    c.innerC.lerp(new THREE.Color(target.inner), k);
    c.rimC.lerp(new THREE.Color(target.rim), k);
    c.threadC.lerp(new THREE.Color(target.thread), k);

    if (state !== prevState.current) {
      if (state === "complete" || state === "error") pulseT.current = 0;
      prevState.current = state;
    }
    const t = three.clock.elapsedTime;

    if (spin.current) spin.current.rotation.y += dt * c.speed * 0.6;
    if (threadsGroup.current) {
      threadsGroup.current.rotation.y -= dt * c.speed * 0.9;
      threadsGroup.current.rotation.z = Math.sin(t * 0.3) * 0.15;
    }
    if (ringA.current) {
      ringA.current.rotation.x = 1.2 + Math.sin(t * 0.4) * 0.1;
      ringA.current.rotation.z += dt * c.speed * 0.5;
    }
    if (ringB.current) {
      ringB.current.rotation.y += dt * c.speed * 0.35;
      ringB.current.rotation.x = -0.5 + Math.cos(t * 0.3) * 0.1;
    }
    if (points.current) {
      points.current.rotation.y += dt * c.particles * 0.25;
      points.current.rotation.x += dt * c.particles * 0.05;
      (points.current.material as THREE.PointsMaterial).color.copy(c.threadC);
    }

    // Listening breathes, mom mode pulses insistently
    const breathe =
      state === "listening" ? 1 + Math.sin(t * 4) * 0.06 : state === "mom" ? 1 + Math.max(0, Math.sin(t * 5)) * 0.08 : 1 + Math.sin(t * 1.2) * 0.02;
    if (inner.current) {
      inner.current.scale.setScalar(breathe);
      (inner.current.material as THREE.MeshBasicMaterial).color.copy(c.innerC);
    }
    if (halo.current) {
      halo.current.scale.setScalar(1.25 * c.glow * breathe);
      halo.current.material.color.copy(c.innerC);
      halo.current.material.opacity = 0.9;
    }
    outer.uniforms.uColor.value.copy(c.rimC);
    ringMat.uniforms.uColor.value.copy(c.threadC);
    for (const m of threadMats.current) {
      if (!m) continue;
      m.color.copy(c.threadC);
      m.opacity = 0.28 + 0.12 * Math.sin(t * (1 + c.speed)) + 0.12 * c.glow;
    }

    // Expanding ring when done or on error
    if (pulse.current) {
      pulseT.current = Math.min(1, pulseT.current + dt * 0.9);
      const p = pulseT.current;
      pulse.current.visible = p < 1;
      pulse.current.scale.setScalar(0.3 + p * 1.2);
      pulseMat.uniforms.uIntensity.value = (1 - p) * 1.6;
      pulseMat.uniforms.uColor.value.copy(c.innerC);
    }

    // Tilt toward the cursor
    if (root.current) {
      const px = interactive ? three.pointer.x : 0;
      const py = interactive ? three.pointer.y : 0;
      root.current.rotation.y += (px * 0.45 - root.current.rotation.y) * k;
      root.current.rotation.x += (-py * 0.35 - root.current.rotation.x) * k;
      root.current.position.y = Math.sin(t * 0.8) * 0.03;
    }
  });

  return (
    <group ref={root}>
      <group ref={spin}>
        <mesh material={outer}>
          <sphereGeometry args={[1, 64, 64]} />
        </mesh>
        <mesh material={middle} scale={0.72}>
          <sphereGeometry args={[1, 48, 48]} />
        </mesh>
        <mesh material={deep} scale={0.36}>
          <sphereGeometry args={[1, 32, 32]} />
        </mesh>
      </group>
      <mesh ref={ringA} material={ringMat}>
        <torusGeometry args={[0.93, 0.012, 16, 160]} />
      </mesh>
      <mesh ref={ringB} material={ringMat}>
        <torusGeometry args={[0.86, 0.008, 16, 160]} />
      </mesh>
      <group ref={threadsGroup}>
        {threads.map((pts, i) => (
          <Line
            key={i}
            points={pts}
            lineWidth={1.2}
            transparent
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            color="#7dd3fc"
            opacity={0.5}
            ref={(l) => {
              if (l) threadMats.current[i] = l.material as unknown as THREE.LineBasicMaterial;
            }}
          />
        ))}
      </group>
      <points ref={points} geometry={particleGeo}>
        <pointsMaterial
          size={0.018}
          map={glowTex}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          color="#7dd3fc"
          opacity={0.7}
          sizeAttenuation
        />
      </points>
      <mesh ref={inner}>
        <sphereGeometry args={[0.16, 32, 32]} />
        <meshBasicMaterial color="#8b5cf6" toneMapped={false} />
      </mesh>
      <sprite ref={halo} scale={1.1}>
        <spriteMaterial map={glowTex} transparent depthWrite={false} blending={THREE.AdditiveBlending} color="#8b5cf6" />
      </sprite>
      <mesh ref={pulse} material={pulseMat} visible={false}>
        <sphereGeometry args={[1, 48, 48]} />
      </mesh>
    </group>
  );
}

export default function MinnaCoreCanvas({ state, interactive = true }: { state: CoreState; interactive?: boolean }) {
  return (
    <Canvas
      dpr={[1, 1.75]}
      camera={{ position: [0, 0, 3.1], fov: 40 }}
      gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
      style={{ background: "transparent" }}
      eventSource={typeof document !== "undefined" ? document.body : undefined}
      eventPrefix="client"
    >
      <Core state={state} interactive={interactive} />
    </Canvas>
  );
}
