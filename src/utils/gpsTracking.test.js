import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  createGpsWatchOptions,
  getGpsTrackingErrorMessage,
  isReliableGpsReading,
} from './gpsTracking.js'

test('accepts finite GPS readings at or within the accuracy limit', () => {
  assert.equal(
    isReliableGpsReading(
      { latitude: 13.13, longitude: 77.56, accuracy: 30 },
      30,
    ),
    true,
  )
  assert.equal(
    isReliableGpsReading(
      { latitude: 13.13, longitude: 77.56, accuracy: 30.1 },
      30,
    ),
    false,
  )
})

test('rejects missing or non-finite location and accuracy values', () => {
  assert.equal(isReliableGpsReading(null, 30), false)
  assert.equal(
    isReliableGpsReading(
      { latitude: Number.NaN, longitude: 77.56, accuracy: 5 },
      30,
    ),
    false,
  )
  assert.equal(
    isReliableGpsReading(
      { latitude: 13.13, longitude: 77.56, accuracy: Infinity },
      30,
    ),
    false,
  )
})

test('creates high-accuracy watch options with a configurable timeout', () => {
  assert.deepEqual(createGpsWatchOptions(8000), {
    enableHighAccuracy: true,
    maximumAge: 0,
    timeout: 8000,
  })
})

test('provides actionable geolocation error messages', () => {
  assert.match(getGpsTrackingErrorMessage(1), /permission was denied/i)
  assert.match(getGpsTrackingErrorMessage(2), /unavailable/i)
  assert.match(getGpsTrackingErrorMessage(3), /will continue waiting/i)
  assert.match(getGpsTrackingErrorMessage(99), /could not be determined/i)
})
