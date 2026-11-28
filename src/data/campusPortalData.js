export const studentProfile = {
  id: 'stu-1',
  role: 'student',
  name: 'Jordan Davis',
  initials: 'JD',
  usn: '1BY23CS084',
  email: 'jordan.davis@bmsit.in',
  branch: 'Computer Science & Engineering',
  semester: '5th Semester · Section B',
  cgpa: '9.14',
  attendance: '92%',
  creditsEarned: 118,
  totalCredits: 160,
  clubRole: 'Design & Tech Lead · ACM Chapter',
}

export const todayClasses = [
  {
    id: 'cls-1',
    code: 'BCS501',
    subject: 'Software Engineering & Agile',
    time: '09:00 AM – 10:00 AM',
    room: 'Room 304, Sir C. V. Raman Block',
    locationId: 'sir-c-v-raman-block',
    instructor: 'Dr. Ananya Rao',
    status: 'completed',
  },
  {
    id: 'cls-2',
    code: 'BCS502',
    subject: 'Computer Networks & Security',
    time: '11:15 AM – 12:15 PM',
    room: 'Lab 2, B. S. Narayan Block',
    locationId: 'b-s-narayan-block',
    instructor: 'Prof. Karthik Hegde',
    status: 'live',
    progress: 64,
  },
  {
    id: 'cls-3',
    code: 'BCS503',
    subject: 'Theory of Computation',
    time: '02:00 PM – 03:00 PM',
    room: 'Hall 108, Silver Jubilee Block',
    locationId: 'silver-jubilee-block',
    instructor: 'Dr. Meera Kulkarni',
    status: 'upcoming',
  },
  {
    id: 'cls-4',
    code: 'BCSL504',
    subject: 'Web & UI Systems Studio',
    time: '03:15 PM – 05:00 PM',
    room: 'Studio 1, BMSSA Block 1',
    locationId: 'bmssa-block-1',
    instructor: 'Prof. Rohan Deshmukh',
    status: 'upcoming',
  },
]

export const campusTickerItems = [
  'Library open until 11:30 PM for midterm prep',
  'ACM Hackathon registrations close Friday 6:00 PM',
  'Kaapi Kuteera special cold brew counter open near Block 1',
  'Inter-department Basketball qualifiers at 4:30 PM',
  'Spring elective preference window is live on Student Portal',
]

export const campusEvents = [
  {
    id: 'evt-1',
    day: '24',
    month: 'OCT',
    category: 'WORKSHOP',
    title: 'Designing for the Real World: Spatial & Motion UI',
    description:
      'Hands-on product design sprint led by alumni designers covering micro-interactions, accessible contrast, and rapid prototyping.',
    time: '10:30 AM – 12:30 PM',
    location: 'Innovation Lab, B. S. Narayan Block',
    locationId: 'b-s-narayan-block',
    attendees: 86,
    capacity: 100,
    tags: ['Design', 'UI/UX', 'Certificate'],
  },
  {
    id: 'evt-2',
    day: '26',
    month: 'OCT',
    category: 'CAMPUS LIFE',
    title: 'Utsav Fall Fest ’24 — Acoustic Night & Food Street',
    description:
      'Student bands, indie acoustic sets, lantern installations, and pop-up stalls across the central lawn.',
    time: '4:30 PM – 9:30 PM',
    location: 'Central Playground',
    locationId: 'playground',
    attendees: 420,
    capacity: 600,
    tags: ['Music', 'Food', 'Open Entry'],
  },
  {
    id: 'evt-3',
    day: '28',
    month: 'OCT',
    category: 'ACADEMIC',
    title: 'Undergraduate Research & AI Systems Symposium',
    description:
      'Keynote talks and poster demos from final-year capstone teams working on edge AI, robotics, and sustainable architecture.',
    time: '1:00 PM – 3:45 PM',
    location: 'Auditorium, Silver Jubilee Block',
    locationId: 'silver-jubilee-block',
    attendees: 145,
    capacity: 200,
    tags: ['AI & ML', 'Research', '2 Credits'],
  },
  {
    id: 'evt-4',
    day: '30',
    month: 'OCT',
    category: 'SPORTS',
    title: 'Varsity 3v3 Basketball & Volleyball Twilight Cup',
    description:
      'Inter-branch knockout tournament under the floodlights. Team check-in starts 20 minutes before tip-off.',
    time: '5:00 PM – 8:00 PM',
    location: 'Volleyball & Basketball Court',
    locationId: 'volleyball-basketball-court',
    attendees: 64,
    capacity: 80,
    tags: ['Athletics', 'Varsity'],
  },
]

export const initialAnnouncements = [
  {
    id: 'ann-1',
    category: 'ACADEMIC',
    priority: 'Urgent',
    title: 'Course registration & elective selection for Spring semester is now open',
    summary:
      'Students in Semesters 3, 5, and 7 can lock their open electives and honors tracks before November 4. Meet your faculty advisor to finalize credits.',
    time: '2 hours ago',
    author: 'Office of the Dean (Academics)',
    unread: true,
  },
  {
    id: 'ann-2',
    category: 'CAMPUS UPDATE',
    priority: 'Info',
    title: 'Central Library & Digital Commons hours extended until 11:30 PM',
    summary:
      'Quiet study pods on Level 2 and the 24-seat collaborative studio will remain open late throughout the midterm assessment window.',
    time: 'Yesterday',
    author: 'Central Library Committee',
    unread: true,
  },
  {
    id: 'ann-3',
    category: 'STUDENT LIFE',
    priority: 'Opportunity',
    title: 'Applications open for Campus Connect Student Ambassadors 2024–25',
    summary:
      'Help onboard incoming freshmen, curate campus map updates, and co-host orientation walks. Stipend + leadership credits included.',
    time: 'Oct 20, 2024',
    author: 'Student Welfare Council',
    unread: false,
  },
  {
    id: 'ann-4',
    category: 'PLACEMENTS',
    priority: 'Deadline',
    title: 'Pre-placement technical mock interviews & resume clinic this Thursday',
    summary:
      'Bring two printed copies of your resume to Sir M. V. Block Seminar Hall 2 for 1-on-1 feedback from senior industry mentors.',
    time: 'Oct 19, 2024',
    author: 'Training & Placement Cell',
    unread: false,
  },
]

export const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']

export const initialFacultyDirectory = [
  {
    id: 'fac-1',
    facultyCode: 'FAC-CSE-01',
    name: 'Dr. Ananya Rao',
    initials: 'AR',
    role: 'Professor & Head, Software Systems',
    department: 'Computer Science',
    office: 'Room 302, Sir C. V. Raman Block',
    locationId: 'sir-c-v-raman-block',
    email: 'ananya.rao@bmsit.in',
    officeHours: 'Mon & Wed · 2:00 PM – 4:00 PM',
    research: ['Distributed Systems', 'Agile DevOps', 'Cloud Architecture'],
    liveStatus: 'available', // 'available' | 'in-class' | 'busy'
    timetable: [
      { id: 't1', day: 'Mon', time: '09:00 – 10:00', title: 'BCS501 · Software Engineering', room: 'Room 304', type: 'lecture' },
      { id: 't2', day: 'Mon', time: '11:00 – 12:00', title: 'Faculty Research Sync', room: 'Room 302', type: 'busy' },
      { id: 't3', day: 'Mon', time: '14:00 – 16:00', title: 'Student Office Hours', room: 'Room 302', type: 'office-hours' },
      { id: 't4', day: 'Tue', time: '10:00 – 12:00', title: 'Agile Systems Lab', room: 'Lab 1', type: 'lab' },
      { id: 't5', day: 'Tue', time: '15:00 – 16:30', title: 'Open Mentorship Slot', room: 'Room 302', type: 'office-hours' },
      { id: 't6', day: 'Wed', time: '09:00 – 10:00', title: 'BCS501 · Software Engineering', room: 'Room 304', type: 'lecture' },
      { id: 't7', day: 'Wed', time: '14:00 – 16:00', title: 'Student Office Hours', room: 'Room 302', type: 'office-hours' },
      { id: 't8', day: 'Thu', time: '11:00 – 13:00', title: 'Capstone Project Reviews', room: 'Innovation Lab', type: 'office-hours' },
      { id: 't9', day: 'Fri', time: '10:00 – 11:00', title: 'Department Board', room: 'Conf. Hall', type: 'busy' },
      { id: 't10', day: 'Fri', time: '14:00 – 15:30', title: 'Open Drop-in Hours', room: 'Room 302', type: 'office-hours' },
    ],
  },
  {
    id: 'fac-2',
    facultyCode: 'FAC-CSE-02',
    name: 'Prof. Karthik Hegde',
    initials: 'KH',
    role: 'Associate Professor, Networks & Security',
    department: 'Computer Science',
    office: 'Cabin 14, B. S. Narayan Block',
    locationId: 'b-s-narayan-block',
    email: 'karthik.hegde@bmsit.in',
    officeHours: 'Tue & Thu · 11:00 AM – 1:00 PM',
    research: ['Zero-Trust Networks', 'Applied Cryptography', 'IoT Security'],
    liveStatus: 'in-class',
    timetable: [
      { id: 'k1', day: 'Mon', time: '11:15 – 12:15', title: 'BCS502 · Computer Networks', room: 'Lab 2', type: 'lecture' },
      { id: 'k2', day: 'Mon', time: '14:30 – 16:00', title: 'Security Lab Drop-in', room: 'Cabin 14', type: 'office-hours' },
      { id: 'k3', day: 'Tue', time: '11:00 – 13:00', title: 'Student Office Hours', room: 'Cabin 14', type: 'office-hours' },
      { id: 'k4', day: 'Wed', time: '10:00 – 12:00', title: 'Cybersecurity Workshop', room: 'Lab 2', type: 'lab' },
      { id: 'k5', day: 'Thu', time: '11:00 – 13:00', title: 'Student Office Hours', room: 'Cabin 14', type: 'office-hours' },
      { id: 'k6', day: 'Fri', time: '15:00 – 16:00', title: 'Open Mentorship', room: 'Cabin 14', type: 'office-hours' },
    ],
  },
  {
    id: 'fac-3',
    facultyCode: 'FAC-AIML-01',
    name: 'Dr. Meera Kulkarni',
    initials: 'MK',
    role: 'Professor, Machine Intelligence',
    department: 'AI & ML',
    office: 'Room 210, Silver Jubilee Block',
    locationId: 'silver-jubilee-block',
    email: 'meera.kulkarni@bmsit.in',
    officeHours: 'Wed & Fri · 3:00 PM – 5:00 PM',
    research: ['Multimodal LLMs', 'Computer Vision', 'Edge Inference'],
    liveStatus: 'busy',
    timetable: [
      { id: 'm1', day: 'Mon', time: '14:00 – 15:00', title: 'BCS503 · Theory of Computation', room: 'Hall 108', type: 'lecture' },
      { id: 'm2', day: 'Tue', time: '10:00 – 12:00', title: 'AI Research Lab', room: 'Room 210', type: 'busy' },
      { id: 'm3', day: 'Wed', time: '15:00 – 17:00', title: 'Student Office Hours', room: 'Room 210', type: 'office-hours' },
      { id: 'm4', day: 'Thu', time: '14:00 – 15:00', title: 'BCS503 · Theory of Computation', room: 'Hall 108', type: 'lecture' },
      { id: 'm5', day: 'Fri', time: '15:00 – 17:00', title: 'Student Office Hours', room: 'Room 210', type: 'office-hours' },
    ],
  },
  {
    id: 'fac-4',
    facultyCode: 'FAC-ARCH-01',
    name: 'Prof. Rohan Deshmukh',
    initials: 'RD',
    role: 'Assistant Professor, Spatial & Interaction Design',
    department: 'Architecture',
    office: 'Studio 2, BMSSA Block 1',
    locationId: 'bmssa-block-1',
    email: 'rohan.deshmukh@bmsit.in',
    officeHours: 'Mon & Thu · 1:30 PM – 3:30 PM',
    research: ['Human-Centered Design', 'Urban Campus Wayfinding', 'VR Studios'],
    liveStatus: 'available',
    timetable: [
      { id: 'r1', day: 'Mon', time: '13:30 – 15:30', title: 'Studio Office Hours', room: 'Studio 2', type: 'office-hours' },
      { id: 'r2', day: 'Tue', time: '15:15 – 17:00', title: 'BCSL504 · UI Systems Studio', room: 'Studio 1', type: 'lab' },
      { id: 'r3', day: 'Thu', time: '13:30 – 15:30', title: 'Portfolio Critique Hours', room: 'Studio 2', type: 'office-hours' },
    ],
  },
  {
    id: 'fac-5',
    facultyCode: 'FAC-ECE-01',
    name: 'Dr. Siddharth Nair',
    initials: 'SN',
    role: 'Professor, Embedded & VLSI Systems',
    department: 'Electronics',
    office: 'Lab Wing 1, Sir M. V. Block',
    locationId: 'sir-m-v-block',
    email: 'siddharth.nair@bmsit.in',
    officeHours: 'Tue & Fri · 10:30 AM – 12:30 PM',
    research: ['RISC-V Architecture', 'Low-Power SoCs', 'Sensor Networks'],
    liveStatus: 'available',
    timetable: [
      { id: 's1', day: 'Tue', time: '10:30 – 12:30', title: 'VLSI Office Hours', room: 'Lab Wing 1', type: 'office-hours' },
      { id: 's2', day: 'Wed', time: '09:30 – 11:30', title: 'Embedded Lab', room: 'Lab Wing 1', type: 'lab' },
      { id: 's3', day: 'Fri', time: '10:30 – 12:30', title: 'Project Mentorship', room: 'Lab Wing 1', type: 'office-hours' },
    ],
  },
  {
    id: 'fac-6',
    facultyCode: 'FAC-ISE-01',
    name: 'Prof. Kavya Shetty',
    initials: 'KS',
    role: 'Assistant Professor, Data Engineering',
    department: 'Information Science',
    office: 'Room 118, B. S. Narayan Block',
    locationId: 'b-s-narayan-block',
    email: 'kavya.shetty@bmsit.in',
    officeHours: 'Wed · 11:00 AM – 1:30 PM',
    research: ['Graph Databases', 'Streaming Analytics', 'Open Data'],
    liveStatus: 'available',
    timetable: [
      { id: 'ka1', day: 'Mon', time: '10:00 – 11:30', title: 'Data Systems Lecture', room: 'Room 112', type: 'lecture' },
      { id: 'ka2', day: 'Wed', time: '11:00 – 13:30', title: 'Student Office Hours', room: 'Room 118', type: 'office-hours' },
      { id: 'ka3', day: 'Thu', time: '14:00 – 15:30', title: 'Open Advising', room: 'Room 118', type: 'office-hours' },
    ],
  },
]

export const initialUrgentAlerts = [
  {
    id: 'alert-seed-1',
    facultyId: 'fac-1',
    facultyName: 'Dr. Ananya Rao',
    studentName: 'Aarav Menon',
    studentUsn: '1BY23CS012',
    reason: 'Need urgent signature on ACM Hackathon Bonafide letter before 3:00 PM submission.',
    urgency: 'urgent',
    createdAt: '12 mins ago',
    status: 'pending', // 'pending' | 'accepted' | 'resolved'
    replyNote: '',
  },
]

/**
 * Computes logical faculty availability for a given day from their timetable + live status override.
 */
export function computeFacultyAvailability(faculty, day = 'Mon') {
  const daySlots = faculty.timetable.filter((slot) => slot.day === day)
  const officeHourSlots = daySlots.filter((slot) => slot.type === 'office-hours')

  if (faculty.liveStatus === 'available') {
    return {
      label: officeHourSlots.length > 0 ? 'Available · Office Hours' : 'Available in Cabin',
      tone: 'available',
      officeHourSlots,
      daySlots,
    }
  }
  if (faculty.liveStatus === 'in-class') {
    return {
      label: 'In Lecture / Lab',
      tone: 'in-class',
      officeHourSlots,
      daySlots,
    }
  }
  return {
    label: 'Busy / Meeting',
    tone: 'busy',
    officeHourSlots,
    daySlots,
  }
}
