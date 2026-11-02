import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api, getErrorMessage } from '../api'
import type { AuthResponse, Team, UserRole } from '../types'
import { useAuth } from '../context/AuthContext'
import {
  Lock,
  User,
  Mail,
  Shield,
  HardHat,
  Users,
  AlertCircle,
  ArrowRight,
  KeyRound,
  CheckCircle2,
  Clock,
  Flame,
  Eye,
  RefreshCw
} from 'lucide-react'

export function SignupPage() {
  const [role, setRole] = useState<UserRole>('VIEWER')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [otp, setOtp] = useState('')
  const [teamId, setTeamId] = useState('')
  const [adminSecretKey, setAdminSecretKey] = useState('')
  const [availableTeams, setAvailableTeams] = useState<Team[]>([])

  const [otpSent, setOtpSent] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  const [timerMinutes, setTimerMinutes] = useState(5)
  const [timerSeconds, setTimerSeconds] = useState(0)

  const [loading, setLoading] = useState(false)
  const [sendingOtp, setSendingOtp] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successNotice, setSuccessNotice] = useState<string | null>(null)

  const { login } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    // Fetch available teams for maintenance staff selection
    api
      .get<Team[]>('/teams')
      .then((res) => {
        setAvailableTeams(res.data)
        if (res.data.length > 0 && !teamId) {
          setTeamId(res.data[0].teamId)
        }
      })
      .catch(() => {})
  }, [])

  // 60-second resend cooldown timer & 5-minute OTP expiry countdown
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown((prev) => prev - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [resendCooldown])

  useEffect(() => {
    if (!otpSent) return
    const interval = setInterval(() => {
      if (timerSeconds > 0) {
        setTimerSeconds((prev) => prev - 1)
      } else if (timerMinutes > 0) {
        setTimerMinutes((prev) => prev - 1)
        setTimerSeconds(59)
      }
    }, 1000)
    return () => clearInterval(interval)
  }, [otpSent, timerMinutes, timerSeconds])

  const validateInitialInputs = (): boolean => {
    if (!fullName.trim() || fullName.trim().length < 2) {
      setError('Please provide your full legal name (minimum 2 characters).')
      return false
    }
    if (!email.trim() || !email.includes('@') || !email.includes('.')) {
      setError('Please provide a valid email address.')
      return false
    }
    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters long.')
      return false
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match. Please re-enter your confirmation password.')
      return false
    }
    if ((role === 'MAINTENANCE_STAFF' || role === 'WORKER') && !teamId) {
      setError('Please select an active maintenance team.')
      return false
    }
    if ((role === 'ADMIN' || role === 'FIRE_SERVICE_OFFICER') && !adminSecretKey.trim()) {
      setError('Privileged roles (Admin, Fire Service Officer) require an Administrative Provisioning Key.')
      return false
    }
    return true
  }

  // Step 1: Send OTP via backend Gmail SMTP service
  const handleSendOtp = async () => {
    setError(null)
    setSuccessNotice(null)

    if (!validateInitialInputs()) {
      return
    }

    setSendingOtp(true)
    try {
      const res = await api.post<{ message: string }>('/auth/send-otp', {
        email: email.trim().toLowerCase(),
      })
      setOtpSent(true)
      setResendCooldown(60)
      setTimerMinutes(5)
      setTimerSeconds(0)
      setSuccessNotice(res.data.message || 'Verification code sent to your email address.')
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSendingOtp(false)
    }
  }

  // Step 2: Verify OTP & Create Account
  const handleVerifyAndSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccessNotice(null)

    if (!validateInitialInputs()) {
      return
    }

    const isPrivilegedWithKey = (role === 'ADMIN' || role === 'FIRE_SERVICE_OFFICER') && adminSecretKey.trim().length > 0

    if (!otpSent && !isPrivilegedWithKey) {
      setError('Please click "Send Verification Code" first to receive an email OTP.')
      return
    }

    if (!isPrivilegedWithKey && (!otp || otp.trim().length < 6)) {
      setError('Please enter the 6-digit email verification code.')
      return
    }

    setLoading(true)
    try {
      const payload = {
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        password,
        confirmPassword,
        role,
        otp: otp.trim() || undefined,
        teamId: (role === 'MAINTENANCE_STAFF' || role === 'WORKER') ? teamId : undefined,
        adminSecretKey: (role === 'ADMIN' || role === 'FIRE_SERVICE_OFFICER') ? adminSecretKey.trim() : undefined,
      }

      const res = await api.post<AuthResponse>('/auth/signup', payload)
      login(res.data)

      if (res.data.role === 'ADMIN') {
        navigate('/', { replace: true })
      } else if (res.data.role === 'MAINTENANCE_STAFF' || res.data.role === 'WORKER') {
        navigate('/worker', { replace: true })
      } else {
        navigate('/public', { replace: true })
      }
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#070d1e] px-4 py-12 text-slate-100">
      <div className="w-full max-w-xl">
        {/* Header */}
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-13 w-13 items-center justify-center rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 shadow-xl shadow-cyan-500/20">
            <Users className="h-6 w-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">
            Register for Municipal Road Ops
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            Secure account creation with Gmail OTP verification
          </p>
        </div>

        {/* Form Container */}
        <div className="rounded-2xl border border-slate-800 bg-[#0c1633]/80 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
          {error && (
            <div className="mb-5 flex items-start gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-sm text-rose-300">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {successNotice && (
            <div className="mb-5 flex items-start gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-sm text-emerald-300">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
              <span>{successNotice}</span>
            </div>
          )}

          {/* Role Selection Grid */}
          <div className="mb-6">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Select Your Operational Role
            </label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <button
                type="button"
                onClick={() => {
                  setRole('VIEWER')
                  setError(null)
                }}
                className={`flex flex-col items-center justify-center gap-1.5 rounded-xl border p-3 text-center transition-all ${
                  role === 'VIEWER' || role === 'PUBLIC'
                    ? 'border-cyan-500 bg-cyan-500/15 text-white shadow-md shadow-cyan-500/20'
                    : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <Eye className="h-5 w-5 text-cyan-400" />
                <span className="text-[11px] font-semibold">Viewer / Citizen</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setRole('MAINTENANCE_STAFF')
                  setError(null)
                  if (!teamId) {
                    setTeamId(availableTeams.length > 0 ? availableTeams[0].teamId : 'TEAM-1')
                  }
                }}
                className={`flex flex-col items-center justify-center gap-1.5 rounded-xl border p-3 text-center transition-all ${
                  role === 'MAINTENANCE_STAFF' || role === 'WORKER'
                    ? 'border-amber-500 bg-amber-500/15 text-white shadow-md shadow-amber-500/20'
                    : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <HardHat className="h-5 w-5 text-amber-400" />
                <span className="text-[11px] font-semibold">Maintenance Staff</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setRole('FIRE_SERVICE_OFFICER')
                  setError(null)
                }}
                className={`flex flex-col items-center justify-center gap-1.5 rounded-xl border p-3 text-center transition-all ${
                  role === 'FIRE_SERVICE_OFFICER'
                    ? 'border-rose-500 bg-rose-500/15 text-white shadow-md shadow-rose-500/20'
                    : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <Flame className="h-5 w-5 text-rose-400" />
                <span className="text-[11px] font-semibold">Fire Officer</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setRole('ADMIN')
                  setError(null)
                }}
                className={`flex flex-col items-center justify-center gap-1.5 rounded-xl border p-3 text-center transition-all ${
                  role === 'ADMIN'
                    ? 'border-purple-500 bg-purple-500/15 text-white shadow-md shadow-purple-500/20'
                    : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <Shield className="h-5 w-5 text-purple-400" />
                <span className="text-[11px] font-semibold">Administrator</span>
              </button>
            </div>
          </div>

          <form onSubmit={handleVerifyAndSignup} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                Full Legal Name *
              </label>
              <div className="relative mt-1.5">
                <User className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Rajesh Kumar"
                  className="w-full rounded-xl border border-slate-700 bg-slate-900/90 py-2.5 pl-10 pr-3.5 text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                Email Address (Gmail for OTP) *
              </label>
              <div className="relative mt-1.5 flex gap-2">
                <div className="relative flex-1">
                  <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. user@gmail.com"
                    className="w-full rounded-xl border border-slate-700 bg-slate-900/90 py-2.5 pl-10 pr-3 text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={sendingOtp || resendCooldown > 0}
                  className="shrink-0 rounded-xl bg-cyan-600 px-4 py-2.5 text-xs font-semibold text-white transition-all hover:bg-cyan-500 disabled:opacity-50"
                >
                  {sendingOtp ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : resendCooldown > 0 ? (
                    `Resend (${resendCooldown}s)`
                  ) : (
                    'Send Code'
                  )}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Password *
                </label>
                <div className="relative mt-1.5">
                  <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 6 characters"
                    className="w-full rounded-xl border border-slate-700 bg-slate-900/90 py-2.5 pl-10 pr-3 text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Confirm Password *
                </label>
                <div className="relative mt-1.5">
                  <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm password"
                    className="w-full rounded-xl border border-slate-700 bg-slate-900/90 py-2.5 pl-10 pr-3 text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  />
                </div>
              </div>
            </div>

            {/* Email Verification OTP Section */}
            {(otpSent || (role !== 'ADMIN' && role !== 'FIRE_SERVICE_OFFICER')) && (
              <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 p-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-cyan-300">
                    Email Verification Code (OTP) *
                  </label>
                  {otpSent && (
                    <span className="flex items-center gap-1 text-[11px] font-mono text-cyan-300">
                      <Clock className="h-3 w-3" />
                      <span>
                        Expires in {timerMinutes}:{timerSeconds < 10 ? `0${timerSeconds}` : timerSeconds}
                      </span>
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="Enter 6-digit code received in email"
                  className="w-full tracking-widest text-center font-mono text-lg rounded-xl border border-cyan-500/40 bg-slate-900 py-2 px-3 text-white placeholder-cyan-400/40 focus:border-cyan-400 focus:outline-none"
                />
                <p className="mt-1.5 text-[11px] text-cyan-300/80">
                  The OTP expires in 5 minutes and is valid for a single verification attempt.
                </p>
              </div>
            )}

            {/* Role-specific: Team linking for Maintenance Staff */}
            {(role === 'MAINTENANCE_STAFF' || role === 'WORKER') && (
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-amber-300">
                  Assign to Maintenance Team *
                </label>
                {availableTeams.length > 0 ? (
                  <select
                    required
                    value={teamId}
                    onChange={(e) => setTeamId(e.target.value)}
                    className="mt-2 w-full rounded-xl border border-amber-500/40 bg-slate-900 py-2.5 px-3 text-sm text-white focus:border-amber-400 focus:outline-none"
                  >
                    {availableTeams.map((team) => (
                      <option key={team.teamId} value={team.teamId}>
                        {team.teamId} - {team.teamName} ({team.currentLocation})
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    required
                    value={teamId || 'TEAM-1'}
                    onChange={(e) => setTeamId(e.target.value)}
                    placeholder="e.g. TEAM-1"
                    className="mt-2 w-full rounded-xl border border-amber-500/40 bg-slate-900 py-2.5 px-3 text-sm text-white focus:border-amber-400 focus:outline-none"
                  />
                )}
              </div>
            )}

            {/* Role-specific: Administrator / Officer Provisioning Key */}
            {(role === 'ADMIN' || role === 'FIRE_SERVICE_OFFICER') && (
              <div className="rounded-xl border border-purple-500/30 bg-purple-500/10 p-3.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-purple-300">
                    Administrative Provisioning Key *
                  </label>
                  <button
                    type="button"
                    onClick={() => setAdminSecretKey('ADMIN_SECRET_KEY_2026')}
                    className="text-[11px] text-purple-300 hover:text-white underline font-mono"
                  >
                    Use Developer Key
                  </button>
                </div>
                <div className="relative mt-1.5">
                  <KeyRound className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-purple-400" />
                  <input
                    type="password"
                    required
                    value={adminSecretKey}
                    onChange={(e) => setAdminSecretKey(e.target.value)}
                    placeholder="Enter system administrator secret key"
                    className="w-full rounded-xl border border-purple-500/40 bg-slate-900 py-2.5 pl-10 pr-3 text-sm text-white placeholder-purple-300/40 focus:border-purple-400 focus:outline-none"
                  />
                </div>
                <p className="mt-1.5 text-[11px] text-purple-300/80">
                  Public signup cannot create privileged roles without administrative authorization.
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-500/25 transition-all hover:opacity-95 disabled:opacity-50"
            >
              {loading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <>
                  <span>Verify and Create Account</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
        </div>

        <p className="mt-5 text-center text-xs text-slate-400">
          Already have an account?{' '}
          <Link
            to="/login"
            className="font-semibold text-cyan-400 hover:underline hover:text-cyan-300"
          >
            Sign In Here
          </Link>
        </p>
      </div>
    </div>
  )
}
