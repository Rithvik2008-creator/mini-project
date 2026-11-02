import {
  AlertTriangle,
  ArrowRight,
  ArrowRightLeft,
  Clock,
  Compass,
  MapPin,
  Navigation,
  RefreshCw,
  Route as RouteIcon,
  XCircle,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { api, getErrorMessage } from '../api'
import { AlertBanner } from '../components/AlertBanner'
import { StatusBadge } from '../components/StatusBadge'
import type { LocationItem, RoadItem, RouteResult } from '../types'

export function RouteFinderPage() {
  const [locations, setLocations] = useState<LocationItem[]>([])
  const [closedRoads, setClosedRoads] = useState<RoadItem[]>([])
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [result, setResult] = useState<RouteResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [banner, setBanner] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const fetchLocationsAndRoads = async () => {
    try {
      const [locRes, roadRes] = await Promise.all([
        api.get<LocationItem[]>('/locations'),
        api.get<RoadItem[]>('/roads'),
      ])
      setLocations(locRes.data)
      setClosedRoads(roadRes.data.filter((r) => r.closed))
      if (locRes.data.length >= 2) {
        if (!from) setFrom(locRes.data[0].name)
        if (!to) setTo(locRes.data[6]?.name || locRes.data[1].name)
      }
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    void fetchLocationsAndRoads()
  }, [])

  const handleCalculateRoute = async () => {
    if (!from || !to) {
      setBanner({ type: 'error', message: 'Please select both source and destination locations.' })
      return
    }
    if (from.toLowerCase() === to.toLowerCase()) {
      setResult({
        from,
        to,
        path: [from],
        travelTime: 0,
        reachable: true,
      })
      return
    }

    try {
      setLoading(true)
      setBanner(null)
      const res = await api.get<RouteResult>('/routes', {
        params: { from: from.trim(), to: to.trim() },
      })
      setResult(res.data)
      if (!res.data.reachable) {
        setBanner({
          type: 'error',
          message: `Destination "${to}" is unreachable from "${from}" across active roads. One or more connecting road segments may be closed.`,
        })
      }
    } catch (err) {
      setBanner({ type: 'error', message: getErrorMessage(err) })
    } finally {
      setLoading(false)
    }
  }

  const handleSwap = () => {
    const temp = from
    setFrom(to)
    setTo(temp)
    setResult(null)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Compass className="h-6 w-6 text-cyan-600" />
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              Shortest Route Finder
            </h2>
          </div>
          <p className="text-sm text-slate-500">
            Dijkstra shortest-travel-time path calculation with active road closure exclusion
          </p>
        </div>
        <button
          onClick={() => void fetchLocationsAndRoads()}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh Network State
        </button>
      </div>

      {banner && (
        <AlertBanner
          type={banner.type}
          message={banner.message}
          onClose={() => setBanner(null)}
        />
      )}

      {/* Closed Roads Notice */}
      {closedRoads.length > 0 && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50/60 p-4 text-xs text-rose-900">
          <div className="flex items-center gap-2 font-bold mb-1">
            <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
            <span>Active Road Closures in Metropolitan Network ({closedRoads.length}):</span>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {closedRoads.map((r) => (
              <span
                key={r.id}
                className="rounded-lg bg-white px-2.5 py-1 font-mono text-[11px] font-semibold text-rose-700 border border-rose-200 shadow-2xs"
              >
                {r.source} &harr; {r.destination} (CLOSED)
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Route Query Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        {locations.length < 2 ? (
          <div className="rounded-xl border border-dashed border-amber-200 bg-amber-50/70 p-6 text-center text-amber-900">
            <Compass className="mx-auto h-8 w-8 text-amber-500 mb-2" />
            <h4 className="font-bold text-sm">At Least Two Locations Required</h4>
            <p className="text-xs text-amber-700 mt-1 max-w-md mx-auto">
              Shortest-path Dijkstra calculations require at least two connected locations. Add locations and roads in the Road Network page to calculate travel routes.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_auto_1fr_auto] md:items-end">
            {/* Source */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-cyan-600" />
                Source / Team Location
              </label>
              <select
                value={from}
                onChange={(e) => {
                  setFrom(e.target.value)
                  setResult(null)
                }}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-3 text-sm font-semibold text-slate-800 focus:border-cyan-500 focus:bg-white focus:outline-none"
              >
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.name}>
                    {loc.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Swap Button */}
            <div className="flex justify-center pb-1">
              <button
                onClick={handleSwap}
                title="Swap Origin and Destination"
                className="rounded-xl border border-slate-200 p-2.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition shadow-2xs"
              >
                <ArrowRightLeft className="h-5 w-5" />
              </button>
            </div>

            {/* Destination */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1.5">
                <Navigation className="h-4 w-4 text-blue-600" />
                Destination / Repair Site
              </label>
              <select
                value={to}
                onChange={(e) => {
                  setTo(e.target.value)
                  setResult(null)
                }}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-3 text-sm font-semibold text-slate-800 focus:border-blue-500 focus:bg-white focus:outline-none"
              >
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.name}>
                    {loc.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Calculate Button */}
            <div>
              <button
                onClick={() => void handleCalculateRoute()}
                disabled={loading}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 px-6 py-3 text-sm font-bold text-white shadow-md shadow-cyan-500/20 transition hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50"
              >
                <RouteIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                {loading ? 'Routing...' : 'Calculate Route'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Route Results Box */}
      {result && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5 animate-in fade-in duration-200">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Calculation Result
              </span>
              <h3 className="font-bold text-xl text-slate-900 flex items-center gap-2 mt-0.5">
                <span>{result.from}</span>
                <ArrowRight className="h-5 w-5 text-slate-400" />
                <span>{result.to}</span>
              </h3>
            </div>
            <StatusBadge status={result.reachable ? 'ROUTE OK' : 'UNREACHABLE'} />
          </div>

          {result.reachable ? (
            <>
              {/* Metric Highlights */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-cyan-100 bg-cyan-50/60 p-4">
                  <div className="flex items-center gap-2 text-cyan-800 text-xs font-bold uppercase tracking-wider">
                    <Clock className="h-4 w-4 text-cyan-600" />
                    Minimum Travel Time
                  </div>
                  <p className="mt-2 text-3xl font-extrabold text-cyan-950 font-mono">
                    {result.travelTime} <span className="text-base font-medium">minutes</span>
                  </p>
                  <p className="text-xs text-cyan-700/80 mt-1">
                    Calculated by Dijkstra edge relaxation
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
                  <div className="flex items-center gap-2 text-slate-700 text-xs font-bold uppercase tracking-wider">
                    <RouteIcon className="h-4 w-4 text-slate-500" />
                    Path Hop Count
                  </div>
                  <p className="mt-2 text-3xl font-extrabold text-slate-900 font-mono">
                    {Math.max(0, result.path.length - 1)}{' '}
                    <span className="text-base font-medium">segments</span>
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {result.path.length} waypoints traversed
                  </p>
                </div>
              </div>

              {/* Waypoint Breadcrumbs */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/40 p-5">
                <span className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                  Optimal Route Waypoints (Excluding Closed Roads)
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  {result.path.map((node, i) => {
                    const isFirst = i === 0
                    const isLast = i === result.path.length - 1
                    return (
                      <div key={i} className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-bold shadow-2xs ${
                            isFirst
                              ? 'border-cyan-300 bg-cyan-50 text-cyan-900'
                              : isLast
                                ? 'border-emerald-300 bg-emerald-50 text-emerald-900'
                                : 'border-slate-200 bg-white text-slate-800'
                          }`}
                        >
                          <span
                            className={`h-2 w-2 rounded-full ${
                              isFirst ? 'bg-cyan-500' : isLast ? 'bg-emerald-500' : 'bg-slate-400'
                            }`}
                          />
                          {node}
                        </span>
                        {!isLast && (
                          <ArrowRight className="h-4 w-4 text-slate-400 shrink-0" />
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </>
          ) : (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-center text-rose-900">
              <XCircle className="mx-auto h-10 w-10 text-rose-500 mb-2" />
              <h4 className="font-bold text-base">No Reachable Route Exists</h4>
              <p className="text-xs text-rose-700 max-w-md mx-auto mt-1">
                The Dijkstra pathfinder determined that {to} cannot be reached from {from} because essential connecting roads are currently closed or disconnected.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
