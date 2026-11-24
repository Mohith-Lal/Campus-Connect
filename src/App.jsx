import { useState } from 'react'
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Building2,
  CalendarDays,
  Check,
  ChevronDown,
  Clock3,
  Compass,
  GraduationCap,
  LayoutDashboard,
  MapPin,
  Menu,
  Megaphone,
  Search,
  Settings,
  Users,
  X,
} from 'lucide-react'
import CampusMap from './CampusMap.jsx'

const navigation = [
  { label: 'Dashboard', icon: LayoutDashboard },
  { label: 'Campus Map', icon: MapPin },
  { label: 'Faculty', icon: Users },
  { label: 'Events', icon: CalendarDays },
  { label: 'Announcements', icon: Megaphone },
]

const events = [
  {
    day: '24',
    month: 'OCT',
    category: 'WORKSHOP',
    title: 'Designing for the real world',
    time: '10:30 AM – 12:00 PM',
    location: 'Innovation Lab, Block C',
    color: 'blue',
  },
  {
    day: '26',
    month: 'OCT',
    category: 'CAMPUS LIFE',
    title: 'Fall Fest ’24',
    time: '4:00 PM – 9:00 PM',
    location: 'The Quad',
    color: 'orange',
  },
  {
    day: '28',
    month: 'OCT',
    category: 'ACADEMIC',
    title: 'Research & ideas symposium',
    time: '1:00 PM – 3:30 PM',
    location: 'North Lecture Hall',
    color: 'purple',
  },
]

const announcements = [
  {
    category: 'ACADEMIC',
    title: 'Registration for spring semester is now open',
    time: '2 hours ago',
    icon: BookOpen,
    tone: 'blue',
  },
  {
    category: 'CAMPUS UPDATE',
    title: 'Library hours extended during midterms',
    time: 'Yesterday',
    icon: Building2,
    tone: 'green',
  },
  {
    category: 'STUDENT LIFE',
    title: 'Applications open for student ambassadors',
    time: 'Oct 20, 2024',
    icon: GraduationCap,
    tone: 'orange',
  },
]

const quickLinks = [
  {
    label: 'Campus map',
    detail: 'Find your way around',
    icon: Compass,
    color: 'blue',
    page: 'Campus Map',
  },
  {
    label: 'Faculty directory',
    detail: 'Get to know your faculty',
    icon: Users,
    color: 'purple',
    page: 'Faculty',
  },
  {
    label: 'Events',
    detail: 'What’s happening on campus',
    icon: CalendarDays,
    color: 'orange',
    page: 'Events',
  },
  {
    label: 'Announcements',
    detail: 'The latest campus updates',
    icon: Megaphone,
    color: 'green',
    page: 'Announcements',
  },
]

function Sidebar({ activePage, onNavigate, isOpen, onClose }) {
  return (
    <>
      {isOpen && (
        <button
          aria-label="Close navigation menu"
          className="fixed inset-0 z-30 bg-slate-950/30 backdrop-blur-[2px] lg:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[260px] flex-col border-r border-slate-200 bg-white transition-transform duration-200 lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-[76px] items-center justify-between border-b border-slate-100 px-6">
          <button
            className="flex items-center gap-3 text-left"
            onClick={() => onNavigate('Dashboard')}
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm shadow-blue-200">
              <Building2 size={19} strokeWidth={2.2} />
            </span>
            <span>
              <span className="block text-[15px] font-bold tracking-tight text-slate-900">
                campus<span className="text-blue-600">connect</span>
              </span>
              <span className="mt-0.5 block text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                Student portal
              </span>
            </span>
          </button>
          <button
            aria-label="Close navigation menu"
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 lg:hidden"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-4 pt-8">
          <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
            Workspace
          </p>
          <nav aria-label="Main navigation" className="space-y-1">
            {navigation.map(({ label, icon: Icon }) => (
              <button
                key={label}
                aria-current={activePage === label ? 'page' : undefined}
                className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[13px] font-medium transition ${
                  activePage === label
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                }`}
                onClick={() => onNavigate(label)}
              >
                <Icon
                  size={18}
                  strokeWidth={activePage === label ? 2.2 : 1.8}
                  className={
                    activePage === label
                      ? 'text-blue-600'
                      : 'text-slate-400 group-hover:text-slate-600'
                  }
                />
                {label}
                {label === 'Announcements' && (
                  <span className="ml-auto h-1.5 w-1.5 rounded-full bg-blue-500" />
                )}
              </button>
            ))}
          </nav>
        </div>

        <div className="mt-8 px-4">
          <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
            Preferences
          </p>
          <button
            aria-current={activePage === 'Settings' ? 'page' : undefined}
            className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[13px] font-medium transition ${
              activePage === 'Settings'
                ? 'bg-blue-50 text-blue-700'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
            }`}
            onClick={() => onNavigate('Settings')}
          >
            <Settings size={18} className="text-slate-400 group-hover:text-slate-600" />
            Settings
          </button>
        </div>

        <div className="mt-auto border-t border-slate-100 p-4">
          <button className="flex w-full items-center gap-3 rounded-xl p-2 text-left transition hover:bg-slate-50">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-700 ring-2 ring-white">
              JD
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[12px] font-semibold text-slate-800">
                Jordan Davis
              </span>
              <span className="mt-0.5 block truncate text-[11px] text-slate-400">
                Computer Science · Year 2
              </span>
            </span>
            <ChevronDown size={15} className="text-slate-400" />
          </button>
        </div>
      </aside>
    </>
  )
}

function SectionHeading({ title, action, onAction }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-4">
      <h2 className="text-[15px] font-bold tracking-tight text-slate-900">{title}</h2>
      {action && (
        <button
          className="flex shrink-0 items-center gap-1.5 text-xs font-semibold text-blue-600 transition hover:text-blue-800"
          onClick={onAction}
        >
          {action} <ArrowRight size={14} />
        </button>
      )}
    </div>
  )
}

function EventCard({ event }) {
  return (
    <article className="flex gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md hover:shadow-slate-200/50">
      <div
        className={`flex h-[58px] w-[54px] shrink-0 flex-col items-center justify-center rounded-xl ${
          event.color === 'orange'
            ? 'bg-orange-50 text-orange-600'
            : event.color === 'purple'
              ? 'bg-violet-50 text-violet-600'
              : 'bg-blue-50 text-blue-600'
        }`}
      >
        <span className="text-[19px] font-bold leading-none">{event.day}</span>
        <span className="mt-1 text-[9px] font-bold tracking-[0.12em]">{event.month}</span>
      </div>
      <div className="min-w-0 flex-1">
        <span
          className={`text-[9px] font-bold tracking-[0.12em] ${
            event.color === 'orange'
              ? 'text-orange-600'
              : event.color === 'purple'
                ? 'text-violet-600'
                : 'text-blue-600'
          }`}
        >
          {event.category}
        </span>
        <h3 className="mt-1 truncate text-[13px] font-semibold text-slate-800">{event.title}</h3>
        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-slate-400">
          <span className="inline-flex items-center gap-1">
            <Clock3 size={12} /> {event.time}
          </span>
          <span className="inline-flex items-center gap-1">
            <MapPin size={12} /> {event.location}
          </span>
        </div>
      </div>
    </article>
  )
}

function AnnouncementRow({ announcement }) {
  const Icon = announcement.icon

  return (
    <article className="flex gap-3.5 border-b border-slate-100 py-4 last:border-b-0 last:pb-0 first:pt-0">
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
          announcement.tone === 'green'
            ? 'bg-emerald-50 text-emerald-600'
            : announcement.tone === 'orange'
              ? 'bg-orange-50 text-orange-600'
              : 'bg-blue-50 text-blue-600'
        }`}
      >
        <Icon size={16} />
      </span>
      <div className="min-w-0 flex-1">
        <span className="text-[9px] font-bold tracking-[0.12em] text-slate-400">
          {announcement.category}
        </span>
        <h3 className="mt-1 text-[12px] font-semibold leading-relaxed text-slate-800">
          {announcement.title}
        </h3>
        <p className="mt-1.5 text-[10px] text-slate-400">{announcement.time}</p>
      </div>
      <ArrowRight size={15} className="mt-4 shrink-0 text-slate-300" />
    </article>
  )
}

function Dashboard({ searchTerm, onNavigate }) {
  const normalizedSearch = searchTerm.trim().toLowerCase()
  const visibleLinks = quickLinks.filter((link) =>
    `${link.label} ${link.detail}`.toLowerCase().includes(normalizedSearch),
  )
  const visibleEvents = events.filter((event) =>
    `${event.title} ${event.category} ${event.location}`.toLowerCase().includes(normalizedSearch),
  )
  const visibleAnnouncements = announcements.filter((announcement) =>
    `${announcement.title} ${announcement.category}`.toLowerCase().includes(normalizedSearch),
  )

  return (
    <>
      <section className="mb-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="mb-2 text-[11px] font-semibold text-slate-400">
              Monday, October 21, 2024
            </p>
            <h1 className="text-[27px] font-bold tracking-[-0.04em] text-slate-900 sm:text-[30px]">
              Welcome to Campus Connect
            </h1>
            <p className="mt-2 max-w-xl text-[13px] leading-relaxed text-slate-500">
              Your campus, connected. Explore everything happening around you.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-[11px] font-medium text-slate-500 shadow-sm shadow-slate-100">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Fall semester 2024
            <ChevronDown size={14} className="text-slate-400" />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {visibleLinks.map(({ label, detail, icon: Icon, color, page }) => (
            <button
              key={label}
              className="group flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 text-left shadow-sm shadow-slate-100/60 transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md hover:shadow-blue-100/60"
              onClick={() => onNavigate(page)}
            >
              <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                  color === 'purple'
                    ? 'bg-violet-50 text-violet-600'
                    : color === 'orange'
                      ? 'bg-orange-50 text-orange-600'
                      : color === 'green'
                        ? 'bg-emerald-50 text-emerald-600'
                        : 'bg-blue-50 text-blue-600'
                }`}
              >
                <Icon size={18} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[12px] font-semibold text-slate-800">
                  {label}
                </span>
                <span className="mt-1 block truncate text-[10px] text-slate-400">{detail}</span>
              </span>
              <ArrowUpRight
                size={15}
                className="text-slate-300 transition group-hover:text-blue-500"
              />
            </button>
          ))}
          {normalizedSearch && visibleLinks.length === 0 && (
            <p className="py-3 text-xs text-slate-400 sm:col-span-2 xl:col-span-4">
              No quick links match “{searchTerm}”.
            </p>
          )}
        </div>
      </section>

      <section className="mb-8">
        <SectionHeading
          title="Your campus at a glance"
          action="Explore campus"
          onAction={() => onNavigate('Campus Map')}
        />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            icon={Building2}
            label="Campus buildings"
            value="28"
            note="Across 3 campuses"
            trend="blue"
          />
          <StatCard
            icon={Users}
            label="Faculty members"
            value="240+"
            note="Ready to help"
            trend="purple"
          />
          <StatCard
            icon={CalendarDays}
            label="Events this week"
            value="12"
            note="4 happening today"
            trend="orange"
          />
          <StatCard
            icon={Check}
            label="Campus services"
            value="16"
            note="Here when you need them"
            trend="green"
          />
        </div>
      </section>

      <div className="grid items-start gap-8 xl:grid-cols-[1.25fr_0.85fr]">
        <section>
          <SectionHeading
            title="Upcoming events"
            action="View all events"
            onAction={() => onNavigate('Events')}
          />
          <div className="space-y-3">
            {visibleEvents.map((event) => (
              <EventCard key={event.title} event={event} />
            ))}
            {visibleEvents.length === 0 && (
              <EmptySearch searchTerm={searchTerm} section="events" />
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-100/60">
          <SectionHeading
            title="Latest announcements"
            action="See all"
            onAction={() => onNavigate('Announcements')}
          />
          <div>
            {visibleAnnouncements.map((announcement) => (
              <AnnouncementRow key={announcement.title} announcement={announcement} />
            ))}
            {visibleAnnouncements.length === 0 && (
              <EmptySearch searchTerm={searchTerm} section="announcements" />
            )}
          </div>
        </section>
      </div>
    </>
  )
}

function StatCard({ icon: Icon, label, value, note, trend }) {
  return (
    <article className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm shadow-slate-100/60">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold text-slate-500">{label}</span>
        <span
          className={`flex h-7 w-7 items-center justify-center rounded-lg ${
            trend === 'purple'
              ? 'bg-violet-50 text-violet-600'
              : trend === 'orange'
                ? 'bg-orange-50 text-orange-600'
                : trend === 'green'
                  ? 'bg-emerald-50 text-emerald-600'
                  : 'bg-blue-50 text-blue-600'
          }`}
        >
          <Icon size={14} />
        </span>
      </div>
      <div className="mt-3 flex items-end justify-between gap-2">
        <span className="text-[25px] font-bold leading-none tracking-tight text-slate-900">
          {value}
        </span>
        <span className="inline-flex items-center gap-1 text-[9px] font-medium text-slate-400">
          {trend === 'orange' ? (
            <ArrowDownRight size={12} />
          ) : (
            <ArrowUpRight size={12} className="text-emerald-500" />
          )}
          {note}
        </span>
      </div>
    </article>
  )
}

function EmptySearch({ searchTerm, section }) {
  if (!searchTerm.trim()) return null

  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-5 py-8 text-center text-xs text-slate-400">
      No {section} match “{searchTerm}”.
    </div>
  )
}

function PlaceholderPage({ page }) {
  const pageInfo = {
    'Campus Map': {
      icon: Compass,
      eyebrow: 'EXPLORE YOUR SURROUNDINGS',
      description:
        'Discover buildings, services, and places across campus. The interactive campus map is coming soon.',
      badge: 'Map experience coming soon',
      color: 'blue',
    },
    Faculty: {
      icon: Users,
      eyebrow: 'MEET YOUR CAMPUS COMMUNITY',
      description:
        'Find faculty by department and learn more about the people who make our campus a great place to learn.',
      badge: 'Faculty directory coming soon',
      color: 'purple',
    },
    Events: {
      icon: CalendarDays,
      eyebrow: 'MAKE THE MOST OF CAMPUS',
      description:
        'Stay in the loop with workshops, talks, and student events happening across campus.',
      badge: 'Event listings coming soon',
      color: 'orange',
    },
    Announcements: {
      icon: Megaphone,
      eyebrow: 'WHAT’S HAPPENING ON CAMPUS',
      description:
        'Catch up on important campus news, academic updates, and opportunities for students.',
      badge: 'Campus updates coming soon',
      color: 'green',
    },
    Settings: {
      icon: Settings,
      eyebrow: 'MAKE IT YOURS',
      description:
        'Your preferences and account details will live here. Settings are coming soon.',
      badge: 'Settings coming soon',
      color: 'blue',
    },
  }
  const { icon: Icon, eyebrow, description, badge, color } = pageInfo[page]

  return (
    <div className="mx-auto flex min-h-[65vh] max-w-3xl items-center justify-center">
      <div className="w-full rounded-3xl border border-slate-200/80 bg-white px-6 py-12 text-center shadow-sm shadow-slate-100/60 sm:px-12">
        <span
          className={`mx-auto flex h-14 w-14 items-center justify-center rounded-2xl ${
            color === 'purple'
              ? 'bg-violet-50 text-violet-600'
              : color === 'orange'
                ? 'bg-orange-50 text-orange-600'
                : color === 'green'
                  ? 'bg-emerald-50 text-emerald-600'
                  : 'bg-blue-50 text-blue-600'
          }`}
        >
          <Icon size={25} />
        </span>
        <p className="mt-6 text-[10px] font-bold tracking-[0.16em] text-slate-400">{eyebrow}</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">{page}</h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-500">{description}</p>
        <span className="mt-6 inline-flex items-center gap-2 rounded-full bg-slate-50 px-3.5 py-2 text-[11px] font-medium text-slate-500">
          <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
          {badge}
        </span>
      </div>
    </div>
  )
}

function App() {
  const [activePage, setActivePage] = useState('Dashboard')
  const [searchTerm, setSearchTerm] = useState('')
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  const navigateTo = (page) => {
    setActivePage(page)
    setSearchTerm('')
    setIsSidebarOpen(false)
  }

  return (
    <div className="min-h-screen bg-[#f7f9fc] text-slate-900">
      <Sidebar
        activePage={activePage}
        onNavigate={navigateTo}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <main className="min-h-screen lg:pl-[260px]">
        <header className="sticky top-0 z-20 flex h-[68px] items-center gap-3 border-b border-slate-200/80 bg-white/90 px-4 backdrop-blur-md sm:px-7 lg:px-10">
          <button
            aria-label="Open navigation menu"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 lg:hidden"
            onClick={() => setIsSidebarOpen(true)}
          >
            <Menu size={18} />
          </button>
          <div className="flex min-w-0 flex-1 items-center justify-between gap-4">
            <div className="hidden items-center gap-2 text-[11px] text-slate-400 sm:flex">
              <span>Workspace</span>
              <span className="text-slate-300">/</span>
              <span className="font-semibold text-slate-700">{activePage}</span>
            </div>
            <label className="relative ml-auto block w-full max-w-[340px]">
              <Search
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                aria-label="Search campus information"
                className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50/80 pl-10 pr-16 text-xs text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-50"
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search campus, events..."
                type="search"
                value={searchTerm}
              />
              <span className="pointer-events-none absolute right-2.5 top-1/2 hidden -translate-y-1/2 rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[9px] font-medium text-slate-400 sm:block">
                ⌘ K
              </span>
            </label>
          </div>
        </header>

        <div className="mx-auto max-w-[1440px] px-4 py-7 sm:px-7 sm:py-9 lg:px-10">
          {activePage === 'Dashboard' ? (
            <Dashboard searchTerm={searchTerm} onNavigate={navigateTo} />
          ) : activePage === 'Campus Map' ? (
            <CampusMap />
          ) : (
            <PlaceholderPage page={activePage} />
          )}
          <footer className="mt-10 flex flex-wrap items-center justify-between gap-2 border-t border-slate-200/80 py-5 text-[10px] text-slate-400">
            <span>© 2024 Campus Connect</span>
            <span className="inline-flex items-center gap-1.5">
              Made for your campus <span className="text-blue-500">●</span>
            </span>
          </footer>
        </div>
      </main>
    </div>
  )
}

export default App
