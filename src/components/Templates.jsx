import { templates } from '../data'
import { Reveal, gotoSection } from './hooks'

/* ============================================================
   01 · TRIP TEMPLATES
   Ready-made "place" presets. Selecting one loads the AI
   planner in the hero with that destination already filled in.
   ============================================================ */

export default function Places({ onPick, activeId }) {
  return (
    <section id="places" className="section">
      <div className="wrap">
        <Reveal className="sec-head">
          <div className="eyebrow">
            <span className="dot" />
            Explore places
          </div>
          <h2 className="sec-title">
            Start from a <em>place</em>, not a blank form
          </h2>
          <p className="sec-sub">
            Six presets built from real Indian destinations, each carrying its own interests,
            duration, group size and budget. Load one and the planner expands it into a full
            day-wise itinerary you can then edit.
          </p>
        </Reveal>

        <div className="tpl-grid">
          {templates.map((t, i) => (
            <Reveal key={t.id} delay={i * 55} className="tpl">
              <button
                className="tpl-card"
                style={{ '--tc': t.c, '--tc2': t.c2, backgroundImage: `linear-gradient(165deg, ${t.c}22, ${t.c2}14 45%, transparent 78%)` }}
                onClick={() => {
                  onPick?.(t)
                  gotoSection(0)
                }}
                onMouseEnter={() => onPick?.(t, true)}
                onFocus={() => onPick?.(t, true)}
              >
                <span className="tpl-sheen" />
                <div className="tpl-top">
                  <span className="tpl-ic">{t.ic}</span>
                  <span className="tpl-tag">{t.tag}</span>
                </div>
                <h3>{t.name}</h3>
                <div className="tpl-place">{t.place}</div>
                <p className="tpl-blurb">{t.blurb}</p>
                <ul className="tpl-list">
                  {t.days_plan.slice(0, 3).map(([d, what]) => (
                    <li key={d}>
                      <span>{d}</span>
                      {what}
                    </li>
                  ))}
                  {t.days_plan.length > 3 && <li className="more">+{t.days_plan.length - 3} more days</li>}
                </ul>
                <div className="tpl-foot">
                  <span>🗓 {t.days} days</span>
                  <span>👥 {t.travellers}</span>
                  <span>₹{t.budget.toLocaleString('en-IN')}</span>
                  <span className="tpl-go">Load →</span>
                </div>
                {activeId === t.id && <span className="tpl-active" />}
              </button>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
