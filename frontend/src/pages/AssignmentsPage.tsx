import {
  CheckCircle2,
  HardHat,
  Plus,
  RefreshCw,
  Route,
  Zap,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { api, getErrorMessage } from '../api'
import { AlertBanner } from '../components/AlertBanner'
import { StatusBadge } from '../components/StatusBadge'
import type { Assignment, DamageReport, Team } from '../types'

export function AssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [pendingReports, setPendingReports] = useState<DamageReport[]>([])
  const [availableTeams, setAvailableTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [assigning, setAssigning] = useState(false)
  const [completingId, setCompletingId] = useState<number | null>(null)
  const [banner, setBanner] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // Specific assignment state
  const [selectedReportId, setSelectedReportId] = useState('')
  const [selectedTeamId, setSelectedTeamId] = useState('')

  const fetchAll = async () => {
    try {
      setLoading(true)
      const [assRes, repRes, teamRes] = await Promise.all([
        api.get<Assignment[]>('/assignments'),
        api.get<DamageReport[]>('/reports?status=PENDING'),
        api.get<Team[]>('/teams'),
      ])
      setAssignments(assRes.data)
      setPendingReports(repRes.data)
      const avail = teamRes.data.filter((t) => t.available)
      setAvailableTeams(avail)

      if (repRes.data.length > 0 && !selectedReportId) {
        setSelectedReportId(repRes.data[0].reportId)
      }
      if (avail.length > 0 && !selectedTeamId) {
        setSelectedTeamId(avail[0].teamId)
      }
    } catch (err) {
      setBanner({ type: 'error', message: getErrorMessage(err) })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void fetchAll()
  }, [])

  const handleAutoAssign = async () => {
    try {
      setAssigning(true)
      setBanner(null)
      const res = await api.post<Assignment>('/assignments/next')
      setBanner({
        type: 'success',
        message: `Highest priority report ${res.data.reportId} successfully assigned to team ${res.data.teamName} (${res.data.travelTime} mins via ${res.data.route})!`,
      })
      await fetchAll()
    } catch (err) {
      setBanner({ type: 'error', message: getErrorMessage(err) })
    } finally {
      setAssigning(false)
    }
  }

  const handleSpecificAssign = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedReportId || !selectedTeamId) {
      setBanner({ type: 'error', message: 'Please select both a pending report and an available team.' })
      return
    }

    try {
      setAssigning(true)
      setBanner(null)
      const res = await api.post<Assignment>('/assignments/assign', {
        reportId: selectedReportId,
        teamId: selectedTeamId,
      })
      setBanner({
        type: 'success',
        message: `Report ${res.data.reportId} specifically assigned to ${res.data.teamName} (${res.data.travelTime} mins via ${res.data.route})!`,
      })
      await fetchAll()
    } catch (err) {
      setBanner({ type: 'error', message: getErrorMessage(err) })
    } finally {
      setAssigning(false)
    }
  }

  const handleComplete = async (assignmentId: number) => {
    try {
      setCompletingId(assignmentId)
      setBanner(null)
      const res = await api.post<Assignment>(`/assignments/${assignmentId}/complete`)
      setBanner({
        type: 'success',
        message: `Repair job #${res.data.id} (${res.data.reportId}) completed! Report marked COMPLETED, and team ${res.data.teamName} released at ${res.data.location}.`,
      })
      await fetchAll()
    } catch (err) {
      setBanner({ type: 'error', message: getErrorMessage(err) })
    } finally {
      setCompletingId(null)
    }
  }

  const activeAssignments = assignments.filter((a) => !a.completed)
  const completedAssignments = assignments.filter((a) => a.completed)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Repair Assignments & Dispatch
          </h2>
          <p className="text-sm text-slate-500">
            Dispatch highest-priority damage reports to compatible teams and track repair completions
          </p>
        </div>
        <button
          onClick={() => void fetchAll()}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {banner && (
        <AlertBanner
          type={banner.type}
          message={banner.message}
          onClose={() => setBanner(null)}
        />
      )}

      {/* Dispatch Controls Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Auto Dispatch Card */}
        <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50/80 via-white to-cyan-50/50 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-blue-900 font-bold text-base mb-2">
              <Zap className="h-5 w-5 text-blue-600" />
              <span>Smart Priority Dispatcher</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Automatically evaluates the priority queue, scans all currently available teams for equipment compatibility (e.g. Jackhammer vs Road Roller), and finds the nearest team via Dijkstra's shortest travel time.
            </p>
            <div className="mt-4 flex items-center gap-4 text-xs font-semibold text-slate-700">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-amber-500" />
                <span>Pending Jobs: <strong>{pendingReports.length}</strong></span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <span>Available Teams: <strong>{availableTeams.length}</strong></span>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <button
              onClick={() => void handleAutoAssign()}
              disabled={assigning || pendingReports.length === 0 || availableTeams.length === 0}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 px-5 py-3 text-sm font-bold text-white shadow-md shadow-blue-500/20 transition hover:from-blue-500 hover:to-cyan-500 disabled:opacity-50"
            >
              <Zap className={`h-4 w-4 ${assigning ? 'animate-spin' : ''}`} />
              {assigning ? 'Evaluating & Assigning...' : 'Assign Highest-Priority Eligible Report'}
            </button>
          </div>
        </div>

        {/* Targeted Dispatch Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-base mb-2">
            <HardHat className="h-5 w-5 text-cyan-600" />
            <span>Targeted Dispatch</span>
          </div>
          <p className="text-xs text-slate-500 mb-4">
            Select a specific pending report and deploy an available maintenance crew with compatibility validation.
          </p>

          <form onSubmit={handleSpecificAssign} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Select Pending Report
              </label>
              <select
                value={selectedReportId}
                onChange={(e) => setSelectedReportId(e.target.value)}
                disabled={pendingReports.length === 0}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none disabled:bg-slate-100 disabled:text-slate-400"
              >
                {pendingReports.length === 0 ? (
                  <option value="">No pending reports available</option>
                ) : (
                  pendingReports.map((r) => (
                    <option key={r.reportId} value={r.reportId}>
                      {r.reportId} - {r.location} ({r.repairType}, Sev: {r.severity})
                    </option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Select Available Team
              </label>
              <select
                value={selectedTeamId}
                onChange={(e) => setSelectedTeamId(e.target.value)}
                disabled={availableTeams.length === 0}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none disabled:bg-slate-100 disabled:text-slate-400"
              >
                {availableTeams.length === 0 ? (
                  <option value="">No available teams</option>
                ) : (
                  availableTeams.map((t) => (
                    <option key={t.teamId} value={t.teamId}>
                      {t.teamId} - {t.teamName} (at {t.currentLocation})
                    </option>
                  ))
                )}
              </select>
            </div>

            <button
              type="submit"
              disabled={assigning || pendingReports.length === 0 || availableTeams.length === 0}
              className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              Dispatch Selected Team
            </button>
          </form>
        </div>
      </div>

      {/* Active Assignments Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
            <Route className="h-4 w-4 text-blue-600" />
            Active Repair Jobs in Progress ({activeAssignments.length})
          </h3>
          <span className="text-xs text-slate-400">Real-Time Missions</span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 text-left text-sm">
            <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500">
              <tr>
                <th className="px-5 py-3.5">Mission ID</th>
                <th className="px-5 py-3.5">Report ID</th>
                <th className="px-5 py-3.5">Assigned Team</th>
                <th className="px-5 py-3.5">Site Location</th>
                <th className="px-5 py-3.5">Job Type</th>
                <th className="px-5 py-3.5">Route</th>
                <th className="px-5 py-3.5">Travel Time</th>
                <th className="px-5 py-3.5 text-right">Completion Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {activeAssignments.length > 0 ? (
                activeAssignments.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-3.5 font-mono text-xs font-bold text-slate-500">
                      #{a.id}
                    </td>
                    <td className="px-5 py-3.5 font-mono font-bold text-blue-900">
                      {a.reportId}
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-slate-800">
                      {a.teamName}
                    </td>
                    <td className="px-5 py-3.5 text-slate-700">
                      {a.location}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
                        {a.repairType}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-xs text-slate-600 max-w-xs truncate" title={a.route}>
                      {a.route}
                    </td>
                    <td className="px-5 py-3.5 font-bold text-cyan-800">
                      {a.travelTime} mins
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => void handleComplete(a.id)}
                        disabled={completingId === a.id}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-500 disabled:opacity-50"
                      >
                        <CheckCircle2 className={`h-3.5 w-3.5 ${completingId === a.id ? 'animate-spin' : ''}`} />
                        {completingId === a.id ? 'Completing...' : 'Mark Completed'}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-5 py-8 text-center text-slate-400">
                    No active repair assignments at this moment.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Completed Jobs History Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            Completed Repair Archive ({completedAssignments.length})
          </h3>
          <span className="text-xs text-slate-400">Historical Records</span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 text-left text-sm">
            <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500">
              <tr>
                <th className="px-5 py-3.5">Mission</th>
                <th className="px-5 py-3.5">Report</th>
                <th className="px-5 py-3.5">Team</th>
                <th className="px-5 py-3.5">Repaired Location</th>
                <th className="px-5 py-3.5">Repair Type</th>
                <th className="px-5 py-3.5">Travel Time</th>
                <th className="px-5 py-3.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {completedAssignments.length > 0 ? (
                completedAssignments.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-3.5 font-mono text-xs text-slate-500">#{c.id}</td>
                    <td className="px-5 py-3.5 font-mono font-bold text-slate-800">{c.reportId}</td>
                    <td className="px-5 py-3.5 text-slate-700">{c.teamName}</td>
                    <td className="px-5 py-3.5 text-slate-700">{c.location}</td>
                    <td className="px-5 py-3.5">
                      <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
                        {c.repairType}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-600">{c.travelTime} mins</td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status="COMPLETED" />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-slate-400">
                    No completed repair records yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
