"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef, useState, useEffect } from "react";
import * as THREE from "three";

/**
 * Ambient 3D backdrop: a slowly drifting network of nodes and edges,
 * evoking the agent-to-agent / capital-flow trust network the product
 * is about. Purely decorative — fixed behind the UI, non-interactive,
 * and dimmed enough to never compete with foreground text contrast.
 */

const NODE_COUNT = 90;
const CONNECT_DISTANCE = 3.1;
const FIELD_RADIUS = 7.5;

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

function NetworkField() {
  const groupRef = useRef<THREE.Group>(null);
  const reducedMotion = useReducedMotion();

  const { positions, edgePositions } = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i < NODE_COUNT; i++) {
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
    pts.forEach((p, i) => {
      positions[i * 3] = p.x;
      positions[i * 3 + 1] = p.y;
      positions[i * 3 + 2] = p.z;
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
    };
  }, []);

  useFrame((_, delta) => {
    if (!groupRef.current || reducedMotion) return;
    groupRef.current.rotation.y += delta * 0.02;
    groupRef.current.rotation.x = Math.sin(Date.now() * 0.00005) * 0.08;
  });

  return (
    <group ref={groupRef}>
      <points>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[positions, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          color="#7DD3FC"
          size={0.045}
          sizeAttenuation
          transparent
          opacity={0.55}
          depthWrite={false}
        />
      </points>
      <lineSegments>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[edgePositions, 3]}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#22314A" transparent opacity={0.35} depthWrite={false} />
      </lineSegments>
    </group>
  );
}

export function Background3D() {
  return (
    <div
      className="pointer-events-none fixed inset-0 -z-10 bg-background"
      aria-hidden="true"
    >
      <div className="absolute inset-0 bg-grid-fade" />
      <Canvas
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true }}
        camera={{ position: [0, 0.4, 6], fov: 50 }}
        className="opacity-70"
      >
        <fog attach="fog" args={["#020617", 6, 13]} />
        <NetworkField />
      </Canvas>
      <div className="absolute inset-0 bg-gradient-to-b from-background/10 via-transparent to-background" />
    </div>
  );
}
