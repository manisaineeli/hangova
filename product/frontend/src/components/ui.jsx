/** Small presentational helpers shared across pages. */
import { useEffect, useState } from 'react'

export function rupees(n) {
  const v = Number(n || 0)
  return '₹' + v.toLocaleString('en-IN')
}

export function rupeesShort(n) {
  const v = Number(n || 0)
  if (v >= 10000000) return '₹' + (v / 10000000).toFixed(2) + ' Cr'
  if (v >= 100000) return '₹' + (v / 100000).toFixed(2) + ' L'
  if (v >= 1000) return '₹' + (v / 1000).toFixed(1) + 'k'
  return '₹' + v
}

export function prettyDate(d) {
  if (!d) return ''
  const date = new Date(d)
  if (Number.isNaN(date.getTime())) return d
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function shortDateTime(d) {
  if (!d) return ''
  const date = new Date(d)
  if (Number.isNaN(date.getTime())) return d
  return date.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function todayIso(offsetDays = 0) {
  const d = new Date()
  d.setDate(d.getDate() + offsetDays)
  return d.toISOString().slice(0, 10)
}

export function addDaysIso(iso, days) {
  const d = new Date(iso)
  d.setDate(d.getDate() + Number(days || 0))
  return d.toISOString().slice(0, 10)
}

export function ErrorBox({ error, onClose }) {
  if (!error) return null
  return (
    <div className="alert error">
      {error}
      {onClose && (
        <button className="ghost sm" style={{ marginLeft: 10 }} onClick={onClose}>
          Dismiss
        </button>
      )}
    </div>
  )
}

export function OkBox({ message, onClose }) {
  if (!message) return null
  return (
    <div className="alert ok">
      {message}
      {onClose && (
        <button className="ghost sm" style={{ marginLeft: 10 }} onClick={onClose}>
          Dismiss
        </button>
      )}
    </div>
  )
}

export function Empty({ icon = '✦', title, children, action }) {
  return (
    <div className="empty">
      <div className="em">{icon}</div>
      <h2 style={{ fontSize: 16 }}>{title}</h2>
      {children && <p>{children}</p>}
      {action}
    </div>
  )
}

export function Loading({ label = 'Loading' }) {
  return (
    <div className="row" style={{ padding: '18px 0', color: 'var(--muted)', fontSize: 13.5 }}>
      <span className="spin" /> {label}…
    </div>
  )
}

export function Stat({ value, label, sub, color }) {
  return (
    <div className="stat">
      <div className="v" style={color ? { color } : undefined}>
        {value}
      </div>
      <div className="l">{label}</div>
      {sub && <div className="s">{sub}</div>}
    </div>
  )
}

const STATUS_TONE = {
  CONFIRMED: 'green',
  APPROVED: 'green',
  DISBURSED: 'teal',
  SAVED: 'sky',
  PENDING: 'amber',
  CANCELLED: 'rose',
  REJECTED: 'rose',
  PREVIEW: 'violet',
  COMPLETED: 'teal',
}

export function StatusBadge({ status }) {
  const tone = STATUS_TONE[(status || '').toUpperCase()] || 'grey'
  return <span className={`badge ${tone}`}>{status}</span>
}

export function Bar({ value, max }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0
  const cls = pct > 100 ? 'over' : pct > 85 ? 'warn' : ''
  return (
    <div className={`bar ${cls}`}>
      <i style={{ width: `${pct}%` }} />
    </div>
  )
}

/** Loads data on mount and whenever deps change, with loading/error state. */
export function useAsync(fn, deps = []) {
  const [state, setState] = useState({ loading: true, data: null, error: null })

  const reload = () => {
    let cancelled = false
    setState((s) => ({ ...s, loading: true }))
    fn()
      .then((data) => !cancelled && setState({ loading: false, data, error: null }))
      .catch((err) => !cancelled && setState({ loading: false, data: null, error: err.message }))
    return () => cancelled
  }

  useEffect(reload, deps) // eslint-disable-line react-hooks/exhaustive-deps

  return { ...state, reload, setData: (d) => setState((s) => ({ ...s, data: d })) }
}
