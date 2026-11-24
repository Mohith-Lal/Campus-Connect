class MinPriorityQueue {
  #items = []

  get size() {
    return this.#items.length
  }

  push(item) {
    this.#items.push(item)
    let index = this.#items.length - 1

    while (index > 0) {
      const parentIndex = Math.floor((index - 1) / 2)
      if (this.#items[parentIndex].priority <= item.priority) break
      this.#items[index] = this.#items[parentIndex]
      index = parentIndex
    }

    this.#items[index] = item
  }

  pop() {
    if (this.#items.length === 0) return null

    const minimum = this.#items[0]
    const last = this.#items.pop()
    if (this.#items.length > 0 && last) {
      let index = 0

      while (true) {
        const leftIndex = index * 2 + 1
        const rightIndex = leftIndex + 1
        let smallestIndex = index

        if (
          leftIndex < this.#items.length &&
          this.#items[leftIndex].priority < last.priority
        ) {
          smallestIndex = leftIndex
        }
        if (
          rightIndex < this.#items.length &&
          this.#items[rightIndex].priority <
            (smallestIndex === index
              ? last.priority
              : this.#items[leftIndex].priority)
        ) {
          smallestIndex = rightIndex
        }
        if (smallestIndex === index) break

        this.#items[index] = this.#items[smallestIndex]
        index = smallestIndex
      }

      this.#items[index] = last
    }

    return minimum
  }
}

function result(status, details = {}) {
  return {
    status,
    routeNodeIds: [],
    routeCoordinates: [],
    totalDistanceMeters: 0,
    edges: [],
    usesProvisionalConnections: false,
    ...details,
  }
}

function hasValidGraph(graph) {
  return (
    graph?.nodes instanceof Map &&
    graph?.adjacency instanceof Map &&
    [...graph.nodes.keys()].every((nodeId) => graph.adjacency.has(nodeId))
  )
}

export function findShortestPath(graph, startNodeId, destinationNodeId) {
  if (!hasValidGraph(graph)) {
    return result('invalid-graph', { message: 'A valid walking graph is required.' })
  }

  const missingNodeIds = [startNodeId, destinationNodeId].filter(
    (nodeId) => !graph.nodes.has(nodeId),
  )
  if (missingNodeIds.length > 0) {
    return result('invalid-node', {
      message: `Graph node not found: ${missingNodeIds.join(', ')}.`,
      missingNodeIds,
    })
  }

  if (startNodeId === destinationNodeId) {
    const node = graph.nodes.get(startNodeId)
    return result('same-node', {
      routeNodeIds: [startNodeId],
      routeCoordinates: [node.position],
      message: 'Start and destination are the same node.',
    })
  }

  const distances = new Map([[startNodeId, 0]])
  const previous = new Map()
  const queue = new MinPriorityQueue()
  queue.push({ nodeId: startNodeId, priority: 0 })

  while (queue.size > 0) {
    const current = queue.pop()
    if (!current) break

    const knownDistance = distances.get(current.nodeId)
    if (current.priority !== knownDistance) continue
    if (current.nodeId === destinationNodeId) break

    for (const neighbor of graph.adjacency.get(current.nodeId)) {
      const edge = neighbor?.edge
      if (
        !graph.nodes.has(neighbor?.nodeId) ||
        !Number.isFinite(edge?.weightMeters) ||
        edge.weightMeters < 0
      ) {
        return result('invalid-graph', {
          message: 'Graph adjacency contains an invalid node or edge weight.',
        })
      }

      const candidateDistance = knownDistance + edge.weightMeters
      if (candidateDistance >= (distances.get(neighbor.nodeId) ?? Infinity)) continue

      distances.set(neighbor.nodeId, candidateDistance)
      previous.set(neighbor.nodeId, {
        nodeId: current.nodeId,
        edge,
      })
      queue.push({ nodeId: neighbor.nodeId, priority: candidateDistance })
    }
  }

  if (!distances.has(destinationNodeId)) {
    return result('no-route', {
      message: `No route exists between ${startNodeId} and ${destinationNodeId}.`,
    })
  }

  const routeNodeIds = [destinationNodeId]
  const routeEdges = []
  let currentNodeId = destinationNodeId

  while (currentNodeId !== startNodeId) {
    const step = previous.get(currentNodeId)
    if (!step) {
      return result('no-route', {
        message: `No route exists between ${startNodeId} and ${destinationNodeId}.`,
      })
    }

    routeEdges.unshift({
      ...step.edge,
      traversalFrom: step.nodeId,
      traversalTo: currentNodeId,
    })
    currentNodeId = step.nodeId
    routeNodeIds.unshift(currentNodeId)
  }

  const routeCoordinates = routeNodeIds.map((nodeId) => graph.nodes.get(nodeId).position)

  return result('found', {
    routeNodeIds,
    routeCoordinates,
    totalDistanceMeters: distances.get(destinationNodeId),
    edges: routeEdges,
    usesProvisionalConnections: routeEdges.some((edge) => edge.status === 'provisional'),
  })
}
