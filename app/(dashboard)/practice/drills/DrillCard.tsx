'use client'

import { Barlow_Condensed } from 'next/font/google'
import type { Drill } from '@/data/drills'

const barlow = Barlow_Condensed({ subsets: ['latin'], weight: ['600', '700'] })

interface Props {
  drill: Drill
  onAdd?: (drill: Drill) => void
}

export default function DrillCard({ drill, onAdd }: Props) {
  const tags = [
    { icon: '⏱', label: `${drill.durationMins} min` },
    { icon: '👥', label: drill.playersNeeded },
    { icon: '📊', label: drill.level },
  ]

  return (
    <div className="drill-card flex flex-col rounded-xl overflow-hidden" style={{ backgroundColor: '#0E1520' }}>
      {/* Category color bar */}
      <div style={{ height: 4, backgroundColor: drill.categoryColor, flexShrink: 0 }} />

      <div className="flex flex-col flex-1 p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div>
            <span
              className="text-xs font-semibold uppercase tracking-wider"
              style={{ color: drill.categoryColor }}
            >
              {drill.category === 'ballhandling' ? 'Ball Handling' : drill.category.charAt(0).toUpperCase() + drill.category.slice(1)}
            </span>
            {drill.isCustom && (
              <span
                className="ml-2 text-xs font-medium px-1.5 py-0.5 rounded"
                style={{ backgroundColor: 'rgba(139,92,246,0.15)', color: '#8B5CF6' }}
              >
                My Drill
              </span>
            )}
          </div>
        </div>

        <h3
          className={`text-xl leading-tight mb-3 text-sp-text ${barlow.className}`}
          style={{ fontWeight: 700 }}
        >
          {drill.name}
        </h3>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {tags.map(({ icon, label }) => (
            <span
              key={label}
              className="text-xs px-2 py-1 rounded-md"
              style={{
                backgroundColor: 'rgba(241,245,249,0.06)',
                color: 'rgba(241,245,249,0.55)',
              }}
            >
              {icon} {label}
            </span>
          ))}
        </div>

        {/* Description */}
        <p
          className="text-sm leading-relaxed mb-4 line-clamp-3"
          style={{ color: 'rgba(241,245,249,0.55)' }}
        >
          {drill.description}
        </p>

        {/* Coaching cues */}
        {drill.cues.length > 0 && (
          <div className="space-y-1.5 mb-4">
            {drill.cues.slice(0, 3).map((cue, i) => (
              <p
                key={i}
                className="text-xs leading-snug pl-3"
                style={{
                  borderLeft: '2px solid #F7620A',
                  color: 'rgba(241,245,249,0.5)',
                }}
              >
                {cue}
              </p>
            ))}
          </div>
        )}

        {/* Spacer to push button to bottom */}
        <div className="flex-1" />

        {/* Divider */}
        <div style={{ borderTop: '1px solid rgba(241,245,249,0.07)', marginBottom: 12 }} />

        {/* Add to Practice button */}
        <button
          onClick={() => onAdd?.(drill)}
          className="w-full text-sm font-medium py-2 rounded-lg transition-colors"
          style={{
            backgroundColor: 'rgba(247,98,10,0.12)',
            color: '#F7620A',
            border: '1px solid rgba(247,98,10,0.2)',
          }}
          onMouseEnter={e => {
            ;(e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(247,98,10,0.2)'
          }}
          onMouseLeave={e => {
            ;(e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(247,98,10,0.12)'
          }}
        >
          + Add to Practice
        </button>
      </div>
    </div>
  )
}
