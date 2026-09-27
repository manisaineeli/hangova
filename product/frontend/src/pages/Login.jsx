import { useEffect, useState } from 'react'
import { useAuth } from '../auth'
import NatureCanvas from '../three/NatureCanvas'
import { BIOME_ORDER, BIOMES, DEFAULT_BIOME } from '../three/biomes'

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

export default function Login() {
  const { login, register } = useAuth()
  const [mode, setMode] = useState('signin')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [biome, setBiome] = useState(DEFAULT_BIOME)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [homeCity, setHomeCity] = useState('')
  const [days, setDays] = useState(4)
  const [budget, setBudget] = useState(60000)
  const [travellers, setTravellers] = useState(2)
  const [interests, setInterests] = useState(['Mountains', 'Heritage'])

  const toggleInterest = (i) =>
    setInterests((prev) => (prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]))

  async function submit(e) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      if (mode === 'signin') {
        await login(email.trim(), password)
      } else {
        await register({
          fullName: fullName.trim(),
          email: email.trim(),
          password,
          phone: phone.trim() || null,
          homeCity: homeCity.trim() || null,
          interests,
          defaultDays: days,
          defaultBudget: budget,
          defaultTravellers: travellers,
        })
      }
    } catch (err) {
      setError(err.message || 'Something went wrong')
    } finally {
      setBusy(false)
    }
  }

  function useDemo(which) {
    setMode('signin')
    setError('')
    if (which === 'admin') {
      setEmail('admin@hangova.ai')
      setPassword('admin123')
    } else {
      setEmail('demo@hangova.ai')
      setPassword('demo123')
    }
  }

  return (
    <div className="auth-wrap" style={accentVars(biome)}>
      <div style={{ width: '100%', maxWidth: 940 }}>
        <div className="auth-hero">
          {/* the 3D scene sits behind the glass card and reacts to the pointer */}
          <div className="auth-hero-canvas">
            <NatureCanvas biome={biome} opacity={0.62} />
          </div>

          <div className="biome-tag">
            {biome.signature} · <b>{biome.label}</b>
          </div>

          <div className="auth-hero-inner">
            <div className="grid hero" style={{ alignItems: 'center' }}>
              {/* ---- brand / pitch side ---- */}
              <div>
                <div
                  className="brand-mark"
                  style={{ width: 52, height: 52, fontSize: 24, marginBottom: 16 }}
                >
                  H
                </div>
                <h1 style={{ fontSize: 38, marginBottom: 6 }}>Hangova</h1>
                <p style={{ fontSize: 16, maxWidth: '38ch', marginBottom: 20 }}>
                  Plan, price and book a whole trip in one platform — an AI itinerary, live weather,
                  real availability and travel financing, without the tab juggling.
                </p>

                <div className="modules-strip" style={{ marginTop: 0, gridTemplateColumns: 'repeat(2, 1fr)' }}>
                  {[
                    ['Module 1', 'User & Admin', '🔐'],
                    ['Module 2', 'AI Planning', '🧠'],
                    ['Module 3', 'Borrow & Booking', '🎟️'],
                    ['Module 4', 'Travel Info', '🗂️'],
                  ].map(([n, l, ic]) => (
                    <div key={n}>
                      <b>{n}</b>
                      <span>
                        {ic} {l}
                      </span>
                    </div>
                  ))}
                </div>

                {/* biome switcher doubles as a preview of what the 3D layer can do */}
                <div style={{ marginTop: 18 }}>
                  <div className="faint" style={{ fontSize: 11, marginBottom: 8, letterSpacing: 0.8 }}>
                    EXPLORE A SETTING
                  </div>
                  <div className="chips">
                    {BIOME_ORDER.map((id) => (
                      <button
                        key={id}
                        className={`chip ${biome.id === id ? 'on' : ''}`}
                        onClick={() => setBiome(BIOMES[id])}
                      >
                        {BIOMES[id].signature}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* ---- form side ---- */}
              <div className="card" style={{ background: 'rgba(6,10,18,0.55)' }}>
                <div className="auth-tabs">
                  <button
                    className={mode === 'signin' ? 'on' : ''}
                    onClick={() => setMode('signin')}
                  >
                    Sign in
                  </button>
                  <button
                    className={mode === 'signup' ? 'on' : ''}
                    onClick={() => setMode('signup')}
                  >
                    Create account
                  </button>
                </div>

                {error && <div className="alert error">{error}</div>}

                <form onSubmit={submit}>
                  {mode === 'signup' && (
                    <label className="field">
                      <span>Full name</span>
                      <input
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Your name"
                        required
                      />
                    </label>
                  )}

                  <label className="field">
                    <span>Email</span>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                      autoComplete="email"
                    />
                  </label>

                  <label className="field">
                    <span>Password</span>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={mode === 'signup' ? 'At least 6 characters' : 'Your password'}
                      required
                      minLength={mode === 'signup' ? 6 : undefined}
                      autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                    />
                  </label>

                  {mode === 'signup' && (
                    <>
                      <div className="grid c2" style={{ gap: 12 }}>
                        <label className="field">
                          <span>Phone</span>
                          <input
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="Optional"
                          />
                        </label>
                        <label className="field">
                          <span>Home city</span>
                          <input
                            value={homeCity}
                            onChange={(e) => setHomeCity(e.target.value)}
                            placeholder="Optional"
                          />
                        </label>
                      </div>

                      <label className="field">
                        <span>What do you enjoy travelling for?</span>
                        <div className="chips">
                          {INTERESTS.map((i) => (
                            <button
                              type="button"
                              key={i}
                              className={`chip ${interests.includes(i) ? 'on' : ''}`}
                              onClick={() => toggleInterest(i)}
                            >
                              {i}
                            </button>
                          ))}
                        </div>
                        <div className="hint">These shape every itinerary the planner builds.</div>
                      </label>

                      <div className="grid c3" style={{ gap: 12 }}>
                        <label className="field">
                          <span>Typical days</span>
                          <input
                            type="number"
                            min="1"
                            max="30"
                            value={days}
                            onChange={(e) => setDays(Number(e.target.value))}
                          />
                        </label>
                        <label className="field">
                          <span>Travellers</span>
                          <input
                            type="number"
                            min="1"
                            max="20"
                            value={travellers}
                            onChange={(e) => setTravellers(Number(e.target.value))}
                          />
                        </label>
                        <label className="field">
                          <span>Budget (Rs)</span>
                          <input
                            type="number"
                            min="0"
                            step="1000"
                            value={budget}
                            onChange={(e) => setBudget(Number(e.target.value))}
                          />
                        </label>
                      </div>
                    </>
                  )}

                  <button className="primary block" disabled={busy} style={{ marginTop: 6 }}>
                    {busy ? (
                      <>
                        <span className="spin" /> Please wait
                      </>
                    ) : mode === 'signin' ? (
                      'Sign in'
                    ) : (
                      'Create account'
                    )}
                  </button>
                </form>

                <div className="demo-accounts">
                  <div
                    className="faint"
                    style={{ fontSize: 11.5, marginBottom: 10, textAlign: 'center' }}
                  >
                    Review accounts
                  </div>
                  <div className="row">
                    <button className="sm" onClick={() => useDemo('traveller')}>
                      Traveller
                    </button>
                    <button className="sm" onClick={() => useDemo('admin')}>
                      Administrator
                    </button>
                  </div>
                  <div className="hint" style={{ textAlign: 'center' }}>
                    Fills the form — then press Sign in.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="footer-note">
          React.js front end · API Gateway · Spring Boot microservices · MongoDB
          <br />
          <a href="http://localhost:5173" target="_blank" rel="noreferrer">
            Open the project presentation ↗
          </a>
        </div>
      </div>
    </div>
  )
}

/** Drives the CSS accent variables from the active biome. */
function accentVars(biome) {
  return {
    '--accent': biome.accent,
    '--accent-2': biome.accent2,
    '--glow': `${biome.accent}66`,
  }
}
