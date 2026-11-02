import React, { useState, useEffect } from 'react'
import { api, getErrorMessage } from '../api'
import type { Assignment, Team } from '../types'
import {
  Archive,
  Search,
  CheckCircle2,
  Calendar,
  Clock,
  HardHat,
  MapPin,
  Image as ImageIcon,
  RefreshCw,
  X,
  User,
  Filter,
} from 'lucide-react'

export function CompletedArchivePage() {
  const [completedList, setCompletedList] = useState<Assignment[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTeam, setSelectedTeam] = useState('')
  const [previewImage, setPreviewImage] = useState<{ url: string; title: string } | null>(null)

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      const params: any = {}
      if (searchQuery.trim()) params.search = searchQuery.trim()
      if (selectedTeam) params.teamId = selectedTeam

      const [archiveRes, teamsRes] = await Promise.all([
        api.get<Assignment[]>('/assignments/archive', { params }),
        api.get<Team[]>('/teams'),
      ])

      setCompletedList(archiveRes.data)
      setTeams(teamsRes.data)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [selectedTeam])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    loadData()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-purple-50 px-3 py-1 text-xs font-semibold text-purple-700 border border-purple-200">
            <Archive className="h-3.5 w-3.5" />
            <span>Audit & Resolution Archive</span>
          </div>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
            Completed Assignments Archive
          </h2>
          <p className="text-sm text-slate-500">
            Historical audit log of all completed road repairs, technician notes, and photographic evidence
          </p>
        </div>

        <button
          onClick={loadData}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Archive</span>
        </button>
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800">
          {error}
        </div>
      )}

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <form onSubmit={handleSearchSubmit} className="flex flex-1 items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by report ID, location, or notes..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-10 pr-4 text-xs font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:border-blue-500 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            className="rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:from-blue-500 hover:to-cyan-500"
          >
            Filter
          </button>
        </form>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-400" />
          <select
            value={selectedTeam}
            onChange={(e) => setSelectedTeam(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-xs font-medium text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none"
          >
            <option value="">All Maintenance Teams</option>
            {teams.map((t) => (
              <option key={t.teamId} value={t.teamId}>
                {t.teamId} - {t.teamName}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Archive Cards */}
      {loading ? (
        <div className="flex h-64 items-center justify-center rounded-2xl border border-slate-200 bg-white">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
        </div>
      ) : completedList.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-12 text-center">
          <Archive className="h-10 w-10 text-slate-300 mb-3" />
          <h3 className="text-base font-semibold text-slate-800">No Completed Records Found</h3>
          <p className="mt-1 text-xs text-slate-500">
            No repair records match your filter criteria. Completed assignments will appear here once signed off by field teams.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {completedList.map((job) => (
            <div
              key={job.id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md">
                      {job.reportId}
                    </span>
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700 uppercase">
                      {job.repairType}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-700">
                      <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                      <span>RESOLVED</span>
                    </span>
                  </div>

                  <h3 className="mt-2 text-base font-bold text-slate-900 flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-slate-400 shrink-0" />
                    <span>{job.location}</span>
                  </h3>
                </div>

                <div className="text-right text-xs">
                  <span className="font-semibold text-slate-800 flex items-center justify-end gap-1">
                    <HardHat className="h-3.5 w-3.5 text-amber-500" />
                    <span>{job.teamName} ({job.teamId})</span>
                  </span>
                  {job.completedByUsername && (
                    <span className="text-[11px] text-slate-500 mt-0.5 block flex items-center justify-end gap-1">
                      <User className="h-3 w-3 text-slate-400" />
                      <span>Technician: @{job.completedByUsername}</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Completion Notes */}
              {job.completionNotes && (
                <div className="mt-3 rounded-xl border border-emerald-100 bg-emerald-50/70 p-3 text-xs text-emerald-950">
                  <span className="font-semibold text-emerald-800">Technician Resolution Notes:</span>{' '}
                  {job.completionNotes}
                </div>
              )}

              {/* Timestamps & Photos */}
              <div className="mt-4 flex flex-wrap items-center justify-between border-t border-slate-100 pt-3 text-[11px] text-slate-500">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3 text-slate-400" />
                    <span>Started: {new Date(job.startedAt).toLocaleString()}</span>
                  </span>
                  {job.completedAt && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-slate-400" />
                      <span>Completed: {new Date(job.completedAt).toLocaleString()}</span>
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  {job.imageUrl && (
                    <button
                      onClick={() => setPreviewImage({ url: job.imageUrl!, title: `Damage Evidence: ${job.reportId}` })}
                      className="text-xs text-blue-600 hover:underline flex items-center gap-1 font-medium"
                    >
                      <ImageIcon className="h-3.5 w-3.5" />
                      <span>Initial Photo</span>
                    </button>
                  )}
                  {job.completionImageUrl && (
                    <button
                      onClick={() => setPreviewImage({ url: job.completionImageUrl!, title: `After-Repair Proof: ${job.reportId}` })}
                      className="text-xs text-emerald-600 hover:underline flex items-center gap-1 font-semibold"
                    >
                      <ImageIcon className="h-3.5 w-3.5" />
                      <span>After-Repair Proof</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Photo Modal */}
      {previewImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="relative max-h-[90vh] max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between p-3 border-b border-slate-100 bg-slate-50">
              <span className="text-xs font-bold text-slate-800">{previewImage.title}</span>
              <button
                onClick={() => setPreviewImage(null)}
                className="rounded-full bg-slate-200 p-1 text-slate-600 hover:bg-slate-300"
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
