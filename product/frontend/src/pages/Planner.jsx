import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'
import { useAuth } from '../auth'
import {
  Bar,
  ErrorBox,
  Loading,
  addDaysIso,
  prettyDate,
  rupees,
  rupeesShort,
  todayIso,
} from '../components/ui'

const INTERESTS = [
  'Heritage',
  'Beaches',
  'Mountains',
  'Food',
  'Wildlife',
  'Nightlife',
  'Adventure',
  'Culture',
  'Pilgrimage',
  'Shopping',
  'Relaxation',
]

const STYLES = [
  { v: 'BALANCED', l: 'Balanced' },
  { v: 'BUDGET', l: 'Budget / backpacker' },
  { v: 'LUXURY', l: 'Luxury' },
]

export default function Planner() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [dest, setDest] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [days, setDays] = useState(user?.defaultDays || 4)
  const [travellers, setTravellers] = useState(user?.defaultTravellers || 2)
  const [budget, setBudget] = useState(user?.defaultBudget || 60000)
  const [startDate, setStartDate] = useState(todayIso(14))
  const [style, setStyle] = useState('BALANCED')
  const [interests, setInterests] = useState(user?.interests?.length ? user.interests : ['Heritage', 'Food'])
  const [save, setSave] = useState(true)

  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)
  const [status, setStatus] = useState(null)

  /* type-ahead destination search, catalogue first then live geocoding */
  useEffect(() => {
    const q = dest.trim()
    if (q.length < 2) {
      setSuggestions([])
      return
    }
    let cancelled = false
    const t = setTimeout(async () => {
      try {
        const res = await api.searchPlaces(q)
        if (!cancelled) setSuggestions(res.results || [])
      } catch {
        if (!cancelled) setSuggestions([])
      }
    }, 250)
    return () => {
      cancelled = true
      clearTimeout(t)
    }
  }, [dest])

  useEffect(() => {
    api
      .providerStatus()
      .then(setStatus)
      .catch(() => setStatus(null))
  }, [])

  const toggle = (i) =>
    setInterests((p) => (p.includes(i) ? p.filter((x) => x !== i) : [...p, i]))

  const perDay = useMemo(() => Math.round((budget || 0) / Math.max(1, days) / Math.max(1, travellers)), [budget, days, travellers])

  async function plan(e) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      const trip = await api.planTrip({
        destination: dest.trim(),
        days: Number(days),
        travellers: Number(travellers),
        budget: Number(budget),
        interests,
        startDate,
        travelStyle: style,
        save,
      })
      setResult(trip)
      setSuggestions([])
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <div className="page-head">
        <h1>Plan a trip</h1>
        <p className="lede">
          Tell us where, when, how long and what you enjoy. The planner orders the days around your
          interests, checks the forecast and prices the whole thing against your budget.
        </p>
      </div>

      <div className="grid hero" style={{ alignItems: 'start' }}>
        {/* ---------------- input ---------------- */}
        <form className="card" onSubmit={plan}>
          <h3>Trip details</h3>

          <label className="field" style={{ position: 'relative' }}>
            <span>Destination</span>
            <input
              value={dest}
              onChange={(e) => setDest(e.target.value)}
              placeholder="Try Manali, Goa, Kerala or any city"
              required
              autoComplete="off"
            />
            {suggestions.length > 0 && (
              <div
                style={{
                  position: 'absolute',
                  zIndex: 20,
                  left: 0,
                  right: 0,
                  top: 62,
                  background: 'var(--panel-2)',
                  border: '1px solid var(--line)',
                  borderRadius: 'var(--radius-sm)',
                  overflow: 'hidden',
                  boxShadow: 'var(--shadow)',
                  maxHeight: 240,
                  overflowY: 'auto',
                }}
              >
                {suggestions.map((s) => (
                  <button
                    type="button"
                    key={`${s.name}-${s.state}-${s.latitude}`}
                    className="ghost"
                    style={{
                      display: 'block',
                      width: '100%',
                      textAlign: 'left',
                      border: 'none',
                      borderRadius: 0,
                      padding: '10px 12px',
                      fontWeight: 500,
                    }}
                    onClick={() => {
                      setDest(s.name)
                      setSuggestions([])
                    }}
                  >
                    {s.name}
                    {s.state ? `, ${s.state}` : ''}{' '}
                    <span className="faint" style={{ fontSize: 11 }}>
                      {s.inCatalogue ? 'curated' : 'live lookup'}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </label>

          <div className="grid c3" style={{ gap: 12 }}>
            <label className="field">
              <span>Days</span>
              <input
                type="number"
                min="1"
                max="30"
                value={days}
                onChange={(e) => setDays(e.target.value)}
              />
            </label>
            <label className="field">
              <span>Travellers</span>
              <input
                type="number"
                min="1"
                max="20"
                value={travellers}
                onChange={(e) => setTravellers(e.target.value)}
              />
            </label>
            <label className="field">
              <span>Total budget (Rs)</span>
              <input
                type="number"
                min="0"
                step="1000"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
              />
            </label>
          </div>
          <div className="hint" style={{ marginTop: -6, marginBottom: 14 }}>
            About {rupees(perDay)} per person per day
          </div>

          <div className="grid c2" style={{ gap: 12 }}>
            <label className="field">
              <span>Start date</span>
              <input
                type="date"
                value={startDate}
                min={todayIso(0)}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </label>
            <label className="field">
              <span>Travel style</span>
              <select value={style} onChange={(e) => setStyle(e.target.value)}>
                {STYLES.map((s) => (
                  <option key={s.v} value={s.v}>
                    {s.l}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="field">
            <span>Interests</span>
            <div className="chips">
              {INTERESTS.map((i) => (
                <button
                  type="button"
                  key={i}
                  className={`chip ${interests.includes(i) ? 'on' : ''}`}
                  onClick={() => toggle(i)}
                >
                  {i}
                </button>
              ))}
            </div>
          </label>

          <label className="row" style={{ marginBottom: 16, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={save}
              onChange={(e) => setSave(e.target.checked)}
              style={{ width: 16, height: 16 }}
            />
            <span className="muted" style={{ fontSize: 13.5 }}>
              Save this trip to my account
            </span>
          </label>

          <ErrorBox error={error} onClose={() => setError('')} />

          <button className="primary block" disabled={busy || !dest.trim()}>
            {busy ? (
              <>
                <span className="spin" /> Building your itinerary
              </>
            ) : (
              '✦ Generate itinerary'
            )}
          </button>

          {status && (
            <div className="hint" style={{ marginTop: 12 }}>
              <b>Weather:</b> {status.weather} · <b>Places:</b> {status.geocoding}
              <br />
              <b>AI:</b> {status.ai}
            </div>
          )}
        </form>

        {/* ---------------- result ---------------- */}
        <div className="stack">
          {!result && (
            <div className="card">
              <EmptyPreview />
            </div>
          )}

          {result && (
            <>
              <div className="card">
                <div className="card-head">
                  <div>
                    <h2>{result.title}</h2>
                    <p>
                      {result.destination}
                      {result.destinationState ? `, ${result.destinationState}` : ''} ·{' '}
                      {prettyDate(result.startDate)} · {result.days} days · {result.travellers}{' '}
                      traveller{result.travellers > 1 ? 's' : ''}
                    </p>
                  </div>
                  <span className={`badge ${result.generatedBy === 'gemini' ? 'violet' : 'sky'}`}>
                    {result.generatedBy === 'gemini' ? 'AI generated' : 'Planner engine'}
                  </span>
                </div>

                <div className="row" style={{ marginBottom: 6 }}>
                  <span className={`badge ${result.liveWeather ? 'teal' : 'grey'}`}>
                    {result.liveWeather ? '● live weather' : '○ estimated weather'}
                  </span>
                  {result.aiNote && <span className="faint" style={{ fontSize: 12 }}>{result.aiNote}</span>}
                </div>

                {result.weatherSummary && (
                  <div className="alert info" style={{ marginTop: 12 }}>
                    {result.weatherSummary}
                  </div>
                )}

                {/* budget */}
                <h3 style={{ marginTop: 20 }}>Budget estimate</h3>
                <div className="kv">
                  <span>Stay ({result.days} nights)</span>
                  <b>{rupees(result.budgetBreakdown.stay)}</b>
                </div>
                <div className="kv">
                  <span>Transport</span>
                  <b>{rupees(result.budgetBreakdown.transport)}</b>
                </div>
                <div className="kv">
                  <span>Food</span>
                  <b>{rupees(result.budgetBreakdown.food)}</b>
                </div>
                <div className="kv">
                  <span>Activities &amp; entry</span>
                  <b>{rupees(result.budgetBreakdown.activities)}</b>
                </div>
                <div className="kv">
                  <span>Miscellaneous</span>
                  <b>{rupees(result.budgetBreakdown.miscellaneous)}</b>
                </div>
                <div className="kv" style={{ fontSize: 15 }}>
                  <span>
                    <b style={{ fontFamily: 'var(--sans)' }}>Estimated total</b>
                  </span>
                  <b style={{ color: result.budgetBreakdown.withinBudget ? 'var(--green)' : 'var(--rose)' }}>
                    {rupees(result.budgetBreakdown.total)}
                  </b>
                </div>
                <Bar value={result.budgetBreakdown.total} max={result.budgetBreakdown.budgetGiven} />
                <div className="faint" style={{ fontSize: 12.5 }}>
                  {rupees(result.budgetBreakdown.perPerson)} per person against a budget of{' '}
                  {rupees(result.budgetBreakdown.budgetGiven)}. {result.budgetBreakdown.verdict}
                </div>

                {result.status === 'SAVED' && (
                  <button
                    className="primary block"
                    style={{ marginTop: 16 }}
                    onClick={() => navigate(`/plan/${result.id}`)}
                  >
                    Open full trip →
                  </button>
                )}
              </div>

              {/* day by day */}
              <h3>Day by day</h3>
              {result.itinerary.map((d) => (
                <div className="day" key={d.day}>
                  <div className="day-head">
                    <div className="day-num">{d.day}</div>
                    <div className="day-title">
                      <b>{d.theme}</b>
                      <span>
                        {prettyDate(d.date)}
                        {d.tempMax != null && ` · ${Math.round(d.tempMin)}–${Math.round(d.tempMax)}°C`}
                        {d.weather ? ` · ${d.weather}` : ''}
                      </span>
                    </div>
                    <div className="right">
                      <div className="faint" style={{ fontSize: 11 }}>
                        DAY COST
                      </div>
                      <b className="mono" style={{ color: 'var(--amber)' }}>
                        {rupees(d.dayCost)}
                      </b>
                    </div>
                  </div>
                  <div className="day-body">
                    {d.summary && <p style={{ fontSize: 13 }}>{d.summary}</p>}
                    {d.activities.map((a, i) => (
                      <div className="act" key={`${d.day}-${i}`}>
                        <div className="act-time">{a.time}</div>
                        <div className="act-main">
                          <b>{a.title}</b>
                          <p>{a.description}</p>
                          <div className="act-meta">
                            {a.category && <span className="badge grey">{a.category}</span>}
                            {a.place && <span className="badge sky">{a.place}</span>}
                            {a.durationMinutes >= 60 && (
                              <span className="badge grey">
                                {Math.round((a.durationMinutes / 60) * 10) / 10} h
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="act-cost">{a.cost ? rupees(a.cost) : 'Free'}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {/* recommendations */}
              <div className="card">
                <h3>Budget-based suggestions</h3>
                <ul className="tips">
                  {result.budgetTips.map((t, i) => (
                    <li key={i}>{t}</li>
                  ))}
                </ul>
              </div>

              {result.recommendations.length > 0 && (
                <div className="card">
                  <h3>Good to know</h3>
                  <ul className="tips">
                    {result.recommendations.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </div>
              )}

              {result.places.length > 0 && (
                <div className="card">
                  <h3>Recommended places</h3>
                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>Place</th>
                          <th>Area</th>
                          <th>Best time</th>
                          <th className="right">Entry</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.places.map((p, i) => (
                          <tr key={i}>
                            <td>
                              <b>{p.name}</b>
                              {p.interest && (
                                <div>
                                  <span className="badge green" style={{ marginTop: 4 }}>
                                    matches {p.interest}
                                  </span>
                                </div>
                              )}
                              <div className="faint" style={{ fontSize: 12, marginTop: 3 }}>
                                {p.whyRecommended}
                              </div>
                            </td>
                            <td className="nowrap">{p.area}</td>
                            <td className="nowrap">{p.bestTime}</td>
                            <td className="right mono nowrap">
                              {p.approxCost ? rupees(p.approxCost) : 'Free'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {result.activities.length > 0 && (
                <div className="card">
                  <h3>Activity recommendations</h3>
                  <div className="grid c2" style={{ gap: 10 }}>
                    {result.activities.map((a, i) => (
                      <div
                        key={i}
                        style={{
                          border: '1px solid var(--line-soft)',
                          borderRadius: 'var(--radius-sm)',
                          padding: 12,
                        }}
                      >
                        <div className="row between" style={{ marginBottom: 4 }}>
                          <b style={{ fontSize: 13.5 }}>{a.name}</b>
                          <span className="mono" style={{ fontSize: 12.5, color: 'var(--amber)' }}>
                            {rupees(a.approxCost)}
                          </span>
                        </div>
                        <div className="faint" style={{ fontSize: 12, lineHeight: 1.5 }}>
                          {a.description}
                        </div>
                        <div className="act-meta">
                          <span className="badge grey">{a.category}</span>
                          {a.duration && <span className="badge grey">{a.duration}</span>}
                          {a.interest && <span className="badge green">{a.interest}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  )
}

function EmptyPreview() {
  const rows = [
    ['Day 1', 'Arrival and an easy first walk', '₹'],
    ['Day 2', 'The main sights, timed for the light', '₹'],
    ['Day 3', 'Something off the beaten track', '₹'],
  ]
  return (
    <div>
      <h3>What you get</h3>
      <p style={{ fontSize: 13.5 }}>
        A day-by-day itinerary ordered around your interests, with live weather for your dates, the
        places worth seeing, realistic entry costs and a total that is checked against your budget.
      </p>
      {rows.map(([d, t]) => (
        <div className="act" key={d}>
          <div className="act-time">{d}</div>
          <div className="act-main">
            <b>{t}</b>
            <p style={{ fontSize: 12.5 }}>Timed, costed and checked against the forecast.</p>
          </div>
          <div className="act-cost">₹</div>
        </div>
      ))}
      <div className="hint" style={{ marginTop: 14 }}>
        Ten destinations are curated and any other city is resolved through live lookup, so the
        planner works even where we have no hand-written guide.
      </div>
    </div>
  )
}
