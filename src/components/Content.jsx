import { intro, problems, features, comparison } from '../data'
import { Reveal } from './hooks'

/* ============================================================
   WHY — the problem with planning a trip the old way
   ============================================================ */

export function Why() {
  return (
    <section id="why" className="section">
      <div className="wrap">
        <Reveal>
          <div className="eyebrow">
            <span className="dot" />
            Why
          </div>
        </Reveal>
        <Reveal delay={60}>
          <h2 className="sec-title">
            Planning a trip still means <em>ten tabs, four times</em>
          </h2>
        </Reveal>
        <Reveal delay={120}>
          <p className="sec-sub">{intro.body[0]}</p>
        </Reveal>

        <div className="prob-grid" style={{ marginTop: 50 }}>
          {problems.map((p, i) => (
            <Reveal key={p.t} delay={i * 55} className="prob glass">
              <span className="prob-n">{String(i + 1).padStart(2, '0')}</span>
              <div className="prob-ic">{p.ic}</div>
              <h4>{p.t}</h4>
              <p>{p.d}</p>
            </Reveal>
          ))}
        </div>

        {/* the project's own framing, kept intact */}
        <Reveal delay={120} className="glass goal-card">
          <div className="goal-l">
            <span className="goal-tag">The goal</span>
            <p>{intro.goal}</p>
          </div>
          <div className="goal-r">
            <p>{intro.abstract.body}</p>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

/* ============================================================
   CAPABILITIES — what the system actually does
   ============================================================ */

export function Capabilities() {
  return (
    <section id="features" className="section">
      <div className="wrap">
        <Reveal>
          <div className="eyebrow">
            <span className="dot" />
            What it does
          </div>
        </Reveal>
        <Reveal delay={60}>
          <h2 className="sec-title">
            One platform for the <em>whole journey</em>
          </h2>
        </Reveal>
        <Reveal delay={120}>
          <p className="sec-sub">
            Artificial Intelligence reads who you are and what you care about. REST APIs supply the
            live detail — weather, maps, hotels, transport. Microservices keep every capability
            independent, so booking a room and generating an itinerary never block each other.
          </p>
        </Reveal>

        <div className="feat-grid" style={{ marginTop: 50 }}>
          {features.map((f, i) => (
            <Reveal key={f.t} delay={i * 45} className="feat glass" style={{ '--fc': f.c }}>
              <div className="feat-ic">{f.ic}</div>
              <h4>{f.t}</h4>
              <p>{f.d}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ============================================================
   BEFORE / AFTER
   ============================================================ */

export function Compare() {
  return (
    <section id="compare" className="section">
      <div className="wrap">
        <Reveal className="center sec-head" style={{ maxWidth: 840 }}>
          <div className="eyebrow">
            <span className="dot" />
            Before / After
          </div>
          <h2 className="sec-title">
            The same trip, <em>handled two ways</em>
          </h2>
          <p className="sec-sub">
            Every row is a step that used to be manual and is now automatic.
          </p>
        </Reveal>

        <Reveal delay={90} className="cmp-scroll">
          <table className="cmp">
            <thead>
              <tr>
                <th>Manual planning</th>
                <th>With Hangova</th>
              </tr>
            </thead>
            <tbody>
              {comparison.map(([a, b]) => (
                <tr key={a}>
                  <td>
                    <span className="cmp-x">✕</span>
                    {a}
                  </td>
                  <td>{b}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Reveal>
      </div>
    </section>
  )
}
