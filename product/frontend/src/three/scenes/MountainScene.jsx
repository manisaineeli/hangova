import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'

/**
 * Peak biome: layered ridge silhouettes with snow above the snow line, and
 * clouds drifting across them.
 *
 * The snow is baked into the same geometry as vertex colours rather than a
 * second squashed mesh, which used to read as a pale slab floating in front of
 * the ridge instead of a cap on it.
 */

const SNOW = new THREE.Color('#eef4ff')

/**
 * A ridge as a triangle strip from a noisy height line, with the colour
 * interpolated to white above `snowLine`.
 */
function ridgeGeometry(width, segments, baseHeight, amplitude, seedOffset, colour, snowLine) {
  const positions = []
  const colors = []
  const base = new THREE.Color(colour)
  const heights = []

  for (let i = 0; i <= segments; i++) {
    const t = i / segments
    const n =
      Math.sin(t * 6.1 + seedOffset) * 0.5 +
      Math.sin(t * 13.7 + seedOffset * 2.1) * 0.3 +
      Math.sin(t * 27.3 + seedOffset * 3.7) * 0.2
    heights.push(baseHeight + n * amplitude)
  }

  const push = (x, y) => {
    positions.push(x, y, 0)
    const c = base.clone().lerp(SNOW, THREE.MathUtils.clamp((y - snowLine) / 1.2, 0, 1))
    colors.push(c.r, c.g, c.b)
  }

  for (let i = 0; i < segments; i++) {
    const x0 = (i / segments - 0.5) * width
    const x1 = ((i + 1) / segments - 0.5) * width
    const h0 = heights[i]
    const h1 = heights[i + 1]
    // two triangles per column, from y = -6 up to the ridge line
    push(x0, -6)
    push(x1, -6)
    push(x1, h1)
    push(x0, -6)
    push(x1, h1)
    push(x0, h0)
  }

  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  g.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
  return g
}

function Ridge({ z, colour, baseHeight, amplitude, seed, snow = false, opacity = 1 }) {
  const geo = useMemo(
    () => ridgeGeometry(46, 60, baseHeight, amplitude, seed, colour, baseHeight + amplitude * 0.45),
    [colour, baseHeight, amplitude, seed],
  )

  return (
    <mesh geometry={geo} position={[0, 0, z]}>
      <meshBasicMaterial
        vertexColors
        transparent={opacity < 1}
        opacity={opacity}
        depthWrite={false}
      />
    </mesh>
  )
}

function Clouds({ biome, count = 7 }) {
  const group = useRef()
  const clouds = useMemo(
    () =>
      Array.from({ length: count }).map(() => ({
        x: (Math.random() - 0.5) * 30,
        y: 1.4 + Math.random() * 2.4,
        z: -6 - Math.random() * 8,
        s: 1.6 + Math.random() * 2.6,
        speed: 0.09 + Math.random() * 0.16,
      })),
    [count],
  )

  useFrame((state, delta) => {
    if (!group.current) return
    group.current.children.forEach((child, i) => {
      child.position.x += clouds[i].speed * delta * 6
      if (child.position.x > 18) child.position.x = -18
    })
  })

  return (
    <group ref={group}>
      {clouds.map((c, i) => (
        <mesh key={i} position={[c.x, c.y, c.z]} scale={[c.s, c.s * 0.42, 1]}>
          <circleGeometry args={[1, 20]} />
          <meshBasicMaterial
            color={biome.sky[2]}
            transparent
            opacity={0.18}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      ))}
    </group>
  )
}

export default function MountainScene({ biome }) {
  const group = useRef()

  useFrame((state) => {
    if (!group.current) return
    const t = state.clock.elapsedTime
    // very slow parallax sway
    group.current.position.x = Math.sin(t * 0.11) * 0.35
    group.current.position.y = Math.sin(t * 0.07) * 0.12
  })

  return (
    <group ref={group}>
      <Ridge z={-15} colour={biome.fog} baseHeight={1.4} amplitude={1.5} seed={1.2} opacity={0.5} />
      <Ridge z={-11} colour="#39507e" baseHeight={2.0} amplitude={1.8} seed={3.4} opacity={0.75} />
      <Ridge z={-7} colour="#4a6495" baseHeight={2.4} amplitude={1.9} seed={5.9} snow />
      <Ridge z={-3.4} colour="#1b2a4a" baseHeight={1.5} amplitude={1.2} seed={8.3} />
      <Clouds biome={biome} />
    </group>
  )
}
