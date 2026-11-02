import React, { useState, useEffect } from 'react'
import { api, getErrorMessage } from '../api'
import type { DamageReport, LocationItem } from '../types'
import { useAuth } from '../context/AuthContext'
import {
  AlertTriangle,
  Upload,
  CheckCircle2,
  Clock,
  MapPin,
  Calendar,
  Image as ImageIcon,
  FilePlus,
  Search,
  RefreshCw,
  X,
} from 'lucide-react'

export function PublicDashboardPage() {
  const { user } = useAuth()

  const [locations, setLocations] = useState<LocationItem[]>([])
  const [myReports, setMyReports] = useState<DamageReport[]>([])
  const [loadingReports, setLoadingReports] = useState(true)

  // Form state
  const [selectedLocation, setSelectedLocation] = useState('')
  const [customLocation, setCustomLocation] = useState('')
  const [repairType, setRepairType] = useState<'POTHOLE' | 'RESURFACING'>('POTHOLE')
  const [severity, setSeverity] = useState(3)
  const [description, setDescription] = useState('')
  const [imageBase64, setImageBase64] = useState<string | null>(null)
  const [previewImage, setPreviewImage] = useState<string | null>(null)

  const [submitting, setSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [filterQuery, setFilterQuery] = useState('')

  const fetchMyReports = async () => {
    try {
      setLoadingReports(true)
      const res = await api.get<DamageReport[]>('/reports/my-reports')
      setMyReports(res.data)
    } catch {
      // Ignored
    } finally {
      setLoadingReports(false)
    }
  }

  useEffect(() => {
    // Load locations
    api
      .get<LocationItem[]>('/network/locations')
      .then((res) => {
        setLocations(res.data)
        if (res.data.length > 0) {
          setSelectedLocation(res.data[0].name)
        }
      })
      .catch(() => {})

    fetchMyReports()
  }, [])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 2 * 1024 * 1024) {
      setSubmitError('Image size exceeds 2MB limit. Please choose a smaller file.')
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      setImageBase64(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitSuccess(null)
    setSubmitError(null)

    const finalLocation = selectedLocation === '__OTHER__' ? customLocation.trim() : selectedLocation
    if (!finalLocation) {
      setSubmitError('Please specify the road location of the damage.')
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        location: finalLocation,
        repairType,
        severity,
        accidentRisk: Math.min(5, severity),
        trafficRank: 3,
        roadImportance: 3,
        description: description.trim() || undefined,
        imageUrl: imageBase64 || undefined,
      }

      const res = await api.post<DamageReport>('/reports', payload)
      setSubmitSuccess(`Report #${res.data.reportId} successfully submitted! Municipal dispatch teams will inspect it.`)
      setDescription('')
      setImageBase64(null)
      setSeverity(3)
      fetchMyReports()
    } catch (err) {
      setSubmitError(getErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  const filteredReports = myReports.filter((r) => {
    const query = filterQuery.toLowerCase()
    return (
      r.reportId.toLowerCase().includes(query) ||
      r.location.toLowerCase().includes(query) ||
      (r.description && r.description.toLowerCase().includes(query)) ||
      r.status.toLowerCase().includes(query)
    )
  })

  return (
    <div className="space-y-8 p-6 lg:p-10 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-cyan-500/20 bg-gradient-to-r from-[#0d1d42] via-[#0f2452] to-[#0b1736] p-8 shadow-2xl">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-300">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Citizen Road Incident Portal</span>
          </div>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Welcome, {user?.fullName || 'Citizen'}
          </h1>
          <p className="mt-2 text-sm text-slate-300">
            Report potholes, road cracks, surface erosion, or roadway hazards directly to municipal maintenance dispatch. Track repair progress transparently in real-time.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Left Column: Damage Report Form */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-2xl border border-slate-800 bg-[#0c1633]/90 p-6 shadow-xl backdrop-blur-md sm:p-7">
            <div className="flex items-center gap-2.5 pb-4 border-b border-slate-800">
              <FilePlus className="h-5 w-5 text-cyan-400" />
              <h2 className="text-lg font-bold text-white">Report Road Damage</h2>
            </div>

            {submitSuccess && (
              <div className="mt-4 flex items-start gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs text-emerald-300">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                <span>{submitSuccess}</span>
              </div>
            )}

            {submitError && (
              <div className="mt-4 flex items-start gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs text-rose-300">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
                <span>{submitError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Road Location *
                </label>
                <select
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-900 py-2.5 px-3 text-sm text-white focus:border-cyan-500 focus:outline-none"
                >
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.name}>
                      {loc.name}
                    </option>
                  ))}
                  <option value="__OTHER__">Other / Unlisted Location...</option>
                </select>
              </div>

              {selectedLocation === '__OTHER__' && (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Specify Location Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={customLocation}
                    onChange={(e) => setCustomLocation(e.target.value)}
                    placeholder="Enter roadway or junction name"
                    className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-900 py-2.5 px-3 text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Damage Type *
                  </label>
                  <select
                    value={repairType}
                    onChange={(e) => setRepairType(e.target.value as any)}
                    className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-900 py-2.5 px-3 text-sm text-white focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="POTHOLE">Pothole Damage</option>
                    <option value="RESURFACING">Road Resurfacing</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Severity: {severity} / 5
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={severity}
                    onChange={(e) => setSeverity(Number(e.target.value))}
                    className="mt-3.5 w-full accent-cyan-400"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>1 (Minor)</span>
                    <span>5 (Critical)</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Incident Description
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe location details, depth, lane obstruction, or risks..."
                  className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-900 py-2.5 px-3 text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Damage Evidence Photo (Optional)
                </label>
                <div className="mt-1.5 flex items-center gap-3">
                  <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-slate-700 bg-slate-900/60 px-4 py-2 text-xs font-medium text-slate-300 hover:border-cyan-500 hover:text-white transition-all">
                    <Upload className="h-4 w-4 text-cyan-400" />
                    <span>Upload Image</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                  {imageBase64 && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-emerald-400 font-medium">Photo attached</span>
                      <button
                        type="button"
                        onClick={() => setImageBase64(null)}
                        className="text-xs text-rose-400 hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-500/25 transition-all hover:opacity-95 disabled:opacity-50"
              >
                {submitting ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <>
                    <FilePlus className="h-4 w-4" />
                    <span>Submit Damage Report</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: "My Submitted Reports" */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-white">My Submitted Reports</h2>
              <p className="text-xs text-slate-400">
                Live status tracking for reports filed from your citizen account
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={filterQuery}
                  onChange={(e) => setFilterQuery(e.target.value)}
                  placeholder="Search my reports..."
                  className="rounded-xl border border-slate-700 bg-slate-900 py-1.5 pl-8 pr-3 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                />
              </div>
              <button
                onClick={fetchMyReports}
                className="rounded-xl border border-slate-700 bg-slate-900 p-2 text-slate-400 hover:text-white transition-colors"
                title="Refresh reports"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loadingReports ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {loadingReports ? (
            <div className="flex h-64 items-center justify-center rounded-2xl border border-slate-800 bg-[#0c1633]/60">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-800 bg-[#0c1633]/60 p-12 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-800/80 text-slate-500">
                <AlertTriangle className="h-7 w-7" />
              </div>
              <h3 className="mt-4 text-base font-semibold text-slate-300">
                No submitted damage reports found
              </h3>
              <p className="mt-1 max-w-sm text-xs text-slate-500">
                You have not filed any roadway damage reports yet. Use the form on the left to submit a report if you spot roadway hazards!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredReports.map((report) => {
                const isPending = report.status === 'PENDING'
                const isAssigned = report.status === 'ASSIGNED'
                const isCompleted = report.status === 'COMPLETED'

                return (
                  <div
                    key={report.reportId}
                    className="overflow-hidden rounded-2xl border border-slate-800 bg-[#0c1633]/80 p-5 shadow-lg transition-all hover:border-slate-700"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-cyan-400">
                            {report.reportId}
                          </span>
                          <span className="rounded-md bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-slate-300 uppercase">
                            {report.repairType}
                          </span>
                        </div>
                        <h4 className="mt-1 text-base font-semibold text-white flex items-center gap-1.5">
                          <MapPin className="h-4 w-4 text-cyan-400 shrink-0" />
                          <span>{report.location}</span>
                        </h4>
                      </div>

                      {/* Status Badge */}
                      <div>
                        {isPending && (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/15 px-3 py-1 text-xs font-semibold text-amber-300">
                            <Clock className="h-3.5 w-3.5" />
                            <span>PENDING DISPATCH</span>
                          </span>
                        )}
                        {isAssigned && (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-500/30 bg-blue-500/15 px-3 py-1 text-xs font-semibold text-blue-300">
                            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                            <span>CREW EN ROUTE / WORKING</span>
                          </span>
                        )}
                        {isCompleted && (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-300">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            <span>COMPLETED & RESOLVED</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {report.description && (
                      <p className="mt-3 text-xs text-slate-300 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                        {report.description}
                      </p>
                    )}

                    <div className="mt-4 flex flex-wrap items-center justify-between border-t border-slate-800/80 pt-3 text-[11px] text-slate-400">
                      <div className="flex items-center gap-4">
                        <span>
                          Severity:{' '}
                          <span className="font-semibold text-amber-400">
                            {report.severity}/5
                          </span>
                        </span>
                        {report.submittedAt && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3 text-slate-500" />
                            <span>{new Date(report.submittedAt).toLocaleDateString()}</span>
                          </span>
                        )}
                      </div>

                      {report.imageUrl && (
                        <button
                          type="button"
                          onClick={() => setPreviewImage(report.imageUrl!)}
                          className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 font-medium"
                        >
                          <ImageIcon className="h-3.5 w-3.5" />
                          <span>View Photo</span>
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Image Preview Modal */}
      {previewImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="relative max-h-[90vh] max-w-2xl overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl">
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute right-3 top-3 rounded-full bg-slate-800/80 p-1.5 text-slate-300 hover:bg-slate-700 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
            <img
              src={previewImage}
              alt="Damage Report Evidence"
              className="max-h-[80vh] w-full object-contain p-2"
            />
          </div>
        </div>
      )}
    </div>
  )
}
