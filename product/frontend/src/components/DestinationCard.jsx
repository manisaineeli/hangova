import { useMemo } from 'react'
import BiomeArt from '../three/BiomeArt'
import NatureCanvas from '../three/NatureCanvas'
import { biomeForDestination } from '../three/biomes'

/**
 * A destination card with its scenery.
 *
 * `live` uses a real WebGL scene for a single hero-sized card. Cards in a grid
 * use the vector scenery instead, because a list of six WebGL contexts would
 * exhaust the browser's context budget and stall the GPU.
 */
export function DestinationCard({ destination, live = false, height = 132, showTag = true, children, right }) {
  const biome = useMemo(() => biomeForDestination(destination, []), [destination])

  return (
    <div className="card dest-card hoverable" style={{ padding: 0 }}>
      <div className="dest-scene" style={{ height }}>
        {live ? (
          <NatureCanvas biome={biome} opacity={0.95} />
        ) : (
          <BiomeArt biome={biome} style={{ position: 'absolute', inset: 0 }} />
        )}

        {showTag && (
          <div className="biome-tag" style={{ top: 10, right: 10 }}>
            {biome.signature} · <b>{biome.label}</b>
          </div>
        )}

        <div
          style={{
            position: 'absolute',
            inset: 'auto 0 0 0',
            height: '68%',
            background: 'linear-gradient(180deg, transparent, rgba(5,8,15,0.93))',
            pointerEvents: 'none',
          }}
        />
      </div>

      <div className="dest-body">
        {right && <div className="row between" style={{ marginBottom: 4 }}>{right}</div>}
        {children}
      </div>
    </div>
  )
}

/** Full-bleed scenery panel with content overlaid on the bottom edge. */
export default function DestinationPanel({ destination, height = 240, children, showTag = true, live = true }) {
  const biome = useMemo(() => biomeForDestination(destination, []), [destination])

  const style = {
    '--accent': biome.accent,
    '--accent-2': biome.accent2,
    '--glow': `${biome.accent}66`,
  }

  return (
    <div className="card" style={{ ...style, padding: 0, overflow: 'hidden' }}>
      <div style={{ position: 'relative', height }}>
        {live ? (
          <NatureCanvas biome={biome} opacity={0.72} />
        ) : (
          <BiomeArt biome={biome} style={{ position: 'absolute', inset: 0 }} />
        )}

        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(180deg, rgba(5,8,15,0.35) 0%, transparent 40%, rgba(5,8,15,0.9) 100%)',
            pointerEvents: 'none',
          }}
        />

        {showTag && (
          <div className="biome-tag">
            {biome.signature} · <b>{biome.label}</b>
          </div>
        )}

        {children && <div style={{ position: 'absolute', inset: 'auto 0 0 0', padding: 20 }}>{children}</div>}
      </div>
    </div>
  )
}
