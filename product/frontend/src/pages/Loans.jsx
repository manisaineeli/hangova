import { useEffect, useState } from 'react'
import { api } from '../api'
import { Empty, ErrorBox, Loading, OkBox, StatusBadge, prettyDate, rupees, shortDateTime, todayIso } from '../components/ui'

export default function Loans() {
  const [loans, setLoans] = useState(null)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [showForm, setShowForm] = useState(false)

  const [amount, setAmount] = useState(40000)
  const [purpose, setPurpose] = useState('')
  const [destination, setDestination] = useState('')
  const [travelDate, setTravelDate] = useState(todayIso(30))
  const [months, setMonths] = useState(12)
  const [contact, setContact] = useState('')

  async function load() {
    setError('')
    try {
      setLoans(await api.myLoans())
    } catch (err) {
      setError(err.message)
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function submit(e) {
    e.preventDefault()
    setError('')
    setMessage('')
    setBusy(true)
    try {
      const loan = await api.applyLoan({
        amount: Number(amount),
        purpose: purpose.trim(),
        destination: destination.trim() || null,
        travelDate,
        durationMonths: Number(months),
        contactNumber: contact.trim() || null,
      })
      setMessage(`Request ${loan.reference} submitted. An administrator reviews it as nominee.`)
      setShowForm(false)
      setPurpose('')
      await load()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <div className="page-head">
        <div className="row between">
          <div>
            <h1>Travel loan</h1>
            <p className="lede">
              Borrow for a trip and pay it back over time. Every request is reviewed by an
              administrator acting as nominee before any money is released.
            </p>
          </div>
          <button className="primary" onClick={() => setShowForm((v) => !v)}>
            {showForm ? 'Close' : 'Apply for a loan'}
          </button>
        </div>
      </div>

      <ErrorBox error={error} onClose={() => setError('')} />
      <OkBox message={message} onClose={() => setMessage('')} />

      {showForm && (
        <form className="card" style={{ marginBottom: 18 }} onSubmit={submit}>
          <h3>New loan request</h3>
          <div className="grid c2" style={{ gap: 12 }}>
            <label className="field">
              <span>Amount (Rs)</span>
              <input
                type="number"
                min="1000"
                max="500000"
                step="500"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              <div className="hint">Between ₹1,000 and ₹5,00,000</div>
            </label>
            <label className="field">
              <span>Destination</span>
              <input
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="Where are you going?"
              />
            </label>
          </div>

          <label className="field">
            <span>Purpose</span>
            <input
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="e.g. Family holiday to Kerala"
              required
            />
          </label>

          <div className="grid c3" style={{ gap: 12 }}>
            <label className="field">
              <span>Travel date</span>
              <input type="date" value={travelDate} onChange={(e) => setTravelDate(e.target.value)} />
            </label>
            <label className="field">
              <span>Repayment period</span>
              <select value={months} onChange={(e) => setMonths(Number(e.target.value))}>
                {[3, 6, 12, 18, 24, 36, 48, 60].map((m) => (
                  <option key={m} value={m}>
                    {m} months
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Contact number</span>
              <input value={contact} onChange={(e) => setContact(e.target.value)} placeholder="Optional" />
            </label>
          </div>

          {amount > 0 && months > 0 && (
            <div className="alert info">
              Indicative repayment of about{' '}
              <b>{rupees(Math.round((amount * 1.12) / months))}</b> per month, including interest.
            </div>
          )}

          <button className="primary" disabled={busy || !purpose.trim()}>
            {busy ? (
              <>
                <span className="spin" /> Submitting
              </>
            ) : (
              'Submit request'
            )}
          </button>
        </form>
      )}

      {!loans ? (
        <Loading label="Loading loan requests" />
      ) : loans.length === 0 ? (
        <div className="card">
          <Empty
            icon="₹"
            title="No loan requests yet"
            action={
              <button className="btn primary" onClick={() => setShowForm(true)}>
                Apply for a loan
              </button>
            }
          >
            Funding a trip through Hangova means the approval, the release and the repayment terms
            are all recorded against the request.
          </Empty>
        </div>
      ) : (
        <div className="stack">
          {loans.map((l) => (
            <div className="card" key={l.id}>
              <div className="row between" style={{ marginBottom: 12, alignItems: 'flex-start' }}>
                <div style={{ minWidth: 0 }}>
                  <div className="row" style={{ marginBottom: 4 }}>
                    <span className="mono faint" style={{ fontSize: 12 }}>
                      {l.reference}
                    </span>
                    <StatusBadge status={l.status} />
                  </div>
                  <h2 style={{ fontSize: 16, marginBottom: 2 }}>{l.purpose}</h2>
                  <p style={{ margin: 0, fontSize: 13 }}>
                    {l.destination ? `${l.destination} · ` : ''}
                    {l.travelDate ? prettyDate(l.travelDate) : 'Date not set'} · {l.durationMonths} months
                  </p>
                </div>
                <div className="right nowrap">
                  <div className="mono" style={{ fontSize: 18 }}>
                    {rupees(l.approvedAmount || l.amount)}
                  </div>
                  {l.approvedAmount > 0 && l.approvedAmount < l.amount && (
                    <div className="faint" style={{ fontSize: 12 }}>
                      of {rupees(l.amount)}
                    </div>
                  )}
                </div>
              </div>

              {l.status === 'PENDING' && (
                <div className="alert info" style={{ marginBottom: 0 }}>
                  Waiting for an administrator to review this request.
                </div>
              )}

              {(l.status === 'APPROVED' || l.status === 'DISBURSED') && (
                <div className="alert ok" style={{ marginBottom: 0 }}>
                  {l.status === 'APPROVED'
                    ? 'Approved. You can now use this loan to pay for bookings.'
                    : 'Disbursed to your account.'}
                  {l.nomineeName ? ` Reviewed by ${l.nomineeName}.` : ''}
                </div>
              )}

              {l.status === 'REJECTED' && (
                <div className="alert error" style={{ marginBottom: 0 }}>
                  Not approved{l.decisionNote ? `: ${l.decisionNote}` : '.'}
                </div>
              )}

              <div className="row" style={{ marginTop: 12 }}>
                <span className="faint" style={{ fontSize: 12 }}>
                  Requested {shortDateTime(l.createdAt)}
                  {l.decidedAt ? ` · decided ${shortDateTime(l.decidedAt)}` : ''}
                </span>
                {l.fundedBookingIds?.length > 0 && (
                  <span className="badge violet" style={{ marginLeft: 'auto' }}>
                    {l.fundedBookingIds.length} booking
                    {l.fundedBookingIds.length === 1 ? '' : 's'} funded
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}
