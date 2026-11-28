import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'motion/react'
import {
  ArrowRight,
  CalendarDays,
  Compass,
  LayoutDashboard,
  MapPin,
  Megaphone,
  Search,
  Settings,
  Users,
  X,
} from 'lucide-react'
import campusLocations from '../data/campusLocations.js'
import { campusEvents, initialFacultyDirectory } from '../data/campusPortalData.js'

const pageEntries = [
  { id: 'page-dashboard', label: 'Dashboard', subtitle: 'Student command center', page: 'Dashboard', icon: LayoutDashboard },
  { id: 'page-map', label: 'Campus Map', subtitle: 'Interactive wayfinding & GPS', page: 'Campus Map', icon: Compass },
  { id: 'page-faculty', label: 'Faculty Directory', subtitle: 'Professors, cabins & office hours', page: 'Faculty', icon: Users },
  { id: 'page-events', label: 'Campus Events', subtitle: 'Workshops, fests & varsity cups', page: 'Events', icon: CalendarDays },
  { id: 'page-announcements', label: 'Announcements', subtitle: 'Academic & placement notices', page: 'Announcements', icon: Megaphone },
  { id: 'page-settings', label: 'Settings', subtitle: 'Theme, motion & preferences', page: 'Settings', icon: Settings },
]

export function CommandPalette({ isOpen, onClose, onNavigate }) {
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef(null)

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => inputRef.current?.focus(), 20)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    const items = [
      ...pageEntries.map((item) => ({ ...item, group: 'Pages' })),
      ...campusLocations.map((loc) => ({
        id: `loc-${loc.id}`,
        label: loc.name,
        subtitle: `${loc.category} · Campus Map`,
        page: 'Campus Map',
        locationId: loc.id,
        icon: MapPin,
        group: 'Campus Locations',
      })),
      ...initialFacultyDirectory.map((fac) => ({
        id: fac.id,
        label: fac.name,
        subtitle: `${fac.department} · ${fac.office}`,
        page: 'Faculty',
        icon: Users,
        group: 'Faculty',
      })),
      ...campusEvents.map((evt) => ({
        id: evt.id,
        label: evt.title,
        subtitle: `${evt.day} ${evt.month} · ${evt.location}`,
        page: 'Events',
        icon: CalendarDays,
        group: 'Events',
      })),
    ]

    if (!q) return items.slice(0, 8)
    return items
      .filter((item) => `${item.label} ${item.subtitle} ${item.group}`.toLowerCase().includes(q))
      .slice(0, 10)
  }, [query])

  const safeActiveIndex = results.length === 0 ? 0 : Math.min(activeIndex, results.length - 1)

  const handleKeyDown = (event) => {
    if (event.key === 'Escape') {
      onClose()
      return
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActiveIndex((prev) => (results.length ? (prev + 1) % results.length : 0))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex((prev) =>
        results.length ? (prev - 1 + results.length) % results.length : 0,
      )
    } else if (event.key === 'Enter' && results[safeActiveIndex]) {
      event.preventDefault()
      const selected = results[safeActiveIndex]
      onNavigate(selected.page, selected.locationId ?? null)
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <motion.div
      aria-modal="true"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.16 }}
      className="fixed inset-0 z-50 flex items-start justify-center bg-slate-950/60 px-4 pt-[12vh] backdrop-blur-sm"
      onClick={onClose}
      onKeyDown={handleKeyDown}
      role="dialog"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: -12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: -8 }}
        transition={{ type: 'spring', stiffness: 420, damping: 30 }}
        className="w-full max-w-xl overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3.5 dark:border-slate-800">
          <Search size={18} className="text-brand-600 dark:text-brand-400" />
          <input
            ref={inputRef}
            aria-label="Command palette search"
            className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-white"
            onChange={(e) => {
              setQuery(e.target.value)
              setActiveIndex(0)
            }}
            placeholder="Jump to a block, professor, event, or page..."
            type="text"
            value={query}
          />
          <span className="font-mono-code hidden text-[10px] text-slate-400 sm:inline">
            ↑↓ Enter
          </span>
          <button
            aria-label="Close command palette"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800"
            onClick={onClose}
            type="button"
          >
            <X size={16} />
          </button>
        </div>

        <div className="max-h-[55vh] overflow-y-auto p-2">
          {results.length === 0 ? (
            <p className="px-4 py-8 text-center text-xs text-slate-400">
              No campus matches for “{query}”.
            </p>
          ) : (
            results.map((item, idx) => {
              const Icon = item.icon
              const isSelected = idx === safeActiveIndex
              return (
                <button
                  key={item.id}
                  className={`group flex w-full items-center gap-3 rounded-2xl px-3.5 py-2.5 text-left transition ${
                    isSelected
                      ? 'bg-brand-50/90 dark:bg-slate-800'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`}
                  onMouseEnter={() => setActiveIndex(idx)}
                  onClick={() => {
                    onNavigate(item.page, item.locationId ?? null)
                    onClose()
                  }}
                  type="button"
                >
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition ${
                      isSelected
                        ? 'bg-brand-600 text-white'
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                    }`}
                  >
                    <Icon size={16} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-bold text-slate-800 dark:text-slate-100">
                      {item.label}
                    </span>
                    <span className="block truncate text-[11px] text-slate-500 dark:text-slate-400">
                      {item.subtitle}
                    </span>
                  </span>
                  <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                    {item.group}
                  </span>
                  <ArrowRight
                    size={14}
                    className={`transition ${
                      isSelected ? 'translate-x-0.5 text-brand-600' : 'text-slate-300'
                    }`}
                  />
                </button>
              )
            })
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}
