export function isReliableGpsReading(coords, maximumAccuracyMeters) {
  return (
    Number.isFinite(coords?.latitude) &&
    Number.isFinite(coords?.longitude) &&
    Number.isFinite(coords?.accuracy) &&
    coords.accuracy <= maximumAccuracyMeters
  )
}

export function getGpsTrackingErrorMessage(errorCode) {
  const messages = {
    1: 'Location permission was denied. Allow location access in your browser settings, then start navigation again.',
    2: 'Your current location is unavailable. Check your device location settings and try again.',
    3: 'The location request timed out. Tracking will continue waiting for another location update.',
  }

  return messages[errorCode] ?? 'Your current location could not be determined.'
}

export function createGpsWatchOptions(timeout) {
  return {
    enableHighAccuracy: true,
    maximumAge: 0,
    timeout,
  }
}
