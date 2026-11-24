const excludedStudentPathIds = new Set([
  'way/1228824121',
  'way/1208968322',
  'way/1208973671',
])

export function getStudentWalkingPaths(featureCollection) {
  return {
    ...featureCollection,
    features: featureCollection.features.filter(
      (feature) =>
        feature.geometry?.type === 'LineString' &&
        !excludedStudentPathIds.has(feature.id),
    ),
  }
}
