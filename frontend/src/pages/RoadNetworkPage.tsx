import {
  GitFork,
  MapPin,
  Plus,
  RefreshCw,
  ToggleLeft,
  ToggleRight,
  X,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { api, getErrorMessage } from '../api'
import { AlertBanner } from '../components/AlertBanner'
import { StatusBadge } from '../components/StatusBadge'
import type { LocationItem, RoadItem } from '../types'

export function RoadNetworkPage() {
  const [locations, setLocations] = useState<LocationItem[]>([])
  const [roads, setRoads] = useState<RoadItem[]>([])
  const [loading, setLoading] = useState(true)
  const [banner, setBanner] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // Forms & Modals
  const [showAddLocationModal, setShowAddLocationModal] = useState(false)
  const [showAddRoadModal, setShowAddRoadModal] = useState(false)
  const [newLocationName, setNewLocationName] = useState('')
  const [newRoadForm, setNewRoadForm] = useState({
    source: '',
    destination: '',
    travelTime: 10,
  })
  const [submitting, setSubmitting] = useState(false)
  const [filterClosedOnly, setFilterClosedOnly] = useState(false)

  const fetchData = async () => {
    try {
      setLoading(true)
      const [locRes, roadRes] = await Promise.all([
        api.get<LocationItem[]>('/locations'),
        api.get<RoadItem[]>('/roads'),
      ])
      setLocations(locRes.data)
      setRoads(roadRes.data)
      if (locRes.data.length >= 2 && !newRoadForm.source) {
        setNewRoadForm({
          source: locRes.data[0].name,
          destination: locRes.data[1].name,
          travelTime: 10,
        })
      }
    } catch (err) {
      setBanner({ type: 'error', message: getErrorMessage(err) })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void fetchData()
  }, [])

  const handleAddLocation = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newLocationName.trim()) return

    try {
      setSubmitting(true)
      setBanner(null)
      const res = await api.post('/locations', { name: newLocationName.trim() })
      setBanner({
        type: 'success',
        message: `Location "${res.data.name}" added to municipal road network.`,
      })
      setNewLocationName('')
      setShowAddLocationModal(false)
      await fetchData()
    } catch (err) {
      setBanner({ type: 'error', message: getErrorMessage(err) })
    } finally {
      setSubmitting(false)
    }
  }

  const handleAddRoad = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newRoadForm.source || !newRoadForm.destination) {
      setBanner({ type: 'error', message: 'Both road endpoints are required.' })
      return
    }
    if (newRoadForm.source.toLowerCase() === newRoadForm.destination.toLowerCase()) {
      setBanner({ type: 'error', message: 'Road endpoints cannot be the same location.' })
      return
    }

    try {
      setSubmitting(true)
      setBanner(null)
      const res = await api.post('/roads', newRoadForm)
      setBanner({
        type: 'success',
        message: `Road between ${res.data.source} and ${res.data.destination} (${res.data.travelTime} mins) created.`,
      })
      setShowAddRoadModal(false)
      await fetchData()
    } catch (err) {
      setBanner({ type: 'error', message: getErrorMessage(err) })
    } finally {
      setSubmitting(false)
    }
  }

  const handleToggleRoad = async (road: RoadItem) => {
    try {
      setBanner(null)
      if (road.closed) {
        await api.patch(`/roads/${road.id}/open`)
        setBanner({
          type: 'success',
          message: `Road opened: ${road.source} <-> ${road.destination}. Now accessible by Dijkstra routing.`,
        })
      } else {
        await api.patch(`/roads/${road.id}/close`)
        setBanner({
          type: 'success',
          message: `Road closed: ${road.source} <-> ${road.destination}. Now excluded from Dijkstra shortest routes.`,
        })
      }
      await fetchData()
    } catch (err) {
      setBanner({ type: 'error', message: getErrorMessage(err) })
    }
  }

  const displayedRoads = filterClosedOnly ? roads.filter((r) => r.closed) : roads

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <GitFork className="h-6 w-6 text-blue-600" />
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              Road Network & Connectivity
            </h2>
          </div>
          <p className="text-sm text-slate-500">
            Manage municipal network nodes, connected segments, and dynamic road closure statuses
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => void fetchData()}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => setShowAddLocationModal(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <MapPin className="h-4 w-4 text-cyan-600" />
            Add Location
          </button>
          <button
            onClick={() => setShowAddRoadModal(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-500/20 transition hover:from-blue-500 hover:to-cyan-500"
          >
            <Plus className="h-4 w-4" />
            Add Road Connection
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

      {/* Locations Badge Ribbon */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
            <MapPin className="h-4 w-4 text-cyan-600" />
            Registered Municipal Locations in City Network ({locations.length})
          </h3>
          <span className="text-xs text-slate-400">Network Vertices</span>
        </div>
        {locations.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {locations.map((loc) => (
              <span
                key={loc.id}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-xs"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-500" />
                {loc.name}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400 py-1">
            No municipal locations registered yet. Click &quot;Add Location&quot; above to create network nodes.
          </p>
        )}
      </div>

      {/* Roads Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-bold text-sm text-slate-800">
              Road Connections & Current Travel Times ({roads.length})
            </h3>
            <p className="text-xs text-slate-500">
              Closed roads are immediately bypassed by the shortest-route Dijkstra algorithm
            </p>
          </div>
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 cursor-pointer">
            <input
              type="checkbox"
              checked={filterClosedOnly}
              onChange={(e) => setFilterClosedOnly(e.target.checked)}
              className="rounded text-rose-600"
            />
            Show Closed Roads Only ({roads.filter((r) => r.closed).length})
          </label>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 text-left text-sm">
            <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500">
              <tr>
                <th className="px-5 py-3.5">Road ID</th>
                <th className="px-5 py-3.5">Endpoint A</th>
                <th className="px-5 py-3.5">Endpoint B</th>
                <th className="px-5 py-3.5">Travel Time</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Road Closure Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayedRoads.length > 0 ? (
                displayedRoads.map((road) => (
                  <tr
                    key={road.id}
                    className={`transition-colors ${
                      road.closed ? 'bg-rose-50/40 hover:bg-rose-50/70' : 'hover:bg-slate-50/70'
                    }`}
                  >
                    <td className="px-5 py-3.5 font-mono text-xs text-slate-500">
                      #{road.id}
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-slate-800">
                      {road.source}
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-slate-800">
                      {road.destination}
                    </td>
                    <td className="px-5 py-3.5 text-slate-700">
                      <span className="font-bold text-cyan-800">{road.travelTime}</span> minutes
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={road.closed ? 'CLOSED' : 'OPEN'} />
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => void handleToggleRoad(road)}
                        className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition shadow-xs ${
                          road.closed
                            ? 'bg-emerald-600 text-white hover:bg-emerald-500'
                            : 'bg-rose-600 text-white hover:bg-rose-500'
                        }`}
                      >
                        {road.closed ? (
                          <>
                            <ToggleRight className="h-4 w-4" />
                            Open Road
                          </>
                        ) : (
                          <>
                            <ToggleLeft className="h-4 w-4" />
                            Close Road
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-slate-400">
                    {filterClosedOnly
                      ? 'No closed road segments found.'
                      : 'No road connections created yet. Click "Add Road Connection" above to link locations.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD LOCATION MODAL */}
      {showAddLocationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-lg text-slate-900">Add New Location</h3>
              <button
                onClick={() => setShowAddLocationModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddLocation} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Location Name *
                </label>
                <input
                  type="text"
                  required
                  value={newLocationName}
                  onChange={(e) => setNewLocationName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-cyan-500 focus:outline-none"
                  placeholder="e.g. Kamarajar High Road"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddLocationModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-cyan-600 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-500 disabled:opacity-50"
                >
                  {submitting ? 'Adding...' : 'Add Location'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD ROAD MODAL */}
      {showAddRoadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-lg text-slate-900">Add Road Connection</h3>
              <button
                onClick={() => setShowAddRoadModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {locations.length < 2 ? (
              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800 space-y-3">
                <p className="font-semibold">At least two municipal locations are required.</p>
                <p>
                  You must add at least two different locations in the network before connecting them with a road segment.
                </p>
                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddRoadModal(false)
                      setShowAddLocationModal(true)
                    }}
                    className="rounded-xl bg-cyan-600 px-4 py-2 font-bold text-white shadow-xs hover:bg-cyan-500"
                  >
                    Add Location First
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleAddRoad} className="mt-4 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      First Location *
                    </label>
                    <select
                      required
                      value={newRoadForm.source}
                      onChange={(e) => setNewRoadForm({ ...newRoadForm, source: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none"
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
                      Second Location *
                    </label>
                    <select
                      required
                      value={newRoadForm.destination}
                      onChange={(e) =>
                        setNewRoadForm({ ...newRoadForm, destination: e.target.value })
                      }
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none"
                    >
                      {locations.map((loc) => (
                        <option key={loc.id} value={loc.name}>
                          {loc.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Travel Time (minutes) *
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={240}
                    required
                    value={newRoadForm.travelTime}
                    onChange={(e) =>
                      setNewRoadForm({ ...newRoadForm, travelTime: Number(e.target.value) })
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddRoadModal(false)}
                    className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 px-4 py-2 text-sm font-semibold text-white shadow-md hover:from-blue-500 hover:to-cyan-500 disabled:opacity-50"
                  >
                    {submitting ? 'Connecting...' : 'Connect Road'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
