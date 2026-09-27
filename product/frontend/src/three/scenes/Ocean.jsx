import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'

/**
 * Animated ocean for the coast biome.
 *
 * The wave is a stack of travelling sine waves applied in the vertex shader, so
 * the whole surface animates on the GPU in a single draw call. Foam is added
 * where the crest is steepest, which is what sells a shoreline.
 */

const vertexShader = /* glsl */ `
  uniform float uTime;
  varying float vWave;
  varying vec3 vPos;
  varying vec2 vUv;

  float waveHeight(vec2 p) {
    float h = 0.0;
    h += sin(p.x * 0.55 + uTime * 0.85) * 0.26;
    h += sin(p.y * 0.42 - uTime * 0.62) * 0.20;
    h += sin((p.x + p.y) * 0.30 + uTime * 1.15) * 0.13;
    h += sin((p.x - p.y * 0.6) * 0.85 - uTime * 1.55) * 0.07;
    return h;
  }

  void main() {
    vUv = uv;
    vec3 pos = position;
    float h = waveHeight(pos.xy);
    pos.z += h;
    vWave = h;
    vPos = pos;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`

const fragmentShader = /* glsl */ `
  uniform vec3 uDeep;
  uniform vec3 uShallow;
  uniform vec3 uFoam;
  uniform float uTime;
  varying float vWave;
  varying vec3 vPos;
  varying vec2 vUv;

  void main() {
    // distance from the camera drives depth, so water darkens toward the horizon
    float depth = smoothstep(-4.0, 20.0, vPos.y);
    vec3 col = mix(uShallow, uDeep, depth);

    // crests catch the light
    float crest = smoothstep(0.26, 0.52, vWave);
    float ripple = sin(vPos.x * 1.7 + vPos.y * 1.1 + uTime * 1.4) * 0.5 + 0.5;
    float foam = crest * ripple;
    col = mix(col, uFoam, foam * 0.5);

    // sky sheen on the wave tops keeps it from looking like flat plastic
    col += vec3(0.10, 0.16, 0.20) * crest * ripple;

    gl_FragColor = vec4(col, 1.0);
    #include <colorspace_fragment>
  }
`

export default function Ocean({ biome, segments = 110 }) {
  const mat = useRef()

  const geometry = useMemo(
    () => new THREE.PlaneGeometry(32, 46, segments, segments),
    [segments],
  )

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uDeep: { value: new THREE.Color(biome.deep || '#0a4a70') },
      uShallow: { value: new THREE.Color(biome.accent) },
      uFoam: { value: new THREE.Color('#f2fdff') },
    }),
    [biome],
  )

  useFrame((state) => {
    if (mat.current) mat.current.uniforms.uTime.value = state.clock.elapsedTime
  })

  return (
    <mesh
      geometry={geometry}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, biome.waterLevel, -9]}
      frustumCulled={false}
    >
      <shaderMaterial
        ref={mat}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}
