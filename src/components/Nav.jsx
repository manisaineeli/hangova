import { useState } from 'react'
import { nav, meta } from '../data'
import { gotoSection, useStuck } from './hooks'

export default function Nav({ active }) {
  const stuck = useStuck()
  const [open, setOpen] = useState(false)

  const go = (id) => {
    setOpen(false)
    const i = nav.findIndex((n) => n.id === id)
    gotoSection(i)
  }

  return (
    <>
      <nav className={`nav ${stuck ? 'stuck' : ''}`}>
        <div className="nav-inner">
          <div className="brand" onClick={() => go('home')}>
            <div className="brand-mark">✈</div>
            <div className="brand-txt">
              <b>Hangova</b>
              <span>AI TRIP PLANNER</span>
            </div>
          </div>

          <ul className="nav-links">
            {nav.map((n, i) => (
              <li key={n.id}>
                <button className={active === i ? 'on' : ''} onClick={() => go(n.id)}>
                  {n.label}
                </button>
              </li>
            ))}
          </ul>

          <div className="nav-cta">
            <button className="btn-ghost" onClick={() => go('team')}>
              Team
            </button>
            <button
              className="burger"
              onClick={() => setOpen((o) => !o)}
              aria-label="Menu"
              aria-expanded={open}
            >
              {open ? '✕' : '☰'}
            </button>
          </div>
        </div>
      </nav>

      {open && (
        <div className="mob-menu">
          {nav.map((n) => (
            <button key={n.id} onClick={() => go(n.id)}>
              {n.label}
            </button>
          ))}
        </div>
      )}
    </>
  )
}
