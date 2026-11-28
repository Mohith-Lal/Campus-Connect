import { useEffect, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'

/**
 * React Bits-inspired SpotlightCard:
 * GPU-composited radial cursor spotlight + subtle spring lift on hover.
 */
export function SpotlightCard({
  children,
  className = '',
  spotlightColor = 'rgba(59, 130, 246, 0.14)',
  ...props
}) {
  const cardRef = useRef(null)
  const [spotlight, setSpotlight] = useState({ x: 0, y: 0, opacity: 0 })
  const shouldReduceMotion = useReducedMotion()

  const handleMouseMove = (event) => {
    if (shouldReduceMotion || !cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    setSpotlight({
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
      opacity: 1,
    })
  }

  const handleMouseLeave = () => {
    setSpotlight((prev) => ({ ...prev, opacity: 0 }))
  }

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      whileHover={shouldReduceMotion ? undefined : { y: -3 }}
      transition={{ type: 'spring', stiffness: 380, damping: 28 }}
      className={`relative overflow-hidden ${className}`}
      {...props}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-px rounded-[inherit] transition-opacity duration-300"
        style={{
          opacity: spotlight.opacity,
          background: `radial-gradient(360px circle at ${spotlight.x}px ${spotlight.y}px, ${spotlightColor}, transparent 75%)`,
        }}
      />
      <div className="relative z-10 h-full">{children}</div>
    </motion.div>
  )
}

/**
 * React Bits-inspired BlurText:
 * Staggered word-by-word spring reveal with subtle blur-to-crisp transition.
 */
export function BlurText({ text, className = '', delay = 0 }) {
  const shouldReduceMotion = useReducedMotion()
  const words = text.split(' ')

  if (shouldReduceMotion) {
    return <span className={className}>{text}</span>
  }

  return (
    <span className={`inline-flex flex-wrap gap-x-[0.28em] ${className}`}>
      {words.map((word, idx) => (
        <motion.span
          key={`${word}-${idx}`}
          initial={{ opacity: 0, y: 12, filter: 'blur(6px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{
            duration: 0.45,
            delay: delay + idx * 0.045,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="inline-block will-change-transform"
        >
          {word}
        </motion.span>
      ))}
    </span>
  )
}

/**
 * React Bits-inspired CountUpNumber:
 * Smooth 60fps requestAnimationFrame counter for numeric metrics.
 */
export function CountUpNumber({ value, suffix = '', duration = 900, className = '' }) {
  const shouldReduceMotion = useReducedMotion()
  const [display, setDisplay] = useState(shouldReduceMotion ? value : 0)

  useEffect(() => {
    if (shouldReduceMotion) {
      return undefined
    }

    let frameId
    const startTime = performance.now()
    const isFloat = !Number.isInteger(value)

    const tick = (now) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      const current = value * eased
      setDisplay(isFloat ? Number(current.toFixed(2)) : Math.round(current))
      if (progress < 1) {
        frameId = requestAnimationFrame(tick)
      }
    }

    frameId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frameId)
  }, [value, duration, shouldReduceMotion])

  const shownValue = shouldReduceMotion ? value : display

  return (
    <span className={className}>
      {shownValue}
      {suffix}
    </span>
  )
}

/**
 * React Bits-inspired MagneticButton:
 * Subtle cursor-tracking magnetic pull with spring snap-back.
 */
export function MagneticButton({ children, className = '', onClick, type = 'button', ...props }) {
  const ref = useRef(null)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const shouldReduceMotion = useReducedMotion()

  const handleMouseMove = (event) => {
    if (shouldReduceMotion || !ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const dx = (event.clientX - (rect.left + rect.width / 2)) * 0.16
    const dy = (event.clientY - (rect.top + rect.height / 2)) * 0.16
    setOffset({ x: dx, y: dy })
  }

  return (
    <motion.button
      ref={ref}
      type={type}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setOffset({ x: 0, y: 0 })}
      animate={shouldReduceMotion ? undefined : { x: offset.x, y: offset.y }}
      whileTap={shouldReduceMotion ? undefined : { scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 360, damping: 22 }}
      className={className}
      {...props}
    >
      {children}
    </motion.button>
  )
}

/**
 * 60fps PageTransition wrapper for workspace routes.
 */
export function PageTransition({ children, pageKey }) {
  const shouldReduceMotion = useReducedMotion()

  return (
    <motion.div
      key={pageKey}
      initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={shouldReduceMotion ? undefined : { opacity: 0, y: -8 }}
      transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  )
}
