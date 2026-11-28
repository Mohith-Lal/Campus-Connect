import { Component, Suspense, lazy, useEffect, useRef, useState } from 'react'

/**
 * Three.js hero scene, lazily loaded so the initial bundle stays lean.
 * Renders nothing under reduced motion (a static CSS mesh takes over) and
 * pauses rendering when the tab is hidden.
 */
const SceneCanvas = lazy(() => import('./SceneCanvas'))

class SceneErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { failed: false }
  }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch() {
    // WebGL unavailable or context lost — the CSS mesh below is the fallback.
  }

  render() {
    return this.state.failed ? null : this.props.children
  }
}

function useReducedMotionFlag() {
  const [reduced, setReduced] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const onChange = (event) => setReduced(event.matches)
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [])

  return reduced
}

export default function CampusScene() {
  const hostRef = useRef(null)
  const reduced = useReducedMotionFlag()
  const [inView, setInView] = useState(false)
  const [visible, setVisible] = useState(true)

  // Only mount WebGL once the hero is on screen (perf: below-fold canvases stay off).
  useEffect(() => {
    const node = hostRef.current
    if (!node) return undefined
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { rootMargin: '160px' },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  // Pause the render loop while the tab is hidden.
  useEffect(() => {
    const onVisibility = () => setVisible(document.visibilityState === 'visible')
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [])

  const renderScene = inView && visible && !reduced

  return (
    <div ref={hostRef} aria-hidden="true" className="absolute inset-0 overflow-hidden">
      {renderScene ? (
        <SceneErrorBoundary>
          <Suspense fallback={null}>
            <SceneCanvas />
          </Suspense>
        </SceneErrorBoundary>
      ) : (
        // Static / reduced-motion fallback: the CSS mesh carries the visual.
        <div className="campus-hero-mesh absolute inset-0" />
      )}
      <div className="absolute inset-0 bg-linear-to-t from-ink-950/55 via-transparent to-transparent" />
    </div>
  )
}
