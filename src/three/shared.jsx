import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

/* ============================================================
   Shared 3D primitives reused across the section scenes
   ============================================================ */

const coreVert = /* glsl */ `
varying vec3 vN;
varying vec3 vW;
varying vec3 vP;
void main(){
  vP = position;
  vN = normalize(normalMatrix * normal);
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vW = wp.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
}
`

const shellFrag = /* glsl */ `
precision highp float;
varying vec3 vN;
varying vec3 vW;
varying vec3 vP;
uniform float uTime;
uniform float uOpacity;
uniform vec3  uColor;
void main(){
  vec3 n = normalize(vN);
  vec3 V = normalize(cameraPosition - vW);
  float fres = pow(1.0 - abs(dot(n, V)), 2.4);
  float bands = 0.5 + 0.5 * sin(vP.y * 9.0 - uTime * 1.6);
  vec3 c = mix(uColor, vec3(1.0), fres * 0.55);
  gl_FragColor = vec4(c, fres * (0.34 + 0.26 * bands) * uOpacity);
}
`

/** Pulsing energy core used as the focal point of several sections */
export function GlowCore({ color = '#2ee6d6', presence, scale = 1, position = [0, 0, 0] }) {
  const g = useRef()
  const shell = useRef()
  const wire = useRef()
  const uni = useMemo(
    () => ({ uTime: { value: 0 }, uOpacity: { value: 0 }, uColor: { value: new THREE.Color(color) } }),
    [color]
  )

  useFrame((st, dt) => {
    const t = st.clock.elapsedTime
    const p = presence ? presence.current : 1
    uni.uTime.value = t
    uni.uOpacity.value = p
    if (g.current) {
      g.current.visible = p > 0.01
      const s = scale * (0.8 + 0.2 * p) * (1 + Math.sin(t * 1.3) * 0.035)
      g.current.scale.setScalar(s)
      g.current.rotation.y = t * 0.22
      g.current.rotation.x = t * 0.13
    }
    if (wire.current) wire.current.material.opacity = p * 0.32
    if (shell.current) shell.current.rotation.y = -t * 0.16
  })

  return (
    <group ref={g} position={position}>
      <mesh>
        <icosahedronGeometry args={[0.42, 1]} />
        <meshBasicMaterial color={color} transparent opacity={0.10} depthWrite={false} />
      </mesh>
      <mesh ref={wire}>
        <icosahedronGeometry args={[0.56, 1]} />
        <meshBasicMaterial color={color} wireframe transparent opacity={0} depthWrite={false} />
      </mesh>
      <mesh ref={shell} scale={1.5}>
        <icosahedronGeometry args={[0.42, 3]} />
        <shaderMaterial
          vertexShader={coreVert}
          fragmentShader={shellFrag}
          uniforms={uni}
          transparent
          side={THREE.BackSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  )
}

/* ---------------- dust particles ---------------- */

const dustVert = /* glsl */ `
attribute float aSize;
attribute float aSeed;
varying float vA;
uniform float uTime;
uniform float uOpacity;
uniform float uPixel;
void main(){
  vec3 p = position;
  p.y += sin(uTime * 0.35 + aSeed * 9.0) * 0.14;
  p.x += cos(uTime * 0.27 + aSeed * 6.0) * 0.11;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  vA = (0.35 + 0.65 * abs(sin(uTime * 0.8 + aSeed * 20.0)));
  gl_PointSize = aSize * uPixel * (36.0 / -mv.z);
  gl_Position = projectionMatrix * mv;
}
`

const dustFrag = /* glsl */ `
precision highp float;
varying float vA;
uniform float uOpacity;
uniform vec3 uColor;
void main(){
  float d = length(gl_PointCoord - 0.5);
  float a = smoothstep(0.5, 0.0, d);
  gl_FragColor = vec4(uColor, a * a * vA * uOpacity);
}
`

/** Drifting dust field */
export function Dust({ count = 260, radius = 5, color = '#2ee6d6', presence, size = 1 }) {
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry()
    const pos = new Float32Array(count * 3)
    const sz = new Float32Array(count)
    const sd = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      const th = Math.random() * Math.PI * 2
      const ph = Math.acos(2 * Math.random() - 1)
      const r = radius * (0.35 + Math.random() * 0.65)
      pos[i * 3] = r * Math.sin(ph) * Math.cos(th)
      pos[i * 3 + 1] = r * Math.cos(ph) * 0.62
      pos[i * 3 + 2] = r * Math.sin(ph) * Math.sin(th)
      sz[i] = (0.6 + Math.random() * 1.9) * size
      sd[i] = Math.random()
    }
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    g.setAttribute('aSize', new THREE.BufferAttribute(sz, 1))
    g.setAttribute('aSeed', new THREE.BufferAttribute(sd, 1))
    return g
  }, [count, radius, size])

  const uni = useMemo(
    () => ({
      uTime: { value: 0 },
      uOpacity: { value: 0 },
      uColor: { value: new THREE.Color(color) },
      uPixel: { value: 1 },
    }),
    [color]
  )

  useFrame((st) => {
    uni.uTime.value = st.clock.elapsedTime
    uni.uOpacity.value = presence ? presence.current : 1
    uni.uPixel.value = st.viewport.dpr || 1
  })

  return (
    <points geometry={geo} frustumCulled={false}>
      <shaderMaterial
        vertexShader={dustVert}
        fragmentShader={dustFrag}
        uniforms={uni}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}

/* ---------------- dom anchor ---------------- */

/**
 * Converts a DOM element's viewport rect into a world position and a
 * uniform scale on the plane at depth `z`, so a 3D object can be pinned
 * exactly to a slot reserved for it in the page layout.
 *
 * `wpp` is world-units-per-pixel at that depth, so an object whose local
 * bounding sphere has diameter `localSize` needs scale = pixels * wpp / localSize
 * to fill the slot.
 */
export function useDomAnchor(id, z = 0, localSize = 1) {
  const out = useRef({ x: 0, y: 0, scale: 1, ready: false })
  useFrame((st) => {
    const el = document.getElementById(id)
    if (!el) return
    const r = el.getBoundingClientRect()
    if (r.width < 2 || r.height < 2) return
    const cam = st.camera
    const wpp = (2 * Math.tan(((cam.fov ?? 42) * Math.PI) / 360)) / st.size.height
    out.current.x = (r.left + r.width / 2 - st.size.width / 2) * wpp
    out.current.y = -(r.top + r.height / 2 - st.size.height / 2) * wpp
    out.current.scale = (Math.min(r.width, r.height) * wpp) / localSize
    out.current.ready = true
  })
  return out
}

/* ---------------- hovering ring stack ---------------- */

/** Rotating orbital rings, used as a decorative frame */
export function Rings({ presence, radii = [1.1, 1.35, 1.6], color = '#38bdf8', speed = 0.3 }) {
  const g = useRef()
  const mats = useRef([])

  useFrame((st, dt) => {
    const t = st.clock.elapsedTime
    const p = presence ? presence.current : 1
    if (g.current) {
      g.current.visible = p > 0.01
      g.current.rotation.y += Math.min(dt, 0.05) * speed
    }
    mats.current.forEach((m, i) => {
      if (m) m.opacity = p * (0.30 - i * 0.06)
    })
  })

  return (
    <group ref={g}>
      {radii.map((r, i) => (
        <mesh
          key={r}
          rotation={[Math.PI * (0.18 + i * 0.3), i * 1.1, i * 0.6]}
        >
          <torusGeometry args={[r, 0.0022 + i * 0.0008, 6, 130]} />
          <meshBasicMaterial
            ref={(m) => (mats.current[i] = m)}
            color={color}
            transparent
            opacity={0}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  )
}
