import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'

/**
 * Forest biome: instanced conifers in receding depth layers, drifting light
 * motes and shafts. Depth comes from fog plus three size bands rather than
 * from real geometry density, so it stays fast.
 */

function Trees({ biome, count, zRange, scaleRange, color, opacity = 1 }) {
  const ref = useRef()

  const { matrices, geo, mat } = useMemo(() => {
    const geo = new THREE.ConeGeometry(0.5, 2.6, 6, 1)
    const mat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(color),
      roughness: 0.95,
      transparent: opacity < 1,
      opacity,
    })
    const matrices = []
    for (let i = 0; i < count; i++) {
      const s = scaleRange[0] + Math.random() * (scaleRange[1] - scaleRange[0])
      const m = new THREE.Matrix4()
      m.compose(
        new THREE.Vector3(
          (Math.random() - 0.5) * scaleRange[2] * 2,
          -0.9 + (s / scaleRange[1]) * 0.6,
          zRange[0] + Math.random() * (zRange[1] - zRange[0]),
        ),
        new THREE.Quaternion().setFromEuler(
          new THREE.Euler(0, Math.random() * Math.PI, (Math.random() - 0.5) * 0.05),
        ),
        new THREE.Vector3(s * 0.55, s, s * 0.55),
      )
      matrices.push(m)
    }
    return { matrices, geo, mat }
  }, [count, zRange, scaleRange, color, opacity])

  useFrame((state) => {
    if (ref.current) {
      // whole stand breathes very slightly, like wind through a canopy
      ref.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.28) * 0.012
    }
  })

  return (
    <instancedMesh
      ref={ref}
      args={[geo, mat, matrices.length]}
      onUpdate={(self) => {
        matrices.forEach((m, i) => self.setMatrixAt(i, m))
        self.instanceMatrix.needsUpdate = true
      }}
    />
  )
}

/** Slow rising motes that read as pollen or fireflies. */
function Motes({ biome, count = 220 }) {
  const ref = useRef()

  const { positions, speeds } = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const speeds = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 20
      positions[i * 3 + 1] = Math.random() * 7
      positions[i * 3 + 2] = (Math.random() - 0.5) * 14 - 2
      speeds[i] = 0.12 + Math.random() * 0.3
    }
    return { positions, speeds }
  }, [count])

  useFrame((state, delta) => {
    const geo = ref.current?.geometry
    if (!geo) return
    const arr = geo.attributes.position.array
    const t = state.clock.elapsedTime
    for (let i = 0; i < count; i++) {
      arr[i * 3 + 1] += speeds[i] * delta
      arr[i * 3] += Math.sin(t * 0.6 + i) * 0.0016
      if (arr[i * 3 + 1] > 7) arr[i * 3 + 1] = -0.5
    }
    geo.attributes.position.needsUpdate = true
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color={biome.sun}
        size={0.05}
        sizeAttenuation
        transparent
        opacity={0.55}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}

export default function ForestScene({ biome }) {
  const lightShaft = useRef()

  useFrame((state) => {
    if (lightShaft.current) {
      lightShaft.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.2) * 0.09
    }
  })

  return (
    <group>
      {/* forest floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.95, 0]}>
        <planeGeometry args={[34, 26]} />
        <meshStandardMaterial color={biome.ground} roughness={1} />
      </mesh>

      {/* depth layers: far and hazy, then closer and denser */}
      <Trees biome={biome} count={42} zRange={[-16, -7]} scaleRange={[1.6, 3.0]} color={biome.fog} opacity={0.75} />
      <Trees biome={biome} count={26} zRange={[-7, -2]} scaleRange={[1.2, 2.2]} color="#1d5c3a" />
      <Trees biome={biome} count={14} zRange={[-2, 3]} scaleRange={[0.9, 1.7]} color={biome.accent} />

      {/* god rays */}
      <group ref={lightShaft} position={[-2, 3, -6]}>
        {[-1.1, 0, 1.2].map((x, i) => (
          <mesh key={i} position={[x, 0, 0]} rotation={[0, 0, 0.22 - i * 0.06]}>
            <planeGeometry args={[1.1, 12]} />
            <meshBasicMaterial
              color={biome.sun}
              transparent
              opacity={0.055}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
              side={THREE.DoubleSide}
            />
          </mesh>
        ))}
      </group>

      <Motes biome={biome} />
    </group>
  )
}
