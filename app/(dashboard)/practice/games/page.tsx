'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Barlow_Condensed } from 'next/font/google'
import {
  practiceGames,
  GAME_CATEGORY_COLORS,
  GAME_CATEGORY_LABELS,
  type PracticeGame,
} from '@/data/practiceGames'
import { type PlanDrill } from '@/hooks/usePracticePlans'
import PracticeSubNav from '../components/PracticeSubNav'

const barlow = Barlow_Condensed({ subsets: ['latin'], weight: '700' })

const ENERGY_CONFIG: Record<PracticeGame['energyLevel'], { color: string; bg: string }> = {
  'Very High': { color: '#EF4444', bg: 'rgba(239,68,68,0.12)' },
  'High':      { color: '#F7620A', bg: 'rgba(247,98,10,0.12)' },
  'Medium':    { color: '#F5B731', bg: 'rgba(245,183,49,0.12)' },
  'Low':       { color: '#0ECFB0', bg: 'rgba(14,207,176,0.12)' },
}

const CATEGORIES = [
  { key: 'all',          label: 'All' },
  { key: 'ballhandling', label: 'Ball Handling' },
  { key: 'shooting',     label: 'Shooting' },
  { key: 'competitive',  label: 'Competitive' },
  { key: 'defense',      label: 'Defense' },
  { key: 'warmup',       label: 'Warmup / Fun' },
  { key: 'team',         label: 'Team' },
]

const ENERGY_LEVELS: Array<PracticeGame['energyLevel'] | 'all'> = [
  'all', 'Low', 'Medium', 'High', 'Very High',
]

// ── Game Card ────────────────────────────────────────────────────────────────

function GameCard({
  game,
  onAdd,
}: {
  game: PracticeGame
  onAdd: (game: PracticeGame) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const energy = ENERGY_CONFIG[game.energyLevel]

  return (
    <div
      className="flex flex-col rounded-xl overflow-hidden transition-all"
      style={{
        backgroundColor: '#0E1520',
        border: `1px solid rgba(241,245,249,${expanded ? '0.12' : '0.07'})`,
      }}
    >
      {/* Top color bar */}
      <div style={{ height: 4, backgroundColor: game.categoryColor, flexShrink: 0 }} />

      {/* Card body — click to expand */}
      <div
        className="flex flex-col flex-1 p-5 cursor-pointer"
        onClick={() => setExpanded(v => !v)}
      >
        {/* Category + energy */}
        <div className="flex items-center justify-between mb-2">
          <span
            className="text-xs font-semibold uppercase tracking-wider"
            style={{ color: game.categoryColor }}
          >
            {GAME_CATEGORY_LABELS[game.category]}
          </span>
          <span
            className="text-xs font-bold px-2 py-0.5 rounded-full"
            style={{ backgroundColor: energy.bg, color: energy.color }}
          >
            {game.energyLevel}
          </span>
        </div>

        {/* Name */}
        <h3 className={`text-xl leading-tight mb-3 text-sp-text ${barlow.className}`}>
          {game.name}
        </h3>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          <span
            className="text-xs px-2 py-1 rounded-md"
            style={{ backgroundColor: 'rgba(241,245,249,0.06)', color: 'rgba(241,245,249,0.55)' }}
          >
            ⏱ {game.durationMins} min
          </span>
          <span
            className="text-xs px-2 py-1 rounded-md"
            style={{ backgroundColor: 'rgba(241,245,249,0.06)', color: 'rgba(241,245,249,0.55)' }}
          >
            👥 {game.playersMin}–{game.playersMax} players
          </span>
        </div>

        {/* Description */}
        <p
          className={`text-sm leading-relaxed mb-3 ${expanded ? '' : 'line-clamp-3'}`}
          style={{ color: 'rgba(241,245,249,0.55)' }}
        >
          {game.description}
        </p>

        {/* Skill focus tags */}
        <div className="flex flex-wrap gap-1.5 mb-1">
          {game.skillFocus.map(s => (
            <span
              key={s}
              className="text-xs px-2 py-0.5 rounded-full"
              style={{ backgroundColor: `${game.categoryColor}18`, color: game.categoryColor }}
            >
              {s}
            </span>
          ))}
        </div>

        {/* Expand indicator */}
        <div className="mt-2 flex items-center gap-1" style={{ color: 'rgba(241,245,249,0.3)' }}>
          <span className="text-xs">{expanded ? '▲ Less' : '▼ Full details'}</span>
        </div>

        {/* ── Expanded detail ─────────────────────────────────── */}
        {expanded && (
          <div className="mt-4 space-y-4" onClick={e => e.stopPropagation()}>
            <div style={{ borderTop: '1px solid rgba(241,245,249,0.07)', paddingTop: '1rem' }}>
              {/* Setup */}
              <div className="mb-4">
                <p className="text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: 'rgba(241,245,249,0.35)' }}>
                  Setup
                </p>
                <p className="text-sm leading-relaxed" style={{ color: 'rgba(241,245,249,0.6)' }}>
                  {game.setup}
                </p>
              </div>

              {/* How to Play */}
              <div className="mb-4">
                <p className="text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: 'rgba(241,245,249,0.35)' }}>
                  How to Play
                </p>
                <p className="text-sm leading-relaxed" style={{ color: 'rgba(241,245,249,0.65)' }}>
                  {game.howToPlay}
                </p>
              </div>

              {/* Coaching Tips */}
              <div className="mb-4">
                <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'rgba(241,245,249,0.35)' }}>
                  Coaching Tips
                </p>
                <ul className="space-y-2">
                  {game.coachingTips.map((tip, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-sm"
                      style={{ color: 'rgba(241,245,249,0.65)' }}
                    >
                      <span style={{ color: game.categoryColor, flexShrink: 0 }}>→</span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Variations */}
              {game.variations && game.variations.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'rgba(241,245,249,0.35)' }}>
                    Variations
                  </p>
                  <ul className="space-y-1.5">
                    {game.variations.map((v, i) => (
                      <li
                        key={i}
                        className="text-sm pl-3"
                        style={{
                          borderLeft: `2px solid ${game.categoryColor}55`,
                          color: 'rgba(241,245,249,0.5)',
                        }}
                      >
                        {v}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Add to Practice button */}
      <div className="px-5 pb-5 pt-0">
        <div style={{ borderTop: '1px solid rgba(241,245,249,0.07)', marginBottom: 12 }} />
        <button
          onClick={e => { e.stopPropagation(); onAdd(game) }}
          className="w-full text-sm font-medium py-2 rounded-lg transition-colors"
          style={{
            backgroundColor: 'rgba(247,98,10,0.12)',
            color: '#F7620A',
            border: '1px solid rgba(247,98,10,0.2)',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(247,98,10,0.2)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(247,98,10,0.12)' }}
        >
          🎮 + Add to Practice
        </button>
      </div>
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function PracticeGamesPage() {
  const router = useRouter()
  const [search, setSearch]           = useState('')
  const [activeCategory, setCategory] = useState('all')
  const [activeEnergy, setEnergy]     = useState<PracticeGame['energyLevel'] | 'all'>('all')
  const [toast, setToast]             = useState('')

  const filtered = useMemo(() => {
    let result = practiceGames
    if (activeCategory !== 'all') result = result.filter(g => g.category === activeCategory)
    if (activeEnergy !== 'all')   result = result.filter(g => g.energyLevel === activeEnergy)
    if (search.trim()) {
      const s = search.toLowerCase()
      result = result.filter(
        g =>
          g.name.toLowerCase().includes(s) ||
          g.description.toLowerCase().includes(s) ||
          g.skillFocus.some(f => f.toLowerCase().includes(s))
      )
    }
    return result
  }, [activeCategory, activeEnergy, search])

  function handleAdd(game: PracticeGame) {
    const item: PlanDrill = {
      uid:           crypto.randomUUID(),
      drillId:       `game-${game.id}`,
      name:          game.name,
      category:      game.category,
      categoryColor: game.categoryColor,
      durationMins:  game.durationMins,
    }
    localStorage.setItem('sp_queued_game', JSON.stringify(item))
    setToast(`"${game.name}" queued — taking you to the Planner…`)
    setTimeout(() => router.push('/practice/build/new'), 1200)
  }

  return (
    <div>
      <PracticeSubNav />

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-sp-text">Practice Games</h1>
          <p className="text-sm mt-0.5" style={{ color: 'rgba(241,245,249,0.4)' }}>
            Competitive games that build skills through fun. Use these to end practice on a high note or change the energy.
          </p>
        </div>
        <span className="text-sm flex-shrink-0 ml-4" style={{ color: 'rgba(241,245,249,0.35)' }}>
          {filtered.length} game{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Search */}
      <input
        type="text"
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Search by name, skill focus..."
        className="sp-input mb-4"
        style={{ maxWidth: 420 }}
      />

      {/* Category pills */}
      <div className="flex flex-wrap gap-2 mb-3">
        {CATEGORIES.map(({ key, label }) => {
          const isActive = activeCategory === key
          const color = key !== 'all' ? GAME_CATEGORY_COLORS[key as PracticeGame['category']] : '#F7620A'
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

      {/* Energy level filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        {ENERGY_LEVELS.map(level => {
          const isActive = activeEnergy === level
          const cfg = level !== 'all' ? ENERGY_CONFIG[level] : null
          return (
            <button
              key={level}
              onClick={() => setEnergy(level)}
              className="px-3 py-1 rounded-full text-xs font-medium transition-all"
              style={{
                backgroundColor: isActive ? (cfg?.bg ?? 'rgba(247,98,10,0.15)') : 'rgba(241,245,249,0.04)',
                color: isActive ? (cfg?.color ?? '#F7620A') : 'rgba(241,245,249,0.4)',
                border: `1px solid ${isActive ? (cfg?.color ?? '#F7620A') + '55' : 'rgba(241,245,249,0.07)'}`,
              }}
            >
              {level === 'all' ? 'All Energy' : level}
            </button>
          )
        })}
      </div>

      {/* Games grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(game => (
            <GameCard key={game.id} game={game} onAdd={handleAdd} />
          ))}
        </div>
      ) : (
        <div
          className="flex items-center justify-center py-20 rounded-xl"
          style={{ border: '1px dashed rgba(241,245,249,0.1)' }}
        >
          <p className="text-sm" style={{ color: 'rgba(241,245,249,0.3)' }}>No games match your filters</p>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div
          className="fixed bottom-24 left-1/2 -translate-x-1/2 px-5 py-3 rounded-xl text-sm font-semibold z-50 text-white shadow-xl"
          style={{ backgroundColor: '#22C55E', whiteSpace: 'nowrap' }}
        >
          ✓ {toast}
        </div>
      )}
    </div>
  )
}
