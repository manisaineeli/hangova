import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'
import { useAuth } from '../auth'
import { biomeForDestination } from '../three/biomes'
import BiomeArt from '../three/BiomeArt'
import NatureCanvas from '../three/NatureCanvas'
import { CountUp, GrowBar, Reveal, Stagger, StaggerItem, Tilt } from '../motion'
import { Empty, ErrorBox, Loading, Stat, StatusBadge, prettyDate, rupees, rupeesShort, todayIso } from '../components/ui'

export default function Dashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [trips, setTrips] = useState(null)
  const [bookings, setBookings] = useState(null)
  const [loans, setLoans] = useState(null)
  const [spend, setSpend] = useState(null)
  const [weather, setWeather] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    Promise.all([
      api.tripStats(),
      api.myTrips(),
      api.myBookings(),
      api.myLoans(),
      api.expenseSummary(),
    ])
      .then(([s, t, b, l, e]) => {
        if (cancelled) return
        setStats(s)
        setTrips(t)
        setBookings(b)
        setLoans(l)
        setSpend(e)
      })
      .catch((err) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [])

  /* show the forecast for the traveller's next trip, if there is one */
  useEffect(() => {
    if (trips && trips.length > 0) {
      api.weather(trips[0].destination, 4).then(setWeather).catch(() => setWeather(null))
    }
  }, [trips])

  if (loading) return <Loading label="Loading your dashboard" />

  const nextTrip = trips && trips.length ? trips[0] : null
  const confirmed = (bookings || []).filter((b) => b.status === 'CONFIRMED')
  const pendingLoans = (loans || []).filter((l) => l.status === 'PENDING')
  const approvedLoans = (loans || []).filter(
    (l) => l.status === 'APPROVED' || l.status === 'DISBURSED',
  )

  return (
    <>
      {/* ---------- hero: the traveller's own trip, rendered in 3D ---------- */}
      <DestinationHero trip={nextTrip} user={user} weather={weather} />

      <div className="page-head" style={{ marginTop: 26 }}>
        <h1>Hello, {user?.fullName?.split(' ')[0]}</h1>
        <p className="lede">
          {nextTrip
            ? `Your next trip is to ${nextTrip.destination}. Everything for it lives on this page.`
            : 'Start by letting the planner build your first itinerary.'}
        </p>
      </div>

      <ErrorBox error={error} onClose={() => setError('')} />

      <Stagger className="grid c4" style={{ marginBottom: 18 }} gap={0.09}>
        <StaggerItem>
          <Stat
            value={<CountUp value={stats?.trips ?? 0} />}
            label="Trips planned"
            sub={`${stats?.plannedDays ?? 0} days planned`}
          />
        </StaggerItem>
        <StaggerItem>
          <Stat
            value={confirmed.length}
            label="Active bookings"
            sub={rupees(confirmed.reduce((s, b) => s + b.amount, 0))}
            color="var(--teal)"
          />
        </StaggerItem>
        <StaggerItem>
          <Stat
            value={rupeesShort(spend?.total ?? 0)}
            label="Expenses recorded"
            sub={`${spend?.count ?? 0} entries`}
            color="var(--amber)"
          />
        </StaggerItem>
        <StaggerItem>
          <Stat
            value={approvedLoans.length}
            label="Approved loans"
            sub={
              approvedLoans.length
                ? rupees(approvedLoans.reduce((s, l) => s + (l.approvedAmount || 0), 0)) + ' available'
                : 'none yet'
            }
            color="var(--green)"
          />
        </StaggerItem>
      </Stagger>

      <div className="grid hero" style={{ alignItems: 'start' }}>
        <div className="stack">
          {/* next trip */}
          <div className="card">
            <div className="card-head">
              <div>
                <h2>{nextTrip ? nextTrip.title : 'No trip yet'}</h2>
                {nextTrip && (
                  <p>
                    {prettyDate(nextTrip.startDate)} · {nextTrip.days} days ·{' '}
                    {nextTrip.travellers} traveller{nextTrip.travellers > 1 ? 's' : ''}
                  </p>
                )}
              </div>
              {nextTrip && <StatusBadge status={nextTrip.status} />}
            </div>

            {!nextTrip ? (
              <Empty
                icon="✦"
                title="Nothing planned yet"
                action={
                  <Link className="btn primary" to="/plan">
                    Plan your first trip
                  </Link>
                }
              >
                The planner turns a destination, a budget and your interests into a day-by-day plan.
              </Empty>
            ) : (
              <>
                {weather && (
                  <div className="alert info">
                    {weather.live ? 'Live forecast' : 'Estimated'}: {weather.summary}
                  </div>
                )}

                <div className="kv">
                  <span>Budget</span>
                  <b>{rupees(nextTrip.budget)}</b>
                </div>
                {nextTrip.budgetBreakdown && (
                  <>
                    <div className="kv">
                      <span>Estimated total</span>
                      <b
                        style={{
                          color: nextTrip.budgetBreakdown.withinBudget ? 'var(--green)' : 'var(--rose)',
                        }}
                      >
                        {rupees(nextTrip.budgetBreakdown.total)}
                      </b>
                    </div>
                    <div className="kv">
                      <span>Per person</span>
                      <b>{rupees(nextTrip.budgetBreakdown.perPerson)}</b>
                    </div>
                  </>
                )}

                <div className="row" style={{ marginTop: 16 }}>
                  <Link className="btn primary" to={`/plan/${nextTrip.id}`}>
                    Open itinerary
                  </Link>
                  <Link className="btn" to={`/book?destination=${encodeURIComponent(nextTrip.destination)}`}>
                    Find hotels &amp; transport
                  </Link>
                </div>
              </>
            )}
          </div>

          {/* recent bookings */}
          <div className="card">
            <div className="card-head">
              <div>
                <h2>Recent bookings</h2>
                <p>Your most recent reservations and loans.</p>
              </div>
              <Link className="btn sm" to="/bookings">
                View all
              </Link>
            </div>

            {(!bookings || bookings.length === 0) && (!loans || loans.length === 0) ? (
              <Empty icon="☑" title="No bookings yet">
                Search hotels and transport for a destination and book in one step.
              </Empty>
            ) : (
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
                    {(bookings || []).slice(0, 5).map((b) => (
                      <tr key={b.id}>
                        <td className="mono nowrap">{b.reference}</td>
                        <td>
                          <b>{b.title}</b>
                          <div className="faint" style={{ fontSize: 12 }}>
                            {b.type === 'HOTEL' ? 'Hotel' : 'Transport'} · {b.destination}
                          </div>
                        </td>
                        <td>
                          <StatusBadge status={b.status} />
                        </td>
                        <td className="right mono nowrap">{rupees(b.amount)}</td>
                      </tr>
                    ))}
                    {(loans || []).slice(0, 3).map((l) => (
                      <tr key={l.id}>
                        <td className="mono nowrap">{l.reference}</td>
                        <td>
                          <b>Travel loan</b>
                          <div className="faint" style={{ fontSize: 12 }}>
                            {l.purpose}
                          </div>
                        </td>
                        <td>
                          <StatusBadge status={l.status} />
                        </td>
                        <td className="right mono nowrap">
                          {rupees(l.approvedAmount || l.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="stack">
          {/* recommended destinations */}
          <div className="card">
            <h3>Where to go next</h3>
            <p className="faint" style={{ fontSize: 12.5 }}>
              Matched to your interests: {user?.interests?.join(', ') || 'general sightseeing'}
            </p>
            <RecommendationList />
          </div>

          {/* quick links */}
          <div className="card">
            <h3>Shortcuts</h3>
            <div className="stack" style={{ gap: 8 }}>
              <Link className="btn block" to="/plan">
                ✦ Plan a new trip
              </Link>
              <Link className="btn block" to="/book">
                ⌂ Hotels &amp; transport
              </Link>
              <Link className="btn block" to="/loans">
                ₹ Apply for a travel loan
              </Link>
              <Link className="btn block" to="/expenses">
                ∑ Record expenses
              </Link>
            </div>
          </div>

          {pendingLoans.length > 0 && (
            <div className="card">
              <h3>Awaiting approval</h3>
              <p className="faint" style={{ fontSize: 12.5 }}>
                An administrator reviews every loan request as nominee.
              </p>
              {pendingLoans.map((l) => (
                <div className="kv" key={l.id}>
                  <span>{l.destination || l.purpose}</span>
                  <b>{rupees(l.amount)}</b>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

/**
 * The dashboard hero. When the traveller already has a trip, the scene is
 * chosen from that destination so the page opens on the right landscape; with
 * no trips it falls back to the profile interests.
 */
function DestinationHero({ trip, user, weather }) {
  const biome = biomeForDestination(
    trip ? { state: trip.destinationState, tags: trip.interests } : {},
    user?.interests || [],
  )

  const style = {
    '--accent': biome.accent,
    '--accent-2': biome.accent2,
    '--glow': `${biome.accent}66`,
  }

  return (
    <div className="card" style={{ ...style, padding: 0, overflow: 'hidden', marginBottom: 4 }}>
      <div style={{ position: 'relative', minHeight: 250 }}>
        <NatureCanvas biome={biome} opacity={0.6} />

        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(100deg, rgba(5,8,15,0.9) 0%, rgba(5,8,15,0.55) 46%, rgba(5,8,15,0.1) 100%)',
            pointerEvents: 'none',
          }}
        />

        <div style={{ position: 'relative', padding: '28px 26px', maxWidth: 560 }}>
          <div className="biome-tag" style={{ top: 22, right: 22, position: 'absolute' }}>
            {biome.signature} · <b>{biome.label}</b>
          </div>

          {trip ? (
            <>
              <div className="row" style={{ marginBottom: 10 }}>
                <span className="badge sky">{trip.destinationState || 'Trip'}</span>
                <StatusBadge status={trip.status} />
              </div>
              <h2 style={{ fontSize: 26, marginBottom: 6 }}>{trip.title}</h2>
              <p style={{ marginBottom: 14 }}>
                {prettyDate(trip.startDate)} · {trip.days} days · {trip.travellers} traveller
                {trip.travellers > 1 ? 's' : ''}
                {weather ? ` · ${weather.summary}` : ''}
              </p>

              <div className="row" style={{ gap: 22, marginBottom: 18 }}>
                <div>
                  <div className="faint" style={{ fontSize: 10, letterSpacing: 0.9 }}>
                    BUDGET
                  </div>
                  <b className="mono" style={{ fontSize: 17 }}>
                    {rupees(trip.budget)}
                  </b>
                </div>
                {trip.budgetBreakdown && (
                  <div>
                    <div className="faint" style={{ fontSize: 10, letterSpacing: 0.9 }}>
                      ESTIMATED
                    </div>
                    <b
                      className="mono"
                      style={{
                        fontSize: 17,
                        color: trip.budgetBreakdown.withinBudget ? 'var(--green)' : 'var(--rose)',
                      }}
                    >
                      {rupees(trip.budgetBreakdown.total)}
                    </b>
                  </div>
                )}
                {trip.budgetBreakdown && (
                  <div>
                    <div className="faint" style={{ fontSize: 10, letterSpacing: 0.9 }}>
                      PER PERSON
                    </div>
                    <b className="mono" style={{ fontSize: 17 }}>
                      {rupees(trip.budgetBreakdown.perPerson)}
                    </b>
                  </div>
                )}
              </div>

              <div className="row">
                <Link className="btn primary" to={`/plan/${trip.id}`}>
                  Open itinerary
                </Link>
                <Link
                  className="btn"
                  to={`/book?destination=${encodeURIComponent(trip.destination)}`}
                >
                  Hotels &amp; transport
                </Link>
              </div>
            </>
          ) : (
            <>
              <span className="badge sky">Welcome</span>
              <h2 style={{ fontSize: 26, margin: '10px 0 6px' }}>
                Your next trip starts here
              </h2>
              <p style={{ marginBottom: 18 }}>
                Give the planner a destination, a budget and your interests, and it will build a
                day-by-day itinerary with live weather and real costs.
              </p>
              <Link className="btn primary" to="/plan">
                ✦ Plan your first trip
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function RecommendationList() {
  const [items, setItems] = useState(null)
  const [interest, setInterest] = useState('')

  useEffect(() => {
    api
      .recommendations(interest)
      .then((r) => setItems(r.destinations || []))
      .catch(() => setItems([]))
  }, [interest])

  const filters = ['Heritage', 'Beaches', 'Mountains', 'Wildlife', 'Food']

  return (
    <>
      <div className="chips" style={{ marginBottom: 12 }}>
        {filters.map((f) => (
          <button
            key={f}
            className={`chip ${interest === f ? 'on' : ''}`}
            onClick={() => setInterest(interest === f ? '' : f)}
          >
            {f}
          </button>
        ))}
      </div>

      {!items ? (
        <Loading label="Loading destinations" />
      ) : items.length === 0 ? (
        <p className="faint">No destinations match that interest yet.</p>
      ) : (
        <Stagger className="stack" style={{ gap: 14 }} gap={0.08}>
          {items.slice(0, 6).map((d) => (
            <StaggerItem key={d.name}>
              <Tilt max={5}>
                <div
                  className="card"
                  style={{ padding: 0, overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}
                >
                  <div style={{ position: 'relative', height: 104 }}>
                    <BiomeArt
                      biome={biomeForDestination(d, [])}
                      style={{ position: 'absolute', inset: 0 }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        inset: 'auto 0 0 0',
                        height: '70%',
                        background: 'linear-gradient(180deg, transparent, rgba(5,8,15,0.94))',
                        pointerEvents: 'none',
                      }}
                    />
                    <div style={{ position: 'absolute', inset: 'auto 0 0 0', padding: 14 }}>
                      <div className="row between">
                        <b style={{ fontSize: 15 }}>{d.name}</b>
                        <span className="faint nowrap" style={{ fontSize: 11.5 }}>
                          {d.idealDays} days · {rupeesShort(d.avgDailyCostPerPerson)}/day
                        </span>
                      </div>
                    </div>
                  </div>
                  <div style={{ padding: '10px 14px 13px' }}>
                    <div className="faint" style={{ fontSize: 12.5, lineHeight: 1.5 }}>
                      {d.summary}
                    </div>
                    <div className="chips" style={{ marginTop: 8 }}>
                      {d.tags.slice(0, 3).map((t) => (
                        <span key={t} className="badge grey">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </Tilt>
            </StaggerItem>
          ))}
        </Stagger>
      )}
    </>
  )
}
