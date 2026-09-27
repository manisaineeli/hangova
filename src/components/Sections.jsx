import { stack, flow, meta, outcomes, conclusion } from '../data'
import { Reveal, gotoSection } from './hooks'

/* ============================================================
   07 · TOOLS & TECHNOLOGIES
   ============================================================ */

export function Tech() {
  return (
    <section id="tech" className="section">
      <div className="wrap">
        <Reveal className="sec-head">
          <div className="eyebrow">
            <span className="dot" />
            Tech stack
          </div>
          <h2 className="sec-title">
            Built with the <em>industry default</em>
          </h2>
          <p className="sec-sub">
            A conventional, production-shaped stack: React on the client, Spring Boot microservices
            behind an API Gateway, Gemini for the intelligence, MongoDB or PostgreSQL for state.
          </p>
        </Reveal>

        <div className="stack-grid">
          {stack.map((s, i) => (
            <Reveal key={s.l} delay={i * 40} className="stk glass" style={{ '--sc': s.c, height: '100%' }}>
              <div className="stk-l">
                <span className="d" />
                {s.l}
              </div>
              <div className="stk-items">
                {s.items.map((it) => (
                  <span key={it}>{it}</span>
                ))}
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={120} className="flow">
          <span className="flow-n hl">React.js</span>
          <span className="flow-a">→</span>
          <span className="flow-n hl">API Gateway</span>
          <span className="flow-a">→</span>
          <span className="flow-n">Spring Boot Microservices</span>
          <span className="flow-a">→</span>
          <span className="flow-n">MongoDB / PostgreSQL</span>
          <span className="flow-a">→</span>
          <span className="flow-n">AI &amp; External APIs</span>
        </Reveal>
      </div>
    </section>
  )
}

/* ============================================================
   08 · TEAM
   ============================================================ */

export function Team() {
  return (
    <section id="team" className="section">
      <div className="wrap">
        <Reveal className="sec-head">
          <div className="eyebrow">
            <span className="dot" />
            The team
          </div>
          <h2 className="sec-title">
            The people <em>behind the plan</em>
          </h2>
          <p className="sec-sub">
            {meta.dept} · Review-1, guided by {meta.guide.name}, {meta.guide.role}.
          </p>
        </Reveal>

        <div className="team">
          {meta.team.map((m, i) => (
            <Reveal key={m.roll} delay={i * 60} className="tcard glass" style={{ '--av': m.av, '--av2': m.av2, height: '100%' }}>
              <div className="tav">{m.name.replace(/[^A-Za-z]/g, '').slice(0, 2).toUpperCase()}</div>
              <b>{m.name}</b>
              <div className="roll">{m.role}</div>
              <span className="rid">{m.roll}</span>
            </Reveal>
          ))}
        </div>

        <Reveal delay={120} className="guide glass">
          <div className="gic">🎓</div>
          <div className="guide-txt">
            <em>Project Guide</em>
            <b>{meta.guide.name}</b>
            <span>
              {meta.guide.role} · {meta.guide.dept}
            </span>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

/* ============================================================
   09 · CONCLUSION / EXPECTED OUTCOMES
   ============================================================ */

export function Results() {
  return (
    <section id="results" className="section">
      <div className="wrap">
        <Reveal className="sec-head">
          <div className="eyebrow">
            <span className="dot" />
            Results
          </div>
          <h2 className="sec-title">
            What the system <em>delivers</em>
          </h2>
          <p className="sec-sub">{conclusion}</p>
        </Reveal>

        <div className="out">
          {outcomes.map((o, i) => (
            <Reveal key={o.n} delay={i * 45} className="ocard glass" style={{ '--oc': o.c, height: '100%' }}>
              <span className="ocard-n">{o.n}</span>
              <h4>{o.t}</h4>
              <p>{o.d}</p>
            </Reveal>
          ))}
        </div>

        <Reveal delay={140} className="glass" style={{ marginTop: 36, padding: '40px 34px', textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 14 }}>🧭</div>
          <h3 style={{ fontSize: 'clamp(1.5rem,3vw,2.1rem)', fontWeight: 800, letterSpacing: '-.03em', marginBottom: 12 }}>
            One prompt in. <span style={{ background: 'linear-gradient(100deg,var(--c-cyan),var(--c-violet))', WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>A whole trip out.</span>
          </h3>
          <p style={{ fontSize: 14.6, color: 'var(--t-mid)', maxWidth: 620, margin: '0 auto 24px', fontWeight: 300, lineHeight: 1.8 }}>
            Destination, budget, duration, travellers and interests go in — a personalised,
            costed, bookable itinerary comes out. That is the whole product.
          </p>
          <button className="btn btn-primary" onClick={() => gotoSection(0)}>
            Back to the beginning <span aria-hidden>↑</span>
          </button>
        </Reveal>
      </div>
    </section>
  )
}

/* ============================================================
   FOOTER
   ============================================================ */

export function Footer({ brand = 'Hangova' }) {
  return (
    <footer>
      <div className="wrap">
        <div className="f-cols">
          <div>
            <div className="brand" style={{ marginBottom: 16 }}>
              <div className="brand-mark">✈</div>
              <div className="brand-txt">
                <b>{brand}</b>
                <span>AI TRIP PLANNER</span>
              </div>
            </div>
            <p>
              {meta.title} — an intelligent travel application that plans, prices and books a trip
              end to end using AI, live REST APIs and microservices.
            </p>
          </div>

          <div>
            <h5>Sections</h5>
            <ul>
              {['Trip Templates', 'Problem', 'Solution', 'Comparison', 'Modules'].map((l) => (
                <li key={l}>{l}</li>
              ))}
            </ul>
          </div>

          <div>
            <h5>Technical</h5>
            <ul>
              {['Architecture', 'Tech Stack', 'Outcomes', 'Team'].map((l) => (
                <li key={l}>{l}</li>
              ))}
            </ul>
          </div>

          <div>
            <h5>Guide</h5>
            <p>
              <b style={{ color: 'var(--t-hi)' }}>{meta.guide.name}</b>
              <br />
              {meta.guide.role}
              <br />
              {meta.guide.dept}
            </p>
          </div>
        </div>

        <div className="f-bot">
          <span>
            © {new Date().getFullYear()} {meta.title} · {meta.dept}
          </span>
          <span className="mono">
            React.js · Spring Boot · Gemini API · MongoDB / PostgreSQL
          </span>
        </div>
      </div>
    </footer>
  )
}
