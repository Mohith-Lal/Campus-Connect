import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  createOffRouteDetector,
  distanceToRouteMeters,
} from './offRouteDetection.js'

const route = [
  [13.13, 77.56],
  [13.13, 77.562],
]

test('measures shortest distance to route segments rather than route nodes', () => {
  const position = [13.13005, 77.561]

  assert.ok(distanceToRouteMeters(position, route) < 6)
})

test('reports on route when the reliable position is near a route segment', () => {
  const detector = createOffRouteDetector()
  const result = detector.update([13.13005, 77.561], 5, route, 30)

  assert.equal(result.status, 'on-route')
  assert.equal(result.reliable, true)
  assert.ok(result.distanceMeters < 20)
})

test('requires consecutive reliable readings before declaring off route', () => {
  const detector = createOffRouteDetector()
  const position = [13.1303, 77.561]

  assert.equal(detector.update(position, 5, route, 30).status, 'checking')
  assert.equal(detector.update(position, 5, route, 30).status, 'checking')
  assert.equal(detector.update(position, 5, route, 30).status, 'off-route')
})

test('inaccurate readings do not change status or consecutive reading counts', () => {
  const detector = createOffRouteDetector()
  const offRoutePosition = [13.1303, 77.561]

  assert.equal(
    detector.update(offRoutePosition, 5, route, 30).status,
    'checking',
  )
  const inaccurate = detector.update(offRoutePosition, 31, route, 30)

  assert.equal(inaccurate.status, 'checking')
  assert.equal(inaccurate.reliable, false)
  assert.equal(
    detector.update(offRoutePosition, 5, route, 30).status,
    'checking',
  )
  assert.equal(
    detector.update(offRoutePosition, 5, route, 30).status,
    'off-route',
  )
})

test('invalid routes leave the detector in checking state', () => {
  const detector = createOffRouteDetector()
  const result = detector.update([13.13, 77.56], 5, [], 30)

  assert.equal(result.status, 'checking')
  assert.equal(result.distanceMeters, null)
  assert.equal(result.reliable, false)
})

test('same-node route distance is measured from its single point', () => {
  const detector = createOffRouteDetector()
  const result = detector.update([13.1301, 77.56], 5, [[13.13, 77.56]], 30)

  assert.equal(result.status, 'on-route')
  assert.ok(result.distanceMeters > 10)
  assert.ok(result.distanceMeters < 12)
})

test('resets the detection state and counters for a new route', () => {
  const detector = createOffRouteDetector()
  const offRoutePosition = [13.1303, 77.561]

  detector.update(offRoutePosition, 5, route, 30)
  detector.update(offRoutePosition, 5, route, 30)
  detector.reset()

  assert.equal(
    detector.update(offRoutePosition, 5, route, 30).status,
    'checking',
  )
})

test('uses a lower recovery threshold and consecutive readings for hysteresis', () => {
  const detector = createOffRouteDetector()
  const offRoutePosition = [13.1303, 77.561]
  const recoveryPosition = [13.13005, 77.561]
  const betweenThresholdsPosition = [13.13015, 77.561]

  detector.update(offRoutePosition, 5, route, 30)
  detector.update(offRoutePosition, 5, route, 30)
  assert.equal(detector.update(offRoutePosition, 5, route, 30).status, 'off-route')

  assert.equal(
    detector.update(betweenThresholdsPosition, 5, route, 30).status,
    'off-route',
  )
  assert.equal(
    detector.update(recoveryPosition, 5, route, 30).status,
    'off-route',
  )
  assert.equal(
    detector.update(recoveryPosition, 5, route, 30).status,
    'on-route',
  )
})

test('returns no distance for invalid route geometry or GPS positions', () => {
  assert.equal(distanceToRouteMeters([13.13, 77.56], []), null)
  assert.equal(distanceToRouteMeters([Number.NaN, 77.56], route), null)
})
