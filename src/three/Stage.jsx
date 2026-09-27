import { useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import Sky from './Sky'
import Landscape from './Landscape'
import { ProblemScene, SolutionScene, CompareScene, ModuleScene, StackScene, TeamScene, OutcomeScene } from './Scenes'
import { initScroll, initPointer, measure } from '../lib/scroll'

/* ============================================================
   Stage — the single fixed 3D layer behind all page content.
   Each section's scene fades and scales with scroll presence,
   so one canvas serves the entire page.
   ============================================================ */

export default function Stage({ activeModuleRef }) {
  useEffect(() => {
    const offScroll = initScroll()
    const offPtr = initPointer()
    // re-measure after fonts + layout settle
    const t1 = setTimeout(measure, 150)
    const t2 = setTimeout(measure, 900)
    document.fonts?.ready.then(measure).catch(() => {})
    return () => {
      offScroll()
      offPtr()
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [])

  return (
    <div className="stage">
      <Canvas
        dpr={[1, 1.75]}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        camera={{ position: [0, 0, 9], fov: 42, near: 0.1, far: 120 }}
      >
        <Sky />
        <Landscape />
        <ProblemScene />
        <SolutionScene />
        <CompareScene />
        <ModuleScene activeRef={activeModuleRef} />
        <StackScene />
        <TeamScene />
        <OutcomeScene />
      </Canvas>
    </div>
  )
}
