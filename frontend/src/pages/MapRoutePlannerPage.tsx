import React, { useEffect, useRef, useState } from 'react'
import { setOptions, importLibrary } from '@googlemaps/js-api-loader'
import {
  Compass,
  MapPin,
  AlertTriangle,
  Route as RouteIcon,
  Clock,
  RefreshCw,
  Info,
  CheckCircle2,
  Shield,
  ArrowRight
} from 'lucide-react'
import { api, getErrorMessage } from '../api'
import type { LocationItem, RoadItem, DamageReport, RouteResult } from '../types'

export function MapRoutePlannerPage() {
  const mapRef = useRef<HTMLDivElement>(null)
  const googleMapInstance = useRef<google.maps.Map | null>(null)
  const markersRef = useRef<google.maps.Marker[]>([])
  const polylineRef = useRef<google.maps.Polyline | null>(null)
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null)

  const [locations, setLocations] = useState<LocationItem[]>([])
  const [damageReports, setDamageReports] = useState<DamageReport[]>([])
  const [roads, setRoads] = useState<RoadItem[]>([])
  const [source, setSource] = useState<string>('')
  const [destination, setDestination] = useState<string>('')
  const [routeResult, setRouteResult] = useState<RouteResult | null>(null)
  const [loadingRoute, setLoadingRoute] = useState<boolean>(false)
  const [loadingData, setLoadingData] = useState<boolean>(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [mapLoaded, setMapLoaded] = useState<boolean>(false)
  const [selectedReport, setSelectedReport] = useState<DamageReport | null>(null)

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''
  const isKeyConfigured = apiKey.trim().length > 0 && apiKey !== 'your_google_maps_api_key_here'

  // Fetch locations, reports, and roads from backend
  const loadMunicipalData = async () => {
    setLoadingData(true)
    setErrorMessage(null)
    try {
      const [locRes, repRes, roadRes] = await Promise.all([
        api.get<LocationItem[]>('/locations'),
        api.get<DamageReport[]>('/reports/public').catch(() => api.get<DamageReport[]>('/reports')),
        api.get<RoadItem[]>('/roads'),
      ])
      setLocations(locRes.data)
      setDamageReports(repRes.data)
      setRoads(roadRes.data)

      if (locRes.data.length >= 2) {
        if (!source) setSource(locRes.data[0].name)
        if (!destination) setDestination(locRes.data[1].name)
      }
    } catch (err) {
      setErrorMessage(getErrorMessage(err))
    } finally {
      setLoadingData(false)
    }
  }

  useEffect(() => {
    void loadMunicipalData()
  }, [])

  // Initialize Google Maps once API key is present and DOM node is ready
  useEffect(() => {
    if (!isKeyConfigured || !mapRef.current) {
      return
    }

    setOptions({
      key: apiKey,
      v: 'weekly',
    })

    Promise.all([importLibrary('maps'), importLibrary('marker')])
      .then(() => {
        if (!mapRef.current) return
        const center = { lat: 11.2742, lng: 77.6070 }
        const map = new google.maps.Map(mapRef.current, {
          center,
          zoom: 13,
          mapTypeId: 'roadmap',
          zoomControl: true,
          streetViewControl: false,
          mapTypeControl: false,
          styles: [
            {
              featureType: 'road',
              elementType: 'geometry',
              stylers: [{ visibility: 'simplified' }],
            },
          ],
        })

        googleMapInstance.current = map
        infoWindowRef.current = new google.maps.InfoWindow()
        setMapLoaded(true)
      })
      .catch((err: unknown) => {
        console.error('Google Maps Loader error:', err)
        setErrorMessage('Unable to initialize Google Maps. Please check your API key and allowed referrers.')
      })
  }, [isKeyConfigured])

  // Update map markers when data or map changes
  useEffect(() => {
    if (!googleMapInstance.current || !window.google?.maps) return

    const map = googleMapInstance.current

    // Clear existing markers
    markersRef.current.forEach((m) => m.setMap(null))
    markersRef.current = []

    const bounds = new google.maps.LatLngBounds()
    let hasPoints = false

    // 1. Road Location Markers (Blue Pins)
    locations.forEach((loc) => {
      const lat = loc.latitude ?? 11.2742
      const lng = loc.longitude ?? 77.6070
      const position = { lat, lng }
      bounds.extend(position)
      hasPoints = true

      const marker = new google.maps.Marker({
        position,
        map,
        title: loc.name,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 7,
          fillColor: '#0284c7',
          fillOpacity: 0.9,
          strokeWeight: 2,
          strokeColor: '#ffffff',
        },
      })

      marker.addListener('click', () => {
        infoWindowRef.current?.setContent(`
          <div style="font-family: sans-serif; padding: 6px; color: #1e293b;">
            <div style="font-size: 10px; font-weight: 700; color: #0284c7; text-transform: uppercase;">Road Location</div>
            <div style="font-size: 14px; font-weight: 700; margin-top: 2px;">${loc.name}</div>
            <div style="font-size: 11px; color: #64748b; margin-top: 4px;">Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}</div>
          </div>
        `)
        infoWindowRef.current?.open(map, marker)
      })

      markersRef.current.push(marker)
    })

    // 2. Damage Report Markers (Red / Amber Warning Icons)
    damageReports.forEach((report) => {
      const matchingLoc = locations.find((l) => l.name.toLowerCase() === report.location.toLowerCase())
      const baseLat = report.latitude ?? matchingLoc?.latitude ?? 11.2742
      const baseLng = report.longitude ?? matchingLoc?.longitude ?? 77.6070
      const jitterLat = baseLat + ((report.reportId.charCodeAt(report.reportId.length - 1) % 5) - 2) * 0.0008
      const jitterLng = baseLng + ((report.reportId.charCodeAt(0) % 5) - 2) * 0.0008

      const isResolved = report.status === 'COMPLETED' || report.status === 'RESOLVED'
      const isAssigned = report.status === 'ASSIGNED'
      const pinColor = isResolved ? '#10b981' : isAssigned ? '#f59e0b' : '#ef4444'

      const reportMarker = new google.maps.Marker({
        position: { lat: jitterLat, lng: jitterLng },
        map,
        title: `Report: ${report.reportId} (${report.repairType})`,
        icon: {
          path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z',
          fillColor: pinColor,
          fillOpacity: 1,
          scale: 1.4,
          strokeColor: '#ffffff',
          strokeWeight: 1.5,
          anchor: new google.maps.Point(12, 22),
        },
      })

      reportMarker.addListener('click', () => {
        setSelectedReport(report)
        infoWindowRef.current?.setContent(`
          <div style="font-family: sans-serif; padding: 6px; max-width: 240px; color: #1e293b;">
            <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px;">
              <span style="font-size: 11px; font-weight: 800; color: ${pinColor};">${report.reportId}</span>
              <span style="font-size: 10px; background: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-weight: 600;">${report.status}</span>
            </div>
            <div style="font-size: 13px; font-weight: 700; margin-top: 4px;">${report.location}</div>
            <div style="font-size: 12px; color: #475569; margin-top: 2px;">Type: <b>${report.repairType}</b> (Severity: ${report.severity}/5)</div>
            ${report.description ? `<p style="font-size: 11px; color: #64748b; margin-top: 4px;">${report.description}</p>` : ''}
          </div>
        `)
        infoWindowRef.current?.open(map, reportMarker)
      })

      markersRef.current.push(reportMarker)
    })

    if (hasPoints && !routeResult) {
      map.fitBounds(bounds)
    }
  }, [locations, damageReports, mapLoaded, routeResult])

  // Update Polyline when RouteResult changes
  useEffect(() => {
    if (!googleMapInstance.current || !window.google?.maps) return

    if (polylineRef.current) {
      polylineRef.current.setMap(null)
      polylineRef.current = null
    }

    if (!routeResult || !routeResult.reachable || !routeResult.path || routeResult.path.length < 2) {
      return
    }

    const map = googleMapInstance.current
    const coordinates: google.maps.LatLngLiteral[] = []

    routeResult.path.forEach((stepName) => {
      const loc = locations.find((l) => l.name.toLowerCase() === stepName.toLowerCase())
      if (loc && loc.latitude != null && loc.longitude != null) {
        coordinates.push({ lat: loc.latitude, lng: loc.longitude })
      }
    })

    if (coordinates.length >= 2) {
      polylineRef.current = new google.maps.Polyline({
        path: coordinates,
        geodesic: true,
        strokeColor: '#0284c7',
        strokeOpacity: 0.9,
        strokeWeight: 6,
        map,
      })

      const pathBounds = new google.maps.LatLngBounds()
      coordinates.forEach((pt) => pathBounds.extend(pt))
      map.fitBounds(pathBounds, 60)
    }
  }, [routeResult, locations])

  // Calculate route using backend Dijkstra implementation
  const handleCalculateDijkstraRoute = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!source || !destination) {
      setErrorMessage('Please select both source and destination locations.')
      return
    }

    setLoadingRoute(true)
    setErrorMessage(null)
    setRouteResult(null)

    try {
      const res = await api.get<RouteResult>('/routes', {
        params: {
          from: source.trim(),
          to: destination.trim(),
        },
      })
      setRouteResult(res.data)
      if (!res.data.reachable) {
        setErrorMessage(
          `Destination "${destination}" is unreachable from "${source}" using active municipal roads. One or more connecting roads may be closed for maintenance.`
        )
      }
    } catch (err) {
      setErrorMessage(getErrorMessage(err))
    } finally {
      setLoadingRoute(false)
    }
  }

  const closedRoads = roads.filter((r) => r.closed)

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Compass className="h-6 w-6 text-cyan-600" />
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Map & Route Planner
            </h1>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Interactive GIS visualization powered by Google Maps and backend Dijkstra shortest-path engine
          </p>
        </div>
        <button
          onClick={loadMunicipalData}
          disabled={loadingData}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
        >
          <RefreshCw className={`h-4 w-4 ${loadingData ? 'animate-spin text-cyan-600' : 'text-slate-500'}`} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* API Key Missing Notice (Fail-Safe Informative Banner) */}
      {!isKeyConfigured && (
        <div className="rounded-2xl border border-amber-300 bg-amber-50 p-5 text-amber-900 shadow-sm">
          <div className="flex items-start gap-3">
            <Info className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            <div className="space-y-1">
              <h3 className="text-sm font-bold">Google Maps API Key Not Detected</h3>
              <p className="text-xs text-amber-800 leading-relaxed">
                To render live satellite and vector tiles via Google Maps, set <code className="rounded bg-amber-200/60 px-1 py-0.5 font-mono text-amber-950">VITE_GOOGLE_MAPS_API_KEY</code> in your environment file (<code className="font-mono">frontend/.env</code>).
                All route calculations, closed-road exclusions, and network topology continue to run normally via the backend Dijkstra algorithm below.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Grid: Map & Controls */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column: Route Planner & Filters */}
        <div className="space-y-6 lg:col-span-1">
          {/* Route Finder Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900 mb-4">
              <RouteIcon className="h-4 w-4 text-cyan-600" />
              <span>Dijkstra Shortest Route</span>
            </h3>

            <form onSubmit={handleCalculateDijkstraRoute} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                  Start / Depot Location
                </label>
                <select
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 py-2.5 px-3 text-sm text-slate-900 focus:border-cyan-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                >
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.name}>
                      {loc.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                  Destination / Incident Site
                </label>
                <select
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 py-2.5 px-3 text-sm text-slate-900 focus:border-cyan-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                >
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.name}>
                      {loc.name}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={loadingRoute || !source || !destination}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 py-2.5 text-sm font-semibold text-white shadow-md shadow-cyan-600/20 transition-all hover:opacity-95 disabled:opacity-50"
              >
                {loadingRoute ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <span>Calculate Shortest Path</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>

            {/* Error Message */}
            {errorMessage && (
              <div className="mt-4 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Route Calculation Result */}
            {routeResult && routeResult.reachable && (
              <div className="mt-5 rounded-xl border border-cyan-200 bg-cyan-50/70 p-4">
                <div className="flex items-center justify-between border-b border-cyan-200/60 pb-2 mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-cyan-800">
                    Calculated Path
                  </span>
                  <span className="flex items-center gap-1 text-xs font-bold text-cyan-900 bg-cyan-200/70 px-2 py-0.5 rounded-full">
                    <Clock className="h-3 w-3" />
                    <span>{routeResult.travelTime} mins (est.)</span>
                  </span>
                </div>

                <div className="space-y-1.5">
                  {routeResult.path.map((node, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs text-slate-700">
                      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-cyan-600 text-[10px] font-bold text-white">
                        {idx + 1}
                      </div>
                      <span className="font-semibold text-slate-900">{node}</span>
                      {idx < routeResult.path.length - 1 && (
                        <span className="text-slate-400">&rarr;</span>
                      )}
                    </div>
                  ))}
                </div>
                <p className="mt-3 text-[11px] text-cyan-800/80 italic">
                  Note: Travel times are calculated using stored municipal edge weights. Closed road segments are automatically bypassed.
                </p>
              </div>
            )}
          </div>

          {/* Active Road Closures Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900 mb-3">
              <Shield className="h-4 w-4 text-amber-600" />
              <span>Closed Road Segments ({closedRoads.length})</span>
            </h3>
            {closedRoads.length === 0 ? (
              <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 p-3 rounded-xl border border-emerald-200">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>All municipal road connections are currently open to traffic.</span>
              </div>
            ) : (
              <div className="space-y-2">
                {closedRoads.map((road) => (
                  <div
                    key={road.id}
                    className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50/50 p-2.5 text-xs"
                  >
                    <span className="font-medium text-slate-800">
                      {road.source} &harr; {road.destination}
                    </span>
                    <span className="rounded bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-700">
                      CLOSED
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Selected Incident Marker Details */}
          {selectedReport && (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 mb-2">
                Selected Incident: {selectedReport.reportId}
              </h3>
              <div className="space-y-1.5 text-xs text-slate-600">
                <p><span className="font-semibold text-slate-800">Location:</span> {selectedReport.location}</p>
                <p><span className="font-semibold text-slate-800">Type:</span> {selectedReport.repairType}</p>
                <p><span className="font-semibold text-slate-800">Severity:</span> {selectedReport.severity} / 5</p>
                <p><span className="font-semibold text-slate-800">Accident Risk:</span> {selectedReport.accidentRisk} / 5</p>
                <p><span className="font-semibold text-slate-800">Status:</span> {selectedReport.status}</p>
                {selectedReport.description && (
                  <p className="mt-2 text-slate-500 italic">"{selectedReport.description}"</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Google Maps Interactive Container */}
        <div className="space-y-4 lg:col-span-2">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            {/* Map Header Toolbar */}
            <div className="flex flex-wrap items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1 font-semibold text-slate-700">
                  <span className="h-2.5 w-2.5 rounded-full bg-cyan-600" />
                  <span>Road Nodes ({locations.length})</span>
                </span>
                <span className="flex items-center gap-1 font-semibold text-slate-700">
                  <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
                  <span>Damage Reports ({damageReports.length})</span>
                </span>
              </div>
              <div className="text-slate-500 font-mono text-[11px]">
                Algorithm: Dijkstra (O((V+E) log V))
              </div>
            </div>

            {/* Map Canvas / Fallback View */}
            {isKeyConfigured ? (
              <div
                ref={mapRef}
                className="h-[600px] w-full bg-slate-100"
                style={{ minHeight: '600px' }}
              />
            ) : (
              <div className="flex h-[600px] flex-col items-center justify-center bg-slate-900 p-8 text-center text-slate-300">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-400">
                  <MapPin className="h-7 w-7" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">
                  Municipal Road Graph Visualizer
                </h3>
                <p className="max-w-md text-xs text-slate-400 mb-6 leading-relaxed">
                  Google Maps JavaScript API key is not configured in this environment.
                  Below is the live municipal topology graph showing registered locations and active route calculations:
                </p>

                {/* Interactive SVG graph fallback representation */}
                <div className="w-full max-w-xl rounded-xl border border-slate-800 bg-slate-950/60 p-4 text-left">
                  <div className="text-xs font-bold text-cyan-400 mb-2 uppercase tracking-wider">
                    Stored Municipal Nodes ({locations.length})
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {locations.map((loc) => (
                      <div
                        key={loc.id}
                        className="rounded-lg border border-slate-800 bg-slate-900/80 p-2 text-slate-300 flex items-center justify-between"
                      >
                        <span className="font-semibold text-white">{loc.name}</span>
                        <span className="text-[10px] text-cyan-400 font-mono">
                          {loc.latitude?.toFixed(3)}, {loc.longitude?.toFixed(3)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {routeResult && routeResult.reachable && (
                    <div className="mt-4 border-t border-slate-800 pt-3">
                      <div className="text-xs font-bold text-emerald-400 mb-1">
                        Active Dijkstra Solution ({routeResult.travelTime} mins):
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-200">
                        {routeResult.path.map((p, idx) => (
                          <span key={idx} className="flex items-center gap-1">
                            <span className="rounded bg-cyan-500/20 px-2 py-0.5 text-cyan-300 font-semibold">{p}</span>
                            {idx < routeResult.path.length - 1 && <span className="text-slate-500">&rarr;</span>}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
