import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { api, getErrorMessage } from '../api'
import type { AuthResponse } from '../types'
import { useAuth } from '../context/AuthContext'
import { Lock, User, AlertCircle, Shield, ArrowRight } from 'lucide-react'

export function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const res = await api.post<AuthResponse>('/auth/login', { username, password })
      login(res.data)

      const from = (location.state as any)?.from?.pathname
      if (from) {
        navigate(from, { replace: true })
      } else {
        if (res.data.role === 'ADMIN' || res.data.role === 'FIRE_SERVICE_OFFICER') {
          navigate('/', { replace: true })
        } else if (res.data.role === 'MAINTENANCE_STAFF' || res.data.role === 'WORKER') {
          navigate('/worker', { replace: true })
        } else {
          navigate('/public', { replace: true })
        }
      }
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  const fillCredentials = (u: string, p: string) => {
    setUsername(u)
    setPassword(p)
    setError(null)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#070d1e] px-4 py-12 text-slate-100">
      <div className="w-full max-w-md">
        {/* Header Branding */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 shadow-xl shadow-cyan-500/20">
            <Shield className="h-7 w-7 text-white" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">
            Smart Municipal Road Operations
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            Sign in to access your designated role portal
          </p>
        </div>

        {/* Card Form */}
        <div className="rounded-2xl border border-slate-800 bg-[#0c1633]/80 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
          {error && (
            <div className="mb-6 flex items-start gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-sm text-rose-300">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                Username or Email Address
              </label>
              <div className="relative mt-1.5">
                <User className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. admin or admin@smartroadops.gov"
                  className="w-full rounded-xl border border-slate-700 bg-slate-900/90 py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                Password
              </label>
              <div className="relative mt-1.5">
                <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your account password"
                  className="w-full rounded-xl border border-slate-700 bg-slate-900/90 py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-500/25 transition-all hover:opacity-95 disabled:opacity-50"
            >
              {loading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <>
                  <span>Sign In to Dashboard</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Pre-fill helpers */}
          <div className="mt-6 border-t border-slate-800/80 pt-5">
            <p className="mb-2.5 text-center text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Quick Role Login Helper
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => fillCredentials('admin', 'admin123')}
                className="flex items-center justify-center gap-1.5 rounded-lg border border-purple-500/30 bg-purple-500/10 px-3 py-1.5 text-xs font-medium text-purple-300 hover:bg-purple-500/20 transition-all"
              >
                <Shield className="h-3 w-3 text-purple-400" />
                <span>Admin</span>
              </button>
              <button
                type="button"
                onClick={() => fillCredentials('sarathlm10@gmail.com', 'admin123')}
                className="flex items-center justify-center gap-1.5 rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-3 py-1.5 text-xs font-medium text-cyan-300 hover:bg-cyan-500/20 transition-all"
              >
                <User className="h-3 w-3 text-cyan-400" />
                <span>Admin (Email)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer Link to Register */}
        <p className="mt-6 text-center text-xs text-slate-400">
          Need a municipal account?{' '}
          <Link
            to="/signup"
            className="font-semibold text-cyan-400 hover:underline hover:text-cyan-300"
          >
            Create an Account with Email OTP
          </Link>
        </p>
      </div>
    </div>
  )
}
