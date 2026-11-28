import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Compass,
  LocateFixed,
  MapPin,
  Navigation,
  Route,
  Search,
  Sparkles,
} from 'lucide-react'
import {
  CircleMarker,
  GeoJSON,
  MapContainer,
  Pane,
  Polyline,
  Popup,
  TileLayer,
  useMap,
} from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import campusLocations, { searchCampusLocations } from './data/campusLocations.js'
import campusConnections from './data/campusConnections.js'
import { getStudentWalkingPaths } from './data/walkingPaths.js'
import { buildWalkingGraph } from './data/walkingGraph.js'
import { findShortestPath } from './utils/shortestPath.js'
import { findNearestWalkingNode } from './utils/nearestWalkingNode.js'
import {
  MAX_GPS_ACCURACY_METERS,
  MAX_GPS_NETWORK_DISTANCE_METERS,
} from './utils/navigationConfig.js'

const categories = [
  'Academic Blocks',
  'Parking',
  'Sports',
  'Food',
  'Facilities',
]

const campusCenter = [13.1339, 77.56802]

function FitLocationBounds({ locations }) {
  const map = useMap()

  useEffect(() => {
    if (locations.length === 0) return

    map.fitBounds(
      locations.map((location) => location.position),
      { padding: [48, 48], maxZoom: 18 },
    )
  }, [locations, map])

  return null
}

function WalkingPathsLayer({ geoJson, loading, error }) {
  const map = useMap()

  useEffect(() => {
    const paneName = 'walkingPathsPane'
    if (!map.getPane(paneName)) {
      map.createPane(paneName).style.zIndex = '350'
    }
  }, [map])

  return (
    <>
      {geoJson && (
        <GeoJSON
          data={geoJson}
          pane="walkingPathsPane"
          interactive={false}
          style={(feature) => ({
            color: feature?.properties?.access === 'private' ? '#dc2626' : '#2563eb',
            weight: 5,
            opacity: 0.9,
          })}
        />
      )}
      {(loading || error) && (
        <div
          aria-live="polite"
          className="pointer-events-none absolute bottom-3 right-3 z-[1000] rounded-xl border border-slate-200/80 bg-white/95 px-3 py-2 text-[11px] font-medium text-slate-600 shadow-md backdrop-blur-md dark:border-slate-700 dark:bg-slate-900/90 dark:text-slate-300"
          role="status"
        >
          {loading ? 'Loading walking paths…' : 'Walking paths could not be loaded.'}
        </div>
      )}
    </>
  )
}

function NavigationRouteLayer({ route }) {
  const map = useMap()

  useEffect(() => {
    if (route?.status !== 'found' || route.routeCoordinates.length < 2) return

    map.fitBounds(route.routeCoordinates, { padding: [64, 64], maxZoom: 19 })
  }, [map, route])

  if (route?.status !== 'found' || route.routeCoordinates.length < 2) return null

  return (
    <Pane name="navigationRoutePane" style={{ zIndex: 390 }}>
      <Polyline
        positions={route.routeCoordinates}
        pathOptions={{ color: '#7c3aed', weight: 7, opacity: 0.95 }}
        interactive={false}
      />
    </Pane>
  )
}

function UserLocationMarker({ position, accuracy }) {
  const map = useMap()

  useEffect(() => {
    if (position) map.flyTo(position, 18, { duration: 0.7 })
  }, [map, position])

  if (!position) return null

  return (
    <CircleMarker
      center={position}
      radius={10}
      pathOptions={{
        color: '#ffffff',
        weight: 3,
        fillColor: '#16a34a',
        fillOpacity: 1,
      }}
    >
      <Popup>
        <div className="text-xs">
          <strong>Your current location</strong>
          <p className="mt-1 text-slate-500">GPS accuracy: about {Math.round(accuracy)} m</p>
        </div>
      </Popup>
    </CircleMarker>
  )
}

function CampusLocationMarker({ location, selected }) {
  const map = useMap()
  const markerRef = useRef(null)

  useEffect(() => {
    if (!selected || !markerRef.current) return

    map.flyTo(location.position, 18, { duration: 0.7 })
    markerRef.current.openPopup()
  }, [location, map, selected])

  return (
    <CircleMarker
      ref={markerRef}
      center={location.position}
      radius={selected ? 12 : 9}
      pathOptions={{
        color: '#ffffff',
        weight: 3,
        fillColor: selected ? '#f59e0b' : '#2563eb',
        fillOpacity: 1,
      }}
    >
      <Popup>
        <div className="min-w-[190px]">
          <h2 className="text-sm font-bold text-slate-900">{location.name}</h2>
          <span className="mt-1 inline-block rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-semibold text-brand-700">
            {location.category}
          </span>
          <p className="mt-2 text-xs leading-relaxed text-slate-600">
            {location.description}
          </p>
        </div>
      </Popup>
    </CircleMarker>
  )
}

function CampusMap({ initialLocationId = null, isGuestMode = false, darkMode = false }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [activeCategory, setActiveCategory] = useState(null)
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const [selectedLocationId, setSelectedLocationId] = useState(initialLocationId)
  const [walkingPaths, setWalkingPaths] = useState(null)
  const [walkingPathsLoading, setWalkingPathsLoading] = useState(true)
  const [walkingPathsError, setWalkingPathsError] = useState(false)
  const [routeDestinationId, setRouteDestinationId] = useState(initialLocationId ?? '')
  const [routeResult, setRouteResult] = useState(null)
  const [gpsPosition, setGpsPosition] = useState(null)
  const [gpsFix, setGpsFix] = useState(null)
  const [gpsLoading, setGpsLoading] = useState(false)
  const [gpsError, setGpsError] = useState('')
  const searchContainerRef = useRef(null)

  const graph = useMemo(
    () => (walkingPaths ? buildWalkingGraph(walkingPaths, campusLocations) : null),
    [walkingPaths],
  )
  const routeLocations = useMemo(
    () => (graph ? campusLocations.filter((location) => graph.resolveLocationNode(location.id)) : []),
    [graph],
  )
  const normalizedSearch = searchTerm.trim().toLowerCase()
  const matchingLocations = useMemo(
    () => searchCampusLocations(normalizedSearch, activeCategory),
    [activeCategory, normalizedSearch],
  )
  const mappableLocations = useMemo(
    () =>
      matchingLocations.filter(
        ({ position }) =>
          Array.isArray(position) &&
          position.length === 2 &&
          position.every((coordinate) => Number.isFinite(coordinate)),
      ),
    [matchingLocations],
  )
  const showSearchResults = isSearchFocused && normalizedSearch.length > 0

  useEffect(() => {
    const controller = new AbortController()

    fetch('/data/campus-walking-paths.geojson', { signal: controller.signal })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Walking paths request failed with status ${response.status}`)
        }
        return response.json()
      })
      .then((data) => {
        if (!Array.isArray(data.features)) {
          throw new Error('Walking paths data is not a valid GeoJSON feature collection')
        }
        setWalkingPaths(getStudentWalkingPaths(data))
        setWalkingPathsLoading(false)
      })
      .catch((error) => {
        if (error.name === 'AbortError') return
        setWalkingPathsError(true)
        setWalkingPathsLoading(false)
      })

    return () => controller.abort()
  }, [])

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (!searchContainerRef.current?.contains(event.target)) {
        setIsSearchFocused(false)
      }
    }

    document.addEventListener('click', handlePointerDown)
    return () => document.removeEventListener('click', handlePointerDown)
  }, [])

  const toggleCategory = (category) =>
    setActiveCategory((current) => (current === category ? null : category))

  const selectLocation = (location) => {
    setSelectedLocationId(location.id)
    setRouteDestinationId(location.id)
    setSearchTerm(location.name)
    setIsSearchFocused(false)
  }

  const requestUserLocation = () => {
    setGpsError('')
    setGpsFix(null)
    setGpsPosition(null)
    setRouteResult(null)

    if (!navigator.geolocation) {
      setGpsError('This browser does not support location services.')
      return
    }

    setGpsLoading(true)
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const position = [coords.latitude, coords.longitude]
        setGpsPosition({ position, accuracy: coords.accuracy })
        setGpsLoading(false)

        if (!Number.isFinite(coords.accuracy) || coords.accuracy > MAX_GPS_ACCURACY_METERS) {
          setGpsError(
            `GPS accuracy is about ${Math.round(coords.accuracy)} m, which is too imprecise. Move to a clearer location and try again (required accuracy: ${MAX_GPS_ACCURACY_METERS} m or better).`,
          )
          return
        }

        if (!graph) {
          setGpsError('The campus walking network is not ready yet. Please try again shortly.')
          return
        }

        const nearestNode = findNearestWalkingNode(graph, position)
        if (!nearestNode) {
          setGpsError('No walking-network points are available for GPS routing.')
          return
        }

        if (nearestNode.distanceMeters > MAX_GPS_NETWORK_DISTANCE_METERS) {
          setGpsError(
            `The nearest mapped walking-network point is ${formatDistance(nearestNode.distanceMeters)} away, beyond the ${MAX_GPS_NETWORK_DISTANCE_METERS} m safety limit. You may be outside the mapped campus area; no route was created.`,
          )
          return
        }

        setGpsFix({
          position,
          accuracy: coords.accuracy,
          nearestNode,
        })
      },
      (error) => {
        setGpsLoading(false)
        const messages = {
          1: 'Location permission was denied. Allow location access in your browser settings, then try again.',
          2: 'Your current location is unavailable. Check your device location settings and try again.',
          3: 'The location request timed out. Try again where GPS reception is clearer.',
        }
        setGpsError(messages[error.code] ?? 'Your current location could not be determined.')
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    )
  }

  const findRoute = () => {
    if (!graph || !gpsFix || !routeDestinationId) return

    const destinationNodeId = graph.resolveLocationNode(routeDestinationId)
    const networkRoute = findShortestPath(graph, gpsFix.nearestNode.nodeId, destinationNodeId)
    if (networkRoute.status !== 'found' && networkRoute.status !== 'same-node') {
      setRouteResult(networkRoute)
      return
    }

    setRouteResult({
      ...networkRoute,
      status: 'found',
      routeCoordinates: [gpsFix.position, ...networkRoute.routeCoordinates],
      totalDistanceMeters:
        networkRoute.totalDistanceMeters + gpsFix.nearestNode.distanceMeters,
      gpsSnapDistanceMeters: gpsFix.nearestNode.distanceMeters,
    })
  }

  const handleDestinationSelection = (event) => {
    setRouteDestinationId(event.target.value)
    setRouteResult(null)
  }

  const formatDistance = (distanceMeters) =>
    distanceMeters >= 1000
      ? `${(distanceMeters / 1000).toFixed(2)} km`
      : `${Math.round(distanceMeters)} m`

  return (
    <section className="animate-fade-up space-y-5">
      {/* Enhanced Guest Mode Banner with Next-Level Animated Styles */}
      {isGuestMode && (
        <div className="relative overflow-hidden rounded-3xl border-2 border-brand-500/40 bg-linear-to-r from-brand-600/15 via-indigo-600/10 to-amber-500/15 p-5 backdrop-blur-xl shadow-xl dark:border-brand-400/30 dark:bg-slate-900/90">
          <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-brand-500/15 blur-3xl" />
          <div className="pointer-events-none absolute -left-16 -bottom-16 h-48 w-48 rounded-full bg-indigo-500/15 blur-3xl" />

          <div className="relative z-10 flex flex-col gap-4">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-linear-to-tr from-brand-600 via-indigo-600 to-amber-500 text-white shadow-lg shadow-brand-500/30">
                  <span className="absolute -inset-1 rounded-2xl bg-linear-to-r from-brand-500 via-indigo-500 to-amber-500 opacity-40 blur-xs animate-pulse" />
                  <Compass size={24} className="relative z-10 animate-spin-slow" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-display text-base font-extrabold text-slate-950 dark:text-white">
                      Campus Explorer Mode
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800 dark:text-emerald-300">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Guest Navigator Active
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Welcome to BMSIT&amp;M! Click any campus landmark below to focus the map, view departments, and navigate:
                  </p>
                </div>
              </div>

              {/* Quick Visitor Information Pill */}
              <div className="flex items-center gap-2 rounded-2xl border border-brand-200/80 bg-white/90 px-3.5 py-1.5 text-xs font-bold text-brand-700 shadow-xs dark:border-brand-500/30 dark:bg-slate-800 dark:text-brand-300">
                <Sparkles size={14} className="text-amber-500 animate-pulse" />
                <span>Public Visitor Access · GPS Turn-by-Turn</span>
              </div>
            </div>

            {/* Quick-Jump Landmark Chips for Guest with active indicator */}
            <div className="flex flex-wrap gap-2 pt-1 border-t border-brand-500/20 dark:border-slate-800">
              {[
                { label: 'Auditorium & Placement', id: 'silver-jubilee-block' },
                { label: 'B.S. Narayan CSE Wing', id: 'b-s-narayan-block' },
                { label: 'Sir C.V. Raman Labs', id: 'sir-c-v-raman-block' },
                { label: 'Central Library Pods', id: 'central-library' },
                { label: 'Kaapi Kuteera Cafe', id: 'kaapi-kuteera' },
                { label: 'BMSSA Architecture', id: 'bmssa-block-1' },
                { label: 'Playground & Sports Arena', id: 'playground' },
              ].map((dest) => {
                const targetLoc = campusLocations.find((l) => l.id === dest.id)
                const isSelected = selectedLocationId === dest.id
                return (
                  <button
                    key={dest.id}
                    onClick={() => {
                      if (targetLoc) selectLocation(targetLoc)
                    }}
                    type="button"
                    className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition-all active:scale-95 ${
                      isSelected
                        ? 'border-brand-600 bg-brand-600 text-white shadow-md shadow-brand-500/30'
                        : 'border-slate-300 bg-white text-slate-900 shadow-2xs hover:border-brand-600 hover:bg-brand-50 hover:text-brand-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-brand-400 dark:hover:bg-slate-700'
                    }`}
                  >
                    <MapPin size={13} className={isSelected ? 'text-amber-300' : 'text-brand-600 dark:text-brand-400'} />
                    <span>{dest.label}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-slate-200/70 bg-white p-4.5 sm:p-6 lg:p-7 shadow-sm dark:border-slate-800 dark:bg-slate-900/90">
        <div className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-brand-500/10 blur-2xl" />
        <div className="flex flex-wrap items-end justify-between gap-3 sm:gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-2.5 sm:px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">
              <Compass size={12} /> Interactive Wayfinding
            </span>
            <h1 className="mt-2 sm:mt-3 text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Campus Map &amp; Walking Navigator
            </h1>
            <p className="mt-1 sm:mt-1.5 max-w-2xl text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Explore BMS Institute of Technology &amp; Management — search academic blocks, courts, and hangout spots or calculate live GPS walking routes.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-xl sm:rounded-2xl border border-slate-200/80 bg-slate-50/80 px-3 py-1.5 sm:px-3.5 sm:py-2 text-[11px] sm:text-xs font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-300">
            <span className="h-2 w-2 animate-pulse rounded-full bg-mint-500" />
            {mappableLocations.length} Mapped Locations
          </div>
        </div>
      </div>

      {/* Search + Categories */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative z-[1001] w-full lg:max-w-md" ref={searchContainerRef}>
          <label className="relative block">
            <Search
              aria-hidden="true"
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              aria-label="Search the campus map"
              aria-expanded={showSearchResults}
              aria-controls="campus-location-results"
              className="h-11 w-full rounded-2xl border border-slate-200 bg-white pl-10 pr-4 text-xs text-slate-800 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-brand-400 focus:ring-4 focus:ring-brand-500/10 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              onChange={(event) => {
                setSearchTerm(event.target.value)
                setSelectedLocationId(null)
              }}
              onFocus={() => setIsSearchFocused(true)}
              placeholder="Search auditorium, department cells, blocks, Kaapi Kuteera..."
              role="combobox"
              type="search"
              value={searchTerm}
            />
          </label>
          {showSearchResults && (
            <div
              className="mt-1.5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900"
              id="campus-location-results"
              role="listbox"
            >
              {matchingLocations.length > 0 ? (
                matchingLocations.map((location) => (
                  <button
                    key={location.id}
                    className="flex w-full items-start gap-3 border-b border-slate-100 px-4 py-3.5 text-left transition last:border-b-0 hover:bg-brand-50/80 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800"
                    onClick={() => selectLocation(location)}
                    role="option"
                    type="button"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/20 dark:text-brand-300">
                      <MapPin size={16} />
                    </div>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-xs font-bold text-slate-900 dark:text-white">
                        {location.name}
                      </span>
                      <span className="mt-0.5 block truncate text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                        {location.description}
                      </span>
                      {location.facilities?.length > 0 && (
                        <span className="mt-1 flex flex-wrap gap-1">
                          {location.facilities.map((fac) => (
                            <span
                              key={fac}
                              className="rounded-md border border-slate-200 bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                            >
                              {fac}
                            </span>
                          ))}
                        </span>
                      )}
                    </span>
                  </button>
                ))
              ) : (
                <p className="px-4 py-4 text-xs font-medium text-slate-600 dark:text-slate-300" role="status">
                  No campus locations match “{searchTerm}”.
                </p>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {categories.map((category) => {
            const isActive = activeCategory === category

            return (
              <button
                key={category}
                aria-pressed={isActive}
                className={`rounded-full border px-3.5 py-1.5 text-[11px] font-semibold transition ${
                  isActive
                    ? 'border-brand-500 bg-brand-600 text-white shadow-sm shadow-brand-500/25'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-brand-300 hover:text-brand-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-brand-500'
                }`}
                onClick={() => toggleCategory(category)}
                type="button"
              >
                {category}
              </button>
            )
          })}
        </div>
      </div>

      {/* Walking Directions Panel */}
      <section className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/90">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-iris-50 text-iris-600 dark:bg-iris-500/15 dark:text-iris-300">
              <Route size={18} />
            </span>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Walking Directions</h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Pin your live GPS location and compute the shortest pedestrian path across campus.
              </p>
            </div>
          </div>
          {routeResult?.status === 'found' && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-mint-50 px-3 py-1 text-[11px] font-semibold text-mint-700 dark:bg-mint-500/15 dark:text-mint-300">
              <Sparkles size={12} /> Route Active
            </span>
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_auto_auto] lg:items-end">
          <label className="block text-[11px] font-bold text-slate-800 dark:text-slate-300">
            Destination
            <select
              className="mt-1.5 h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-xs font-bold text-slate-900 outline-none transition shadow-xs focus:border-brand-600 focus:bg-white focus:ring-4 focus:ring-brand-500/15 [color-scheme:light] dark:[color-scheme:dark] dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              onChange={handleDestinationSelection}
              value={routeDestinationId}
            >
              <option
                value=""
                style={{ backgroundColor: darkMode ? '#0f172a' : '#ffffff', color: darkMode ? '#f8fafc' : '#0f172a' }}
                className="bg-white text-slate-900 dark:bg-slate-900 dark:text-white font-medium"
              >
                Select a campus destination
              </option>
              {routeLocations.map((location) => (
                <option
                  key={location.id}
                  value={location.id}
                  style={{ backgroundColor: darkMode ? '#0f172a' : '#ffffff', color: darkMode ? '#f8fafc' : '#0f172a' }}
                  className="bg-white text-slate-900 dark:bg-slate-900 dark:text-white font-medium"
                >
                  {location.name}
                </option>
              ))}
            </select>
          </label>
          <button
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-700 transition hover:border-brand-300 hover:text-brand-700 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-brand-500"
            disabled={gpsLoading || walkingPathsLoading || walkingPathsError}
            onClick={requestUserLocation}
            type="button"
          >
            <LocateFixed size={15} />
            {gpsLoading ? 'Locating…' : 'Use My Location'}
          </button>
          <button
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 text-xs font-semibold text-white shadow-sm shadow-brand-600/25 transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none dark:disabled:bg-slate-700"
            disabled={!gpsFix || !routeDestinationId || gpsLoading}
            onClick={findRoute}
            type="button"
          >
            <Navigation size={14} />
            Find Route
          </button>
        </div>

        {walkingPathsLoading && (
          <p className="mt-3 text-[11px] text-slate-400" role="status">
            Preparing the campus walking network…
          </p>
        )}
        {walkingPathsError && (
          <p className="mt-3 text-[11px] text-rose-600 dark:text-rose-400" role="alert">
            The walking network could not be loaded. Please try again later.
          </p>
        )}
        {gpsError && (
          <p className="mt-3 text-[11px] text-rose-600 dark:text-rose-400" role="alert">
            {gpsError}
          </p>
        )}
        {gpsFix && !routeResult && (
          <p className="mt-3 text-[11px] text-slate-500 dark:text-slate-400" role="status">
            Location ready (accuracy about {Math.round(gpsFix.accuracy)} m). Nearest walking-network point is{' '}
            {formatDistance(gpsFix.nearestNode.distanceMeters)} away.
            {!routeDestinationId && ' Select a destination, then click Find Route.'}
          </p>
        )}
        {routeResult?.status === 'found' && (
          <div className="mt-4 rounded-2xl border border-iris-200/80 bg-iris-50/90 px-4 py-3 dark:border-iris-500/30 dark:bg-iris-500/10">
            <p className="text-xs font-bold text-iris-900 dark:text-iris-200">
              Total walking distance: {formatDistance(routeResult.totalDistanceMeters)}
            </p>
            {routeResult.usesProvisionalConnections && (
              <p className="mt-1 text-[11px] leading-relaxed text-sun-800 dark:text-sun-300">
                This route uses approximate building connections that have not been verified as accessible paths.
              </p>
            )}
            <p className="mt-1 text-[11px] leading-relaxed text-sun-800 dark:text-sun-300">
              GPS start is joined to the mapped network with a {formatDistance(routeResult.gpsSnapDistanceMeters)} straight-line connection.
            </p>
          </div>
        )}
        {routeResult?.status === 'no-route' && (
          <p className="mt-3 text-[11px] text-sun-700 dark:text-sun-400" role="status">
            No walking route is available between these locations in the current network.
          </p>
        )}
        {routeResult?.status === 'same-node' && (
          <p className="mt-3 text-[11px] text-sun-700 dark:text-sun-400" role="status">
            These locations resolve to the same network access point, so no separate route is needed.
          </p>
        )}
        {routeResult &&
          !['found', 'no-route', 'same-node'].includes(routeResult.status) && (
            <p className="mt-3 text-[11px] text-rose-600 dark:text-rose-400" role="alert">
              The route could not be calculated from the current walking network.
            </p>
          )}
      </section>

      {/* Map + Quick-Jump Building Strip */}
      <div className="grid gap-4 xl:grid-cols-[1fr_300px]">
        <div className="relative h-[min(65vh,640px)] min-h-[360px] sm:min-h-[440px] overflow-hidden rounded-2xl sm:rounded-3xl border border-slate-200/90 bg-slate-100 shadow-md dark:border-slate-800 dark:bg-slate-900">
          <MapContainer
            center={campusCenter}
            className="h-full w-full"
            zoom={16}
            scrollWheelZoom
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <WalkingPathsLayer
              geoJson={walkingPaths}
              loading={walkingPathsLoading}
              error={walkingPathsError}
            />
            <FitLocationBounds locations={mappableLocations} />
            <Pane name="campusConnectionsPane" style={{ zIndex: 375 }}>
              {mappableLocations.map((location) => {
                const networkPosition = campusConnections[location.id]
                if (!networkPosition) return null

                return (
                  <Polyline
                    key={location.id}
                    positions={[location.position, networkPosition]}
                    pathOptions={{
                      color: '#f97316',
                      weight: 3,
                      opacity: 0.9,
                      dashArray: '7 7',
                    }}
                    interactive={false}
                  />
                )
              })}
            </Pane>
            <NavigationRouteLayer route={routeResult} />
            <UserLocationMarker
              position={gpsPosition?.position}
              accuracy={gpsPosition?.accuracy ?? 0}
            />
            {mappableLocations.map((location) => (
              <CampusLocationMarker
                key={location.id}
                location={location}
                selected={location.id === selectedLocationId}
              />
            ))}
          </MapContainer>
          <div className="pointer-events-none absolute left-3 top-3 z-[1000] flex items-center gap-2 rounded-xl border border-slate-200/80 bg-white/95 px-3 py-2 text-[11px] font-semibold text-slate-700 shadow-md backdrop-blur-md dark:border-slate-700 dark:bg-slate-900/90 dark:text-slate-200">
            <MapPin size={14} className="text-brand-600 dark:text-brand-400" />
            BMS Institute of Technology &amp; Management
          </div>
        </div>

        {/* Quick-Jump Campus Landmarks */}
        <aside className="flex flex-col rounded-3xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/90">
          <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
            Quick Jump
          </h3>
          <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
            Tap a landmark to focus &amp; set as route target.
          </p>
          <div className="mt-3 flex-1 space-y-2 overflow-y-auto pr-1 max-h-[520px]">
            {mappableLocations.map((location) => {
              const isSelected = location.id === selectedLocationId
              return (
                <button
                  key={location.id}
                  onClick={() => selectLocation(location)}
                  type="button"
                  className={`w-full rounded-2xl border p-3 text-left transition ${
                    isSelected
                      ? 'border-brand-500 bg-brand-50/80 dark:border-brand-500 dark:bg-brand-500/15'
                      : 'border-slate-100 bg-slate-50/60 hover:border-slate-300 hover:bg-white dark:border-slate-800 dark:bg-slate-800/50 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-xs font-bold text-slate-800 dark:text-slate-100">
                      {location.name}
                    </span>
                    <MapPin
                      size={13}
                      className={isSelected ? 'text-sun-500' : 'text-slate-400'}
                    />
                  </div>
                  <span className="mt-1 inline-block text-[10px] font-medium text-slate-500 dark:text-slate-400">
                    {location.category}
                  </span>
                </button>
              )
            })}
          </div>
        </aside>
      </div>
    </section>
  )
}

export default CampusMap
