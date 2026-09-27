import { useEffect, useState } from 'react'
import { api } from '../api'
import { useAuth } from '../auth'
import { ErrorBox, OkBox, prettyDate, rupees, todayIso } from '../components/ui'

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

export default function Profile() {
  const { user, refresh } = useAuth()

  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    homeCity: '',
    interests: [],
    defaultDays: 4,
    defaultTravellers: 2,
    defaultBudget: 60000,
  })
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '' })
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (user) {
      setForm({
        fullName: user.fullName || '',
        phone: user.phone || '',
        homeCity: user.homeCity || '',
        interests: user.interests || [],
        defaultDays: user.defaultDays ?? 4,
        defaultTravellers: user.defaultTravellers ?? 2,
        defaultBudget: user.defaultBudget ?? 60000,
      })
    }
  }, [user])

  const toggle = (i) =>
    setForm((f) => ({
      ...f,
      interests: f.interests.includes(i) ? f.interests.filter((x) => x !== i) : [...f.interests, i],
    }))

  async function save(e) {
    e.preventDefault()
    setError('')
    setMessage('')
    setBusy(true)
    try {
      await api.updateMe({
        fullName: form.fullName.trim(),
        phone: form.phone.trim() || null,
        homeCity: form.homeCity.trim() || null,
        interests: form.interests,
        defaultDays: Number(form.defaultDays),
        defaultTravellers: Number(form.defaultTravellers),
        defaultBudget: Number(form.defaultBudget),
      })
      await refresh()
      setMessage('Profile saved. Your planner now uses these defaults.')
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function changePassword(e) {
    e.preventDefault()
    setError('')
    setMessage('')
    try {
      await api.put('/users/me/password', passwords)
      setPasswords({ currentPassword: '', newPassword: '' })
      setMessage('Password updated.')
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <>
      <div className="page-head">
        <h1>Your profile</h1>
        <p className="lede">
          These preferences are what the AI planner reads on every request, so setting them well means
          fewer fields to fill in each time.
        </p>
      </div>

      <ErrorBox error={error} onClose={() => setError('')} />
      <OkBox message={message} onClose={() => setMessage('')} />

      <div className="grid hero" style={{ alignItems: 'start' }}>
        <form className="card" onSubmit={save}>
          <h3>Details</h3>
          <div className="grid c2" style={{ gap: 12 }}>
            <label className="field">
              <span>Full name</span>
              <input
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                required
              />
            </label>
            <label className="field">
              <span>Phone</span>
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </label>
          </div>

          <div className="grid c2" style={{ gap: 12 }}>
            <label className="field">
              <span>Email</span>
              <input value={user?.email || ''} disabled />
              <div className="hint">Email cannot be changed here.</div>
            </label>
            <label className="field">
              <span>Home city</span>
              <input
                value={form.homeCity}
                onChange={(e) => setForm({ ...form, homeCity: e.target.value })}
                placeholder="Optional"
              />
            </label>
          </div>

          <label className="field">
            <span>Interests</span>
            <div className="chips">
              {INTERESTS.map((i) => (
                <button
                  type="button"
                  key={i}
                  className={`chip ${form.interests.includes(i) ? 'on' : ''}`}
                  onClick={() => toggle(i)}
                >
                  {i}
                </button>
              ))}
            </div>
          </label>

          <div className="grid c3" style={{ gap: 12 }}>
            <label className="field">
              <span>Default days</span>
              <input
                type="number"
                min="1"
                max="30"
                value={form.defaultDays}
                onChange={(e) => setForm({ ...form, defaultDays: e.target.value })}
              />
            </label>
            <label className="field">
              <span>Default travellers</span>
              <input
                type="number"
                min="1"
                max="20"
                value={form.defaultTravellers}
                onChange={(e) => setForm({ ...form, defaultTravellers: e.target.value })}
              />
            </label>
            <label className="field">
              <span>Default budget (Rs)</span>
              <input
                type="number"
                min="0"
                step="1000"
                value={form.defaultBudget}
                onChange={(e) => setForm({ ...form, defaultBudget: e.target.value })}
              />
            </label>
          </div>

          <button className="primary" disabled={busy}>
            {busy ? (
              <>
                <span className="spin" /> Saving
              </>
            ) : (
              'Save profile'
            )}
          </button>
        </form>

        <div className="stack">
          <form className="card" onSubmit={changePassword}>
            <h3>Password</h3>
            <label className="field">
              <span>Current password</span>
              <input
                type="password"
                value={passwords.currentPassword}
                onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
                required
              />
            </label>
            <label className="field">
              <span>New password</span>
              <input
                type="password"
                value={passwords.newPassword}
                onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                minLength={6}
                required
              />
              <div className="hint">At least 6 characters.</div>
            </label>
            <button>Update password</button>
          </form>

          <div className="card">
            <h3>Account</h3>
            <div className="kv">
              <span>Role</span>
              <b style={{ fontFamily: 'var(--sans)' }}>
                {user?.role === 'ADMIN' ? 'Administrator' : 'Traveller'}
              </b>
            </div>
            <div className="kv">
              <span>Member since</span>
              <b style={{ fontFamily: 'var(--sans)' }}>{prettyDate(user?.createdAt)}</b>
            </div>
            {user?.lastLoginAt && (
              <div className="kv">
                <span>Last sign-in</span>
                <b style={{ fontFamily: 'var(--sans)' }}>{prettyDate(user.lastLoginAt)}</b>
              </div>
            )}
            <div className="kv">
              <span>Travel loan eligible</span>
              <b style={{ fontFamily: 'var(--sans)' }}>{user?.loanEligible ? 'Yes' : 'Not yet'}</b>
            </div>
            <div className="hint" style={{ marginTop: 12 }}>
              Loans between ₹1,000 and ₹5,00,000 can be requested at any time; every request is
              reviewed by an administrator.
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
