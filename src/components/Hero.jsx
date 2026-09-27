import { useEffect, useMemo, useState } from 'react'
import { meta, INTERESTS } from '../data'
import { gotoSection, Reveal } from './hooks'

/* ============================================================
   Hero — headline plus a live, interactive trip planner that
   mirrors what the AI Trip Planning module actually does.
   Sits over the 3D landscape.
   ============================================================ */

const SPOTS = {
  Heritage: ['Fort ramparts & light show', 'Old quarter walking trail', 'Temple heritage circuit'],
  Beaches: ['Sunset beach walk', 'Snorkelling lagoon trip', 'Coastal seafood evening'],
  Mountains: ['Ridge sunrise viewpoint', 'Pine forest trail', 'River valley picnic'],
  Food: ['Local street food crawl', 'Market spices & produce', 'Traditional cooking class'],
  Wildlife: ['Sanctuary morning drive', 'Birdwatching hide visit', 'Village nature walk'],
  Nightlife: ['Riverside night market', 'Live folk performance', 'Rooftop lounge evening'],
}

/** deterministic plan generated from the chosen inputs */
function buildPlan(dest, days, travellers, budget, interest) {
  const perDay = Math.round(budget / Math.max(1, days))
  const spots = SPOTS[interest] ?? SPOTS.Mountains
  return {
    dest,
    days,
    total: perDay * days * travellers,
    rows: spots.map((s, i) => ({
      day: `Day ${i + 1}`,
      what: s,
      cost: `₹${Math.round(perDay * (0.7 + i * 0.16)).toLocaleString('en-IN')}`,
    })),
  }
}

const SPLIT = [
  { k: 'Stay', v: 0.34, c: 'linear-gradient(90deg,#4ade80,#22d3ee)' },
  { k: 'Transport', v: 0.26, c: 'linear-gradient(90deg,#7dd3fc,#818cf8)' },
  { k: 'Activities', v: 0.22, c: 'linear-gradient(90deg,#fbbf24,#fb923c)' },
  { k: 'Buffer', v: 0.18, c: 'linear-gradient(90deg,#a3e635,#4ade80)' },
]

const selectStyle = {
  background: 'transparent',
  border: 0,
  color: 'var(--t-hi)',
  font: 'inherit',
  fontSize: 13.5,
  outline: 'none',
  width: '100%',
  cursor: 'pointer',
}

export default function Hero({ draft, setDraft, activeTemplate }) {
  const { dest, days, travellers, budget, interest } = draft
  const [busy, setBusy] = useState(false)

  const set = (k, v) => setDraft((d) => ({ ...d, [k]: v }))

  const plan = useMemo(
    () => buildPlan(dest, days, travellers, budget, interest),
    [dest, days, travellers, budget, interest]
  )

  /* simulate the AI generating an itinerary whenever inputs change */
  useEffect(() => {
    setBusy(true)
    const t = setTimeout(() => setBusy(false), 620)
    return () => clearTimeout(t)
  }, [dest, days, travellers, budget, interest])

  return (
    <section id="home" className="section hero">
      <div className="wrap hero-grid">
        {/* ---------- left: copy ---------- */}
        <div className="hero-text">
          <Reveal>
            <div className="hero-badge">
              <span className="pip" />
              {meta.dept} · Review-1
            </div>
          </Reveal>

          <Reveal delay={70}>
            <h1 className="hero-title">
              <span className="l1">AI Trip Planning</span>
              <span className="l2">&amp; Booking System</span>
            </h1>
          </Reveal>

          <Reveal delay={140}>
            <p className="hero-lede">
              One intelligent platform that replaces scattered manual research —{' '}
              <b>Hangova</b> reads your destination, budget, duration and interests, then builds a{' '}
              <b>day-wise itinerary</b>, prices it, and books it.
            </p>
          </Reveal>

          <Reveal delay={210}>
            <div className="hero-actions">
              <button className="btn btn-primary" onClick={() => gotoSection(1)}>
                Explore trip templates
                <span aria-hidden>→</span>
              </button>
              <button className="btn btn-sec" onClick={() => gotoSection(6)}>
                View 3D architecture
              </button>
            </div>
          </Reveal>

          <Reveal delay={280}>
            <div className="hero-stats">
              {meta.stats.map((s) => (
                <div className="hstat" key={s.l}>
                  <b>{s.v}</b>
                  <span>{s.l}</span>
                </div>
              ))}
            </div>
          </Reveal>
        </div>

        {/* ---------- right: interactive planner ---------- */}
        <Reveal delay={200} className="planner glass hero-side">
          <div className="planner-h">
            <b>Trip Planner</b>
            <span className="live">
              <span className="pip" />
              {busy ? 'AI GENERATING' : 'AI READY'}
            </span>
          </div>

          {activeTemplate && (
            <div className="tpl-loaded">
              <span className="tl-ic">{activeTemplate.ic}</span>
              <span className="tl-txt">
                <b>{activeTemplate.name}</b>
                <em>{activeTemplate.place}</em>
              </span>
            </div>
          )}

          <div className="field">
            <label>Destination</label>
            <div className="field-v">
              <span className="ic">📍</span>
              <select value={dest} onChange={(e) => set('dest', e.target.value)} style={selectStyle}>
                {['Manali', 'Goa', 'Jaipur', 'Ladakh', 'Kerala', 'Varanasi', 'Andaman', 'Munnar', 'Ranthambore', 'Port Blair'].map((d) => (
                  <option key={d} value={d} style={{ background: '#0a2418' }}>
                    {d}, India
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="field">
              <label>Duration</label>
              <div className="field-v">
                <span className="ic">🗓️</span>
                <select value={days} onChange={(e) => set('days', +e.target.value)} style={selectStyle}>
                  {[2, 3, 4, 5, 6, 7, 10].map((d) => (
                    <option key={d} value={d} style={{ background: '#0a2418' }}>
                      {d} days
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="field">
              <label>Travellers</label>
              <div className="field-v">
                <span className="ic">👥</span>
                <select value={travellers} onChange={(e) => set('travellers', +e.target.value)} style={selectStyle}>
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <option key={n} value={n} style={{ background: '#0a2418' }}>
                      {n} {n > 1 ? 'people' : 'person'}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="field">
            <label>Interests</label>
            <div className="field-v chips">
              {INTERESTS.map((i) => (
                <span
                  key={i}
                  className={`chip ${interest === i ? 'on' : ''}`}
                  style={{ cursor: 'pointer' }}
                  onClick={() => set('interest', i)}
                >
                  {i}
                </span>
              ))}
            </div>
          </div>

          <div className="field">
            <label>Total budget · ₹{budget.toLocaleString('en-IN')}</label>
            <input
              type="range"
              min={15000}
              max={250000}
              step={5000}
              value={budget}
              onChange={(e) => set('budget', +e.target.value)}
              style={{ width: '100%', accentColor: 'var(--c-fern)', cursor: 'pointer' }}
            />
          </div>

          {/* ---- generated itinerary ---- */}
          <div className="planner-out" style={{ opacity: busy ? 0.4 : 1, transition: 'opacity .4s' }}>
            <div className="bar-l" style={{ marginBottom: 8 }}>
              <span>AI ITINERARY · {plan.dest.toUpperCase()}</span>
              <span style={{ color: 'var(--c-fern)' }}>{busy ? 'PLANNING…' : `${days} DAYS`}</span>
            </div>

            {plan.rows.map((r) => (
              <div className="plan-row" key={r.day}>
                <span className="plan-day">{r.day}</span>
                <span>{r.what}</span>
                <span className="plan-cost">{r.cost}</span>
              </div>
            ))}

            <div className="bars">
              {SPLIT.map((s) => (
                <div key={s.k}>
                  <div className="bar-l">
                    <span>{s.k}</span>
                    <span>{Math.round(s.v * 100)}%</span>
                  </div>
                  <div className="bar-t">
                    <div className="bar-f" style={{ width: `${s.v * 100}%`, background: s.c }} />
                  </div>
                </div>
              ))}
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                marginTop: 16,
                paddingTop: 13,
                borderTop: '1px dashed var(--stroke)',
              }}
            >
              <span style={{ fontSize: 11, color: 'var(--t-lo)', letterSpacing: '.1em', textTransform: 'uppercase' }}>
                Estimated total
              </span>
              <b style={{ fontSize: 21, color: 'var(--c-amber)', fontWeight: 800, letterSpacing: '-.02em' }}>
                ₹{plan.total.toLocaleString('en-IN')}
              </b>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
