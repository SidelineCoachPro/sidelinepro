'use client'

import { type PlayAgent } from '@/data/plays'

interface Props {
  agents: PlayAgent[]
  ballStartX: number
  ballStartY: number
  ballEndX: number
  ballEndY: number
  width?: number
  height?: number
  showMovement?: boolean
}

export default function PlayDiagram({
  agents,
  ballStartX,
  ballStartY,
  ballEndX,
  ballEndY,
  width = 280,
  height = 180,
  showMovement = true,
}: Props) {
  const w = width
  const h = height

  // Court geometry (normalized → pixels)
  const px = (x: number) => x * w
  const py = (y: number) => y * h

  // Key dimensions
  const paintLeft  = px(0.37)
  const paintRight = px(0.63)
  const paintBottom = py(0.36)
  const basketX  = px(0.5)
  const basketY  = py(0.085)
  const ftY      = py(0.36)

  // Agent circle radius
  const R = Math.max(10, w * 0.038)
  const fontSize = Math.max(8, R * 0.75)

  // Colors
  const offenseColor  = '#3A86FF'
  const defenseColor  = '#FF3A5C'
  const ballColor     = '#F7620A'
  const courtBg       = '#1A2535'
  const lineColor     = 'rgba(255,255,255,0.15)'
  const paintFill     = 'rgba(255,255,255,0.04)'

  // Three-point arc path (approximate half court)
  const arcTopX   = px(0.5)
  const arcTopY   = py(0.5)
  const arcLeft   = px(0.04)
  const arcRight  = px(0.96)
  const arcSideY  = py(0.72)
  const threePtPath = `M ${arcLeft} ${arcSideY} Q ${arcLeft - 4} ${arcTopY} ${arcTopX} ${arcTopY} Q ${arcRight + 4} ${arcTopY} ${arcRight} ${arcSideY}`

  // Arrow marker ID (unique per diagram instance)
  const markerId      = `arr-${Math.random().toString(36).slice(2, 7)}`
  const ballMarkerId  = `barr-${Math.random().toString(36).slice(2, 7)}`

  function arrowPath(x1: number, y1: number, x2: number, y2: number, r: number) {
    // Shorten path so arrow head doesn't overlap the circle
    const dx = x2 - x1
    const dy = y2 - y1
    const dist = Math.sqrt(dx * dx + dy * dy)
    if (dist < r * 2.5) return null
    const ux = dx / dist
    const uy = dy / dist
    const sx = x1 + ux * r
    const sy = y1 + uy * r
    const ex = x2 - ux * (r + 3)
    const ey = y2 - uy * (r + 3)
    return `M ${sx} ${sy} L ${ex} ${ey}`
  }

  const ballMoved = Math.abs(ballEndX - ballStartX) > 0.02 || Math.abs(ballEndY - ballStartY) > 0.02

  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      style={{ display: 'block', borderRadius: 8, flexShrink: 0 }}
    >
      <defs>
        {/* Player movement arrow */}
        <marker id={markerId} markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill="rgba(241,245,249,0.5)" />
        </marker>
        {/* Ball arrow */}
        <marker id={ballMarkerId} markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill={ballColor} />
        </marker>
      </defs>

      {/* Court background */}
      <rect x={0} y={0} width={w} height={h} fill={courtBg} rx={8} />

      {/* Court border */}
      <rect x={2} y={2} width={w - 4} height={h - 4} fill="none" stroke={lineColor} strokeWidth={1} rx={7} />

      {/* Half-court line */}
      <line x1={2} y1={h - 2} x2={w - 2} y2={h - 2} stroke={lineColor} strokeWidth={1} />

      {/* Paint */}
      <rect
        x={paintLeft}
        y={0}
        width={paintRight - paintLeft}
        height={paintBottom}
        fill={paintFill}
        stroke={lineColor}
        strokeWidth={1}
      />

      {/* Free throw arc (small semi-circle above ft line) */}
      <path
        d={`M ${paintLeft} ${ftY} A ${(paintRight - paintLeft) / 2} ${(paintRight - paintLeft) / 2} 0 0 0 ${paintRight} ${ftY}`}
        fill="none"
        stroke={lineColor}
        strokeWidth={1}
      />

      {/* Three-point arc */}
      <path d={threePtPath} fill="none" stroke={lineColor} strokeWidth={1} strokeLinecap="round" />

      {/* Straight three-point side lines */}
      <line x1={arcLeft} y1={arcSideY} x2={arcLeft} y2={h - 2} stroke={lineColor} strokeWidth={1} />
      <line x1={arcRight} y1={arcSideY} x2={arcRight} y2={h - 2} stroke={lineColor} strokeWidth={1} />

      {/* Backboard */}
      <line
        x1={basketX - w * 0.07}
        y1={py(0.04)}
        x2={basketX + w * 0.07}
        y2={py(0.04)}
        stroke={lineColor}
        strokeWidth={1.5}
      />

      {/* Basket */}
      <circle cx={basketX} cy={basketY} r={w * 0.025} fill="none" stroke={lineColor} strokeWidth={1.5} />

      {/* ── Movement arrows ────────────────────────────────── */}
      {showMovement && agents.map(agent => {
        const moved = Math.abs(agent.endX - agent.startX) > 0.02 || Math.abs(agent.endY - agent.startY) > 0.02
        if (!moved) return null
        const path = arrowPath(px(agent.startX), py(agent.startY), px(agent.endX), py(agent.endY), R)
        if (!path) return null
        return (
          <path
            key={`arrow-${agent.id}`}
            d={path}
            fill="none"
            stroke="rgba(241,245,249,0.45)"
            strokeWidth={1.5}
            strokeDasharray="4 3"
            markerEnd={`url(#${markerId})`}
          />
        )
      })}

      {/* Ball movement arrow */}
      {showMovement && ballMoved && (() => {
        const path = arrowPath(px(ballStartX), py(ballStartY), px(ballEndX), py(ballEndY), R * 0.6)
        if (!path) return null
        return (
          <path
            d={path}
            fill="none"
            stroke={ballColor}
            strokeWidth={2}
            markerEnd={`url(#${ballMarkerId})`}
          />
        )
      })()}

      {/* ── Agent circles (end positions drawn as ghost) ──────── */}
      {agents.map(agent => {
        const moved = Math.abs(agent.endX - agent.startX) > 0.02 || Math.abs(agent.endY - agent.startY) > 0.02
        const fill  = agent.isDefender ? defenseColor : offenseColor

        return (
          <g key={agent.id}>
            {/* Ghost end position */}
            {showMovement && moved && (
              <circle
                cx={px(agent.endX)}
                cy={py(agent.endY)}
                r={R}
                fill={`${fill}30`}
                stroke={`${fill}60`}
                strokeWidth={1}
                strokeDasharray="3 2"
              />
            )}
            {/* Start position */}
            <circle
              cx={px(agent.startX)}
              cy={py(agent.startY)}
              r={R}
              fill={fill}
              stroke={agent.isDefender ? '#FF6B84' : '#60A5FA'}
              strokeWidth={1.5}
            />
            <text
              x={px(agent.startX)}
              y={py(agent.startY) + fontSize * 0.37}
              textAnchor="middle"
              fontSize={fontSize}
              fontWeight="700"
              fill="#fff"
              style={{ userSelect: 'none', fontFamily: 'system-ui, sans-serif' }}
            >
              {agent.label}
            </text>
          </g>
        )
      })}

      {/* ── Ball ───────────────────────────────────────────── */}
      <circle
        cx={px(ballStartX)}
        cy={py(ballStartY)}
        r={R * 0.5}
        fill={ballColor}
        stroke="#FF9B5C"
        strokeWidth={1}
      />
    </svg>
  )
}
