import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { Html } from '@react-three/drei'
import { archNodes, archEdges } from '../data'

/* ============================================================
   Interactive 3D architecture graph.
   Its own canvas inside the section card:
   drag to orbit, hover / click a node to inspect it.
   ============================================================ */

/* ---- hand-tuned layout, mirroring the design diagram ---- */
const LAYOUT = {
  react: [0, 3.15, 0],
  gateway: [0, 1.9, 0],
  user: [-2.55, 0.5, 0],
  trip: [0, 0.5, 0],
  booking: [2.55, 0.5, 0],
  db: [-2.55, -1.5, 0],
  gemini: [0, -1.5, 0],
  travel: [2.55, -1.5, 0],
  maps: [1.2, -3.45, 0],
  weather: [2.55, -3.45, 0],
  hotels: [3.9, -3.45, 0],
}

const curveCache = {}
function edgeCurve(a, b) {
  const key = `${a}|${b}`
  if (curveCache[key]) return curveCache[key]
  const pa = new THREE.Vector3(...LAYOUT[a])
  const pb = new THREE.Vector3(...LAYOUT[b])
  const mid = pa.clone().add(pb).multiplyScalar(0.5)
  mid.z += 0.2
  const c = new THREE.QuadraticBezierCurve3(pa, mid, pb)
  curveCache[key] = c
  return c
}

const isLive = (active, a, b) => !active || active === a || active === b

/* ---------------- edges ---------------- */
function Edges({ active }) {
  const items = useMemo(
    () =>
      archEdges.map(([a, b]) => ({
        key: `${a}-${b}`,
        a,
        b,
        geo: new THREE.TubeGeometry(edgeCurve(a, b), 44, 0.013, 6, false),
      })),
    []
  )
  const refs = useRef([])

  return (
    <>
      {items.map((it, i) => (
        <EdgeMesh key={it.key} it={it} idx={i} refs={refs} active={active} />
      ))}
    </>
  )
}

function EdgeMesh({ it, idx, refs, active }) {
  const ref = useRef()
  useFrame((st) => {
    if (!ref.current) return
    const live = isLive(active, it.a, it.b)
    const pulse = 0.4 + 0.18 * Math.sin(st.clock.elapsedTime * 1.6 + idx)
    ref.current.material.opacity = live ? pulse : 0.09
  })
  return (
    <mesh ref={(m) => {
      refs.current[idx] = m
      ref.current = m
    }} geometry={it.geo}>
      <meshBasicMaterial color="#7dd3fc" transparent opacity={0.4} depthWrite={false} />
    </mesh>
  )
}

/* ---------------- data pulses along the edges ---------------- */
const PULSES_PER_EDGE = 2
const TOTAL = archEdges.length * PULSES_PER_EDGE

function Pulses({ active }) {
  const ref = useRef()
  const tmp = useMemo(() => ({ p: new THREE.Vector3(), m: new THREE.Matrix4() }), [])

  const geo = useMemo(() => new THREE.SphereGeometry(0.052, 10, 10), [])
  const mat = useMemo(
    () => new THREE.MeshBasicMaterial({ color: '#2ee6d6', transparent: true, opacity: 0.5, depthWrite: false }),
    []
  )

  useEffect(() => () => {
    geo.dispose()
    mat.dispose()
  }, [geo, mat])

  useFrame((st) => {
    const inst = ref.current
    if (!inst) return
    const t = st.clock.elapsedTime
    archEdges.forEach(([a, b], e) => {
      const curve = edgeCurve(a, b)
      for (let k = 0; k < PULSES_PER_EDGE; k++) {
        const u = (t * 0.24 + k * 0.5 + e * 0.11) % 1
        curve.getPoint(u, tmp.p)
        tmp.m.setPosition(tmp.p)
        inst.setMatrixAt(e * PULSES_PER_EDGE + k, tmp.m)
      }
    })
    inst.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh
      ref={(m) => {
        if (m) m.instanceMatrix.setUsage(THREE.DynamicDrawUsage)
        ref.current = m
      }}
      args={[geo, mat, TOTAL]}
      frustumCulled={false}
    />
  )
}

/* ---------------- one node ---------------- */
function Node({ node, active, setActive }) {
  const g = useRef()
  const core = useRef()
  const halo = useRef()
  const ring = useRef()
  const [hover, setHover] = useState(false)
  const col = node.c
  const pos = LAYOUT[node.id]

  useFrame((st) => {
    const t = st.clock.elapsedTime
    const on = active === node.id
    const hot = hover || on

    if (g.current) g.current.position.y = pos[1] + Math.sin(t * 0.9 + pos[0]) * 0.055
    if (core.current) {
      core.current.material.opacity = hot ? 1 : 0.6
      core.current.scale.setScalar(on ? 1.3 : hot ? 1.12 : 1)
    }
    if (halo.current) {
      halo.current.material.opacity = hot ? 0.3 : 0.13
      halo.current.scale.setScalar((on ? 1.55 : hot ? 1.2 : 1) + Math.sin(t * 1.6) * 0.05)
    }
    if (ring.current) {
      const k = (t * 0.55 + pos[0] * 0.3) % 1
      ring.current.scale.setScalar(0.7 + k * 1.6)
      ring.current.material.opacity = (hot ? 0.65 : 0.3) * (1 - k)
      ring.current.lookAt(st.camera.position)
    }
  })

  return (
    <group
      ref={g}
      position={pos}
      onPointerOver={(e) => {
        e.stopPropagation()
        setHover(true)
        setActive(node.id)
      }}
      onPointerOut={(e) => {
        e.stopPropagation()
        setHover(false)
      }}
      onClick={(e) => {
        e.stopPropagation()
        setActive((a) => (a === node.id ? null : node.id))
      }}
    >
      <mesh ref={core}>
        <icosahedronGeometry args={[0.2, 1]} />
        <meshBasicMaterial color={col} transparent opacity={0.6} depthWrite={false} />
      </mesh>
      <mesh ref={halo} scale={2.2}>
        <icosahedronGeometry args={[0.2, 1]} />
        <meshBasicMaterial color={col} transparent opacity={0.13} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
      <mesh ref={ring}>
        <ringGeometry args={[0.23, 0.26, 28]} />
        <meshBasicMaterial color={col} transparent opacity={0.4} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>

      <Html center distanceFactor={9.5} position={[0, 0.54, 0]} zIndexRange={[24, 0]}>
        <div className="ar-label" style={{ '--nc': col }}>
          <b>{node.label}</b>
          <span>{node.lvl}</span>
        </div>
      </Html>
    </group>
  )
}

/* ---------------- camera rig with drag-to-orbit ---------------- */
function Rig() {
  const camera = useThree((s) => s.camera)
  const dom = useThree((s) => s.gl.domElement)
  const s = useRef({ a: 0.42, e: 0.2, r: 11.8, drag: false, px: 0, py: 0, idle: 0 })

  useEffect(() => {
    const st = s.current
    const down = (e) => {
      st.drag = true
      st.px = e.clientX
      st.py = e.clientY
      dom.style.cursor = 'grabbing'
    }
    const move = (e) => {
      if (!st.drag) return
      st.a -= (e.clientX - st.px) * 0.006
      st.e = Math.max(-0.5, Math.min(0.8, st.e + (e.clientY - st.py) * 0.004))
      st.px = e.clientX
      st.py = e.clientY
    }
    const up = () => {
      st.drag = false
      dom.style.cursor = 'grab'
    }
    dom.style.cursor = 'grab'
    dom.addEventListener('pointerdown', down)
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    window.addEventListener('pointerleave', up)
    return () => {
      dom.removeEventListener('pointerdown', down)
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      window.removeEventListener('pointerleave', up)
    }
  }, [dom])

  useFrame((_, dt) => {
    const st = s.current
    if (!st.drag) {
      st.idle += Math.min(dt, 0.05)
      if (st.idle > 1.6) st.a += Math.min(dt, 0.05) * 0.13
    } else st.idle = 0

    const x = st.r * Math.sin(st.e) * Math.sin(st.a)
    const y = st.r * Math.sin(st.e) * Math.cos(st.a) * 0.5
    const z = st.r * Math.cos(st.e)
    const k = Math.min(1, dt * 4)
    camera.position.x += (x - camera.position.x) * k
    camera.position.y += (y + 0.35 - camera.position.y) * k
    camera.position.z += (z - camera.position.z) * k
    camera.lookAt(0, -0.15, 0)
  })

  return null
}

/* ---------------- root ---------------- */
export default function ArchCanvas({ active, setActive }) {
  return (
    <Canvas
      dpr={[1, 1.6]}
      gl={{ antialias: true, alpha: true }}
      camera={{ position: [4.6, 2.4, 10], fov: 42 }}
      onPointerMissed={() => setActive(null)}
    >
      <Rig />
      <Edges active={active} />
      <Pulses active={active} />
      {archNodes.map((n) => (
        <Node key={n.id} node={n} active={active} setActive={setActive} />
      ))}
    </Canvas>
  )
}
