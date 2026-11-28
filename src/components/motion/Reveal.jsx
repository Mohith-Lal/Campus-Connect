import { useRef } from 'react'
import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react'

/**
 * Scroll-reveal wrapper: one-shot fade + rise when the element enters the
 * viewport. Animates transform/opacity only and fully bypasses itself when
 * motion is reduced.
 */
export function Reveal({ children, className = '', delay = 0, y = 20, as: Tag = 'div' }) {
  const shouldReduceMotion = useReducedMotion()

  if (shouldReduceMotion) {
    return <Tag className={className}>{children}</Tag>
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-72px' }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  )
}

/**
 * Container that staggers direct children on first scroll-in.
 * Pass `<Reveal>`-free plain elements as children.
 */
export function RevealGroup({ children, className = '', stagger = 0.07 }) {
  const shouldReduceMotion = useReducedMotion()

  if (shouldReduceMotion) {
    return <div className={className}>{children}</div>
  }

  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '-72px' }}
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: stagger } },
      }}
    >
      {children}
    </motion.div>
  )
}

/** Child variant for RevealGroup. */
export function RevealItem({ children, className = '', y = 18 }) {
  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y },
        show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
      }}
    >
      {children}
    </motion.div>
  )
}

/**
 * Gentle scroll-linked parallax for decorative layers.
 * Uses a single motion value driven by scroll — no per-frame React renders.
 */
export function Parallax({ children, className = '', distance = 48 }) {
  const ref = useRef(null)
  const shouldReduceMotion = useReducedMotion()
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  })
  const y = useTransform(scrollYProgress, [0, 1], [distance, -distance])

  return (
    <div ref={ref} className={className}>
      <motion.div style={shouldReduceMotion ? undefined : { y }}>
        {children}
      </motion.div>
    </div>
  )
}
