import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'

/**
 * Dune biome: rolling sand ridges with warm rim light, and heat shimmer in the
 * distance. Used for heritage and culture destinations.
 */

function duneGeometry(width, segments, depth) {
  const g = new THREE.PlaneGeometry(width, depth, segments, segments)
  const pos = g.attributes.position
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i)
    const y = pos.getY(i)
    const h =
      Math.sin(x * 0.32) * 0.55 +
      Math.sin(x * 0.13 + 1.7) * 0.85 +
      Math.cos(y * 0.21 + x * 0.07) * 0.35
    pos.setZ(i, h)
  }
  g.computeVertexNormals()
  return g
}

function Dunes({ biome }) {
  const far = useMemo(() => duneGeometry(40, 80, 20), [])
  const near = useMemo(() => duneGeometry(26, 70, 14), [])

  return (
    <group>
      <mesh geometry={far} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.4, -9]}>
        <meshStandardMaterial color={biome.fog} roughness={1} />
      </mesh>
      <mesh geometry={near} rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.0, 2]}>
        <meshStandardMaterial color={biome.ground} roughness={1} />
      </mesh>
    </group>
  )
}

/** Low sun plus a warm glow sitting on the horizon. */
function Glow({ biome }) {
  return (
    <group position={[-4.5, 1.6, -16]}>
      <mesh>
        <circleGeometry args={[1.7, 32]} />
        <meshBasicMaterial color={biome.sun} transparent opacity={0.9} />
      </mesh>
      <mesh position={[0, 0, -0.3]}>
        <circleGeometry args={[6.5, 32]} />
        <meshBasicMaterial
          color={biome.accent2}
          transparent
          opacity={0.11}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  )
}

/** Kicked-up sand drifting sideways. */
function SandDrift({ biome, count = 260 }) {
  const ref = useRef()

  const { positions, speed } = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const speed = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 24
      positions[i * 3 + 1] = Math.random() * 4 - 1
      positions[i * 3 + 2] = (Math.random() - 0.5) * 14 - 3
      speed[i] = 0.5 + Math.random() * 1.3
    }
    return { positions, speed }
  }, [count])

  useFrame((state, delta) => {
    const geo = ref.current?.geometry
    if (!geo) return
    const arr = geo.attributes.position.array
    const t = state.clock.elapsedTime
    for (let i = 0; i < count; i++) {
      arr[i * 3] += speed[i] * delta
      if (arr[i * 3] > 12) arr[i * 3] = -12
      arr[i * 3 + 1] += Math.sin(t * 1.6 + i) * 0.0016
    }
    geo.attributes.position.needsUpdate = true
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color={biome.accent}
        size={0.035}
        sizeAttenuation
        transparent
        opacity={0.5}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}

export default function DesertScene({ biome }) {
  const group = useRef()

  useFrame((state) => {
    if (group.current) {
      group.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.05) * 0.06
    }
  })

  return (
    <group ref={group}>
      <Glow biome={biome} />
      <Dunes biome={biome} />
      <SandDrift biome={biome} />
    </group>
  )
}
