import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { api } from '../api'
import {
  Empty,
  ErrorBox,
  Loading,
  addDaysIso,
  prettyDate,
  rupees,
  todayIso,
} from '../components/ui'

const MODES = [
  { v: '', l: 'All' },
  { v: 'FLIGHT', l: 'Flights' },
  { v: 'TRAIN', l: 'Trains' },
  { v: 'BUS', l: 'Buses' },
]

export default function Book() {
  const [params] = useSearchParams()

  const [destination, setDestination] = useState(params.get('destination') || '')
  const [checkIn, setCheckIn] = useState(todayIso(21))
  const [checkOut, setCheckOut] = useState(addDaysIso(todayIso(21), 3))
  const [date, setDate] = useState(todayIso(21))
  const [travellers, setTravellers] = useState(2)
  const [rooms, setRooms] = useState(1)
  const [tab, setTab] = useState('hotels')
  const [mode, setMode] = useState('')
  const [tripId, setTripId] = useState(params.get('tripId') || '')

  const [hotels, setHotels] = useState(null)
  const [transport, setTransport] = useState(null)
  const [weather, setWeather] = useState(null)
  const [loans, setLoans] = useState([])
  const [trips, setTrips] = useState([])

  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [booking, setBooking] = useState(null)

  useEffect(() => {
    api.usableLoans().then(setLoans).catch(() => setLoans([]))
    api.myTrips().then(setTrips).catch(() => setTrips([]))
  }, [])

  async function search(e) {
    e?.preventDefault()
    if (!destination.trim()) return
    setError('')
    setMessage('')
    setBooking(null)
    setBusy(true)
    try {
      const w = await api.weather(destination.trim(), 5).catch(() => null)
      setWeather(w)
      if (tab === 'hotels') {
        setTransport(null)
        setHotels(await api.hotels(destination.trim(), checkIn, checkOut, travellers, rooms))
      } else {
        setHotels(null)
        setTransport(await api.transport(destination.trim(), date, travellers, mode))
      }
    } catch (err) {
      setError(err.message)
      setHotels(null)
      setTransport(null)
    } finally {
      setBusy(false)
    }
  }

  // search straight away when arriving with a destination from a trip
  useEffect(() => {
    if (params.get('destination')) search()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function bookHotel(h) {
    setError('')
    setMessage('')
    try {
      const b = await api.createBooking({
        type: 'HOTEL',
        title: h.name,
        provider: h.name,
        subtitle: `${h.area} · ${h.tier} · ${h.rating}★`,
        destination: destination.trim(),
        checkIn: h.checkIn,
        checkOut: h.checkOut,
        travellers,
        rooms,
        amount: h.totalPrice,
        refundable: h.refundable,
        tripId: tripId || null,
        borrowRequestId: booking?.loanId || null,
      })
      setBooking(b)
      setMessage(`Booked ${b.reference} — ${b.title}.`)
      setHotels(await api.hotels(destination.trim(), checkIn, checkOut, travellers, rooms))
    } catch (err) {
      setError(err.message)
    }
  }

  async function bookTransport(t) {
    setError('')
    setMessage('')
    try {
      const b = await api.createBooking({
        type: 'TRANSPORT',
        title: `${t.operator} ${t.from} → ${t.to}`,
        provider: t.operator,
        subtitle: `${t.mode} · ${t.travelClass}`,
        destination: destination.trim(),
        travellers,
        amount: t.totalPrice,
        transportMode: t.mode,
        departureTime: t.depart,
        arrivalTime: t.arrive,
        refundable: t.refundable,
        tripId: tripId || null,
        borrowRequestId: booking?.loanId || null,
      })
      setBooking(b)
      setMessage(`Booked ${b.reference} — ${b.title}.`)
      setTransport(await api.transport(destination.trim(), date, travellers, mode))
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <>
      <div className="page-head">
        <h1>Hotels &amp; transport</h1>
        <p className="lede">
          Search real availability for your destination, compare options side by side and book in one
          step. Weather for the dates is fetched at the same time.
        </p>
      </div>

      <form className="card" style={{ marginBottom: 18 }} onSubmit={search}>
        <div className="grid c4" style={{ gap: 12, marginBottom: 12 }}>
          <label className="field" style={{ margin: 0 }}>
            <span>Destination</span>
            <input
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="City or destination"
              required
            />
          </label>
          <label className="field" style={{ margin: 0 }}>
            <span>Travellers</span>
            <input
              type="number"
              min="1"
              max="20"
              value={travellers}
              onChange={(e) => setTravellers(Number(e.target.value))}
            />
          </label>
          <label className="field" style={{ margin: 0 }}>
            <span>Attach to trip</span>
            <select value={tripId} onChange={(e) => setTripId(e.target.value)}>
              <option value="">No trip</option>
              {trips.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </select>
          </label>
          <label className="field" style={{ margin: 0 }}>
            <span>Pay using loan</span>
            <select
              value={booking?.loanId || ''}
              onChange={(e) =>
                setBooking((b) => ({ ...(b || {}), loanId: e.target.value || null }))
              }
            >
              <option value="">Own money</option>
              {loans.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.reference} · {rupees(l.approvedAmount || l.amount)}
                </option>
              ))}
            </select>
          </label>
        </div>

        {tab === 'hotels' ? (
          <div className="grid c3" style={{ gap: 12, marginBottom: 12 }}>
            <label className="field" style={{ margin: 0 }}>
              <span>Check in</span>
              <input type="date" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} />
            </label>
            <label className="field" style={{ margin: 0 }}>
              <span>Check out</span>
              <input type="date" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} />
            </label>
            <label className="field" style={{ margin: 0 }}>
              <span>Rooms</span>
              <input
                type="number"
                min="1"
                max="10"
                value={rooms}
                onChange={(e) => setRooms(Number(e.target.value))}
              />
            </label>
          </div>
        ) : (
          <div className="grid c2" style={{ gap: 12, marginBottom: 12 }}>
            <label className="field" style={{ margin: 0 }}>
              <span>Travel date</span>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </label>
            <div className="field" style={{ margin: 0 }}>
              <span>Mode</span>
              <div className="chips">
                {MODES.map((m) => (
                  <button
                    type="button"
                    key={m.v}
                    className={`chip ${mode === m.v ? 'on' : ''}`}
                    onClick={() => setMode(m.v)}
                  >
                    {m.l}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="row">
          <div className="row" style={{ gap: 6 }}>
            <button
              type="button"
              className={`chip ${tab === 'hotels' ? 'on' : ''}`}
              onClick={() => setTab('hotels')}
            >
              Hotels
            </button>
            <button
              type="button"
              className={`chip ${tab === 'transport' ? 'on' : ''}`}
              onClick={() => setTab('transport')}
            >
              Flights, trains &amp; buses
            </button>
          </div>
          <button className="primary push" disabled={busy || !destination.trim()}>
            {busy ? (
              <>
                <span className="spin" /> Searching
              </>
            ) : (
              'Search'
            )}
          </button>
        </div>
      </form>

      <ErrorBox error={error} onClose={() => setError('')} />
      {message && (
        <div className="alert ok">
          {message}{' '}
          <a href="/bookings" style={{ color: 'inherit', textDecoration: 'underline' }}>
            See my bookings
          </a>
        </div>
      )}

      {weather && (
        <div className={`alert ${weather.live ? 'info' : ''}`}>
          <b>{weather.live ? 'Live forecast' : 'Weather estimate'}:</b> {weather.summary}
          {weather.days?.length > 0 && (
            <div className="row" style={{ marginTop: 8, gap: 8 }}>
              {weather.days.map((d) => (
                <span key={d.date} className="badge grey">
                  {d.date.slice(5)} · {Math.round(d.tempMin)}–{Math.round(d.tempMax)}°C
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {busy && <Loading label="Searching providers" />}

      {/* ---------------- hotels ---------------- */}
      {tab === 'hotels' && hotels && (
        <>
          <h3>
            {hotels.length} stay{hotels.length === 1 ? '' : 's'} · {prettyDate(checkIn)} to{' '}
            {prettyDate(checkOut)}
          </h3>
          {hotels.length === 0 ? (
            <div className="card">
              <Empty icon="⌂" title="No stays found">
                Try different dates.
              </Empty>
            </div>
          ) : (
            <div className="grid c2">
              {hotels.map((h) => (
                <div className="card" key={h.id}>
                  <div className="card-head">
                    <div>
                      <h2 style={{ fontSize: 16 }}>{h.name}</h2>
                      <p>
                        {h.area} · {h.rating}★ · {h.tier.toLowerCase()}
                      </p>
                    </div>
                    <div className="right">
                      <div className="mono" style={{ fontSize: 19, color: 'var(--green)' }}>
                        {rupees(h.perNight)}
                      </div>
                      <div className="faint" style={{ fontSize: 11.5 }}>
                        per night
                      </div>
                    </div>
                  </div>

                  <p style={{ fontSize: 13 }}>{h.note}</p>

                  <div className="chips" style={{ marginBottom: 12 }}>
                    {h.amenities.split(',').map((a) => (
                      <span key={a} className="badge grey">
                        {a.trim()}
                      </span>
                    ))}
                  </div>

                  <div className="kv">
                    <span>
                      {h.nights} night{h.nights === 1 ? '' : 's'} × {h.rooms} room
                      {h.rooms === 1 ? '' : 's'}
                    </span>
                    <b>{rupees(h.totalPrice)}</b>
                  </div>
                  <div className="kv">
                    <span>Rooms available</span>
                    <b>{h.roomsAvailable}</b>
                  </div>
                  <div className="kv">
                    <span>Cancellation</span>
                    <b style={{ fontFamily: 'var(--sans)', fontSize: 12.5, textAlign: 'right' }}>
                      {h.cancellationPolicy}
                    </b>
                  </div>

                  <button className="primary block" style={{ marginTop: 14 }} onClick={() => bookHotel(h)}>
                    Book for {rupees(h.totalPrice)}
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ---------------- transport ---------------- */}
      {tab === 'transport' && transport && (
        <>
          <h3>
            {transport.length} option{transport.length === 1 ? '' : 's'} · {prettyDate(date)}
          </h3>
          {transport.length === 0 ? (
            <div className="card">
              <Empty icon="✈" title="No options for that mode">
                Try selecting All.
              </Empty>
            </div>
          ) : (
            <div className="stack">
              {transport.map((t) => (
                <div className="card" key={t.id}>
                  <div className="row between" style={{ marginBottom: 10 }}>
                    <div>
                      <h2 style={{ fontSize: 16, marginBottom: 2 }}>{t.operator}</h2>
                      <p style={{ margin: 0 }}>
                        {t.travelClass} · {t.durationMinutes >= 60
                          ? `${Math.floor(t.durationMinutes / 60)}h ${t.durationMinutes % 60}m`
                          : `${t.durationMinutes}m`}
                      </p>
                    </div>
                    <div className="right">
                      <div className="mono" style={{ fontSize: 19, color: 'var(--sky)' }}>
                        {rupees(t.fare)}
                      </div>
                      <div className="faint" style={{ fontSize: 11.5 }}>
                        per person
                      </div>
                    </div>
                  </div>

                  <div className="row" style={{ gap: 18, marginBottom: 12 }}>
                    <div>
                      <div className="mono" style={{ fontSize: 18 }}>
                        {t.depart}
                      </div>
                      <div className="faint" style={{ fontSize: 12 }}>
                        {t.from}
                      </div>
                    </div>
                    <div style={{ flex: 1, minWidth: 60, textAlign: 'center' }}>
                      <div
                        style={{
                          height: 1,
                          background: 'var(--line)',
                          position: 'relative',
                        }}
                      >
                        <span
                          style={{
                            position: 'absolute',
                            left: '50%',
                            top: -5,
                            transform: 'translateX(-50%)',
                            fontSize: 11,
                            color: 'var(--faint)',
                          }}
                        >
                          {t.mode === 'FLIGHT' ? '✈' : t.mode === 'TRAIN' ? '🚆' : '🚌'}
                        </span>
                      </div>
                    </div>
                    <div>
                      <div className="mono" style={{ fontSize: 18 }}>
                        {t.arrive}
                      </div>
                      <div className="faint" style={{ fontSize: 12 }}>
                        {t.to}
                      </div>
                    </div>
                  </div>

                  <div className="row between">
                    <div className="chips">
                      <span className={`badge ${t.seatsLeft > 5 ? 'green' : t.seatsLeft > 0 ? 'amber' : 'rose'}`}>
                        {t.seatsLeft > 0 ? `${t.seatsLeft} seats left` : 'Sold out'}
                      </span>
                      <span className="badge grey">
                        {travellers} × {rupees(t.fare)} = {rupees(t.totalPrice)}
                      </span>
                    </div>
                    <button
                      className="primary"
                      disabled={t.seatsLeft < travellers}
                      onClick={() => bookTransport(t)}
                    >
                      Book {rupees(t.totalPrice)}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </>
  )
}
