import {
  AlertTriangle,
  Eye,
  Filter,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { api, getErrorMessage } from '../api'
import { AlertBanner } from '../components/AlertBanner'
import { StatusBadge } from '../components/StatusBadge'
import type { DamageReport, LocationItem, RepairType, ReportStatus } from '../types'

export function DamageReportsPage() {
  const [reports, setReports] = useState<DamageReport[]>([])
  const [locations, setLocations] = useState<LocationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [banner, setBanner] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // Search and Filter States
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('ALL')
  const [filterType, setFilterType] = useState<string>('ALL')
  const [minSeverity, setMinSeverity] = useState<string>('ALL')

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedReport, setSelectedReport] = useState<DamageReport | null>(null)
  const [editingReport, setEditingReport] = useState<DamageReport | null>(null)

  // Create Form State
  const [createForm, setCreateForm] = useState({
    reportId: '',
    location: '',
    repairType: 'POTHOLE' as RepairType,
    severity: 4,
    accidentRisk: 3,
    trafficRank: 4,
    roadImportance: 5,
  })

  // Edit Form State
  const [editForm, setEditForm] = useState({
    location: '',
    repairType: 'POTHOLE',
    severity: 3,
    accidentRisk: 3,
    trafficRank: 3,
    roadImportance: 3,
    status: 'PENDING' as ReportStatus,
  })

  const [submitting, setSubmitting] = useState(false)

  const fetchLocations = async () => {
    try {
      const res = await api.get<LocationItem[]>('/locations')
      setLocations(res.data)
      if (res.data.length > 0 && !createForm.location) {
        setCreateForm((prev) => ({ ...prev, location: res.data[0].name }))
      }
    } catch (err) {
      console.error('Failed to load locations', err)
    }
  }

  const fetchReports = async () => {
    try {
      setLoading(true)
      const params: Record<string, string | number> = {}
      if (search.trim()) params.search = search.trim()
      if (filterStatus !== 'ALL') params.status = filterStatus
      if (filterType !== 'ALL') params.repairType = filterType
      if (minSeverity !== 'ALL') params.minSeverity = Number(minSeverity)

      const res = await api.get<DamageReport[]>('/reports', { params })
      setReports(res.data)
    } catch (err) {
      setBanner({ type: 'error', message: getErrorMessage(err) })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void fetchLocations()
  }, [])

  useEffect(() => {
    void fetchReports()
  }, [search, filterStatus, filterType, minSeverity])

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!createForm.reportId.trim()) {
      setBanner({ type: 'error', message: 'Report ID cannot be empty.' })
      return
    }
    if (!createForm.location) {
      setBanner({ type: 'error', message: 'Please select a valid road location.' })
      return
    }

    try {
      setSubmitting(true)
      setBanner(null)
      const res = await api.post<DamageReport>('/reports', createForm)
      setBanner({
        type: 'success',
        message: `Report ${res.data.reportId} at ${res.data.location} created successfully with status PENDING.`,
      })
      setShowCreateModal(false)
      setCreateForm({
        reportId: '',
        location: locations[0]?.name || '',
        repairType: 'POTHOLE',
        severity: 4,
        accidentRisk: 3,
        trafficRank: 4,
        roadImportance: 5,
      })
      await fetchReports()
    } catch (err) {
      setBanner({ type: 'error', message: getErrorMessage(err) })
    } finally {
      setSubmitting(false)
    }
  }

  const openEditModal = (report: DamageReport) => {
    setEditingReport(report)
    setEditForm({
      location: report.location,
      repairType: report.repairType,
      severity: report.severity,
      accidentRisk: report.accidentRisk,
      trafficRank: report.trafficRank,
      roadImportance: report.roadImportance,
      status: report.status,
    })
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingReport) return

    try {
      setSubmitting(true)
      setBanner(null)
      const res = await api.put<DamageReport>(`/reports/${editingReport.reportId}`, editForm)
      setBanner({
        type: 'success',
        message: `Report ${res.data.reportId} updated successfully.`,
      })
      setEditingReport(null)
      await fetchReports()
    } catch (err) {
      setBanner({ type: 'error', message: getErrorMessage(err) })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (reportId: string) => {
    if (!window.confirm(`Are you sure you want to delete report ${reportId}?`)) return
    try {
      setBanner(null)
      await api.delete(`/reports/${reportId}`)
      setBanner({ type: 'success', message: `Report ${reportId} deleted successfully.` })
      await fetchReports()
    } catch (err) {
      setBanner({ type: 'error', message: getErrorMessage(err) })
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Road Damage Reports
          </h2>
          <p className="text-sm text-slate-500">
            Log, inspect, filter, and maintain road infrastructure incident records
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => void fetchReports()}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => {
              const nextNum = Math.floor(1000 + Math.random() * 9000)
              setCreateForm((prev) => ({
                ...prev,
                reportId: `RPT-${nextNum}`,
                location: locations[0]?.name || '',
              }))
              setShowCreateModal(true)
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-cyan-500/20 transition hover:from-cyan-500 hover:to-blue-500"
          >
            <Plus className="h-4 w-4" />
            New Damage Report
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

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Report ID, Location, or Repair Type..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-4 text-sm text-slate-800 placeholder-slate-400 focus:border-cyan-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 focus:border-cyan-500 focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING">PENDING</option>
              <option value="ASSIGNED">ASSIGNED</option>
              <option value="COMPLETED">COMPLETED</option>
            </select>
          </div>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 focus:border-cyan-500 focus:outline-none"
          >
            <option value="ALL">All Repair Types</option>
            <option value="POTHOLE">POTHOLE</option>
            <option value="RESURFACING">RESURFACING</option>
          </select>

          <select
            value={minSeverity}
            onChange={(e) => setMinSeverity(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 focus:border-cyan-500 focus:outline-none"
          >
            <option value="ALL">All Severities</option>
            <option value="4">Severity &ge; 4</option>
            <option value="5">Severity 5 Only</option>
          </select>
        </div>
      </div>

      {/* Reports Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 text-left text-sm">
            <thead className="bg-slate-50/80 text-xs font-semibold uppercase text-slate-500">
              <tr>
                <th className="px-5 py-3.5">Report ID</th>
                <th className="px-5 py-3.5">Location</th>
                <th className="px-5 py-3.5">Repair Type</th>
                <th className="px-5 py-3.5">Severity</th>
                <th className="px-5 py-3.5">Accident Risk</th>
                <th className="px-5 py-3.5">Traffic</th>
                <th className="px-5 py-3.5">Importance</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {reports.length > 0 ? (
                reports.map((report) => (
                  <tr key={report.reportId} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-3.5 font-mono font-bold text-slate-900">
                      {report.reportId}
                    </td>
                    <td className="px-5 py-3.5 text-slate-700 font-medium">
                      {report.location}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
                        {report.repairType}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-bold ${
                        report.severity >= 4 ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {report.severity}/5
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-600">{report.accidentRisk}/5</td>
                    <td className="px-5 py-3.5 text-slate-600">{report.trafficRank}/5</td>
                    <td className="px-5 py-3.5 text-slate-600">{report.roadImportance}/5</td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={report.status} />
                    </td>
                    <td className="px-5 py-3.5 text-right space-x-1">
                      <button
                        onClick={() => setSelectedReport(report)}
                        title="View Details"
                        className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => openEditModal(report)}
                        title="Edit Report"
                        className="rounded-lg p-1.5 text-blue-600 hover:bg-blue-50"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      {report.status !== 'ASSIGNED' && (
                        <button
                          onClick={() => void handleDelete(report.reportId)}
                          title="Delete Report"
                          className="rounded-lg p-1.5 text-rose-600 hover:bg-rose-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="px-5 py-12 text-center text-slate-400">
                    <AlertTriangle className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-600">
                      {search.trim() || filterStatus !== 'ALL' || filterType !== 'ALL' || minSeverity !== 'ALL'
                        ? 'No damage reports matched the current filter criteria.'
                        : 'No damage reports found.'}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      {search.trim() || filterStatus !== 'ALL' || filterType !== 'ALL' || minSeverity !== 'ALL'
                        ? 'Try resetting the search or filter options.'
                        : 'Use the "New Damage Report" button above to log road damage incidents.'}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2 text-slate-900">
                <AlertTriangle className="h-5 w-5 text-cyan-600" />
                <h3 className="font-bold text-lg">Create Damage Report</h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Report ID *
                  </label>
                  <input
                    type="text"
                    required
                    value={createForm.reportId}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, reportId: e.target.value.toUpperCase() })
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-mono uppercase focus:border-cyan-500 focus:outline-none"
                    placeholder="RPT-1030"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Repair Type *
                  </label>
                  <select
                    value={createForm.repairType}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, repairType: e.target.value as RepairType })
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="POTHOLE">POTHOLE</option>
                    <option value="RESURFACING">RESURFACING</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Location *
                </label>
                {locations.length > 0 ? (
                  <select
                    required
                    value={createForm.location}
                    onChange={(e) => setCreateForm({ ...createForm, location: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-cyan-500 focus:outline-none"
                  >
                    {locations.map((loc) => (
                      <option key={loc.id} value={loc.name}>
                        {loc.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-2.5 text-xs text-amber-800">
                    No locations registered in the road network yet. Please add a location in the <strong>Road Network</strong> page first.
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3 space-y-3">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Priority Ranking Metrics (1 = Lowest, 5 = Highest)
                </p>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">
                      1. Severity: {createForm.severity}
                    </label>
                    <input
                      type="range"
                      min={1}
                      max={5}
                      value={createForm.severity}
                      onChange={(e) =>
                        setCreateForm({ ...createForm, severity: Number(e.target.value) })
                      }
                      className="w-full accent-cyan-600"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">
                      2. Accident Risk: {createForm.accidentRisk}
                    </label>
                    <input
                      type="range"
                      min={1}
                      max={5}
                      value={createForm.accidentRisk}
                      onChange={(e) =>
                        setCreateForm({ ...createForm, accidentRisk: Number(e.target.value) })
                      }
                      className="w-full accent-cyan-600"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">
                      3. Road Importance: {createForm.roadImportance}
                    </label>
                    <input
                      type="range"
                      min={1}
                      max={5}
                      value={createForm.roadImportance}
                      onChange={(e) =>
                        setCreateForm({ ...createForm, roadImportance: Number(e.target.value) })
                      }
                      className="w-full accent-cyan-600"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">
                      4. Traffic Rank: {createForm.trafficRank}
                    </label>
                    <input
                      type="range"
                      min={1}
                      max={5}
                      value={createForm.trafficRank}
                      onChange={(e) =>
                        setCreateForm({ ...createForm, trafficRank: Number(e.target.value) })
                      }
                      className="w-full accent-cyan-600"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || locations.length === 0}
                  className="rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-md transition hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Create Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW DETAILS MODAL */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-cyan-600">
                  Incident Details
                </span>
                <h3 className="font-bold text-xl text-slate-900">
                  {selectedReport.reportId}
                </h3>
              </div>
              <button
                onClick={() => setSelectedReport(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Location:</span>
                <span className="font-semibold text-slate-800">{selectedReport.location}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Repair Type:</span>
                <span className="font-semibold text-slate-800">{selectedReport.repairType}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Current Status:</span>
                <StatusBadge status={selectedReport.status} />
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Severity Rating:</span>
                <span className="font-bold text-rose-600">{selectedReport.severity} / 5</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Accident Risk:</span>
                <span className="font-semibold text-slate-700">{selectedReport.accidentRisk} / 5</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Road Importance:</span>
                <span className="font-semibold text-slate-700">{selectedReport.roadImportance} / 5</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Traffic Rank:</span>
                <span className="font-semibold text-slate-700">{selectedReport.trafficRank} / 5</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Report Order (Tie-breaker):</span>
                <span className="font-mono text-slate-700">#{selectedReport.reportOrder}</span>
              </div>

              <div className="mt-4 rounded-xl bg-slate-50 p-3">
                <p className="text-xs font-semibold text-slate-500 uppercase">
                  Required Equipment
                </p>
                <p className="mt-1 text-xs text-slate-700 font-medium">
                  {selectedReport.repairType === 'RESURFACING'
                    ? 'ASPHALT_MIXER, ROAD_ROLLER, SAFETY_BARRICADE'
                    : 'JACKHAMMER, ASPHALT_MIXER, TRAFFIC_CONE'}
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedReport(null)}
                className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editingReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
                  Edit Report
                </span>
                <h3 className="font-bold text-lg text-slate-900">
                  {editingReport.reportId}
                </h3>
              </div>
              <button
                onClick={() => setEditingReport(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="mt-4 space-y-4">
              {editingReport.status === 'COMPLETED' ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                  This report has been marked COMPLETED. Completed incident records are finalized and cannot be modified.
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        Location
                      </label>
                      <select
                        disabled={editingReport.status === 'ASSIGNED'}
                        value={editForm.location}
                        onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm disabled:bg-slate-100"
                      >
                        {locations.map((loc) => (
                          <option key={loc.id} value={loc.name}>
                            {loc.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        Repair Type
                      </label>
                      <select
                        disabled={editingReport.status === 'ASSIGNED'}
                        value={editForm.repairType}
                        onChange={(e) => setEditForm({ ...editForm, repairType: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm disabled:bg-slate-100"
                      >
                        <option value="POTHOLE">POTHOLE</option>
                        <option value="RESURFACING">RESURFACING</option>
                      </select>
                    </div>
                  </div>

                  {editingReport.status === 'ASSIGNED' && (
                    <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 p-2.5 rounded-lg">
                      Report is currently ASSIGNED to an active team. Damage severity specifications cannot be changed while repair work is in progress.
                    </p>
                  )}

                  <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3 space-y-3">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Severity & Traffic Ratings (1-5)
                    </p>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <label className="block font-semibold text-slate-600 mb-1">
                          Severity: {editForm.severity}
                        </label>
                        <input
                          type="range"
                          min={1}
                          max={5}
                          disabled={editingReport.status === 'ASSIGNED'}
                          value={editForm.severity}
                          onChange={(e) =>
                            setEditForm({ ...editForm, severity: Number(e.target.value) })
                          }
                          className="w-full accent-blue-600"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-600 mb-1">
                          Accident Risk: {editForm.accidentRisk}
                        </label>
                        <input
                          type="range"
                          min={1}
                          max={5}
                          disabled={editingReport.status === 'ASSIGNED'}
                          value={editForm.accidentRisk}
                          onChange={(e) =>
                            setEditForm({ ...editForm, accidentRisk: Number(e.target.value) })
                          }
                          className="w-full accent-blue-600"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-600 mb-1">
                          Road Importance: {editForm.roadImportance}
                        </label>
                        <input
                          type="range"
                          min={1}
                          max={5}
                          disabled={editingReport.status === 'ASSIGNED'}
                          value={editForm.roadImportance}
                          onChange={(e) =>
                            setEditForm({ ...editForm, roadImportance: Number(e.target.value) })
                          }
                          className="w-full accent-blue-600"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-600 mb-1">
                          Traffic Rank: {editForm.trafficRank}
                        </label>
                        <input
                          type="range"
                          min={1}
                          max={5}
                          disabled={editingReport.status === 'ASSIGNED'}
                          value={editForm.trafficRank}
                          onChange={(e) =>
                            setEditForm({ ...editForm, trafficRank: Number(e.target.value) })
                          }
                          className="w-full accent-blue-600"
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingReport(null)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                {editingReport.status !== 'COMPLETED' && (
                  <button
                    type="submit"
                    disabled={submitting}
                    className="rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-md hover:bg-blue-500 disabled:opacity-50"
                  >
                    {submitting ? 'Saving...' : 'Save Changes'}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
