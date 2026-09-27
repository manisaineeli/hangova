import { useMemo } from 'react'
import * as THREE from 'three'

/**
 * Gradient sky dome.
 *
 * Every biome needs a real sky rather than a flat clear colour: a flat
 * background reads as a rectangle sitting behind the UI, and a vertical
 * gradient is what makes the horizon feel like distance.
 */
export default function SkyDome({ biome, radius = 90 }) {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        depthWrite: false,
        fog: false,
        uniforms: {
          uTop: { value: new THREE.Color(biome.sky[0]) },
          uMid: { value: new THREE.Color(biome.sky[1]) },
          uBottom: { value: new THREE.Color(biome.sky[2]) },
        },
        vertexShader: /* glsl */ `
          varying vec3 vWorld;
          void main() {
            vWorld = (modelMatrix * vec4(position, 1.0)).xyz;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: /* glsl */ `
          uniform vec3 uTop;
          uniform vec3 uMid;
          uniform vec3 uBottom;
          varying vec3 vWorld;

          void main() {
            float h = normalize(vWorld).y;
            vec3 col = h > 0.0
              ? mix(uMid, uTop, pow(clamp(h, 0.0, 1.0), 0.65))
              : mix(uMid, uBottom, pow(clamp(-h, 0.0, 1.0), 0.5));
            gl_FragColor = vec4(col, 1.0);
            #include <colorspace_fragment>
          }
        `,
      }),
    [biome],
  )

  return (
    <mesh material={material} frustumCulled={false} renderOrder={-1000}>
      <sphereGeometry args={[radius, 32, 24]} />
    </mesh>
  )
}
