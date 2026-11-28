import assert from 'node:assert/strict'
import { test } from 'node:test'
import { generateNavigationInstructions } from './navigationInstructions.js'

function createRoute(coordinates, edgeOptions = [], details = {}) {
  const routeNodeIds = coordinates.map((_, index) => `node-${index}`)
  const edges = edgeOptions.map((options, index) => ({
    traversalFrom: routeNodeIds[index],
    traversalTo: routeNodeIds[index + 1],
    weightMeters: options.distanceMeters ?? 100,
    status: options.status ?? 'network',
  }))

  return {
    status: 'found',
    routeNodeIds,
    routeCoordinates: coordinates,
    edges,
    totalDistanceMeters: edges.reduce((sum, edge) => sum + edge.weightMeters, 0),
    ...details,
  }
}

const straightCoordinates = [
  [13.13, 77.56],
  [13.1309, 77.56],
  [13.1318, 77.56],
]

test('generates straight instructions and conserves route distance', () => {
  const route = createRoute(straightCoordinates, [
    { distanceMeters: 100 },
    { distanceMeters: 120 },
  ])
  const instructions = generateNavigationInstructions(route)

  assert.deepEqual(
    instructions.map(({ type }) => type),
    ['continue', 'arrival'],
  )
  assert.equal(instructions[0].distanceMeters, route.totalDistanceMeters)
})

test('classifies left and right turns from ordered coordinates', () => {
  const leftRoute = createRoute([
    [13.13, 77.56],
    [13.1309, 77.56],
    [13.1309, 77.5591],
  ])
  const rightRoute = createRoute([
    [13.13, 77.56],
    [13.1309, 77.56],
    [13.1309, 77.5609],
  ])

  assert.equal(generateNavigationInstructions(leftRoute)[1].type, 'turn-left')
  assert.equal(generateNavigationInstructions(rightRoute)[1].type, 'turn-right')
})

test('classifies a reversal as a U-turn', () => {
  const route = createRoute([
    [13.13, 77.56],
    [13.1309, 77.56],
    [13.13, 77.56],
  ])

  assert.equal(generateNavigationInstructions(route)[1].type, 'u-turn')
})

test('keeps provisional connectors explicit and conserves edge distances', () => {
  const route = createRoute(straightCoordinates, [
    { distanceMeters: 12, status: 'provisional' },
    { distanceMeters: 100 },
  ], { usesProvisionalConnections: true })
  const instructions = generateNavigationInstructions(route)

  assert.equal(instructions[0].type, 'provisional-connection')
  assert.match(instructions[0].text, /not a verified walking path/)
  assert.equal(
    instructions
      .filter(({ type }) => type !== 'arrival')
      .reduce((sum, instruction) => sum + instruction.distanceMeters, 0),
    route.totalDistanceMeters,
  )
})

test('includes GPS snap distance as a separate approximate connector', () => {
  const route = createRoute(
    [
      [13.1298, 77.56],
      ...straightCoordinates,
    ],
    [{ distanceMeters: 100 }, { distanceMeters: 120 }],
    { gpsSnapDistanceMeters: 15, totalDistanceMeters: 235 },
  )
  const instructions = generateNavigationInstructions(route)

  assert.equal(instructions[0].type, 'gps-snap')
  assert.match(instructions[0].text, /not a verified walking path/)
  assert.equal(
    instructions
      .filter(({ type }) => type !== 'arrival')
      .reduce((sum, instruction) => sum + instruction.distanceMeters, 0),
    route.totalDistanceMeters,
  )
})

test('handles same-node routes with only an arrival instruction', () => {
  const instructions = generateNavigationInstructions({
    status: 'same-node',
    routeNodeIds: ['only-node'],
    routeCoordinates: [[13.13, 77.56]],
    edges: [],
    totalDistanceMeters: 0,
  })

  assert.deepEqual(instructions.map(({ type }) => type), ['arrival'])
})

test('returns no instructions for invalid or empty routes', () => {
  assert.deepEqual(generateNavigationInstructions(null), [])
  assert.deepEqual(
    generateNavigationInstructions({ status: 'no-route', routeCoordinates: [] }),
    [],
  )
  assert.deepEqual(
    generateNavigationInstructions({ status: 'found', routeCoordinates: [] }),
    [],
  )
})
