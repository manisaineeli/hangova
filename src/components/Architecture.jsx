import { useState } from 'react'
import ArchCanvas from '../three/ArchCanvas'
import { archNodes, archLayers } from '../data'
import { Reveal } from './hooks'

/* ============================================================
   66 · ARCHITECTURE — interactive 3D service graph.
   The 3D scene is the interface; the side panel inspects it.
   ============================================================ */

export default function Architecture() {
  const [active, setActive] = useState(null)
  const node = archNodes.find((n) => n.id === active) ?? archNodes[6]

  return (
    <section id="architecture" className="section">
      <div className="wrap">
        <Reveal className="sec-head">
          <div className="eyebrow">
            <span className="dot" />
            66 · System Architecture
          </div>
          <h2 className="sec-title">
            From the browser to <em>every provider</em>
          </h2>
          <p className="sec-sub">
            React.js → API Gateway → three Spring Boot microservices → database, Gemini AI and
            aggregated travel APIs. Drag the scene to orbit it, then hover or tap any node to trace
            its responsibility.
          </p>
        </Reveal>

        <div className="arch">
          <Reveal className="arch-canvas-box">
            <ArchCanvas active={active} setActive={setActive} />
            <div className="arch-hint">
              <span>⠿</span> DRAG TO ORBIT · HOVER A NODE
            </div>
          </Reveal>

          <div className="arch-side">
            {/* ---- inspector ---- */}
            <div className="glass arch-inspect" style={{ '--nc': node.c }}>
              <div className="ai-h">
                <span className="ai-dot" />
                <b>{node.label}</b>
                <span className="ai-lvl">{node.lvl}</span>
              </div>
              <p>{node.d}</p>
            </div>

            {/* ---- layer legend ---- */}
            <div className="glass arch-legend">
              {archLayers.map((l) => (
                <div className="al-row" key={l.t}>
                  <div className="al-t" style={{ color: l.c }}>
                    <span className="al-bar" style={{ background: l.c }} />
                    {l.t}
                  </div>
                  <div className="al-chips">
                    {l.ids.map((id) => {
                      const n = archNodes.find((x) => x.id === id)
                      return (
                        <button
                          key={id}
                          className={`al-chip ${active === id ? 'on' : ''}`}
                          style={{ '--nc': n.c }}
                          onMouseEnter={() => setActive(id)}
                          onMouseLeave={() => setActive(null)}
                          onClick={() => setActive((a) => (a === id ? null : id))}
                        >
                          {n.label}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
