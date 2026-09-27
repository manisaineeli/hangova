import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'

/**
 * Waterfall biome: a cliff face with a falling water sheet, a plunge pool that
 * ripples, and drifting mist. The water sheet scrolls two noise layers against
 * each other so it never looks like a moving texture.
 */

const waterVertex = /* glsl */ `
  uniform float uTime;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    vec3 pos = position;
    // gentle horizontal shear as the water falls
    pos.x += sin(pos.y * 2.2 + uTime * 2.4) * 0.035;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`

const waterFragment = /* glsl */ `
  uniform float uTime;
  uniform vec3 uTop;
  uniform vec3 uBottom;
  varying vec2 vUv;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
               mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
  }

  void main() {
    // two layers scrolling at different speeds = convincing falling water
    float a = noise(vec2(vUv.x * 7.0, vUv.y * 3.4 - uTime * 1.5));
    float b = noise(vec2(vUv.x * 13.0 + 4.0, vUv.y * 5.0 - uTime * 2.6));
    float streak = a * 0.6 + b * 0.4;

    vec3 col = mix(uTop, uBottom, vUv.y);
    col += vec3(0.35) * smoothstep(0.55, 1.0, streak);

    // foam gathers toward the base
    float foam = smoothstep(0.62, 1.0, streak) * smoothstep(0.35, 0.0, vUv.y);
    col = mix(col, vec3(0.95, 0.99, 1.0), foam * 0.8);

    float edge = smoothstep(0.0, 0.10, vUv.x) * smoothstep(1.0, 0.90, vUv.x);
    gl_FragColor = vec4(col, 0.55 + edge * 0.4);
    #include <colorspace_fragment>
  }
`

/**
 * Rock walls either side of the falls.
 *
 * Built from low-poly icosahedra rather than a displaced box, because flat
 * shading on a subdivided box produces a visible triangle grid that reads as a
 * rendering artefact rather than stone.
 */
function Rocks({ biome }) {
  const forms = useMemo(
    () => [
      { p: [-4.3, 0.2, -4.0], s: 2.6, d: 0.2 },
      { p: [-5.6, 2.6, -5.2], s: 2.0, d: 1.1 },
      { p: [-3.1, 4.4, -5.8], s: 1.7, d: 2.3 },
      { p: [4.3, 0.1, -4.0], s: 2.7, d: 2.6 },
      { p: [5.7, 2.5, -5.2], s: 2.1, d: 0.8 },
      { p: [3.2, 4.5, -5.8], s: 1.8, d: 1.9 },
      { p: [-2.4, -0.5, -2.2], s: 1.5, d: 1.4 },
      { p: [2.5, -0.6, -2.2], s: 1.5, d: 0.6 },
    ],
    [],
  )

  return (
    <group>
      {forms.map((f, i) => (
        <mesh key={i} position={f.p} rotation={[f.d * 0.4, f.d, f.d * 0.2]}>
          <icosahedronGeometry args={[f.s, 0]} />
          <meshStandardMaterial
            color={i % 2 ? '#3d5f68' : biome.ground}
            roughness={1}
            flatShading
          />
        </mesh>
      ))}
    </group>
  )
}

function FallingWater({ biome }) {
  const mat = useRef()
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uTop: { value: new THREE.Color(biome.accent) },
      uBottom: { value: new THREE.Color('#f2feff') },
    }),
    [biome],
  )

  useFrame((s) => {
    if (mat.current) mat.current.uniforms.uTime.value = s.clock.elapsedTime
  })

  return (
    <mesh position={[0, 1.5, -3.4]}>
      <planeGeometry args={[3.4, 9.2, 24, 44]} />
      <shaderMaterial
        ref={mat}
        vertexShader={waterVertex}
        fragmentShader={waterFragment}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}

/** Plunge pool with expanding ripple rings. */
function Pool({ biome }) {
  const ref = useRef()
  const uniforms = useMemo(() => ({ uTime: { value: 0 } }), [])

  useFrame((s) => {
    // the ref points straight at the material, not at the mesh
    if (ref.current?.uniforms) ref.current.uniforms.uTime.value = s.clock.elapsedTime
  })

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.82, -1.2]}>
      <circleGeometry args={[4.2, 48]} />
      <shaderMaterial
        ref={ref}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        vertexShader={`
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `}
        fragmentShader={`
          uniform float uTime;
          varying vec2 vUv;
          void main() {
            vec2 p = vUv - 0.5;
            float d = length(p) * 2.0;
            // concentric rings travelling outward from the impact point
            float rings = sin(d * 26.0 - uTime * 3.4) * 0.5 + 0.5;
            rings *= smoothstep(1.0, 0.1, d);
            float alpha = (0.30 + rings * 0.35) * smoothstep(1.0, 0.55, d);
            gl_FragColor = vec4(mix(vec3(0.18,0.45,0.55), vec3(0.85,0.97,1.0), rings), alpha);
          }
        `}
      />
    </mesh>
  )
}

/** Mist puffs drifting up from the base of the falls. */
function Mist({ biome, count = 70 }) {
  const ref = useRef()

  const { positions, base } = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const base = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 7
      positions[i * 3 + 1] = -0.6 + Math.random() * 1.6
      positions[i * 3 + 2] = -2.4 + Math.random() * 3
      base[i] = Math.random() * 6.28
    }
    return { positions, base }
  }, [count])

  useFrame((state, delta) => {
    const geo = ref.current?.geometry
    if (!geo) return
    const arr = geo.attributes.position.array
    const t = state.clock.elapsedTime
    for (let i = 0; i < count; i++) {
      arr[i * 3 + 1] += delta * (0.18 + (i % 5) * 0.05)
      arr[i * 3] += Math.sin(t * 0.5 + base[i]) * 0.0025
      if (arr[i * 3 + 1] > 1.6) arr[i * 3 + 1] = -0.7
    }
    geo.attributes.position.needsUpdate = true
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color="#dff4ff"
        size={0.17}
        sizeAttenuation
        transparent
        opacity={0.32}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}

export default function WaterfallScene({ biome }) {
  return (
    <group>
      <Rocks biome={biome} />
      <FallingWater biome={biome} />
      <Pool biome={biome} />

      {/* spray glowing at the base of the falls */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.72, -3.0]}>
        <circleGeometry args={[3.4, 32]} />
        <meshBasicMaterial
          color="#e8fbff"
          transparent
          opacity={0.24}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      <Mist biome={biome} />
    </group>
  )
}