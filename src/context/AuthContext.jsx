import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { authApi, setSession, clearSession, getStoredUser } from '../api/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getStoredUser())

  useEffect(() => {
    const handleForcedLogout = () => setUser(null)
    window.addEventListener('auth:logout', handleForcedLogout)
    return () => window.removeEventListener('auth:logout', handleForcedLogout)
  }, [])

  const login = useCallback(async (email, password) => {
    const res = await authApi.login(email, password)
    setSession(res)
    setUser(getStoredUser())
    return res
  }, [])

  const register = useCallback(async (data) => {
    const res = await authApi.register(data)
    setSession(res)
    setUser(getStoredUser())
    return res
  }, [])

  const join = useCallback(async (data) => {
    const res = await authApi.join(data)
    setSession(res)
    setUser(getStoredUser())
    return res
  }, [])

  const logout = useCallback(() => {
    authApi.logout().catch(() => {})
    clearSession()
    setUser(null)
  }, [])

  const updateUser = useCallback((patch) => {
    setUser(u => (u ? { ...u, ...patch } : u))
  }, [])

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, register, join, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
