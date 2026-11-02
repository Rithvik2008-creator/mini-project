import React, { useState, useEffect } from 'react'
import { api, getErrorMessage } from '../api'
import type { Assignment } from '../types'
import { useAuth } from '../context/AuthContext'
import {
  HardHat,
  CheckCircle2,
  Clock,
  MapPin,
  Navigation,
  AlertTriangle,
  Upload,
  RefreshCw,
  Image as ImageIcon,
  CheckSquare,
  X,
  Search,
} from 'lucide-react'

export function WorkerDashboardPage() {
  const { user } = useAuth()

  const [activeAssignments, setActiveAssignments] = useState<Assignment[]>([])
  const [completedHistory, setCompletedHistory] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // Completion Modal State
  const [selectedJob, setSelectedJob] = useState<Assignment | null>(null)
  const [completionNotes, setCompletionNotes] = useState('')
  const [afterRepairImage, setAfterRepairImage] = useState<string | null>(null)
  const [completing, setCompleting] = useState(false)
  const [completionError, setCompletionError] = useState<string | null>(null)

  // Preview Image Modal
  const [previewImage, setPreviewImage] = useState<{ url: string; title: string } | null>(null)
  const [searchHistory, setSearchHistory] = useState('')

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)

      const [activeRes, historyRes] = await Promise.all([
        api.get<Assignment[]>('/worker/assignments'),
        api.get<Assignment[]>('/worker/history'),
      ])

      setActiveAssignments(activeRes.data)
      setCompletedHistory(historyRes.data)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleAfterImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 2 * 1024 * 1024) {
      setCompletionError('Image size exceeds 2MB limit.')
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      setAfterRepairImage(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleCompleteJob = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedJob) return

    setCompletionError(null)
    setCompleting(true)

    try {
      await api.post(`/worker/assignments/${selectedJob.id}/complete`, {
        completionNotes: completionNotes.trim() || undefined,
        completionImageUrl: afterRepairImage || undefined,
      })

      setSuccessMsg(`Repair job #${selectedJob.reportId} successfully marked COMPLETED! Team released.`)
      setSelectedJob(null)
      setCompletionNotes('')
      setAfterRepairImage(null)
      await loadData()
    } catch (err) {
      setCompletionError(getErrorMessage(err))
    } finally {
      setCompleting(false)
    }
  }

  const filteredHistory = completedHistory.filter((item) => {
    const q = searchHistory.toLowerCase()
    return (
      item.reportId.toLowerCase().includes(q) ||
      item.location.toLowerCase().includes(q) ||
      (item.completionNotes && item.completionNotes.toLowerCase().includes(q)) ||
      (item.completedByUsername && item.completedByUsername.toLowerCase().includes(q))
    )
  })

  return (
    <div className="space-y-8 p-6 lg:p-10 max-w-7xl mx-auto">
      {/* Worker Header Card */}
      <div className="relative overflow-hidden rounded-3xl border border-amber-500/20 bg-gradient-to-r from-[#171c26] via-[#1c2230] to-[#0f141f] p-8 shadow-2xl">
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-300">
              <HardHat className="h-3.5 w-3.5" />
              <span>Field Maintenance Operations</span>
            </div>
            <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Worker Console: {user?.fullName || 'Technician'}
            </h1>
            <p className="mt-1 text-sm text-slate-300">
              Assigned Team:{' '}
              <span className="font-mono font-bold text-amber-400">
                {user?.teamId || 'UNASSIGNED'}
              </span>{' '}
              • Manage live dispatches and record post-repair completion reports
            </p>
          </div>

          <button
            onClick={loadData}
            className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition-all shadow-md"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Sync Live Jobs</span>
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="flex items-start justify-between gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-300">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-400 hover:text-emerald-200">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-3 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-300">
          <AlertTriangle className="h-5 w-5 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Active Assignment Section */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-amber-400" />
            <h2 className="text-xl font-bold text-white">Current Active Assignments</h2>
          </div>
          <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-300">
            {activeAssignments.length} In-Progress
          </span>
        </div>

        {activeAssignments.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-800 bg-[#0c1633]/60 p-10 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <h3 className="mt-4 text-base font-semibold text-slate-200">
              No Active Work Assignments
            </h3>
            <p className="mt-1 max-w-sm text-xs text-slate-400">
              Team <span className="font-mono text-amber-400 font-semibold">{user?.teamId}</span> is currently idle and on standby. New emergency dispatches will appear here immediately.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {activeAssignments.map((job) => (
              <div
                key={job.id}
                className="overflow-hidden rounded-2xl border-2 border-amber-500/40 bg-gradient-to-b from-[#131b33] to-[#0c1224] p-6 shadow-xl"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-amber-400 bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 rounded-md">
                        {job.reportId}
                      </span>
                      <span className="rounded-md bg-slate-800 px-2 py-0.5 text-xs font-semibold text-slate-300">
                        {job.repairType}
                      </span>
                    </div>
                    <h3 className="mt-2 text-xl font-bold text-white flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-amber-400" />
                      <span>{job.location}</span>
                    </h3>
                  </div>

                  {/* Mark as Completed Button */}
                  <button
                    onClick={() => {
                      setSelectedJob(job)
                      setCompletionNotes('')
                      setAfterRepairImage(null)
                      setCompletionError(null)
                    }}
                    className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-500/25 hover:from-emerald-400 hover:to-teal-500 transition-all"
                  >
                    <CheckSquare className="h-4.5 w-4.5" />
                    <span>Mark as Completed</span>
                  </button>
                </div>

                {/* Job Route & Dijkstra Details */}
                <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 rounded-xl border border-slate-800 bg-slate-900/60 p-4">
                  <div>
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <Navigation className="h-3.5 w-3.5 text-cyan-400" />
                      Dijkstra Calculated Route
                    </span>
                    <p className="mt-1 font-mono text-xs text-cyan-300">
                      {job.route}
                    </p>
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-amber-400" />
                      Estimated Travel Time
                    </span>
                    <p className="mt-1 text-sm font-semibold text-white">
                      {job.travelTime} minutes travel
                    </p>
                  </div>
                </div>

                {job.description && (
                  <div className="mt-3 rounded-xl border border-slate-800 bg-slate-900/40 p-3 text-xs text-slate-300">
                    <span className="font-semibold text-slate-400">Citizen Report Details:</span>{' '}
                    {job.description}
                  </div>
                )}

                {job.imageUrl && (
                  <div className="mt-3 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setPreviewImage({ url: job.imageUrl!, title: `Damage Evidence: ${job.reportId}` })}
                      className="flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 font-medium"
                    >
                      <ImageIcon className="h-4 w-4" />
                      <span>Inspect Citizen Damage Photo</span>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Completed Work History Section */}
      <div className="space-y-4 pt-4 border-t border-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
              <span>Team Work History ({user?.teamId})</span>
            </h2>
            <p className="text-xs text-slate-400">
              Archive of all repairs and roadway maintenance completed by this team
            </p>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchHistory}
              onChange={(e) => setSearchHistory(e.target.value)}
              placeholder="Search history records..."
              className="rounded-xl border border-slate-700 bg-slate-900 py-1.5 pl-8 pr-3 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
            />
          </div>
        </div>

        {filteredHistory.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-[#0c1633]/60 p-8 text-center text-xs text-slate-500">
            No completed repair records match your filter.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-[#0c1633]/90 shadow-xl">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 bg-slate-900/80 text-[11px] font-semibold uppercase text-slate-400">
                <tr>
                  <th className="px-4 py-3">Report ID</th>
                  <th className="px-4 py-3">Location</th>
                  <th className="px-4 py-3">Repair Type</th>
                  <th className="px-4 py-3">Completion Details</th>
                  <th className="px-4 py-3">Completed By</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3 text-right">Photo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-slate-300">
                {filteredHistory.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-cyan-400">
                      {item.reportId}
                    </td>
                    <td className="px-4 py-3 font-semibold text-white">
                      {item.location}
                    </td>
                    <td className="px-4 py-3 uppercase">{item.repairType}</td>
                    <td className="px-4 py-3 max-w-xs truncate text-slate-400">
                      {item.completionNotes || '—'}
                    </td>
                    <td className="px-4 py-3">
                      {item.completedByUsername ? `@${item.completedByUsername}` : 'Crew'}
                    </td>
                    <td className="px-4 py-3 text-slate-400">
                      {item.completedAt ? new Date(item.completedAt).toLocaleString() : '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {item.completionImageUrl ? (
                        <button
                          onClick={() => setPreviewImage({ url: item.completionImageUrl!, title: `After Repair: ${item.reportId}` })}
                          className="text-xs text-cyan-400 hover:underline"
                        >
                          View Evidence
                        </button>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Completion Modal */}
      {selectedJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <CheckSquare className="h-5 w-5 text-emerald-400" />
                <h3 className="text-lg font-bold text-white">Complete Repair Assignment</h3>
              </div>
              <button
                onClick={() => setSelectedJob(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-300">
              <span className="font-bold">Confirmation Warning:</span> Marking this assignment complete will update the report status to <span className="font-semibold text-emerald-300">COMPLETED</span>, release <span className="font-mono font-bold">{selectedJob.teamName}</span> back to <span className="font-semibold text-cyan-300">AVAILABLE</span>, and update its current station location to <span className="font-semibold text-white">{selectedJob.location}</span>.
            </div>

            {completionError && (
              <div className="mt-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
                {completionError}
              </div>
            )}

            <form onSubmit={handleCompleteJob} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Completion Notes *
                </label>
                <textarea
                  required
                  rows={3}
                  value={completionNotes}
                  onChange={(e) => setCompletionNotes(e.target.value)}
                  placeholder="Detail actions taken, materials applied, quality inspection notes..."
                  className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-800 py-2 px-3 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                  After-Repair Proof Photo (Optional)
                </label>
                <div className="mt-1.5 flex items-center gap-3">
                  <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-slate-700 bg-slate-800/80 px-4 py-2 text-xs font-medium text-slate-300 hover:border-emerald-500 hover:text-white transition-all">
                    <Upload className="h-4 w-4 text-emerald-400" />
                    <span>Upload Proof Photo</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAfterImageUpload}
                      className="hidden"
                    />
                  </label>
                  {afterRepairImage && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-emerald-400 font-medium">Proof photo selected</span>
                      <button
                        type="button"
                        onClick={() => setAfterRepairImage(null)}
                        className="text-xs text-rose-400 hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedJob(null)}
                  className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={completing}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-5 py-2 text-xs font-semibold text-white shadow-md shadow-emerald-500/25 hover:from-emerald-400 hover:to-teal-500 disabled:opacity-50"
                >
                  {completing ? (
                    <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Confirm & Complete</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Image Preview Modal */}
      {previewImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="relative max-h-[90vh] max-w-2xl overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl">
            <div className="flex items-center justify-between p-3 border-b border-slate-800">
              <span className="text-xs font-bold text-white">{previewImage.title}</span>
              <button
                onClick={() => setPreviewImage(null)}
                className="rounded-full bg-slate-800 p-1 text-slate-300 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <img
              src={previewImage.url}
              alt={previewImage.title}
              className="max-h-[80vh] w-full object-contain p-2"
            />
          </div>
        </div>
      )}
    </div>
  )
}
