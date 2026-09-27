import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { api } from '../api'
import { Empty, ErrorBox, Loading, OkBox, prettyDate, rupees, todayIso } from '../components/ui'

const CATEGORIES = ['Stay', 'Transport', 'Food', 'Activities', 'Shopping', 'Miscellaneous']
const PAYMENTS = ['Cash', 'UPI', 'Card', 'Net banking', 'Travel loan']

const TONE = {
  Stay: 'violet',
  Transport: 'sky',
  Food: 'amber',
  Activities: 'green',
  Shopping: 'teal',
  Miscellaneous: 'grey',
}

export default function Expenses() {
  const [params] = useSearchParams()
  const [tripId, setTripId] = useState(params.get('tripId') || '')

  const [trips, setTrips] = useState([])
  const [expenses, setExpenses] = useState(null)
  const [summary, setSummary] = useState(null)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [editing, setEditing] = useState(null)

  const [form, setForm] = useState({
    category: 'Food',
    description: '',
    amount: '',
    date: todayIso(0),
    paymentMode: 'UPI',
  })

  async function load(id = tripId) {
    setError('')
    try {
      const [e, s] = await Promise.all([api.expenses(id), api.expenseSummary(id)])
      setExpenses(e)
      setSummary(s)
    } catch (err) {
      setError(err.message)
    }
  }

  useEffect(() => {
    api.myTrips().then(setTrips).catch(() => setTrips([]))
  }, [])

  useEffect(() => {
    load(tripId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tripId])

  async function submit(e) {
    e.preventDefault()
    setError('')
    setMessage('')
    setBusy(true)
    try {
      await api.addExpense({
        category: form.category,
        description: form.description.trim(),
        amount: Number(form.amount),
        date: form.date,
        paymentMode: form.paymentMode,
        tripId: tripId || null,
      })
      setForm({ ...form, description: '', amount: '' })
      setMessage('Expense recorded.')
      await load()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function saveEdit(e) {
    e.preventDefault()
    setError('')
    setMessage('')
    try {
      await api.updateExpense(editing.id, {
        category: editing.category,
        description: editing.description,
        amount: Number(editing.amount),
        date: editing.date,
      })
      setEditing(null)
      setMessage('Expense updated.')
      await load()
    } catch (err) {
      setError(err.message)
    }
  }

  async function remove(x) {
    if (!window.confirm(`Delete "${x.description}"?`)) return
    setError('')
    try {
      await api.deleteExpense(x.id)
      setMessage('Expense deleted.')
      await load()
    } catch (err) {
      setError(err.message)
    }
  }

  const byCat = summary?.byCategory || {}
  const maxCat = Math.max(1, ...Object.values(byCat).map(Number))
  const budget = summary?.budget

  return (
    <>
      <div className="page-head">
        <h1>Expenses</h1>
        <p className="lede">
          Record what you actually spend and see the category-wise summary compared against each
          trip's budget.
        </p>
      </div>

      <ErrorBox error={error} onClose={() => setError('')} />
      <OkBox message={message} onClose={() => setMessage('')} />

      <div className="grid hero" style={{ alignItems: 'start' }}>
        <div className="stack">
          {/* summary */}
          <div className="card">
            <div className="card-head">
              <div>
                <h2>Expense summary</h2>
                <p>{summary?.count ?? 0} entries recorded</p>
              </div>
              <select
                value={tripId}
                onChange={(e) => setTripId(e.target.value)}
                style={{ width: 220 }}
              >
                <option value="">All trips</option>
                {trips.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title}
                  </option>
                ))}
              </select>
            </div>

            {!summary ? (
              <Loading label="Loading summary" />
            ) : (
              <>
                <div className="row between" style={{ marginBottom: 16 }}>
                  <div>
                    <div className="faint" style={{ fontSize: 12 }}>
                      TOTAL SPENT
                    </div>
                    <div className="mono" style={{ fontSize: 28, color: 'var(--amber)' }}>
                      {rupees(summary.total)}
                    </div>
                  </div>
                  {budget && Object.keys(budget).length > 0 && (
                    <div className="right">
                      <div className="faint" style={{ fontSize: 12 }}>
                        BUDGET
                      </div>
                      <div className="mono" style={{ fontSize: 20 }}>
                        {rupees(budget.plannedBudget)}
                      </div>
                      <div
                        className="faint"
                        style={{ fontSize: 12, color: budget.withinBudget ? 'var(--green)' : 'var(--rose)' }}
                      >
                        {budget.withinBudget
                          ? `${rupees(budget.variance)} left`
                          : `${rupees(Math.abs(budget.variance))} over`}
                      </div>
                    </div>
                  )}
                </div>

                {CATEGORIES.map((c) => {
                  const v = byCat[c] || 0
                  if (!v) return null
                  return (
                    <div key={c} style={{ marginBottom: 10 }}>
                      <div className="row between" style={{ fontSize: 13 }}>
                        <span className={`badge ${TONE[c]}`}>{c}</span>
                        <b className="mono">{rupees(v)}</b>
                      </div>
                      <div className="bar" style={{ margin: '5px 0 0' }}>
                        <i style={{ width: `${(v / maxCat) * 100}%` }} />
                      </div>
                    </div>
                  )
                })}

                {summary.confirmedBookings > 0 && (
                  <div className="hint" style={{ marginTop: 12 }}>
                    Confirmed bookings for this selection total {rupees(summary.confirmedBookings)}
                    {summary.refunded > 0 ? `, with ${rupees(summary.refunded)} refunded.` : '.'}
                  </div>
                )}
              </>
            )}
          </div>

          {/* list */}
          <div className="card">
            <h3>All expenses</h3>
            {!expenses ? (
              <Loading label="Loading expenses" />
            ) : expenses.length === 0 ? (
              <Empty icon="∑" title="Nothing recorded yet">
                Add your first expense using the form.
              </Empty>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Category</th>
                      <th>Description</th>
                      <th>Paid by</th>
                      <th className="right">Amount</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {expenses.map((x) => (
                      <tr key={x.id}>
                        <td className="nowrap">{prettyDate(x.date)}</td>
                        <td>
                          <span className={`badge ${TONE[x.category] || 'grey'}`}>{x.category}</span>
                        </td>
                        <td>{x.description}</td>
                        <td className="nowrap faint">{x.paymentMode || '—'}</td>
                        <td className="right mono nowrap">{rupees(x.amount)}</td>
                        <td className="right nowrap">
                          <button className="ghost sm" onClick={() => setEditing(x)}>
                            Edit
                          </button>
                          <button className="danger sm" onClick={() => remove(x)}>
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* add form */}
        <div className="stack">
          <form className="card" onSubmit={submit}>
            <h3>Record an expense</h3>

            <label className="field">
              <span>Category</span>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>Description</span>
              <input
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="What was it for?"
                required
              />
            </label>

            <div className="grid c2" style={{ gap: 12 }}>
              <label className="field">
                <span>Amount (Rs)</span>
                <input
                  type="number"
                  min="1"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  required
                />
              </label>
              <label className="field">
                <span>Date</span>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                />
              </label>
            </div>

            <label className="field">
              <span>Paid using</span>
              <select
                value={form.paymentMode}
                onChange={(e) => setForm({ ...form, paymentMode: e.target.value })}
              >
                {PAYMENTS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </label>

            <button className="primary block" disabled={busy || !form.description.trim()}>
              {busy ? (
                <>
                  <span className="spin" /> Saving
                </>
              ) : (
                'Add expense'
              )}
            </button>
          </form>

          {editing && (
            <form className="card" onSubmit={saveEdit}>
              <h3>Edit expense</h3>
              <label className="field">
                <span>Category</span>
                <select
                  value={editing.category}
                  onChange={(e) => setEditing({ ...editing, category: e.target.value })}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>Description</span>
                <input
                  value={editing.description}
                  onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                />
              </label>
              <div className="grid c2" style={{ gap: 12 }}>
                <label className="field">
                  <span>Amount (Rs)</span>
                  <input
                    type="number"
                    min="1"
                    value={editing.amount}
                    onChange={(e) => setEditing({ ...editing, amount: e.target.value })}
                  />
                </label>
                <label className="field">
                  <span>Date</span>
                  <input
                    type="date"
                    value={editing.date || ''}
                    onChange={(e) => setEditing({ ...editing, date: e.target.value })}
                  />
                </label>
              </div>
              <div className="row">
                <button className="primary">Save changes</button>
                <button type="button" className="ghost" onClick={() => setEditing(null)}>
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </>
  )
}
