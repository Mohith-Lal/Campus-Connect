import assert from 'node:assert/strict'
import { test } from 'node:test'
import { findShortestPath } from './shortestPath.js'
import {
  calculateReroute,
  createRerouteCoordinator,
} from './automaticRerouting.js'
import { createOffRouteDetector } from './offRouteDetection.js'

function createGraph(includeProvisional = false, connectDestination = true) {
  const start = [13.13, 77.56]
  const destination = [13.131, 77.56]
  const walkingRoles = new Set(['walking-path'])
  const nodes = new Map([
    ['walking-start', { id: 'walking-start', position: start, roles: walkingRoles }],
    [
      'walking-destination',
      { id: 'walking-destination', position: destination, roles: walkingRoles },
    ],
  ])
  const adjacency = new Map([
    ['walking-start', []],
    ['walking-destination', []],
  ])
  const edges = []

  if (connectDestination) {
    const edge = {
      id: 'walking-edge',
      from: 'walking-start',
      to: 'walking-destination',
      weightMeters: 100,
      status: includeProvisional ? 'provisional' : 'network',
    }
    edges.push(edge)
    adjacency.get('walking-start').push({ nodeId: 'walking-destination', edge })
    adjacency.get('walking-destination').push({ nodeId: 'walking-start', edge })
  }

  return { nodes, adjacency, edges }
}

function reroute(graph, overrides = {}) {
  return calculateReroute({
    graph,
    position: [13.13, 77.56],
    accuracyMeters: 5,
    destinationNodeId: 'walking-destination',
    destinationLocationId: 'library',
    maximumAccuracyMeters: 30,
    maximumNetworkDistanceMeters: 30,
    ...overrides,
  })
}

test('calculates a successful reroute from a reliable position', () => {
  const result = reroute(createGraph())

  assert.equal(result.status, 'success')
  assert.equal(result.route.status, 'found')
  assert.equal(result.route.routeCoordinates.length, 3)
  assert.equal(result.route.totalDistanceMeters, 100)
  assert.equal(result.route.gpsSnapDistanceMeters, 0)
})

test('marks reroutes that use provisional connections', () => {
  const result = reroute(createGraph(true))

  assert.equal(result.status, 'success')
  assert.equal(result.route.usesProvisionalConnections, true)
  assert.equal(result.route.edges[0].status, 'provisional')
})

test('refuses to reroute with unreliable GPS accuracy', () => {
  const result = reroute(createGraph(), { accuracyMeters: 31 })

  assert.equal(result.status, 'failed')
  assert.equal(result.reason, 'accuracy')
})

test('refuses to snap positions beyond the network threshold', () => {
  const result = reroute(createGraph(), {
    position: [13.1304, 77.56],
    maximumNetworkDistanceMeters: 30,
  })

  assert.equal(result.status, 'failed')
  assert.equal(result.reason, 'too-far-from-network')
  assert.match(result.message, /No connection was made/)
})

test('returns a clear failure when no path reaches the preserved destination', () => {
  const result = reroute(createGraph(false, false))

  assert.equal(result.status, 'failed')
  assert.equal(result.reason, 'no-route')
})

test('prevents duplicate reroute attempts while one is in progress', async () => {
  const coordinator = createRerouteCoordinator()
  let finishFirst
  const first = coordinator.run(
    () => new Promise((resolve) => {
      finishFirst = resolve
    }),
  )
  const duplicate = await coordinator.run(() => {
    throw new Error('A duplicate calculation must not run')
  })

  assert.equal(duplicate.status, 'in-progress')
  assert.equal(coordinator.inProgress, true)
  finishFirst({ status: 'success' })
  assert.deepEqual(await first, { status: 'success' })
  assert.equal(coordinator.inProgress, false)
})

test('preserves the original destination when calculating the new route', () => {
  const graph = createGraph()
  const result = calculateReroute({
    graph,
    position: [13.13, 77.56],
    accuracyMeters: 4,
    destinationNodeId: 'walking-destination',
    destinationLocationId: 'original-campus-destination',
    maximumAccuracyMeters: 30,
    maximumNetworkDistanceMeters: 30,
    shortestPathFinder: (actualGraph, startId, destinationId) => {
      assert.equal(destinationId, 'walking-destination')
      return findShortestPath(actualGraph, startId, destinationId)
    },
  })

  assert.equal(result.destinationLocationId, 'original-campus-destination')
  assert.equal(result.route.destinationLocationId, 'original-campus-destination')
})

test('resets off-route detection after successful rerouting only', () => {
  const detector = createOffRouteDetector()
  const routeCoordinates = [
    [13.13, 77.56],
    [13.13, 77.562],
  ]
  detector.update([13.1303, 77.561], 5, routeCoordinates, 30)
  detector.update([13.1303, 77.561], 5, routeCoordinates, 30)
  detector.update([13.1303, 77.561], 5, routeCoordinates, 30)

  const result = reroute(createGraph(), { offRouteDetector: detector })
  assert.equal(result.status, 'success')
  assert.equal(
    detector.update([13.1303, 77.561], 5, routeCoordinates, 30).status,
    'checking',
  )
})

test('does not reset off-route detection when rerouting fails', () => {
  const detector = createOffRouteDetector()
  const routeCoordinates = [
    [13.13, 77.56],
    [13.13, 77.562],
  ]
  detector.update([13.1303, 77.561], 5, routeCoordinates, 30)
  detector.update([13.1303, 77.561], 5, routeCoordinates, 30)
  detector.update([13.1303, 77.561], 5, routeCoordinates, 30)

  const result = reroute(createGraph(false, false), {
    offRouteDetector: detector,
  })
  assert.equal(result.status, 'failed')
  assert.equal(
    detector.update([13.1303, 77.561], 5, routeCoordinates, 30).status,
    'off-route',
  )
})
