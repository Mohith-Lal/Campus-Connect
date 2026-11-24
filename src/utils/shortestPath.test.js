import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'
import campusLocations from '../data/campusLocations.js'
import { buildWalkingGraph } from '../data/walkingGraph.js'
import { findShortestPath } from './shortestPath.js'

function createGraph(edges, positions = {}) {
  const nodes = new Map()
  const adjacency = new Map()
  const graphEdges = []

  const addNode = (nodeId) => {
    if (!nodes.has(nodeId)) {
      nodes.set(nodeId, {
        id: nodeId,
        position: positions[nodeId] ?? [0, nodes.size * 0.001],
      })
      adjacency.set(nodeId, [])
    }
  }

  for (const [from, to, weightMeters, status = 'network'] of edges) {
    addNode(from)
    addNode(to)
    const edge = {
      id: `edge-${graphEdges.length + 1}`,
      from,
      to,
      weightMeters,
      status,
    }
    graphEdges.push(edge)
    adjacency.get(from).push({ nodeId: to, edge })
    adjacency.get(to).push({ nodeId: from, edge })
  }

  return { nodes, adjacency, edges: graphEdges }
}

test('finds a route in the campus graph including provisional building links', async () => {
  const featureCollection = JSON.parse(
    await readFile(new URL('../../public/data/campus-walking-paths.geojson', import.meta.url)),
  )
  const graph = buildWalkingGraph(featureCollection, campusLocations)
  const start = graph.resolveLocationNode('sir-c-v-raman-block')
  const destination = graph.resolveLocationNode('car-parking')
  const route = findShortestPath(graph, start, destination)

  assert.equal(route.status, 'found')
  assert.ok(route.routeNodeIds.length > 1)
  assert.equal(route.routeCoordinates.length, route.routeNodeIds.length)
  assert.ok(route.usesProvisionalConnections)
  assert.equal(
    route.totalDistanceMeters,
    route.edges.reduce((total, edge) => total + edge.weightMeters, 0),
  )
  assert.ok(
    route.edges.every(
      (edge) => edge.traversalFrom && edge.traversalTo && edge.weightMeters > 0,
    ),
  )
})

test('selects the lower-weight route when alternatives exist', () => {
  const graph = createGraph([
    ['start', 'long-a', 4],
    ['long-a', 'destination', 4],
    ['start', 'short-a', 1],
    ['short-a', 'destination', 2],
  ])
  const route = findShortestPath(graph, 'start', 'destination')

  assert.equal(route.status, 'found')
  assert.deepEqual(route.routeNodeIds, ['start', 'short-a', 'destination'])
  assert.equal(route.totalDistanceMeters, 3)
})

test('returns a zero-distance route when start equals destination', () => {
  const graph = createGraph([['start', 'end', 5]])
  const route = findShortestPath(graph, 'start', 'start')

  assert.equal(route.status, 'same-node')
  assert.deepEqual(route.routeNodeIds, ['start'])
  assert.deepEqual(route.edges, [])
  assert.equal(route.totalDistanceMeters, 0)
})

test('reports invalid node IDs', () => {
  const graph = createGraph([['start', 'end', 5]])

  assert.equal(findShortestPath(graph, 'missing', 'end').status, 'invalid-node')
  assert.equal(findShortestPath(graph, 'start', 'missing').status, 'invalid-node')
})

test('reports when no route exists between disconnected nodes', () => {
  const graph = createGraph([
    ['start', 'near', 1],
    ['far', 'destination', 1],
  ])

  assert.equal(findShortestPath(graph, 'start', 'destination').status, 'no-route')
})

test('reports whether the selected route uses provisional connections', () => {
  const graph = createGraph([
    ['building', 'entrance', 2, 'provisional'],
    ['entrance', 'path', 3, 'network'],
  ])
  const route = findShortestPath(graph, 'building', 'path')

  assert.equal(route.status, 'found')
  assert.equal(route.usesProvisionalConnections, true)
  assert.equal(route.totalDistanceMeters, 5)
})

test('keeps network-only routes marked as non-provisional', () => {
  const graph = createGraph([['start', 'destination', 2]])
  const route = findShortestPath(graph, 'start', 'destination')

  assert.equal(route.usesProvisionalConnections, false)
})
