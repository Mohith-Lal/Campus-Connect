import assert from 'node:assert/strict'
import { test } from 'node:test'
import { findNearestWalkingNode } from './nearestWalkingNode.js'

test('finds the nearest node on the retained walking network', () => {
  const graph = {
    nodes: new Map([
      ['path-near', { position: [13.133, 77.568], roles: new Set(['walking-path']) }],
      ['path-far', { position: [13.134, 77.568], roles: new Set(['walking-path']) }],
      ['campus-location', { position: [13.133001, 77.568], roles: new Set(['campus-location']) }],
    ]),
  }

  const nearest = findNearestWalkingNode(graph, [13.1330001, 77.568])

  assert.equal(nearest.nodeId, 'path-near')
  assert.deepEqual(nearest.position, [13.133, 77.568])
  assert.ok(nearest.distanceMeters > 0 && nearest.distanceMeters < 1)
})

test('returns null when the graph or GPS coordinate is invalid', () => {
  assert.equal(findNearestWalkingNode(null, [13.133, 77.568]), null)
  assert.equal(findNearestWalkingNode({ nodes: new Map() }, [Number.NaN, 77.568]), null)
  assert.equal(findNearestWalkingNode({ nodes: new Map() }, [13.133, 77.568]), null)
})
