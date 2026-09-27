import { useEffect, useState } from 'react'
import { api } from '../api'
import {
  Empty,
  ErrorBox,
  Loading,
  OkBox,
  StatusBadge,
  prettyDate,
  rupees,
  shortDateTime,
} from '../components/ui'

const FILTERS = [
  { v: '', l: 'All' },
  { v: 'CONFIRMED', l: 'Confirmed' },
  { v: 'CANCELLED', l: 'Cancelled' },
]

export default function Bookings() {
  const [bookings, setBookings] = useState(null)
  const [summary, setSummary] = useState(null)
  const [filter, setFilter] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [busyId, setBusyId] = useState(null)

  async function load() {
    setError('')
    try {
      const [b, s] = await Promise.all([api.myBookings(), api.bookingSummary()])
      setBookings(b)
      setSummary(s)
    } catch (err) {
      setError(err.message)
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function cancel(b) {
    const reason = window.prompt(
      `Cancel ${b.reference} (${b.title})?\n\nA reason is optional. Refund is calculated from the cancellation policy.`
    )
    if (reason === null) return
    setBusyId(b.id)
    setError('')
    setMessage('')
    try {
      const res = await api.cancelBooking(b.id, reason)
      setMessage(
        `${res.reference} cancelled. ${res.refundAmount > 0 ? `Refund of ${rupees(res.refundAmount)}.` : 'No refund is due under the policy.'}`,
      )
      await load()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusyId(null)
    }
  }

  const shown = (bookings || []).filter((b) => !filter || b.status === filter)

  return (
    <>
      <div className="page-head">
        <h1>My bookings</h1>
        <p className="lede">
          Full booking history with live refund calculations. Cancelling shows exactly what comes
          back under the hotel or transport policy.
        </p>
      </div>

      <ErrorBox error={error} onClose={() => setError('')} />
      <OkBox message={message} onClose={() => setMessage('')} />

      {summary && (
        <div className="grid c4" style={{ marginBottom: 18 }}>
          <div className="stat">
            <div className="v">{summary.totalBookings}</div>
            <div className="l">Total bookings</div>
          </div>
          <div className="stat">
            <div className="v" style={{ color: 'var(--green)' }}>
              {summary.confirmed}
            </div>
            <div className="l">Confirmed</div>
            <div className="s">{rupees(summary.totalSpent)} committed</div>
          </div>
          <div className="stat">
            <div className="v" style={{ color: 'var(--rose)' }}>
              {summary.cancelled}
            </div>
            <div className="l">Cancelled</div>
            <div className="s">{rupees(summary.refunded)} refunded</div>
          </div>
          <div className="stat">
            <div className="v">{summary.hotels + summary.transport}</div>
            <div className="l">Hotels &amp; transport</div>
            <div className="s">
              {summary.hotels} stays · {summary.transport} journeys
            </div>
          </div>
        </div>
      )}

      <div className="row" style={{ marginBottom: 14 }}>
        {FILTERS.map((f) => (
          <button
            key={f.v}
            className={`chip ${filter === f.v ? 'on' : ''}`}
            onClick={() => setFilter(f.v)}
          >
            {f.l}
          </button>
        ))}
      </div>

      {!bookings ? (
        <Loading label="Loading bookings" />
      ) : bookings.length === 0 ? (
        <div className="card">
          <Empty icon="☑" title="No bookings yet">
            Search hotels and transport to make your first reservation.
          </Empty>
        </div>
      ) : shown.length === 0 ? (
        <div className="card">
          <Empty icon="☑" title="Nothing in this view" />
        </div>
      ) : (
        <div className="stack">
          {shown.map((b) => (
            <div className="card" key={b.id}>
              <div className="row between" style={{ marginBottom: 10, alignItems: 'flex-start' }}>
                <div style={{ minWidth: 0 }}>
                  <div className="row" style={{ marginBottom: 4 }}>
                    <span className="mono faint" style={{ fontSize: 12 }}>
                      {b.reference}
                    </span>
                    <StatusBadge status={b.status} />
                    {b.borrowRequestId && <span className="badge violet">loan funded</span>}
                  </div>
                  <h2 style={{ fontSize: 16, marginBottom: 2 }}>{b.title}</h2>
                  <p style={{ margin: 0, fontSize: 13 }}>
                    {b.subtitle} · {b.destination}
                  </p>
                </div>
                <div className="right nowrap">
                  <div className="mono" style={{ fontSize: 18 }}>
                    {rupees(b.amount)}
                  </div>
                  {b.refundAmount > 0 && (
                    <div className="faint" style={{ fontSize: 12 }}>
                      refund {rupees(b.refundAmount)}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid c4" style={{ gap: 12 }}>
                {b.type === 'HOTEL' ? (
                  <>
                    <Detail label="Check in" value={prettyDate(b.checkIn)} />
                    <Detail label="Check out" value={prettyDate(b.checkOut)} />
                    <Detail label="Rooms" value={`${b.rooms} room${b.rooms === 1 ? '' : 's'}`} />
                    <Detail label="Guests" value={b.travellers} />
                  </>
                ) : (
                  <>
                    <Detail label="Mode" value={b.transportMode} />
                    <Detail label="Departs" value={b.departureTime} />
                    <Detail label="Arrives" value={b.arrivalTime} />
                    <Detail label="Travellers" value={b.travellers} />
                  </>
                )}
              </div>

              {b.status === 'CANCELLED' ? (
                <div className="alert error" style={{ marginTop: 12, marginBottom: 0 }}>
                  Cancelled {shortDateTime(b.cancelledAt)} · {b.cancellationReason}
                  <br />
                  {b.refundAmount > 0
                    ? `${rupees(b.refundAmount)} of ${rupees(b.amount)} refunded.`
                    : 'No refund due under the cancellation policy.'}
                </div>
              ) : (
                <div className="row between" style={{ marginTop: 14 }}>
                  <div className="faint" style={{ fontSize: 12 }}>
                    Booked {shortDateTime(b.createdAt)} ·{' '}
                    {b.refundable ? 'refundable' : 'non-refundable'}
                  </div>
                  <button
                    className="danger sm"
                    disabled={busyId === b.id}
                    onClick={() => cancel(b)}
                  >
                    {busyId === b.id ? (
                      <>
                        <span className="spin" /> Cancelling
                      </>
                    ) : (
                      'Cancel booking'
                    )}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  )
}

function Detail({ label, value }) {
  return (
    <div>
      <div className="faint" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.4 }}>
        {label}
      </div>
      <div style={{ fontSize: 14, marginTop: 2 }}>{value ?? '—'}</div>
    </div>
  )
}
