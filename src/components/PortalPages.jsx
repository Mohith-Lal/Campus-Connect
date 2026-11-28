import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import {
  Bell,
  BellRing,
  Bookmark,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Copy,
  GraduationCap,
  LogOut,
  Mail,
  MapPin,
  Megaphone,
  Search,
  Send,
  SlidersHorizontal,
  Sparkles,
  Users,
  X,
} from 'lucide-react'
import {
  DAYS_OF_WEEK,
  campusEvents,
  computeFacultyAvailability,
  studentProfile,
} from '../data/campusPortalData.js'
import { BlurText, MagneticButton, SpotlightCard } from './ReactBits.jsx'
import { Reveal, RevealGroup, RevealItem } from './motion/Reveal.jsx'

function MotionFilterTabs({
  options,
  value,
  onChange,
  layoutId,
  pillClass = 'bg-brand-600',
  activeTextClass = 'text-white',
  inactiveClass = 'border border-slate-200 bg-white text-slate-600 hover:border-brand-300 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:text-white',
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((opt) => {
        const active = value === opt
        return (
          <button
            key={opt}
            className={`relative rounded-full px-3.5 py-1.5 text-[11px] font-semibold transition-colors ${
              active ? activeTextClass : inactiveClass
            }`}
            onClick={() => onChange(opt)}
            type="button"
          >
            {active && (
              <motion.span
                layoutId={layoutId}
                transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                className={`absolute inset-0 rounded-full shadow-sm ${pillClass}`}
              />
            )}
            <span className="relative z-10">{opt}</span>
          </button>
        )
      })}
    </div>
  )
}

export function FacultyPage({
  facultyList,
  urgentAlerts,
  onLocateOnMap,
  onNotify,
  onSendUrgentAlert,
}) {
  const [department, setDepartment] = useState('All')
  const [availabilityFilter, setAvailabilityFilter] = useState('All')
  const [selectedDay, setSelectedDay] = useState('Mon')
  const [query, setQuery] = useState('')
  const [activeFaculty, setActiveFaculty] = useState(null)
  const [urgentReason, setUrgentReason] = useState('')

  const departments = ['All', 'Computer Science', 'AI & ML', 'Architecture', 'Electronics', 'Information Science']

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return facultyList.filter((prof) => {
      const matchesDept = department === 'All' || prof.department === department
      const matchesAvail =
        availabilityFilter === 'All' ||
        (availabilityFilter === 'Available Now' && prof.liveStatus === 'available')
      const matchesQuery =
        !q ||
        `${prof.name} ${prof.role} ${prof.department} ${prof.research.join(' ')}`
          .toLowerCase()
          .includes(q)
      return matchesDept && matchesAvail && matchesQuery
    })
  }, [facultyList, department, availabilityFilter, query])

  const copyEmail = (email, name) => {
    navigator.clipboard?.writeText(email)
    onNotify(`Copied ${name}'s email (${email})`)
  }

  const submitUrgentAlert = (event) => {
    event.preventDefault()
    if (!activeFaculty || !urgentReason.trim()) return
    onSendUrgentAlert(activeFaculty, urgentReason.trim())
    setUrgentReason('')
    setActiveFaculty(null)
  }

  return (
    <section className="space-y-6">
      <Reveal className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-iris-50 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-iris-700 dark:bg-iris-500/15 dark:text-iris-300">
              <Users size={12} /> Academic Mentors &amp; Live Timetables
            </span>
            <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
              <BlurText text="Faculty Availability & Directory" />
            </h1>
            <p className="mt-1.5 max-w-2xl text-sm text-slate-600 dark:text-slate-400">
              Check real-time cabin availability via faculty timetables, locate cabins on the campus map, or send an urgent meeting alert.
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-1.5 dark:border-slate-700 dark:bg-slate-800">
            {['All', 'Available Now'].map((opt) => (
              <button
                key={opt}
                className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                  availabilityFilter === opt
                    ? 'bg-white text-emerald-700 shadow-xs dark:bg-slate-900 dark:text-emerald-400'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
                onClick={() => setAvailabilityFilter(opt)}
                type="button"
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <label className="relative block w-full lg:max-w-sm">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              aria-label="Filter faculty by name or research"
              className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-xs text-slate-800 outline-none transition focus:border-iris-400 focus:bg-white focus:ring-4 focus:ring-iris-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, research, or lab..."
              type="search"
              value={query}
            />
          </label>
          <MotionFilterTabs
            layoutId="faculty-dept-pill"
            options={departments}
            value={department}
            onChange={setDepartment}
            pillClass="bg-iris-600"
            activeTextClass="text-white"
            inactiveClass="border border-slate-200 bg-white text-slate-600 hover:border-iris-300 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
          />
        </div>
      </Reveal>

      <RevealGroup className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" stagger={0.05}>
        {filtered.map((prof) => {
          const availability = computeFacultyAvailability(prof, selectedDay)
          const myLatestAlert = urgentAlerts.find((a) => a.facultyId === prof.id)

          return (
            <RevealItem key={prof.id}>
              <SpotlightCard
                spotlightColor="rgba(124, 58, 237, 0.12)"
                className="flex h-full flex-col justify-between rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition-colors hover:border-iris-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-iris-500/40"
              >
                <div className="flex h-full flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-iris-600 to-brand-600 text-sm font-extrabold text-white shadow-sm">
                          {prof.initials}
                        </span>
                        <div>
                          <h2 className="text-sm font-bold text-slate-900 dark:text-white">{prof.name}</h2>
                          <p className="text-[11px] font-medium text-slate-600 dark:text-slate-400">
                            {prof.role}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold ${
                          availability.tone === 'available'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'
                            : availability.tone === 'in-class'
                              ? 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300'
                              : 'bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300'
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            availability.tone === 'available'
                              ? 'bg-emerald-500'
                              : availability.tone === 'in-class'
                                ? 'bg-amber-500'
                                : 'bg-rose-500'
                          }`}
                        />
                        {availability.label}
                      </span>
                    </div>

                    <div className="mt-4 space-y-2 text-xs text-slate-600 dark:text-slate-300">
                      <p className="flex items-center gap-2">
                        <MapPin size={14} className="shrink-0 text-brand-600 dark:text-brand-400" />
                        <span>{prof.office}</span>
                      </p>
                      <p className="flex items-center gap-2">
                        <Clock3 size={14} className="shrink-0 text-amber-500" />
                        <span>{prof.officeHours}</span>
                      </p>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {prof.research.map((topic) => (
                        <span
                          key={topic}
                          className="rounded-lg bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                        >
                          {topic}
                        </span>
                      ))}
                    </div>

                    {myLatestAlert && (
                      <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50/70 px-3 py-2 text-[11px] text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
                        <strong>Urgent Request ({myLatestAlert.status}):</strong>{' '}
                        {myLatestAlert.replyNote || myLatestAlert.reason}
                      </div>
                    )}
                  </div>

                  <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
                    <button
                      className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-brand-600 px-3 py-2 text-[11px] font-bold text-white transition hover:bg-brand-700"
                      onClick={() => setActiveFaculty(prof)}
                      type="button"
                    >
                      <CalendarDays size={13} /> Timetable &amp; Alert
                    </button>
                    <button
                      aria-label={`Locate ${prof.name}'s cabin on map`}
                      className="inline-flex items-center justify-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[11px] font-semibold text-slate-700 transition hover:border-brand-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                      onClick={() => onLocateOnMap(prof.locationId)}
                      type="button"
                    >
                      <MapPin size={13} /> Map
                    </button>
                    <button
                      aria-label={`Copy ${prof.name}'s email`}
                      className="inline-flex items-center justify-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-[11px] font-semibold text-slate-700 transition hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                      onClick={() => copyEmail(prof.email, prof.name)}
                      type="button"
                    >
                      <Mail size={13} />
                      <Copy size={11} />
                    </button>
                  </div>
                </div>
              </SpotlightCard>
            </RevealItem>
          )
        })}
      </RevealGroup>

      {/* Timetable & Urgent Push Alert Modal */}
      <AnimatePresence>
        {activeFaculty && (
          <motion.div
            aria-modal="true"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
            onClick={() => setActiveFaculty(null)}
            role="dialog"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              className="w-full max-w-2xl overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4 dark:border-slate-800">
                <div>
                  <h2 className="font-display text-lg font-extrabold text-slate-900 dark:text-white">
                    {activeFaculty.name} — Weekly Timetable
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {activeFaculty.office} · {activeFaculty.officeHours}
                  </p>
                </div>
                <button
                  aria-label="Close timetable modal"
                  className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                  onClick={() => setActiveFaculty(null)}
                  type="button"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="mt-4 flex flex-wrap gap-1.5">
                {DAYS_OF_WEEK.map((day) => (
                  <button
                    key={day}
                    className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition ${
                      selectedDay === day
                        ? 'bg-iris-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                    }`}
                    onClick={() => setSelectedDay(day)}
                    type="button"
                  >
                    {day}
                  </button>
                ))}
              </div>

              <div className="mt-4 max-h-52 space-y-2 overflow-y-auto pr-1">
                {activeFaculty.timetable.filter((s) => s.day === selectedDay).length === 0 ? (
                  <p className="rounded-2xl border border-dashed border-slate-200 py-6 text-center text-xs text-slate-500 dark:border-slate-700">
                    No scheduled classes on {selectedDay}. Check cabin or send an urgent request below.
                  </p>
                ) : (
                  activeFaculty.timetable
                    .filter((s) => s.day === selectedDay)
                    .map((slot) => (
                      <div
                        key={slot.id}
                        className="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-3.5 py-2.5 dark:border-slate-800 dark:bg-slate-800/60"
                      >
                        <div>
                          <p className="text-xs font-bold text-slate-900 dark:text-white">{slot.title}</p>
                          <p className="font-mono-code text-[11px] text-slate-500 dark:text-slate-400">
                            {slot.time} · {slot.room}
                          </p>
                        </div>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                            slot.type === 'office-hours'
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'
                              : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200'
                          }`}
                        >
                          {slot.type === 'office-hours' ? 'Available' : slot.type}
                        </span>
                      </div>
                    ))
                )}
              </div>

              <form
                className="mt-5 rounded-2xl border border-amber-200 bg-amber-50/70 p-4 dark:border-amber-500/30 dark:bg-amber-500/10"
                onSubmit={submitUrgentAlert}
              >
                <div className="flex items-center gap-2 text-xs font-extrabold text-amber-950 dark:text-amber-200">
                  <BellRing size={15} className="text-amber-600" /> Send Urgent Meeting Push Alert
                </div>
                <p className="mt-1 text-[11px] text-amber-800 dark:text-amber-300">
                  Directly notifies {activeFaculty.name} in their Notification Center and triggers a push alert.
                </p>
                <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                  <input
                    className="h-10 flex-1 rounded-xl border border-amber-300 bg-white px-3 text-xs font-semibold text-slate-900 placeholder:text-slate-400 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-amber-500/40 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-500"
                    onChange={(e) => setUrgentReason(e.target.value)}
                    placeholder="Reason (e.g. Urgent lab sign-off / project review)..."
                    type="text"
                    value={urgentReason}
                  />
                  <button
                    className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-amber-500 px-4 text-xs font-extrabold text-slate-950 transition hover:bg-amber-400 active:scale-95"
                    type="submit"
                  >
                    <Send size={13} /> Trigger Push Alert
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}

export function EventsPage({ rsvpIds, onToggleRsvp, onLocateOnMap }) {
  const [category, setCategory] = useState('ALL')
  const categories = ['ALL', 'WORKSHOP', 'CAMPUS LIFE', 'ACADEMIC', 'SPORTS']

  const filteredEvents = useMemo(
    () =>
      category === 'ALL'
        ? campusEvents
        : campusEvents.filter((evt) => evt.category === category),
    [category],
  )

  return (
    <section className="space-y-6">
      <div className="campus-hero-mesh rounded-3xl p-6 text-white shadow-lg sm:p-8">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-sun-300 backdrop-blur-md">
          <Sparkles size={12} /> Student Life &amp; Clubs
        </span>
        <h1 className="mt-3 text-2xl font-extrabold tracking-tight sm:text-3xl">
          <BlurText text="Campus Events & Experiences" />
        </h1>
        <p className="mt-1.5 max-w-2xl text-sm text-slate-200">
          Workshops, acoustic nights, varsity tournaments, and undergraduate research symposiums across BMSIT&amp;M.
        </p>

        <div className="mt-5">
          <MotionFilterTabs
            layoutId="events-cat-pill"
            options={categories}
            value={category}
            onChange={setCategory}
            pillClass="bg-sun-400"
            activeTextClass="text-slate-950 font-bold"
            inactiveClass="bg-white/15 text-white hover:bg-white/25"
          />
        </div>
      </div>

      <RevealGroup className="grid gap-4 md:grid-cols-2" stagger={0.06}>
        {filteredEvents.map((event) => {
          const isGoing = rsvpIds.includes(event.id)
          const fillPercent = Math.min(100, Math.round(((event.attendees + (isGoing ? 1 : 0)) / event.capacity) * 100))

          return (
            <RevealItem key={event.id}>
              <SpotlightCard
                spotlightColor="rgba(59, 130, 246, 0.12)"
                className="flex h-full flex-col justify-between rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="flex h-full flex-col justify-between">
                  <div>
                    <div className="flex items-start gap-4">
                      <div className="flex h-16 w-14 shrink-0 flex-col items-center justify-center rounded-2xl bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">
                        <span className="text-xl font-extrabold leading-none">{event.day}</span>
                        <span className="mt-1 text-[10px] font-bold tracking-[0.14em]">{event.month}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-brand-600 dark:text-brand-400">
                          {event.category}
                        </span>
                        <h2 className="mt-1 text-base font-bold text-slate-900 dark:text-white">
                          {event.title}
                        </h2>
                      </div>
                    </div>

                    <p className="mt-3 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                      {event.description}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                      <span className="inline-flex items-center gap-1.5">
                        <Clock3 size={13} className="text-sun-500" /> {event.time}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin size={13} className="text-brand-500" /> {event.location}
                      </span>
                    </div>

                    <div className="mt-4">
                      <div className="flex items-center justify-between text-[11px] font-medium text-slate-500 dark:text-slate-400">
                        <span>{event.attendees + (isGoing ? 1 : 0)} / {event.capacity} seats filled</span>
                        <span className="font-mono-code">{fillPercent}%</span>
                      </div>
                      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${fillPercent}%` }}
                          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                          className="h-full rounded-full bg-linear-to-r from-brand-500 to-iris-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 flex items-center gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
                    <MagneticButton
                      className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-bold transition ${
                        isGoing
                          ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                          : 'bg-brand-600 text-white hover:bg-brand-700'
                      }`}
                      onClick={() => onToggleRsvp(event.id, event.title)}
                    >
                      {isGoing ? <CheckCircle2 size={14} /> : <Bookmark size={14} />}
                      {isGoing ? 'Spot Reserved' : 'Reserve Seat'}
                    </MagneticButton>
                    <button
                      className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-700 transition hover:border-brand-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                      onClick={() => onLocateOnMap(event.locationId)}
                      type="button"
                    >
                      <MapPin size={14} /> Map
                    </button>
                  </div>
                </div>
              </SpotlightCard>
            </RevealItem>
          )
        })}
      </RevealGroup>
    </section>
  )
}

export function AnnouncementsPage({ announcements, readIds, onToggleRead }) {
  const [filter, setFilter] = useState('ALL')
  const categories = ['ALL', 'ACADEMIC', 'CAMPUS UPDATE', 'STUDENT LIFE', 'PLACEMENTS']

  const visible = useMemo(
    () =>
      filter === 'ALL'
        ? announcements
        : announcements.filter((a) => a.category === filter),
    [announcements, filter],
  )

  return (
    <section className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-7">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-mint-50 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-mint-700 dark:bg-mint-500/15 dark:text-mint-300">
          <Megaphone size={12} /> Official Notice Board
        </span>
        <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
          <BlurText text="Campus Announcements" />
        </h1>
        <p className="mt-1.5 max-w-2xl text-sm text-slate-600 dark:text-slate-400">
          Academic deadlines, library schedules, student ambassador calls, and faculty circulars.
        </p>

        <div className="mt-5">
          <MotionFilterTabs
            layoutId="notices-cat-pill"
            options={categories}
            value={filter}
            onChange={setFilter}
            pillClass="bg-brand-600"
            activeTextClass="text-white"
            inactiveClass="border border-slate-200 bg-white text-slate-600 hover:border-brand-300 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
          />
        </div>
      </div>

      <div className="space-y-3">
        {visible.map((item) => {
          const isRead = readIds.includes(item.id)
          return (
            <article
              key={item.id}
              className={`rounded-3xl border p-5 transition ${
                isRead
                  ? 'border-slate-200/70 bg-white/80 opacity-85 dark:border-slate-800 dark:bg-slate-900/60'
                  : 'border-brand-200 bg-white shadow-sm dark:border-brand-500/30 dark:bg-slate-900'
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-md bg-brand-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">
                      {item.category}
                    </span>
                    <span className="rounded-md bg-sun-50 px-2 py-0.5 text-[10px] font-bold text-sun-700 dark:bg-sun-500/15 dark:text-sun-300">
                      {item.priority}
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">{item.time}</span>
                  </div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    {item.title}
                  </h2>
                </div>
                <button
                  className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-[11px] font-semibold transition ${
                    isRead
                      ? 'border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400'
                      : 'border-mint-200 bg-mint-50 text-mint-700 hover:bg-mint-100 dark:border-mint-500/30 dark:bg-mint-500/15 dark:text-mint-300'
                  }`}
                  onClick={() => onToggleRead(item.id)}
                  type="button"
                >
                  <CheckCircle2 size={13} />
                  {isRead ? 'Read' : 'Mark Read'}
                </button>
              </div>
              <p className="mt-2.5 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                {item.summary}
              </p>
              <p className="mt-3 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                Posted by {item.author}
              </p>
            </article>
          )
        })}
      </div>
    </section>
  )
}

export function SettingsPage({
  session,
  onNotify,
  onSignOut,
}) {
  return (
    <section className="mx-auto max-w-3xl space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-7">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-700 dark:bg-slate-800 dark:text-slate-300">
          <SlidersHorizontal size={12} /> Account
        </span>
        <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          <BlurText text="Account Overview" />
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Manage your active Campus Connect session and profile status.
        </p>
      </div>

      <div className="space-y-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-mint-50 text-mint-600 dark:bg-mint-500/15 dark:text-mint-300">
              <GraduationCap size={18} />
            </span>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                {session?.name ?? studentProfile.name}
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                {session?.subtitle ?? `${studentProfile.branch} · ${studentProfile.semester}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              onClick={() => onNotify('Portal data synced')}
              type="button"
            >
              <Bell size={14} /> Sync
            </button>
            <button
              className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-rose-700"
              onClick={onSignOut}
              type="button"
            >
              <LogOut size={14} /> Sign Out
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
