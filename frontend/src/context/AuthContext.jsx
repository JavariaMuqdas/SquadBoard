import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import api, { csrf } from '../lib/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  // One-time message for the next page (e.g. "You joined X"), survives the guest→app redirect
  const [flash, setFlash] = useState(null)

  const refresh = useCallback(async () => {
    try {
      const { data } = await api.get('/api/user')
      setUser(data.data ?? data)
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { refresh() }, [refresh])

  const login = useCallback(async (payload) => {
    await csrf()
    const { data } = await api.post('/api/login', payload)
    setFlash({ joined: data.joined_project, inviteError: data.invite_error })
    setUser(data.user)
    return data // { user, joined_project, invite_error }
  }, [])

  const register = useCallback(async (payload) => {
    await csrf()
    const { data } = await api.post('/api/register', payload)
    setFlash({ joined: data.joined_project, welcome: true })
    setUser(data.user)
    return data // { user, joined_project }
  }, [])

  const logout = useCallback(async () => {
    try { await api.post('/api/logout') } finally { setUser(null) }
  }, [])

  const value = useMemo(
    () => ({ user, loading, login, register, logout, refresh, flash, setFlash }),
    [user, loading, login, register, logout, refresh, flash]
  )
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
