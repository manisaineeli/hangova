import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'

/**
 * Coast biome: animated ocean, a low sun, and palm silhouettes on the shore.
 * Everything is instanced or shader driven so the whole scene stays cheap.
 */

function Sun({ biome }) {
  const ref = useRef()
  useFrame((state) => {
    if (ref.current) {
      ref.current.position.x = 5.5 + Math.sin(state.clock.elapsedTime * 0.12) * 0.5
    }
  })
  return (
    <group ref={ref} position={[-4.5, 2.6, -22]}>
      <mesh>
        <sphereGeometry args={[1.5, 24, 24]} />
        <meshBasicMaterial color={biome.sun} transparent opacity={0.95} />
      </mesh>
      {/* soft halo */}
      <mesh position={[0, 0, -0.4]}>
        <circleGeometry args={[5.2, 32]} />
        <meshBasicMaterial
          color={biome.sun}
          transparent
          opacity={0.16}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  )
}

/** One palm: a curved trunk built from a tube, plus instanced fronds. */
function Palm({ position, scale = 1, rotation = 0, biome }) {
  const fronds = useRef()

  const trunkGeometry = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0.12, 1.1, 0.05),
      new THREE.Vector3(0.4, 2.1, 0.02),
      new THREE.Vector3(0.85, 2.9, -0.06),
    ])
    return new THREE.TubeGeometry(curve, 12, 0.075, 6, false)
  }, [])

  useFrame((state) => {
    if (fronds.current) {
      // fronds sway out of phase with each other
      fronds.current.rotation.z = Math.sin(state.clock.elapsedTime * 1.1 + position[0]) * 0.09
    }
  })

  return (
    <group position={position} scale={scale} rotation={[0, rotation, 0]}>
      <mesh geometry={trunkGeometry}>
        <meshStandardMaterial color="#4a3a2c" roughness={0.95} />
      </mesh>
      <group ref={fronds} position={[0.85, 2.9, -0.06]}>
        {Array.from({ length: 7 }).map((_, i) => (
          <mesh key={i} rotation={[0, (i / 7) * Math.PI * 2, 0.42 + (i % 2) * 0.12]} position={[0, 0, 0]}>
            <coneGeometry args={[0.16, 1.5, 4, 1, true]} />
            <meshStandardMaterial
              color={i % 2 ? biome.accent : '#1f6b46'}
              side={THREE.DoubleSide}
              roughness={0.8}
            />
          </mesh>
        ))}
      </group>
    </group>
  )
}

export default function CoastScene({ biome }) {
  const palms = useMemo(
    () => [
      { position: [-4.6, -1.05, -2.4], scale: 1.1, rotation: 0.4 },
      { position: [4.0, -1.05, -1.6], scale: 0.88, rotation: 2.6 },
      { position: [-1.9, -1.05, 1.4], scale: 0.66, rotation: 1.4 },
      { position: [6.2, -1.05, 0.6], scale: 0.98, rotation: 3.9 },
    ],
    [],
  )

  return (
    <group>
      <Sun biome={biome} />

      {/* wet sand in the foreground, sloping into the water */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.15, 4]}>
        <planeGeometry args={[34, 16]} />
        <meshStandardMaterial color={biome.ground} roughness={1} />
      </mesh>

      {/* a low foam line where the water meets the sand */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.02, -0.6]}>
        <planeGeometry args={[34, 2.2]} />
        <meshBasicMaterial color="#eafcff" transparent opacity={0.5} />
      </mesh>

      {palms.map((p, i) => (
        <Palm key={i} {...p} biome={biome} />
      ))}
    </group>
  )
}
