'use client'

import { useState, useMemo, useCallback, useRef } from 'react'
import Link from 'next/link'
import { Barlow_Condensed } from 'next/font/google'
import {
  useSeasonPlans,
  useCreateSeasonPlan,
  useUpdateSeasonPlan,
  useDeleteSeasonPlan,
  type SeasonPlan,
  type SeasonPhase,
  type WeeklyFocus,
} from '@/hooks/useSeasonPlans'
import { useCreatePracticePlan } from '@/hooks/usePracticePlans'
import { createClient } from '@/lib/supabase/client'
import { drills as staticDrills } from '@/data/drills'
import { useEvaluations } from '@/hooks/useEvaluations'

const barlow = Barlow_Condensed({ subsets: ['latin'], weight: '900' })

// ── Constants ─────────────────────────────────────────────────────────────────

const FOCUS_OPTIONS = [
  { key: 'Ball Handling', cat: 'ballhandling', color: '#F7620A' },
  { key: 'Shooting',      cat: 'shooting',     color: '#38BDF8' },
  { key: 'Passing',       cat: 'passing',      color: '#F5B731' },
  { key: 'Defense',       cat: 'defense',      color: '#22C55E' },
  { key: 'Conditioning',  cat: 'conditioning', color: '#E879F9' },
  { key: 'Team Play',     cat: 'team',         color: '#8B5CF6' },
]
const FOCUS_COLOR: Record<string, string> = Object.fromEntries(FOCUS_OPTIONS.map(f => [f.key, f.color]))
const FOCUS_CAT:   Record<string, string> = Object.fromEntries(FOCUS_OPTIONS.map(f => [f.key, f.cat]))

const CHARACTER_THEMES = [
  { name: 'Accountability', icon: '✅', description: 'Establish standards — own your effort and actions' },
  { name: 'Teamwork',       icon: '🤝', description: 'Build cohesion — we\'re better together' },
  { name: 'Grit',           icon: '💪', description: 'Push through difficulty — embrace hard work' },
  { name: 'Empathy',        icon: '❤️',  description: 'Deepen relationships — see your teammates' },
  { name: 'Leadership',     icon: '⭐', description: 'Elevate each other — lead from where you are' },
  { name: 'Integrity',      icon: '🛡️',  description: 'Do right under pressure — when no one is watching' },
  { name: 'Resilience',     icon: '🔄', description: 'Bounce back — failure is feedback' },
  { name: 'Gratitude',      icon: '🙏', description: 'Appreciate the game and the people in it' },
]
const RECOMMENDED_THEMES = ['Accountability','Teamwork','Grit','Empathy','Leadership','Integrity','Resilience','Gratitude']

const AGE_GROUPS   = ['U8','U10','U12','U14','U16','Varsity']
const SKILL_LEVELS = ['Beginner','Intermediate','Advanced','Mixed']
const DURATIONS    = [45, 60, 75, 90, 120]

const INTENSITY_COLORS = ['','#38BDF8','#22C55E','#F5B731','#F7620A','#EF4444']
const INTENSITY_LABELS = ['','Low','Medium','High','Peak','Max']

// Default phases by season type
function defaultPhases(totalWeeks: number, type: string): SeasonPhase[] {
  if (type === 'aau') {
    return [
      { name: 'Pre-season',      startWeek: 1, endWeek: Math.max(1, Math.round(totalWeeks * 0.2)), focusAreas: ['Conditioning','Ball Handling'], description: 'Conditioning and player evaluation', intensity: 2 },
      { name: 'Early Season',    startWeek: Math.max(1, Math.round(totalWeeks * 0.2)) + 1, endWeek: Math.round(totalWeeks * 0.45), focusAreas: ['Ball Handling','Defense'], description: 'System installation and skill building', intensity: 3 },
      { name: 'Mid Season',      startWeek: Math.round(totalWeeks * 0.45) + 1, endWeek: Math.round(totalWeeks * 0.75), focusAreas: ['Shooting','Team Play'], description: 'Refinement and competitive reps', intensity: 4 },
      { name: 'Tournament Prep', startWeek: Math.round(totalWeeks * 0.75) + 1, endWeek: totalWeeks, focusAreas: ['Team Play','Shooting'], description: 'Peak performance and game simulation', intensity: 5 },
    ]
  }
  if (type === 'school') {
    return [
      { name: 'Tryouts',         startWeek: 1, endWeek: Math.max(1, Math.round(totalWeeks * 0.1)), focusAreas: ['Conditioning','Ball Handling'], description: 'Player selection and evaluation', intensity: 3 },
      { name: 'Pre-season',      startWeek: Math.max(1, Math.round(totalWeeks * 0.1)) + 1, endWeek: Math.round(totalWeeks * 0.25), focusAreas: ['Ball Handling','Defense'], description: 'Fundamentals and conditioning', intensity: 2 },
      { name: 'Regular Season',  startWeek: Math.round(totalWeeks * 0.25) + 1, endWeek: Math.round(totalWeeks * 0.8), focusAreas: ['Team Play','Shooting'], description: 'Weekly game preparation', intensity: 4 },
      { name: 'Playoffs',        startWeek: Math.round(totalWeeks * 0.8) + 1, endWeek: totalWeeks, focusAreas: ['Team Play','Defense'], description: 'Peak performance', intensity: 5 },
    ]
  }
  // rec + custom
  if (totalWeeks <= 8) {
    return [
      { name: 'Foundation',    startWeek: 1, endWeek: Math.max(1, Math.round(totalWeeks * 0.25)), focusAreas: ['Ball Handling','Shooting'], description: 'Learn the fundamentals', intensity: 2 },
      { name: 'Development',  startWeek: Math.max(1, Math.round(totalWeeks * 0.25)) + 1, endWeek: Math.round(totalWeeks * 0.75), focusAreas: ['Defense','Passing'], description: 'Build skills and team concepts', intensity: 3 },
      { name: 'Peak',          startWeek: Math.round(totalWeeks * 0.75) + 1, endWeek: totalWeeks, focusAreas: ['Team Play','Shooting'], description: 'Competition ready', intensity: 4 },
    ]
  }
  return [
    { name: 'Foundation',   startWeek: 1, endWeek: Math.max(1, Math.round(totalWeeks * 0.17)), focusAreas: ['Ball Handling','Conditioning'], description: 'Fundamentals and team bonding', intensity: 2 },
    { name: 'Development',  startWeek: Math.max(1, Math.round(totalWeeks * 0.17)) + 1, endWeek: Math.round(totalWeeks * 0.67), focusAreas: ['Shooting','Defense'], description: 'Skill building and system install', intensity: 3 },
    { name: 'Peak',         startWeek: Math.round(totalWeeks * 0.67) + 1, endWeek: totalWeeks, focusAreas: ['Team Play','Shooting'], description: 'Game prep and competition', intensity: 5 },
  ]
}

function autoFillWeeks(
  totalWeeks: number,
  phases: SeasonPhase[],
  themes: string[],
  teamWeaknesses: string[],
): WeeklyFocus[] {
  const focusKeys = FOCUS_OPTIONS.map(f => f.key)
  // Weight focus areas — ball handling + shooting most frequent
  const weights: Record<string, number> = {
    'Ball Handling': 3, 'Shooting': 3, 'Defense': 2, 'Passing': 2, 'Team Play': 2, 'Conditioning': 1,
  }
  // Boost team weaknesses
  for (const w of teamWeaknesses) {
    if (weights[w] !== undefined) weights[w] += 2
  }

  const complementary: Record<string, string> = {
    'Ball Handling': 'Passing', 'Shooting': 'Ball Handling', 'Passing': 'Ball Handling',
    'Defense': 'Conditioning', 'Team Play': 'Passing', 'Conditioning': 'Defense',
  }

  const getPhase = (week: number) =>
    phases.find(p => week >= p.startWeek && week <= p.endWeek) ?? phases[phases.length - 1]

  const getTheme = (week: number) => {
    if (themes.length === 0) return ''
    const weeksPerTheme = Math.max(1, Math.ceil(totalWeeks / themes.length))
    const idx = Math.min(Math.floor((week - 1) / weeksPerTheme), themes.length - 1)
    return themes[idx]
  }

  // Build rotation schedule weighted by focus weights
  const pool: string[] = []
  for (const [focus, w] of Object.entries(weights)) {
    for (let i = 0; i < w; i++) pool.push(focus)
  }

  const weeks: WeeklyFocus[] = []
  let poolIdx = 0
  // Shuffle pool deterministically
  const shuffled = [...pool].sort((a, b) => a.localeCompare(b))

  for (let w = 1; w <= totalWeeks; w++) {
    const phase = getPhase(w)
    // Every 4th week: defense priority if not already dominant
    let primary = shuffled[poolIdx % shuffled.length]
    // Force defense week every 4 weeks
    if (w % 4 === 0 && primary !== 'Defense') primary = 'Defense'
    // Late season: more team play
    if (phase.name.toLowerCase().includes('peak') || phase.name.toLowerCase().includes('playoff') || phase.name.toLowerCase().includes('tournament')) {
      if (w % 3 === 0) primary = 'Team Play'
    }
    poolIdx++

    const secondary = complementary[primary] ?? focusKeys.find(k => k !== primary) ?? 'Shooting'

    // Intensity follows phase
    const intensity = phase.intensity

    weeks.push({
      week: w,
      primaryFocus: primary,
      secondaryFocus: secondary,
      characterTheme: getTheme(w),
      intensity,
    })
  }
  return weeks
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function calcTotalWeeks(start: string, end: string): number {
  if (!start || !end) return 0
  const ms = new Date(end).getTime() - new Date(start).getTime()
  return Math.max(1, Math.ceil(ms / (7 * 24 * 60 * 60 * 1000)))
}

function calcPracticeDate(startDate: string, weekNum: number, practiceInWeek: number, perWeek: number): string {
  // Spread practices evenly across the week (Mon, Wed, Fri for 3/week etc.)
  const gaps: Record<number, number[]> = {
    1: [1], 2: [1, 4], 3: [1, 3, 5], 4: [1, 2, 4, 5], 5: [1, 2, 3, 4, 5],
  }
  const dayOffsets = gaps[perWeek] ?? [1]
  const dayOffset = dayOffsets[(practiceInWeek - 1) % dayOffsets.length]
  const weekOffset = (weekNum - 1) * 7
  const d = new Date(startDate + 'T12:00:00')
  d.setDate(d.getDate() + weekOffset + dayOffset)
  return d.toISOString().split('T')[0]
}

function getPhaseName(week: number, phases: SeasonPhase[]): string {
  return phases.find(p => week >= p.startWeek && week <= p.endWeek)?.name ?? ''
}

function pickDrills(focusAreas: string[], durationMins: number, skillLevel: string) {
  const levelPriority: Record<string, number> = { Beginner: 1, Intermediate: 2, Advanced: 3, 'All levels': 2, Mixed: 2 }
  const maxLevel = levelPriority[skillLevel] ?? 2
  const levelMap: Record<number, string[]> = { 1: ['Beginner', 'All levels'], 2: ['Beginner', 'Intermediate', 'All levels'], 3: ['Beginner', 'Intermediate', 'Advanced', 'All levels'] }
  const allowedLevels = levelMap[maxLevel]

  const cats = focusAreas.map(f => FOCUS_CAT[f]).filter(Boolean)
  const candidates = staticDrills.filter(d => cats.includes(d.category) && allowedLevels.includes(d.level))

  const selected: typeof staticDrills = []
  let usedMins = 0
  const reserve = Math.round(durationMins * 0.1) // 10% buffer

  for (const cat of cats) {
    const matching = candidates.filter(d => d.category === cat && !selected.includes(d))
    if (matching.length > 0) {
      const drill = matching[0]
      if (usedMins + drill.durationMins <= durationMins - reserve) {
        selected.push(drill)
        usedMins += drill.durationMins
      }
    }
  }
  // Fill remaining time with other drills
  for (const drill of candidates) {
    if (selected.includes(drill)) continue
    if (usedMins + drill.durationMins <= durationMins - reserve) {
      selected.push(drill)
      usedMins += drill.durationMins
    }
  }

  return selected.map(d => ({
    uid:           `${d.id}-${Math.random().toString(36).slice(2, 7)}`,
    drillId:       d.id,
    name:          d.name,
    category:      d.category,
    categoryColor: d.categoryColor,
    durationMins:  d.durationMins,
  }))
}

// ── Step indicator ────────────────────────────────────────────────────────────

const STEPS = ['Setup', 'Phases', 'Weekly Arc', 'Characters', 'Review']

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-1">
      {STEPS.map((label, i) => {
        const done    = i < current
        const active  = i === current
        return (
          <div key={label} className="flex items-center gap-2 flex-shrink-0">
            {i > 0 && <div className="w-6 h-px" style={{ backgroundColor: done ? '#F7620A' : 'rgba(241,245,249,0.12)' }} />}
            <div className="flex items-center gap-2">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                style={{
                  backgroundColor: active ? '#F7620A' : done ? 'rgba(247,98,10,0.2)' : 'rgba(241,245,249,0.06)',
                  color: active ? '#fff' : done ? '#F7620A' : 'rgba(241,245,249,0.3)',
                  border: active ? 'none' : done ? '1px solid rgba(247,98,10,0.4)' : '1px solid rgba(241,245,249,0.1)',
                }}
              >
                {done ? '✓' : i + 1}
              </div>
              <span className="text-sm font-medium" style={{ color: active ? '#F1F5F9' : done ? 'rgba(241,245,249,0.6)' : 'rgba(241,245,249,0.3)' }}>
                {label}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Step 1: Setup ─────────────────────────────────────────────────────────────

interface SetupData {
  name: string
  seasonType: 'rec' | 'aau' | 'school' | 'custom'
  startDate: string
  endDate: string
  practicesPerWeek: number
  practiceDuration: number
  ageGroup: string
  skillLevel: string
}

function Step1Setup({ data, onChange, onNext }: {
  data: SetupData
  onChange: (d: SetupData) => void
  onNext: () => void
}) {
  const totalWeeks     = calcTotalWeeks(data.startDate, data.endDate)
  const totalPractices = totalWeeks * data.practicesPerWeek
  const error          = !data.name.trim() ? 'Season name is required'
                       : !data.startDate    ? 'Start date is required'
                       : !data.endDate      ? 'End date is required'
                       : data.endDate <= data.startDate ? 'End date must be after start date'
                       : ''

  const types: Array<{ key: SetupData['seasonType']; icon: string; label: string }> = [
    { key: 'rec',    icon: '📅', label: 'Rec League' },
    { key: 'aau',    icon: '🏆', label: 'AAU' },
    { key: 'school', icon: '🏫', label: 'School Team' },
    { key: 'custom', icon: '✏️',  label: 'Custom' },
  ]

  return (
    <div className="max-w-xl space-y-5">
      {/* Season name */}
      <div>
        <label className="block mb-1.5 text-xs font-medium" style={{ color: 'rgba(241,245,249,0.6)' }}>Season Name *</label>
        <input
          value={data.name}
          onChange={e => onChange({ ...data, name: e.target.value })}
          className="sp-input"
          placeholder="e.g. Spring 2025 U12"
        />
      </div>

      {/* Season type */}
      <div>
        <label className="block mb-2 text-xs font-medium" style={{ color: 'rgba(241,245,249,0.6)' }}>Season Type</label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {types.map(({ key, icon, label }) => (
            <button
              key={key}
              onClick={() => onChange({ ...data, seasonType: key })}
              className="flex flex-col items-center gap-1.5 py-3 rounded-xl text-sm font-medium transition-all"
              style={{
                backgroundColor: data.seasonType === key ? 'rgba(247,98,10,0.12)' : 'rgba(241,245,249,0.04)',
                color: data.seasonType === key ? '#F7620A' : 'rgba(241,245,249,0.5)',
                border: `1px solid ${data.seasonType === key ? 'rgba(247,98,10,0.4)' : 'rgba(241,245,249,0.08)'}`,
              }}
            >
              <span style={{ fontSize: 20 }}>{icon}</span>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Dates */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block mb-1.5 text-xs font-medium" style={{ color: 'rgba(241,245,249,0.6)' }}>Start Date *</label>
          <input type="date" value={data.startDate} onChange={e => onChange({ ...data, startDate: e.target.value })} className="sp-input" style={{ colorScheme: 'dark' }} />
        </div>
        <div>
          <label className="block mb-1.5 text-xs font-medium" style={{ color: 'rgba(241,245,249,0.6)' }}>End Date *</label>
          <input type="date" value={data.endDate} onChange={e => onChange({ ...data, endDate: e.target.value })} className="sp-input" style={{ colorScheme: 'dark' }} />
        </div>
      </div>

      {/* Live summary */}
      {totalWeeks > 0 && (
        <div className="rounded-xl px-4 py-3 text-sm font-medium" style={{ backgroundColor: 'rgba(247,98,10,0.08)', border: '1px solid rgba(247,98,10,0.2)', color: '#F7620A' }}>
          {totalWeeks} weeks · {totalPractices} total practices
          {data.startDate && (
            <span className="font-normal ml-2" style={{ color: 'rgba(241,245,249,0.5)' }}>
              {new Date(data.startDate + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} –{' '}
              {new Date(data.endDate   + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          )}
        </div>
      )}

      {/* Practices per week */}
      <div>
        <label className="block mb-2 text-xs font-medium" style={{ color: 'rgba(241,245,249,0.6)' }}>Practices Per Week</label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map(n => (
            <button
              key={n}
              onClick={() => onChange({ ...data, practicesPerWeek: n })}
              className="w-10 h-10 rounded-xl text-sm font-bold transition-all"
              style={{
                backgroundColor: data.practicesPerWeek === n ? '#F7620A' : 'rgba(241,245,249,0.06)',
                color: data.practicesPerWeek === n ? '#fff' : 'rgba(241,245,249,0.5)',
                border: `1px solid ${data.practicesPerWeek === n ? '#F7620A' : 'rgba(241,245,249,0.1)'}`,
              }}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* Duration + Age + Skill */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block mb-1.5 text-xs font-medium" style={{ color: 'rgba(241,245,249,0.6)' }}>Practice Duration</label>
          <select value={data.practiceDuration} onChange={e => onChange({ ...data, practiceDuration: Number(e.target.value) })} className="sp-input" style={{ colorScheme: 'dark' }}>
            {DURATIONS.map(d => <option key={d} value={d} style={{ backgroundColor: '#0E1520' }}>{d} min</option>)}
          </select>
        </div>
        <div>
          <label className="block mb-1.5 text-xs font-medium" style={{ color: 'rgba(241,245,249,0.6)' }}>Age Group</label>
          <select value={data.ageGroup} onChange={e => onChange({ ...data, ageGroup: e.target.value })} className="sp-input" style={{ colorScheme: 'dark' }}>
            {AGE_GROUPS.map(g => <option key={g} value={g} style={{ backgroundColor: '#0E1520' }}>{g}</option>)}
          </select>
        </div>
        <div>
          <label className="block mb-1.5 text-xs font-medium" style={{ color: 'rgba(241,245,249,0.6)' }}>Skill Level</label>
          <select value={data.skillLevel} onChange={e => onChange({ ...data, skillLevel: e.target.value })} className="sp-input" style={{ colorScheme: 'dark' }}>
            {SKILL_LEVELS.map(l => <option key={l} value={l} style={{ backgroundColor: '#0E1520' }}>{l}</option>)}
          </select>
        </div>
      </div>

      {error && <p className="text-sm text-red-400 px-3 py-2 rounded-lg" style={{ backgroundColor: 'rgba(239,68,68,0.08)' }}>{error}</p>}

      <div className="flex justify-end pt-2">
        <button onClick={() => !error && onNext()} disabled={!!error} className="px-6 py-2.5 text-sm font-semibold rounded-xl disabled:opacity-40 transition-opacity hover:opacity-85" style={{ backgroundColor: '#F7620A', color: '#fff' }}>
          Next: Phases →
        </button>
      </div>
    </div>
  )
}

// ── Step 2: Phases ────────────────────────────────────────────────────────────

function Step2Phases({ phases, totalWeeks, onChange, onNext, onBack }: {
  phases: SeasonPhase[]
  totalWeeks: number
  onChange: (phases: SeasonPhase[]) => void
  onNext: () => void
  onBack: () => void
}) {
  function updatePhase(idx: number, updates: Partial<SeasonPhase>) {
    onChange(phases.map((p, i) => i === idx ? { ...p, ...updates } : p))
  }

  function addPhase() {
    const lastEnd = phases[phases.length - 1]?.endWeek ?? totalWeeks
    if (lastEnd >= totalWeeks) return
    onChange([...phases, {
      name: 'New Phase', startWeek: lastEnd + 1, endWeek: totalWeeks,
      focusAreas: [], description: '', intensity: 3,
    }])
  }

  function removePhase(idx: number) {
    if (phases.length <= 1) return
    onChange(phases.filter((_, i) => i !== idx))
  }

  function moveDivider(idx: number, delta: number) {
    // Move the boundary between phase idx and idx+1
    if (idx >= phases.length - 1) return
    const newPhases = phases.map(p => ({ ...p }))
    const newEnd = Math.max(newPhases[idx].startWeek, Math.min(newPhases[idx + 1].endWeek - 1, newPhases[idx].endWeek + delta))
    newPhases[idx].endWeek = newEnd
    newPhases[idx + 1].startWeek = newEnd + 1
    onChange(newPhases)
  }

  const totalAssigned = phases.reduce((s, p) => s + (p.endWeek - p.startWeek + 1), 0)

  return (
    <div className="space-y-5">
      {/* Visual timeline */}
      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(241,245,249,0.07)' }}>
        <div className="flex" style={{ height: 48 }}>
          {phases.map((phase, i) => {
            const width = ((phase.endWeek - phase.startWeek + 1) / totalWeeks) * 100
            const hue = [210, 140, 45, 10, 0][i] ?? 270
            return (
              <div
                key={i}
                className="flex items-center justify-center text-xs font-semibold overflow-hidden relative"
                style={{
                  width: `${width}%`,
                  backgroundColor: `hsla(${hue},70%,55%,0.18)`,
                  borderRight: i < phases.length - 1 ? '2px solid rgba(241,245,249,0.15)' : undefined,
                  color: `hsla(${hue},70%,70%,1)`,
                  minWidth: 30,
                }}
              >
                <span className="truncate px-1">{phase.name}</span>
              </div>
            )
          })}
        </div>
        <div className="flex px-1 pb-1">
          {phases.map((phase, i) => {
            const width = ((phase.endWeek - phase.startWeek + 1) / totalWeeks) * 100
            return (
              <div key={i} style={{ width: `${width}%` }} className="text-center px-0.5">
                <span style={{ fontSize: 10, color: 'rgba(241,245,249,0.3)' }}>
                  {phase.startWeek === phase.endWeek ? `Wk ${phase.startWeek}` : `Wk ${phase.startWeek}–${phase.endWeek}`}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {totalAssigned !== totalWeeks && (
        <p className="text-xs px-3 py-2 rounded-lg" style={{ backgroundColor: 'rgba(239,68,68,0.08)', color: '#EF4444' }}>
          Phases cover {totalAssigned} of {totalWeeks} weeks — adjust the week ranges below.
        </p>
      )}

      {/* Phase cards */}
      <div className="space-y-4">
        {phases.map((phase, idx) => {
          const hue = [210, 140, 45, 10, 0][idx] ?? 270
          return (
            <div key={idx} className="rounded-xl p-4 space-y-3" style={{ backgroundColor: '#0E1520', border: '1px solid rgba(241,245,249,0.07)' }}>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: `hsla(${hue},70%,55%,1)` }} />
                <input
                  value={phase.name}
                  onChange={e => updatePhase(idx, { name: e.target.value })}
                  className="flex-1 bg-transparent text-sm font-semibold text-sp-text border-b outline-none focus:border-sp-orange"
                  style={{ borderBottomColor: 'rgba(241,245,249,0.1)' }}
                />
                {phases.length > 1 && (
                  <button onClick={() => removePhase(idx)} className="text-xs hover:opacity-60" style={{ color: 'rgba(241,245,249,0.3)' }}>✕</button>
                )}
              </div>

              {/* Week range stepper */}
              <div className="flex items-center gap-3">
                <span className="text-xs" style={{ color: 'rgba(241,245,249,0.4)' }}>Weeks</span>
                <div className="flex items-center gap-1.5">
                  {idx > 0 && (
                    <button onClick={() => moveDivider(idx - 1, 1)} className="w-6 h-6 rounded text-xs hover:opacity-80" style={{ backgroundColor: 'rgba(241,245,249,0.06)', color: 'rgba(241,245,249,0.5)' }}>−</button>
                  )}
                  <span className="text-sm font-semibold text-sp-text px-1">
                    {phase.startWeek}–{phase.endWeek}
                    <span className="text-xs ml-1.5 font-normal" style={{ color: 'rgba(241,245,249,0.4)' }}>({phase.endWeek - phase.startWeek + 1} wks)</span>
                  </span>
                  {idx < phases.length - 1 && (
                    <button onClick={() => moveDivider(idx, 1)} className="w-6 h-6 rounded text-xs hover:opacity-80" style={{ backgroundColor: 'rgba(241,245,249,0.06)', color: 'rgba(241,245,249,0.5)' }}>+</button>
                  )}
                </div>
              </div>

              {/* Description */}
              <input
                value={phase.description}
                onChange={e => updatePhase(idx, { description: e.target.value })}
                className="sp-input text-xs py-1.5"
                placeholder="What will the team accomplish this phase?"
              />

              {/* Focus areas */}
              <div>
                <p className="text-xs mb-1.5" style={{ color: 'rgba(241,245,249,0.4)' }}>Focus Areas (up to 3)</p>
                <div className="flex flex-wrap gap-1.5">
                  {FOCUS_OPTIONS.map(({ key, color }) => {
                    const active = phase.focusAreas.includes(key)
                    return (
                      <button
                        key={key}
                        onClick={() => {
                          const next = active
                            ? phase.focusAreas.filter(f => f !== key)
                            : phase.focusAreas.length < 3 ? [...phase.focusAreas, key] : phase.focusAreas
                          updatePhase(idx, { focusAreas: next })
                        }}
                        className="px-2.5 py-1 rounded-full text-xs font-medium transition-all"
                        style={{
                          backgroundColor: active ? `${color}22` : 'rgba(241,245,249,0.04)',
                          color: active ? color : 'rgba(241,245,249,0.4)',
                          border: `1px solid ${active ? color + '55' : 'rgba(241,245,249,0.08)'}`,
                        }}
                      >
                        {key}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Intensity */}
              <div className="flex items-center gap-3">
                <span className="text-xs" style={{ color: 'rgba(241,245,249,0.4)' }}>Intensity</span>
                <div className="flex gap-1.5">
                  {([1,2,3,4,5] as const).map(n => (
                    <button
                      key={n}
                      onClick={() => updatePhase(idx, { intensity: n })}
                      className="w-7 h-7 rounded-lg text-xs font-bold transition-all"
                      style={{
                        backgroundColor: n <= phase.intensity ? INTENSITY_COLORS[n] + '33' : 'rgba(241,245,249,0.04)',
                        color: n <= phase.intensity ? INTENSITY_COLORS[n] : 'rgba(241,245,249,0.2)',
                        border: `1px solid ${n <= phase.intensity ? INTENSITY_COLORS[n] + '60' : 'rgba(241,245,249,0.07)'}`,
                      }}
                    >
                      {n}
                    </button>
                  ))}
                  <span className="text-xs self-center ml-1" style={{ color: INTENSITY_COLORS[phase.intensity] }}>
                    {INTENSITY_LABELS[phase.intensity]}
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <button onClick={addPhase} className="w-full py-2.5 rounded-xl text-sm font-medium transition-opacity hover:opacity-70" style={{ border: '1px dashed rgba(241,245,249,0.15)', color: 'rgba(241,245,249,0.4)' }}>
        + Add Phase
      </button>

      <div className="flex justify-between pt-2">
        <button onClick={onBack} className="px-5 py-2 text-sm font-medium" style={{ color: 'rgba(241,245,249,0.4)' }}>← Back</button>
        <button
          onClick={onNext}
          disabled={totalAssigned !== totalWeeks}
          className="px-6 py-2.5 text-sm font-semibold rounded-xl transition-opacity hover:opacity-85 disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ backgroundColor: '#F7620A', color: '#fff' }}
        >
          Next: Weekly Arc →
        </button>
      </div>
    </div>
  )
}

// ── Step 3: Weekly Arc ────────────────────────────────────────────────────────

function Step3WeeklyArc({ weeks, phases, teamWeaknesses, onWeeksChange, onNext, onBack }: {
  weeks: WeeklyFocus[]
  phases: SeasonPhase[]
  teamWeaknesses: string[]
  onWeeksChange: (weeks: WeeklyFocus[]) => void
  onNext: () => void
  onBack: () => void
}) {
  const [editingCell, setEditingCell] = useState<{ week: number; field: 'primaryFocus' | 'secondaryFocus' | 'intensity' } | null>(null)

  function updateWeek(weekNum: number, updates: Partial<WeeklyFocus>) {
    onWeeksChange(weeks.map(w => w.week === weekNum ? { ...w, ...updates } : w))
  }

  const phaseName = (week: number) => getPhaseName(week, phases)

  return (
    <div className="space-y-4">
      {teamWeaknesses.length > 0 && (
        <div className="flex items-start gap-3 px-4 py-3 rounded-xl" style={{ backgroundColor: 'rgba(247,98,10,0.08)', border: '1px solid rgba(247,98,10,0.2)' }}>
          <span style={{ color: '#F7620A' }}>📊</span>
          <div>
            <p className="text-xs font-semibold" style={{ color: '#F7620A' }}>Using your team&apos;s eval data</p>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(241,245,249,0.5)' }}>
              Lowest scoring skills — {teamWeaknesses.join(', ')} — have been weighted for more focus weeks.
            </p>
          </div>
        </div>
      )}

      <div className="overflow-x-auto rounded-xl" style={{ border: '1px solid rgba(241,245,249,0.07)' }}>
        <table className="w-full min-w-[640px]" style={{ borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: 'rgba(241,245,249,0.04)', borderBottom: '1px solid rgba(241,245,249,0.07)' }}>
              {['Wk', 'Phase', 'Primary Focus', 'Secondary Focus', 'Intensity'].map(h => (
                <th key={h} className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: 'rgba(241,245,249,0.35)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {weeks.map((wk, i) => {
              const phase = phaseName(wk.week)
              const primaryColor  = FOCUS_COLOR[wk.primaryFocus] ?? '#6B7A99'
              const secondaryColor = FOCUS_COLOR[wk.secondaryFocus] ?? '#6B7A99'
              const isEditing = (field: string) => editingCell?.week === wk.week && editingCell?.field === field

              return (
                <tr key={wk.week} style={{ borderBottom: '1px solid rgba(241,245,249,0.04)', backgroundColor: i % 2 === 0 ? 'transparent' : 'rgba(241,245,249,0.01)' }}>
                  <td className="px-3 py-2 text-sm font-semibold" style={{ color: 'rgba(241,245,249,0.5)', width: 40 }}>{wk.week}</td>
                  <td className="px-3 py-2 text-xs" style={{ color: 'rgba(241,245,249,0.4)', whiteSpace: 'nowrap' }}>{phase}</td>

                  {/* Primary focus */}
                  <td className="px-3 py-2" style={{ width: 160 }}>
                    {isEditing('primaryFocus') ? (
                      <select
                        autoFocus
                        value={wk.primaryFocus}
                        onChange={e => { updateWeek(wk.week, { primaryFocus: e.target.value }); setEditingCell(null) }}
                        onBlur={() => setEditingCell(null)}
                        className="sp-input py-1 text-xs"
                        style={{ colorScheme: 'dark' }}
                      >
                        {FOCUS_OPTIONS.map(f => <option key={f.key} value={f.key} style={{ backgroundColor: '#0E1520' }}>{f.key}</option>)}
                      </select>
                    ) : (
                      <button onClick={() => setEditingCell({ week: wk.week, field: 'primaryFocus' })}
                        className="px-2 py-0.5 rounded-full text-xs font-medium transition-opacity hover:opacity-75"
                        style={{ backgroundColor: primaryColor + '22', color: primaryColor, border: `1px solid ${primaryColor}44` }}
                      >{wk.primaryFocus}</button>
                    )}
                  </td>

                  {/* Secondary focus */}
                  <td className="px-3 py-2" style={{ width: 160 }}>
                    {isEditing('secondaryFocus') ? (
                      <select
                        autoFocus
                        value={wk.secondaryFocus}
                        onChange={e => { updateWeek(wk.week, { secondaryFocus: e.target.value }); setEditingCell(null) }}
                        onBlur={() => setEditingCell(null)}
                        className="sp-input py-1 text-xs"
                        style={{ colorScheme: 'dark' }}
                      >
                        {FOCUS_OPTIONS.map(f => <option key={f.key} value={f.key} style={{ backgroundColor: '#0E1520' }}>{f.key}</option>)}
                      </select>
                    ) : (
                      <button onClick={() => setEditingCell({ week: wk.week, field: 'secondaryFocus' })}
                        className="px-2 py-0.5 rounded-full text-xs font-medium transition-opacity hover:opacity-75"
                        style={{ backgroundColor: secondaryColor + '18', color: secondaryColor, border: `1px solid ${secondaryColor}30` }}
                      >{wk.secondaryFocus}</button>
                    )}
                  </td>

                  {/* Intensity */}
                  <td className="px-3 py-2">
                    <div className="flex gap-0.5">
                      {[1,2,3,4,5].map(n => (
                        <button key={n} onClick={() => updateWeek(wk.week, { intensity: n as 1|2|3|4|5 })}
                          className="w-4 h-4 rounded-sm transition-all"
                          style={{ backgroundColor: n <= wk.intensity ? INTENSITY_COLORS[n] : 'rgba(241,245,249,0.08)' }}
                        />
                      ))}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="flex justify-between pt-2">
        <button onClick={onBack} className="px-5 py-2 text-sm font-medium" style={{ color: 'rgba(241,245,249,0.4)' }}>← Back</button>
        <button onClick={onNext} className="px-6 py-2.5 text-sm font-semibold rounded-xl transition-opacity hover:opacity-85" style={{ backgroundColor: '#F7620A', color: '#fff' }}>
          Next: Characters →
        </button>
      </div>
    </div>
  )
}

// ── Step 4: Character Themes ──────────────────────────────────────────────────

function Step4Characters({ sequence, totalWeeks, onChange, onNext, onBack }: {
  sequence: string[]
  totalWeeks: number
  onChange: (seq: string[]) => void
  onNext: () => void
  onBack: () => void
}) {
  const dragIdx = useRef<number | null>(null)

  function moveTheme(from: number, to: number) {
    const next = [...sequence]
    const [item] = next.splice(from, 1)
    next.splice(to, 0, item)
    onChange(next)
  }

  function getWeeksForTheme(idx: number): string {
    const weeksPerTheme = Math.max(1, Math.ceil(totalWeeks / sequence.length))
    const start = idx * weeksPerTheme + 1
    const end   = Math.min(totalWeeks, (idx + 1) * weeksPerTheme)
    return start === end ? `Wk ${start}` : `Wk ${start}–${end}`
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm" style={{ color: 'rgba(241,245,249,0.5)' }}>Drag themes to reorder. Each covers ~{Math.ceil(totalWeeks / sequence.length)} week(s).</p>
        <div className="flex gap-2">
          <button onClick={() => onChange([...RECOMMENDED_THEMES].slice(0, sequence.length))} className="text-xs px-3 py-1.5 rounded-lg transition-opacity hover:opacity-75" style={{ backgroundColor: 'rgba(241,245,249,0.06)', color: 'rgba(241,245,249,0.5)', border: '1px solid rgba(241,245,249,0.1)' }}>
            Recommended
          </button>
          <button onClick={() => onChange([...sequence].sort(() => Math.random() - 0.5))} className="text-xs px-3 py-1.5 rounded-lg transition-opacity hover:opacity-75" style={{ backgroundColor: 'rgba(241,245,249,0.06)', color: 'rgba(241,245,249,0.5)', border: '1px solid rgba(241,245,249,0.1)' }}>
            Randomize
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {sequence.map((themeName, idx) => {
          const theme = CHARACTER_THEMES.find(t => t.name === themeName)
          if (!theme) return null
          return (
            <div
              key={themeName}
              draggable
              onDragStart={() => { dragIdx.current = idx }}
              onDragOver={e => e.preventDefault()}
              onDrop={() => {
                if (dragIdx.current !== null && dragIdx.current !== idx) {
                  moveTheme(dragIdx.current, idx)
                }
                dragIdx.current = null
              }}
              className="flex items-center gap-3 px-4 py-3 rounded-xl cursor-grab active:cursor-grabbing transition-colors hover:border-opacity-20"
              style={{ backgroundColor: '#0E1520', border: '1px solid rgba(241,245,249,0.07)' }}
            >
              <span style={{ fontSize: 20, flexShrink: 0 }}>{theme.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-sp-text">{theme.name}</p>
                <p className="text-xs mt-0.5 truncate" style={{ color: 'rgba(241,245,249,0.4)' }}>{theme.description}</p>
              </div>
              <span className="text-xs font-medium flex-shrink-0 px-2 py-0.5 rounded" style={{ backgroundColor: 'rgba(247,98,10,0.1)', color: '#F7620A' }}>
                {getWeeksForTheme(idx)}
              </span>
              {/* Up/down buttons — visible on touch, hidden on desktop where drag works */}
              <div className="flex flex-col gap-0.5 sm:hidden flex-shrink-0">
                <button
                  disabled={idx === 0}
                  onClick={() => moveTheme(idx, idx - 1)}
                  className="w-6 h-5 rounded text-xs leading-none disabled:opacity-20"
                  style={{ backgroundColor: 'rgba(241,245,249,0.06)', color: 'rgba(241,245,249,0.5)' }}
                >▲</button>
                <button
                  disabled={idx === sequence.length - 1}
                  onClick={() => moveTheme(idx, idx + 1)}
                  className="w-6 h-5 rounded text-xs leading-none disabled:opacity-20"
                  style={{ backgroundColor: 'rgba(241,245,249,0.06)', color: 'rgba(241,245,249,0.5)' }}
                >▼</button>
              </div>
              <span className="hidden sm:block text-xs flex-shrink-0" style={{ color: 'rgba(241,245,249,0.2)' }}>⠿</span>
            </div>
          )
        })}
      </div>

      <div className="flex justify-between pt-2">
        <button onClick={onBack} className="px-5 py-2 text-sm font-medium" style={{ color: 'rgba(241,245,249,0.4)' }}>← Back</button>
        <button onClick={onNext} className="px-6 py-2.5 text-sm font-semibold rounded-xl transition-opacity hover:opacity-85" style={{ backgroundColor: '#F7620A', color: '#fff' }}>
          Next: Review →
        </button>
      </div>
    </div>
  )
}

// ── Step 5: Review ────────────────────────────────────────────────────────────

function Step5Review({ setup, phases, weeks, themes, onSaveDraft, onGenerate, onBack, isSaving, progress }: {
  setup: SetupData
  phases: SeasonPhase[]
  weeks: WeeklyFocus[]
  themes: string[]
  onSaveDraft: () => void
  onGenerate: () => void
  onBack: () => void
  isSaving: boolean
  progress: number | null
}) {
  const totalWeeks     = calcTotalWeeks(setup.startDate, setup.endDate)
  const totalPractices = totalWeeks * setup.practicesPerWeek

  // Skills coverage
  const coverage: Record<string, { primary: number; secondary: number }> = {}
  for (const f of FOCUS_OPTIONS) coverage[f.key] = { primary: 0, secondary: 0 }
  for (const w of weeks) {
    if (coverage[w.primaryFocus])   coverage[w.primaryFocus].primary++
    if (coverage[w.secondaryFocus]) coverage[w.secondaryFocus].secondary++
  }
  const missing = FOCUS_OPTIONS.filter(f => coverage[f.key].primary + coverage[f.key].secondary === 0)

  return (
    <div className="space-y-6">
      {/* Overview */}
      <div className="rounded-xl p-5" style={{ backgroundColor: '#0E1520', border: '1px solid rgba(241,245,249,0.07)' }}>
        <div className="flex items-start justify-between mb-3">
          <div>
            <h2 className={`text-2xl text-sp-text ${barlow.className}`}>{setup.name}</h2>
            <p className="text-sm mt-0.5" style={{ color: 'rgba(241,245,249,0.5)' }}>
              {totalWeeks} weeks · {totalPractices} practices · {setup.ageGroup} · {setup.skillLevel}
            </p>
          </div>
          <span className="text-xs font-semibold px-2 py-1 rounded-lg capitalize" style={{ backgroundColor: 'rgba(247,98,10,0.1)', color: '#F7620A', border: '1px solid rgba(247,98,10,0.2)' }}>
            {setup.seasonType.toUpperCase()}
          </span>
        </div>
        <p className="text-xs" style={{ color: 'rgba(241,245,249,0.4)' }}>
          {new Date(setup.startDate + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} —{' '}
          {new Date(setup.endDate   + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
        </p>
      </div>

      {/* Phase bars */}
      <div className="rounded-xl p-4" style={{ backgroundColor: '#0E1520', border: '1px solid rgba(241,245,249,0.07)' }}>
        <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'rgba(241,245,249,0.3)' }}>Season Phases</p>
        <div className="space-y-2">
          {phases.map((p, i) => {
            const pct = ((p.endWeek - p.startWeek + 1) / totalWeeks) * 100
            const hue = [210, 140, 45, 10, 0][i] ?? 270
            return (
              <div key={i} className="flex items-center gap-3">
                <div className="w-28 text-xs truncate flex-shrink-0" style={{ color: 'rgba(241,245,249,0.6)' }}>{p.name}</div>
                <div className="flex-1 rounded-full overflow-hidden" style={{ height: 8, backgroundColor: 'rgba(241,245,249,0.06)' }}>
                  <div style={{ width: `${pct}%`, height: '100%', backgroundColor: `hsla(${hue},70%,55%,0.7)`, borderRadius: 4 }} />
                </div>
                <div className="text-xs w-16 flex-shrink-0" style={{ color: 'rgba(241,245,249,0.3)' }}>
                  {p.endWeek - p.startWeek + 1} wks
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Skills coverage */}
      <div className="rounded-xl p-4" style={{ backgroundColor: '#0E1520', border: '1px solid rgba(241,245,249,0.07)' }}>
        <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'rgba(241,245,249,0.3)' }}>Skills Coverage</p>
        <div className="overflow-x-auto">
          <table className="w-full text-xs" style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Skill', 'Primary', 'Secondary', 'Total'].map(h => (
                  <th key={h} className="pb-2 text-left font-semibold pr-4" style={{ color: 'rgba(241,245,249,0.3)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FOCUS_OPTIONS.map(({ key, color }) => {
                const { primary, secondary } = coverage[key]
                const total = primary + secondary
                return (
                  <tr key={key} style={{ borderTop: '1px solid rgba(241,245,249,0.04)' }}>
                    <td className="py-1.5 pr-4 font-medium" style={{ color }}>{key}</td>
                    <td className="py-1.5 pr-4" style={{ color: 'rgba(241,245,249,0.6)' }}>{primary}</td>
                    <td className="py-1.5 pr-4" style={{ color: 'rgba(241,245,249,0.6)' }}>{secondary}</td>
                    <td className="py-1.5 font-bold" style={{ color: total === 0 ? '#EF4444' : 'rgba(241,245,249,0.8)' }}>{total}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {missing.length > 0 && (
          <p className="mt-2 text-xs px-3 py-2 rounded-lg" style={{ backgroundColor: 'rgba(239,68,68,0.08)', color: '#EF4444' }}>
            {missing.map(f => f.key).join(', ')} {missing.length === 1 ? 'has' : 'have'} 0 weeks — consider adding them in the Weekly Arc.
          </p>
        )}
      </div>

      {/* Theme timeline */}
      <div className="rounded-xl p-4" style={{ backgroundColor: '#0E1520', border: '1px solid rgba(241,245,249,0.07)' }}>
        <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'rgba(241,245,249,0.3)' }}>Character Theme Timeline</p>
        <div className="flex flex-wrap gap-1.5">
          {themes.map((t, i) => {
            const theme = CHARACTER_THEMES.find(th => th.name === t)
            const weeksPerTheme = Math.max(1, Math.ceil(totalWeeks / themes.length))
            const start = i * weeksPerTheme + 1
            const end   = Math.min(totalWeeks, (i + 1) * weeksPerTheme)
            return (
              <div key={t} className="flex flex-col items-center gap-0.5">
                <span className="text-xs px-2 py-0.5 rounded font-medium" style={{ backgroundColor: 'rgba(247,98,10,0.1)', color: '#F7620A' }}>
                  {theme?.icon} {t}
                </span>
                <span style={{ fontSize: 10, color: 'rgba(241,245,249,0.3)' }}>
                  {start === end ? `Wk ${start}` : `${start}–${end}`}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Progress */}
      {progress !== null && (
        <div className="rounded-xl p-4 space-y-2" style={{ backgroundColor: 'rgba(247,98,10,0.06)', border: '1px solid rgba(247,98,10,0.2)' }}>
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium" style={{ color: '#F7620A' }}>
              Creating practices... {progress} of {totalPractices}
            </p>
            <span className="text-xs" style={{ color: 'rgba(241,245,249,0.4)' }}>{Math.round((progress / totalPractices) * 100)}%</span>
          </div>
          <div className="rounded-full overflow-hidden" style={{ height: 6, backgroundColor: 'rgba(241,245,249,0.06)' }}>
            <div style={{ width: `${(progress / totalPractices) * 100}%`, height: '100%', backgroundColor: '#F7620A', borderRadius: 3, transition: 'width 0.3s' }} />
          </div>
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <button onClick={onBack} disabled={isSaving} className="px-5 py-2 text-sm font-medium" style={{ color: 'rgba(241,245,249,0.4)' }}>← Back</button>
        <button onClick={onSaveDraft} disabled={isSaving} className="px-5 py-2.5 text-sm font-semibold rounded-xl disabled:opacity-50 transition-opacity hover:opacity-85" style={{ backgroundColor: 'rgba(241,245,249,0.08)', color: 'rgba(241,245,249,0.7)', border: '1px solid rgba(241,245,249,0.12)' }}>
          Save as Draft
        </button>
        <button onClick={onGenerate} disabled={isSaving} className="flex-1 py-2.5 text-sm font-semibold rounded-xl disabled:opacity-50 transition-opacity hover:opacity-85" style={{ backgroundColor: '#F7620A', color: '#fff' }}>
          {isSaving ? 'Generating...' : `Generate Season Plan → (${totalPractices} practices)`}
        </button>
      </div>
    </div>
  )
}

// ── Season Plan List ──────────────────────────────────────────────────────────

function SeasonPlanCard({ plan, onDelete, onEdit }: { plan: SeasonPlan; onDelete: () => void; onEdit: () => void }) {
  const [confirmDel, setConfirmDel] = useState(false)
  const totalPractices = plan.total_weeks * plan.practices_per_week

  return (
    <div className="rounded-xl p-5" style={{ backgroundColor: '#0E1520', border: '1px solid rgba(241,245,249,0.07)' }}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold px-2 py-0.5 rounded uppercase" style={{ backgroundColor: 'rgba(247,98,10,0.1)', color: '#F7620A' }}>
              {plan.season_type}
            </span>
            <span className="text-xs px-2 py-0.5 rounded capitalize" style={{
              backgroundColor: plan.status === 'active' ? 'rgba(34,197,94,0.1)' : plan.status === 'completed' ? 'rgba(107,122,153,0.1)' : 'rgba(241,245,249,0.06)',
              color: plan.status === 'active' ? '#22C55E' : plan.status === 'completed' ? '#6B7A99' : 'rgba(241,245,249,0.4)',
            }}>
              {plan.status}
            </span>
          </div>
          <h3 className={`text-xl text-sp-text ${barlow.className}`}>{plan.name}</h3>
          <p className="text-xs mt-0.5" style={{ color: 'rgba(241,245,249,0.4)' }}>
            {plan.total_weeks} weeks · {totalPractices} practices · {plan.age_group ?? '—'} · {plan.practice_duration_mins} min
          </p>
        </div>
        {confirmDel ? (
          <div className="flex gap-2 items-center flex-shrink-0">
            <button onClick={onDelete} className="text-xs px-3 py-1.5 rounded-lg font-medium" style={{ backgroundColor: 'rgba(239,68,68,0.15)', color: '#EF4444' }}>Delete</button>
            <button onClick={() => setConfirmDel(false)} className="text-xs" style={{ color: 'rgba(241,245,249,0.4)' }}>Cancel</button>
          </div>
        ) : (
          <button onClick={() => setConfirmDel(true)} className="text-xs hover:opacity-60" style={{ color: 'rgba(241,245,249,0.2)' }}>✕</button>
        )}
      </div>

      <p className="text-xs mb-3" style={{ color: 'rgba(241,245,249,0.35)' }}>
        {new Date(plan.start_date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} –{' '}
        {new Date(plan.end_date   + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
      </p>

      {plan.phases.length > 0 && (
        <div className="flex gap-1 mb-3">
          {plan.phases.map((p, i) => {
            const hue = [210, 140, 45, 10, 0][i] ?? 270
            return (
              <span key={i} className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: `hsla(${hue},70%,55%,0.12)`, color: `hsla(${hue},70%,65%,1)` }}>
                {p.name}
              </span>
            )
          })}
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={onEdit}
          className="py-2 px-3 text-xs font-bold rounded-lg transition-opacity hover:opacity-80"
          style={{ backgroundColor: 'rgba(241,245,249,0.06)', color: 'rgba(241,245,249,0.6)', border: '1px solid rgba(241,245,249,0.1)' }}
        >
          Edit
        </button>
        <Link
          href={`/practice/planner`}
          className="flex-1 py-2 text-center text-xs font-bold rounded-lg transition-opacity hover:opacity-80"
          style={{ backgroundColor: 'rgba(241,245,249,0.06)', color: 'rgba(241,245,249,0.6)', border: '1px solid rgba(241,245,249,0.1)' }}
        >
          View Practices
        </Link>
        <Link
          href="/calendar"
          className="flex-1 py-2 text-center text-xs font-bold rounded-lg transition-opacity hover:opacity-80"
          style={{ backgroundColor: 'rgba(247,98,10,0.1)', color: '#F7620A', border: '1px solid rgba(247,98,10,0.2)' }}
        >
          Calendar
        </Link>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function SeasonPlanPage() {
  const { data: seasonPlans = [], isLoading: plansLoading } = useSeasonPlans()
  const { data: evaluations = [] } = useEvaluations()
  const { mutateAsync: createSeasonPlan } = useCreateSeasonPlan()
  const { mutateAsync: updateSeasonPlan } = useUpdateSeasonPlan()
  const { mutateAsync: createPracticePlan } = useCreatePracticePlan()
  const { mutate: deleteSeasonPlan, mutateAsync: deleteSeasonPlanAsync } = useDeleteSeasonPlan()

  const [mode, setMode] = useState<'list' | 'wizard'>('list')
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null)
  const [step, setStep] = useState(0)
  const [isSaving, setIsSaving] = useState(false)
  const [progress, setProgress] = useState<number | null>(null)
  const [error, setError] = useState('')

  // Wizard state
  const [setup, setSetup] = useState<SetupData>({
    name: '', seasonType: 'rec',
    startDate: '', endDate: '',
    practicesPerWeek: 2, practiceDuration: 75,
    ageGroup: 'U12', skillLevel: 'Mixed',
  })

  const totalWeeks = calcTotalWeeks(setup.startDate, setup.endDate)

  const [phases, setPhases] = useState<SeasonPhase[]>([])
  const [weeklyArc, setWeeklyArc] = useState<WeeklyFocus[]>([])
  const [themeSequence, setThemeSequence] = useState<string[]>(RECOMMENDED_THEMES)

  function startEdit(plan: SeasonPlan) {
    setEditingPlanId(plan.id)
    setSetup({
      name: plan.name,
      seasonType: plan.season_type,
      startDate: plan.start_date,
      endDate: plan.end_date,
      practicesPerWeek: plan.practices_per_week,
      practiceDuration: plan.practice_duration_mins,
      ageGroup: plan.age_group ?? 'U12',
      skillLevel: plan.skill_level,
    })
    setPhases(plan.phases)
    setWeeklyArc(plan.weekly_focus_rotation)
    setThemeSequence(plan.character_theme_sequence.length > 0 ? plan.character_theme_sequence : RECOMMENDED_THEMES)
    setStep(0)
    setMode('wizard')
  }

  function startNew() {
    setEditingPlanId(null)
    setSetup({ name: '', seasonType: 'rec', startDate: '', endDate: '', practicesPerWeek: 2, practiceDuration: 75, ageGroup: 'U12', skillLevel: 'Mixed' })
    setPhases([])
    setWeeklyArc([])
    setThemeSequence(RECOMMENDED_THEMES)
    setStep(0)
    setMode('wizard')
  }

  // Team weaknesses from eval data
  const teamWeaknesses = useMemo(() => {
    if (evaluations.length === 0) return []
    const skillKeys = ['ball_handling','shooting','passing','defense','athleticism','coachability']
    const focusMap: Record<string, string> = {
      ball_handling: 'Ball Handling', shooting: 'Shooting', passing: 'Passing',
      defense: 'Defense', athleticism: 'Conditioning', coachability: 'Team Play',
    }
    const sums: Record<string, number[]> = {}
    for (const sk of skillKeys) sums[sk] = []
    for (const ev of evaluations) {
      for (const sk of skillKeys) {
        const val = (ev as unknown as Record<string, unknown>)[sk]
        if (typeof val === 'number') sums[sk].push(val)
      }
    }
    const avgs = skillKeys
      .filter(sk => sums[sk].length > 0)
      .map(sk => ({ sk, avg: sums[sk].reduce((a, b) => a + b, 0) / sums[sk].length }))
      .sort((a, b) => a.avg - b.avg)
    return avgs.slice(0, 2).map(x => focusMap[x.sk]).filter(Boolean)
  }, [evaluations])

  // When moving to phases step, initialize phases from season type
  const initPhases = useCallback(() => {
    if (totalWeeks > 0) setPhases(defaultPhases(totalWeeks, setup.seasonType))
  }, [totalWeeks, setup.seasonType])

  // When moving to weekly arc step, auto-fill
  const initWeeklyArc = useCallback(() => {
    setWeeklyArc(autoFillWeeks(totalWeeks, phases, themeSequence, teamWeaknesses))
  }, [totalWeeks, phases, themeSequence, teamWeaknesses])

  function goToStep(n: number) {
    if (n === 1 && step === 0) initPhases()
    // Only auto-fill arc when it's empty or phases changed total_weeks (wrong length).
    // Preserves manual edits when user goes back to adjust phases without changing duration.
    if (n === 2 && step === 1 && weeklyArc.length !== totalWeeks) initWeeklyArc()
    setStep(n)
  }

  const seasonPayload = () => ({
    name: setup.name,
    season_type: setup.seasonType,
    start_date: setup.startDate,
    end_date: setup.endDate,
    practices_per_week: setup.practicesPerWeek,
    practice_duration_mins: setup.practiceDuration,
    age_group: setup.ageGroup,
    skill_level: setup.skillLevel,
    phases,
    weekly_focus_rotation: weeklyArc,
    character_theme_sequence: themeSequence,
    use_player_evals: teamWeaknesses.length > 0,
    team_weaknesses: teamWeaknesses.length > 0 ? teamWeaknesses : null,
  })

  async function handleSaveDraft() {
    setIsSaving(true)
    setError('')
    try {
      if (editingPlanId) {
        await updateSeasonPlan({ id: editingPlanId, ...seasonPayload(), status: 'draft' })
      } else {
        await createSeasonPlan({ ...seasonPayload(), status: 'draft' })
      }
      setMode('list')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleGenerate() {
    setIsSaving(true)
    setError('')
    setProgress(0)
    try {
      // 1. Create or update the season plan
      let seasonPlan
      if (editingPlanId) {
        // Delete old generated practices before regenerating
        const supabase = createClient()
        await supabase.from('practice_plans').delete().eq('season_plan_id', editingPlanId)
        seasonPlan = await updateSeasonPlan({ id: editingPlanId, ...seasonPayload(), status: 'active' })
      } else {
        seasonPlan = await createSeasonPlan({ ...seasonPayload(), status: 'active' })
      }

      // 2. Generate practice plans for each week × practice
      let count = 0
      try {
        for (const wk of weeklyArc) {
          for (let p = 1; p <= setup.practicesPerWeek; p++) {
            const focusAreas = [wk.primaryFocus, wk.secondaryFocus].filter(Boolean)
            const drillList  = pickDrills(focusAreas, setup.practiceDuration, setup.skillLevel)
            const dateStr    = calcPracticeDate(setup.startDate, wk.week, p, setup.practicesPerWeek)
            count++

            await createPracticePlan({
              name:            `Week ${wk.week}, Practice ${p} — ${wk.primaryFocus}`,
              age_group:       setup.ageGroup,
              duration_mins:   setup.practiceDuration,
              focus_areas:     focusAreas,
              character_theme: wk.characterTheme || null,
              drills:          drillList,
              is_template:     false,
              season_plan_id:  seasonPlan.id,
              scheduled_date:  dateStr,
            })
            setProgress(count)
          }
        }
      } catch (genErr) {
        // Roll back: delete the season plan row (cascades to any practice plans already created)
        await deleteSeasonPlanAsync(seasonPlan.id)
        throw genErr
      }

      setMode('list')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed')
    } finally {
      setIsSaving(false)
      setProgress(null)
    }
  }

  // ── Render ──

  if (mode === 'list') {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-sp-text">Season Plan Builder</h1>
            <p className="text-sm mt-0.5" style={{ color: 'rgba(241,245,249,0.4)' }}>
              Build a connected curriculum for the whole season
            </p>
          </div>
          <button
            onClick={startNew}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg transition-opacity hover:opacity-85"
            style={{ backgroundColor: '#F7620A', color: '#fff' }}
          >
            + New Season Plan
          </button>
        </div>

        {plansLoading ? (
          <p className="text-sm py-12 text-center" style={{ color: 'rgba(241,245,249,0.35)' }}>Loading...</p>
        ) : seasonPlans.length === 0 ? (
          <div className="rounded-xl p-8 flex flex-col items-center text-center" style={{ border: '1px dashed rgba(241,245,249,0.12)' }}>
            <p className="text-base font-semibold text-sp-text mb-1">No season plans yet</p>
            <p className="text-sm mb-5" style={{ color: 'rgba(241,245,249,0.4)' }}>
              Build a connected curriculum where every practice builds on the last.
            </p>
            <button onClick={startNew} className="px-5 py-2 text-sm font-semibold rounded-xl transition-opacity hover:opacity-85" style={{ backgroundColor: '#F7620A', color: '#fff' }}>
              Start Season Plan
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {seasonPlans.map(plan => (
              <SeasonPlanCard key={plan.id} plan={plan} onDelete={() => deleteSeasonPlan(plan.id)} onEdit={() => startEdit(plan)} />
            ))}
          </div>
        )}
      </div>
    )
  }

  // Wizard mode
  const stepTitles = ['Season Setup', 'Season Phases', 'Weekly Focus Arc', 'Character Themes', 'Review & Generate']

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => setMode('list')} className="text-sm transition-opacity hover:opacity-60" style={{ color: 'rgba(241,245,249,0.4)' }}>← Back</button>
        <h1 className="text-2xl font-bold text-sp-text">{editingPlanId ? 'Edit: ' : ''}{stepTitles[step]}</h1>
      </div>

      <StepIndicator current={step} />

      {error && <p className="mb-4 text-sm text-red-400 px-3 py-2 rounded-lg" style={{ backgroundColor: 'rgba(239,68,68,0.08)' }}>{error}</p>}

      {step === 0 && (
        <Step1Setup data={setup} onChange={setSetup} onNext={() => goToStep(1)} />
      )}
      {step === 1 && (
        <Step2Phases phases={phases} totalWeeks={totalWeeks} onChange={setPhases} onNext={() => goToStep(2)} onBack={() => setStep(0)} />
      )}
      {step === 2 && (
        <Step3WeeklyArc weeks={weeklyArc} phases={phases} teamWeaknesses={teamWeaknesses} onWeeksChange={setWeeklyArc} onNext={() => setStep(3)} onBack={() => setStep(1)} />
      )}
      {step === 3 && (
        <Step4Characters sequence={themeSequence} totalWeeks={totalWeeks} onChange={setThemeSequence} onNext={() => setStep(4)} onBack={() => setStep(2)} />
      )}
      {step === 4 && (
        <Step5Review setup={setup} phases={phases} weeks={weeklyArc} themes={themeSequence} onSaveDraft={handleSaveDraft} onGenerate={handleGenerate} onBack={() => setStep(3)} isSaving={isSaving} progress={progress} />
      )}
    </div>
  )
}
