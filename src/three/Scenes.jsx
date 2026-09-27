import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { presenceAt, scrollState, SI } from '../lib/scroll'
import { GlowCore, Dust, Rings } from './shared'

/* ============================================================
   Section scenes. Each fades in / scales with its section's
   scroll presence, so one shared canvas serves the whole page.
   ============================================================ */

function usePresence(index, spread = 0.62) {
  const ref = useRef(0)
  useFrame((_, dt) => {
    const d = Math.min(dt, 0.05)
    ref.current += (presenceAt(scrollState.progress, index, spread) - ref.current) * Math.min(1, d * 5)
  })
  return ref
}

/** thin cylinder stretched between two points */
function Connector({ from, to, color, presence, opacity = 0.3, radius = 0.006 }) {
  const { pos, quat, len, mid } = useMemo(() => {
    const a = new THREE.Vector3(...from)
    const b = new THREE.Vector3(...to)
    const dir = b.clone().sub(a)
    const len = dir.length()
    const mid = a.clone().add(b).multiplyScalar(0.5)
    const quat = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      dir.clone().normalize()
    )
    return { pos: mid, quat, len, mid }
  }, [from, to])

  const ref = useRef()
  useFrame(() => {
    if (ref.current) ref.current.material.opacity = presence.current * opacity
  })

  return (
    <mesh ref={ref} position={pos} quaternion={quat}>
      <cylinderGeometry args={[radius, radius, len, 8, 1, true]} />
      <meshBasicMaterial color={color} transparent opacity={0} depthWrite={false} />
    </mesh>
  )
}

/* ============================================================
   1 · PROBLEM — scattered, disconnected, dark service islands
   ============================================================ */
const ISLANDS = [
  [-2.6, 1.5, -0.6],
  [-1.1, 2.5, 0.9],
  [0.9, 1.9, -1.2],
  [2.7, 1.1, 0.4],
  [-2.1, -0.4, 0.7],
  [0.2, -0.9, 0.2],
  [2.4, -1.3, -0.9],
  [-0.6, 0.6, 1.6],
]
const LINKS = [
  [0, 2],
  [2, 3],
  [0, 4],
  [4, 5],
  [5, 6],
  [1, 5],
  [1, 7],
  [7, 2],
]

export function ProblemScene() {
  const p = usePresence(SI.problem)
  const root = useRef()
  const blocks = useRef([])

  useFrame((st, dt) => {
    const t = st.clock.elapsedTime
    const d = Math.min(dt, 0.05)
    if (root.current) {
      root.current.visible = p.current > 0.015
      root.current.rotation.y += d * 0.05
      root.current.position.x = 2.9 - scrollState.px * 0.3
    }
    blocks.current.forEach((m, i) => {
      if (!m) return
      m.rotation.x = Math.sin(t * 0.35 + i) * 0.28
      m.rotation.y = t * (0.12 + i * 0.02) + i
      m.material.opacity = p.current * (0.34 + 0.12 * Math.sin(t * 0.9 + i))
      const s = 0.9 + 0.1 * Math.sin(t * 0.7 + i * 1.3)
      m.scale.setScalar(s)
    })
    // broken links flicker and die — the "no single platform" idea
  })

  return (
    <group ref={root} position={[2.9, 0, 0]}>
      {ISLANDS.map((pos, i) => (
        <mesh key={i} ref={(m) => (blocks.current[i] = m)} position={pos}>
          <boxGeometry args={[0.34, 0.34, 0.34]} />
          <meshBasicMaterial color="#f472b6" transparent opacity={0} depthWrite={false} />
        </mesh>
      ))}
      {LINKS.map(([a, b], i) => (
        <Connector key={i} from={ISLANDS[a]} to={ISLANDS[b]} color="#fb7185" presence={p} opacity={0.24} radius={0.005} />
      ))}
      <Dust count={140} radius={3.2} color="#f472b6" presence={p} size={0.7} />
    </group>
  )
}

/* ============================================================
   2 · SOLUTION — one core, everything converging into it
   ============================================================ */
const FEAT_N = 8

export function SolutionScene() {
  const p = usePresence(SI.solution)
  const root = useRef()
  const nodes = useRef([])
  const core = useRef(0)

  useFrame((st, dt) => {
    const t = st.clock.elapsedTime
    const d = Math.min(dt, 0.05)
    core.current = p.current
    if (root.current) {
      root.current.visible = p.current > 0.015
      root.current.rotation.y += d * 0.24
      root.current.position.x = -2.9 + scrollState.px * 0.28
    }
    nodes.current.forEach((g, i) => {
      if (!g) return
      const a = (i / FEAT_N) * Math.PI * 2
      g.rotation.y = -a + t * 0.24
      g.children[0].material.opacity = p.current * 0.85
      g.children[1].material.opacity = p.current * (1 - ((t * 0.5 + i / FEAT_N) % 1)) * 0.5
    })
  })

  return (
    <group ref={root} position={[-2.9, 0, 0]}>
      <GlowCore presence={core} color="#a78bfa" scale={1.15} />
      <Rings presence={core} radii={[1.25, 1.55, 1.9]} color="#2ee6d6" speed={0.26} />
      {Array.from({ length: FEAT_N }).map((_, i) => {
        const a = (i / FEAT_N) * Math.PI * 2
        const r = 1.9
        return (
          <group key={i} position={[Math.cos(a) * r, Math.sin(a) * r * 0.75, 0]}>
            <mesh>
              <sphereGeometry args={[0.075, 14, 14]} />
              <meshBasicMaterial
                color={['#4ade80', '#7dd3fc', '#c4b5fd', '#d97757', '#fbbf24', '#a3e635', '#fbbf24', '#7dd3fc'][i]}
                transparent
                opacity={0}
                depthWrite={false}
              />
            </mesh>
            <mesh scale={2.4}>
              <sphereGeometry args={[0.075, 12, 12]} />
              <meshBasicMaterial
                color="#2ee6d6"
                transparent
                opacity={0}
                depthWrite={false}
                blending={THREE.AdditiveBlending}
              />
            </mesh>
          </group>
        )
      })}
      <Dust count={220} radius={3.4} color="#a78bfa" presence={core} />
    </group>
  )
}

/* ============================================================
   3 · COMPARE — chaos on the left resolving into order
   ============================================================ */
const CHAOS_N = 160

export function CompareScene() {
  const p = usePresence(SI.compare)
  const root = useRef()
  const pts = useRef()

  const { chaos, order, geo } = useMemo(() => {
    const chaos = []
    const order = []
    for (let i = 0; i < CHAOS_N; i++) {
      chaos.push(
        new THREE.Vector3(
          -2.2 + (Math.random() - 0.5) * 3.4,
          (Math.random() - 0.5) * 4.2,
          (Math.random() - 0.5) * 2.6 - 0.8
        )
      )
      // ordered target: a clean vertical helix lattice
      const k = i / CHAOS_N
      const a = k * Math.PI * 14
      const row = Math.floor(k * 16)
      order.push(
        new THREE.Vector3(
          1.9 + Math.cos(a) * 0.55,
          -1.9 + row * 0.25,
          Math.sin(a) * 0.55
        )
      )
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(CHAOS_N * 3), 3))
    g.setAttribute('aSize', new THREE.BufferAttribute(new Float32Array(CHAOS_N), 1))
    g.setAttribute('aSeed', new THREE.BufferAttribute(new Float32Array(CHAOS_N).map(() => Math.random()), 1))
    return { chaos, order, geo: g }
  }, [])

  const uni = useMemo(
    () => ({
      uTime: { value: 0 },
      uOpacity: { value: 0 },
      uColor: { value: new THREE.Color('#4ade80') },
      uPixel: { value: 1 },
      uMigrate: { value: 0 },
    }),
    []
  )

  useFrame((st) => {
    const t = st.clock.elapsedTime
    uni.uTime.value = t
    uni.uOpacity.value = p.current
    uni.uPixel.value = st.viewport.dpr || 1
    uni.uMigrate.value = p.current

    if (root.current) {
      root.current.visible = p.current > 0.015
      root.current.rotation.y = Math.sin(t * 0.18) * 0.12 + scrollState.px * 0.14
    }
    const arr = geo.attributes.position.array
    for (let i = 0; i < CHAOS_N; i++) {
      const m = p.current
      const c = chaos[i]
      const o = order[i]
      const wob = (1 - m) * (Math.sin(t * 0.8 + i) * 0.06)
      arr[i * 3] = c.x + (o.x - c.x) * m + wob
      arr[i * 3 + 1] = c.y + (o.y - c.y) * m + wob * 0.6
      arr[i * 3 + 2] = c.z + (o.z - c.z) * m
    }
    geo.attributes.position.needsUpdate = true
  })

  return (
    <group ref={root} position={[0, 0, -1.2]}>
      <points ref={pts} geometry={geo} frustumCulled={false}>
        <shaderMaterial
          vertexShader={DUST_V}
          fragmentShader={DUST_F}
          uniforms={uni}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  )
}

/* ============================================================
   4 · MODULES — four satellites around the planning core
   ============================================================ */
const MOD_COLORS = ['#4ade80', '#c4b5fd', '#fbbf24', '#d97757']

export function ModuleScene({ activeRef }) {
  const p = usePresence(SI.modules)
  const root = useRef()
  const sats = useRef([])
  const core = useRef(0)

  useFrame((st, dt) => {
    const t = st.clock.elapsedTime
    const d = Math.min(dt, 0.05)
    core.current = p.current
    const act = activeRef?.current ?? -1
    if (root.current) {
      root.current.visible = p.current > 0.015
      root.current.rotation.y += d * 0.2
      root.current.position.x = scrollState.px * 0.3
    }
    sats.current.forEach((g, i) => {
      if (!g) return
      const a = (i / 4) * Math.PI * 2 + t * 0.2
      const r = 1.85
      g.position.set(Math.cos(a) * r, Math.sin(a) * r * 0.7, Math.sin(a * 2) * 0.3)
      const hot = act === i
      const base = hot ? 1 : 0.75 + 0.25 * Math.sin(t * 1.2 + i * 1.7)
      g.children[0].material.opacity = p.current * base
      g.children[0].scale.setScalar(hot ? 1.5 : 1)
      g.children[1].material.opacity = p.current * (hot ? 0.4 : 0.24)
    })
  })

  return (
    <group ref={root} position={[0, 0, -1.5]}>
      <GlowCore presence={core} color="#2ee6d6" scale={0.9} />
      {Array.from({ length: 4 }).map((_, i) => (
        <group key={i} ref={(g) => (sats.current[i] = g)}>
          <mesh>
            <icosahedronGeometry args={[0.16, 1]} />
            <meshBasicMaterial color={MOD_COLORS[i]} transparent opacity={0} depthWrite={false} />
          </mesh>
          <mesh scale={2.6}>
            <icosahedronGeometry args={[0.16, 1]} />
            <meshBasicMaterial
              color={MOD_COLORS[i]}
              transparent
              opacity={0}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
        </group>
      ))}
      <Dust count={160} radius={3} color="#2ee6d6" presence={core} size={0.65} />
    </group>
  )
}

/* ============================================================
   6 · TECH STACK — an orrery of technology rings
   ============================================================ */
const STACK_RINGS = [
  { r: 0.95, n: 4, c: '#7dd3fc' },
  { r: 1.35, n: 5, c: '#4ade80' },
  { r: 1.75, n: 6, c: '#c4b5fd' },
  { r: 2.15, n: 7, c: '#fbbf24' },
]

export function StackScene() {
  const p = usePresence(SI.stack)
  const root = useRef()
  const orbit = useRef([])
  const rings = useRef([])
  const core = useRef(0)

  useFrame((st, dt) => {
    const t = st.clock.elapsedTime
    const d = Math.min(dt, 0.05)
    core.current = p.current
    if (root.current) {
      root.current.visible = p.current > 0.015
      root.current.rotation.x = 0.42 + Math.sin(t * 0.15) * 0.06
      root.current.rotation.y = t * 0.14 + scrollState.px * 0.2
      root.current.position.x = scrollState.px * 0.35
    }
    rings.current.forEach((m, i) => {
      if (m) m.material.opacity = p.current * 0.5
    })
    orbit.current.forEach((g, i) => {
      if (!g) return
      g.rotation.y = -t * (0.22 + i * 0.11)
      g.children.forEach((c) => {
        c.material.opacity = p.current * (0.8 + 0.2 * Math.sin(t * 1.6 + i * 2 + c.userData.k))
      })
    })
  })

  return (
    <group ref={root} position={[0, 0, -1.4]}>
      <GlowCore presence={core} color="#a78bfa" scale={0.55} />
      {STACK_RINGS.map((ring, i) => (
        <group key={i} ref={(g) => (orbit.current[i] = g)}>
          <mesh ref={(m) => (rings.current[i] = m)} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[ring.r, 0.0025, 6, 140]} />
            <meshBasicMaterial color={ring.c} transparent opacity={0} depthWrite={false} />
          </mesh>
          {Array.from({ length: ring.n }).map((_, j) => {
            const a = (j / ring.n) * Math.PI * 2
            return (
              <mesh
                key={j}
                position={[Math.cos(a) * ring.r, 0, Math.sin(a) * ring.r]}
                userData={{ k: j * 0.9 + i }}
              >
                <sphereGeometry args={[0.055, 12, 12]} />
                <meshBasicMaterial color={ring.c} transparent opacity={0} depthWrite={false} />
              </mesh>
            )
          })}
        </group>
      ))}
      <Dust count={180} radius={3.2} color="#a78bfa" presence={core} size={0.7} />
    </group>
  )
}

/* ============================================================
   7 · TEAM — a constellation
   ============================================================ */
const TEAM_POS = [
  [-1.5, 0.85, 0],
  [1.5, 0.85, 0],
  [-0.75, -1.05, 0.2],
  [0.75, -1.05, 0.2],
]
const GUIDE_POS = [0, 2.05, -0.2]
const TEAM_EDGES = [
  [0, 2],
  [1, 3],
  [2, 3],
  [0, 1],
  [0, 4],
  [1, 4],
  [2, 4],
  [3, 4],
]

export function TeamScene() {
  const p = usePresence(SI.team)
  const root = useRef()
  const stars = useRef([])
  const lines = useRef([])

  useFrame((st) => {
    const t = st.clock.elapsedTime
    if (root.current) {
      root.current.visible = p.current > 0.015
      root.current.position.x = 2.7 + scrollState.px * 0.3
    }
    stars.current.forEach((g, i) => {
      if (!g) return
      const tw = 0.6 + 0.4 * Math.sin(t * 1.4 + i * 1.9)
      g.children[0].scale.setScalar(0.8 + tw * 0.4)
      g.children[0].material.opacity = p.current * (0.85 + tw * 0.15)
      g.children[1].material.opacity = p.current * tw * 0.34
    })
    lines.current.forEach((m, i) => {
      if (m) m.material.opacity = p.current * (0.13 + 0.1 * Math.sin(t * 1.1 + i))
    })
  })

  return (
    <group ref={root} position={[2.7, 0, 0]}>
      {TEAM_POS.map((pos, i) => (
        <group key={i} ref={(g) => (stars.current[i] = g)} position={pos}>
          <mesh>
            <sphereGeometry args={[0.1, 16, 16]} />
            <meshBasicMaterial color={['#4ade80', '#c4b5fd', '#fbbf24', '#a3e635'][i]} transparent opacity={0} depthWrite={false} />
          </mesh>
          <mesh scale={4}>
            <sphereGeometry args={[0.1, 12, 12]} />
            <meshBasicMaterial
              color={['#4ade80', '#c4b5fd', '#fbbf24', '#a3e635'][i]}
              transparent
              opacity={0}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
        </group>
      ))}
      <group ref={(g) => (stars.current[4] = g)} position={GUIDE_POS}>
        <mesh>
          <octahedronGeometry args={[0.16, 0]} />
          <meshBasicMaterial color="#fbbf24" transparent opacity={0} depthWrite={false} />
        </mesh>
        <mesh scale={4}>
          <octahedronGeometry args={[0.16, 0]} />
          <meshBasicMaterial
            color="#fbbf24"
            transparent
            opacity={0}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      </group>
      {TEAM_EDGES.map(([a, b], i) => (
        <group key={i}>
          <mesh ref={(m) => (lines.current[i] = m)}>
            <sphereGeometry args={[0.004, 6, 6]} />
            <meshBasicMaterial color="#7dd3fc" transparent opacity={0} depthWrite={false} />
          </mesh>
          <Connector
            from={a === 4 ? GUIDE_POS : TEAM_POS[a]}
            to={b === 4 ? GUIDE_POS : TEAM_POS[b]}
            color="#7dd3fc"
            presence={p}
            opacity={0.34}
            radius={0.004}
          />
        </group>
      ))}
      <Dust count={120} radius={3} color="#7dd3fc" presence={p} size={0.6} />
    </group>
  )
}

/* ============================================================
   8 · OUTCOMES — a field of rising light
   ============================================================ */
const BARS = 8

export function OutcomeScene() {
  const p = usePresence(SI.outcomes)
  const root = useRef()
  const bars = useRef([])
  const core = useRef(0)

  useFrame((st, dt) => {
    const t = st.clock.elapsedTime
    const d = Math.min(dt, 0.05)
    core.current = p.current
    if (root.current) {
      root.current.visible = p.current > 0.015
      root.current.rotation.y = Math.sin(t * 0.16) * 0.16 - scrollState.px * 0.16
    }
    bars.current.forEach((m, i) => {
      if (!m) return
      const h = 0.25 + (i / BARS) * 1.5
      const grow = p.current * (1 + Math.sin(t * 1.1 + i * 0.7) * 0.12)
      m.scale.y = Math.max(0.001, h * grow)
      m.position.y = (h * grow) / 2
      m.material.opacity = p.current * 0.62
    })
  })

  return (
    <group ref={root} position={[0, -0.9, -1.8]}>
      {Array.from({ length: BARS }).map((_, i) => {
        const a = (i / BARS) * Math.PI * 2
        const r = 2.1
        return (
          <mesh
            key={i}
            ref={(m) => (bars.current[i] = m)}
            position={[Math.cos(a) * r, 0, Math.sin(a) * r]}
            scale={[1, 0.001, 1]}
          >
            <boxGeometry args={[0.075, 1, 0.075]} />
            <meshBasicMaterial color="#2ee6d6" transparent opacity={0} depthWrite={false} />
          </mesh>
        )
      })}
      <GlowCore presence={core} color="#2ee6d6" scale={0.7} position={[0, 0.6, 0]} />
      <Dust count={200} radius={3.4} color="#a3e635" presence={core} size={0.8} />
    </group>
  )
}

/* shared point shaders for CompareScene */
const DUST_V = /* glsl */ `
attribute float aSize;
attribute float aSeed;
varying float vA;
uniform float uTime;
uniform float uOpacity;
uniform float uPixel;
uniform float uMigrate;
void main(){
  vec3 p = position;
  p.y += sin(uTime * 1.1 + aSeed * 20.0) * 0.05 * (1.0 - uMigrate);
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  vA = mix(0.35 + 0.65 * abs(sin(uTime * 1.6 + aSeed * 30.0)), 0.85, uMigrate);
  gl_PointSize = aSize * uPixel * (30.0 / -mv.z);
  gl_Position = projectionMatrix * mv;
}
`

const DUST_F = /* glsl */ `
precision highp float;
varying float vA;
uniform float uOpacity;
uniform vec3 uColor;
uniform float uMigrate;
void main(){
  float d = length(gl_PointCoord - 0.5);
  float a = smoothstep(0.5, 0.0, d);
  vec3 c = mix(vec3(0.96, 0.44, 0.58), uColor, uMigrate);
  gl_FragColor = vec4(c, a * a * vA * uOpacity);
}
`
