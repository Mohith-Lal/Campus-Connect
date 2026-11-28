import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import {
  ArrowRight,
  Compass,
  GraduationCap,
  Lock,
  Mail,
  MapPin,
  Moon,
  School,
  ShieldCheck,
  Sparkles,
  Sun,
  Users,
} from 'lucide-react'
import { initialFacultyDirectory, studentProfile } from '../data/campusPortalData.js'

// BMSIT Campus Landmark Masterplan Graph (Shifted leftward for 100% unobstructed visibility)
const CAMPUS_GRAPH_NODES = [
  { id: 'gate', name: 'Campus Gate 1', detail: 'Main Entry & Security', xRatio: 0.08, yRatio: 0.76, category: 'Entrance', footprint: { w: 40, h: 24, type: 'gate' }, badgeAlign: 'right', pulseOffset: 0 },
  { id: 'sir-c-v-raman-block', name: 'Sir C.V. Raman Block', detail: 'ECE / EEE & Physics Labs', xRatio: 0.15, yRatio: 0.32, category: 'Academic', footprint: { w: 56, h: 32, type: 'academic' }, badgeAlign: 'right', pulseOffset: 1.2 },
  { id: 'b-s-narayan-block', name: 'B. S. Narayan Block', detail: 'CSE Wing & AI Studios', xRatio: 0.32, yRatio: 0.22, category: 'Academic', footprint: { w: 58, h: 36, type: 'academic' }, badgeAlign: 'right', pulseOffset: 2.4 },
  { id: 'silver-jubilee-block', name: 'Silver Jubilee Block', detail: 'Auditorium & Placement Cell', xRatio: 0.52, yRatio: 0.30, category: 'Auditorium', footprint: { w: 58, h: 38, type: 'auditorium' }, badgeAlign: 'left', pulseOffset: 3.6 },
  { id: 'central-library', name: 'Central Library', detail: 'Reference & Quiet Hall', xRatio: 0.28, yRatio: 0.54, category: 'Library', footprint: { w: 50, h: 32, type: 'library' }, badgeAlign: 'right', pulseOffset: 4.8 },
  { id: 'kaapi-kuteera', name: 'Kaapi Kuteera', detail: 'Cafeteria & Commons', xRatio: 0.46, yRatio: 0.64, category: 'Cafeteria', footprint: { w: 48, h: 32, type: 'cafe' }, badgeAlign: 'right', pulseOffset: 0.8 },
  { id: 'bmssa-block-1', name: 'BMSSA Block', detail: 'Architecture Studios', xRatio: 0.60, yRatio: 0.56, category: 'Academic', footprint: { w: 52, h: 32, type: 'academic' }, badgeAlign: 'left', pulseOffset: 2.0 },
  { id: 'playground', name: 'Campus Grounds', detail: 'Basketball & Athletics', xRatio: 0.18, yRatio: 0.84, category: 'Sports', footprint: { w: 76, h: 42, type: 'field' }, badgeAlign: 'right', pulseOffset: 3.2 },
]

const CAMPUS_GRAPH_EDGES = [
  ['gate', 'sir-c-v-raman-block'],
  ['gate', 'playground'],
  ['sir-c-v-raman-block', 'b-s-narayan-block'],
  ['sir-c-v-raman-block', 'central-library'],
  ['b-s-narayan-block', 'silver-jubilee-block'],
  ['b-s-narayan-block', 'central-library'],
  ['silver-jubilee-block', 'bmssa-block-1'],
  ['silver-jubilee-block', 'kaapi-kuteera'],
  ['central-library', 'kaapi-kuteera'],
  ['kaapi-kuteera', 'playground'],
  ['kaapi-kuteera', 'bmssa-block-1'],
]

const websiteFeaturesTicker = [
  'Interactive Campus Map with Turn-by-Turn GPS Walking Paths',
  'Search Auditorium, Department Cells & Academic Blocks',
  'Real-Time Faculty Cabin Timetables & Availability Radar',
  'Priority Student Urgent Meeting Dispatch & Push Notifications',
  'College-Wide Official Notice Board & Announcements',
  'Live Study Spots & Kaapi Kuteera Hangout Check-In',
  'Campus Fests, Tech Workshops & Hackathon Seat RSVPs',
]

/**
 * Helper to draw rounded rectangle on canvas
 */
function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.lineTo(x + width - radius, y)
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius)
  ctx.lineTo(x + width, y + height - radius)
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
  ctx.lineTo(x + radius, y + height)
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius)
  ctx.lineTo(x, y + radius)
  ctx.quadraticCurveTo(x, y, x + radius, y)
  ctx.closePath()
}

/**
 * Interactive HTML5 Canvas rendering animated campus cartography network
 * with prominent multi-line building badges, clickable landmark beacons, and transit trails.
 */
function CampusNetworkCanvas({ darkMode, role, reducedMotion, onSelectNode }) {
  const canvasRef = useRef(null)
  const mousePosRef = useRef({ x: -1000, y: -1000 })
  const hoveredNodeRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return undefined
    const ctx = canvas.getContext('2d')
    if (!ctx) return undefined

    let animationFrameId
    let width = (canvas.width = window.innerWidth)
    let height = (canvas.height = window.innerHeight)

    const handleResize = () => {
      if (!canvas) return
      width = canvas.width = window.innerWidth
      height = canvas.height = window.innerHeight
    }

    const handleMouseMove = (e) => {
      mousePosRef.current = { x: e.clientX, y: e.clientY }
    }

    const handleMouseLeave = () => {
      mousePosRef.current = { x: -1000, y: -1000 }
      hoveredNodeRef.current = null
    }

    const handleClick = (e) => {
      // Allow normal clicks on buttons, inputs, links, forms, and labels
      if (e?.target && e.target.closest && e.target.closest('button, input, select, a, form, label')) {
        return
      }
      if (hoveredNodeRef.current && onSelectNode) {
        onSelectNode(hoveredNodeRef.current.id)
      }
    }

    window.addEventListener('resize', handleResize)
    window.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseleave', handleMouseLeave)
    canvas.addEventListener('click', handleClick)
    window.addEventListener('click', handleClick)

    // Animated transit particles
    const particles = []
    const edgeCount = CAMPUS_GRAPH_EDGES.length
    for (let i = 0; i < 24; i++) {
      particles.push({
        edgeIndex: i % edgeCount,
        progress: i / 24,
        speed: 0.0016 + (i % 5) * 0.0006,
        size: 2.5 + (i % 3),
        hue:
          role === 'student'
            ? darkMode
              ? i % 3 === 0 ? '#38bdf8' : i % 3 === 1 ? '#818cf8' : '#fbbf24'
              : i % 3 === 0 ? '#2563eb' : i % 3 === 1 ? '#4f46e5' : '#d97706'
            : darkMode
              ? i % 3 === 0 ? '#34d399' : i % 3 === 1 ? '#38bdf8' : '#fbbf24'
              : i % 3 === 0 ? '#059669' : i % 3 === 1 ? '#2563eb' : '#b45309',
      })
    }

    let pulseTick = 0

    const render = () => {
      ctx.clearRect(0, 0, width, height)

      // Resolve pixel positions with responsive campus architectural framing
      const isMobile = width < 768
      const marginX = width > 1200 ? 48 : width > 768 ? 32 : 12
      const marginY = height > 800 ? 54 : isMobile ? 24 : 32
      const usableW = Math.max(200, width - marginX * 2)
      const usableH = Math.max(200, height - marginY * 2)

      const nodeMap = new Map()
      CAMPUS_GRAPH_NODES.forEach((n) => {
        // In mobile viewports, spread nodes gracefully across the visible viewport
        const xFactor = isMobile ? Math.min(0.92, Math.max(0.08, n.xRatio * 1.25)) : n.xRatio
        const yFactor = isMobile ? Math.min(0.92, Math.max(0.12, n.yRatio)) : n.yRatio
        const px = marginX + xFactor * usableW
        const py = marginY + yFactor * usableH
        nodeMap.set(n.id, { ...n, px, py })
      })

      // Check hover proximity against node center and badge box
      const mouse = mousePosRef.current
      let closestNode = null
      let closestDist = 70

      nodeMap.forEach((node) => {
        const dx = node.px - mouse.x
        const dy = node.py - mouse.y
        const dist = Math.hypot(dx, dy)
        if (dist < closestDist) {
          closestDist = dist
          closestNode = node
        }
        const refNode = CAMPUS_GRAPH_NODES.find((n) => n.id === node.id)
        if (refNode?.badgeBounds) {
          const b = refNode.badgeBounds
          if (
            mouse.x >= b.x - 4 &&
            mouse.x <= b.x + b.w + 4 &&
            mouse.y >= b.y - 4 &&
            mouse.y <= b.y + b.h + 4
          ) {
            closestNode = node
            closestDist = 0
          }
        }
      })
      hoveredNodeRef.current = closestNode

      if (canvas) {
        canvas.style.cursor = closestNode ? 'pointer' : 'default'
      }

      // 1. Architectural blueprint grid (high contrast in light mode)
      ctx.lineWidth = 1
      ctx.strokeStyle = darkMode ? 'rgba(255, 255, 255, 0.04)' : 'rgba(37, 99, 235, 0.08)'
      const gridSize = 60
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, height)
        ctx.stroke()
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(width, y)
        ctx.stroke()
      }

      // 1.5 Authentic Campus Facility & Building Footprints
      nodeMap.forEach((node) => {
        if (!node.footprint) return
        const { w, h, type } = node.footprint
        const bx = node.px - w / 2
        const by = node.py - h / 2

        ctx.save()
        if (type === 'field') {
          // Green turf rectangle for sports ground & athletic track
          ctx.fillStyle = darkMode ? 'rgba(16, 185, 129, 0.08)' : 'rgba(16, 185, 129, 0.12)'
          ctx.strokeStyle = darkMode ? 'rgba(52, 211, 153, 0.35)' : 'rgba(5, 150, 105, 0.45)'
          ctx.lineWidth = 1.2
          roundRect(ctx, bx, by, w, h, 8)
          ctx.fill()
          ctx.stroke()
          // Running track / field line inside
          ctx.strokeStyle = darkMode ? 'rgba(52, 211, 153, 0.2)' : 'rgba(5, 150, 105, 0.25)'
          ctx.setLineDash([3, 4])
          roundRect(ctx, bx + 6, by + 6, w - 12, h - 12, 5)
          ctx.stroke()
          ctx.setLineDash([])
        } else if (type === 'court') {
          // Orange court rectangle
          ctx.fillStyle = darkMode ? 'rgba(249, 115, 22, 0.08)' : 'rgba(249, 115, 22, 0.12)'
          ctx.strokeStyle = darkMode ? 'rgba(251, 146, 60, 0.35)' : 'rgba(234, 88, 12, 0.45)'
          ctx.lineWidth = 1.2
          roundRect(ctx, bx, by, w, h, 6)
          ctx.fill()
          ctx.stroke()
        } else if (type === 'cafe') {
          // Amber cafe rectangle
          ctx.fillStyle = darkMode ? 'rgba(245, 158, 11, 0.08)' : 'rgba(245, 158, 11, 0.12)'
          ctx.strokeStyle = darkMode ? 'rgba(251, 191, 36, 0.35)' : 'rgba(217, 119, 6, 0.45)'
          ctx.lineWidth = 1.2
          roundRect(ctx, bx, by, w, h, 6)
          ctx.fill()
          ctx.stroke()
        } else if (type === 'auditorium') {
          // Purple/indigo auditorium footprint with stage contour
          const isHovered = closestNode && closestNode.id === node.id
          ctx.fillStyle = darkMode
            ? isHovered ? 'rgba(129, 140, 248, 0.22)' : 'rgba(129, 140, 248, 0.12)'
            : isHovered ? 'rgba(79, 70, 229, 0.22)' : 'rgba(79, 70, 229, 0.12)'
          ctx.strokeStyle = darkMode ? 'rgba(129, 140, 248, 0.6)' : 'rgba(79, 70, 229, 0.55)'
          ctx.lineWidth = isHovered ? 1.6 : 1.2
          roundRect(ctx, bx, by, w, h, 6)
          ctx.fill()
          ctx.stroke()
        } else if (type === 'parking') {
          // Parking bay footprint with light stripes
          ctx.fillStyle = darkMode ? 'rgba(148, 163, 184, 0.06)' : 'rgba(148, 163, 184, 0.12)'
          ctx.strokeStyle = darkMode ? 'rgba(148, 163, 184, 0.3)' : 'rgba(100, 116, 139, 0.4)'
          ctx.lineWidth = 1.2
          roundRect(ctx, bx, by, w, h, 6)
          ctx.fill()
          ctx.stroke()
        } else {
          // Academic block footprint
          const isHovered = closestNode && closestNode.id === node.id
          ctx.fillStyle = darkMode
            ? isHovered ? 'rgba(56, 189, 248, 0.12)' : 'rgba(255, 255, 255, 0.04)'
            : isHovered ? 'rgba(37, 99, 235, 0.12)' : 'rgba(37, 99, 235, 0.06)'
          ctx.strokeStyle = darkMode
            ? isHovered ? 'rgba(56, 189, 248, 0.55)' : 'rgba(255, 255, 255, 0.14)'
            : isHovered ? 'rgba(37, 99, 235, 0.6)' : 'rgba(37, 99, 235, 0.28)'
          ctx.lineWidth = isHovered ? 1.5 : 1
          roundRect(ctx, bx, by, w, h, 6)
          ctx.fill()
          ctx.stroke()
        }
        ctx.restore()
      })

      // 2. High-contrast walking network path edges
      CAMPUS_GRAPH_EDGES.forEach(([fromId, toId]) => {
        const u = nodeMap.get(fromId)
        const v = nodeMap.get(toId)
        if (!u || !v) return

        const isHighlight =
          closestNode && (closestNode.id === fromId || closestNode.id === toId)

        // Subtle path glow / wider track
        ctx.beginPath()
        ctx.lineWidth = isHighlight ? 4 : 2.5
        ctx.strokeStyle = isHighlight
          ? darkMode ? 'rgba(56, 189, 248, 0.4)' : 'rgba(37, 99, 235, 0.35)'
          : darkMode ? 'rgba(56, 189, 248, 0.12)' : 'rgba(37, 99, 235, 0.14)'
        ctx.moveTo(u.px, u.py)
        ctx.lineTo(v.px, v.py)
        ctx.stroke()

        // Center dashed walking line
        ctx.beginPath()
        ctx.setLineDash([5, 5])
        ctx.lineWidth = isHighlight ? 2.4 : 1.5
        ctx.strokeStyle = isHighlight
          ? darkMode ? '#38bdf8' : '#2563eb'
          : darkMode ? 'rgba(255, 255, 255, 0.22)' : 'rgba(37, 99, 235, 0.45)'
        ctx.moveTo(u.px, u.py)
        ctx.lineTo(v.px, v.py)
        ctx.stroke()
        ctx.setLineDash([])
      })

      // 3. Dynamic transit packets along routes
      if (!reducedMotion) {
        particles.forEach((p) => {
          const edge = CAMPUS_GRAPH_EDGES[p.edgeIndex]
          const u = nodeMap.get(edge[0])
          const v = nodeMap.get(edge[1])
          if (!u || !v) return

          p.progress += p.speed
          if (p.progress >= 1) {
            p.progress = 0
            p.edgeIndex = Math.floor(Math.random() * CAMPUS_GRAPH_EDGES.length)
          }

          const curX = u.px + (v.px - u.px) * p.progress
          const curY = u.py + (v.py - u.py) * p.progress

          ctx.beginPath()
          ctx.arc(curX, curY, p.size, 0, Math.PI * 2)
          ctx.fillStyle = p.hue
          ctx.shadowBlur = darkMode ? 10 : 6
          ctx.shadowColor = p.hue
          ctx.fill()
          ctx.shadowBlur = 0
        })
      }

      // 4. Prominent Campus Landmark Nodes & Multi-Line Detailed Badges
      pulseTick += 0.035
      nodeMap.forEach((node) => {
        const isHovered = closestNode && closestNode.id === node.id

        // Radar beacon pulse wave for prominent venue visibility
        if (!reducedMotion) {
          const waveRadius = isHovered
            ? 16 + (Math.sin(pulseTick * 2.5) + 1) * 14
            : 8 + (Math.sin(pulseTick * 1.5 + (node.pulseOffset || 0)) + 1) * 7
          ctx.beginPath()
          ctx.arc(node.px, node.py, waveRadius, 0, Math.PI * 2)
          ctx.strokeStyle = isHovered
            ? (darkMode ? 'rgba(56, 189, 248, 0.9)' : 'rgba(37, 99, 235, 0.9)')
            : (darkMode ? 'rgba(56, 189, 248, 0.32)' : 'rgba(37, 99, 235, 0.35)')
          ctx.lineWidth = isHovered ? 2 : 1.2
          ctx.stroke()
        }

        // Node circle outer ring with luminous glow & animated hover aura
        if (isHovered && !reducedMotion) {
          const auraR = 14 + Math.sin(pulseTick * 0.12) * 4
          ctx.beginPath()
          ctx.arc(node.px, node.py, auraR, 0, Math.PI * 2)
          ctx.strokeStyle = darkMode ? 'rgba(56, 189, 248, 0.65)' : 'rgba(37, 99, 235, 0.6)'
          ctx.lineWidth = 1.4
          ctx.setLineDash([3, 3])
          ctx.stroke()
          ctx.setLineDash([])
        }

        ctx.beginPath()
        ctx.arc(node.px, node.py, isHovered ? 9.5 : 7, 0, Math.PI * 2)
        ctx.fillStyle = isHovered
          ? (darkMode ? '#38bdf8' : '#2563eb')
          : (darkMode ? '#38bdf8' : '#2563eb')
        ctx.shadowBlur = isHovered ? 16 : 8
        ctx.shadowColor = darkMode ? '#38bdf8' : '#2563eb'
        ctx.fill()
        ctx.shadowBlur = 0

        // Node center pip
        ctx.beginPath()
        ctx.arc(node.px, node.py, isHovered ? 4 : 2.5, 0, Math.PI * 2)
        ctx.fillStyle = '#ffffff'
        ctx.fill()

        // High-Contrast Multi-Line Campus Landmark Name Pill Badge (Concise & sleek)
        ctx.font = 'bold 10px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        const labelText = node.name
        const detailText = node.detail
        const labelMetrics = ctx.measureText(labelText)

        ctx.font = '8px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        const detailMetrics = ctx.measureText(detailText)

        const badgeW = Math.max(labelMetrics.width, detailMetrics.width) + 18
        const badgeH = 28
        // Smart precision placement based on node configuration
        let badgeX
        let badgeY

        if (node.badgeAlign === 'left') {
          badgeX = node.px - badgeW - 10
          badgeY = node.py - 14
        } else if (node.badgeAlign === 'top') {
          badgeX = node.px - badgeW / 2
          badgeY = node.py - badgeH - 10
        } else if (node.badgeAlign === 'bottom') {
          badgeX = node.px - badgeW / 2
          badgeY = node.py + 12
        } else {
          // right
          badgeX = node.px + 10
          badgeY = node.py - 14
        }

        // Viewport boundaries
        if (badgeX + badgeW > width - 12) {
          badgeX = width - 12 - badgeW
        }
        if (badgeX < 10) {
          badgeX = 10
        }
        if (badgeY < 56) {
          badgeY = 56
        }
        if (badgeY + badgeH > height - 44) {
          badgeY = height - 44 - badgeH
        }

        // Store badge bounds for hover and click detection
        const refNode = CAMPUS_GRAPH_NODES.find((n) => n.id === node.id)
        if (refNode) {
          refNode.badgeBounds = { x: badgeX, y: badgeY, w: badgeW, h: badgeH }
        }

        // Badge background with elevated depth
        ctx.fillStyle = darkMode
          ? isHovered ? 'rgba(15, 23, 42, 0.96)' : 'rgba(15, 23, 42, 0.92)'
          : isHovered ? 'rgba(255, 255, 255, 0.98)' : 'rgba(255, 255, 255, 0.95)'
        ctx.strokeStyle = isHovered
          ? darkMode ? 'rgba(56, 189, 248, 0.95)' : 'rgba(37, 99, 235, 0.95)'
          : darkMode ? 'rgba(56, 189, 248, 0.5)' : 'rgba(37, 99, 235, 0.45)'
        ctx.lineWidth = isHovered ? 1.4 : 1
        ctx.shadowBlur = isHovered ? 10 : 4
        ctx.shadowColor = darkMode ? 'rgba(0, 0, 0, 0.75)' : 'rgba(37, 99, 235, 0.15)'
        roundRect(ctx, badgeX, badgeY, badgeW, badgeH, 6)
        ctx.fill()
        ctx.shadowBlur = 0
        ctx.stroke()

        // Green live status dot inside badge
        ctx.beginPath()
        ctx.arc(badgeX + 8, badgeY + 11, 2, 0, Math.PI * 2)
        ctx.fillStyle = isHovered ? '#10b981' : darkMode ? '#34d399' : '#059669'
        ctx.fill()

        // Badge title
        ctx.font = 'bold 10px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        ctx.fillStyle = darkMode
          ? isHovered ? '#38bdf8' : '#f8fafc'
          : isHovered ? '#1d4ed8' : '#0f172a'
        ctx.fillText(labelText, badgeX + 14, badgeY + 12)

        // Badge subtitle (detail)
        ctx.font = '8px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        ctx.fillStyle = darkMode ? '#94a3b8' : '#475569'
        ctx.fillText(detailText, badgeX + 14, badgeY + 23)
      })

      // 5. Mouse rangefinder proximity circle
      if (mouse.x > 0 && mouse.y > 0 && !reducedMotion) {
        ctx.beginPath()
        ctx.arc(mouse.x, mouse.y, 48, 0, Math.PI * 2)
        ctx.strokeStyle = darkMode ? 'rgba(56, 189, 248, 0.24)' : 'rgba(37, 99, 235, 0.24)'
        ctx.lineWidth = 1
        ctx.setLineDash([3, 5])
        ctx.stroke()
        ctx.setLineDash([])

        ctx.beginPath()
        ctx.arc(mouse.x, mouse.y, 2.5, 0, Math.PI * 2)
        ctx.fillStyle = darkMode ? 'rgba(56, 189, 248, 0.7)' : 'rgba(37, 99, 235, 0.7)'
        ctx.fill()
      }

      if (!reducedMotion) {
        animationFrameId = requestAnimationFrame(render)
      }
    }

    render()

    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseleave', handleMouseLeave)
      canvas.removeEventListener('click', handleClick)
      window.removeEventListener('click', handleClick)
      if (animationFrameId) cancelAnimationFrame(animationFrameId)
    }
  }, [darkMode, role, reducedMotion, onSelectNode])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="absolute inset-0 z-0 h-full w-full pointer-events-auto"
    />
  )
}

export function AuthGate({ onLogin, darkMode, onToggleDark }) {
  const [role, setRole] = useState('student')
  const [identifier, setIdentifier] = useState(studentProfile.email)
  const [password, setPassword] = useState('campus2024')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const shouldReduceMotion = useReducedMotion()

  const handleRoleSwitch = (nextRole) => {
    setRole(nextRole)
    setError('')
    if (nextRole === 'student') {
      setIdentifier(studentProfile.email)
    } else {
      setIdentifier(initialFacultyDirectory[0].email)
    }
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    const trimmedId = identifier.trim().toLowerCase()
    if (!trimmedId) {
      setError('Please provide your college email, USN, or Faculty ID.')
      return
    }
    if (password.trim().length < 4) {
      setError('Password must be at least 4 characters.')
      return
    }

    setIsSubmitting(true)

    setTimeout(() => {
      if (role === 'student') {
        onLogin({
          role: 'student',
          userId: studentProfile.id,
          name: studentProfile.name,
          subtitle: `${studentProfile.usn} · ${studentProfile.semester}`,
        })
        return
      }

      const matchedFaculty =
        initialFacultyDirectory.find(
          (f) =>
            f.email.toLowerCase() === trimmedId ||
            f.facultyCode.toLowerCase() === trimmedId,
        ) ?? initialFacultyDirectory[0]

      onLogin({
        role: 'faculty',
        userId: matchedFaculty.id,
        name: matchedFaculty.name,
        subtitle: `${matchedFaculty.facultyCode} · ${matchedFaculty.department}`,
      })
    }, 280)
  }

  const enterAsGuest = (targetLocationId = null) => {
    setIsSubmitting(true)
    setTimeout(() => {
      onLogin({
        role: 'guest',
        userId: 'guest-user',
        name: 'New Campus Explorer',
        subtitle: 'Guest Visitor · Campus Map & Navigation',
        startPage: 'Campus Map',
        targetLocationId,
      })
    }, 200)
  }

  return (
    <div
      className={`relative min-h-[100dvh] w-full overflow-hidden font-sans antialiased selection:bg-brand-500 selection:text-white transition-colors duration-300 ${
        darkMode ? 'bg-[#070b14] text-slate-100' : 'bg-slate-50 text-slate-900'
      }`}
    >
      {/* 1. Visible, Fully Unobstructed Interactive Campus Network Canvas */}
      <CampusNetworkCanvas
        darkMode={darkMode}
        role={role}
        reducedMotion={shouldReduceMotion}
        onSelectNode={(nodeId) => enterAsGuest(nodeId)}
      />

      {/* 2. Soft Ambient Chromatic Auroras */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <motion.div
          animate={
            shouldReduceMotion
              ? undefined
              : {
                  scale: [1, 1.15, 1],
                  opacity: darkMode ? [0.35, 0.52, 0.35] : [0.15, 0.28, 0.15],
                  x: [0, 25, 0],
                  y: [0, -20, 0],
                }
          }
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
          className={`absolute -left-36 -top-36 h-[680px] w-[680px] rounded-full blur-[130px] ${
            role === 'student'
              ? 'bg-linear-to-br from-brand-600/35 via-iris-600/20 to-transparent'
              : 'bg-linear-to-br from-emerald-600/30 via-brand-600/20 to-transparent'
          }`}
        />

        <motion.div
          animate={
            shouldReduceMotion
              ? undefined
              : {
                  scale: [1, 1.2, 1],
                  opacity: darkMode ? [0.25, 0.45, 0.25] : [0.12, 0.24, 0.12],
                  x: [0, -35, 0],
                  y: [0, 30, 0],
                }
          }
          transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
          className="absolute -bottom-36 right-0 h-[620px] w-[620px] rounded-full bg-linear-to-tl from-sun-500/25 via-brand-600/20 to-transparent blur-[140px]"
        />

        {/* Subtle Orbital Astrolabe Compass Ring */}
        <motion.div
          animate={shouldReduceMotion ? undefined : { rotate: 360 }}
          transition={{ duration: 180, repeat: Infinity, ease: 'linear' }}
          className={`absolute -right-20 top-20 hidden h-[520px] w-[520px] rounded-full border xl:block ${
            darkMode ? 'border-white/5 opacity-40' : 'border-slate-900/10 opacity-35'
          }`}
        >
          <div className="absolute left-6 top-24 h-2.5 w-2.5 rounded-full bg-brand-500 shadow-sm shadow-brand-400" />
          <div className="absolute bottom-12 right-20 h-2 w-2 rounded-full bg-amber-500 shadow-sm shadow-amber-400" />
        </motion.div>

        {/* Architectural BMSIT Silhouette Skyline Vector at Base */}
        <svg
          aria-hidden="true"
          className={`pointer-events-none absolute bottom-0 left-0 right-0 h-32 w-full ${
            darkMode ? 'opacity-20' : 'opacity-15'
          }`}
          fill="none"
          preserveAspectRatio="none"
          viewBox="0 0 1200 180"
        >
          <path
            d="M0 180V130H80V90L120 62L160 90V130H240V110H320V180H380V70H460V42L500 15L540 42V70H620V180H700V100H820V180H900V120L950 82L1000 120V180H1200V180H0Z"
            fill="url(#skylineLinearGrad)"
          />
          <defs>
            <linearGradient id="skylineLinearGrad" x1="0%" x2="100%" y1="0%" y2="0%">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="45%" stopColor="#818cf8" />
              <stop offset="85%" stopColor="#fbbf24" />
              <stop offset="100%" stopColor="#34d399" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Main Container */}
      <div className="pointer-events-none relative z-10 flex min-h-[100dvh] flex-col justify-between">
        {/* Floating Glass Header */}
        <header className="pointer-events-auto mx-auto flex w-full max-w-[1360px] items-center justify-between px-6 py-4 sm:px-10 lg:px-12">
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.45 }}
            className="flex items-center gap-3.5"
          >
            <div
              className={`relative flex h-12 w-12 items-center justify-center rounded-2xl border shadow-xs backdrop-blur-xl ${
                darkMode ? 'border-white/15 bg-white/5' : 'border-slate-300 bg-white/90 shadow-slate-200'
              }`}
            >
              <School className={`h-6 w-6 ${darkMode ? 'text-brand-300' : 'text-brand-600'}`} />
              <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white dark:border-[#070b14] bg-mint-500" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <span
                  className={`font-display text-2xl font-black tracking-tight ${
                    darkMode ? 'text-white' : 'text-slate-950'
                  }`}
                >
                  Campus<span className="text-transparent bg-clip-text bg-linear-to-r from-brand-600 via-iris-600 to-amber-600 dark:from-sky-400 dark:via-indigo-300 dark:to-amber-300">Connect</span>
                </span>
                <span
                  className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                    darkMode
                      ? 'border-brand-400/25 bg-brand-500/10 text-brand-300'
                      : 'border-brand-300 bg-brand-50 text-brand-700'
                  }`}
                >
                  Academic Portal
                </span>
              </div>
              <p className={`font-mono-code text-xs font-semibold tracking-wide ${darkMode ? 'text-slate-400' : 'text-slate-700'}`}>
                BMSIT&amp;M · Autonomous College Commons
              </p>
            </div>
          </motion.div>

          {/* Header Controls & Theme Switch */}
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.45 }}
            className="flex items-center gap-3"
          >
            <div
              className={`hidden items-center gap-2 rounded-full border px-4 py-2 text-xs backdrop-blur-md lg:flex ${
                darkMode
                  ? 'border-white/10 bg-slate-900/60 text-slate-300'
                  : 'border-slate-300 bg-white/90 text-slate-800 shadow-xs'
              }`}
            >
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-mint-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-mint-500" />
              </span>
              <span className="font-mono-code text-xs font-bold">13.1332° N, 77.5671° E · GPS Live</span>
            </div>

            <button
              aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              className={`flex h-10 items-center gap-2 rounded-xl border px-4 text-sm font-bold backdrop-blur-md transition ${
                darkMode
                  ? 'border-white/10 bg-white/5 text-slate-200 hover:border-white/25 hover:bg-white/10'
                  : 'border-slate-300 bg-white/90 text-slate-900 shadow-xs hover:border-slate-400 hover:bg-white'
              }`}
              onClick={onToggleDark}
              type="button"
            >
              {darkMode ? <Sun size={16} className="text-amber-400" /> : <Moon size={16} className="text-brand-600" />}
              <span className="hidden sm:inline">{darkMode ? 'Light' : 'Dark'}</span>
            </button>
          </motion.div>
        </header>

        {/* Hero Section & Unobstructed Map View */}
        <main className="mx-auto flex w-full max-w-[1360px] flex-1 flex-col justify-center px-4 py-3 sm:px-8 sm:py-4 lg:px-12 lg:py-6">
          <div className="grid w-full items-center gap-6 sm:gap-8 lg:grid-cols-12 lg:gap-12 xl:gap-16">
            {/* Left Hero: Aligned at top-left so it stays cleanly above the lower map nodes */}
            <div className="space-y-3.5 sm:space-y-4 lg:col-span-7 xl:col-span-7 max-w-xl">
              {/* Collegiate Status Tag */}
              <motion.div
                key={`badge-${role}`}
                initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45 }}
                className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs sm:text-sm font-bold backdrop-blur-xl ${
                  darkMode
                    ? 'border-white/15 bg-slate-900/70 text-slate-200'
                    : 'border-slate-300 bg-white/95 text-slate-900 shadow-xs'
                }`}
              >
                <Sparkles size={15} className={role === 'student' ? 'text-amber-500' : 'text-emerald-500'} />
                <span>
                  {role === 'student' ? 'Student Academic Commons' : 'Institutional Faculty Gateway'}
                </span>
                <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                <span className="font-mono-code text-[11px] sm:text-xs font-bold text-brand-600 dark:text-sky-400">
                  BMSIT&amp;M Yelahanka
                </span>
              </motion.div>

              {/* Main Headline */}
              <motion.div
                key={`headline-${role}`}
                initial={shouldReduceMotion ? false : { opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.48, delay: 0.05 }}
                className="space-y-2.5 sm:space-y-3"
              >
                <h1
                  className={`font-display text-3xl font-extrabold leading-[1.1] tracking-tight sm:text-4xl md:text-5xl xl:text-[54px] ${
                    darkMode ? 'text-white drop-shadow-sm' : 'text-slate-950 drop-shadow-xs'
                  }`}
                >
                  {role === 'student' ? (
                    <>
                      Everything on campus,{' '}
                      <span className="font-editorial italic font-normal text-transparent bg-clip-text bg-linear-to-r from-brand-600 via-iris-600 to-amber-600 dark:from-sky-300 dark:via-indigo-200 dark:to-amber-200">
                        clearly mapped.
                      </span>
                    </>
                  ) : (
                    <>
                      Academic governance,{' '}
                      <span className="font-editorial italic font-normal text-transparent bg-clip-text bg-linear-to-r from-emerald-600 via-brand-600 to-amber-600 dark:from-emerald-300 dark:via-sky-200 dark:to-amber-200">
                        instantly synced.
                      </span>
                    </>
                  )}
                </h1>
                <p
                  className={`text-sm sm:text-base lg:text-lg font-medium leading-relaxed ${
                    darkMode ? 'text-slate-200 drop-shadow-xs' : 'text-slate-800'
                  }`}
                >
                  {role === 'student'
                    ? 'Turn-by-turn walking routes to your lecture halls, live faculty cabin timetables, and campus study hubs across BMSIT&M.'
                    : 'Manage student priority doubts, broadcast your cabin consultation hours, and review official department circulars.'}
                </p>
              </motion.div>
            </div>

            {/* Right Card: Authentication & Guest Entry with Luminous Frosted Glassmorphism */}
            <motion.div
              initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.97, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="pointer-events-auto w-full lg:col-span-5 xl:col-span-5"
            >
                <div
                  className={`relative w-full max-w-[420px] mx-auto lg:ml-auto lg:mr-0 rounded-3xl border p-5 shadow-2xl backdrop-blur-xl sm:p-6.5 ${
                    darkMode
                      ? 'border-white/15 bg-slate-950/75 shadow-black/80'
                      : 'border-white/90 bg-white/90 shadow-xl shadow-slate-300/40'
                  }`}
                >
                  {/* Top Subtle Refractive Accent */}
                  <div
                    className={`absolute -top-px left-1/2 h-px w-3/4 -translate-x-1/2 bg-linear-to-r from-transparent to-transparent ${
                      role === 'student' ? 'via-brand-500' : 'via-emerald-500'
                    }`}
                  />

                  {/* Card Title */}
                  <div className="flex items-center justify-between">
                    <div>
                      <span
                        className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] ${
                          darkMode
                            ? role === 'student' ? 'text-brand-400' : 'text-emerald-400'
                            : role === 'student' ? 'text-brand-700' : 'text-emerald-700'
                        }`}
                      >
                        <ShieldCheck size={14} /> College Gateway
                      </span>
                      <h2
                        className={`font-display mt-0.5 text-xl sm:text-2xl font-black ${
                          darkMode ? 'text-white' : 'text-slate-950'
                        }`}
                      >
                        Sign in to{' '}
                        <span
                          className={`font-editorial italic font-normal text-[22px] sm:text-[26px] ${
                            role === 'student'
                              ? 'text-brand-600 dark:text-brand-300'
                              : 'text-emerald-600 dark:text-emerald-300'
                          }`}
                        >
                          {role === 'student' ? 'Student Portal' : 'Faculty Deck'}
                        </span>
                      </h2>
                    </div>
                  </div>

                  {/* Animated Role Switcher with High Contrast */}
                  <div
                    className={`mt-3.5 grid grid-cols-2 gap-1 rounded-xl border p-1 ${
                      darkMode
                        ? 'border-white/10 bg-slate-950/60'
                        : 'border-slate-300 bg-slate-100'
                    }`}
                  >
                    {(['student', 'faculty']).map((r) => {
                      const active = role === r
                      return (
                        <button
                          key={r}
                          className={`relative flex items-center justify-center gap-2 rounded-lg py-2 text-sm font-bold transition-colors ${
                            active
                              ? 'text-white'
                              : darkMode
                                ? 'text-slate-300 hover:text-white'
                                : 'text-slate-800 hover:text-slate-950'
                          }`}
                          onClick={() => handleRoleSwitch(r)}
                          type="button"
                        >
                          {active && (
                            <motion.span
                              layoutId="auth-role-spring-pill"
                              transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                              className={`absolute inset-0 rounded-lg shadow-md ${
                                r === 'student'
                                  ? 'bg-linear-to-r from-brand-600 to-iris-600 shadow-brand-600/30'
                                  : 'bg-linear-to-r from-emerald-600 to-brand-600 shadow-emerald-600/30'
                              }`}
                            />
                          )}
                          <span className="relative z-10 flex items-center gap-2">
                            {r === 'student' ? <GraduationCap size={16} /> : <Users size={16} />}
                            <span>{r === 'student' ? 'Student' : 'Faculty'}</span>
                          </span>
                        </button>
                      )
                    })}
                  </div>

                  {/* Login Form */}
                  <form className="mt-3.5 space-y-3" onSubmit={handleSubmit}>
                    <label className={`block text-xs font-bold ${darkMode ? 'text-slate-300' : 'text-slate-900'}`}>
                      {role === 'student' ? 'College Email or USN' : 'Faculty Institutional Email'}
                      <div className="relative mt-1.5">
                        <Mail size={16} className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${darkMode ? 'text-slate-500' : 'text-slate-700'}`} />
                        <input
                          className={`h-10.5 w-full rounded-xl border-2 pl-10 pr-3.5 text-sm font-semibold outline-none transition shadow-xs ${
                            darkMode
                              ? 'border-slate-700 bg-slate-900 text-white placeholder:text-slate-500 focus:border-brand-500'
                              : 'border-slate-300 bg-white text-slate-950 placeholder:text-slate-500 focus:border-brand-600 focus:ring-4 focus:ring-brand-500/15'
                          }`}
                          onChange={(e) => setIdentifier(e.target.value)}
                          placeholder={role === 'student' ? 'jordan.davis@bmsit.in' : 'ananya.rao@bmsit.in'}
                          type="text"
                          value={identifier}
                        />
                      </div>
                    </label>

                    <label className={`block text-xs font-bold ${darkMode ? 'text-slate-300' : 'text-slate-900'}`}>
                      Campus Password
                      <div className="relative mt-1.5">
                        <Lock size={16} className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${darkMode ? 'text-slate-500' : 'text-slate-700'}`} />
                        <input
                          className={`h-10.5 w-full rounded-xl border-2 pl-10 pr-3.5 text-sm font-semibold outline-none transition shadow-xs ${
                            darkMode
                              ? 'border-slate-700 bg-slate-900 text-white placeholder:text-slate-500 focus:border-brand-500'
                              : 'border-slate-300 bg-white text-slate-950 placeholder:text-slate-500 focus:border-brand-600 focus:ring-4 focus:ring-brand-500/15'
                          }`}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••••••"
                          type="password"
                          value={password}
                        />
                      </div>
                    </label>

                    <AnimatePresence>
                      {error && (
                        <motion.p
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs font-medium text-rose-600 dark:text-rose-300"
                          role="alert"
                        >
                          {error}
                        </motion.p>
                      )}
                    </AnimatePresence>

                    <button
                      disabled={isSubmitting}
                      className={`group relative flex h-10.5 w-full items-center justify-center gap-2 overflow-hidden rounded-xl text-sm font-bold text-white shadow-lg transition-all duration-200 hover:brightness-110 active:scale-[0.99] disabled:opacity-70 ${
                        role === 'student'
                          ? 'bg-linear-to-r from-brand-600 via-brand-500 to-iris-600 shadow-brand-500/25'
                          : 'bg-linear-to-r from-emerald-600 via-brand-600 to-emerald-700 shadow-emerald-500/25'
                      }`}
                      type="submit"
                    >
                      <span>
                        {isSubmitting
                          ? 'Verifying Credentials...'
                          : `Sign In as ${role === 'student' ? 'Student' : 'Faculty'}`}
                      </span>
                      <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
                    </button>
                  </form>

                  {/* Concise Guest Mode Explorer Card */}
                  <div className={`mt-3.5 border-t pt-3 ${darkMode ? 'border-white/10' : 'border-slate-200'}`}>
                    <div className="mb-2 flex items-center justify-between">
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-700'}`}>
                        New to BMSIT? Free Explorer
                      </span>
                      <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                        Public Map
                      </span>
                    </div>

                    <button
                      className={`group relative flex w-full flex-col items-start overflow-hidden rounded-xl border-2 p-3 text-left transition-all duration-200 active:scale-[0.98] ${
                        darkMode
                          ? 'border-brand-500/40 bg-gradient-to-r from-slate-900/90 via-slate-900/70 to-brand-950/50 hover:border-brand-400 hover:shadow-lg hover:shadow-brand-500/10'
                          : 'border-brand-500/40 bg-gradient-to-r from-brand-50/90 via-white to-brand-50/70 hover:border-brand-600 hover:shadow-md'
                      }`}
                      onClick={() => enterAsGuest(null)}
                      type="button"
                    >
                      <div className="flex w-full items-center justify-between">
                        <span
                          className={`flex items-center gap-2 text-sm font-bold ${
                            darkMode ? 'text-white group-hover:text-brand-300' : 'text-brand-950 group-hover:text-brand-700'
                          }`}
                        >
                          <Compass size={16} className={`animate-spin-slow ${darkMode ? 'text-brand-400' : 'text-brand-600'}`} />
                          Explore Campus Map &amp; Search
                        </span>
                        <ArrowRight
                          size={14}
                          className={`transition-transform group-hover:translate-x-1 ${
                            darkMode ? 'text-brand-400' : 'text-brand-600'
                          }`}
                        />
                      </div>
                      <span className={`mt-1 text-xs font-medium leading-normal ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                        Search auditorium, academic blocks, department cells &amp; walking routes.
                      </span>
                    </button>
                  </div>
                </div>
              </motion.div>
          </div>
        </main>

        {/* Global Website Capabilities Marquee */}
        <footer
          className={`pointer-events-auto relative z-10 w-full border-t backdrop-blur-xl ${
            darkMode ? 'border-white/10 bg-slate-950/80' : 'border-slate-300 bg-white/90 shadow-sm'
          }`}
        >
          <div className="mx-auto flex max-w-[1360px] items-center overflow-hidden px-6 py-3 sm:px-10 lg:px-12">
            <div
              className={`flex shrink-0 items-center gap-2 pr-4 border-r text-xs font-bold uppercase tracking-wider ${
                darkMode ? 'border-white/10 text-brand-400' : 'border-slate-300 text-brand-700'
              }`}
            >
              <Sparkles size={15} className={darkMode ? 'text-brand-400' : 'text-brand-600'} />
              <span>Platform Capabilities</span>
            </div>
            <div
              className={`animate-ticker flex items-center gap-10 whitespace-nowrap pl-4 text-sm font-bold ${
                darkMode ? 'text-slate-300' : 'text-slate-800'
              }`}
            >
              {[...websiteFeaturesTicker, ...websiteFeaturesTicker].map((item, idx) => (
                <span key={idx} className="inline-flex items-center gap-2.5">
                  <MapPin size={13} className={darkMode ? 'text-brand-400' : 'text-brand-600'} />
                  <span>{item}</span>
                </span>
              ))}
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}
