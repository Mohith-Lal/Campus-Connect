const EARTH_RADIUS_METERS = 6371008.8

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

export function findNearestWalkingNode(graph, position) {
  if (
    !(graph?.nodes instanceof Map) ||
    !Array.isArray(position) ||
    position.length !== 2 ||
    !position.every(Number.isFinite)
  ) {
    return null
  }

  let nearest = null
  for (const [nodeId, node] of graph.nodes) {
    if (!node.roles?.has('walking-path')) continue

    const distanceMeters = haversineDistance(position, node.position)
    if (!nearest || distanceMeters < nearest.distanceMeters) {
      nearest = {
        nodeId,
        position: node.position,
        distanceMeters,
      }
    }
  }

  return nearest
}
