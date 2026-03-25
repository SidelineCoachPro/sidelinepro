'use client'

import { useRef, useState, useEffect, useCallback, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { PLAYS } from '@/data/plays'

// ── Types ─────────────────────────────────────────────────────────────────────
type Tool = 'pen' | 'arrow' | 'line' | 'rect' | 'circle' | 'oPlayer' | 'xPlayer' | 'ball'
type CourtType = 'half' | 'full' | 'none'
type LW = 2 | 4 | 8
interface Marker { id: string; type: 'O' | 'X' | 'ball'; x: number; y: number }
interface Pt { x: number; y: number }
interface Snap { imageData: ImageData; markers: Marker[] }

const COLORS = ['#FFFFFF', '#F7620A', '#F5B731', '#0ECFB0', '#3A86FF', '#22C55E', '#FF3A5C', '#000000']
const LW_OPTIONS: LW[] = [2, 4, 8]

// ── Court drawing (module-level pure functions) ────────────────────────────────
function getCourtBounds(cw: number, ch: number, type: CourtType) {
  const isHalf = type === 'half'
  const ratio = isHalf ? 50 / 47 : 50 / 94 // width / height (ft)
  const pad = Math.min(cw, ch) * 0.05
  let w = cw - pad * 2
  let h = w / ratio
  if (h > ch - pad * 2) { h = ch - pad * 2; w = h * ratio }
  return { x: (cw - w) / 2, y: (ch - h) / 2, w, h, ft: w / 50 }
}

function drawArrowLine(
  ctx: CanvasRenderingContext2D,
  x1: number, y1: number,
  x2: number, y2: number,
  withHead: boolean,
) {
  const angle = Math.atan2(y2 - y1, x2 - x1)
  const headLen = 14
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke()
  if (withHead) {
    ctx.beginPath()
    ctx.moveTo(x2, y2)
    ctx.lineTo(x2 - headLen * Math.cos(angle - Math.PI / 6), y2 - headLen * Math.sin(angle - Math.PI / 6))
    ctx.lineTo(x2 - headLen * Math.cos(angle + Math.PI / 6), y2 - headLen * Math.sin(angle + Math.PI / 6))
    ctx.closePath()
    ctx.fillStyle = ctx.strokeStyle as string
    ctx.fill()
  }
}

function drawHalfEnd(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number, cw: number, ch: number,
  ft: number, side: 'top' | 'bottom',
) {
  const dir = side === 'top' ? 1 : -1
  const baseY = side === 'top' ? cy : cy + ch
  const midX = cx + cw / 2
  const basketX = midX
  const basketY = baseY + dir * ft * 5.25

  // Key
  const keyW = ft * 16; const keyH = ft * 19; const keyX = midX - keyW / 2
  const keyY = side === 'top' ? cy : cy + ch - keyH
  ctx.strokeRect(keyX, keyY, keyW, keyH)

  // FT line
  const ftLineY = basketY + dir * ft * 15
  ctx.beginPath(); ctx.moveTo(keyX, ftLineY); ctx.lineTo(keyX + keyW, ftLineY); ctx.stroke()

  // FT circle
  ctx.beginPath(); ctx.arc(midX, ftLineY, ft * 6, 0, Math.PI * 2); ctx.stroke()

  // 3pt arc
  const r3 = ft * 23.75
  const c3L = cx + ft * 3; const c3R = cx + cw - ft * 3
  const hDist = midX - c3L
  const vDist = Math.sqrt(Math.max(0, r3 * r3 - hDist * hDist))
  const arcY = basketY + dir * vDist

  ctx.beginPath(); ctx.moveTo(c3L, baseY); ctx.lineTo(c3L, arcY); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(c3R, baseY); ctx.lineTo(c3R, arcY); ctx.stroke()

  const aL = Math.atan2(arcY - basketY, c3L - basketX)
  const aR = Math.atan2(arcY - basketY, c3R - basketX)
  ctx.beginPath()
  ctx.arc(basketX, basketY, r3, side === 'top' ? aR : aL, side === 'top' ? aL : aR, false)
  ctx.stroke()

  // Backboard
  ctx.beginPath()
  ctx.moveTo(basketX - ft * 3, baseY + dir * ft * 4)
  ctx.lineTo(basketX + ft * 3, baseY + dir * ft * 4)
  ctx.stroke()

  // Rim
  ctx.beginPath(); ctx.arc(basketX, basketY, ft * 1.5, 0, Math.PI * 2); ctx.stroke()
}

function drawCourt(ctx: CanvasRenderingContext2D, cw: number, ch: number, type: CourtType) {
  if (type === 'none') return
  const { x, y, w, h, ft } = getCourtBounds(cw, ch, type)

  // Floor
  ctx.fillStyle = '#C8823A'; ctx.fillRect(x, y, w, h)
  ctx.fillStyle = '#BF7A34'
  for (let sx = 0; sx < w; sx += 28) ctx.fillRect(x + sx, y, 14, h)

  // Lines
  ctx.strokeStyle = 'rgba(255,255,255,0.82)'; ctx.lineWidth = 2
  ctx.lineCap = 'square'; ctx.lineJoin = 'miter'
  ctx.strokeRect(x, y, w, h)

  if (type === 'half') {
    drawHalfEnd(ctx, x, y, w, h, ft, 'top')
    ctx.beginPath(); ctx.arc(x + w / 2, y + h, ft * 6, Math.PI, 0); ctx.stroke()
  } else {
    // Center line
    ctx.beginPath(); ctx.moveTo(x, y + h / 2); ctx.lineTo(x + w, y + h / 2); ctx.stroke()
    ctx.beginPath(); ctx.arc(x + w / 2, y + h / 2, ft * 6, 0, Math.PI * 2); ctx.stroke()
    drawHalfEnd(ctx, x, y, w, h / 2, ft, 'top')
    drawHalfEnd(ctx, x, y + h / 2, w, h / 2, ft, 'bottom')
  }
}

function drawMarker(ctx: CanvasRenderingContext2D, type: 'O' | 'X' | 'ball', x: number, y: number) {
  if (type === 'ball') {
    ctx.beginPath(); ctx.arc(x, y, 10, 0, Math.PI * 2)
    ctx.fillStyle = '#F7620A'; ctx.fill()
    ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = 1
    ctx.beginPath(); ctx.arc(x, y, 10, 0, Math.PI * 2); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(x - 10, y); ctx.lineTo(x + 10, y); ctx.stroke()
    ctx.beginPath(); ctx.arc(x, y, 10, -Math.PI / 5, Math.PI / 5); ctx.stroke()
    ctx.beginPath(); ctx.arc(x, y, 10, Math.PI * 4 / 5, Math.PI * 6 / 5); ctx.stroke()
  } else {
    ctx.beginPath(); ctx.arc(x, y, 14, 0, Math.PI * 2)
    ctx.fillStyle = type === 'O' ? '#3A86FF' : '#FF3A5C'; ctx.fill()
    ctx.font = 'bold 13px system-ui'; ctx.fillStyle = '#fff'
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
    ctx.fillText(type, x, y)
  }
}

function getCursor(tool: Tool): string {
  if (tool === 'oPlayer' || tool === 'xPlayer' || tool === 'ball') return 'copy'
  return 'crosshair'
}

// ── Main Component ────────────────────────────────────────────────────────────
function WhiteboardInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const playId = searchParams.get('playId')
  const fromPractice = searchParams.get('from') === 'practice'
  const fromPracticePlanId = searchParams.get('planId')

  // Three canvas refs: court (bottom) / drawings (middle) / overlay (top)
  const courtRef    = useRef<HTMLCanvasElement>(null)
  const drawRef     = useRef<HTMLCanvasElement>(null)
  const overlayRef  = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // History stacks
  const historyRef = useRef<Snap[]>([])
  const redoRef    = useRef<Snap[]>([])

  // Drawing state refs (avoid stale closures in event handlers)
  const toolRef         = useRef<Tool>('pen')
  const colorRef        = useRef('#FFFFFF')
  const lwRef           = useRef<LW>(2)
  const isDrawingRef    = useRef(false)
  const pointsRef       = useRef<Pt[]>([])
  const previewStartRef = useRef<Pt | null>(null)
  const arrowStartRef   = useRef<Pt | null>(null)
  const dragMarkerRef   = useRef<string | null>(null)
  const markersRef      = useRef<Marker[]>([])
  const courtTypeRef    = useRef<CourtType>('half')

  // React state (for UI rendering only)
  const [tool, setToolState]            = useState<Tool>('pen')
  const [color, setColorState]          = useState('#FFFFFF')
  const [lw, setLwState]                = useState<LW>(2)
  const [courtType, setCourtTypeState]  = useState<CourtType>('half')
  const [, setMarkers]                  = useState<Marker[]>([])
  const [arrowPhase, setArrowPhase]     = useState<'start' | 'end'>('start')
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [playBanner, setPlayBanner]     = useState<string | null>(null)
  const [isMobile, setIsMobile]         = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  // ── Setters (sync refs + state) ────────────────────────────────────────────
  function setTool(t: Tool) {
    setToolState(t); toolRef.current = t
    arrowStartRef.current = null
    setArrowPhase('start')
    redrawOverlay()
  }
  function setColor(c: string) { setColorState(c); colorRef.current = c }
  function setLw(w: LW) { setLwState(w); lwRef.current = w }
  function setCourtType(ct: CourtType) {
    setCourtTypeState(ct); courtTypeRef.current = ct
    const canvas = courtRef.current; if (!canvas) return
    const ctx = canvas.getContext('2d'); if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    drawCourt(ctx, canvas.width, canvas.height, ct)
  }

  // ── Canvas sizing ──────────────────────────────────────────────────────────
  const resizeCanvases = useCallback(() => {
    const container = containerRef.current
    if (!container) return
    const { width: w, height: h } = container.getBoundingClientRect()
    ;[courtRef, drawRef, overlayRef].forEach(ref => {
      if (ref.current) { ref.current.width = w; ref.current.height = h }
    })
    // Redraw court
    const cCtx = courtRef.current?.getContext('2d')
    if (cCtx) drawCourt(cCtx, w, h, courtTypeRef.current)
    redrawOverlay()
  }, [])

  useEffect(() => {
    resizeCanvases()
    window.addEventListener('resize', resizeCanvases)
    return () => window.removeEventListener('resize', resizeCanvases)
  }, [resizeCanvases])

  // ── Overlay redraw ─────────────────────────────────────────────────────────
  function redrawOverlay(opts?: {
    dragId?: string; dragX?: number; dragY?: number
    previewFn?: (ctx: CanvasRenderingContext2D) => void
  }) {
    const canvas = overlayRef.current; if (!canvas) return
    const ctx = canvas.getContext('2d'); if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    // Draw markers
    for (const m of markersRef.current) {
      const mx = opts?.dragId === m.id && opts.dragX !== undefined ? opts.dragX : m.x
      const my = opts?.dragId === m.id && opts.dragY !== undefined ? opts.dragY : m.y
      drawMarker(ctx, m.type, mx, my)
    }
    // Arrow start dot
    if (arrowStartRef.current) {
      const { x, y } = arrowStartRef.current
      ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2)
      ctx.fillStyle = colorRef.current; ctx.fill()
    }
    opts?.previewFn?.(ctx)
  }

  // ── History ────────────────────────────────────────────────────────────────
  function pushHistory() {
    const canvas = drawRef.current; if (!canvas) return
    const ctx = canvas.getContext('2d'); if (!ctx) return
    try {
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      historyRef.current = [...historyRef.current.slice(-19), { imageData, markers: [...markersRef.current] }]
      redoRef.current = []
    } catch { /* security error on 0-size canvas */ }
  }

  function undo() {
    if (historyRef.current.length === 0) return
    const canvas = drawRef.current; if (!canvas) return
    const ctx = canvas.getContext('2d'); if (!ctx) return
    try {
      const cur = ctx.getImageData(0, 0, canvas.width, canvas.height)
      redoRef.current = [...redoRef.current, { imageData: cur, markers: [...markersRef.current] }]
    } catch {}
    const prev = historyRef.current[historyRef.current.length - 1]
    historyRef.current = historyRef.current.slice(0, -1)
    ctx.putImageData(prev.imageData, 0, 0)
    markersRef.current = prev.markers; setMarkers(prev.markers); redrawOverlay()
  }

  function redo() {
    if (redoRef.current.length === 0) return
    const canvas = drawRef.current; if (!canvas) return
    const ctx = canvas.getContext('2d'); if (!ctx) return
    try {
      const cur = ctx.getImageData(0, 0, canvas.width, canvas.height)
      historyRef.current = [...historyRef.current, { imageData: cur, markers: [...markersRef.current] }]
    } catch {}
    const next = redoRef.current[redoRef.current.length - 1]
    redoRef.current = redoRef.current.slice(0, -1)
    ctx.putImageData(next.imageData, 0, 0)
    markersRef.current = next.markers; setMarkers(next.markers); redrawOverlay()
  }

  function clearAll() {
    pushHistory()
    const draw = drawRef.current; if (!draw) return
    draw.getContext('2d')?.clearRect(0, 0, draw.width, draw.height)
    markersRef.current = []; setMarkers([])
    const court = courtRef.current; if (!court) return
    const ctx = court.getContext('2d'); if (!ctx) return
    ctx.clearRect(0, 0, court.width, court.height)
    drawCourt(ctx, court.width, court.height, courtTypeRef.current)
    redrawOverlay()
  }

  // ── Event helpers ──────────────────────────────────────────────────────────
  function getPos(e: MouseEvent | Touch): Pt {
    const canvas = overlayRef.current; if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  function findMarker(x: number, y: number): string | null {
    for (const m of markersRef.current) {
      const r = m.type === 'ball' ? 14 : 18
      if ((m.x - x) ** 2 + (m.y - y) ** 2 <= r * r) return m.id
    }
    return null
  }

  // ── Mouse/touch event handlers ─────────────────────────────────────────────
  useEffect(() => {
    const overlay = overlayRef.current; if (!overlay) return
    let rafId = 0

    function onDown(x: number, y: number) {
      const t = toolRef.current
      // Marker drag
      const mId = findMarker(x, y)
      if (mId) { dragMarkerRef.current = mId; return }

      // Place marker
      if (t === 'oPlayer' || t === 'xPlayer' || t === 'ball') {
        pushHistory()
        const m: Marker = {
          id: `m-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          type: t === 'oPlayer' ? 'O' : t === 'xPlayer' ? 'X' : 'ball',
          x, y,
        }
        markersRef.current = [...markersRef.current, m]
        setMarkers(markersRef.current); redrawOverlay(); return
      }

      // Arrow / line: two-click mode
      if (t === 'arrow' || t === 'line') {
        if (!arrowStartRef.current) {
          arrowStartRef.current = { x, y }; setArrowPhase('end'); redrawOverlay(); return
        }
        const start = arrowStartRef.current
        pushHistory()
        const draw = drawRef.current; if (!draw) return
        const ctx = draw.getContext('2d'); if (!ctx) return
        ctx.strokeStyle = colorRef.current; ctx.lineWidth = lwRef.current
        ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.setLineDash([])
        drawArrowLine(ctx, start.x, start.y, x, y, t === 'arrow')
        arrowStartRef.current = null; setArrowPhase('start'); redrawOverlay(); return
      }

      // Pen / rect / circle
      isDrawingRef.current = true; previewStartRef.current = { x, y }
      pointsRef.current = [{ x, y }]
      if (t === 'pen') {
        const draw = drawRef.current; if (!draw) return
        const ctx = draw.getContext('2d'); if (!ctx) return
        ctx.strokeStyle = colorRef.current; ctx.lineWidth = lwRef.current
        ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.setLineDash([])
        ctx.beginPath(); ctx.moveTo(x, y)
      }
    }

    function onMove(x: number, y: number) {
      if (dragMarkerRef.current) {
        redrawOverlay({ dragId: dragMarkerRef.current, dragX: x, dragY: y }); return
      }
      if (!isDrawingRef.current) {
        // Arrow live preview
        if (arrowStartRef.current) {
          const s = arrowStartRef.current
          redrawOverlay({ previewFn: ctx => {
            ctx.strokeStyle = colorRef.current; ctx.lineWidth = lwRef.current
            ctx.lineCap = 'round'; ctx.setLineDash([])
            drawArrowLine(ctx, s.x, s.y, x, y, toolRef.current === 'arrow')
          }})
        }
        return
      }
      const t = toolRef.current
      if (t === 'pen') {
        pointsRef.current.push({ x, y })
        cancelAnimationFrame(rafId)
        rafId = requestAnimationFrame(() => {
          const pts = pointsRef.current; if (pts.length < 2) return
          const draw = drawRef.current; if (!draw) return
          const ctx = draw.getContext('2d'); if (!ctx) return
          const last = pts[pts.length - 2]; const curr = pts[pts.length - 1]
          const cpx = (last.x + curr.x) / 2; const cpy = (last.y + curr.y) / 2
          ctx.strokeStyle = colorRef.current; ctx.lineWidth = lwRef.current
          ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.setLineDash([])
          ctx.beginPath(); ctx.moveTo(last.x, last.y)
          ctx.quadraticCurveTo(last.x, last.y, cpx, cpy); ctx.stroke()
        })
      } else {
        const s = previewStartRef.current!
        redrawOverlay({ previewFn: ctx => {
          ctx.strokeStyle = colorRef.current; ctx.lineWidth = lwRef.current
          ctx.lineCap = 'round'; ctx.setLineDash([4, 4])
          if (t === 'rect') {
            ctx.strokeRect(s.x, s.y, x - s.x, y - s.y)
          } else if (t === 'circle') {
            const rx = Math.abs(x - s.x) / 2; const ry = Math.abs(y - s.y) / 2
            ctx.beginPath()
            ctx.ellipse(s.x + (x - s.x) / 2, s.y + (y - s.y) / 2, Math.max(1, rx), Math.max(1, ry), 0, 0, Math.PI * 2)
            ctx.stroke()
          }
          ctx.setLineDash([])
        }})
      }
    }

    function onUp(x: number, y: number) {
      if (dragMarkerRef.current) {
        pushHistory()
        markersRef.current = markersRef.current.map(m =>
          m.id === dragMarkerRef.current ? { ...m, x, y } : m
        )
        setMarkers(markersRef.current); dragMarkerRef.current = null; redrawOverlay(); return
      }
      if (!isDrawingRef.current) return
      isDrawingRef.current = false; cancelAnimationFrame(rafId)
      const t = toolRef.current; const s = previewStartRef.current
      if (!s) return
      const draw = drawRef.current; if (!draw) return
      const ctx = draw.getContext('2d'); if (!ctx) return
      if (t === 'pen') {
        pushHistory()
      } else if (t === 'rect') {
        pushHistory()
        ctx.strokeStyle = colorRef.current; ctx.lineWidth = lwRef.current
        ctx.lineCap = 'square'; ctx.setLineDash([])
        ctx.strokeRect(s.x, s.y, x - s.x, y - s.y)
      } else if (t === 'circle') {
        pushHistory()
        const rx = Math.abs(x - s.x) / 2; const ry = Math.abs(y - s.y) / 2
        ctx.strokeStyle = colorRef.current; ctx.lineWidth = lwRef.current; ctx.setLineDash([])
        ctx.beginPath()
        ctx.ellipse(s.x + (x - s.x) / 2, s.y + (y - s.y) / 2, Math.max(1, rx), Math.max(1, ry), 0, 0, Math.PI * 2)
        ctx.stroke()
      }
      previewStartRef.current = null; redrawOverlay()
    }

    function md(e: MouseEvent) { if (e.button === 0) { const p = getPos(e); onDown(p.x, p.y) } }
    function mm(e: MouseEvent) { const p = getPos(e); onMove(p.x, p.y) }
    function mu(e: MouseEvent) { const p = getPos(e); onUp(p.x, p.y) }
    function ts(e: TouchEvent) {
      if (e.touches.length > 1) return; e.preventDefault()
      const p = getPos(e.touches[0]); onDown(p.x, p.y)
    }
    function tm(e: TouchEvent) {
      if (e.touches.length > 1) return; e.preventDefault()
      const p = getPos(e.touches[0]); onMove(p.x, p.y)
    }
    function te(e: TouchEvent) {
      e.preventDefault(); const p = getPos(e.changedTouches[0]); onUp(p.x, p.y)
    }

    overlay.addEventListener('mousedown', md)
    overlay.addEventListener('mousemove', mm)
    overlay.addEventListener('mouseup', mu)
    overlay.addEventListener('touchstart', ts, { passive: false })
    overlay.addEventListener('touchmove', tm, { passive: false })
    overlay.addEventListener('touchend', te, { passive: false })
    return () => {
      overlay.removeEventListener('mousedown', md)
      overlay.removeEventListener('mousemove', mm)
      overlay.removeEventListener('mouseup', mu)
      overlay.removeEventListener('touchstart', ts)
      overlay.removeEventListener('touchmove', tm)
      overlay.removeEventListener('touchend', te)
    }
  }, []) // mount once — handlers use refs for current values

  // ── Keyboard shortcuts ─────────────────────────────────────────────────────
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'z') { e.preventDefault(); redo(); return }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); undo(); return }
      const map: Record<string, Tool> = { p: 'pen', a: 'arrow', l: 'line', r: 'rect', c: 'circle', o: 'oPlayer', x: 'xPlayer', b: 'ball' }
      const t = map[e.key.toLowerCase()]
      if (t) { setTool(t); return }
      if (e.key === 'Escape') { arrowStartRef.current = null; setArrowPhase('start'); redrawOverlay() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // ── Play diagram loader ────────────────────────────────────────────────────
  useEffect(() => {
    if (!playId) return
    const play = PLAYS.find(p => p.id === playId); if (!play) return
    const timer = setTimeout(() => {
      setCourtType('half')
      const court = courtRef.current; const draw = drawRef.current
      if (!court || !draw) return
      const w = court.width; const h = court.height
      if (!w || !h) return
      // Draw court
      const cCtx = court.getContext('2d')!
      cCtx.clearRect(0, 0, w, h); drawCourt(cCtx, w, h, 'half')
      // Draw movement arrows on drawings canvas
      const dCtx = draw.getContext('2d')!
      const bounds = getCourtBounds(w, h, 'half')
      dCtx.lineCap = 'round'
      for (const agent of play.agents) {
        const sx = bounds.x + agent.startX * bounds.w; const sy = bounds.y + agent.startY * bounds.h
        const ex = bounds.x + agent.endX * bounds.w;   const ey = bounds.y + agent.endY * bounds.h
        if (Math.abs(sx - ex) > 2 || Math.abs(sy - ey) > 2) {
          dCtx.strokeStyle = agent.isDefender ? '#FF3A5C' : '#3A86FF'
          dCtx.lineWidth = 2; dCtx.setLineDash([6, 4])
          drawArrowLine(dCtx, sx, sy, ex, ey, true)
        }
      }
      // Ball path
      const bsx = bounds.x + play.ballStartX * bounds.w; const bsy = bounds.y + play.ballStartY * bounds.h
      const bex = bounds.x + play.ballEndX * bounds.w;   const bey = bounds.y + play.ballEndY * bounds.h
      if (Math.abs(bsx - bex) > 2 || Math.abs(bsy - bey) > 2) {
        dCtx.strokeStyle = '#F7620A'; dCtx.lineWidth = 2; dCtx.setLineDash([])
        drawArrowLine(dCtx, bsx, bsy, bex, bey, true)
      }
      dCtx.setLineDash([])
      // Place markers at start positions
      const newMarkers: Marker[] = play.agents.map((agent, i) => ({
        id: `play-${agent.id}-${i}`, type: agent.isDefender ? 'X' : 'O',
        x: bounds.x + agent.startX * bounds.w, y: bounds.y + agent.startY * bounds.h,
      }))
      markersRef.current = newMarkers; setMarkers(newMarkers); redrawOverlay()
      setPlayBanner(`📋 ${play.name} — loaded from practice plan`)
    }, 150)
    return () => clearTimeout(timer)
  }, [playId])

  // ── Toolbar definition ─────────────────────────────────────────────────────
  const toolGroups = [
    {
      tools: [
        { id: 'pen' as Tool, key: 'P', title: 'Pen (P)', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg> },
        { id: 'arrow' as Tool, key: 'A', title: 'Arrow (A)', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg> },
        { id: 'line' as Tool, key: 'L', title: 'Line (L)', icon: <svg viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className="w-5 h-5"><line x1="4" y1="20" x2="20" y2="4" strokeLinecap="round"/></svg> },
        { id: 'rect' as Tool, key: 'R', title: 'Rectangle (R)', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5"><rect x="3" y="5" width="18" height="14" rx="1"/></svg> },
        { id: 'circle' as Tool, key: 'C', title: 'Circle (C)', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5"><ellipse cx="12" cy="12" rx="9" ry="6"/></svg> },
      ],
    },
    {
      tools: [
        { id: 'oPlayer' as Tool, key: 'O', title: 'Offense (O)', icon: <span className="text-sm font-bold" style={{ color: '#3A86FF' }}>O</span> },
        { id: 'xPlayer' as Tool, key: 'X', title: 'Defense (X)', icon: <span className="text-sm font-bold" style={{ color: '#FF3A5C' }}>X</span> },
        { id: 'ball' as Tool, key: 'B', title: 'Ball (B)', icon: <span className="text-base leading-none">🏀</span> },
      ],
    },
  ]

  const TB = isMobile ? 'flex-row' : 'flex-col'
  const DIV = isMobile
    ? { width: 1, backgroundColor: 'rgba(241,245,249,0.1)', margin: '0 2px', alignSelf: 'stretch' }
    : { height: 1, backgroundColor: 'rgba(241,245,249,0.1)', margin: '2px 0', width: '100%' }
  const toolbarPos = isMobile
    ? { bottom: 12, left: '50%', transform: 'translateX(-50%)' }
    : { left: 12, top: '50%', transform: 'translateY(-50%)' }

  return (
    <div ref={containerRef} className="fixed left-0 right-0 bottom-0" style={{ top: 64, zIndex: 40 }}>
      {/* Court canvas (bottom) */}
      <canvas ref={courtRef} className="absolute inset-0" />
      {/* Drawings canvas (middle) */}
      <canvas ref={drawRef} className="absolute inset-0" />
      {/* Overlay canvas (top — receives all pointer events) */}
      <canvas
        ref={overlayRef}
        className="absolute inset-0"
        style={{ touchAction: 'none', cursor: getCursor(tool) }}
      />

      {/* Play banner */}
      {playBanner && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium z-10 whitespace-nowrap"
          style={{ backgroundColor: 'rgba(14,21,32,0.95)', border: '1px solid rgba(58,134,255,0.35)', color: '#F1F5F9' }}>
          {playBanner}
          <button onClick={() => setPlayBanner(null)} style={{ color: 'rgba(241,245,249,0.4)' }}>✕</button>
        </div>
      )}

      {/* Back to practice */}
      {fromPractice && (
        <button
          onClick={() => router.push(fromPracticePlanId ? `/practice/run?id=${fromPracticePlanId}` : '/practice')}
          className="absolute top-3 left-3 flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium z-10"
          style={{ backgroundColor: 'rgba(14,21,32,0.95)', border: '1px solid rgba(241,245,249,0.15)', color: 'rgba(241,245,249,0.75)' }}
        >
          ← Back to Practice
        </button>
      )}

      {/* Court type pills (top right) */}
      <div className="absolute top-3 right-3 flex items-center gap-0.5 p-1 rounded-xl z-10"
        style={{ backgroundColor: 'rgba(14,21,32,0.95)', border: '1px solid rgba(241,245,249,0.13)' }}>
        {(['half', 'full', 'none'] as CourtType[]).map(ct => (
          <button key={ct} onClick={() => setCourtType(ct)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={{ backgroundColor: courtType === ct ? '#F7620A' : 'transparent', color: courtType === ct ? '#fff' : 'rgba(241,245,249,0.45)' }}>
            {ct === 'half' ? '½ Court' : ct === 'full' ? 'Full' : 'None'}
          </button>
        ))}
      </div>

      {/* Floating toolbar */}
      <div className={`absolute flex ${TB} z-10`}
        style={{ ...toolbarPos, backgroundColor: 'rgba(14,21,32,0.95)', border: '1px solid rgba(241,245,249,0.13)', borderRadius: 12, padding: 8, gap: 4 }}>

        {toolGroups.map((group, gi) => (
          <div key={gi} className={`flex ${TB} gap-1`}>
            {gi > 0 && <div style={DIV} />}
            {group.tools.map(t => (
              <button key={t.id} onClick={() => setTool(t.id)} title={t.title}
                className="w-9 h-9 flex items-center justify-center rounded-lg transition-all"
                style={{ backgroundColor: tool === t.id ? '#F7620A' : 'transparent', color: tool === t.id ? '#fff' : 'rgba(241,245,249,0.55)' }}>
                {t.icon}
              </button>
            ))}
          </div>
        ))}

        <div style={DIV} />

        {/* Undo / Redo */}
        <button onClick={undo} title="Undo (Ctrl+Z)" className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-white/10" style={{ color: 'rgba(241,245,249,0.55)' }}>
          <span className="text-base">↩</span>
        </button>
        <button onClick={redo} title="Redo (Ctrl+Shift+Z)" className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-white/10" style={{ color: 'rgba(241,245,249,0.55)' }}>
          <span className="text-base">↪</span>
        </button>

        <div style={DIV} />

        {/* Clear All */}
        <button onClick={clearAll} title="Clear All"
          className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-red-500/20" style={{ color: 'rgba(241,245,249,0.45)' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>

        <div style={DIV} />

        {/* Color picker */}
        <div className="relative">
          <button onClick={() => setShowColorPicker(v => !v)} title="Color"
            className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-white/10">
            <div className="w-5 h-5 rounded-full border-2" style={{ backgroundColor: color, borderColor: 'rgba(241,245,249,0.35)' }} />
          </button>
          {showColorPicker && (
            <div className={`absolute ${isMobile ? 'bottom-11 left-0' : 'left-11 top-0'} grid grid-cols-4 gap-1.5 p-2 rounded-xl z-20`}
              style={{ backgroundColor: 'rgba(14,21,32,0.98)', border: '1px solid rgba(241,245,249,0.15)', width: 122 }}>
              {COLORS.map(c => (
                <button key={c} onClick={() => { setColor(c); setShowColorPicker(false) }}
                  className="w-6 h-6 rounded-full"
                  style={{ backgroundColor: c, border: c === '#FFFFFF' ? '1px solid rgba(241,245,249,0.3)' : 'none', boxShadow: color === c ? `0 0 0 2px rgba(14,21,32,1), 0 0 0 3.5px ${c}` : 'none' }} />
              ))}
            </div>
          )}
        </div>

        {/* Line width */}
        {LW_OPTIONS.map(w => (
          <button key={w} onClick={() => setLw(w)} title={`${w}px`}
            className="w-9 h-9 flex items-center justify-center rounded-lg"
            style={{ backgroundColor: lw === w ? 'rgba(241,245,249,0.1)' : 'transparent' }}>
            <div className="rounded-full"
              style={{ width: w === 2 ? 18 : w === 4 ? 22 : 26, height: w, backgroundColor: lw === w ? '#F1F5F9' : 'rgba(241,245,249,0.35)' }} />
          </button>
        ))}
      </div>

      {/* Arrow / line phase hint */}
      {arrowPhase === 'end' && (
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 px-4 py-2 rounded-xl text-xs font-medium z-10 whitespace-nowrap"
          style={{ backgroundColor: 'rgba(14,21,32,0.95)', border: '1px solid rgba(241,245,249,0.13)', color: 'rgba(241,245,249,0.6)' }}>
          Click to place end point · Esc to cancel
        </div>
      )}
    </div>
  )
}

export default function WhiteboardPage() {
  return (
    <Suspense>
      <WhiteboardInner />
    </Suspense>
  )
}
