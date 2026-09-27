import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api } from '../api'
import DestinationPanel from '../components/DestinationCard'
import {
  Bar,
  Empty,
  ErrorBox,
  Loading,
  OkBox,
  StatusBadge,
  prettyDate,
  rupees,
  shortDateTime,
} from '../components/ui'

export default function TripDetail() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [trip, setTrip] = useState(null)
  const [bookings, setBookings] = useState([])
  const [expenses, setExpenses] = useState([])
  const [summary, setSummary] = useState(null)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [renaming, setRenaming] = useState(false)
  const [title, setTitle] = useState('')

  async function load() {
    setError('')
    try {
      const [t, b, e, s] = await Promise.all([
        api.trip(id),
        api.myBookings(),
        api.expenses(id),
        api.expenseSummary(id),
      ])
      setTrip(t)
      setTitle(t.title)
      setBookings(b.filter((x) => x.tripId === id))
      setExpenses(e)
      setSummary(s)
    } catch (err) {
      setError(err.message)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  async function saveTitle(e) {
    e.preventDefault()
    setError('')
    setMessage('')
    try {
      await api.renameTrip(id, title)
      setRenaming(false)
      setMessage('Trip renamed.')
      load()
    } catch (err) {
      setError(err.message)
    }
  }

  async function remove() {
    if (!window.confirm('Delete this trip? This cannot be undone.')) return
    try {
      await api.deleteTrip(id)
      navigate('/')
    } catch (err) {
      setError(err.message)
    }
  }

  if (error && !trip) return <ErrorBox error={error} />
  if (!trip) return <Loading label="Loading trip" />

  const bb = trip.budgetBreakdown
  const combined =
    (summary?.total || 0) + bookings.filter((b) => b.status === 'CONFIRMED').reduce((s, b) => s + b.amount, 0)

  return (
    <>
      {/* the trip's own landscape, chosen from its destination state */}
      <DestinationPanel destination={trip} height={272}>
        <div className="row between" style={{ alignItems: 'flex-start' }}>
          <div style={{ maxWidth: 620 }}>
            <div className="row" style={{ marginBottom: 8 }}>
              <StatusBadge status={trip.status} />
              <span className="badge sky">
                {trip.generatedBy === 'gemini' ? 'AI generated' : 'Planner engine'}
              </span>
              {trip.liveWeather && <span className="badge teal">● live weather</span>}
            </div>
            <h1 style={{ marginBottom: 6 }}>{trip.title}</h1>
            <p style={{ marginBottom: 0 }}>
              {trip.destination}
              {trip.destinationState ? `, ${trip.destinationState}` : ''} · {prettyDate(trip.startDate)} ·{' '}
              {trip.days} days · {trip.travellers} traveller{trip.travellers > 1 ? 's' : ''}
            </p>
          </div>
          <div className="row">
            <button className="sm" onClick={() => setRenaming((v) => !v)}>
              Rename
            </button>
            <button className="sm danger" onClick={remove}>
              Delete
            </button>
          </div>
        </div>
      </DestinationPanel>

      <div style={{ height: 18 }} />

      <ErrorBox error={error} onClose={() => setError('')} />
      <OkBox message={message} onClose={() => setMessage('')} />

      {renaming && (
        <form className="card" style={{ marginBottom: 18 }} onSubmit={saveTitle}>
          <h3>Rename trip</h3>
          <div className="row">
            <input value={title} onChange={(e) => setTitle(e.target.value)} style={{ flex: 1 }} />
            <button className="primary">Save</button>
            <button type="button" className="ghost" onClick={() => setRenaming(false)}>
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="grid hero" style={{ alignItems: 'start' }}>
        <div className="stack">
          <h3>Itinerary</h3>
          {trip.itinerary.map((d) => (
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
                  <div className="act" key={i}>
                    <div className="act-time">{a.time}</div>
                    <div className="act-main">
                      <b>{a.title}</b>
                      <p>{a.description}</p>
                      <div className="act-meta">
                        {a.category && <span className="badge grey">{a.category}</span>}
                        {a.place && <span className="badge sky">{a.place}</span>}
                      </div>
                    </div>
                    <div className="act-cost">{a.cost ? rupees(a.cost) : 'Free'}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {bookings.length > 0 && (
            <div className="card">
              <h3>Bookings for this trip</h3>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Reference</th>
                      <th>What</th>
                      <th>Status</th>
                      <th className="right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.map((b) => (
                      <tr key={b.id}>
                        <td className="mono nowrap">{b.reference}</td>
                        <td>
                          <b>{b.title}</b>
                          <div className="faint" style={{ fontSize: 12 }}>
                            {b.seatOrRoom || b.subtitle}
                          </div>
                        </td>
                        <td>
                          <StatusBadge status={b.status} />
                        </td>
                        <td className="right mono nowrap">
                          {rupees(b.amount)}
                          {b.refundAmount > 0 && (
                            <div className="faint" style={{ fontSize: 11 }}>
                              -{rupees(b.refundAmount)}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {expenses.length > 0 && (
            <div className="card">
              <div className="card-head">
                <div>
                  <h3>Expenses</h3>
                  <p>What you actually spent on this trip.</p>
                </div>
                <Link className="btn sm" to="/expenses">
                  Manage
                </Link>
              </div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Category</th>
                      <th>Description</th>
                      <th className="right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenses.map((e) => (
                      <tr key={e.id}>
                        <td className="nowrap">{prettyDate(e.date)}</td>
                        <td>
                          <span className="badge grey">{e.category}</span>
                        </td>
                        <td>{e.description}</td>
                        <td className="right mono nowrap">{rupees(e.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="stack">
          <div className="card">
            <h3>Budget</h3>
            <div className="kv">
              <span>Your budget</span>
              <b>{rupees(trip.budget)}</b>
            </div>
            <div className="kv">
              <span>Planned estimate</span>
              <b>{rupees(bb?.total || 0)}</b>
            </div>
            <div className="kv">
              <span>Bookings (confirmed)</span>
              <b>
                {rupees(bookings.filter((b) => b.status === 'CONFIRMED').reduce((s, b) => s + b.amount, 0))}
              </b>
            </div>
            <div className="kv">
              <span>Expenses recorded</span>
              <b>{rupees(summary?.total || 0)}</b>
            </div>
            <div className="kv" style={{ fontSize: 15 }}>
              <span>
                <b style={{ fontFamily: 'var(--sans)' }}>Committed so far</b>
              </span>
              <b style={{ color: combined <= trip.budget ? 'var(--green)' : 'var(--rose)' }}>
                {rupees(combined)}
              </b>
            </div>
            <Bar value={combined} max={trip.budget} />
            <div className="faint" style={{ fontSize: 12.5 }}>
              {combined <= trip.budget
                ? `${rupees(trip.budget - combined)} still unspent.`
                : `${rupees(combined - trip.budget)} over budget.`}
            </div>
          </div>

          {trip.weatherSummary && (
            <div className="card">
              <h3>Weather</h3>
              <div className="row" style={{ marginBottom: 8 }}>
                <span className={`badge ${trip.liveWeather ? 'teal' : 'grey'}`}>
                  {trip.liveWeather ? 'live' : 'estimated'}
                </span>
              </div>
              <p style={{ margin: 0 }}>{trip.weatherSummary}</p>
            </div>
          )}

          {trip.budgetTips?.length > 0 && (
            <div className="card">
              <h3>Money-saving tips</h3>
              <ul className="tips">
                {trip.budgetTips.map((t, i) => (
                  <li key={i}>{t}</li>
                ))}
              </ul>
            </div>
          )}

          {trip.recommendations?.length > 0 && (
            <div className="card">
              <h3>Good to know</h3>
              <ul className="tips">
                {trip.recommendations.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="card">
            <h3>Plan this trip</h3>
            <div className="stack" style={{ gap: 8 }}>
              <Link className="btn block" to={`/book?destination=${encodeURIComponent(trip.destination)}&tripId=${trip.id}`}>
                ⌂ Book hotels &amp; transport
              </Link>
              <Link className="btn block" to={`/expenses?tripId=${trip.id}`}>
                ∑ Record expenses
              </Link>
              <Link className="btn block" to="/loans">
                ₹ Apply for a travel loan
              </Link>
            </div>
            <div className="hint" style={{ marginTop: 12 }}>
              Created {shortDateTime(trip.createdAt)} · {trip.generatedBy === 'gemini' ? 'written by Gemini' : 'built by the planner engine'}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
