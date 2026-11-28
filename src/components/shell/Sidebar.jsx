import { motion } from 'motion/react'
import {
  BellRing,
  CalendarDays,
  Compass,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Settings,
  Users,
  X,
} from 'lucide-react'

const studentNavigation = [
  { label: 'Dashboard', icon: LayoutDashboard },
  { label: 'Campus Map', icon: Compass },
  { label: 'Faculty', icon: Users },
  { label: 'Events', icon: CalendarDays },
  { label: 'Announcements', icon: Megaphone },
]

const facultyNavigation = [
  { label: 'Dashboard', icon: LayoutDashboard },
  { label: 'My Timetable', icon: CalendarDays },
  { label: 'Notifications', icon: BellRing },
  { label: 'Campus Map', icon: Compass },
  { label: 'Events', icon: SparkIconPlaceholder },
]

const guestNavigation = [
  { label: 'Campus Map', icon: Compass },
]

function SparkIconPlaceholder(props) {
  return <Megaphone {...props} />
}

function NavButton({ label, icon: Icon, active, badge, onClick }) {
  return (
    <button
      aria-current={active ? 'page' : undefined}
      className={`group relative flex w-full items-center gap-3 rounded-2xl px-3.5 py-2.5 text-left text-[13px] font-semibold transition-colors ${
        active
          ? 'text-white'
          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-slate-100'
      }`}
      onClick={onClick}
      type="button"
    >
      {active ? (
        <motion.span
          layoutId="sidebar-active-pill"
          transition={{ type: 'spring', stiffness: 420, damping: 32 }}
          className="absolute inset-0 rounded-2xl bg-linear-to-br from-brand-600 to-iris-600 shadow-md shadow-brand-600/25"
        />
      ) : null}
      <Icon
        size={18}
        strokeWidth={active ? 2.2 : 1.9}
        className={`relative z-10 ${
          active ? 'text-white' : 'text-slate-500 group-hover:text-brand-600 dark:text-slate-400 dark:group-hover:text-brand-400'
        }`}
      />
      <span className="relative z-10">{label}</span>
      {badge > 0 ? (
        <span
          className={`relative z-10 ml-auto rounded-full px-2 py-0.5 text-[10px] font-bold ${
            active
              ? 'bg-white/20 text-white'
              : 'bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-300'
          }`}
        >
          {badge}
        </span>
      ) : null}
    </button>
  )
}

export function Sidebar({
  session,
  activePage,
  onNavigate,
  onSignOut,
  isOpen,
  onClose,
  badgeCount,
}) {
  const isFaculty = session?.role === 'faculty'
  const isGuest = session?.role === 'guest'
  const navItems = isFaculty ? facultyNavigation : isGuest ? guestNavigation : studentNavigation

  return (
    <>
      {isOpen ? (
        <button
          aria-label="Close navigation menu"
          className="fixed inset-0 z-30 bg-slate-950/50 backdrop-blur-xs lg:hidden"
          onClick={onClose}
          type="button"
        />
      ) : null}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[268px] flex-col border-r border-slate-200/90 bg-white/95 backdrop-blur-xl transition-transform duration-200 dark:border-slate-800 dark:bg-slate-950/95 lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-[76px] items-center justify-between border-b border-slate-100 px-6 dark:border-slate-800">
          <button
            className="flex items-center gap-3 text-left"
            onClick={() => onNavigate('Dashboard')}
            type="button"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-linear-to-br from-brand-600 to-iris-600 text-white shadow-md shadow-brand-600/25">
              <GraduationCap size={20} strokeWidth={2.2} />
            </span>
            <span>
              <span className="font-display block text-[16px] font-extrabold tracking-tight text-slate-900 dark:text-white">
                campus<span className="text-brand-600 dark:text-brand-400">connect</span>
              </span>
              <span className="mt-0.5 block text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                {isFaculty ? 'Faculty Portal' : isGuest ? 'Guest Explorer' : 'Student Portal'}
              </span>
            </span>
          </button>
          <button
            aria-label="Close navigation menu"
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden"
            onClick={onClose}
            type="button"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-4 pt-6">
          <p className="mb-2.5 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
            {isFaculty ? 'Teacher Workspace' : isGuest ? 'Visitor Access' : 'Student Workspace'}
          </p>
          <nav aria-label="Main navigation" className="space-y-1">
            {navItems.map(({ label, icon }) => (
              <NavButton
                key={label}
                label={label}
                icon={icon}
                active={activePage === label}
                badge={
                  (!isFaculty && label === 'Announcements') ||
                  (isFaculty && label === 'Notifications')
                    ? badgeCount
                    : 0
                }
                onClick={() => onNavigate(label)}
              />
            ))}
          </nav>
        </div>

        {!isGuest && (
          <div className="mt-6 px-4">
            <p className="mb-2.5 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
              Preferences
            </p>
            <NavButton
              label="Settings"
              icon={Settings}
              active={activePage === 'Settings'}
              onClick={() => onNavigate('Settings')}
            />
          </div>
        )}

        <div className="mt-auto border-t border-slate-100 p-4 dark:border-slate-800">
          <div className="rounded-2xl border border-slate-200/80 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-sun-400 to-orange-500 text-xs font-extrabold text-slate-950 shadow-sm">
                {session?.name
                  ?.split(' ')
                  .map((p) => p[0])
                  .slice(0, 2)
                  .join('') ?? 'CC'}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold text-slate-900 dark:text-white">
                  {session?.name}
                </p>
                <p className="truncate text-[10px] text-slate-500 dark:text-slate-400">
                  {session?.subtitle}
                </p>
              </div>
            </div>
            <button
              className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white py-1.5 text-[11px] font-bold text-slate-700 transition hover:border-rose-300 hover:text-rose-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              onClick={onSignOut}
              type="button"
            >
              <LogOut size={12} /> Switch Role / Sign Out
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
