import { findNearestWalkingNode } from './nearestWalkingNode.js'
import { findShortestPath } from './shortestPath.js'

function isPosition(position) {
  return (
    Array.isArray(position) &&
    position.length === 2 &&
    position.every(Number.isFinite)
  )
}

export function calculateReroute({
  graph,
  position,
  accuracyMeters,
  destinationNodeId,
  destinationLocationId,
  maximumAccuracyMeters,
  maximumNetworkDistanceMeters,
  offRouteDetector,
  nearestNodeFinder = findNearestWalkingNode,
  shortestPathFinder = findShortestPath,
}) {
  if (
    !isPosition(position) ||
    !Number.isFinite(accuracyMeters) ||
    accuracyMeters < 0 ||
    accuracyMeters > maximumAccuracyMeters
  ) {
    return {
      status: 'failed',
      reason: 'accuracy',
      message: `Rerouting needs a reliable GPS position with accuracy of ${maximumAccuracyMeters} m or better.`,
    }
  }

  const nearestNode = nearestNodeFinder(graph, position)
  if (!nearestNode) {
    return {
      status: 'failed',
      reason: 'no-network',
      message: 'Rerouting is unavailable because no walking-network point could be found.',
    }
  }

  if (nearestNode.distanceMeters > maximumNetworkDistanceMeters) {
    return {
      status: 'failed',
      reason: 'too-far-from-network',
      distanceMeters: nearestNode.distanceMeters,
      message: `Rerouting is unavailable: your GPS position is ${Math.round(nearestNode.distanceMeters)} m from the nearest mapped walking point, beyond the ${maximumNetworkDistanceMeters} m safe connection limit. No connection was made.`,
    }
  }

  const networkRoute = shortestPathFinder(
    graph,
    nearestNode.nodeId,
    destinationNodeId,
  )
  if (!['found', 'same-node'].includes(networkRoute.status)) {
    return {
      status: 'failed',
      reason: 'no-route',
      message: 'Rerouting failed because no walking route is available to the selected destination.',
    }
  }

  const route = {
    ...networkRoute,
    status: 'found',
    routeCoordinates: [position, ...networkRoute.routeCoordinates],
    totalDistanceMeters:
      networkRoute.totalDistanceMeters + nearestNode.distanceMeters,
    gpsSnapDistanceMeters: nearestNode.distanceMeters,
    destinationNodeId,
    destinationLocationId,
  }
  route.usesProvisionalConnections = route.edges.some(
    (edge) => edge.status === 'provisional',
  )
  offRouteDetector?.reset()

  return {
    status: 'success',
    route,
    nearestNode,
    destinationNodeId,
    destinationLocationId,
  }
}

export function createRerouteCoordinator() {
  let inProgress = false

  return {
    get inProgress() {
      return inProgress
    },
    async run(calculate) {
      if (inProgress) return { status: 'in-progress' }

      inProgress = true
      try {
        return await calculate()
      } finally {
        inProgress = false
      }
    },
  }
}
