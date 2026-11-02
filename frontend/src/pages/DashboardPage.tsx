import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Clock,
  HardHat,
  PieChart as PieChartIcon,
  RefreshCw,
  Route,
  Zap,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { api, getErrorMessage } from '../api'
import { AlertBanner } from '../components/AlertBanner'
import { StatusBadge } from '../components/StatusBadge'
import type { DashboardData } from '../types'

const STATUS_COLORS: Record<string, string> = {
  PENDING: '#f59e0b',
  ASSIGNED: '#3b82f6',
  COMPLETED: '#10b981',
}

export function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [assigning, setAssigning] = useState(false)
  const [banner, setBanner] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const fetchDashboard = async () => {
    try {
      setLoading(true)
      const res = await api.get<DashboardData>('/dashboard')
      setData(res.data)
    } catch (err) {
      setBanner({ type: 'error', message: getErrorMessage(err) })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void fetchDashboard()
  }, [])

  const handleQuickAssign = async () => {
    try {
      setAssigning(true)
      setBanner(null)
      const res = await api.post('/assignments/next')
      setBanner({
        type: 'success',
        message: `Successfully assigned report ${res.data.reportId} to team ${res.data.teamName} (${res.data.travelTime} mins travel time via ${res.data.route})!`,
      })
      await fetchDashboard()
    } catch (err) {
      setBanner({ type: 'error', message: getErrorMessage(err) })
    } finally {
      setAssigning(false)
    }
  }

  const severityChartData = useMemo(() => {
    if (!data?.reportsBySeverity) return []
    return Object.entries(data.reportsBySeverity).map(([key, count]) => ({
      name: `Severity ${key.replace('S', '')}`,
      count,
    }))
  }, [data])

  const statusChartData = useMemo(() => {
    if (!data?.reportsByStatus) return []
    return Object.entries(data.reportsByStatus).map(([status, count]) => ({
      name: status,
      value: count,
    }))
  }, [data])

  if (loading && !data) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex items-center gap-3 text-slate-500">
          <RefreshCw className="h-6 w-6 animate-spin text-cyan-600" />
          <span className="font-medium">Loading municipal operational data...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Operations Dashboard
          </h2>
          <p className="text-sm text-slate-500">
            Real-time municipal road maintenance and dynamic resource metrics
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => void fetchDashboard()}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-slate-900"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => void handleQuickAssign()}
            disabled={assigning}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-500/20 transition hover:from-blue-500 hover:to-cyan-500 disabled:opacity-50"
          >
            <Zap className={`h-4 w-4 ${assigning ? 'animate-spin' : ''}`} />
            {assigning ? 'Dispatching...' : 'Dispatch Highest Priority'}
          </button>
        </div>
      </div>

      {banner && (
        <AlertBanner
          type={banner.type}
          message={banner.message}
          onClose={() => setBanner(null)}
        />
      )}

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Reports
            </span>
            <AlertTriangle className="h-5 w-5 text-amber-500" />
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {data?.totalDamageReports ?? 0}
          </p>
          <p className="text-xs text-slate-400">Total logged incidents</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Pending
            </span>
            <Clock className="h-5 w-5 text-amber-600" />
          </div>
          <p className="mt-2 text-2xl font-bold text-amber-600">
            {data?.pendingReports ?? 0}
          </p>
          <p className="text-xs text-slate-400">Awaiting assignment</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Assigned
            </span>
            <HardHat className="h-5 w-5 text-blue-600" />
          </div>
          <p className="mt-2 text-2xl font-bold text-blue-600">
            {data?.assignedReports ?? 0}
          </p>
          <p className="text-xs text-slate-400">Teams dispatched</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Completed
            </span>
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          </div>
          <p className="mt-2 text-2xl font-bold text-emerald-600">
            {data?.completedReports ?? 0}
          </p>
          <p className="text-xs text-slate-400">Repaired & released</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Available Teams
            </span>
            <HardHat className="h-5 w-5 text-indigo-600" />
          </div>
          <p className="mt-2 text-2xl font-bold text-indigo-600">
            {data?.availableTeams ?? 0}
          </p>
          <p className="text-xs text-slate-400">{data?.busyTeams ?? 0} teams busy</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Closed Roads
            </span>
            <Route className="h-5 w-5 text-rose-600" />
          </div>
          <p className="mt-2 text-2xl font-bold text-rose-600">
            {data?.closedRoads ?? 0}
          </p>
          <p className="text-xs text-slate-400">Excluded by Dijkstra</p>
        </div>
      </div>

      {/* Visual Analytics Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-bold text-slate-800">
              Damage Severity Breakdown
            </h3>
            <span className="text-xs text-slate-400">Levels 1 (Minor) to 5 (Critical)</span>
          </div>
          <div className="h-64 w-full">
            {severityChartData.some((item) => item.count > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={severityChartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} />
                  <YAxis allowDecimals={false} stroke="#64748b" fontSize={12} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      borderRadius: '8px',
                      color: '#fff',
                      border: 'none',
                    }}
                  />
                  <Bar dataKey="count" fill="#0284c7" radius={[6, 6, 0, 0]} name="Reports" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-6 text-center">
                <BarChart3 className="h-9 w-9 text-slate-300 mb-2" />
                <p className="text-sm font-semibold text-slate-600">No damage reports found</p>
                <p className="text-xs text-slate-400 mt-1 max-w-xs">
                  Severity metrics will populate automatically when incidents are reported.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-bold text-slate-800">
              Report Status Distribution
            </h3>
            <span className="text-xs text-slate-400">Current workflow states</span>
          </div>
          <div className="h-64 w-full">
            {statusChartData.some((item) => item.value > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusChartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={85}
                    paddingAngle={4}
                  >
                    {statusChartData.map((entry) => (
                      <Cell
                        key={entry.name}
                        fill={STATUS_COLORS[entry.name] || '#94a3b8'}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      borderRadius: '8px',
                      color: '#fff',
                      border: 'none',
                    }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-6 text-center">
                <PieChartIcon className="h-9 w-9 text-slate-300 mb-2" />
                <p className="text-sm font-semibold text-slate-600">No status data available</p>
                <p className="text-xs text-slate-400 mt-1 max-w-xs">
                  Incident workflow distribution will be charted here as damage reports are added.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tables Row: Recent Reports & Active Assignments */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* Recent Reports */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-bold text-slate-800">
              Recent Damage Reports
            </h3>
            <Link
              to="/reports"
              className="text-xs font-semibold text-cyan-600 hover:text-cyan-700"
            >
              View all reports &rarr;
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-slate-100 text-xs font-semibold uppercase text-slate-500">
                <tr>
                  <th className="pb-3">ID</th>
                  <th className="pb-3">Location</th>
                  <th className="pb-3">Type</th>
                  <th className="pb-3">Severity</th>
                  <th className="pb-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {data?.recentReports && data.recentReports.length > 0 ? (
                  data.recentReports.map((report) => (
                    <tr key={report.reportId} className="hover:bg-slate-50/70">
                      <td className="py-2.5 font-mono font-semibold text-slate-800">
                        {report.reportId}
                      </td>
                      <td className="py-2.5 text-slate-600">{report.location}</td>
                      <td className="py-2.5">
                        <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                          {report.repairType}
                        </span>
                      </td>
                      <td className="py-2.5">
                        <span className="font-semibold text-slate-700">
                          {report.severity}/5
                        </span>
                      </td>
                      <td className="py-2.5">
                        <StatusBadge status={report.status} />
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-4 text-center text-slate-400">
                      No damage reports found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Active Assignments */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-bold text-slate-800">
              Active Job Assignments
            </h3>
            <Link
              to="/assignments"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700"
            >
              Manage assignments &rarr;
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-slate-100 text-xs font-semibold uppercase text-slate-500">
                <tr>
                  <th className="pb-3">Report</th>
                  <th className="pb-3">Assigned Team</th>
                  <th className="pb-3">Travel Time</th>
                  <th className="pb-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {data?.recentAssignments && data.recentAssignments.length > 0 ? (
                  data.recentAssignments.map((a) => (
                    <tr key={a.id} className="hover:bg-slate-50/70">
                      <td className="py-2.5 font-mono font-semibold text-slate-800">
                        {a.reportId}
                      </td>
                      <td className="py-2.5 text-slate-700 font-medium">
                        {a.teamName}
                      </td>
                      <td className="py-2.5 text-slate-600">
                        {a.travelTime} mins
                      </td>
                      <td className="py-2.5">
                        <StatusBadge status={a.completed ? 'COMPLETED' : 'ASSIGNED'} />
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-4 text-center text-slate-400">
                      No active assignments currently.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
