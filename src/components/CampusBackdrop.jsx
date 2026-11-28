import { motion, useReducedMotion } from 'motion/react'
import { BookOpen, Compass, GraduationCap, Sparkles } from 'lucide-react'

/**
 * Animated collegiate campus background layer (z-0, pointer-events-none).
 * Features drifting aurora fields, an orbital campus astrolabe, subtle
 * architectural silhouettes, and floating academic line-art motifs.
 */
export function CampusBackdrop() {
  const shouldReduceMotion = useReducedMotion()

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
    >
      {/* Soft Aurora Blobs */}
      <div className="aurora-field">
        <div className="aurora-blob aurora-blob--cobalt" />
        <div className="aurora-blob aurora-blob--iris" />
        <div className="aurora-blob aurora-blob--sun" />
      </div>

      {/* Orbital Campus Astrolabe (top-right, GPU rotation only) */}
      <div className="absolute -right-28 -top-28 hidden h-[460px] w-[460px] opacity-[0.14] dark:opacity-[0.18] lg:block">
        <svg className="h-full w-full" fill="none" viewBox="0 0 400 400">
          <g className={shouldReduceMotion ? '' : 'animate-orbit origin-center'}>
            <circle cx="200" cy="200" r="175" stroke="currentColor" strokeDasharray="6 10" strokeWidth="1.2" className="text-brand-600 dark:text-brand-400" />
            <circle cx="200" cy="25" r="5" fill="currentColor" className="text-sun-500" />
          </g>
          <g className={shouldReduceMotion ? '' : 'animate-orbit--reverse origin-center'}>
            <circle cx="200" cy="200" r="128" stroke="currentColor" strokeDasharray="3 8" strokeWidth="1" className="text-iris-600 dark:text-iris-400" />
            <circle cx="328" cy="200" r="4" fill="currentColor" className="text-brand-500" />
          </g>
          <circle cx="200" cy="200" r="76" stroke="currentColor" strokeWidth="0.8" className="text-slate-400/50" />
        </svg>
      </div>

      {/* Subtle Floating Collegiate Motifs */}
      <motion.div
        animate={shouldReduceMotion ? undefined : { y: [0, -14, 0], rotate: [0, 3, 0] }}
        transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute right-[7%] top-[16%] hidden text-brand-500/10 dark:text-brand-400/10 xl:block"
      >
        <GraduationCap size={104} strokeWidth={1.1} />
      </motion.div>

      <motion.div
        animate={shouldReduceMotion ? undefined : { y: [0, 12, 0], rotate: [0, -4, 0] }}
        transition={{ duration: 13, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute bottom-[16%] left-[22%] hidden text-iris-500/10 dark:text-iris-400/10 lg:block"
      >
        <Compass size={92} strokeWidth={1.1} />
      </motion.div>

      <motion.div
        animate={shouldReduceMotion ? undefined : { y: [0, -10, 0] }}
        transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute bottom-[22%] right-[12%] hidden text-sun-500/10 dark:text-sun-400/10 lg:block"
      >
        <BookOpen size={80} strokeWidth={1.1} />
      </motion.div>

      <motion.div
        animate={shouldReduceMotion ? undefined : { opacity: [0.25, 0.55, 0.25], scale: [1, 1.08, 1] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute left-[36%] top-[24%] hidden text-brand-500/12 dark:text-sky-300/12 md:block"
      >
        <Sparkles size={44} strokeWidth={1.3} />
      </motion.div>

      {/* Bottom Campus Architectural Skyline Silhouette */}
      <svg
        className="absolute bottom-0 left-0 right-0 h-44 w-full opacity-[0.045] dark:opacity-[0.07]"
        fill="none"
        preserveAspectRatio="none"
        viewBox="0 0 1440 180"
      >
        <path
          d="M0 180V128H110V92L145 64L180 92V128H250V104H340V180H390V78H470V54L505 26L540 54V78H610V180H680V116H820V180H890V86H980V180H1040V68L1095 40L1150 68V180H1230V110H1340V180H1440V180H0Z"
          fill="currentColor"
        />
      </svg>
    </div>
  )
}
