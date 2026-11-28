import { useEffect, useMemo, useRef, useState } from 'react'
import {
  AlertTriangle,
  ArrowUp,
  ArrowUpLeft,
  ArrowUpRight,
  CornerUpLeft,
  CornerUpRight,
  Crosshair,
  LocateFixed,
  MapPin,
  RotateCcw,
  Search,
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
import { generateNavigationInstructions } from './utils/navigationInstructions.js'
import { createOffRouteDetector } from './utils/offRouteDetection.js'
import {
  createArrivalDetector,
  updateNavigationDetectors,
} from './utils/arrivalDetection.js'
import {
  calculateReroute,
  createRerouteCoordinator,
} from './utils/automaticRerouting.js'
import {
  createGpsWatchOptions,
  getGpsTrackingErrorMessage,
  isReliableGpsReading,
} from './utils/gpsTracking.js'
import {
  GPS_WATCH_TIMEOUT_MS,
  DESTINATION_ARRIVAL_CONSECUTIVE_READINGS,
  DESTINATION_ARRIVAL_RADIUS_METERS,
  MAX_GPS_ACCURACY_METERS,
  MAX_GPS_NETWORK_DISTANCE_METERS,
  OFF_ROUTE_CONSECUTIVE_READINGS,
  OFF_ROUTE_DISTANCE_METERS,
  OFF_ROUTE_RECOVERY_DISTANCE_METERS,
  ON_ROUTE_RECOVERY_CONSECUTIVE_READINGS,
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

function UserLocationMarker({
  position,
  accuracy,
  isTracking,
  isFollowing,
  onManualPan,
}) {
  const map = useMap()
  const previousMapStateRef = useRef({
    position: null,
    isTracking: false,
    isFollowing: false,
  })

  useEffect(() => {
    if (!isTracking) return undefined

    map.on('dragstart', onManualPan)
    return () => map.off('dragstart', onManualPan)
  }, [isTracking, map, onManualPan])

  useEffect(() => {
    const previous = previousMapStateRef.current
    const positionChanged = previous.position !== position
    const shouldFollow =
      isTracking &&
      isFollowing &&
      (positionChanged ||
        !previous.isTracking ||
        !previous.isFollowing)
    const shouldCenterNewFix = !isTracking && positionChanged

    previousMapStateRef.current = { position, isTracking, isFollowing }
    if (position && (shouldFollow || shouldCenterNewFix)) {
      map.flyTo(position, 18, { duration: 0.7 })
    }
  }, [isFollowing, isTracking, map, position])

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
  const [gpsAccuracy, setGpsAccuracy] = useState(null)
  const [gpsLoading, setGpsLoading] = useState(false)
  const [gpsError, setGpsError] = useState('')
  const [isNavigating, setIsNavigating] = useState(false)
  const [isFollowingUser, setIsFollowingUser] = useState(true)
  const [offRouteState, setOffRouteState] = useState({
    status: 'checking',
    reliable: false,
    distanceMeters: null,
  })
  const [rerouteInProgress, setRerouteInProgress] = useState(false)
  const [rerouteError, setRerouteError] = useState('')
  const [routeUpdatedMessage, setRouteUpdatedMessage] = useState('')
  const [arrivalState, setArrivalState] = useState({
    arrived: false,
    reliable: false,
    distanceMeters: null,
    consecutiveReadings: 0,
  })
  const searchContainerRef = useRef(null)
  const gpsWatchIdRef = useRef(null)
  const gpsWatchActiveRef = useRef(false)
  const navigationSessionRef = useRef(0)
  const latestRouteRef = useRef(null)
  const latestDestinationIdRef = useRef(routeDestinationId)
  const latestReliableGpsRef = useRef(null)
  const rerouteAttemptedRef = useRef(false)
  const rerouteCoordinatorRef = useRef(null)
  if (rerouteCoordinatorRef.current === null) {
    rerouteCoordinatorRef.current = createRerouteCoordinator()
  }
  const offRouteDetectorRef = useRef(null)
  if (offRouteDetectorRef.current === null) {
    offRouteDetectorRef.current = createOffRouteDetector({
      offRouteDistanceMeters: OFF_ROUTE_DISTANCE_METERS,
      recoveryDistanceMeters: OFF_ROUTE_RECOVERY_DISTANCE_METERS,
      consecutiveOffRouteReadings: OFF_ROUTE_CONSECUTIVE_READINGS,
      consecutiveRecoveryReadings: ON_ROUTE_RECOVERY_CONSECUTIVE_READINGS,
    })
  }
  const arrivalDetectorRef = useRef(null)
  if (arrivalDetectorRef.current === null) {
    arrivalDetectorRef.current = createArrivalDetector({
      arrivalRadiusMeters: DESTINATION_ARRIVAL_RADIUS_METERS,
      consecutiveReadingsRequired: DESTINATION_ARRIVAL_CONSECUTIVE_READINGS,
    })
  }
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
  const navigationInstructions = useMemo(
    () => generateNavigationInstructions(routeResult),
    [routeResult],
  )

  useEffect(() => {
    latestRouteRef.current = routeResult
  }, [routeResult])

  useEffect(() => {
    latestDestinationIdRef.current = routeDestinationId
  }, [routeDestinationId])

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

  useEffect(
    () => () => {
      if (gpsWatchIdRef.current !== null) {
        navigator.geolocation?.clearWatch(gpsWatchIdRef.current)
        gpsWatchIdRef.current = null
      }
      gpsWatchActiveRef.current = false
    },
    [],
  )

  const toggleCategory = (category) =>
    setActiveCategory((current) => (current === category ? null : category))

  const selectLocation = (location) => {
    setSelectedLocationId(location.id)
    setSearchTerm(location.name)
    setIsSearchFocused(false)
  }

  const stopNavigation = () => {
    navigationSessionRef.current += 1
    if (gpsWatchIdRef.current !== null) {
      navigator.geolocation?.clearWatch(gpsWatchIdRef.current)
      gpsWatchIdRef.current = null
    }
    gpsWatchActiveRef.current = false
    setIsNavigating(false)
    setIsFollowingUser(false)
    setOffRouteState(offRouteDetectorRef.current.reset())
    setArrivalState(arrivalDetectorRef.current.reset())
    rerouteAttemptedRef.current = false
    latestReliableGpsRef.current = null
    setRerouteInProgress(false)
  }

  const finishNavigationOnArrival = () => {
    navigationSessionRef.current += 1
    if (gpsWatchIdRef.current !== null) {
      navigator.geolocation?.clearWatch(gpsWatchIdRef.current)
      gpsWatchIdRef.current = null
    }
    gpsWatchActiveRef.current = false
    setIsNavigating(false)
    setIsFollowingUser(false)
    setOffRouteState(offRouteDetectorRef.current.reset())
    rerouteAttemptedRef.current = false
    setRerouteInProgress(false)
    setRerouteError('')
  }

  const requestUserLocation = () => {
    stopNavigation()
    setGpsError('')
    setGpsFix(null)
    setGpsPosition(null)
    setGpsAccuracy(null)
    latestReliableGpsRef.current = null
    latestRouteRef.current = null
    setRouteResult(null)

    if (!navigator.geolocation?.getCurrentPosition) {
      setGpsError('This browser does not support location services.')
      return
    }

    setGpsLoading(true)
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const position = [coords.latitude, coords.longitude]
        setGpsLoading(false)
        setGpsAccuracy(coords.accuracy)

        if (!isReliableGpsReading(coords, MAX_GPS_ACCURACY_METERS)) {
          setOffRouteState((current) => ({
            ...current,
            reliable: false,
            distanceMeters: null,
          }))
          setGpsError(
            `GPS accuracy is ${
              Number.isFinite(coords.accuracy)
                ? `about ${Math.round(coords.accuracy)} m`
                : 'unavailable'
            }, which is too imprecise. Move to a clearer location and try again (required accuracy: ${MAX_GPS_ACCURACY_METERS} m or better).`,
          )
          return
        }
        setGpsPosition({ position, accuracy: coords.accuracy })

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
        setGpsError(getGpsTrackingErrorMessage(error.code))
      },
      createGpsWatchOptions(GPS_WATCH_TIMEOUT_MS),
    )
  }

  const attemptReroute = (position, accuracyMeters) => {
    if (rerouteCoordinatorRef.current.inProgress) return

    const navigationSession = navigationSessionRef.current
    const currentRoute = latestRouteRef.current
    const destinationLocationId =
      currentRoute?.destinationLocationId ?? latestDestinationIdRef.current
    const destinationNodeId =
      currentRoute?.destinationNodeId ??
      graph?.resolveLocationNode(destinationLocationId)

    setRerouteError('')
    setRouteUpdatedMessage('')
    setRerouteInProgress(true)
    rerouteCoordinatorRef.current
      .run(() =>
        calculateReroute({
          graph,
          position,
          accuracyMeters,
          destinationNodeId,
          destinationLocationId,
          maximumAccuracyMeters: MAX_GPS_ACCURACY_METERS,
          maximumNetworkDistanceMeters: MAX_GPS_NETWORK_DISTANCE_METERS,
          offRouteDetector: offRouteDetectorRef.current,
        }),
      )
      .then((result) => {
        if (
          navigationSession !== navigationSessionRef.current ||
          !gpsWatchActiveRef.current
        ) {
          return
        }
        if (result.status === 'in-progress') return
        if (result.status !== 'success') {
          setRerouteError(result.message)
          return
        }

        latestRouteRef.current = result.route
        setRouteResult(result.route)
        setGpsPosition({
          position: [...position],
          accuracy: accuracyMeters,
        })
        setOffRouteState(offRouteDetectorRef.current.reset())
        rerouteAttemptedRef.current = false
        setRerouteError('')
        setRouteUpdatedMessage('Route updated. Follow the new directions.')
      })
      .catch((error) => {
        if (
          navigationSession !== navigationSessionRef.current ||
          !gpsWatchActiveRef.current
        ) {
          return
        }
        setRerouteError(
          `Rerouting failed: ${
            error instanceof Error ? error.message : 'unknown routing error'
          }`,
        )
      })
      .finally(() => setRerouteInProgress(false))
  }

  const startNavigation = () => {
    if (
      isNavigating ||
      gpsWatchActiveRef.current ||
      routeResult?.status !== 'found'
    ) {
      return
    }

    if (!navigator.geolocation?.watchPosition) {
      setGpsError('This browser does not support continuous location tracking.')
      return
    }

    setGpsError('')
    gpsWatchActiveRef.current = true
    navigationSessionRef.current += 1
    setIsNavigating(true)
    setIsFollowingUser(true)
    setOffRouteState(offRouteDetectorRef.current.reset())
    setArrivalState(arrivalDetectorRef.current.reset())

    try {
      gpsWatchIdRef.current = navigator.geolocation.watchPosition(
        ({ coords }) => {
          if (!gpsWatchActiveRef.current) return
          setGpsAccuracy(coords.accuracy)
          if (!isReliableGpsReading(coords, MAX_GPS_ACCURACY_METERS)) {
            setArrivalState((current) => ({
              ...current,
              reliable: false,
              distanceMeters: null,
            }))
            setOffRouteState((current) => ({
              ...current,
              reliable: false,
              distanceMeters: null,
            }))
            setGpsError(
              `Latest GPS accuracy is ${
                Number.isFinite(coords.accuracy)
                  ? `about ${Math.round(coords.accuracy)} m`
                  : 'unavailable'
              }. This reading is not being used to update your reliable map position (maximum accepted accuracy: ${MAX_GPS_ACCURACY_METERS} m).`,
            )
            return
          }

          const position = [coords.latitude, coords.longitude]
          latestReliableGpsRef.current = {
            position,
            accuracy: coords.accuracy,
          }
          setGpsPosition({ position, accuracy: coords.accuracy })
          const currentRoute = latestRouteRef.current
          const currentDestinationId =
              currentRoute?.destinationLocationId ??
              latestDestinationIdRef.current
          const destinationPosition = campusLocations.find(
              (location) => location.id === currentDestinationId,
          )?.position
          const detectionResults = updateNavigationDetectors({
              arrivalDetector: arrivalDetectorRef.current,
              offRouteDetector: offRouteDetectorRef.current,
              position,
              accuracyMeters: coords.accuracy,
              destinationPosition,
              routeCoordinates: currentRoute?.routeCoordinates,
              maximumAccuracyMeters: MAX_GPS_ACCURACY_METERS,
          })
          setArrivalState(detectionResults.arrival)
          if (detectionResults.arrival.arrived) {
              finishNavigationOnArrival()
              return
          }

          const nextOffRouteState = detectionResults.offRoute
          setOffRouteState(nextOffRouteState)
          if (nextOffRouteState.status === 'on-route') {
            rerouteAttemptedRef.current = false
            setRerouteError('')
          } else if (
            nextOffRouteState.status === 'off-route' &&
            !rerouteAttemptedRef.current
          ) {
            rerouteAttemptedRef.current = true
            attemptReroute(position, coords.accuracy)
          }
          const nearestNode = graph
            ? findNearestWalkingNode(graph, position)
            : null
          if (
            nearestNode &&
            nearestNode.distanceMeters > MAX_GPS_NETWORK_DISTANCE_METERS
          ) {
            setGpsError(
              `Your accurate GPS position is ${formatDistance(nearestNode.distanceMeters)} from the nearest mapped walking point. It is not being snapped to the network; your calculated route has not changed.`,
            )
            return
          }

          setGpsError('')
        },
        (error) => {
          if (!gpsWatchActiveRef.current) return
          setArrivalState((current) => ({
            ...current,
            reliable: false,
            distanceMeters: null,
          }))
          setOffRouteState((current) => ({
            ...current,
            reliable: false,
            distanceMeters: null,
          }))
          setGpsError(getGpsTrackingErrorMessage(error.code))
          if (error.code === 1) stopNavigation()
        },
        createGpsWatchOptions(GPS_WATCH_TIMEOUT_MS),
      )
    } catch (error) {
      gpsWatchActiveRef.current = false
      gpsWatchIdRef.current = null
      setIsNavigating(false)
      setGpsError(
        `Continuous location tracking could not start: ${
          error instanceof Error ? error.message : 'unknown geolocation error'
        }`,
      )
    }
  }

  const findRoute = () => {
    if (!graph || !gpsFix || !routeDestinationId) return

    setOffRouteState(offRouteDetectorRef.current.reset())
    setArrivalState(arrivalDetectorRef.current.reset())
    rerouteAttemptedRef.current = false
    setRerouteError('')
    setRouteUpdatedMessage('')
    const destinationNodeId = graph.resolveLocationNode(routeDestinationId)
    const networkRoute = findShortestPath(graph, gpsFix.nearestNode.nodeId, destinationNodeId)
    if (networkRoute.status !== 'found' && networkRoute.status !== 'same-node') {
      latestRouteRef.current = networkRoute
      setRouteResult(networkRoute)
      return
    }

    const route = {
      ...networkRoute,
      status: 'found',
      routeCoordinates: [gpsFix.position, ...networkRoute.routeCoordinates],
      totalDistanceMeters:
        networkRoute.totalDistanceMeters + gpsFix.nearestNode.distanceMeters,
      gpsSnapDistanceMeters: gpsFix.nearestNode.distanceMeters,
      destinationNodeId,
      destinationLocationId: routeDestinationId,
    }
    latestRouteRef.current = route
    setRouteResult(route)
  }

  const handleDestinationSelection = (event) => {
    stopNavigation()
    const destinationId = event.target.value
    latestDestinationIdRef.current = destinationId
    latestRouteRef.current = null
    setRouteDestinationId(destinationId)
    setRouteResult(null)
    setArrivalState(arrivalDetectorRef.current.reset())
    setRerouteError('')
    setRouteUpdatedMessage('')
  }

  const retryReroute = () => {
    const latestFix = latestReliableGpsRef.current
    if (!latestFix || latestFix.accuracy > MAX_GPS_ACCURACY_METERS) return

    rerouteAttemptedRef.current = true
    attemptReroute(latestFix.position, latestFix.accuracy)
  }

  const handleManualMapPan = () => setIsFollowingUser(false)

  const recenterOnUser = () => setIsFollowingUser(true)

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
            disabled={
              gpsLoading ||
              isNavigating ||
              walkingPathsLoading ||
              walkingPathsError
            }
            onClick={requestUserLocation}
            type="button"
          >
            <LocateFixed size={15} />
            {gpsLoading ? 'Getting Location…' : 'Use My Location'}
          </button>
          <button
            className="h-10 rounded-xl bg-blue-600 px-4 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            disabled={
              !gpsFix || !routeDestinationId || gpsLoading || isNavigating
            }
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
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {arrivalState.arrived ? (
                <span className="text-xs font-semibold text-emerald-800">
                  Navigation complete
                </span>
              ) : !isNavigating ? (
                <button
                  className="h-9 rounded-lg bg-violet-700 px-3 text-xs font-semibold text-white transition hover:bg-violet-800"
                  onClick={startNavigation}
                  type="button"
                >
                  Start Navigation
                </button>
              ) : (
                <>
                  <button
                    className="h-9 rounded-lg border border-rose-200 bg-white px-3 text-xs font-semibold text-rose-700 transition hover:bg-rose-50"
                    onClick={stopNavigation}
                    type="button"
                  >
                    Stop Navigation
                  </button>
                  {!isFollowingUser && (
                    <button
                      className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                      onClick={recenterOnUser}
                      type="button"
                    >
                      <Crosshair size={14} />
                      Recenter
                    </button>
                  )}
                  <span className="text-[11px] text-slate-600">
                    {gpsAccuracy === null
                      ? 'Waiting for GPS accuracy…'
                      : Number.isFinite(gpsAccuracy)
                        ? `Latest GPS accuracy: about ${Math.round(gpsAccuracy)} m`
                        : 'Latest GPS accuracy is unavailable'}
                  </span>
                </>
              )}
            </div>
            {arrivalState.arrived && (
              <p
                className="mt-3 rounded-lg bg-emerald-100 px-3 py-2 text-xs font-semibold text-emerald-900"
                role="status"
              >
                You have arrived at your destination!
              </p>
            )}
            {isNavigating && (
              <div
                aria-live="polite"
                className={`mt-3 rounded-lg px-3 py-2 text-[11px] font-medium ${
                  offRouteState.status === 'off-route' && offRouteState.reliable
                    ? 'bg-amber-100 text-amber-900'
                    : offRouteState.status === 'on-route' && offRouteState.reliable
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-slate-100 text-slate-700'
                }`}
                role="status"
              >
                {!offRouteState.reliable ? (
                  gpsAccuracy !== null &&
                  (!Number.isFinite(gpsAccuracy) ||
                    gpsAccuracy > MAX_GPS_ACCURACY_METERS) ? (
                    <>Checking location — GPS accuracy insufficient or unavailable (maximum accepted accuracy: {MAX_GPS_ACCURACY_METERS} m).</>
                  ) : (
                    <>Checking location… waiting for a reliable GPS reading.</>
                  )
                ) : offRouteState.status === 'off-route' ? (
                  <>
                    <span className="block font-semibold">
                      You appear to have moved away from your planned route.
                    </span>
                    <span className="mt-0.5 block">
                      About {formatDistance(offRouteState.distanceMeters)} from the planned route.
                    </span>
                  </>
                ) : offRouteState.status === 'checking' ? (
                  <>Checking location… confirming whether the position is off route.</>
                ) : (
                  <>
                    On route
                    {Number.isFinite(offRouteState.distanceMeters) &&
                      ` · ${formatDistance(offRouteState.distanceMeters)} from planned route`}
                  </>
                )}
              </div>
            )}
            {routeUpdatedMessage && (
              <p
                className="mt-2 text-[11px] font-semibold text-emerald-800"
                role="status"
              >
                {routeUpdatedMessage}
              </p>
            )}
            {rerouteError && (
              <div className="mt-2 rounded-lg bg-rose-50 px-3 py-2 text-[11px] text-rose-800" role="alert">
                <p>{rerouteError}</p>
                <button
                  className="mt-2 h-8 rounded-md border border-rose-200 bg-white px-2.5 font-semibold text-rose-800 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={
                    rerouteInProgress ||
                    !isNavigating ||
                    !gpsPosition ||
                    gpsPosition.accuracy > MAX_GPS_ACCURACY_METERS
                  }
                  onClick={retryReroute}
                  type="button"
                >
                  {rerouteInProgress ? 'Updating Route…' : 'Try Rerouting Again'}
                </button>
              </div>
            )}
            {routeResult.usesProvisionalConnections && (
              <p className="mt-1.5 text-[11px] leading-relaxed text-amber-800">
                This route uses approximate building connections that have not been verified as accessible paths.
              </p>
            )}
            <p className="mt-1.5 text-[11px] leading-relaxed text-amber-800">
              The GPS start is joined to the mapped network with a {formatDistance(routeResult.gpsSnapDistanceMeters)} straight-line connection. This segment is approximate and may not follow a physical path.
            </p>
            <p className="mt-3 text-[10px] leading-relaxed text-slate-500">
              Instructions are approximate and based on mapped route geometry; verify the path as you walk.
            </p>
            {navigationInstructions.length > 0 && (
              <ol aria-label="Walking instructions" className="mt-3 space-y-2">
                {navigationInstructions.map((instruction, index) => {
                  const DirectionIcon = {
                    continue: ArrowUp,
                    'bear-left': ArrowUpLeft,
                    'turn-left': CornerUpLeft,
                    'bear-right': ArrowUpRight,
                    'turn-right': CornerUpRight,
                    'u-turn': RotateCcw,
                    'provisional-connection': AlertTriangle,
                    'gps-snap': AlertTriangle,
                    arrival: MapPin,
                  }[instruction.type]
                  const isArrival = instruction.type === 'arrival'

                  return (
                    <li
                      key={`${instruction.type}-${index}`}
                      className="flex items-start gap-2 rounded-lg bg-white/80 px-2.5 py-2 text-[11px] text-slate-700"
                    >
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-violet-100 text-[10px] font-bold text-violet-800">
                        {index + 1}
                      </span>
                      <DirectionIcon
                        aria-hidden="true"
                        className={`mt-0.5 shrink-0 ${
                          instruction.type.includes('provisional') || instruction.type === 'gps-snap'
                            ? 'text-amber-600'
                            : 'text-violet-700'
                        }`}
                        size={15}
                      />
                      <span className="min-w-0 flex-1 leading-relaxed">
                        {instruction.text}
                      </span>
                      {!isArrival && (
                        <span className="shrink-0 font-semibold text-slate-500">
                          {formatDistance(instruction.distanceMeters)}
                        </span>
                      )}
                    </li>
                  )
                })}
              </ol>
            )}
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
            isTracking={isNavigating}
            isFollowing={isFollowingUser}
            onManualPan={handleManualMapPan}
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
