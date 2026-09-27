import { useEffect, useMemo, useState } from 'react'
import { NavLink, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useAuth } from './auth'
import NatureCanvas from './three/NatureCanvas'
import { biomeForDestination, biomeForInterests, DEFAULT_BIOME } from './three/biomes'
import { PageTransition } from './motion'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Planner from './pages/Planner'
import TripDetail from './pages/TripDetail'
import Book from './pages/Book'
import Bookings from './pages/Bookings'
import Loans from './pages/Loans'
import Expenses from './pages/Expenses'
import Admin from './pages/Admin'
import Profile from './pages/Profile'

const LINKS = [
  { to: '/', label: 'Dashboard', ic: '◈', end: true },
  { to: '/plan', label: 'Plan a trip', ic: '✦' },
  { to: '/book', label: 'Hotels & transport', ic: '⌂' },
  { to: '/bookings', label: 'My bookings', ic: '☑' },
  { to: '/loans', label: 'Travel loan', ic: '₹' },
  { to: '/expenses', label: 'Expenses', ic: '∑' },
  { to: '/profile', label: 'Profile', ic: '☺' },
]

function initials(name = '') {
  return (
    name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() || '')
      .join('') || 'H'
  )
}

/**
 * The ambient 3D layer for the whole app. The biome is chosen from the
 * traveller's saved interests, so the environment matches their profile, and
 * the CSS accent variables are driven from the same biome so the UI, the 3D and
 * the colour wash always agree.
 */
function Backdrop({ biome }) {
  const style = {
    '--accent': biome.accent,
    '--accent-2': biome.accent2,
    '--glow': `${biome.accent}66`,
  }

  return (
    <>
      <div className="app-backdrop" style={style}>
        <NatureCanvas biome={biome} opacity={0.55} blur={6} detail="ambient" interactive={false} />
      </div>
      <div className="app-wash" style={style} />
      <div className="app-grain" />
    </>
  )
}

function TopBar() {
  const { user, isAdmin, logout } = useAuth()

  return (
    <header className="topbar">
      <NavLink to="/" className="brand">
        <span className="brand-mark">H</span>
        <span>
          Hangova
          <small>AI Trip Planning &amp; Booking</small>
        </span>
      </NavLink>

      <nav className="nav">
        {LINKS.map((l) => (
          <NavLink key={l.to} to={l.to} end={l.end}>
            <span className="ic">{l.ic}</span>
            {l.label}
          </NavLink>
        ))}
        {isAdmin && (
          <NavLink to="/admin">
            <span className="ic">⚙</span>
            Admin
          </NavLink>
        )}
      </nav>

      <div className="who">
        <div className="who-name">
          <b>{user?.fullName}</b>
          <span>{isAdmin ? 'Administrator' : 'Traveller'}</span>
        </div>
        <div className="avatar" title={user?.email}>
          {initials(user?.fullName)}
        </div>
        <button className="ghost sm" onClick={logout} title="Sign out">
          Sign out
        </button>
      </div>
    </header>
  )
}

export default function App() {
  const { user, ready } = useAuth()
  const location = useLocation()

  // the environment follows the traveller's own interests
  const biome = useMemo(() => {
    if (!user) return DEFAULT_BIOME
    return biomeForInterests(user.interests?.length ? user.interests : ['Mountains', 'Nature'])
  }, [user])

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [location.pathname])

  if (!ready) {
    return (
      <div className="app-backdrop">
        <NatureCanvas biome={DEFAULT_BIOME} opacity={0.4} detail="ambient" interactive={false} />
        <div className="app-wash" />
      </div>
    )
  }

  if (!user) {
    return (
      <>
        <div className="app-backdrop">
          <NatureCanvas biome={DEFAULT_BIOME} opacity={0.5} blur={5} detail="ambient" interactive={false} />
        </div>
        <div className="app-wash" />
        <div className="app-grain" />
        <Login />
      </>
    )
  }

  return (
    <div className="app">
      <Backdrop biome={biome} />
      <TopBar />
      <main className="page">
        <PageTransition key={location.pathname}>
          <Routes location={location}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/plan" element={<Planner />} />
            <Route path="/plan/:id" element={<TripDetail />} />
            <Route path="/book" element={<Book />} />
            <Route path="/bookings" element={<Bookings />} />
            <Route path="/loans" element={<Loans />} />
            <Route path="/expenses" element={<Expenses />} />
            <Route path="/profile" element={<Profile />} />
            <Route
              path="/admin"
              element={
                <RequireAdmin>
                  <Admin />
                </RequireAdmin>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </PageTransition>
      </main>
    </div>
  )
}

function RequireAdmin({ children }) {
  const { isAdmin } = useAuth()
  if (!isAdmin) return <Navigate to="/" replace />
  return children
}
