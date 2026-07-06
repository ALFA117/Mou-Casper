"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef, useState, useEffect } from "react";
import * as THREE from "three";
import type { BackgroundEvent } from "@/lib/types";

/**
 * Ambient 3D backdrop: a slowly drifting red wireframe network of nodes and
 * edges over near-black, evoking the Casper buildathon's neon-red circuit
 * aesthetic. Decorative and behind the UI, but wired to real dashboard
 * events (see lib/use-aval-dashboard.ts): a node pulses when a wallet
 * pays/stakes/invests, a link lights up toward the registry hub on attest,
 * and a node flashes white then goes permanently dark/carbon on slash.
 * Every pulse is triggered only after the real on-chain action already
 * confirmed — nothing here is simulated ahead of the actual event.
 */

const NODE_COUNT = 90;
const CONNECT_DISTANCE = 3.1;
const FIELD_RADIUS = 7.5;
const HUB_INDEX = 0; // representa AttestationRegistry — forzado cerca del centro

const BASE_COLOR = new THREE.Color("#8A1F1F"); // ember rojo tenue en reposo
const WHITE_FLASH = new THREE.Color("#FFFFFF");
const TONE_COLOR: Record<BackgroundEvent["tone"], THREE.Color> = {
  brand: new THREE.Color("#FF1F1F"),
  senior: new THREE.Color("#F4F4F5"),
  junior: new THREE.Color("#FF4D2E"),
  danger: new THREE.Color("#E8112B"),
};
// El nodo del slasheado no se pone "mas rojo" — se apaga a carbon, permanente.
const KILL_COLOR = new THREE.Color("#3A3A40");

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const listener = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", listener);
    return () => mq.removeEventListener("change", listener);
  }, []);
  return reduced;
}

// Degrada a un fondo estatico (sin Canvas/WebGL) si el navegador no soporta
// WebGL o si el hardware reporta muy pocos nucleos — el framerate durante la
// grabacion del video es mas importante que el efecto decorativo.
function useCanRender3D() {
  const [canRender, setCanRender] = useState(true);
  useEffect(() => {
    try {
      const canvas = document.createElement("canvas");
      const gl = canvas.getContext("webgl2") || canvas.getContext("webgl");
      const weakHardware = typeof navigator !== "undefined" && navigator.hardwareConcurrency > 0 && navigator.hardwareConcurrency <= 2;
      setCanRender(!!gl && !weakHardware);
    } catch {
      setCanRender(false);
    }
  }, []);
  return canRender;
}

function nodeIndexForWallet(wallet: string): number {
  let hash = 0;
  for (let i = 0; i < wallet.length; i++) hash = (hash * 31 + wallet.charCodeAt(i)) >>> 0;
  const idx = hash % NODE_COUNT;
  return idx === HUB_INDEX ? (idx + 1) % NODE_COUNT : idx;
}

interface NodePulse {
  id: number;
  nodeIndex: number;
  color: THREE.Color;
  createdAt: number;
  duration: number;
}

interface LinkPulse {
  id: number;
  from: number;
  to: number;
  color: THREE.Color;
  createdAt: number;
  duration: number;
}

function NetworkField({ event, reducedMotion }: { event: BackgroundEvent | null; reducedMotion: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const pointsColorRef = useRef<THREE.BufferAttribute>(null);
  const linkGeomRef = useRef<THREE.BufferGeometry>(null);
  const deadNodesRef = useRef<Set<number>>(new Set());
  const nodePulsesRef = useRef<NodePulse[]>([]);
  const linkPulsesRef = useRef<LinkPulse[]>([]);
  const pulseIdRef = useRef(0);

  const { positions, edgePositions, colors, nodePositions } = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i < NODE_COUNT; i++) {
      if (i === HUB_INDEX) {
        // El hub (AttestationRegistry) vive cerca del centro para que los
        // enlaces de atestacion se lean como "converger hacia el registro".
        pts.push(new THREE.Vector3(0, 0.3, -1.5));
        continue;
      }
      // Distribute inside a flattened ellipsoid so the network reads as a
      // wide horizontal plane drifting behind the dashboard, not a sphere.
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = FIELD_RADIUS * Math.cbrt(Math.random());
      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta) * 0.45;
      const z = r * Math.cos(phi) * 0.6 - 2;
      pts.push(new THREE.Vector3(x, y, z));
    }

    const positions = new Float32Array(pts.length * 3);
    const colors = new Float32Array(pts.length * 3);
    pts.forEach((p, i) => {
      positions[i * 3] = p.x;
      positions[i * 3 + 1] = p.y;
      positions[i * 3 + 2] = p.z;
      colors[i * 3] = BASE_COLOR.r;
      colors[i * 3 + 1] = BASE_COLOR.g;
      colors[i * 3 + 2] = BASE_COLOR.b;
    });

    const edges: number[] = [];
    for (let i = 0; i < pts.length; i++) {
      for (let j = i + 1; j < pts.length; j++) {
        if (pts[i].distanceTo(pts[j]) < CONNECT_DISTANCE) {
          edges.push(pts[i].x, pts[i].y, pts[i].z, pts[j].x, pts[j].y, pts[j].z);
        }
      }
    }

    return {
      positions,
      edgePositions: new Float32Array(edges),
      colors,
      nodePositions: pts,
    };
  }, []);

  // Reacciona a un evento real nuevo: agenda un pulso (nodo), un enlace hacia
  // el hub, o un apagado permanente (slash) — nunca antes de que el padre ya
  // haya confirmado la accion on-chain correspondiente.
  useEffect(() => {
    if (!event) return;
    const now = performance.now();
    const id = ++pulseIdRef.current;

    if (event.kind === "kill") {
      // Flash blanco instantaneo, y despues el nodo queda marcado como muerto
      // (KILL_COLOR carbon) permanentemente — nunca vuelve a rojo.
      const idx = nodeIndexForWallet(event.wallet ?? "underwriter_B");
      deadNodesRef.current.add(idx);
      nodePulsesRef.current.push({ id, nodeIndex: idx, color: WHITE_FLASH, createdAt: now, duration: 900 });
    } else if (event.kind === "link") {
      const idx = nodeIndexForWallet(event.wallet ?? "underwriter_A");
      linkPulsesRef.current.push({ id, from: idx, to: HUB_INDEX, color: TONE_COLOR[event.tone], createdAt: now, duration: 1400 });
    } else if (event.kind === "celebrate") {
      for (let i = 0; i < 6; i++) {
        const idx = Math.floor(Math.random() * NODE_COUNT);
        if (idx === HUB_INDEX || deadNodesRef.current.has(idx)) continue;
        nodePulsesRef.current.push({
          id: pulseIdRef.current + i,
          nodeIndex: idx,
          color: TONE_COLOR.brand,
          createdAt: now + i * 90,
          duration: 1100,
        });
      }
    } else {
      const idx = nodeIndexForWallet(event.wallet ?? "investor");
      nodePulsesRef.current.push({ id, nodeIndex: idx, color: TONE_COLOR[event.tone], createdAt: now, duration: 1100 });
    }
  }, [event]);

  useFrame((_, delta) => {
    if (groupRef.current && !reducedMotion) {
      groupRef.current.rotation.y += delta * 0.02;
      groupRef.current.rotation.x = Math.sin(Date.now() * 0.00005) * 0.08;
    }

    const now = performance.now();
    const colorAttr = pointsColorRef.current;
    if (colorAttr) {
      const arr = colorAttr.array as Float32Array;

      // Base: color muerto (slash) o color base, segun corresponda.
      for (let i = 0; i < NODE_COUNT; i++) {
        const base = deadNodesRef.current.has(i) ? KILL_COLOR : BASE_COLOR;
        arr[i * 3] = base.r;
        arr[i * 3 + 1] = base.g;
        arr[i * 3 + 2] = base.b;
      }

      // Encima, superpone los pulsos activos con un falloff suave.
      nodePulsesRef.current = nodePulsesRef.current.filter(p => now - p.createdAt < p.duration);
      for (const p of nodePulsesRef.current) {
        const t = (now - p.createdAt) / p.duration;
        if (t < 0) continue;
        const intensity = reducedMotion ? 0.6 : Math.sin((1 - t) * Math.PI * 0.5);
        arr[p.nodeIndex * 3] = arr[p.nodeIndex * 3] + (p.color.r - arr[p.nodeIndex * 3]) * intensity;
        arr[p.nodeIndex * 3 + 1] = arr[p.nodeIndex * 3 + 1] + (p.color.g - arr[p.nodeIndex * 3 + 1]) * intensity;
        arr[p.nodeIndex * 3 + 2] = arr[p.nodeIndex * 3 + 2] + (p.color.b - arr[p.nodeIndex * 3 + 2]) * intensity;
      }

      colorAttr.needsUpdate = true;
    }

    const linkGeom = linkGeomRef.current;
    if (linkGeom) {
      linkPulsesRef.current = linkPulsesRef.current.filter(p => now - p.createdAt < p.duration);
      const posAttr = linkGeom.getAttribute("position") as THREE.BufferAttribute | undefined;
      const colAttr = linkGeom.getAttribute("color") as THREE.BufferAttribute | undefined;
      if (posAttr && colAttr) {
        const posArr = posAttr.array as Float32Array;
        const colArr = colAttr.array as Float32Array;
        posArr.fill(0);
        colArr.fill(0);
        linkPulsesRef.current.forEach((p, i) => {
          if (i >= 8) return;
          const from = nodePositions[p.from];
          const to = nodePositions[p.to];
          const t = (now - p.createdAt) / p.duration;
          const intensity = reducedMotion ? 0.5 : Math.sin(Math.min(1, Math.max(0, t)) * Math.PI);
          const base = i * 6;
          posArr[base] = from.x;
          posArr[base + 1] = from.y;
          posArr[base + 2] = from.z;
          posArr[base + 3] = to.x;
          posArr[base + 4] = to.y;
          posArr[base + 5] = to.z;
          const cbase = i * 6;
          for (let v = 0; v < 2; v++) {
            colArr[cbase + v * 3] = p.color.r * intensity;
            colArr[cbase + v * 3 + 1] = p.color.g * intensity;
            colArr[cbase + v * 3 + 2] = p.color.b * intensity;
          }
        });
        posAttr.needsUpdate = true;
        colAttr.needsUpdate = true;
      }
    }
  });

  return (
    <group ref={groupRef}>
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
          <bufferAttribute ref={pointsColorRef} attach="attributes-color" args={[colors, 3]} />
        </bufferGeometry>
        <pointsMaterial size={0.05} sizeAttenuation transparent opacity={0.7} depthWrite={false} vertexColors />
      </points>
      <lineSegments>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[edgePositions, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color="#4A1414" transparent opacity={0.4} depthWrite={false} />
      </lineSegments>
      {/* Enlaces de atestacion: hasta 8 pulsos simultaneos hacia el hub, con color por vertice */}
      <lineSegments>
        <bufferGeometry ref={linkGeomRef}>
          <bufferAttribute attach="attributes-position" args={[new Float32Array(8 * 6), 3]} />
          <bufferAttribute attach="attributes-color" args={[new Float32Array(8 * 6), 3]} />
        </bufferGeometry>
        <lineBasicMaterial vertexColors transparent opacity={0.9} depthWrite={false} />
      </lineSegments>
    </group>
  );
}

interface FloatingCube {
  position: [number, number, number];
  scale: number;
  speed: number;
  phase: number;
}

// Cubos wireframe flotando lento detras de la red — evocan la estetica de
// circuito/gema del arte del buildathon de Casper, sin competir con la UI.
function FloatingCubes({ reducedMotion }: { reducedMotion: boolean }) {
  const groupRef = useRef<THREE.Group>(null);

  const { edges, cubes } = useMemo(() => {
    const edges = new THREE.EdgesGeometry(new THREE.BoxGeometry(1, 1, 1));
    const cubes: FloatingCube[] = Array.from({ length: 6 }, () => ({
      position: [(Math.random() - 0.5) * 13, (Math.random() - 0.5) * 5.5, -3 - Math.random() * 7],
      scale: 0.55 + Math.random() * 1.1,
      speed: 0.12 + Math.random() * 0.18,
      phase: Math.random() * Math.PI * 2,
    }));
    return { edges, cubes };
  }, []);

  useFrame(state => {
    if (reducedMotion || !groupRef.current) return;
    groupRef.current.children.forEach((child, i) => {
      const c = cubes[i];
      if (!c) return;
      child.rotation.x += 0.0012 + c.speed * 0.001;
      child.rotation.y += 0.0018 + c.speed * 0.001;
      child.position.y = c.position[1] + Math.sin(state.clock.elapsedTime * 0.2 + c.phase) * 0.4;
    });
  });

  return (
    <group ref={groupRef}>
      {cubes.map((c, i) => (
        <lineSegments key={i} geometry={edges} position={c.position} scale={c.scale}>
          <lineBasicMaterial color="#FF1F1F" transparent opacity={0.22} depthWrite={false} />
        </lineSegments>
      ))}
    </group>
  );
}

export function Background3D({ event }: { event?: BackgroundEvent | null }) {
  const reducedMotion = useReducedMotion();
  const canRender3D = useCanRender3D();

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 bg-background" aria-hidden="true">
      <div className="absolute inset-0 bg-grid-lines bg-[length:44px_44px] opacity-40" />
      <div className="absolute inset-0 bg-grid-fade" />
      <div className="absolute inset-0 bg-scanlines opacity-60" />
      {canRender3D && (
        <Canvas
          dpr={[1, 1.5]}
          gl={{ antialias: true, alpha: true }}
          camera={{ position: [0, 0.4, 6], fov: 50 }}
          className="opacity-80"
        >
          <fog attach="fog" args={["#0A0A0A", 6, 13]} />
          <NetworkField event={event ?? null} reducedMotion={reducedMotion} />
          <FloatingCubes reducedMotion={reducedMotion} />
        </Canvas>
      )}
      <div className="absolute inset-0 bg-gradient-to-b from-background/10 via-transparent to-background" />
    </div>
  );
}
