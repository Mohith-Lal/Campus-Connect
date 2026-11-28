import { useRef } from 'react'
import {
  motion,
  useReducedMotion,
  useSpring,
  useTransform,
  useMotionValue,
} from 'motion/react'

/**
 * React Bits-style 3D tilt card.
 * Perspective rotation driven by a pointer-driven motion value —
 * no React re-renders per frame. Disabled under reduced motion.
 */
export function TiltCard({
  children,
  className = '',
  max = 10,
  scale = 1.01,
  glare = true,
}) {
  const ref = useRef(null)
  const shouldReduceMotion = useReducedMotion()

  const px = useMotionValue(0.5)
  const py = useMotionValue(0.5)
  const rotateX = useSpring(useTransform(py, [0, 1], [max, -max]), {
    stiffness: 220,
    damping: 22,
  })
  const rotateY = useSpring(useTransform(px, [0, 1], [-max, max]), {
    stiffness: 220,
    damping: 22,
  })
  const glareX = useTransform(px, [0, 1], ['0%', '100%'])
  const glareY = useTransform(py, [0, 1], ['0%', '100%'])
  const glareBackground = useTransform([glareX, glareY], ([x, y]) =>
    `radial-gradient(420px circle at ${x} ${y}, rgba(255,255,255,0.18), transparent 62%)`,
  )

  const handlePointerMove = (event) => {
    if (shouldReduceMotion || !ref.current) return
    const rect = ref.current.getBoundingClientRect()
    px.set((event.clientX - rect.left) / rect.width)
    py.set((event.clientY - rect.top) / rect.height)
  }

  const handlePointerLeave = () => {
    px.set(0.5)
    py.set(0.5)
  }

  if (shouldReduceMotion) {
    return <div className={className}>{children}</div>
  }

  return (
    <div ref={ref} className="[perspective:900px]">
      <motion.div
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
        whileHover={{ scale }}
        transition={{ type: 'spring', stiffness: 260, damping: 24 }}
        className={`group relative ${className}`}
      >
        {children}
        {glare ? (
          <motion.span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            style={{ background: glareBackground }}
          />
        ) : null}
      </motion.div>
    </div>
  )
}

/**
 * Section header: spectral eyebrow + title + accent underline that draws in
 * once when scrolled into view. Optional trailing action slot.
 */
export function SectionHeader({ eyebrow, title, action, className = '' }) {
  const shouldReduceMotion = useReducedMotion()

  return (
    <div className={`mb-4 flex items-end justify-between gap-4 ${className}`}>
      <div className="min-w-0">
        {eyebrow ? (
          <p className="text-spectral mb-1.5 text-[10px] font-bold uppercase tracking-[0.22em]">
            {eyebrow}
          </p>
        ) : null}
        <div>
          <h2 className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-xl">
            {title}
          </h2>
          <motion.span
            aria-hidden="true"
            className="mt-2 block h-px w-16 origin-left bg-linear-to-r from-brand-600 via-iris-500 to-transparent"
            initial={shouldReduceMotion ? false : { scaleX: 0 }}
            whileInView={shouldReduceMotion ? undefined : { scaleX: 1 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>
      </div>
      {action}
    </div>
  )
}
