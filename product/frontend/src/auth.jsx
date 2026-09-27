import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { api, clearSession, getStoredUser, getToken, setSession } from './api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getStoredUser)
  const [ready, setReady] = useState(false)

  /* Re-validate the stored token on load so a stale session is dropped. */
  useEffect(() => {
    let cancelled = false
    async function boot() {
      if (!getToken()) {
        setReady(true)
        return
      }
      try {
        const me = await api.me()
        if (!cancelled) setUser(me)
      } catch {
        if (!cancelled) {
          clearSession()
          setUser(null)
        }
      } finally {
        if (!cancelled) setReady(true)
      }
    }
    boot()
    return () => {
      cancelled = true
    }
  }, [])

  const login = useCallback(async (email, password) => {
    const res = await api.login(email, password)
    setSession(res.token, res.user)
    setUser(res.user)
    return res.user
  }, [])

  const register = useCallback(async (payload) => {
    const created = await api.register(payload)
    return api.login(payload.email, payload.password).then(() => created)
  }, [])

  const logout = useCallback(() => {
    clearSession()
    setUser(null)
  }, [])

  const refresh = useCallback(async () => {
    const me = await api.me()
    setUser(me)
    return me
  }, [])

  const value = useMemo(
    () => ({
      user,
      ready,
      login,
      register,
      logout,
      refresh,
      isAdmin: user?.role === 'ADMIN',
    }),
    [user, ready, login, register, logout, refresh],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
