import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import CoastScene from './scenes/CoastScene'
import Ocean from './scenes/Ocean'
import ForestScene from './scenes/ForestScene'
import WaterfallScene from './scenes/WaterfallScene'
import MountainScene from './scenes/MountainScene'
import DesertScene from './scenes/DesertScene'
import SkyDome from './SkyDome'
import { BIOMES, DEFAULT_BIOME } from './biomes'

/**
 * The immersive layer.
 *
 * Two detail levels:
 *   'ambient' - sky and light only, used full-bleed behind the app. Deliberately
 *               prop-free so a close-up trunk or bank can never read as a UI
 *               artefact behind glass panels.
 *   'hero'    - the full scene, used inside cards and panels where the
 *               geometry is the point.
 *
 * The biome change remounts the Canvas, and the CSS opacity transition on the
 * wrapper does the cross-fade.
 */

/* ---------------- pointer parallax ---------------- */

function ParallaxRig({ strength = 1 }) {
  const { pointer, camera } = useThree()
  const base = useRef(new THREE.Vector3())

  useEffect(() => {
    base.current.copy(camera.position)
  }, [camera])

  useFrame(() => {
    camera.position.x = base.current.x + pointer.x * 1.5 * strength
    camera.position.y = base.current.y + pointer.y * 0.9 * strength
    camera.lookAt(0, 1.2, -3)
  })
  return null
}

/* ---------------- per-biome scene switch ---------------- */

function SceneFor({ biome }) {
  switch (biome.id) {
    case 'beach':
      return (
        <group>
          <Ocean biome={biome} />
          <CoastScene biome={biome} />
        </group>
      )
    case 'forest':
      return <ForestScene biome={biome} />
    case 'waterfall':
      return <WaterfallScene biome={biome} />
    case 'mountains':
      return <MountainScene biome={biome} />
    case 'desert':
      return <DesertScene biome={biome} />
    default:
      return null
  }
}

function Lights({ biome }) {
  return (
    <>
      <ambientLight color={biome.ambient} intensity={biome.ambientIntensity} />
      <directionalLight
        position={[6, 9, 4]}
        intensity={biome.sunIntensity}
        color={biome.sun}
        castShadow={false}
      />
      <pointLight position={[-7, 3, -6]} intensity={10} distance={28} color={biome.accent} />
    </>
  )
}

export default function NatureCanvas({
  biome = DEFAULT_BIOME,
  opacity = 1,
  blur = 0,
  interactive = true,
  detail = 'hero',
  className = '',
  style = {},
}) {
  const b = BIOMES[biome?.id] || DEFAULT_BIOME
  // key on the biome so switching swaps the scene cleanly
  const [key, setKey] = useState(b.id)

  useEffect(() => {
    if (b.id !== key) setKey(b.id)
  }, [b.id, key])

  const ambient = detail === 'ambient'

  return (
    <div
      className={`nature-canvas ${className}`}
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        opacity,
        filter: blur ? `blur(${blur}px)` : undefined,
        transform: blur ? 'scale(1.08)' : undefined,
        transition: 'opacity .8s ease',
        ...style,
      }}
    >
      <Canvas
        key={key}
        dpr={ambient ? [1, 1.25] : [1, 1.6]}
        gl={{ antialias: !ambient, alpha: true, powerPreference: 'high-performance' }}
        camera={{ position: [0, b.camY, b.camZ], fov: 46, near: 0.1, far: 160 }}
        style={{ background: 'transparent' }}
      >
        <SkyDome biome={b} />
        <fog attach="fog" args={[b.fog, 16, 62]} />
        {!ambient && interactive && <ParallaxRig />}
        <Lights biome={b} />
        {!ambient && <SceneFor biome={b} />}
      </Canvas>
    </div>
  )
}
