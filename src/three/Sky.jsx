import { useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { NOISE, PALETTE } from '../lib/glsl'
import { scrollState } from '../lib/scroll'

/* ============================================================
   Sky — full-screen twilight backdrop drawn in clip space.

   A warm low sun near the horizon, layered valley mist, a faint
   green aurora shimmer and early stars. Deliberately restrained
   through the middle of the frame so page content stays legible.
   ============================================================ */

const vert = /* glsl */ `
varying vec2 vUv;
void main(){
  vUv = uv;
  gl_Position = vec4(position.xy, 1.0, 1.0);
}
`

const frag = /* glsl */ `
precision highp float;
varying vec2 vUv;
uniform float uTime;
uniform float uScrollN;
uniform vec2  uRes;
uniform vec2  uMouse;
uniform float uReduce;

${NOISE}
${PALETTE}

float stars(vec2 uv, float t, float scale, float cut){
  vec2 g = uv * vec2(uRes.x / uRes.y, 1.0) * scale;
  vec2 id = floor(g);
  vec2 f  = fract(g) - 0.5;
  float h = fract(sin(dot(id, vec2(41.3, 289.1))) * 43758.5453);
  if (h < cut) return 0.0;
  vec2 off = (vec2(fract(h * 91.7), fract(h * 37.3)) - 0.5) * 0.72;
  float tw = 0.45 + 0.55 * sin(t * (1.1 + h * 4.0) + h * 30.0);
  float mag = smoothstep(0.0, 1.0, (h - cut) / max(1e-4, 1.0 - cut));
  return smoothstep(0.055, 0.0, length(f - off)) * tw * (0.2 + mag * 0.9);
}

void main(){
  vec2 uv = vUv;
  float aspect = uRes.x / uRes.y;
  vec2 p = vec2((uv.x - 0.5) * aspect, uv.y - 0.5);
  float t = uTime * (1.0 - uReduce * 0.9);

  /* ---------- vertical sky gradient ---------- */
  float h = uv.y;
  vec3 zenith  = vec3(0.016, 0.055, 0.062);   // deep teal night
  vec3 midSky  = vec3(0.035, 0.115, 0.130);
  vec3 horizon = vec3(0.085, 0.180, 0.165);
  vec3 col = mix(horizon, midSky, smoothstep(0.30, 0.62, h));
  col = mix(col, zenith, smoothstep(0.58, 1.0, h));

  /* ---------- warm low sun, aligned with the 3D sun disc ---------- */
  vec2 sunPos = vec2(0.35 + sin(uScrollN * 0.5) * 0.02, 0.545);
  float sd = length((uv - sunPos) * vec2(aspect, 1.0));
  col += C_SUN * exp(-sd * 3.0) * 0.34;                 // wide bloom
  col += C_SUN * exp(-sd * 11.0) * 0.40;                // tight core
  col += vec3(1.0, 0.86, 0.62) * smoothstep(0.028, 0.011, sd) * 0.70;  // disc

  /* warm light spilling down onto the ridge line */
  col += C_SUN * exp(-abs(uv.y - sunPos.y) * 9.0) * 0.045 * exp(-abs(uv.x - sunPos.x) * 2.2);

  /* ---------- green aurora shimmer (upper sky) ---------- */
  float n1 = fbm(vec2(uv.x * 2.2 + t * 0.045 + uScrollN * 0.4, t * 0.06));
  float d1 = uv.y - (0.74 + sin(uScrollN * 1.3) * 0.03) + n1 * 0.075;
  float b1 = exp(-(d1 * d1) / 0.0055);
  float curtain = 0.42 + 0.58 * fbm3(vec2(uv.x * 11.0 + t * 0.10, t * 0.04));
  col += C_FERN * b1 * 0.16 * curtain;
  col += C_WATER * b1 * 0.07;

  /* ---------- valley mist sitting on the ridge line ---------- */
  float m1 = fbm3(vec2(uv.x * 3.2 - t * 0.020, uv.y * 7.0 + 1.4));
  float mist = smoothstep(0.72, 0.40, h) * (0.45 + 0.55 * m1);
  col = mix(col, vec3(0.30, 0.42, 0.40), mist * 0.26);

  float m2 = fbm3(vec2(uv.x * 5.0 + t * 0.030, uv.y * 13.0));
  col = mix(col, vec3(0.42, 0.54, 0.50), smoothstep(0.66, 0.34, h) * (0.3 + 0.7 * m2) * 0.20);

  /* ---------- stars, fading out toward the warm horizon ---------- */
  float starMask = smoothstep(0.42, 0.85, h);
  col += vec3(0.85, 0.95, 0.92) * stars(uv, t, 230.0, 0.972) * 1.10 * starMask;
  col += vec3(0.70, 0.90, 0.85) * stars(uv + 0.41, t * 0.7, 130.0, 0.986) * 0.5 * starMask;

  /* ---------- pointer warmth ---------- */
  col += C_SUN * exp(-length(p - uMouse * vec2(aspect, 1.0) * 0.5) * 2.8) * 0.022;

  /* ---------- vignette + grain ---------- */
  float r = length(p * vec2(0.80, 1.0));
  col *= 1.0 - smoothstep(0.38, 1.20, r) * 0.80;
  col *= 1.0 - 0.14 * smoothstep(0.60, 0.14, abs(uv.y - 0.55));
  float g = fract(sin(dot(uv * uRes + t, vec2(12.9898, 78.233))) * 43758.5453);
  col += (g - 0.5) * 0.013;

  gl_FragColor = vec4(max(col, 0.0), 1.0);
}
`

export default function Sky() {
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uScrollN: { value: 0 },
      uRes: { value: new THREE.Vector2(1, 1) },
      uMouse: { value: new THREE.Vector2(0, 0) },
      uReduce: { value: 0 },
    }),
    []
  )

  useFrame((_, dt) => {
    const s = scrollState
    const d = Math.min(dt, 0.05)
    uniforms.uTime.value += d
    uniforms.uScrollN.value += ((s.progress / 9) * 6 - uniforms.uScrollN.value) * Math.min(1, d * 2.4)
    uniforms.uMouse.value.x += (s.px - uniforms.uMouse.value.x) * Math.min(1, d * 2.2)
    uniforms.uMouse.value.y += (s.py - uniforms.uMouse.value.y) * Math.min(1, d * 2.2)
    uniforms.uRes.value.set(s.vw, s.vh)
    uniforms.uReduce.value = s.reduced ? 1 : 0
  })

  return (
    <mesh frustumCulled={false} renderOrder={-1000}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        vertexShader={vert}
        fragmentShader={frag}
        uniforms={uniforms}
        depthTest={false}
        depthWrite={false}
      />
    </mesh>
  )
}
