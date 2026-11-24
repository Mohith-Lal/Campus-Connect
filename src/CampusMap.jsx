import { useEffect, useMemo, useRef, useState } from 'react'
import { LocateFixed, MapPin, Search } from 'lucide-react'
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
            opacity: 0.95,
          })}
        />
      )}
      {(loading || error) && (
        <div
          aria-live="polite"
          className="pointer-events-none absolute bottom-3 right-3 z-[1000] rounded-lg border border-slate-200/80 bg-white/95 px-3 py-2 text-[10px] font-medium text-slate-500 shadow-sm backdrop-blur-sm"
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
      radius={9}
      pathOptions={{
        color: '#ffffff',
        weight: 3,
        fillColor: '#2563eb',
        fillOpacity: 1,
      }}
    >
      <Popup>
        <div className="min-w-[180px]">
          <h2 className="text-sm font-bold text-slate-900">{location.name}</h2>
          <span className="mt-1 inline-block rounded-full bg-blue-50 px-2 py-1 text-[10px] font-semibold text-blue-700">
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

function CampusMap() {
  const [searchTerm, setSearchTerm] = useState('')
  const [activeCategory, setActiveCategory] = useState(null)
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const [selectedLocationId, setSelectedLocationId] = useState(null)
  const [walkingPaths, setWalkingPaths] = useState(null)
  const [walkingPathsLoading, setWalkingPathsLoading] = useState(true)
  const [walkingPathsError, setWalkingPathsError] = useState(false)
  const [routeDestinationId, setRouteDestinationId] = useState('')
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
    <section>
      <div className="mb-6">
        <p className="mb-2 text-[11px] font-semibold text-slate-400">
          EXPLORE YOUR SURROUNDINGS
        </p>
        <h1 className="text-[27px] font-bold tracking-[-0.04em] text-slate-900 sm:text-[30px]">
          Campus Map
        </h1>
        <p className="mt-2 max-w-xl text-[13px] leading-relaxed text-slate-500">
          Explore the area around BMS Institute of Technology and Management.
        </p>
      </div>

      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
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
              className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-xs text-slate-700 shadow-sm shadow-slate-100 outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
              onChange={(event) => {
                setSearchTerm(event.target.value)
                setSelectedLocationId(null)
              }}
              onFocus={() => setIsSearchFocused(true)}
              placeholder="Search places on campus..."
              role="combobox"
              type="search"
              value={searchTerm}
            />
          </label>
          {showSearchResults && (
            <div
              className="mt-1 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg shadow-slate-200/70"
              id="campus-location-results"
              role="listbox"
            >
              {matchingLocations.length > 0 ? (
                matchingLocations.map((location) => (
                  <button
                    key={location.id}
                    className="flex w-full items-start gap-3 border-b border-slate-100 px-4 py-3 text-left transition last:border-b-0 hover:bg-blue-50/70"
                    onClick={() => selectLocation(location)}
                    role="option"
                    type="button"
                  >
                    <MapPin size={15} className="mt-0.5 shrink-0 text-blue-600" />
                    <span className="min-w-0">
                      <span className="block truncate text-xs font-semibold text-slate-800">
                        {location.name}
                      </span>
                      <span className="mt-1 block text-[10px] text-slate-400">
                        {location.category} · {location.description}
                      </span>
                    </span>
                  </button>
                ))
              ) : (
                <p className="px-4 py-4 text-xs text-slate-500" role="status">
                  No campus locations match “{searchTerm}”.
                </p>
              )}
            </div>
          )}
        </div>

        <button
          className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-600 shadow-sm shadow-slate-100 transition hover:border-blue-200 hover:text-blue-700"
          type="button"
        >
          <LocateFixed size={16} />
          Locate me
        </button>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="mr-1 text-[11px] font-semibold text-slate-500">Categories</span>
        {categories.map((category) => {
          const isActive = activeCategory === category

          return (
            <button
              key={category}
              aria-pressed={isActive}
              className={`rounded-full border px-3 py-1.5 text-[10px] font-semibold transition ${
                isActive
                  ? 'border-blue-200 bg-blue-50 text-blue-700'
                  : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
              }`}
              onClick={() => toggleCategory(category)}
              type="button"
            >
              {category}
            </button>
          )
        })}
      </div>

      <section className="mb-5 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm shadow-slate-100/60 sm:p-5">
        <div className="mb-4">
          <h2 className="text-sm font-bold text-slate-900">Walking directions</h2>
          <p className="mt-1 text-[11px] text-slate-500">
            Use your current location to find a route to a connected campus destination.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_auto_auto] lg:items-end">
          <label className="block text-[11px] font-semibold text-slate-600">
            Destination
            <select
              className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-normal text-slate-700 outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
              onChange={handleDestinationSelection}
              value={routeDestinationId}
            >
              <option value="">Select a destination</option>
              {routeLocations.map((location) => (
                <option key={location.id} value={location.id}>
                  {location.name}
                </option>
              ))}
            </select>
          </label>
          <button
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-700 transition hover:border-blue-200 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={gpsLoading || walkingPathsLoading || walkingPathsError}
            onClick={requestUserLocation}
            type="button"
          >
            <LocateFixed size={15} />
            {gpsLoading ? 'Getting Location…' : 'Use My Location'}
          </button>
          <button
            className="h-10 rounded-xl bg-blue-600 px-4 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            disabled={!gpsFix || !routeDestinationId || gpsLoading}
            onClick={findRoute}
            type="button"
          >
            Find Route
          </button>
        </div>
        {walkingPathsLoading && (
          <p className="mt-3 text-[11px] text-slate-400" role="status">
            Preparing the walking network…
          </p>
        )}
        {walkingPathsError && (
          <p className="mt-3 text-[11px] text-rose-600" role="alert">
            The walking network could not be loaded. Please try again later.
          </p>
        )}
        {gpsError && (
          <p className="mt-3 text-[11px] text-rose-600" role="alert">
            {gpsError}
          </p>
        )}
        {gpsFix && !routeResult && (
          <p className="mt-3 text-[11px] text-slate-500" role="status">
            Location ready (accuracy about {Math.round(gpsFix.accuracy)} m). Nearest walking-network point is{' '}
            {formatDistance(gpsFix.nearestNode.distanceMeters)} away.
            {!routeDestinationId && ' Select a destination, then find a route.'}
          </p>
        )}
        {routeResult?.status === 'found' && (
          <div className="mt-4 rounded-xl bg-violet-50 px-3.5 py-3">
            <p className="text-xs font-semibold text-violet-900">
              Walking distance: {formatDistance(routeResult.totalDistanceMeters)}
            </p>
            {routeResult.usesProvisionalConnections && (
              <p className="mt-1.5 text-[11px] leading-relaxed text-amber-800">
                This route uses approximate building connections that have not been verified as accessible paths.
              </p>
            )}
            <p className="mt-1.5 text-[11px] leading-relaxed text-amber-800">
              The GPS start is joined to the mapped network with a {formatDistance(routeResult.gpsSnapDistanceMeters)} straight-line connection. This segment is approximate and may not follow a physical path.
            </p>
          </div>
        )}
        {routeResult?.status === 'no-route' && (
          <p className="mt-3 text-[11px] text-amber-700" role="status">
            No walking route is available between these locations in the current network.
          </p>
        )}
        {routeResult?.status === 'same-node' && (
          <p className="mt-3 text-[11px] text-amber-700" role="status">
            These locations resolve to the same network access point, so no separate route is needed.
          </p>
        )}
        {routeResult &&
          !['found', 'no-route', 'same-node'].includes(routeResult.status) && (
            <p className="mt-3 text-[11px] text-rose-600" role="alert">
              The route could not be calculated from the current walking network.
            </p>
          )}
      </section>

      <div className="relative h-[min(62vh,680px)] min-h-[420px] overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-sm shadow-slate-200/50">
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
        <div className="pointer-events-none absolute left-3 top-3 z-[1000] flex items-center gap-2 rounded-lg border border-slate-200/80 bg-white/95 px-3 py-2 text-[10px] font-medium text-slate-600 shadow-sm backdrop-blur-sm">
          <MapPin size={13} className="text-blue-600" />
          BMS Institute of Technology and Management
        </div>
      </div>
      <p className="mt-2 text-[10px] text-slate-400">
        Map data © OpenStreetMap contributors. Location services are coming soon.
      </p>
    </section>
  )
}

export default CampusMap
