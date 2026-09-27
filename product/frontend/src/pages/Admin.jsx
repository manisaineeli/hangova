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

const TABS = [
  { v: 'loans', l: 'Loan requests' },
  { v: 'bookings', l: 'Bookings' },
  { v: 'users', l: 'Users' },
  { v: 'activity', l: 'Activity' },
]

export default function Admin() {
  const [tab, setTab] = useState('loans')
  const [overview, setOverview] = useState(null)
  const [loans, setLoans] = useState(null)
  const [bookings, setBookings] = useState(null)
  const [users, setUsers] = useState(null)
  const [activity, setActivity] = useState(null)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [busyId, setBusyId] = useState(null)

  useEffect(() => {
    api.adminOverview().then(setOverview).catch(() => setOverview(null))
  }, [])

  useEffect(() => {
    setError('')
    if (tab === 'loans') api.allLoans().then(setLoans).catch((e) => setError(e.message))
    if (tab === 'bookings') api.adminBookings().then(setBookings).catch((e) => setError(e.message))
    if (tab === 'users') api.adminUsers().then(setUsers).catch((e) => setError(e.message))
    if (tab === 'activity') api.adminActivity(60).then(setActivity).catch((e) => setError(e.message))
  }, [tab])

  async function decide(id, approve) {
    let note
    let approved
    if (approve) {
      const amt = window.prompt('Approved amount in rupees (leave blank to approve in full)')
      if (amt === null) return
      approved = amt.trim() === '' ? undefined : Number(amt)
      note = window.prompt('Note for the traveller (optional)') ?? undefined
    } else {
      note = window.prompt('Reason for rejection') ?? undefined
      if (!note) return
    }
    setBusyId(id)
    setError('')
    setMessage('')
    try {
      const fn = approve ? api.approveLoan : api.rejectLoan
      const res = await fn(id, { approvedAmount: approved, note })
      setMessage(`${res.reference} ${approve ? 'approved' : 'rejected'}.`)
      setLoans(await api.allLoans())
      setOverview(await api.adminOverview())
    } catch (err) {
      setError(err.message)
    } finally {
      setBusyId(null)
    }
  }

  async function disburse(id) {
    if (!window.confirm('Mark this loan as money released to the traveller?')) return
    setBusyId(id)
    setError('')
    try {
      const res = await api.disburseLoan(id)
      setMessage(`${res.reference} disbursed.`)
      setLoans(await api.allLoans())
      setOverview(await api.adminOverview())
    } catch (err) {
      setError(err.message)
    } finally {
      setBusyId(null)
    }
  }

  async function toggleUser(u) {
    setBusyId(u.id)
    setError('')
    try {
      await api.adminUpdateUser(u.id, { enabled: !u.enabled })
      setUsers(await api.adminUsers())
      setMessage(`${u.email} ${u.enabled ? 'disabled' : 'enabled'}.`)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusyId(null)
    }
  }

  const pending = (loans || []).filter((l) => l.status === 'PENDING')
  const bk = overview?.bookings

  return (
    <>
      <div className="page-head">
        <h1>Admin console</h1>
        <p className="lede">
          Review travel loan requests as nominee, monitor every booking, manage accounts and review
          the system activity trail.
        </p>
      </div>

      <ErrorBox error={error} onClose={() => setError('')} />
      <OkBox message={message} onClose={() => setMessage('')} />

      {bk && (
        <div className="grid c4" style={{ marginBottom: 18 }}>
          <div className="stat">
            <div className="v">{bk.total}</div>
            <div className="l">Bookings</div>
            <div className="s">
              {bk.confirmed} confirmed · {bk.cancelled} cancelled
            </div>
          </div>
          <div className="stat">
            <div className="v" style={{ color: 'var(--green)' }}>
              {rupees(bk.confirmedValue)}
            </div>
            <div className="l">Confirmed value</div>
          </div>
          <div className="stat">
            <div className="v" style={{ color: 'var(--amber)' }}>
              {pending.length}
            </div>
            <div className="l">Loans awaiting review</div>
          </div>
          <div className="stat">
            <div className="v">{overview?.activityEntries ?? 0}</div>
            <div className="l">Activity entries</div>
          </div>
        </div>
      )}

      <div className="row" style={{ marginBottom: 16 }}>
        {TABS.map((t) => (
          <button
            key={t.v}
            className={`chip ${tab === t.v ? 'on' : ''}`}
            onClick={() => setTab(t.v)}
          >
            {t.l}
            {t.v === 'loans' && pending.length > 0 ? ` (${pending.length})` : ''}
          </button>
        ))}
      </div>

      {/* ---------------- loans ---------------- */}
      {tab === 'loans' &&
        (!loans ? (
          <Loading label="Loading loan requests" />
        ) : loans.length === 0 ? (
          <div className="card">
            <Empty icon="₹" title="No loan requests" />
          </div>
        ) : (
          <div className="stack">
            {loans.map((l) => (
              <div className="card" key={l.id}>
                <div className="row between" style={{ marginBottom: 10, alignItems: 'flex-start' }}>
                  <div style={{ minWidth: 0 }}>
                    <div className="row" style={{ marginBottom: 4 }}>
                      <span className="mono faint" style={{ fontSize: 12 }}>
                        {l.reference}
                      </span>
                      <StatusBadge status={l.status} />
                    </div>
                    <h2 style={{ fontSize: 16, marginBottom: 2 }}>
                      {l.userName} · {l.userEmail}
                    </h2>
                    <p style={{ margin: 0, fontSize: 13 }}>
                      {l.purpose}
                      {l.destination ? ` · ${l.destination}` : ''}
                      {l.travelDate ? ` · ${prettyDate(l.travelDate)}` : ''} · {l.durationMonths} months
                    </p>
                    {l.contactNumber && (
                      <p className="faint" style={{ margin: '4px 0 0', fontSize: 12.5 }}>
                        Contact {l.contactNumber}
                      </p>
                    )}
                  </div>
                  <div className="right nowrap">
                    <div className="mono" style={{ fontSize: 18 }}>
                      {rupees(l.amount)}
                    </div>
                    {l.approvedAmount > 0 && (
                      <div className="faint" style={{ fontSize: 12 }}>
                        approved {rupees(l.approvedAmount)}
                      </div>
                    )}
                  </div>
                </div>

                {l.decisionNote && (
                  <div className="alert info" style={{ marginBottom: 0 }}>
                    {l.decisionNote}
                    {l.nomineeName ? ` — ${l.nomineeName}, ${shortDateTime(l.decidedAt)}` : ''}
                  </div>
                )}

                {l.status === 'PENDING' && (
                  <div className="row end" style={{ marginTop: 14 }}>
                    <button
                      className="primary"
                      disabled={busyId === l.id}
                      onClick={() => decide(l.id, true)}
                    >
                      Approve
                    </button>
                    <button
                      className="danger"
                      disabled={busyId === l.id}
                      onClick={() => decide(l.id, false)}
                    >
                      Reject
                    </button>
                  </div>
                )}

                {l.status === 'APPROVED' && (
                  <div className="row end" style={{ marginTop: 14 }}>
                    <button disabled={busyId === l.id} onClick={() => disburse(l.id)}>
                      Mark as disbursed
                    </button>
                  </div>
                )}

                {l.fundedBookingIds?.length > 0 && (
                  <div className="faint" style={{ fontSize: 12, marginTop: 10 }}>
                    Funding {l.fundedBookingIds.length} booking
                    {l.fundedBookingIds.length === 1 ? '' : 's'}
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}

      {/* ---------------- bookings ---------------- */}
      {tab === 'bookings' &&
        (!bookings ? (
          <Loading label="Loading bookings" />
        ) : bookings.length === 0 ? (
          <div className="card">
            <Empty icon="☑" title="No bookings yet" />
          </div>
        ) : (
          <div className="card flush">
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Reference</th>
                    <th>Traveller</th>
                    <th>Booking</th>
                    <th>Destination</th>
                    <th>Status</th>
                    <th className="right">Amount</th>
                    <th className="right">Refund</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((b) => (
                    <tr key={b.id}>
                      <td className="mono nowrap">{b.reference}</td>
                      <td>
                        <b>{b.userName}</b>
                        <div className="faint" style={{ fontSize: 12 }}>
                          {b.userEmail}
                        </div>
                      </td>
                      <td>
                        <b>{b.title}</b>
                        <div className="faint" style={{ fontSize: 12 }}>
                          {b.type} · {b.seatOrRoom}
                        </div>
                      </td>
                      <td className="nowrap">{b.destination}</td>
                      <td>
                        <StatusBadge status={b.status} />
                      </td>
                      <td className="right mono nowrap">{rupees(b.amount)}</td>
                      <td className="right mono nowrap">
                        {b.refundAmount > 0 ? rupees(b.refundAmount) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}

      {/* ---------------- users ---------------- */}
      {tab === 'users' &&
        (!users ? (
          <Loading label="Loading users" />
        ) : (
          <div className="card flush">
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Interests</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Joined</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td>
                        <b>{u.fullName}</b>
                        <div className="faint" style={{ fontSize: 12 }}>
                          {u.email}
                        </div>
                      </td>
                      <td>
                        <div className="chips">
                          {(u.interests || []).slice(0, 3).map((i) => (
                            <span key={i} className="badge grey">
                              {i}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${u.role === 'ADMIN' ? 'violet' : 'sky'}`}>{u.role}</span>
                      </td>
                      <td>
                        <span className={`badge ${u.enabled ? 'green' : 'rose'}`}>
                          {u.enabled ? 'active' : 'disabled'}
                        </span>
                      </td>
                      <td className="nowrap faint">{prettyDate(u.createdAt)}</td>
                      <td className="right">
                        <button
                          className="sm"
                          disabled={busyId === u.id}
                          onClick={() => toggleUser(u)}
                        >
                          {u.enabled ? 'Disable' : 'Enable'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}

      {/* ---------------- activity ---------------- */}
      {tab === 'activity' &&
        (!activity ? (
          <Loading label="Loading activity" />
        ) : activity.length === 0 ? (
          <div className="card">
            <Empty icon="◷" title="No activity recorded yet" />
          </div>
        ) : (
          <div className="card">
            <div className="stack" style={{ gap: 0 }}>
              {activity.map((a) => (
                <div
                  key={a.id}
                  style={{ padding: '11px 0', borderBottom: '1px solid var(--line-soft)' }}
                >
                  <div className="row between">
                    <div>
                      <span className="badge grey" style={{ marginRight: 8 }}>
                        {a.category}
                      </span>
                      <b style={{ fontSize: 13.5 }}>{a.action}</b>{' '}
                      <span className="muted" style={{ fontSize: 13 }}>
                        {a.subjectLabel}
                      </span>
                    </div>
                    <span className="faint nowrap" style={{ fontSize: 12 }}>
                      {shortDateTime(a.createdAt)}
                    </span>
                  </div>
                  {a.detail && (
                    <div className="faint" style={{ fontSize: 12.5, marginTop: 3 }}>
                      {a.detail}
                      {a.actorName ? ` — by ${a.actorName}` : ''}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
    </>
  )
}
