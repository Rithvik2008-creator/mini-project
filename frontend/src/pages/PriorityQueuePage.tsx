import {
  ArrowDownNarrowWide,
  CheckCircle2,
  RefreshCw,
  ShieldAlert,
  Zap,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { api, getErrorMessage } from '../api'
import { AlertBanner } from '../components/AlertBanner'
import type { DamageReport } from '../types'

export function PriorityQueuePage() {
  const [reports, setReports] = useState<DamageReport[]>([])
  const [loading, setLoading] = useState(true)
  const [assigning, setAssigning] = useState(false)
  const [banner, setBanner] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const fetchPriorityQueue = async () => {
    try {
      setLoading(true)
      const res = await api.get<DamageReport[]>('/reports/priority')
      setReports(res.data)
    } catch (err) {
      setBanner({ type: 'error', message: getErrorMessage(err) })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void fetchPriorityQueue()
  }, [])

  const handleDispatchTop = async () => {
    try {
      setAssigning(true)
      setBanner(null)
      const res = await api.post('/assignments/next')
      setBanner({
        type: 'success',
        message: `High-priority job ${res.data.reportId} successfully dispatched to team ${res.data.teamName} (Route: ${res.data.route}, Travel Time: ${res.data.travelTime} mins)!`,
      })
      await fetchPriorityQueue()
    } catch (err) {
      setBanner({ type: 'error', message: getErrorMessage(err) })
    } finally {
      setAssigning(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-6 w-6 text-cyan-600" />
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              Live Priority Queue
            </h2>
          </div>
          <p className="text-sm text-slate-500">
            Real-time multi-tier ranking of pending municipal road damage reports
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => void fetchPriorityQueue()}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => void handleDispatchTop()}
            disabled={assigning || reports.length === 0}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-500/20 transition hover:from-blue-500 hover:to-cyan-500 disabled:opacity-50"
          >
            <Zap className={`h-4 w-4 ${assigning ? 'animate-spin' : ''}`} />
            {assigning ? 'Assigning...' : 'Dispatch Rank #1 Job'}
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

      {/* Priority Policy Explanation Card */}
      <div className="rounded-2xl border border-cyan-100 bg-gradient-to-r from-cyan-50/70 via-blue-50/50 to-white p-5 shadow-sm">
        <div className="flex items-center gap-2 text-cyan-900 font-bold mb-2">
          <ArrowDownNarrowWide className="h-5 w-5 text-cyan-700" />
          <span>Multi-Tier Tie-Breaking Algorithm (Preserved from Java Backend)</span>
        </div>
        <p className="text-xs text-slate-600 mb-4">
          All pending reports are strictly ranked by Java’s <code className="bg-white px-1.5 py-0.5 rounded border border-cyan-200 font-mono text-cyan-800">StandardRepairPriorityPolicy</code> using the following precedence hierarchy:
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-5 text-xs font-medium">
          <div className="rounded-xl border border-cyan-200/60 bg-white/80 p-3 shadow-xs">
            <span className="block font-bold text-cyan-700">1. Severity</span>
            <span className="text-slate-500">Highest severity damage (5 &rarr; 1) takes top priority.</span>
          </div>
          <div className="rounded-xl border border-cyan-200/60 bg-white/80 p-3 shadow-xs">
            <span className="block font-bold text-cyan-700">2. Accident Risk</span>
            <span className="text-slate-500">Breaks ties when severity is equal (5 &rarr; 1).</span>
          </div>
          <div className="rounded-xl border border-cyan-200/60 bg-white/80 p-3 shadow-xs">
            <span className="block font-bold text-cyan-700">3. Road Importance</span>
            <span className="text-slate-500">Major arteries prioritized over local roads.</span>
          </div>
          <div className="rounded-xl border border-cyan-200/60 bg-white/80 p-3 shadow-xs">
            <span className="block font-bold text-cyan-700">4. Traffic Rank</span>
            <span className="text-slate-500">Higher traffic density ranked ahead.</span>
          </div>
          <div className="rounded-xl border border-cyan-200/60 bg-white/80 p-3 shadow-xs">
            <span className="block font-bold text-cyan-700">5. Report Order</span>
            <span className="text-slate-500">FIFO order breaks any remaining full ties.</span>
          </div>
        </div>
      </div>

      {/* Priority Queue Ranking Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-800 text-sm">
            Pending Reports In Order of Repair Urgency ({reports.length})
          </h3>
          <span className="text-xs text-slate-500 font-mono">
            {reports.length > 0 ? `Next up: ${reports[0].reportId}` : 'Queue empty'}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 text-left text-sm">
            <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500">
              <tr>
                <th className="px-5 py-3.5">Priority Rank</th>
                <th className="px-5 py-3.5">Report ID</th>
                <th className="px-5 py-3.5">Location</th>
                <th className="px-5 py-3.5">Type</th>
                <th className="px-5 py-3.5">Severity</th>
                <th className="px-5 py-3.5">Accident Risk</th>
                <th className="px-5 py-3.5">Importance</th>
                <th className="px-5 py-3.5">Traffic</th>
                <th className="px-5 py-3.5">Report Order</th>
                <th className="px-5 py-3.5">Required Tools</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {reports.length > 0 ? (
                reports.map((report, idx) => {
                  const isTop = idx === 0
                  return (
                    <tr
                      key={report.reportId}
                      className={
                        isTop
                          ? 'bg-amber-50/60 font-medium hover:bg-amber-50'
                          : 'hover:bg-slate-50/70 transition-colors'
                      }
                    >
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex items-center justify-center rounded-full px-2.5 py-1 text-xs font-bold ${
                            isTop
                              ? 'bg-amber-500 text-white shadow-xs'
                              : idx < 3
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          #{idx + 1}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 font-mono font-bold text-slate-900">
                        {report.reportId}
                      </td>
                      <td className="px-5 py-3.5 text-slate-700 font-medium">
                        {report.location}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
                          {report.repairType}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="font-bold text-rose-600">
                          {report.severity}/5
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-slate-600">
                        {report.accidentRisk}/5
                      </td>
                      <td className="px-5 py-3.5 text-slate-600">
                        {report.roadImportance}/5
                      </td>
                      <td className="px-5 py-3.5 text-slate-600">
                        {report.trafficRank}/5
                      </td>
                      <td className="px-5 py-3.5 font-mono text-xs text-slate-500">
                        #{report.reportOrder}
                      </td>
                      <td className="px-5 py-3.5 text-xs text-slate-600 font-mono">
                        {report.repairType === 'RESURFACING'
                          ? 'ASPHALT_MIXER, ROLLER, BARRICADE'
                          : 'JACKHAMMER, MIXER, CONE'}
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={10} className="px-5 py-10 text-center text-slate-400">
                    <CheckCircle2 className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-600">No damage reports in priority queue</p>
                    <p className="text-xs text-slate-400 mt-1">
                      New damage reports will automatically be ranked by severity, accident risk, road importance, and traffic rank.
                    </p>
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
