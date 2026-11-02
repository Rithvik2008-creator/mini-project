import {
  CheckCircle2,
  HardHat,
  MapPin,
  Plus,
  RefreshCw,
  Route,
  Wrench,
  X,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { api, getErrorMessage } from '../api'
import { AlertBanner } from '../components/AlertBanner'
import { StatusBadge } from '../components/StatusBadge'
import type { EquipmentType, LocationItem, Team } from '../types'

const ALL_EQUIPMENT: EquipmentType[] = [
  'JACKHAMMER',
  'ASPHALT_MIXER',
  'ROAD_ROLLER',
  'SAFETY_BARRICADE',
  'EXCAVATOR',
  'TRAFFIC_CONE',
]

export function MaintenanceTeamsPage() {
  const [teams, setTeams] = useState<Team[]>([])
  const [locations, setLocations] = useState<LocationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [banner, setBanner] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)

  const [form, setForm] = useState({
    teamId: '',
    teamName: '',
    currentLocation: '',
    equipment: ['JACKHAMMER', 'ASPHALT_MIXER', 'TRAFFIC_CONE'] as EquipmentType[],
  })

  const fetchLocations = async () => {
    try {
      const res = await api.get<LocationItem[]>('/locations')
      setLocations(res.data)
      if (res.data.length > 0 && !form.currentLocation) {
        setForm((prev) => ({ ...prev, currentLocation: res.data[0].name }))
      }
    } catch (err) {
      console.error(err)
    }
  }

  const fetchTeams = async () => {
    try {
      setLoading(true)
      const res = await api.get<Team[]>('/teams')
      setTeams(res.data)
    } catch (err) {
      setBanner({ type: 'error', message: getErrorMessage(err) })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void fetchLocations()
    void fetchTeams()
  }, [])

  const handleEquipmentToggle = (item: EquipmentType) => {
    setForm((prev) => {
      const exists = prev.equipment.includes(item)
      return {
        ...prev,
        equipment: exists
          ? prev.equipment.filter((eq) => eq !== item)
          : [...prev.equipment, item],
      }
    })
  }

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.teamId.trim() || !form.teamName.trim()) {
      setBanner({ type: 'error', message: 'Team ID and Team Name are required.' })
      return
    }
    if (form.equipment.length === 0) {
      setBanner({ type: 'error', message: 'Please select at least one piece of equipment.' })
      return
    }

    try {
      setSubmitting(true)
      setBanner(null)
      const res = await api.post<Team>('/teams', form)
      setBanner({
        type: 'success',
        message: `Maintenance Team ${res.data.teamName} (${res.data.teamId}) added successfully at ${res.data.currentLocation}.`,
      })
      setShowAddModal(false)
      setForm({
        teamId: '',
        teamName: '',
        currentLocation: locations[0]?.name || '',
        equipment: ['JACKHAMMER', 'ASPHALT_MIXER', 'TRAFFIC_CONE'],
      })
      await fetchTeams()
    } catch (err) {
      setBanner({ type: 'error', message: getErrorMessage(err) })
    } finally {
      setSubmitting(false)
    }
  }

  const handleCompleteRepair = async (assignmentId: number) => {
    try {
      setBanner(null)
      const res = await api.post(`/assignments/${assignmentId}/complete`)
      setBanner({
        type: 'success',
        message: `Repair job ${res.data.reportId} completed! Team ${res.data.teamName} has been relocated to ${res.data.location} and released back to available status.`,
      })
      await fetchTeams()
    } catch (err) {
      setBanner({ type: 'error', message: getErrorMessage(err) })
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <HardHat className="h-6 w-6 text-blue-600" />
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              Maintenance Teams
            </h2>
          </div>
          <p className="text-sm text-slate-500">
            Workforce readiness, equipment loadout capabilities, and real-time repair assignments
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => void fetchTeams()}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => {
              const nextId = `TEAM-${teams.length + 1}`
              setForm((prev) => ({
                ...prev,
                teamId: nextId,
                currentLocation: locations[0]?.name || '',
              }))
              setShowAddModal(true)
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-500/20 transition hover:from-blue-500 hover:to-cyan-500"
          >
            <Plus className="h-4 w-4" />
            Add Maintenance Team
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

      {/* Teams Grid */}
      {teams.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
          <HardHat className="mx-auto h-12 w-12 text-slate-300 mb-3" />
          <h3 className="text-base font-bold text-slate-700">No maintenance teams available</h3>
          <p className="mt-1 text-sm text-slate-500 max-w-md mx-auto">
            No maintenance crews are currently registered in the database. Use the &quot;Add Maintenance Team&quot; button above to register a new maintenance unit.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {teams.map((team) => (
            <div
              key={team.teamId}
              className={`rounded-2xl border bg-white p-5 shadow-sm transition-all ${
                team.available ? 'border-slate-200' : 'border-blue-300 ring-1 ring-blue-100'
              }`}
            >
              {/* Team Header */}
              <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-400">
                      {team.teamId}
                    </span>
                    <h3 className="font-bold text-lg text-slate-900">
                      {team.teamName}
                    </h3>
                  </div>
                  <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                    <MapPin className="h-3.5 w-3.5 text-slate-400" />
                    <span>Stationed at: <strong>{team.currentLocation}</strong></span>
                  </div>
                </div>
                <StatusBadge status={team.available ? 'AVAILABLE' : 'BUSY / ON REPAIR'} />
              </div>

              {/* Equipment Loadout */}
              <div className="mt-4">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-2">
                  <Wrench className="h-3.5 w-3.5" />
                  Equipment & Tooling
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {team.equipment.map((eq) => (
                    <span
                      key={eq}
                      className="inline-flex items-center rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 font-mono"
                    >
                      {eq}
                    </span>
                  ))}
                </div>
              </div>

              {/* Linked Workers & Performance */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-600">
                <div>
                  <span className="font-semibold text-slate-500">Linked Crew: </span>
                  {team.assignedWorkers && team.assignedWorkers.length > 0 ? (
                    <span className="font-medium text-slate-800">{team.assignedWorkers.join(', ')}</span>
                  ) : (
                    <span className="italic text-slate-400">No workers registered</span>
                  )}
                </div>
                <div className="rounded-md bg-slate-100 px-2 py-0.5 font-semibold text-slate-700">
                  {team.completedJobsCount || 0} repairs completed
                </div>
              </div>

              {/* Current Assignment Details */}
              <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Active Mission
                  </span>
                  {team.available ? (
                    <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Standby (Ready)
                    </span>
                  ) : (
                    <span className="text-xs text-blue-600 font-medium flex items-center gap-1">
                      <Route className="h-3.5 w-3.5" /> Active Job #{team.currentAssignmentId}
                    </span>
                  )}
                </div>

                {team.available ? (
                  <p className="mt-2 text-xs text-slate-500">
                    Team is currently waiting for assignment. Ready to be dispatched to compatible road repairs.
                  </p>
                ) : (
                  <div className="mt-2 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Target Damage Report:</span>
                      <span className="font-mono font-bold text-slate-800">
                        {team.currentReportId}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Dijkstra Travel Time:</span>
                      <span className="font-semibold text-slate-800">
                        {team.currentTravelTime} minutes
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block mb-0.5">Calculated Route:</span>
                      <p className="font-mono text-[11px] text-slate-700 bg-white p-2 rounded border border-slate-200 break-words">
                        {team.currentRoute}
                      </p>
                    </div>
                    {team.currentAssignmentId && (
                      <button
                        onClick={() => void handleCompleteRepair(team.currentAssignmentId!)}
                        className="mt-2 w-full rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-500"
                      >
                        Complete Repair & Relocate Team
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ADD TEAM MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-lg text-slate-900">
                Register New Maintenance Team
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTeam} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Team ID *
                </label>
                <input
                  type="text"
                  required
                  value={form.teamId}
                  onChange={(e) => setForm({ ...form, teamId: e.target.value.toUpperCase() })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-mono uppercase focus:border-blue-500 focus:outline-none"
                  placeholder="TEAM-5"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Team Name *
                </label>
                <input
                  type="text"
                  required
                  value={form.teamName}
                  onChange={(e) => setForm({ ...form, teamName: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  placeholder="e.g. South Sector Pothole Unit"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Station Location *
                </label>
                {locations.length > 0 ? (
                  <select
                    required
                    value={form.currentLocation}
                    onChange={(e) => setForm({ ...form, currentLocation: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
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

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-2">
                  Select Equipment Loadout *
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {ALL_EQUIPMENT.map((eq) => {
                    const checked = form.equipment.includes(eq)
                    return (
                      <label
                        key={eq}
                        className={`flex items-center gap-2 rounded-xl border p-2.5 cursor-pointer transition ${
                          checked
                            ? 'border-blue-500 bg-blue-50/60 font-semibold text-blue-900'
                            : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => handleEquipmentToggle(eq)}
                          className="rounded text-blue-600"
                        />
                        <span className="font-mono text-[11px]">{eq}</span>
                      </label>
                    )
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || locations.length === 0}
                  className="rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 px-5 py-2 text-sm font-semibold text-white shadow-md hover:from-blue-500 hover:to-cyan-500 disabled:opacity-50"
                >
                  {submitting ? 'Adding...' : 'Add Team'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
