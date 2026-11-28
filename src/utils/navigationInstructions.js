const EARTH_RADIUS_METERS = 6371008.8

const DEFAULT_THRESHOLDS = {
  straightDegrees: 20,
  bearDegrees: 45,
  uTurnDegrees: 150,
  minimumTurnSegmentMeters: 3,
}

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

function bearingBetween([lat1, lon1], [lat2, lon2]) {
  const toRadians = (degrees) => (degrees * Math.PI) / 180
  const toDegrees = (radians) => (radians * 180) / Math.PI
  const phi1 = toRadians(lat1)
  const phi2 = toRadians(lat2)
  const deltaLambda = toRadians(lon2 - lon1)
  const y = Math.sin(deltaLambda) * Math.cos(phi2)
  const x =
    Math.cos(phi1) * Math.sin(phi2) -
    Math.sin(phi1) * Math.cos(phi2) * Math.cos(deltaLambda)

  return (toDegrees(Math.atan2(y, x)) + 360) % 360
}

function bearingChange(fromBearing, toBearing) {
  return ((toBearing - fromBearing + 540) % 360) - 180
}

function classifyTurn(change, thresholds) {
  const magnitude = Math.abs(change)
  if (magnitude <= thresholds.straightDegrees) return 'continue'
  if (magnitude <= thresholds.bearDegrees) {
    return change < 0 ? 'bear-left' : 'bear-right'
  }
  if (magnitude > thresholds.uTurnDegrees) return 'u-turn'
  return change < 0 ? 'turn-left' : 'turn-right'
}

function makeInstruction(type, distanceMeters, details = {}) {
  const labels = {
    continue: 'Continue straight',
    'bear-left': 'Bear left',
    'turn-left': 'Turn left',
    'bear-right': 'Bear right',
    'turn-right': 'Turn right',
    'u-turn': 'Make a U-turn',
    'provisional-connection':
      'Use approximate building connector (not a verified walking path)',
    'gps-snap':
      'GPS location to mapped network (approximate straight-line connection; not a verified walking path)',
    arrival: 'You have reached your destination',
  }

  return {
    type,
    text: labels[type],
    distanceMeters,
    ...details,
  }
}

function validGpsPosition(gpsStartPosition) {
  return isPosition(
    Array.isArray(gpsStartPosition)
      ? gpsStartPosition
      : gpsStartPosition?.position,
  )
    ? Array.isArray(gpsStartPosition)
      ? gpsStartPosition
      : gpsStartPosition.position
    : null
}

export function generateNavigationInstructions(
  route,
  { gpsStartPosition, thresholds: thresholdOverrides = {} } = {},
) {
  if (
    !route ||
    !['found', 'same-node'].includes(route.status) ||
    !Array.isArray(route.routeCoordinates) ||
    route.routeCoordinates.length === 0 ||
    !route.routeCoordinates.every(isPosition)
  ) {
    return []
  }

  const thresholds = { ...DEFAULT_THRESHOLDS, ...thresholdOverrides }
  const coordinates = route.routeCoordinates.map((position) => [...position])
  const gpsPosition = validGpsPosition(gpsStartPosition)
  const firstPosition = coordinates[0]
  const hasGpsStartPosition =
    gpsPosition &&
    distanceBetween(gpsPosition, firstPosition) > 0.01
  if (hasGpsStartPosition) coordinates.unshift(gpsPosition)

  if (route.routeNodeIds?.length === 1 && route.edges?.length === 0) {
    return [makeInstruction('arrival', 0)]
  }

  const edges = Array.isArray(route.edges) ? route.edges : []
  const gpsSnapDistance = Number.isFinite(route.gpsSnapDistanceMeters)
    ? route.gpsSnapDistanceMeters
    : Number.isFinite(gpsStartPosition?.distanceMeters)
      ? gpsStartPosition.distanceMeters
      : hasGpsStartPosition
        ? distanceBetween(gpsPosition, firstPosition)
        : null
  const gpsSegmentOffset =
    gpsSnapDistance !== null &&
    coordinates.length === edges.length + 2
      ? 1
      : 0

  const segments = []
  for (let index = 0; index < coordinates.length - 1; index += 1) {
    const edgeIndex = index - gpsSegmentOffset
    const edge = edges[edgeIndex]
    const isGpsSnap = index === 0 && gpsSegmentOffset === 1
    const edgeDistance =
      edge && Number.isFinite(edge.weightMeters) && edge.weightMeters >= 0
        ? edge.weightMeters
        : null

    segments.push({
      bearing: bearingBetween(coordinates[index], coordinates[index + 1]),
      distanceMeters: isGpsSnap
        ? gpsSnapDistance
        : (edgeDistance ?? distanceBetween(coordinates[index], coordinates[index + 1])),
      isGpsSnap,
      isProvisional: edge?.status === 'provisional',
    })
  }

  const instructions = []
  let current = null
  const flushCurrent = () => {
    if (current) instructions.push(makeInstruction(current.type, current.distanceMeters))
    current = null
  }

  for (let index = 0; index < segments.length; index += 1) {
    const segment = segments[index]

    if (segment.isGpsSnap || segment.isProvisional) {
      flushCurrent()
      const type = segment.isGpsSnap ? 'gps-snap' : 'provisional-connection'
      const previous = instructions[instructions.length - 1]
      if (previous?.type === type) {
        previous.distanceMeters += segment.distanceMeters
      } else {
        instructions.push(makeInstruction(type, segment.distanceMeters))
      }
      continue
    }

    if (!current || index === 0 || segments[index - 1].isGpsSnap || segments[index - 1].isProvisional) {
      current = { type: 'continue', distanceMeters: segment.distanceMeters }
      continue
    }

    const previousSegment = segments[index - 1]
    const canDetectTurn =
      previousSegment.distanceMeters >= thresholds.minimumTurnSegmentMeters &&
      segment.distanceMeters >= thresholds.minimumTurnSegmentMeters
    const turnType = canDetectTurn
      ? classifyTurn(
          bearingChange(previousSegment.bearing, segment.bearing),
          thresholds,
        )
      : 'continue'

    if (turnType === 'continue') {
      current.distanceMeters += segment.distanceMeters
    } else {
      flushCurrent()
      current = { type: turnType, distanceMeters: segment.distanceMeters }
    }
  }

  flushCurrent()
  instructions.push(makeInstruction('arrival', 0))
  return instructions
}
