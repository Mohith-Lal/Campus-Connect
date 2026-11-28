import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  createArrivalDetector,
  updateNavigationDetectors,
} from './arrivalDetection.js'

const destination = [13.13, 77.56]
const insideRadius = [13.13005, 77.56]
const outsideRadius = [13.1303, 77.56]

function createDetector(overrides = {}) {
  return createArrivalDetector({
    arrivalRadiusMeters: 15,
    consecutiveReadingsRequired: 3,
    ...overrides,
  })
}

test('confirms arrival after three consecutive reliable readings in range', () => {
  const detector = createDetector()

  assert.equal(
    detector.update(insideRadius, 5, destination, 30).arrived,
    false,
  )
  assert.equal(
    detector.update(insideRadius, 5, destination, 30).arrived,
    false,
  )
  const arrival = detector.update(insideRadius, 5, destination, 30)

  assert.equal(arrival.arrived, true)
  assert.equal(arrival.consecutiveReadings, 3)
})

test('ignores readings with accuracy worse than the limit', () => {
  const detector = createDetector()

  detector.update(insideRadius, 5, destination, 30)
  const inaccurate = detector.update(insideRadius, 31, destination, 30)
  assert.equal(inaccurate.arrived, false)
  assert.equal(inaccurate.reliable, false)
  assert.equal(inaccurate.consecutiveReadings, 1)

  assert.equal(
    detector.update(insideRadius, 5, destination, 30).consecutiveReadings,
    2,
  )
  assert.equal(
    detector.update(insideRadius, 5, destination, 30).arrived,
    true,
  )
})

test('does not confirm arrival from invalid GPS or destination coordinates', () => {
  const detector = createDetector()

  detector.update(insideRadius, 5, destination, 30)
  detector.update(insideRadius, 5, destination, 30)
  const invalidPosition = detector.update(
    [Number.NaN, 77.56],
    5,
    destination,
    30,
  )
  const invalidDestination = detector.update(insideRadius, 5, null, 30)

  assert.equal(invalidPosition.arrived, false)
  assert.equal(invalidPosition.reliable, false)
  assert.equal(invalidDestination.arrived, false)
  assert.equal(invalidDestination.reliable, false)
  assert.equal(invalidPosition.consecutiveReadings, 2)
  assert.equal(
    detector.update(insideRadius, 5, destination, 30).arrived,
    true,
  )
})

test('resets the consecutive count after a reliable position leaves the radius', () => {
  const detector = createDetector()

  detector.update(insideRadius, 5, destination, 30)
  detector.update(insideRadius, 5, destination, 30)
  assert.equal(
    detector.update(outsideRadius, 5, destination, 30).consecutiveReadings,
    0,
  )
  assert.equal(
    detector.update(insideRadius, 5, destination, 30).arrived,
    false,
  )
})

test('reset clears the arrival counter when destination changes', () => {
  const detector = createDetector()

  detector.update(insideRadius, 5, destination, 30)
  detector.update(insideRadius, 5, destination, 30)
  assert.equal(
    detector.update(insideRadius, 5, [13.131, 77.56], 30).consecutiveReadings,
    0,
  )
  assert.equal(
    detector.update(insideRadius, 5, [13.131, 77.56], 30).arrived,
    false,
  )
})

test('reset clears arrival state when navigation stops or starts a new session', () => {
  const detector = createDetector()
  detector.update(insideRadius, 5, destination, 30)
  detector.update(insideRadius, 5, destination, 30)
  assert.equal(detector.reset().arrived, false)
  detector.update(insideRadius, 5, destination, 30)
  detector.update(insideRadius, 5, destination, 30)
  assert.equal(detector.reset().consecutiveReadings, 0)
})

test('arrival detection continues against the same destination after a reroute', () => {
  const detector = createDetector()
  const originalDestination = [13.13, 77.56]

  detector.update([13.131, 77.56], 5, originalDestination, 30)
  detector.update([13.13005, 77.56], 5, originalDestination, 30)
  detector.update([13.13005, 77.56], 5, originalDestination, 30)
  assert.equal(
    detector.update([13.13005, 77.56], 5, originalDestination, 30).arrived,
    true,
  )
})

test('confirmed arrival takes priority and skips off-route detection', () => {
  const arrivalDetector = createDetector()
  let offRouteUpdates = 0
  const offRouteDetector = {
    update() {
      offRouteUpdates += 1
      return { status: 'off-route' }
    },
  }
  const options = {
    arrivalDetector,
    offRouteDetector,
    position: insideRadius,
    accuracyMeters: 5,
    destinationPosition: destination,
    routeCoordinates: [outsideRadius],
    maximumAccuracyMeters: 30,
  }

  updateNavigationDetectors(options)
  updateNavigationDetectors(options)
  const result = updateNavigationDetectors(options)

  assert.equal(result.arrival.arrived, true)
  assert.equal(result.offRoute, null)
  assert.equal(offRouteUpdates, 2)
})
