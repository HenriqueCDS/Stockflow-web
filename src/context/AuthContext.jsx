import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { TOKEN_KEY, REFRESH_KEY, USER_KEY } from '../api/api'

const AuthContext = createContext(null)

const readUser = () => {
  try { return JSON.parse(sessionStorage.getItem(USER_KEY)) } catch { return null }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => sessionStorage.getItem(TOKEN_KEY))
  const [user, setUser] = useState(readUser)

  const signIn = useCallback((newToken, newUser, refreshToken) => {
    sessionStorage.setItem(TOKEN_KEY, newToken)
    if (refreshToken) sessionStorage.setItem(REFRESH_KEY, refreshToken)
    if (newUser) sessionStorage.setItem(USER_KEY, JSON.stringify(newUser))
    setToken(newToken)
    setUser(newUser || null)
  }, [])

  const signOut = useCallback(() => {
    sessionStorage.removeItem(TOKEN_KEY)
    sessionStorage.removeItem(REFRESH_KEY)
    sessionStorage.removeItem(USER_KEY)
    setToken(null)
    setUser(null)
  }, [])

  useEffect(() => {
    window.addEventListener('auth:unauthorized', signOut)
    return () => window.removeEventListener('auth:unauthorized', signOut)
  }, [signOut])

  return (
    <AuthContext.Provider value={{ token, user, isAuthenticated: !!token, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
