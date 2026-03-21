'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Barlow_Condensed } from 'next/font/google'
import {
  PLAYS,
  PLAY_CATEGORY_COLORS,
  PLAY_CATEGORY_LABELS,
  PLAY_DIFFICULTY_LABELS,
  type Play,
  type PlayCategory,
  type PlayDifficulty,
} from '@/data/plays'
import { type PlanDrill } from '@/hooks/usePracticePlans'
import PlayDiagram from '@/components/plays/PlayDiagram'
import PracticeSubNav from '../components/PracticeSubNav'

const barlow = Barlow_Condensed({ subsets: ['latin'], weight: '700' })

const DIFFICULTY_CONFIG: Record<PlayDifficulty, { color: string; bg: string }> = {
  beg: { color: '#22C55E', bg: 'rgba(34,197,94,0.12)' },
  int: { color: '#F5B731', bg: 'rgba(245,183,49,0.12)' },
  adv: { color: '#EF4444', bg: 'rgba(239,68,68,0.12)' },
}

const CATEGORIES: Array<{ key: string; label: string }> = [
  { key: 'all',        label: 'All' },
  { key: 'halfcourt',  label: 'Half Court' },
  { key: 'inbounds',   label: 'Inbounds' },
  { key: 'defense',    label: 'Defense' },
  { key: 'special',    label: 'Special' },
  { key: 'transition', label: 'Transition' },
  { key: 'timeout',    label: 'Timeout' },
]

const DIFFICULTIES: Array<PlayDifficulty | 'all'> = ['all', 'beg', 'int', 'adv']

// ── Play Card ─────────────────────────────────────────────────────────────────

function PlayCard({
  play,
  onAdd,
}: {
  play: Play
  onAdd: (play: Play) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const diff = DIFFICULTY_CONFIG[play.difficulty]

  return (
    <div
      className="flex flex-col rounded-xl overflow-hidden transition-all"
      style={{
        backgroundColor: '#0E1520',
        border: `1px solid rgba(241,245,249,${expanded ? '0.12' : '0.07'})`,
      }}
    >
      {/* Top color bar */}
      <div style={{ height: 4, backgroundColor: play.categoryColor, flexShrink: 0 }} />

      {/* Card body */}
      <div
        className="flex flex-col flex-1 p-5 cursor-pointer"
        onClick={() => setExpanded(v => !v)}
      >
        {/* Category + difficulty */}
        <div className="flex items-center justify-between mb-2">
          <span
            className="text-xs font-semibold uppercase tracking-wider"
            style={{ color: play.categoryColor }}
          >
            {PLAY_CATEGORY_LABELS[play.category]}
          </span>
          <span
            className="text-xs font-bold px-2 py-0.5 rounded-full"
            style={{ backgroundColor: diff.bg, color: diff.color }}
          >
            {PLAY_DIFFICULTY_LABELS[play.difficulty]}
          </span>
        </div>

        {/* Name */}
        <h3 className={`text-xl leading-tight mb-1 text-sp-text ${barlow.className}`}>
          {play.name}
        </h3>

        {/* Type tag */}
        <p className="text-xs mb-3" style={{ color: 'rgba(241,245,249,0.4)' }}>
          {play.type}
        </p>

        {/* Static diagram — always visible */}
        <div
          className="rounded-lg overflow-hidden mb-3 flex items-center justify-center"
          style={{ backgroundColor: '#0a1018', border: '1px solid rgba(241,245,249,0.06)' }}
        >
          <PlayDiagram
            agents={play.agents}
            ballStartX={play.ballStartX}
            ballStartY={play.ballStartY}
            ballEndX={play.ballEndX}
            ballEndY={play.ballEndY}
            width={260}
            height={160}
            showMovement
          />
        </div>

        {/* Duration tag */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          <span
            className="text-xs px-2 py-1 rounded-md"
            style={{ backgroundColor: 'rgba(241,245,249,0.06)', color: 'rgba(241,245,249,0.55)' }}
          >
            ⏱ {play.suggestedDurationMins} min
          </span>
        </div>

        {/* Description */}
        <p
          className={`text-sm leading-relaxed mb-3 ${expanded ? '' : 'line-clamp-2'}`}
          style={{ color: 'rgba(241,245,249,0.55)' }}
        >
          {play.description}
        </p>

        {/* Teaching keys preview (first 2) */}
        {!expanded && (
          <ul className="space-y-1 mb-2">
            {play.teachingKeys.slice(0, 2).map((key, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-xs"
                style={{ color: 'rgba(241,245,249,0.45)' }}
              >
                <span style={{ color: play.categoryColor, flexShrink: 0 }}>→</span>
                {key}
              </li>
            ))}
          </ul>
        )}

        {/* Expand indicator */}
        <div className="mt-1 flex items-center gap-1" style={{ color: 'rgba(241,245,249,0.3)' }}>
          <span className="text-xs">{expanded ? '▲ Less' : '▼ Full details'}</span>
        </div>

        {/* ── Expanded detail ─────────────────────────────────── */}
        {expanded && (
          <div className="mt-4 space-y-4" onClick={e => e.stopPropagation()}>
            <div style={{ borderTop: '1px solid rgba(241,245,249,0.07)', paddingTop: '1rem' }}>

              {/* Steps */}
              <div className="mb-4">
                <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'rgba(241,245,249,0.35)' }}>
                  Play Steps
                </p>
                <ol className="space-y-2">
                  {play.steps.map(s => (
                    <li
                      key={s.step}
                      className="flex items-start gap-2 text-sm"
                      style={{ color: 'rgba(241,245,249,0.65)' }}
                    >
                      <span
                        className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                        style={{ backgroundColor: `${play.categoryColor}22`, color: play.categoryColor }}
                      >
                        {s.step}
                      </span>
                      {s.description}
                    </li>
                  ))}
                </ol>
              </div>

              {/* Teaching Keys */}
              <div className="mb-4">
                <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'rgba(241,245,249,0.35)' }}>
                  Teaching Keys
                </p>
                <ul className="space-y-2">
                  {play.teachingKeys.map((key, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-sm"
                      style={{ color: 'rgba(241,245,249,0.65)' }}
                    >
                      <span style={{ color: play.categoryColor, flexShrink: 0 }}>→</span>
                      {key}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add to Practice button */}
      <div className="px-5 pb-5 pt-0">
        <div style={{ borderTop: '1px solid rgba(241,245,249,0.07)', marginBottom: 12 }} />
        <button
          onClick={e => { e.stopPropagation(); onAdd(play) }}
          className="w-full text-sm font-medium py-2 rounded-lg transition-colors"
          style={{
            backgroundColor: 'rgba(58,134,255,0.12)',
            color: '#3A86FF',
            border: '1px solid rgba(58,134,255,0.2)',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(58,134,255,0.22)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(58,134,255,0.12)' }}
        >
          🏀 + Add to Practice
        </button>
      </div>
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function PlaysPage() {
  const router = useRouter()
  const [search, setSearch]           = useState('')
  const [activeCategory, setCategory] = useState('all')
  const [activeDifficulty, setDiff]   = useState<PlayDifficulty | 'all'>('all')
  const [toast, setToast]             = useState('')

  const filtered = useMemo(() => {
    let result = PLAYS
    if (activeCategory !== 'all') result = result.filter(p => p.category === activeCategory)
    if (activeDifficulty !== 'all') result = result.filter(p => p.difficulty === activeDifficulty)
    if (search.trim()) {
      const s = search.toLowerCase()
      result = result.filter(
        p =>
          p.name.toLowerCase().includes(s) ||
          p.description.toLowerCase().includes(s) ||
          p.type.toLowerCase().includes(s) ||
          p.teachingKeys.some(k => k.toLowerCase().includes(s))
      )
    }
    return result
  }, [activeCategory, activeDifficulty, search])

  function handleAdd(play: Play) {
    const item: PlanDrill = {
      uid:           crypto.randomUUID(),
      drillId:       `play-${play.id}`,
      name:          play.name,
      category:      play.category,
      categoryColor: play.categoryColor,
      durationMins:  play.suggestedDurationMins,
    }
    localStorage.setItem('sp_queued_play', JSON.stringify(item))
    setToast(`"${play.name}" queued — taking you to the Planner…`)
    setTimeout(() => router.push('/practice/planner'), 1200)
  }

  return (
    <div>
      <PracticeSubNav />

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-sp-text">Play Library</h1>
          <p className="text-sm mt-0.5" style={{ color: 'rgba(241,245,249,0.4)' }}>
            Offensive sets, defensive schemes, and special situations with X&apos;s and O&apos;s diagrams.
          </p>
        </div>
        <span className="text-sm flex-shrink-0 ml-4" style={{ color: 'rgba(241,245,249,0.35)' }}>
          {filtered.length} play{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Search */}
      <input
        type="text"
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Search by name, type, teaching key..."
        className="sp-input mb-4"
        style={{ maxWidth: 420 }}
      />

      {/* Category pills */}
      <div className="flex flex-wrap gap-2 mb-3">
        {CATEGORIES.map(({ key, label }) => {
          const isActive = activeCategory === key
          const color = key !== 'all' ? PLAY_CATEGORY_COLORS[key as PlayCategory] : '#F7620A'
          return (
            <button
              key={key}
              onClick={() => setCategory(key)}
              className="px-3 py-1.5 rounded-full text-sm font-medium transition-all"
              style={{
                backgroundColor: isActive ? `${color}22` : 'rgba(241,245,249,0.06)',
                color: isActive ? color : 'rgba(241,245,249,0.45)',
                border: `1px solid ${isActive ? color + '55' : 'rgba(241,245,249,0.08)'}`,
              }}
            >
              {label}
            </button>
          )
        })}
      </div>

      {/* Difficulty filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        {DIFFICULTIES.map(level => {
          const isActive = activeDifficulty === level
          const cfg = level !== 'all' ? DIFFICULTY_CONFIG[level] : null
          return (
            <button
              key={level}
              onClick={() => setDiff(level)}
              className="px-3 py-1 rounded-full text-xs font-medium transition-all"
              style={{
                backgroundColor: isActive ? (cfg?.bg ?? 'rgba(247,98,10,0.15)') : 'rgba(241,245,249,0.04)',
                color: isActive ? (cfg?.color ?? '#F7620A') : 'rgba(241,245,249,0.4)',
                border: `1px solid ${isActive ? (cfg?.color ?? '#F7620A') + '55' : 'rgba(241,245,249,0.07)'}`,
              }}
            >
              {level === 'all' ? 'All Levels' : PLAY_DIFFICULTY_LABELS[level]}
            </button>
          )
        })}
      </div>

      {/* Plays grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(play => (
            <PlayCard key={play.id} play={play} onAdd={handleAdd} />
          ))}
        </div>
      ) : (
        <div
          className="flex items-center justify-center py-20 rounded-xl"
          style={{ border: '1px dashed rgba(241,245,249,0.1)' }}
        >
          <p className="text-sm" style={{ color: 'rgba(241,245,249,0.3)' }}>No plays match your filters</p>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div
          className="fixed bottom-24 left-1/2 -translate-x-1/2 px-5 py-3 rounded-xl text-sm font-semibold z-50 text-white shadow-xl"
          style={{ backgroundColor: '#3A86FF', whiteSpace: 'nowrap' }}
        >
          ✓ {toast}
        </div>
      )}
    </div>
  )
}
