import { campusAccessPoints } from './campusConnections.js'
import campusConnections from './campusConnections.js'
import { getStudentWalkingPaths } from './walkingPaths.js'

const EARTH_RADIUS_METERS = 6371008.8
const JUNCTION_TOLERANCE_METERS = 0.05

function haversineDistance([lat1, lon1], [lat2, lon2]) {
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

function coordinateKey([lat, lon]) {
  return `${lat.toFixed(7)},${lon.toFixed(7)}`
}

function isLatLng(position) {
  return (
    Array.isArray(position) &&
    position.length === 2 &&
    position.every((coordinate) => Number.isFinite(coordinate))
  )
}

function createLocalProjection(coordinates) {
  const meanLatitude =
    coordinates.reduce((sum, [, latitude]) => sum + latitude, 0) /
    coordinates.length
  const latitudeRadians = (meanLatitude * Math.PI) / 180
  const xScale = EARTH_RADIUS_METERS * Math.cos(latitudeRadians) * (Math.PI / 180)
  const yScale = EARTH_RADIUS_METERS * (Math.PI / 180)

  return {
    project: ([longitude, latitude]) => [longitude * xScale, latitude * yScale],
    unproject: ([x, y]) => [x / xScale, y / yScale],
  }
}

function projectPointOnSegment(point, start, end) {
  const dx = end[0] - start[0]
  const dy = end[1] - start[1]
  const lengthSquared = dx * dx + dy * dy
  const fraction =
    lengthSquared === 0
      ? 0
      : Math.max(
          0,
          Math.min(
            1,
            ((point[0] - start[0]) * dx + (point[1] - start[1]) * dy) /
              lengthSquared,
          ),
        )
  const projected = [start[0] + fraction * dx, start[1] + fraction * dy]

  return {
    fraction,
    point: projected,
    distance: Math.hypot(point[0] - projected[0], point[1] - projected[1]),
  }
}

function splitFraction(point, start, end, project) {
  const projected = projectPointOnSegment(project(point), project(start), project(end))
  if (projected.distance > JUNCTION_TOLERANCE_METERS) return null
  return projected.fraction
}

function getConnectedComponents(nodes, adjacency) {
  const visited = new Set()
  const components = []

  for (const nodeId of nodes.keys()) {
    if (visited.has(nodeId)) continue

    const component = []
    const pending = [nodeId]
    visited.add(nodeId)

    while (pending.length > 0) {
      const current = pending.pop()
      component.push(current)

      for (const { nodeId: neighborId } of adjacency.get(current)) {
        if (visited.has(neighborId)) continue
        visited.add(neighborId)
        pending.push(neighborId)
      }
    }

    components.push(component)
  }

  return components
}

export function buildWalkingGraph(
  featureCollection,
  locations,
  connections = campusConnections,
  accessPoints = campusAccessPoints,
) {
  if (!Array.isArray(featureCollection?.features)) {
    throw new TypeError('Walking graph requires a GeoJSON feature collection.')
  }

  const retainedPaths = getStudentWalkingPaths(featureCollection)
  const pathCoordinates = retainedPaths.features.flatMap(
    (feature) => feature.geometry.coordinates,
  )
  const { project, unproject } = createLocalProjection(pathCoordinates)
  const pathVertices = pathCoordinates.map((coordinate) => coordinate)
  const nodes = new Map()
  const edges = []
  const adjacency = new Map()
  const locationNodes = new Map()
  const addNode = (position, role, wayId) => {
    const id = coordinateKey(position)
    let node = nodes.get(id)

    if (!node) {
      node = { id, position, roles: new Set(), wayIds: new Set() }
      nodes.set(id, node)
      adjacency.set(id, [])
    }

    node.roles.add(role)
    if (wayId) node.wayIds.add(wayId)
    return node
  }
  const addEdge = (from, to, properties) => {
    if (from.id === to.id) return

    const weightMeters = haversineDistance(from.position, to.position)
    if (!Number.isFinite(weightMeters) || weightMeters <= 0) {
      throw new Error('Walking graph edges must have positive finite weights.')
    }

    const edge = {
      id: `edge-${edges.length + 1}`,
      from: from.id,
      to: to.id,
      weightMeters,
      ...properties,
    }
    edges.push(edge)
    adjacency.get(from.id).push({ nodeId: to.id, edge })
    adjacency.get(to.id).push({ nodeId: from.id, edge })
  }

  const connectionProjections = []
  for (const location of locations) {
    const networkPosition = connections[location.id]
    if (!networkPosition || !isLatLng(location.position) || !isLatLng(networkPosition)) {
      continue
    }

    const projectedPosition = [networkPosition[1], networkPosition[0]]
    const projectedXY = project(projectedPosition)
    let nearest = null

    retainedPaths.features.forEach((feature, featureIndex) => {
      const line = feature.geometry.coordinates
      for (let segmentIndex = 0; segmentIndex < line.length - 1; segmentIndex += 1) {
        const start = project(line[segmentIndex])
        const end = project(line[segmentIndex + 1])
        const projection = projectPointOnSegment(projectedXY, start, end)

        if (!nearest || projection.distance < nearest.distance) {
          const [longitude, latitude] = unproject(projection.point)
          nearest = {
            featureIndex,
            segmentIndex,
            distance: projection.distance,
            position: [latitude, longitude],
          }
        }
      }
    })

    if (nearest) {
      connectionProjections.push({ location, networkPosition, nearest })
    }
  }

  const splitPoints = new Map()
  for (const connection of connectionProjections) {
    const key = `${connection.nearest.featureIndex}:${connection.nearest.segmentIndex}`
    const points = splitPoints.get(key) ?? []
    points.push([
      connection.nearest.position[1],
      connection.nearest.position[0],
    ])
    splitPoints.set(key, points)
  }

  retainedPaths.features.forEach((feature, featureIndex) => {
    const line = feature.geometry.coordinates

    for (let segmentIndex = 0; segmentIndex < line.length - 1; segmentIndex += 1) {
      const start = line[segmentIndex]
      const end = line[segmentIndex + 1]
      const candidates = [
        { position: start, fraction: 0 },
        { position: end, fraction: 1 },
      ]

      for (const vertex of pathVertices) {
        const fraction = splitFraction(vertex, start, end, project)
        if (fraction !== null) candidates.push({ position: vertex, fraction })
      }

      for (const position of splitPoints.get(`${featureIndex}:${segmentIndex}`) ?? []) {
        const fraction = splitFraction(position, start, end, project)
        if (fraction !== null) candidates.push({ position, fraction })
      }

      candidates.sort((a, b) => a.fraction - b.fraction)
      const uniqueCandidates = candidates.filter(
        (candidate, index) =>
          index === 0 ||
          coordinateKey(candidate.position) !==
            coordinateKey(candidates[index - 1].position),
      )

      for (let index = 1; index < uniqueCandidates.length; index += 1) {
        const fromPosition = uniqueCandidates[index - 1].position
        const toPosition = uniqueCandidates[index].position
        const from = addNode([fromPosition[1], fromPosition[0]], 'walking-path', feature.id)
        const to = addNode([toPosition[1], toPosition[0]], 'walking-path', feature.id)
        addEdge(from, to, {
          kind: 'walking-path',
          status: 'network',
          wayId: feature.id,
        })
      }
    }
  })

  for (const { location, networkPosition, nearest } of connectionProjections) {
    const locationNode = addNode(location.position, 'campus-location')
    const connectionNode = addNode(networkPosition, 'provisional-connection')
    const networkNode = addNode(nearest.position, 'walking-path')

    locationNodes.set(location.id, locationNode.id)
    addEdge(locationNode, connectionNode, {
      kind: 'campus-connection',
      status: 'provisional',
      locationId: location.id,
    })
    addEdge(connectionNode, networkNode, {
      kind: 'network-snap',
      status: 'provisional',
      locationId: location.id,
    })
  }

  const locationAccessPoints = { ...accessPoints }
  const graph = {
    nodes,
    edges,
    adjacency,
    locationNodes,
    locationAccessPoints,
    components: getConnectedComponents(nodes, adjacency),
    resolveLocationNode(locationId) {
      const visited = new Set()
      let currentId = locationId

      while (locationAccessPoints[currentId]) {
        if (visited.has(currentId)) return null
        visited.add(currentId)
        currentId = locationAccessPoints[currentId]
      }

      return locationNodes.get(currentId) ?? null
    },
  }

  return graph
}
