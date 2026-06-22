import { createContext, useContext, useEffect, useState } from 'react'
import { authApi } from '../services/api'
import { storage } from '../services/storage'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => storage.getSession())
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setUser(storage.getSession())
  }, [])

  const login = async (email, password) => {
    const res = await authApi.login({ email, password })
    setUser(res.data.user)
    return res.data
  }

  const signup = async (email, password, full_name) => {
    const res = await authApi.signup({ email, password, full_name })
    setUser(res.data.user)
    return res.data
  }

  const logout = () => {
    storage.logout()
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
