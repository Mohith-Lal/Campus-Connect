import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, MotionConfig, motion } from 'motion/react'
import {
  ArrowRight,
  ArrowUpRight,
  Award,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Coffee,
  Compass,
  MapPin,
  Megaphone,
  Sparkles,
  Users,
} from 'lucide-react'
import CampusMap from './CampusMap.jsx'
import { AuthGate } from './components/AuthGate.jsx'
import { CampusBackdrop } from './components/CampusBackdrop.jsx'
import { CommandPalette } from './components/CommandPalette.jsx'
import {
  FacultyDashboard,
  FacultyNotificationsPage,
  FacultyTimetablePage,
} from './components/FacultyWorkspace.jsx'
import {
  AnnouncementsPage,
  EventsPage,
  FacultyPage,
  SettingsPage,
} from './components/PortalPages.jsx'
import {
  BlurText,
  CountUpNumber,
  MagneticButton,
  PageTransition,
  SpotlightCard,
} from './components/ReactBits.jsx'
import { Reveal, RevealGroup, RevealItem } from './components/motion/Reveal.jsx'
import { SectionHeader } from './components/motion/Tilt.jsx'
import { Sidebar } from './components/shell/Sidebar.jsx'
import { TopBar } from './components/shell/TopBar.jsx'
import {
  campusEvents,
  campusTickerItems,
  initialAnnouncements,
  initialFacultyDirectory,
  initialUrgentAlerts,
  studentProfile,
  todayClasses,
} from './data/campusPortalData.js'

const quickLinks = [
  {
    label: 'Campus Navigator',
    detail: 'GPS walking routes & blocks',
    icon: Compass,
    tone: 'blue',
    spotlight: 'rgba(37, 99, 235, 0.14)',
    page: 'Campus Map',
  },
  {
    label: 'Faculty Timetables',
    detail: 'Live cabin status & urgent alerts',
    icon: Users,
    tone: 'violet',
    spotlight: 'rgba(124, 58, 237, 0.14)',
    page: 'Faculty',
  },
  {
    label: 'Events & Fests',
    detail: 'Reserve seats & workshops',
    icon: CalendarDays,
    tone: 'amber',
    spotlight: 'rgba(245, 158, 11, 0.14)',
    page: 'Events',
  },
  {
    label: 'Notice Board',
    detail: 'Deadlines & library updates',
    icon: Megaphone,
    tone: 'emerald',
    spotlight: 'rgba(16, 185, 129, 0.14)',
    page: 'Announcements',
  },
]

const toneStyles = {
  blue: 'bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300',
  violet: 'bg-iris-50 text-iris-600 dark:bg-iris-500/15 dark:text-iris-300',
  amber: 'bg-sun-50 text-sun-600 dark:bg-sun-500/15 dark:text-sun-300',
  emerald: 'bg-mint-50 text-mint-600 dark:bg-mint-500/15 dark:text-mint-300',
}

const studySpots = [
  { id: 'spot-lib', name: 'Central Library Pods', status: '14 / 40 seats free' },
  { id: 'spot-kaapi', name: 'Kaapi Kuteera Patio', status: 'Low queue · 4 min' },
  { id: 'spot-lab', name: 'Innovation Lab C', status: 'Open for sprint' },
]

function readStoredJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function StudentDashboard({
  searchTerm,
  facultyList,
  announcements,
  urgentAlerts,
  onNavigate,
  onLocateOnMap,
  rsvpIds,
  onToggleRsvp,
  checkedInSpot,
  onCheckInSpot,
}) {
  const [scheduleFilter, setScheduleFilter] = useState('all')
  const normalizedSearch = searchTerm.trim().toLowerCase()

  const visibleLinks = useMemo(
    () =>
      quickLinks.filter((link) =>
        `${link.label} ${link.detail}`.toLowerCase().includes(normalizedSearch),
      ),
    [normalizedSearch],
  )

  const filteredClasses = useMemo(() => {
    if (scheduleFilter === 'all') return todayClasses
    return todayClasses.filter((cls) => cls.status === scheduleFilter)
  }, [scheduleFilter])

  const visibleEvents = useMemo(
    () =>
      campusEvents
        .filter((event) =>
          `${event.title} ${event.category} ${event.location}`
            .toLowerCase()
            .includes(normalizedSearch),
        )
        .slice(0, 3),
    [normalizedSearch],
  )

  const visibleAnnouncements = useMemo(
    () =>
      announcements
        .filter((a) =>
          `${a.title} ${a.category}`.toLowerCase().includes(normalizedSearch),
        )
        .slice(0, 3),
    [announcements, normalizedSearch],
  )

  const liveClass = todayClasses.find((cls) => cls.status === 'live') ?? todayClasses[0]
  const creditPercent = Math.round(
    (studentProfile.creditsEarned / studentProfile.totalCredits) * 100,
  )
  const availableFacultyCount = facultyList.filter((f) => f.liveStatus === 'available').length

  return (
    <div className="space-y-7">
      {/* Clean Zero-Overlap Hero */}
      <section className="campus-hero-mesh rounded-[28px] p-6 text-white shadow-xl sm:p-8 lg:p-10">
        <div className="grid gap-6 lg:grid-cols-[1.3fr_0.9fr] lg:items-center">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 text-[11px] font-semibold text-blue-100 backdrop-blur-md">
              <span className="h-2 w-2 rounded-full bg-mint-400" />
              Fall Semester ’24 · Week 11 · {studentProfile.semester}
            </div>

            <h1 className="font-display text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-[42px] lg:leading-[1.12]">
              <BlurText text={`Welcome back, ${studentProfile.name.split(' ')[0]}.`} />{' '}
              <span className="font-editorial text-spectral italic font-normal text-4xl sm:text-5xl">
                <BlurText delay={0.14} text="Here is your day at BMSIT." />
              </span>
            </h1>

            <p className="max-w-xl text-sm leading-relaxed text-slate-200">
              Walk to your lectures on time, see which teachers are in their cabins, and check today’s announcements and campus hangouts.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <MagneticButton
                className="btn btn-sun sweep px-5 py-3 text-xs font-extrabold"
                onClick={() => onNavigate('Campus Map')}
              >
                <Compass size={16} />
                Launch Campus Map
              </MagneticButton>
              <MagneticButton
                className="sweep inline-flex items-center gap-2 rounded-2xl border border-white/25 bg-white/10 px-5 py-3 text-xs font-bold text-white backdrop-blur-md transition hover:bg-white/20"
                onClick={() => onNavigate('Faculty')}
              >
                Check Faculty ({availableFacultyCount} Free)
                <ArrowRight size={15} />
              </MagneticButton>
            </div>
          </div>

          {/* Dedicated Live Lecture Card (Cleanly in its own grid column) */}
          <SpotlightCard
            spotlightColor="rgba(56, 189, 248, 0.22)"
            className="rounded-3xl border border-white/15 bg-slate-950/60 p-5 backdrop-blur-xl"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-mint-400/20 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-mint-300">
                <Sparkles size={11} /> Live Lecture
              </span>
              <span className="font-mono-code text-[11px] font-semibold text-sun-300">
                {liveClass.code}
              </span>
            </div>
            <h2 className="mt-3 text-lg font-bold text-white">{liveClass.subject}</h2>
            <p className="mt-1 text-xs text-slate-300">
              {liveClass.instructor} · {liveClass.room}
            </p>
            <div className="mt-4">
              <div className="flex items-center justify-between text-[11px] text-slate-300">
                <span>{liveClass.time}</span>
                <span className="font-mono-code">{liveClass.progress}% elapsed</span>
              </div>
              <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-white/15">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${liveClass.progress}%` }}
                  transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                  className="h-full rounded-full bg-linear-to-r from-mint-400 to-sky-400"
                />
              </div>
            </div>
            <button
              className="mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-white/15 px-3 py-2 text-xs font-semibold text-white transition hover:bg-white/25"
              onClick={() => onLocateOnMap(liveClass.locationId)}
              type="button"
            >
              <MapPin size={14} className="text-sun-300" />
              Walk to {liveClass.room.split(', ')[1] ?? 'Block'}
            </button>
          </SpotlightCard>
        </div>

        {/* Live Campus Pulse Ticker */}
        <div className="mt-6 overflow-hidden rounded-2xl border border-white/10 bg-slate-950/45 py-2.5 backdrop-blur-md">
          <div className="animate-ticker flex items-center gap-8 whitespace-nowrap text-xs font-medium text-slate-200">
            {[...campusTickerItems, ...campusTickerItems].map((item, index) => (
              <span key={index} className="inline-flex items-center gap-2.5">
                <span className="h-1.5 w-1.5 rounded-full bg-sun-400" />
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Student Academic Vitals & Life Dashboard Grid */}
      <Reveal className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300">
            <CheckCircle2 size={18} />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Attendance</span>
            <p className="text-sm font-extrabold text-slate-900 dark:text-white">{studentProfile.attendance} · All Clear</p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300">
            <Award size={18} />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Current CGPA</span>
            <p className="text-sm font-extrabold text-slate-900 dark:text-white">{studentProfile.cgpa} · Dean&apos;s Honors</p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-iris-50 text-iris-600 dark:bg-iris-500/15 dark:text-iris-300">
            <CalendarDays size={18} />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Academic Standing</span>
            <p className="text-sm font-extrabold text-slate-900 dark:text-white">{studentProfile.usn}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300">
            <Clock3 size={18} />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Semester Progress</span>
            <p className="text-sm font-extrabold text-slate-900 dark:text-white">Week 11 of 16 (68%)</p>
          </div>
        </div>
      </Reveal>

      {/* Quick-Launch Bento */}
      <RevealGroup className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-4" stagger={0.05}>
        {visibleLinks.map(({ label, detail, icon: Icon, tone, spotlight, page }) => (
          <RevealItem key={label}>
            <SpotlightCard
              spotlightColor={spotlight}
              className="h-full rounded-3xl border border-slate-200 bg-white shadow-sm transition-colors hover:border-brand-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-brand-500/50"
            >
              <button
                className="group flex h-full w-full items-center gap-3.5 p-4 text-left"
                onClick={() => onNavigate(page)}
                type="button"
              >
                <span
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${toneStyles[tone]}`}
                >
                  <Icon size={20} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold text-slate-900 dark:text-white">
                    {label}
                  </span>
                  <span className="mt-0.5 block truncate text-[11px] text-slate-600 dark:text-slate-400">
                    {detail}
                  </span>
                </span>
                <ArrowUpRight
                  size={16}
                  className="text-slate-400 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-brand-600 dark:group-hover:text-brand-400"
                />
              </button>
            </SpotlightCard>
          </RevealItem>
        ))}
      </RevealGroup>

      {/* Academic Snapshot + Today's Timetable */}
      <Reveal className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                Today’s Class Schedule
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Filter sessions or tap Map for walking directions
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {['all', 'live', 'upcoming', 'completed'].map((status) => (
                <button
                  key={status}
                  className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider transition ${
                    scheduleFilter === status
                      ? 'bg-brand-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:text-slate-900 dark:bg-slate-800 dark:text-slate-400'
                  }`}
                  onClick={() => setScheduleFilter(status)}
                  type="button"
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2.5">
            {filteredClasses.map((cls) => (
              <motion.div
                layout
                key={cls.id}
                className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-3.5 transition ${
                  cls.status === 'live'
                    ? 'border-brand-300 bg-brand-50/70 dark:border-brand-500/40 dark:bg-brand-500/10'
                    : 'border-slate-100 bg-slate-50/80 dark:border-slate-800 dark:bg-slate-800/40'
                }`}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className={`font-mono-code rounded-xl px-2.5 py-1.5 text-[11px] font-bold ${
                      cls.status === 'completed'
                        ? 'bg-mint-50 text-mint-700 dark:bg-mint-500/20 dark:text-mint-300'
                        : cls.status === 'live'
                          ? 'bg-brand-600 text-white'
                          : 'bg-slate-200/80 text-slate-700 dark:bg-slate-700 dark:text-slate-200'
                    }`}
                  >
                    {cls.code}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold text-slate-900 dark:text-white">
                      {cls.subject}
                    </p>
                    <p className="truncate text-[11px] text-slate-600 dark:text-slate-400">
                      {cls.time} · {cls.room}
                    </p>
                  </div>
                </div>

                <button
                  className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-700 transition hover:border-brand-300 hover:text-brand-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                  onClick={() => onLocateOnMap(cls.locationId)}
                  type="button"
                >
                  <MapPin size={12} /> Map
                </button>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Right Column: Progress + Stats + Study Spots */}
        <div className="grid gap-4">
          <SpotlightCard
            spotlightColor="rgba(245, 158, 11, 0.12)"
            className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Degree Progress
              </span>
              <Award size={18} className="text-sun-500" />
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="font-display text-3xl font-extrabold text-slate-900 dark:text-white">
                <CountUpNumber value={studentProfile.creditsEarned} />
                <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                  {' '}/ {studentProfile.totalCredits} credits
                </span>
              </span>
              <span className="font-mono-code text-xs font-bold text-mint-600 dark:text-mint-400">
                {creditPercent}%
              </span>
            </div>
            <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${creditPercent}%` }}
                transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
                className="h-full rounded-full bg-linear-to-r from-brand-600 via-iris-500 to-sun-400"
              />
            </div>
            <p className="mt-3 text-xs text-slate-600 dark:text-slate-400">
              {studentProfile.clubRole}
            </p>
          </SpotlightCard>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <Building2 size={18} className="text-brand-600 dark:text-brand-400" />
              <p className="font-display mt-3 text-2xl font-extrabold text-slate-900 dark:text-white">
                <CountUpNumber value={12} />
              </p>
              <p className="text-[11px] font-medium text-slate-600 dark:text-slate-400">
                Mapped Campus Spots
              </p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <Users size={18} className="text-iris-600 dark:text-iris-400" />
              <p className="font-display mt-3 text-2xl font-extrabold text-slate-900 dark:text-white">
                <CountUpNumber value={availableFacultyCount} />
              </p>
              <p className="text-[11px] font-medium text-slate-600 dark:text-slate-400">
                Faculty Free Now ({urgentAlerts.length} alerts)
              </p>
            </div>
          </div>

          {/* Interactive Study Spot Check-in */}
          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-3 flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white">
                <Coffee size={14} className="text-sun-500" /> Live Hangout &amp; Study Spots
              </span>
              <span className="text-[10px] font-semibold text-mint-600 dark:text-mint-400">
                Real-time pulse
              </span>
            </div>
            <div className="space-y-2">
              {studySpots.map((spot) => {
                const checkedIn = checkedInSpot === spot.id
                return (
                  <div
                    key={spot.id}
                    className="flex items-center justify-between gap-2 rounded-2xl bg-slate-50 px-3 py-2 dark:bg-slate-800/60"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-xs font-bold text-slate-800 dark:text-slate-100">
                        {spot.name}
                      </p>
                      <p className="text-[10px] text-slate-600 dark:text-slate-400">
                        {spot.status}
                      </p>
                    </div>
                    <button
                      className={`rounded-xl px-2.5 py-1 text-[10px] font-bold transition ${
                        checkedIn
                          ? 'bg-mint-600 text-white'
                          : 'border border-slate-200 bg-white text-slate-700 hover:border-brand-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300'
                      }`}
                      onClick={() => onCheckInSpot(spot.id, spot.name)}
                      type="button"
                    >
                      {checkedIn ? 'Checked In' : 'Check In'}
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </Reveal>

      {/* Events + Announcements Split */}
      <Reveal className="grid items-start gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-3.5">
          <SectionHeader
            className="mb-1"
            eyebrow="This Week on Campus"
            title="Upcoming Campus Events"
            action={
              <button
                className="inline-flex items-center gap-1 rounded-full border border-brand-200 bg-brand-50 px-3.5 py-1.5 text-xs font-bold text-brand-700 transition hover:bg-brand-100 dark:border-brand-500/40 dark:bg-brand-500/10 dark:text-brand-300"
                onClick={() => onNavigate('Events')}
                type="button"
              >
                All events <ArrowRight size={14} />
              </button>
            }
          />

          <div className="space-y-3">
            {visibleEvents.map((event) => {
              const going = rsvpIds.includes(event.id)
              return (
                <SpotlightCard
                  key={event.id}
                  className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-2xl bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">
                      <span className="text-lg font-extrabold leading-none">{event.day}</span>
                      <span className="mt-1 text-[9px] font-bold tracking-[0.14em]">{event.month}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-brand-600 dark:text-brand-400">
                        {event.category}
                      </span>
                      <h3 className="truncate text-sm font-bold text-slate-900 dark:text-white">
                        {event.title}
                      </h3>
                      <div className="mt-1 flex flex-wrap gap-3 text-[11px] text-slate-600 dark:text-slate-400">
                        <span className="inline-flex items-center gap-1">
                          <Clock3 size={12} /> {event.time}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <MapPin size={12} /> {event.location}
                        </span>
                      </div>
                    </div>
                    <button
                      className={`rounded-xl px-3.5 py-2 text-[11px] font-bold transition ${
                        going
                          ? 'bg-mint-50 text-mint-700 dark:bg-mint-500/15 dark:text-mint-300'
                          : 'bg-slate-100 text-slate-700 hover:bg-brand-600 hover:text-white dark:bg-slate-800 dark:text-slate-200'
                      }`}
                      onClick={() => onToggleRsvp(event.id, event.title)}
                      type="button"
                    >
                      {going ? 'Going ✓' : 'RSVP'}
                    </button>
                  </div>
                </SpotlightCard>
              )
            })}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
              Latest Notices
            </h2>
            <button
              className="inline-flex items-center gap-1 text-xs font-bold text-brand-600 hover:text-brand-700 dark:text-brand-400"
              onClick={() => onNavigate('Announcements')}
              type="button"
            >
              See all <ArrowRight size={14} />
            </button>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {visibleAnnouncements.map((item) => (
              <div key={item.id} className="py-3.5 first:pt-0 last:pb-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
                    {item.category}
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">{item.time}</span>
                </div>
                <h3 className="mt-1 text-xs font-bold leading-snug text-slate-800 dark:text-slate-100">
                  {item.title}
                </h3>
              </div>
            ))}
          </div>
        </div>
      </Reveal>
    </div>
  )
}

function App() {
  const [session, setSession] = useState(() => readStoredJson('cc-session', null))
  const [facultyList, setFacultyList] = useState(() =>
    readStoredJson('cc-faculty-list', initialFacultyDirectory),
  )
  const [announcements, setAnnouncements] = useState(() =>
    readStoredJson('cc-announcements', initialAnnouncements),
  )
  const [urgentAlerts, setUrgentAlerts] = useState(() =>
    readStoredJson('cc-urgent-alerts', initialUrgentAlerts),
  )

  const [activePage, setActivePage] = useState('Dashboard')
  const [mapFocusLocationId, setMapFocusLocationId] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isCommandOpen, setIsCommandOpen] = useState(false)
  const [toast, setToast] = useState('')
  const [rsvpIds, setRsvpIds] = useState(['evt-1'])
  const [readIds, setReadIds] = useState(['ann-3', 'ann-4'])
  const [checkedInSpot, setCheckedInSpot] = useState('')
  const [pushPermission, setPushPermission] = useState(() =>
    typeof Notification !== 'undefined' ? Notification.permission : 'default',
  )

  const [darkMode, setDarkMode] = useState(() => {
    try {
      const saved = localStorage.getItem('cc-dark-mode')
      if (saved !== null) {
        return saved === 'true'
      }
      return typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches
    } catch {
      return false
    }
  })
  const [reducedMotion] = useState(() => {
    try {
      return localStorage.getItem('cc-reduced-motion') === 'true'
    } catch {
      return false
    }
  })

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
    try {
      localStorage.setItem('cc-dark-mode', String(darkMode))
    } catch {
      // ignore storage errors
    }
  }, [darkMode])

  // Auto-detect device dark mode changes if user hasn't manually overridden
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = (e) => {
      try {
        if (localStorage.getItem('cc-dark-mode') === null) {
          setDarkMode(e.matches)
        }
      } catch {
        // ignore storage errors
      }
    }
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle('reduced-motion', reducedMotion)
    try {
      localStorage.setItem('cc-reduced-motion', String(reducedMotion))
    } catch {
      // ignore storage errors
    }
  }, [reducedMotion])

  useEffect(() => {
    try {
      localStorage.setItem('cc-session', JSON.stringify(session))
      localStorage.setItem('cc-faculty-list', JSON.stringify(facultyList))
      localStorage.setItem('cc-announcements', JSON.stringify(announcements))
      localStorage.setItem('cc-urgent-alerts', JSON.stringify(urgentAlerts))
    } catch {
      // ignore storage errors
    }
  }, [session, facultyList, announcements, urgentAlerts])

  // Sync across tabs if Student & Faculty are open simultaneously
  useEffect(() => {
    const onStorage = (event) => {
      if (event.key === 'cc-faculty-list' && event.newValue) {
        setFacultyList(JSON.parse(event.newValue))
      } else if (event.key === 'cc-announcements' && event.newValue) {
        setAnnouncements(JSON.parse(event.newValue))
      } else if (event.key === 'cc-urgent-alerts' && event.newValue) {
        setUrgentAlerts(JSON.parse(event.newValue))
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  useEffect(() => {
    const onKeyDown = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setIsCommandOpen((prev) => !prev)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  const showToast = (message) => {
    setToast(message)
    window.clearTimeout(window.__ccToastTimer)
    window.__ccToastTimer = window.setTimeout(() => setToast(''), 3400)
  }

  const handleLogin = (newSession) => {
    setSession(newSession)
    setActivePage(newSession.startPage ?? 'Dashboard')
    if (newSession.targetLocationId) {
      setMapFocusLocationId(newSession.targetLocationId)
    }
    showToast(
      newSession.role === 'guest'
        ? `Welcome to BMSIT&M! Exploring as Guest.`
        : `Signed in as ${newSession.name}`,
    )
  }

  const handleSignOut = () => {
    setSession(null)
    setActivePage('Dashboard')
  }

  const navigateTo = (page, locationId = null) => {
    setActivePage(page)
    if (locationId) setMapFocusLocationId(locationId)
    setSearchTerm('')
    setIsSidebarOpen(false)
  }

  const locateOnMap = (locationId) => {
    setMapFocusLocationId(locationId)
    setActivePage('Campus Map')
    setIsSidebarOpen(false)
  }

  const toggleRsvp = (eventId, title) => {
    setRsvpIds((current) => {
      const exists = current.includes(eventId)
      showToast(exists ? `Cancelled RSVP for ${title}` : `Seat reserved for ${title}`)
      return exists ? current.filter((id) => id !== eventId) : [...current, eventId]
    })
  }

  const toggleRead = (announcementId) => {
    setReadIds((current) =>
      current.includes(announcementId)
        ? current.filter((id) => id !== announcementId)
        : [...current, announcementId],
    )
  }

  const handleCheckInSpot = (spotId, spotName) => {
    setCheckedInSpot((current) => {
      const next = current === spotId ? '' : spotId
      showToast(next ? `Checked in at ${spotName}` : `Checked out from ${spotName}`)
      return next
    })
  }

  const handleSendUrgentAlert = (faculty, reason) => {
    const newAlert = {
      id: `alert-${Date.now()}`,
      facultyId: faculty.id,
      facultyName: faculty.name,
      studentName: session?.name ?? studentProfile.name,
      studentUsn: studentProfile.usn,
      reason,
      urgency: 'urgent',
      createdAt: 'Just now',
      status: 'pending',
      replyNote: '',
    }
    setUrgentAlerts((prev) => [newAlert, ...prev])
    showToast(`Urgent push alert sent to ${faculty.name}!`)

    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      new Notification(`Urgent Campus Connect Alert for ${faculty.name}`, {
        body: `${newAlert.studentName}: ${reason}`,
      })
    }
  }

  const handleEnablePush = async () => {
    if (typeof Notification === 'undefined') {
      showToast('Browser notifications are not supported in this environment.')
      return
    }
    const perm = await Notification.requestPermission()
    setPushPermission(perm)
    showToast(
      perm === 'granted'
        ? 'Browser Push Notifications enabled for urgent student alerts!'
        : 'Push permission not granted — in-app alerts remain active.',
    )
  }

  const handleChangeLiveStatus = (facultyId, liveStatus) => {
    setFacultyList((prev) =>
      prev.map((f) => (f.id === facultyId ? { ...f, liveStatus } : f)),
    )
    showToast(`Availability updated to "${liveStatus}"`)
  }

  const handleToggleSlotType = (facultyId, slotId) => {
    setFacultyList((prev) =>
      prev.map((f) => {
        if (f.id !== facultyId) return f
        return {
          ...f,
          timetable: f.timetable.map((slot) =>
            slot.id === slotId
              ? { ...slot, type: slot.type === 'office-hours' ? 'busy' : 'office-hours' }
              : slot,
          ),
        }
      }),
    )
    showToast('Timetable slot availability updated for students.')
  }

  const handleAddSlot = (facultyId, slot) => {
    setFacultyList((prev) =>
      prev.map((f) =>
        f.id === facultyId ? { ...f, timetable: [...f.timetable, slot] } : f,
      ),
    )
    showToast(`Added ${slot.title} to ${slot.day}`)
  }

  const handleRespondAlert = (alertId, status, replyNote) => {
    setUrgentAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, status, replyNote } : a)),
    )
    showToast(`Student request marked as ${status}.`)
  }

  const handlePublishAnnouncement = ({ title, category, summary, author }) => {
    const newNotice = {
      id: `ann-${Date.now()}`,
      category,
      priority: 'Circular',
      title,
      summary,
      time: 'Just now',
      author,
      unread: true,
    }
    setAnnouncements((prev) => [newNotice, ...prev])
    showToast('Announcement published to college-wide board!')
  }

  const currentFaculty = useMemo(
    () =>
      facultyList.find((f) => f.id === session?.userId) ?? facultyList[0],
    [facultyList, session?.userId],
  )

  const badgeCount =
    session?.role === 'faculty'
      ? urgentAlerts.filter((a) => a.facultyId === currentFaculty.id && a.status === 'pending').length
      : announcements.filter((a) => !readIds.includes(a.id)).length

  return (
    <MotionConfig reducedMotion={reducedMotion ? 'always' : 'user'}>
      {!session ? (
        <AuthGate
          onLogin={handleLogin}
          darkMode={darkMode}
          onToggleDark={() => setDarkMode((prev) => !prev)}
        />
      ) : (
        <div className="campus-dot-grid relative min-h-screen text-slate-900 dark:text-slate-100">
          <CampusBackdrop />
          <a className="skip-link" href="#main-content">
            Skip to main content
          </a>

          <Sidebar
            session={session}
            activePage={activePage}
            onNavigate={(page) => navigateTo(page)}
            onSignOut={handleSignOut}
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
            badgeCount={badgeCount}
          />

          <AnimatePresence>
            {isCommandOpen && (
              <CommandPalette
                isOpen={isCommandOpen}
                onClose={() => setIsCommandOpen(false)}
                onNavigate={navigateTo}
              />
            )}
          </AnimatePresence>

          <main className="relative z-10 min-h-screen lg:pl-[268px]" id="main-content">
            <TopBar
              activePage={activePage}
              onOpenSidebar={() => setIsSidebarOpen(true)}
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              onOpenCommand={() => setIsCommandOpen(true)}
              darkMode={darkMode}
              onToggleDark={() => setDarkMode((prev) => !prev)}
              session={session}
            />

            <div className="mx-auto max-w-[1440px] px-4 py-6 sm:px-7 sm:py-8 lg:px-10">
              <AnimatePresence mode="wait">
                <PageTransition pageKey={`${session.role}-${activePage}`}>
                  {session.role === 'guest' ? (
                    <CampusMap
                      key={mapFocusLocationId ?? 'campus-map'}
                      initialLocationId={mapFocusLocationId}
                      isGuestMode
                      darkMode={darkMode}
                    />
                  ) : session.role === 'faculty' ? (
                    <>
                      {activePage === 'Dashboard' && (
                        <FacultyDashboard
                          faculty={currentFaculty}
                          urgentAlerts={urgentAlerts}
                          announcements={announcements}
                          onChangeLiveStatus={handleChangeLiveStatus}
                          onNavigate={(page) => navigateTo(page)}
                          onRespondAlert={handleRespondAlert}
                          onPublishAnnouncement={handlePublishAnnouncement}
                        />
                      )}
                      {activePage === 'My Timetable' && (
                        <FacultyTimetablePage
                          faculty={currentFaculty}
                          onToggleSlotType={handleToggleSlotType}
                          onAddSlot={handleAddSlot}
                        />
                      )}
                      {activePage === 'Notifications' && (
                        <FacultyNotificationsPage
                          faculty={currentFaculty}
                          urgentAlerts={urgentAlerts}
                          announcements={announcements}
                          onRespondAlert={handleRespondAlert}
                          onEnablePush={handleEnablePush}
                          pushPermission={pushPermission}
                        />
                      )}
                      {activePage === 'Campus Map' && (
                        <CampusMap
                          key={mapFocusLocationId ?? 'campus-map'}
                          initialLocationId={mapFocusLocationId}
                          darkMode={darkMode}
                        />
                      )}
                      {activePage === 'Events' && (
                        <EventsPage
                          rsvpIds={rsvpIds}
                          onToggleRsvp={toggleRsvp}
                          onLocateOnMap={locateOnMap}
                        />
                      )}
                      {activePage === 'Settings' && (
                        <SettingsPage
                          session={session}
                          onNotify={showToast}
                          onSignOut={handleSignOut}
                        />
                      )}
                    </>
                  ) : (
                    <>
                      {activePage === 'Dashboard' && (
                        <StudentDashboard
                          searchTerm={searchTerm}
                          facultyList={facultyList}
                          announcements={announcements}
                          urgentAlerts={urgentAlerts}
                          onNavigate={(page) => navigateTo(page)}
                          onLocateOnMap={locateOnMap}
                          rsvpIds={rsvpIds}
                          onToggleRsvp={toggleRsvp}
                          checkedInSpot={checkedInSpot}
                          onCheckInSpot={handleCheckInSpot}
                        />
                      )}
                      {activePage === 'Campus Map' && (
                        <CampusMap
                          key={mapFocusLocationId ?? 'campus-map'}
                          initialLocationId={mapFocusLocationId}
                          darkMode={darkMode}
                        />
                      )}
                      {activePage === 'Faculty' && (
                        <FacultyPage
                          facultyList={facultyList}
                          urgentAlerts={urgentAlerts}
                          onLocateOnMap={locateOnMap}
                          onNotify={showToast}
                          onSendUrgentAlert={handleSendUrgentAlert}
                        />
                      )}
                      {activePage === 'Events' && (
                        <EventsPage
                          rsvpIds={rsvpIds}
                          onToggleRsvp={toggleRsvp}
                          onLocateOnMap={locateOnMap}
                        />
                      )}
                      {activePage === 'Announcements' && (
                        <AnnouncementsPage
                          announcements={announcements}
                          readIds={readIds}
                          onToggleRead={toggleRead}
                        />
                      )}
                      {activePage === 'Settings' && (
                        <SettingsPage
                          session={session}
                          onNotify={showToast}
                          onSignOut={handleSignOut}
                        />
                      )}
                    </>
                  )}
                </PageTransition>
              </AnimatePresence>

              <footer className="mt-10 flex flex-wrap items-center justify-between gap-2 border-t border-slate-200/80 py-5 text-[11px] text-slate-600 dark:border-slate-800 dark:text-slate-400">
                <span>© 2024 Campus Connect · BMS Institute of Technology &amp; Management</span>
                <span className="inline-flex items-center gap-1.5">
                  {session.role === 'faculty'
                    ? 'Faculty Workspace'
                    : session.role === 'guest'
                      ? 'Guest Campus Navigator'
                      : 'Student Command Center'}{' '}
                  <span className="h-2 w-2 rounded-full bg-brand-600" />
                </span>
              </footer>
            </div>
          </main>

          <AnimatePresence>
            {toast && (
              <motion.div
                aria-live="polite"
                initial={{ opacity: 0, y: 16, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 12, scale: 0.96 }}
                transition={{ type: 'spring', stiffness: 420, damping: 28 }}
                className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-900 px-4 py-3 text-xs font-semibold text-white shadow-xl dark:border-slate-700 dark:bg-white dark:text-slate-900"
                role="status"
              >
                <CheckCircle2 size={15} className="text-mint-400 dark:text-mint-600" />
                {toast}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </MotionConfig>
  )
}

export default App
