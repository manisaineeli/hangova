import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { NOISE, PALETTE } from '../lib/glsl'
import { scrollState, presenceAt, SI } from '../lib/scroll'

/* ============================================================
   Landscape — the hero "nature & place" scene.

   Layered ridged mountains, a still lake with sun glitter,
   a pine treeline, drifting valley mist, a flock of birds and
   fireflies. Fully procedural: nothing is loaded from disk.
   ============================================================ */

/* sun placement, shared with the Sky backdrop so the glow lines up */
export const SUN_WORLD = [-3.2, 0.42, -9.6]
export const SUN_UV = [0.35, 0.545]

/* ---------------- deterministic value noise (JS side) ---------------- */
function hash(i, seed) {
  const s = Math.sin(i * 127.1 + seed * 311.7) * 43758.5453123
  return s - Math.floor(s)
}
function vnoise(x, seed) {
  const i = Math.floor(x)
  const f = x - i
  const u = f * f * (3 - 2 * f)
  return hash(i, seed) * (1 - u) + hash(i + 1, seed) * u
}
function ridged(u, seed, oct = 6) {
  let v = 0
  let a = 0.5
  let fr = 3.2
  for (let o = 0; o < oct; o++) {
    v += a * (1 - Math.abs(vnoise(u * fr, seed + o * 17) * 2 - 1))
    fr *= 2.07
    a *= 0.52
  }
  return v
}
/** stable pseudo-random in [0,1) for deterministic placement */
const rnd = (i, k) => hash(i * 12.9898 + k * 78.233, 4.7)

/* ---------------- ridge geometry ---------------- */
function makeRidge({ width, segs, baseY, amp, drop, seed, env }) {
  const n = segs + 1
  const pos = new Float32Array(n * 2 * 3)
  const uv = new Float32Array(n * 2 * 2)
  const light = new Float32Array(n * 2)
  const idx = []
  const hs = new Array(n)

  for (let i = 0; i < n; i++) hs[i] = ridged(i / segs, seed) * env(i / segs) * amp

  for (let i = 0; i < n; i++) {
    const u = i / segs
    const x = (u - 0.5) * width
    const a = i * 2

    pos[a * 3] = x
    pos[a * 3 + 1] = baseY + hs[i]
    pos[a * 3 + 2] = 0
    uv[a * 2] = u
    uv[a * 2 + 1] = 1

    pos[(a + 1) * 3] = x
    pos[(a + 1) * 3 + 1] = baseY - drop
    pos[(a + 1) * 3 + 2] = 0
    uv[(a + 1) * 2] = u
    uv[(a + 1) * 2 + 1] = 0

    // slope facing the sun (which sits left of centre) -> lit or shaded
    const prev = hs[Math.max(0, i - 1)]
    const next = hs[Math.min(n - 1, i + 1)]
    const l = THREE.MathUtils.clamp(0.5 - (next - prev) * 1.6, 0, 1)
    light[a] = l
    light[a + 1] = l * 0.3

    if (i < segs) idx.push(a, a + 1, a + 2, a + 2, a + 1, a + 3)
  }

  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2))
  g.setAttribute('aLight', new THREE.BufferAttribute(light, 1))
  g.setIndex(idx)
  g.computeVertexNormals()
  return g
}

/* ---------------- ridge shader ---------------- */
const ridgeVert = /* glsl */ `
attribute float aLight;
varying vec2 vUv;
varying float vLight;
void main(){
  vUv = uv;
  vLight = aLight;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

const ridgeFrag = /* glsl */ `
precision highp float;
varying vec2 vUv;
varying float vLight;
uniform vec3  uBase;
uniform vec3  uTip;
uniform vec3  uSnow;
uniform vec3  uSun;
uniform float uSnowAmt;
uniform float uHaze;
uniform float uOpacity;
uniform float uSeed;

${NOISE}

void main(){
  float hgt = vUv.y;
  vec3 c = mix(uBase, uTip, smoothstep(0.0, 1.0, hgt));

  /* snow / pale rock near the ridge line */
  float sn = smoothstep(0.70, 0.97, hgt) * uSnowAmt;
  c = mix(c, uSnow, sn);

  /* rock texture */
  c *= 0.88 + 0.24 * fbm3(vec2(vUv.x * 34.0 + uSeed, vUv.y * 9.0 + uSeed));

  /* conifer dither along the lower slopes */
  float tl = smoothstep(0.34, 0.06, hgt);
  c = mix(c, uBase * 0.62, tl * smoothstep(0.35, 0.75, fbm3(vec2(vUv.x * 120.0, hgt * 26.0))) * 0.5);

  /* directional light from the low sun */
  c *= mix(0.60, 1.28, vLight);
  c += uSun * pow(vLight, 3.5) * 0.30 * (1.0 - sn * 0.6);

  /* atmospheric haze pooling at the base */
  c = mix(c, vec3(0.24, 0.36, 0.36), smoothstep(0.30, 0.0, hgt) * uHaze);

  gl_FragColor = vec4(c, uOpacity);
}
`

function Mountains({ layer, presence }) {
  const mat = useRef()
  const mesh = useRef()

  const geo = useMemo(
    () =>
      makeRidge({
        width: layer.width,
        segs: 200,
        baseY: layer.baseY,
        amp: layer.amp,
        drop: 8,
        seed: layer.seed,
        env: layer.env,
      }),
    [layer]
  )

  useFrame((st) => {
    if (mat.current) {
      mat.current.uniforms.uOpacity.value = presence.current
    }
    if (mesh.current) {
      mesh.current.position.x = layer.x + scrollState.px * layer.par
    }
  })

  return (
    <mesh ref={mesh} geometry={geo} position={[layer.x, 0, layer.z]}>
      <shaderMaterial
        ref={mat}
        vertexShader={ridgeVert}
        fragmentShader={ridgeFrag}
        uniforms={{
          uBase: { value: new THREE.Color(layer.base) },
          uTip: { value: new THREE.Color(layer.tip) },
          uSnow: { value: new THREE.Color(layer.snow) },
          uSun: { value: new THREE.Color('#ffcf7a') },
          uSnowAmt: { value: layer.snowAmt },
          uHaze: { value: layer.haze },
          uOpacity: { value: 0 },
          uSeed: { value: layer.seed * 3.7 },
        }}
        transparent
        depthWrite={false}
      />
    </mesh>
  )
}

/* ---------------- lake ---------------- */
const lakeVert = /* glsl */ `
varying vec2 vUv;
void main(){
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

const lakeFrag = /* glsl */ `
precision highp float;
varying vec2 vUv;
uniform float uTime;
uniform float uOpacity;
uniform float uSunU;

${NOISE}
${PALETTE}

void main(){
  /* uv.y: 0 = far shore, 1 = near viewer */
  float depth = vUv.y;

  vec2 q = vec2(vUv.x * 26.0, vUv.y * 150.0 - uTime * 0.55);
  float r1 = fbm(q);
  float r2 = fbm3(q * 2.3 + vec2(uTime * 0.12, 0.0));

  vec3 deep = vec3(0.016, 0.075, 0.090);
  vec3 shal = vec3(0.055, 0.185, 0.205);
  vec3 c = mix(shal, deep, smoothstep(0.0, 0.65, depth));

  /* smeared mountain reflection */
  float refl = fbm3(vec2(vUv.x * 8.0, (1.0 - depth) * 26.0 + uTime * 0.10));
  c = mix(c, vec3(0.10, 0.20, 0.22), refl * 0.30 * (1.0 - depth));

  /* sun glitter column */
  float col = exp(-pow((vUv.x - uSunU) * 7.0, 2.0));
  float glint = smoothstep(0.42, 0.92, r1 * 0.6 + r2 * 0.6);
  c += C_SUN * glint * col * (0.55 + 0.45 * sin(uTime * 2.1)) * 0.85;

  /* ripple crests catch a little sky */
  c += C_SKY * smoothstep(0.55, 0.95, r2) * 0.10;

  /* mist softening the far shore, shadow right at the viewer */
  c = mix(c, vec3(0.22, 0.34, 0.34), smoothstep(0.30, 0.0, depth) * 0.55);
  c = mix(c, deep * 0.7, smoothstep(0.72, 1.0, depth) * 0.5);

  gl_FragColor = vec4(c, uOpacity);
}
`

function Lake({ presence }) {
  const mat = useRef()
  useFrame((st) => {
    if (!mat.current) return
    mat.current.uniforms.uTime.value = st.clock.elapsedTime
    mat.current.uniforms.uOpacity.value = presence.current
  })
  return (
    <mesh position={[0, -2.2, 0.6]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[30, 11, 1, 1]} />
      <shaderMaterial
        ref={mat}
        vertexShader={lakeVert}
        fragmentShader={lakeFrag}
        uniforms={{
          uTime: { value: 0 },
          uOpacity: { value: 0 },
          uSunU: { value: 0.39 },
        }}
        transparent
        depthWrite={false}
      />
    </mesh>
  )
}

/* ---------------- pine treeline ---------------- */
const treeVert = /* glsl */ `
attribute float aPhase;
attribute float aScale;
attribute float aTint;
varying float vUp;
varying float vShade;
varying float vTint;
uniform float uTime;
void main(){
  vec3 p = position * aScale;
  /* sway grows with height */
  float up = clamp(p.y / (1.3 * aScale), 0.0, 1.0);
  vUp = up;
  vTint = aTint;
  float sway = sin(uTime * 0.7 + aPhase) * 0.055 + sin(uTime * 1.6 + aPhase * 2.1) * 0.018;
  p.x += sway * up * up * aScale * 8.0;
  p.z += sway * 0.45 * up * up * aScale * 8.0;
  vShade = 0.5 + 0.5 * sway * 6.0;
  gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(p, 1.0);
}
`

const treeFrag = /* glsl */ `
precision highp float;
varying float vUp;
varying float vShade;
varying float vTint;
uniform vec3  uDark;
uniform vec3  uLight;
uniform float uOpacity;
void main(){
  vec3 c = mix(uDark, uLight, pow(vUp, 0.8));
  c *= 0.80 + 0.32 * vShade;
  c *= 0.86 + 0.28 * vTint;
  gl_FragColor = vec4(c, uOpacity);
}
`

/** minimal geometry merge — avoids pulling in the addons bundle */
function mergeGeoms(list) {
  let vCount = 0
  let iCount = 0
  for (const g of list) {
    vCount += g.attributes.position.count
    iCount += g.index ? g.index.count : g.attributes.position.count
  }
  const pos = new Float32Array(vCount * 3)
  const nor = new Float32Array(vCount * 3)
  const idx = new Uint32Array(iCount)
  let vo = 0
  let io = 0
  for (const g of list) {
    if (!g.attributes.normal) g.computeVertexNormals()
    pos.set(g.attributes.position.array, vo * 3)
    nor.set(g.attributes.normal.array, vo * 3)
    const n = g.attributes.position.count
    if (g.index) {
      for (let i = 0; i < g.index.count; i++) idx[io++] = g.index.array[i] + vo
    } else {
      for (let i = 0; i < n; i++) idx[io++] = i + vo
    }
    vo += n
  }
  const out = new THREE.BufferGeometry()
  out.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  out.setAttribute('normal', new THREE.BufferAttribute(nor, 3))
  out.setIndex(new THREE.BufferAttribute(idx, 1))
  return out
}

function Forest({
  presence,
  count = 70,
  z = 1.4,
  spread = 10,
  y = -2.2,
  scale = 0.85,
  seed = 1,
  dark = false,
}) {
  const mat = useRef()
  const ref = useRef()
  const fade = useRef(0)

  const geo = useMemo(() => {
    const parts = [
      new THREE.CylinderGeometry(0.022, 0.035, 0.34, 5).translate(0, 0.17, 0),
      new THREE.ConeGeometry(0.20, 0.62, 7).translate(0, 0.50, 0),
      new THREE.ConeGeometry(0.145, 0.52, 7).translate(0, 0.80, 0),
      new THREE.ConeGeometry(0.085, 0.42, 7).translate(0, 1.04, 0),
    ]
    const g = mergeGeoms(parts)
    parts.forEach((p) => p.dispose())
    g.computeVertexNormals()
    return g
  }, [])

  /* per-instance attributes, so every tree sways on its own phase */
  const inst = useMemo(() => {
    const phase = new Float32Array(count)
    const scl = new Float32Array(count)
    const tint = new Float32Array(count)
    const place = []
    for (let i = 0; i < count; i++) {
      phase[i] = rnd(i, seed) * 100
      scl[i] = (0.55 + rnd(i, seed + 1) * 0.85) * scale
      tint[i] = rnd(i, seed + 6)
      const u = i / count
      const x = (u - 0.5) * spread * 2 + (rnd(i, seed + 2) - 0.5) * 0.9
      const zz = z + (rnd(i, seed + 3) - 0.5) * 0.8
      const yy = y - Math.abs(zz - z) * 0.25 + rnd(i, seed + 4) * 0.06
      place.push([x, yy, zz, rnd(i, seed + 5) * Math.PI * 2])
    }
    const g = geo.clone()
    g.setAttribute('aPhase', new THREE.InstancedBufferAttribute(phase, 1))
    g.setAttribute('aScale', new THREE.InstancedBufferAttribute(scl, 1))
    g.setAttribute('aTint', new THREE.InstancedBufferAttribute(tint, 1))
    return { geo: g, place }
  }, [geo, count, spread, y, z, scale, seed])

  const mats = useMemo(
    () => inst.place.map(([x, yy, zz, ry]) => new THREE.Matrix4().makeRotationY(ry).setPosition(x, yy, zz)),
    [inst]
  )

  useFrame((st, dt) => {
    fade.current += (presence.current - fade.current) * Math.min(1, Math.min(dt, 0.05) * 4)
    if (mat.current) {
      mat.current.uniforms.uTime.value = st.clock.elapsedTime
      mat.current.uniforms.uOpacity.value = fade.current
    }
    if (ref.current) {
      ref.current.visible = fade.current > 0.01
      for (let i = 0; i < count; i++) ref.current.setMatrixAt(i, mats[i])
      ref.current.instanceMatrix.needsUpdate = true
    }
  })

  return (
    <instancedMesh ref={ref} args={[inst.geo, undefined, count]} frustumCulled={false}>
      <shaderMaterial
        ref={mat}
        vertexShader={treeVert}
        fragmentShader={treeFrag}
        uniforms={{
          uTime: { value: 0 },
          uOpacity: { value: 0 },
          uDark: { value: new THREE.Color(dark ? '#04120d' : '#0a2b1e') },
          uLight: { value: new THREE.Color(dark ? '#0c2a20' : '#2f7d54') },
        }}
        transparent
        depthWrite={false}
      />
    </instancedMesh>
  )
}

/* ---------------- drifting valley mist ---------------- */
const mistVert = /* glsl */ `
varying vec2 vUv;
void main(){
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

const mistFrag = /* glsl */ `
precision highp float;
varying vec2 vUv;
uniform float uTime;
uniform float uOpacity;
uniform vec3  uColor;
${NOISE}
void main(){
  float n = fbm(vec2(vUv.x * 3.4 + uTime * 0.045, vUv.y * 2.2 + uTime * 0.012));
  float edge = smoothstep(0.0, 0.30, vUv.x) * smoothstep(1.0, 0.70, vUv.x);
  float vert = smoothstep(0.0, 0.55, vUv.y) * smoothstep(1.0, 0.35, vUv.y);
  float a = smoothstep(0.05, 0.65, n * 0.5 + 0.5) * edge * vert;
  gl_FragColor = vec4(uColor, a * uOpacity);
}
`

function Mist({ presence, y, z, w, h, speed = 1, color = '#a8cbc4', o = 0.3, par = 0 }) {
  const mat = useRef()
  const mesh = useRef()
  useFrame((st) => {
    if (mat.current) {
      mat.current.uniforms.uTime.value = st.clock.elapsedTime * speed
      mat.current.uniforms.uOpacity.value = presence.current * o
    }
    if (mesh.current) {
      mesh.current.position.x = Math.sin(st.clock.elapsedTime * 0.05 * speed) * 1.6 + scrollState.px * par
    }
  })
  return (
    <mesh ref={mesh} position={[0, y, z]}>
      <planeGeometry args={[w, h]} />
      <shaderMaterial
        ref={mat}
        vertexShader={mistVert}
        fragmentShader={mistFrag}
        uniforms={{
          uTime: { value: 0 },
          uOpacity: { value: 0 },
          uColor: { value: new THREE.Color(color) },
        }}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  )
}

/* ---------------- birds ---------------- */
const BIRD_N = 13

function Birds({ presence }) {
  const g = useRef()
  const wings = useRef([])

  const paths = useMemo(
    () =>
      Array.from({ length: BIRD_N }, (_, i) => ({
        r: 3.2 + (i % 5) * 0.85,
        y: 1.15 + ((i * 37) % 11) * 0.11,
        sp: 0.085 + ((i * 13) % 7) * 0.006,
        ph: (i / BIRD_N) * Math.PI * 2,
        flap: 5.5 + ((i * 17) % 9) * 0.5,
        sc: 0.075 + ((i * 7) % 5) * 0.014,
        dir: i % 2 ? 1 : -1,
      })),
    []
  )

  useFrame((st) => {
    const t = st.clock.elapsedTime
    const f = presence.current
    if (g.current) g.current.visible = f > 0.02
    for (let i = 0; i < paths.length; i++) {
      const grp = g.current?.children[i]
      if (!grp) continue
      const b = paths[i]
      const a = b.ph + t * b.sp * b.dir
      grp.position.set(
        Math.cos(a) * b.r,
        b.y + Math.sin(a * 2.3) * 0.18,
        Math.sin(a) * b.r * 0.42 - 1.5
      )
      grp.rotation.y = -a + (b.dir > 0 ? Math.PI / 2 : -Math.PI / 2)
      const flap = Math.sin(t * b.flap + i) * 0.85
      const w1 = wings.current[i * 2]
      const w2 = wings.current[i * 2 + 1]
      if (w1) w1.rotation.z = flap
      if (w2) w2.rotation.z = -flap
      for (let c = 0; c < grp.children.length; c++) grp.children[c].material.opacity = f * 0.85
    }
  })

  return (
    <group ref={g}>
      {paths.map((b, i) => (
        <group key={i} scale={b.sc}>
          <mesh ref={(m) => (wings.current[i * 2] = m)} position={[-0.5, 0, 0]}>
            <planeGeometry args={[1, 0.34]} />
            <meshBasicMaterial color="#22323c" transparent opacity={0} side={THREE.DoubleSide} depthWrite={false} />
          </mesh>
          <mesh ref={(m) => (wings.current[i * 2 + 1] = m)} position={[0.5, 0, 0]}>
            <planeGeometry args={[1, 0.34]} />
            <meshBasicMaterial color="#22323c" transparent opacity={0} side={THREE.DoubleSide} depthWrite={false} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

/* ---------------- fireflies ---------------- */
const ffVert = /* glsl */ `
attribute float aSize;
attribute float aSeed;
varying float vA;
uniform float uTime;
uniform float uPixel;
void main(){
  vec3 p = position;
  p.x += sin(uTime * 0.35 + aSeed * 12.0) * 0.45;
  p.y += sin(uTime * 0.27 + aSeed * 20.0) * 0.28;
  p.z += cos(uTime * 0.31 + aSeed * 15.0) * 0.30;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  vA = pow(max(sin(uTime * 1.3 + aSeed * 30.0), 0.0), 2.0);
  gl_PointSize = aSize * uPixel * (30.0 / -mv.z);
  gl_Position = projectionMatrix * mv;
}
`

const ffFrag = /* glsl */ `
precision highp float;
varying float vA;
uniform float uOpacity;
void main(){
  float d = length(gl_PointCoord - 0.5);
  float a = smoothstep(0.5, 0.05, d);
  gl_FragColor = vec4(vec3(1.0, 0.92, 0.55), a * a * vA * uOpacity);
}
`

function Fireflies({ presence, count = 70 }) {
  const mat = useRef()
  const geo = useMemo(() => {
    const pos = new Float32Array(count * 3)
    const sz = new Float32Array(count)
    const sd = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 16
      pos[i * 3 + 1] = -2.05 + Math.random() * 1.6
      pos[i * 3 + 2] = 0.2 + (Math.random() - 0.5) * 4
      sz[i] = 0.7 + Math.random() * 1.5
      sd[i] = Math.random()
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    g.setAttribute('aSize', new THREE.BufferAttribute(sz, 1))
    g.setAttribute('aSeed', new THREE.BufferAttribute(sd, 1))
    return g
  }, [count])

  useFrame((st) => {
    if (!mat.current) return
    mat.current.uniforms.uTime.value = st.clock.elapsedTime
    mat.current.uniforms.uOpacity.value = presence.current
    mat.current.uniforms.uPixel.value = st.viewport.dpr || 1
  })

  return (
    <points geometry={geo} frustumCulled={false}>
      <shaderMaterial
        ref={mat}
        vertexShader={ffVert}
        fragmentShader={ffFrag}
        uniforms={{ uTime: { value: 0 }, uOpacity: { value: 0 }, uPixel: { value: 1 } }}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}

/* ============================================================
   Root
   ============================================================ */
const LAYERS = [
  {
    z: -9.0, x: -1.0, par: -0.10, baseY: -0.55, amp: 0.98, width: 27, seed: 3.1,
    base: '#2f5468', tip: '#84abc0', snow: '#e8f3fb', snowAmt: 0.70, haze: 0.42,
    env: (u) => 0.30 + 0.70 * Math.pow(Math.sin(Math.PI * Math.min(1, Math.max(0, u))), 0.5),
  },
  {
    z: -6.2, x: 1.2, par: -0.26, baseY: -1.10, amp: 0.80, width: 20, seed: 7.7,
    base: '#1c4a45', tip: '#52978a', snow: '#dcefe9', snowAmt: 0.28, haze: 0.26,
    env: (u) => 0.26 + 0.74 * Math.pow(Math.sin(Math.PI * Math.min(1, Math.max(0, u * 0.94 + 0.05))), 0.7),
  },
  {
    z: -3.8, x: -0.6, par: -0.44, baseY: -1.60, amp: 0.58, width: 15, seed: 12.4,
    base: '#0d3229', tip: '#2b7551', snow: '#cfe8dd', snowAmt: 0.05, haze: 0.12,
    env: (u) => 0.30 + 0.70 * Math.pow(Math.sin(Math.PI * Math.min(1, Math.max(0, u * 0.9 + 0.08))), 0.85),
  },
]

export default function Landscape() {
  const root = useRef()
  const presence = useRef(0)
  const sunLight = useRef()

  useFrame((st, dt) => {
    const t = st.clock.elapsedTime
    const d = Math.min(dt, 0.05)
    presence.current += (presenceAt(scrollState.progress, SI.home) - presence.current) * Math.min(1, d * 4)

    if (root.current) {
      root.current.visible = presence.current > 0.012
      root.current.position.x += (scrollState.px * 0.30 - root.current.position.x) * Math.min(1, d * 2)
      root.current.position.y += (scrollState.py * 0.14 - root.current.position.y) * Math.min(1, d * 2)
      // the whole scene sinks away as the hero scrolls away
      root.current.position.y -= (1 - presence.current) * 1.2
    }
    if (sunLight.current) sunLight.current.intensity = 1.05 + Math.sin(t * 0.35) * 0.1
  })

  return (
    <group ref={root}>
      <ambientLight intensity={0.55} color="#7fa8b8" />
      <directionalLight ref={sunLight} position={[-5, 2, 3]} intensity={1.1} color="#ffcf8a" />
      <directionalLight position={[4, 3, -2]} intensity={0.35} color="#8fd8ff" />

      {/* evening sun, peeking over the far range */}
      <mesh position={SUN_WORLD}>
        <circleGeometry args={[0.44, 48]} />
        <meshBasicMaterial color="#fff6dc" transparent opacity={0.95} depthWrite={false} />
      </mesh>
      <mesh position={[SUN_WORLD[0], SUN_WORLD[1], SUN_WORLD[2] - 0.1]}>
        <circleGeometry args={[1.9, 48]} />
        <meshBasicMaterial color="#ffc266" transparent opacity={0.20} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>

      {LAYERS.map((l, i) => (
        <Mountains key={i} layer={l} presence={presence} />
      ))}

      <Mist presence={presence} y={-0.75} z={-7.2} w={26} h={1.5} color="#a8cbc4" o={0.30} par={-0.18} />
      <Mist presence={presence} y={-1.62} z={-3.4} w={18} h={1.0} color="#9ec4bd" o={0.22} speed={1.5} par={-0.4} />

      <Lake presence={presence} />
      {/* far shore treeline, small and dark along the water's edge */}
      <Forest presence={presence} count={62} z={-2.9} spread={7.5} y={-2.20} scale={0.40} seed={1} />
      <Forest presence={presence} count={44} z={0.7} spread={9} y={-2.32} scale={0.72} seed={40} />
      {/* foreground silhouettes framing the lower edge */}
      <Forest presence={presence} count={16} z={3.5} spread={6.5} y={-3.15} scale={1.7} seed={90} dark />
      <Birds presence={presence} />
      <Fireflies presence={presence} />
    </group>
  )
}
