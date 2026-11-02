import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import type { UserRole } from '../types'

interface ProtectedRouteProps {
  children: React.ReactElement
  allowedRoles?: UserRole[]
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#070d1e] text-cyan-400">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent" />
          <p className="text-sm font-medium text-slate-300">Verifying session credentials...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (allowedRoles && allowedRoles.length > 0) {
    const hasPermission = allowedRoles.some((role) => {
      if (role === user.role) return true
      if (user.role === 'ADMIN') return true // Admin has global view access
      if ((role === 'MAINTENANCE_STAFF' || role === 'WORKER') && (user.role === 'MAINTENANCE_STAFF' || user.role === 'WORKER')) return true
      if ((role === 'VIEWER' || role === 'PUBLIC') && (user.role === 'VIEWER' || user.role === 'PUBLIC')) return true
      return false
    })

    if (!hasPermission) {
      if (user.role === 'MAINTENANCE_STAFF' || user.role === 'WORKER') {
        return <Navigate to="/worker" replace />
      }
      if (user.role === 'VIEWER' || user.role === 'PUBLIC') {
        return <Navigate to="/public" replace />
      }
      return <Navigate to="/" replace />
    }
  }

  return children
}
