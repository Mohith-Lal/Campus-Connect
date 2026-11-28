import { useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

/**
 * Aurora Collegiate WebGL field: a drifting constellation of particles plus a
 * few slow-rotating wireframe polyhedra — the "campus network" motif.
 * Pure transform/opacity-equivalent work on the GPU; dpr is clamped and the
 * whole canvas only mounts when visible (see CampusScene.jsx).
 */

const PALETTE = ['#2563eb', '#4f46e5', '#8b5cf6', '#10b981']

/** Tiny deterministic PRNG — pure, so it is safe to call during render. */
function mulberry32(seed) {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function ParticleField({ count = 900 }) {
  const ref = useRef(null)

  const { positions, colors } = useMemo(() => {
    // Deterministic PRNG so the constellation is stable across renders
    // (and free of impure calls during render).
    const rand = mulberry32(0x5eed)
    const positions = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)
    const color = new THREE.Color()

    for (let i = 0; i < count; i += 1) {
      const i3 = i * 3
      // Flat disc with slight vertical scatter — reads like a star map.
      const radius = 4 + rand() * 14
      const theta = rand() * Math.PI * 2
      positions[i3] = Math.cos(theta) * radius
      positions[i3 + 1] = (rand() - 0.5) * 7
      positions[i3 + 2] = Math.sin(theta) * radius - 4

      color.set(PALETTE[Math.floor(rand() * PALETTE.length)])
      colors[i3] = color.r
      colors[i3 + 1] = color.g
      colors[i3 + 2] = color.b
    }
    return { positions, colors }
  }, [count])

  useFrame((state) => {
    if (!ref.current) return
    const t = state.clock.elapsedTime * 0.04
    ref.current.rotation.y = t
    ref.current.position.y = Math.sin(t * 1.4) * 0.25
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.075}
        vertexColors
        transparent
        opacity={0.85}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}

function WirePoly({ position, scale, color, speed }) {
  const ref = useRef(null)

  useFrame((state, delta) => {
    if (!ref.current) return
    ref.current.rotation.x += delta * speed * 0.4
    ref.current.rotation.y += delta * speed
    ref.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * speed + position[0]) * 0.35
  })

  return (
    <mesh ref={ref} position={position} scale={scale}>
      <icosahedronGeometry args={[1, 1]} />
      <meshBasicMaterial color={color} wireframe transparent opacity={0.32} />
    </mesh>
  )
}

export default function SceneCanvas() {
  return (
    <Canvas
      dpr={[1, 1.75]}
      camera={{ position: [0, 0.6, 9], fov: 55 }}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      frameloop="always"
      className="!absolute inset-0"
    >
      <ParticleField />
      <WirePoly position={[-4.6, 1.4, -2]} scale={1.15} color={PALETTE[1]} speed={0.16} />
      <WirePoly position={[5.2, -1.2, -3.5]} scale={1.7} color={PALETTE[0]} speed={0.1} />
      <WirePoly position={[2.4, 2.4, -5]} scale={0.8} color={PALETTE[2]} speed={0.22} />
      <WirePoly position={[-2.8, -2.1, -1.5]} scale={0.6} color={PALETTE[3]} speed={0.26} />
    </Canvas>
  )
}
