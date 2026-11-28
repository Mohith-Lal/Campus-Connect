const EARTH_RADIUS_METERS = 6371008.8

export const DEFAULT_OFF_ROUTE_THRESHOLDS = {
  offRouteDistanceMeters: 20,
  recoveryDistanceMeters: 12,
  consecutiveOffRouteReadings: 3,
  consecutiveRecoveryReadings: 2,
}

function isPosition(position) {
  return (
    Array.isArray(position) &&
    position.length === 2 &&
    position.every(Number.isFinite)
  )
}

function projectPosition([latitude, longitude], referenceLatitudeRadians) {
  const latitudeRadians = (latitude * Math.PI) / 180
  const longitudeRadians = (longitude * Math.PI) / 180

  return [
    EARTH_RADIUS_METERS * longitudeRadians * Math.cos(referenceLatitudeRadians),
    EARTH_RADIUS_METERS * latitudeRadians,
  ]
}

function distanceToSegment(point, start, end) {
  const referenceLatitudeRadians = (point[0] * Math.PI) / 180
  const projectedPoint = projectPosition(point, referenceLatitudeRadians)
  const projectedStart = projectPosition(start, referenceLatitudeRadians)
  const projectedEnd = projectPosition(end, referenceLatitudeRadians)
  const segmentX = projectedEnd[0] - projectedStart[0]
  const segmentY = projectedEnd[1] - projectedStart[1]
  const segmentLengthSquared = segmentX ** 2 + segmentY ** 2
  const fraction =
    segmentLengthSquared === 0
      ? 0
      : Math.max(
          0,
          Math.min(
            1,
            ((projectedPoint[0] - projectedStart[0]) * segmentX +
              (projectedPoint[1] - projectedStart[1]) * segmentY) /
              segmentLengthSquared,
          ),
        )
  const nearestX = projectedStart[0] + fraction * segmentX
  const nearestY = projectedStart[1] + fraction * segmentY

  return Math.hypot(projectedPoint[0] - nearestX, projectedPoint[1] - nearestY)
}

export function distanceToRouteMeters(position, routeCoordinates) {
  if (
    !isPosition(position) ||
    !Array.isArray(routeCoordinates) ||
    routeCoordinates.length === 0 ||
    !routeCoordinates.every(isPosition)
  ) {
    return null
  }

  if (routeCoordinates.length === 1) {
    return distanceToSegment(position, routeCoordinates[0], routeCoordinates[0])
  }

  return routeCoordinates.reduce((minimum, start, index) => {
    if (index === routeCoordinates.length - 1) return minimum

    return Math.min(
      minimum,
      distanceToSegment(position, start, routeCoordinates[index + 1]),
    )
  }, Infinity)
}

export function createOffRouteDetector(thresholdOverrides = {}) {
  const thresholds = {
    ...DEFAULT_OFF_ROUTE_THRESHOLDS,
    ...thresholdOverrides,
  }
  let status = 'checking'
  let offRouteReadings = 0
  let recoveryReadings = 0

  const reset = () => {
    status = 'checking'
    offRouteReadings = 0
    recoveryReadings = 0
    return {
      status,
      reliable: false,
      distanceMeters: null,
    }
  }

  const update = (position, accuracyMeters, routeCoordinates, maximumAccuracyMeters) => {
    if (
      !Number.isFinite(accuracyMeters) ||
      accuracyMeters > maximumAccuracyMeters
    ) {
      return {
        status,
        reliable: false,
        distanceMeters: null,
      }
    }

    const distanceMeters = distanceToRouteMeters(position, routeCoordinates)
    if (distanceMeters === null) {
      status = 'checking'
      offRouteReadings = 0
      recoveryReadings = 0
      return {
        status,
        reliable: false,
        distanceMeters: null,
      }
    }

    if (status === 'off-route') {
      if (distanceMeters <= thresholds.recoveryDistanceMeters) {
        recoveryReadings += 1
        if (recoveryReadings >= thresholds.consecutiveRecoveryReadings) {
          status = 'on-route'
          offRouteReadings = 0
          recoveryReadings = 0
        }
      } else {
        recoveryReadings = 0
      }
    } else if (distanceMeters > thresholds.offRouteDistanceMeters) {
      offRouteReadings += 1
      recoveryReadings = 0
      if (offRouteReadings >= thresholds.consecutiveOffRouteReadings) {
        status = 'off-route'
        offRouteReadings = 0
      } else {
        status = 'checking'
      }
    } else {
      status = 'on-route'
      offRouteReadings = 0
      recoveryReadings = 0
    }

    return {
      status,
      reliable: true,
      distanceMeters,
    }
  }

  return { update, reset }
}
