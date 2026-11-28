import { useMemo, useState } from 'react'
import { motion } from 'motion/react'
import {
  AlertTriangle,
  Bell,
  BellRing,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Compass,
  MapPin,
  Megaphone,
  Plus,
  Send,
  Users,
} from 'lucide-react'
import { DAYS_OF_WEEK } from '../data/campusPortalData.js'

const statusLabels = {
  available: { label: 'Available in Cabin', badge: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300', dot: 'bg-emerald-500' },
  'in-class': { label: 'In Lecture / Lab', badge: 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300', dot: 'bg-amber-500' },
  busy: { label: 'Busy / Meeting', badge: 'bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300', dot: 'bg-rose-500' },
}

export function FacultyDashboard({
  faculty,
  urgentAlerts,
  announcements,
  onChangeLiveStatus,
  onNavigate,
  onRespondAlert,
  onPublishAnnouncement,
}) {
  const [noticeTitle, setNoticeTitle] = useState('')
  const [noticeCategory, setNoticeCategory] = useState('ACADEMIC')
  const [noticeBody, setNoticeBody] = useState('')

  const myAlerts = useMemo(
    () => urgentAlerts.filter((a) => a.facultyId === faculty.id),
    [urgentAlerts, faculty.id],
  )
  const pendingAlerts = myAlerts.filter((a) => a.status === 'pending')
  const mondaySlots = faculty.timetable.filter((s) => s.day === 'Mon')
  const currentStatus = statusLabels[faculty.liveStatus] ?? statusLabels.available

  const handlePublish = (event) => {
    event.preventDefault()
    if (!noticeTitle.trim() || !noticeBody.trim()) return
    onPublishAnnouncement({
      title: noticeTitle.trim(),
      category: noticeCategory,
      summary: noticeBody.trim(),
      author: `${faculty.name} (${faculty.department})`,
    })
    setNoticeTitle('')
    setNoticeBody('')
  }

  return (
    <div className="space-y-6">
      {/* Clean Hero Banner (No Overlapping Elements) */}
      <section className="campus-hero-mesh rounded-3xl p-6 text-white shadow-lg sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-1 text-[11px] font-semibold text-sky-200">
              <Users size={13} /> Faculty Workspace · {faculty.department}
            </span>
            <h1 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">
              Welcome back,{' '}
              <span className="font-editorial text-spectral italic font-normal text-3xl sm:text-4xl">
                {faculty.name}
              </span>
            </h1>
            <p className="max-w-xl text-sm text-slate-200">
              {faculty.role} · {faculty.office}
            </p>
          </div>

          <div className="rounded-2xl border border-white/15 bg-slate-950/45 p-4 backdrop-blur-md lg:min-w-[300px]">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
              Live Cabin Availability
            </p>
            <div className="mt-2.5 flex flex-wrap gap-2">
              {(['available', 'in-class', 'busy']).map((statusKey) => {
                const active = faculty.liveStatus === statusKey
                return (
                  <button
                    key={statusKey}
                    className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                      active
                        ? 'bg-amber-400 text-slate-950 shadow-sm'
                        : 'bg-white/10 text-white hover:bg-white/20'
                    }`}
                    onClick={() => onChangeLiveStatus(faculty.id, statusKey)}
                    type="button"
                  >
                    {statusKey === 'available' ? 'Available' : statusKey === 'in-class' ? 'In Class' : 'Busy'}
                  </button>
                )
              })}
            </div>
            <p className="mt-2.5 text-[11px] text-slate-300">
              Students currently see: <strong className="text-white">{currentStatus.label}</strong>
            </p>
          </div>
        </div>
      </section>

      {/* Faculty Institutional Governance Ribbon */}
      <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300">
              <MapPin size={18} />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Cabin Office</span>
              <p className="text-sm font-extrabold text-slate-900 dark:text-white">{faculty.office}</p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('Campus Map')}
            type="button"
            className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] font-bold text-slate-700 hover:bg-brand-50 hover:text-brand-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 transition"
          >
            Map
          </button>
        </div>

        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-iris-50 text-iris-600 dark:bg-iris-500/15 dark:text-iris-300">
            <CalendarDays size={18} />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Weekly Lectures</span>
            <p className="text-sm font-extrabold text-slate-900 dark:text-white">{faculty.timetable.length} Teaching Slots</p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300">
            <Clock3 size={18} />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Urgent Doubts Queue</span>
            <p className="text-sm font-extrabold text-slate-900 dark:text-white">{pendingAlerts.length} Active Requests</p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300">
            <CheckCircle2 size={18} />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Faculty Code</span>
            <p className="text-sm font-extrabold text-slate-900 dark:text-white">{faculty.facultyCode} · {faculty.department}</p>
          </div>
        </div>
      </div>

      {/* Urgent Push Alerts Banner if any pending */}
      {pendingAlerts.length > 0 && (
        <section className="rounded-3xl border border-amber-300 bg-amber-50 p-5 dark:border-amber-500/40 dark:bg-amber-500/10">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500 text-slate-950">
                <BellRing size={18} />
              </span>
              <div>
                <h2 className="text-sm font-extrabold text-amber-950 dark:text-amber-200">
                  {pendingAlerts.length} Urgent Student Meeting Request{pendingAlerts.length > 1 ? 's' : ''}
                </h2>
                <p className="text-xs text-amber-800 dark:text-amber-300">
                  {pendingAlerts[0].studentName} ({pendingAlerts[0].studentUsn}): “{pendingAlerts[0].reason}”
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                className="rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white transition hover:bg-emerald-700"
                onClick={() => onRespondAlert(pendingAlerts[0].id, 'accepted', 'Please come to my cabin now.')}
                type="button"
              >
                Accept Now
              </button>
              <button
                className="rounded-xl border border-amber-300 bg-white px-3.5 py-2 text-xs font-bold text-amber-900 transition hover:bg-amber-100 dark:border-amber-500/40 dark:bg-slate-900 dark:text-amber-200"
                onClick={() => onNavigate('Notifications')}
                type="button"
              >
                Open Center
              </button>
            </div>
          </div>
        </section>
      )}

      {/* KPI Cards */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <CalendarDays size={18} className="text-blue-600 dark:text-blue-400" />
          <p className="font-display mt-3 text-2xl font-extrabold text-slate-900 dark:text-white">
            {faculty.timetable.length}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Weekly Timetable Slots</p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <BellRing size={18} className="text-amber-500" />
          <p className="font-display mt-3 text-2xl font-extrabold text-slate-900 dark:text-white">
            {pendingAlerts.length}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Pending Urgent Requests</p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <Megaphone size={18} className="text-emerald-600 dark:text-emerald-400" />
          <p className="font-display mt-3 text-2xl font-extrabold text-slate-900 dark:text-white">
            {announcements.length}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">College-Wide Notices</p>
        </div>
        <button
          className="flex flex-col justify-between rounded-3xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-blue-300 dark:border-slate-800 dark:bg-slate-900"
          onClick={() => onNavigate('Campus Map')}
          type="button"
        >
          <Compass size={18} className="text-violet-600 dark:text-violet-400" />
          <div>
            <p className="font-display mt-3 text-lg font-extrabold text-slate-900 dark:text-white">
              Campus Map
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">View blocks &amp; walking routes</p>
          </div>
        </button>
      </section>

      {/* Main Grid: Today's Timetable + Quick Publish Announcement */}
      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                Monday Teaching &amp; Office Schedule
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Students check these slots before requesting a meeting
              </p>
            </div>
            <button
              className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-bold text-blue-600 transition hover:bg-blue-50 dark:border-slate-700 dark:text-blue-400"
              onClick={() => onNavigate('My Timetable')}
              type="button"
            >
              Manage Full Week
            </button>
          </div>

          <div className="space-y-2.5">
            {mondaySlots.map((slot) => (
              <div
                key={slot.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5 dark:border-slate-800 dark:bg-slate-800/50"
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono-code rounded-xl bg-white px-2.5 py-1.5 text-[11px] font-bold text-slate-700 shadow-xs dark:bg-slate-900 dark:text-slate-200">
                    {slot.time}
                  </span>
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">{slot.title}</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">{slot.room}</p>
                  </div>
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
                    slot.type === 'office-hours'
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'
                      : 'bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300'
                  }`}
                >
                  {slot.type === 'office-hours' ? 'Open for Students' : slot.type}
                </span>
              </div>
            ))}
          </div>
        </div>

        <form
          className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4"
          onSubmit={handlePublish}
        >
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300">
              <Megaphone size={18} />
            </span>
            <div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                Post College Announcement
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Broadcasts immediately to all students and faculty
              </p>
            </div>
          </div>

          <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
            Category
            <select
              className="mt-1 h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 [color-scheme:light] dark:[color-scheme:dark] dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              onChange={(e) => setNoticeCategory(e.target.value)}
              value={noticeCategory}
            >
              <option value="ACADEMIC" className="bg-white text-slate-900 dark:bg-slate-800 dark:text-white font-medium">ACADEMIC</option>
              <option value="CAMPUS UPDATE" className="bg-white text-slate-900 dark:bg-slate-800 dark:text-white font-medium">CAMPUS UPDATE</option>
              <option value="PLACEMENTS" className="bg-white text-slate-900 dark:bg-slate-800 dark:text-white font-medium">PLACEMENTS</option>
              <option value="STUDENT LIFE" className="bg-white text-slate-900 dark:bg-slate-800 dark:text-white font-medium">STUDENT LIFE</option>
            </select>
          </label>

          <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
            Headline
            <input
              className="mt-1 h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-xs font-medium text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500"
              onChange={(e) => setNoticeTitle(e.target.value)}
              placeholder="e.g. Lab 2 internal assessment rescheduled to Friday"
              type="text"
              value={noticeTitle}
            />
          </label>

          <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
            Details
            <textarea
              className="mt-1 min-h-[84px] w-full rounded-xl border border-slate-300 bg-white p-3 text-xs font-medium text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500"
              onChange={(e) => setNoticeBody(e.target.value)}
              placeholder="Share room numbers, deadlines, or instructions..."
              value={noticeBody}
            />
          </label>

          <button
            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 text-xs font-bold text-white transition hover:bg-blue-700"
            type="submit"
          >
            <Send size={14} /> Publish Announcement
          </button>
        </form>
      </section>
    </div>
  )
}

export function FacultyTimetablePage({ faculty, onToggleSlotType, onAddSlot }) {
  const [selectedDay, setSelectedDay] = useState('Mon')
  const [newTime, setNewTime] = useState('16:00 – 17:00')
  const [newTitle, setNewTitle] = useState('')
  const [newRoom, setNewRoom] = useState(faculty.office.split(',')[0])
  const [newType, setNewType] = useState('office-hours')

  const daySlots = faculty.timetable.filter((s) => s.day === selectedDay)

  const handleAdd = (event) => {
    event.preventDefault()
    if (!newTitle.trim()) return
    onAddSlot(faculty.id, {
      id: `slot-${Date.now()}`,
      day: selectedDay,
      time: newTime,
      title: newTitle.trim(),
      room: newRoom.trim() || 'Cabin',
      type: newType,
    })
    setNewTitle('')
  }

  return (
    <section className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-violet-700 dark:bg-violet-500/15 dark:text-violet-300">
          <CalendarDays size={12} /> Personal Timetable
        </span>
        <h1 className="font-display mt-3 text-2xl font-extrabold text-slate-900 dark:text-white sm:text-3xl">
          Weekly Teaching &amp; Availability Schedule
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Toggle any slot between Lecture/Busy and Open Office Hours. Changes reflect immediately for students.
        </p>

        <div className="mt-5 flex flex-wrap gap-2">
          {DAYS_OF_WEEK.map((day) => (
            <button
              key={day}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
                selectedDay === day
                  ? 'bg-violet-600 text-white shadow-sm'
                  : 'border border-slate-200 bg-slate-50 text-slate-600 hover:border-violet-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
              }`}
              onClick={() => setSelectedDay(day)}
              type="button"
            >
              {day}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-3 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">
            {selectedDay} Schedule ({daySlots.length} slots)
          </h2>
          {daySlots.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-slate-200 py-8 text-center text-xs text-slate-500 dark:border-slate-700">
              No scheduled blocks for {selectedDay}. Add an office hour or lecture slot on the right.
            </p>
          ) : (
            daySlots.map((slot) => (
              <motion.div
                layout
                key={slot.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-800/50"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono-code text-xs font-bold text-blue-600 dark:text-blue-400">
                      {slot.time}
                    </span>
                    <span className="text-xs text-slate-400">·</span>
                    <span className="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                      <MapPin size={12} /> {slot.room}
                    </span>
                  </div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">{slot.title}</p>
                </div>

                <button
                  className={`rounded-xl px-3.5 py-2 text-xs font-bold transition ${
                    slot.type === 'office-hours'
                      ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                      : 'border border-slate-200 bg-white text-slate-700 hover:border-emerald-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200'
                  }`}
                  onClick={() => onToggleSlotType(faculty.id, slot.id)}
                  type="button"
                >
                  {slot.type === 'office-hours' ? 'Open for Students ✓' : `Marked: ${slot.type} (Switch)`}
                </button>
              </motion.div>
            ))
          )}
        </div>

        <form
          className="h-fit space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
          onSubmit={handleAdd}
        >
          <h2 className="flex items-center gap-2 text-sm font-extrabold text-slate-900 dark:text-white">
            <Plus size={16} className="text-violet-600" /> Add Slot for {selectedDay}
          </h2>
          <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
            Time Range
            <input
              className="mt-1 h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-xs font-medium text-slate-900 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/15 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              onChange={(e) => setNewTime(e.target.value)}
              type="text"
              value={newTime}
            />
          </label>
          <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
            Session Title
            <input
              className="mt-1 h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-xs font-medium text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/15 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500"
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="e.g. Student Mentoring / Project Review"
              type="text"
              value={newTitle}
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
              Room
              <input
                className="mt-1 h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-xs font-medium text-slate-900 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/15 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                onChange={(e) => setNewRoom(e.target.value)}
                type="text"
                value={newRoom}
              />
            </label>
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
              Slot Type
              <select
                className="mt-1 h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-900 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/15 [color-scheme:light] dark:[color-scheme:dark] dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                onChange={(e) => setNewType(e.target.value)}
                value={newType}
              >
                <option value="office-hours" className="bg-white text-slate-900 dark:bg-slate-800 dark:text-white font-medium">Office Hours (Available)</option>
                <option value="lecture" className="bg-white text-slate-900 dark:bg-slate-800 dark:text-white font-medium">Lecture</option>
                <option value="lab" className="bg-white text-slate-900 dark:bg-slate-800 dark:text-white font-medium">Lab</option>
                <option value="busy" className="bg-white text-slate-900 dark:bg-slate-800 dark:text-white font-medium">Busy</option>
              </select>
            </label>
          </div>
          <button
            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-violet-600 text-xs font-bold text-white transition hover:bg-violet-700"
            type="submit"
          >
            <Plus size={14} /> Add to {selectedDay}
          </button>
        </form>
      </div>
    </section>
  )
}

export function FacultyNotificationsPage({
  faculty,
  urgentAlerts,
  announcements,
  onRespondAlert,
  onEnablePush,
  pushPermission,
}) {
  const myAlerts = urgentAlerts.filter((a) => a.facultyId === faculty.id)

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
            <BellRing size={12} /> Centralized Notification Center
          </span>
          <h1 className="font-display mt-3 text-2xl font-extrabold text-slate-900 dark:text-white">
            Push Alerts &amp; College Announcements
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Receive urgent student meeting requests in real time and stay synced with college-wide circulars.
          </p>
        </div>

        <button
          className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-bold transition ${
            pushPermission === 'granted'
              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
          onClick={onEnablePush}
          type="button"
        >
          <Bell size={15} />
          {pushPermission === 'granted' ? 'Browser Push Enabled ✓' : 'Enable Browser Push Alerts'}
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Urgent Student Alerts */}
        <div className="space-y-3 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="flex items-center gap-2 text-base font-extrabold text-slate-900 dark:text-white">
            <AlertTriangle size={18} className="text-amber-500" /> Urgent Student Meeting Requests
          </h2>
          {myAlerts.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-slate-200 py-8 text-center text-xs text-slate-500 dark:border-slate-700">
              No urgent student alerts right now.
            </p>
          ) : (
            myAlerts.map((alert) => (
              <div
                key={alert.id}
                className={`rounded-2xl border p-4 ${
                  alert.status === 'pending'
                    ? 'border-amber-300 bg-amber-50/70 dark:border-amber-500/40 dark:bg-amber-500/10'
                    : 'border-slate-200 bg-slate-50/60 dark:border-slate-800 dark:bg-slate-800/40'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                    {alert.studentName} · <span className="font-mono-code text-slate-500">{alert.studentUsn}</span>
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] text-slate-500">
                    <Clock3 size={12} /> {alert.createdAt}
                  </span>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-slate-700 dark:text-slate-200">
                  {alert.reason}
                </p>

                {alert.status === 'pending' ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      className="rounded-xl bg-emerald-600 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-emerald-700"
                      onClick={() => onRespondAlert(alert.id, 'accepted', 'Confirmed — meet me at my cabin.')}
                      type="button"
                    >
                      Accept Meeting
                    </button>
                    <button
                      className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                      onClick={() => onRespondAlert(alert.id, 'resolved', 'Please meet during my next office hour slot.')}
                      type="button"
                    >
                      Defer to Office Hours
                    </button>
                  </div>
                ) : (
                  <p className="mt-2.5 inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
                    <CheckCircle2 size={13} /> {alert.status.toUpperCase()} — {alert.replyNote}
                  </p>
                )}
              </div>
            ))
          )}
        </div>

        {/* College-Wide Announcements */}
        <div className="space-y-3 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="flex items-center gap-2 text-base font-extrabold text-slate-900 dark:text-white">
            <Megaphone size={18} className="text-blue-600" /> College-Wide Announcements
          </h2>
          {announcements.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-800/40"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-bold uppercase text-blue-700 dark:bg-blue-500/15 dark:text-blue-300">
                  {item.category}
                </span>
                <span className="text-[11px] text-slate-400">{item.time}</span>
              </div>
              <h3 className="mt-1.5 text-sm font-bold text-slate-900 dark:text-white">{item.title}</h3>
              <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">{item.summary}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
