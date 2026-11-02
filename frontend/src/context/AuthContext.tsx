import React, { createContext, useContext, useState, useEffect } from 'react'
import type { User, AuthResponse } from '../types'
import { api } from '../api'

interface AuthContextType {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isAdmin: boolean
  isFireServiceOfficer: boolean
  isMaintenanceStaff: boolean
  isViewer: boolean
  isWorker: boolean
  isPublic: boolean
  loading: boolean
  login: (data: AuthResponse) => void
  logout: () => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('auth_token'))
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('auth_user')
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch {
        return null
      }
    }
    return null
  })
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('auth_token')
      if (storedToken) {
        try {
          const res = await api.get<User>('/auth/me')
          setUser(res.data)
          localStorage.setItem('auth_user', JSON.stringify(res.data))
        } catch {
          // If token check fails, clear auth state
          localStorage.removeItem('auth_token')
          localStorage.removeItem('auth_user')
          setToken(null)
          setUser(null)
        }
      }
      setLoading(false)
    }

    initAuth()
  }, [])

  const login = (data: AuthResponse) => {
    localStorage.setItem('auth_token', data.token)
    setToken(data.token)
    const userObj: User = {
      id: data.userId,
      username: data.username,
      fullName: data.fullName,
      email: data.email,
      role: data.role,
      teamId: data.teamId,
    }
    localStorage.setItem('auth_user', JSON.stringify(userObj))
    setUser(userObj)
  }

  const logout = () => {
    try {
      api.post('/auth/logout').catch(() => {})
    } finally {
      localStorage.removeItem('auth_token')
      localStorage.removeItem('auth_user')
      setToken(null)
      setUser(null)
    }
  }

  const refreshUser = async () => {
    try {
      const res = await api.get<User>('/auth/me')
      setUser(res.data)
      localStorage.setItem('auth_user', JSON.stringify(res.data))
    } catch {
      // Ignored
    }
  }

  const isAdmin = user?.role === 'ADMIN'
  const isFireServiceOfficer = user?.role === 'FIRE_SERVICE_OFFICER'
  const isMaintenanceStaff = user?.role === 'MAINTENANCE_STAFF' || user?.role === 'WORKER'
  const isViewer = user?.role === 'VIEWER' || user?.role === 'PUBLIC'
  const isWorker = isMaintenanceStaff
  const isPublic = isViewer

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isAdmin,
        isFireServiceOfficer,
        isMaintenanceStaff,
        isViewer,
        isWorker,
        isPublic,
        loading,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
