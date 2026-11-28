const EARTH_RADIUS_METERS = 6371008.8

function isPosition(position) {
  return (
    Array.isArray(position) &&
    position.length === 2 &&
    position.every(Number.isFinite)
  )
}

function distanceBetween([lat1, lon1], [lat2, lon2]) {
  const toRadians = (degrees) => (degrees * Math.PI) / 180
  const phi1 = toRadians(lat1)
  const phi2 = toRadians(lat2)
  const deltaPhi = toRadians(lat2 - lat1)
  const deltaLambda = toRadians(lon2 - lon1)
  const a =
    Math.sin(deltaPhi / 2) ** 2 +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) ** 2

  return 2 * EARTH_RADIUS_METERS * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export function createArrivalDetector({
  arrivalRadiusMeters,
  consecutiveReadingsRequired,
}) {
  let consecutiveReadings = 0
  let arrived = false
  let currentDestinationPosition = null

  const reset = () => {
    consecutiveReadings = 0
    arrived = false
    currentDestinationPosition = null
    return {
      arrived,
      reliable: false,
      distanceMeters: null,
      consecutiveReadings,
    }
  }

  const update = (
    position,
    accuracyMeters,
    destinationPosition,
    maximumAccuracyMeters,
  ) => {
    if (
      !isPosition(position) ||
      !isPosition(destinationPosition) ||
      !Number.isFinite(accuracyMeters) ||
      accuracyMeters < 0 ||
      accuracyMeters > maximumAccuracyMeters
    ) {
      return {
        arrived,
        reliable: false,
        distanceMeters: null,
        consecutiveReadings,
      }
    }

    if (
      currentDestinationPosition &&
      (currentDestinationPosition[0] !== destinationPosition[0] ||
        currentDestinationPosition[1] !== destinationPosition[1])
    ) {
      consecutiveReadings = 0
      arrived = false
    }
    currentDestinationPosition = [...destinationPosition]

    const distanceMeters = distanceBetween(position, destinationPosition)
    if (arrived) {
      return {
        arrived,
        reliable: true,
        distanceMeters,
        consecutiveReadings,
      }
    }

    if (distanceMeters <= arrivalRadiusMeters) {
      consecutiveReadings += 1
      arrived = consecutiveReadings >= consecutiveReadingsRequired
    } else {
      consecutiveReadings = 0
    }

    return {
      arrived,
      reliable: true,
      distanceMeters,
      consecutiveReadings,
    }
  }

  return { update, reset }
}

export function updateNavigationDetectors({
  arrivalDetector,
  offRouteDetector,
  position,
  accuracyMeters,
  destinationPosition,
  routeCoordinates,
  maximumAccuracyMeters,
}) {
  const arrival = arrivalDetector.update(
    position,
    accuracyMeters,
    destinationPosition,
    maximumAccuracyMeters,
  )

  if (arrival.arrived) {
    return { arrival, offRoute: null }
  }

  return {
    arrival,
    offRoute: offRouteDetector.update(
      position,
      accuracyMeters,
      routeCoordinates,
      maximumAccuracyMeters,
    ),
  }
}
