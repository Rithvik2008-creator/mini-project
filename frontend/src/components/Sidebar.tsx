import {
  AlertTriangle,
  Archive,
  ClipboardList,
  GitFork,
  HardHat,
  LayoutDashboard,
  LogOut,
  MapPin,
  ShieldCheck,
  FilePlus,
} from 'lucide-react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function Sidebar() {
  const { user, isAdmin, isMaintenanceStaff, isViewer, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  // Define navigation items based on operational role
  let navItems = [
    { to: '/', label: 'Overview', icon: LayoutDashboard },
    { to: '/reports', label: 'Damage Reports', icon: AlertTriangle },
    { to: '/priority', label: 'Priority Queue', icon: ShieldCheck },
    { to: '/teams', label: 'Maintenance Teams', icon: HardHat },
    { to: '/network', label: 'Road Network', icon: GitFork },
    { to: '/assignments', label: 'Assignments', icon: ClipboardList },
    { to: '/archive', label: 'Completed Archive', icon: Archive },
  ]

  if (isMaintenanceStaff) {
    navItems = [
      { to: '/worker', label: 'My Assignments', icon: HardHat },
      { to: '/network', label: 'Road Network', icon: GitFork },
    ]
  } else if (isViewer) {
    navItems = [
      { to: '/public', label: 'Citizen Portal', icon: FilePlus },
      { to: '/network', label: 'Live Road Status', icon: GitFork },
    ]
  }

  const roleBadgeStyle = () => {
    if (isAdmin) return 'bg-purple-500/20 text-purple-300 border-purple-500/30'
    if (isMaintenanceStaff) return 'bg-amber-500/20 text-amber-300 border-amber-500/30'
    return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
  }

  const roleLabel = () => {
    if (isAdmin) return 'ADMINISTRATOR'
    if (isMaintenanceStaff) return user?.teamId ? `MAINTENANCE (${user.teamId})` : 'MAINTENANCE STAFF'
    return 'VIEWER / CITIZEN'
  }

  return (
    <aside className="w-full shrink-0 border-r border-slate-800 bg-[#0b132b] px-5 py-6 text-slate-200 lg:w-72 lg:min-h-screen lg:px-6 lg:py-8 flex flex-col justify-between">
      <div>
        {/* Brand Header */}
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-500 shadow-lg shadow-cyan-500/20">
            <MapPin className="h-6 w-6 text-white" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-cyan-400">
              Metropolitan City
            </span>
            <h1 className="text-lg font-bold leading-tight text-white">
              Smart Road Ops
            </h1>
            <p className="text-xs text-slate-400">Municipal Maintenance</p>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="space-y-1.5">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `group flex items-center gap-3.5 rounded-xl px-3.5 py-3 text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/25'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`
              }
            >
              <Icon className="h-4.5 w-4.5 transition-transform group-hover:scale-110" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
      </div>

      {/* User Session Footer */}
      <div className="mt-8 border-t border-slate-800/80 pt-6">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-800 text-cyan-400 font-bold">
            {user?.fullName?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">
              {user?.fullName || 'Logged User'}
            </p>
            <div className="mt-1">
              <span
                className={`inline-block truncate rounded-md border px-2 py-0.5 text-[10px] font-semibold tracking-wide ${roleBadgeStyle()}`}
              >
                {roleLabel()}
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-700/80 bg-slate-800/40 py-2.5 text-xs font-semibold text-slate-300 transition-all hover:border-rose-500/40 hover:bg-rose-500/10 hover:text-rose-300"
        >
          <LogOut className="h-4 w-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  )
}
