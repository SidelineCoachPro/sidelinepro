'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Barlow_Condensed } from 'next/font/google'
import {
  useSeasonPlan,
  type SeasonPlan,
  type SeasonPhase,
  type WeeklyFocus,
} from '@/hooks/useSeasonPlans'
import { usePracticePlans, type PracticePlan } from '@/hooks/usePracticePlans'
import PracticeSubNav from '../../components/PracticeSubNav'

const barlow = Barlow_Condensed({ subsets: ['latin'], weight: '900' })

// ── Constants ──────────────────────────────────────────────────────────────────

const FOCUS_COLOR: Record<string, string> = {
  'Ball Handling': '#F7620A',
  'Shooting': '#38BDF8',
  'Passing': '#F5B731',
  'Defense': '#22C55E',
  'Conditioning': '#E879F9',
  'Team Play': '#8B5CF6',
}

const THEME_COLOR: Record<string, string> = {
  'Accountability': '#F7620A',
  'Teamwork': '#3A86FF',
  'Grit': '#F5B731',
  'Empathy': '#0ECFB0',
  'Leadership': '#8B5CF6',
  'Integrity': '#22C55E',
  'Resilience': '#E879F9',
  'Gratitude': '#38BDF8',
}

const THEME_ICON: Record<string, string> = {
  'Accountability': '✅',
  'Teamwork': '🤝',
  'Grit': '💪',
  'Empathy': '❤️',
  'Leadership': '⭐',
  'Integrity': '🛡️',
  'Resilience': '🔄',
  'Gratitude': '🙏',
}

const INTENSITY_COLOR = ['', '#38BDF8', '#22C55E', '#F5B731', '#F7620A', '#EF4444']
const INTENSITY_LABEL = ['', 'Low', 'Medium', 'High', 'Peak', 'Max']

function phaseColor(name: string): string {
  const n = name.toLowerCase()
  if (n.includes('pre') || n.includes('tryout') || n.includes('foundation')) return '#6B7A99'
  if (n.includes('early') || n.includes('develop')) return '#0ECFB0'
  if (n.includes('mid') || n.includes('regular')) return '#3A86FF'
  if (n.includes('late') || n.includes('peak') || n.includes('competition')) return '#F7620A'
  if (n.includes('playoff') || n.includes('tournament')) return '#F5B731'
  return '#6B7A99'
}

// ── Date helpers ──────────────────────────────────────────────────────────────

function weekStart(seasonStart: string, weekNum: number): Date {
  const d = new Date(seasonStart + 'T12:00:00')
  d.setDate(d.getDate() + (weekNum - 1) * 7)
  return d
}

function weekEnd(seasonStart: string, weekNum: number): Date {
  const d = weekStart(seasonStart, weekNum)
  d.setDate(d.getDate() + 6)
  return d
}

function toYMD(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function formatDate(iso: string): string {
  return new Date(iso + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function formatWeekRange(seasonStart: string, weekNum: number): string {
  return `${formatDate(toYMD(weekStart(seasonStart, weekNum)))} – ${formatDate(toYMD(weekEnd(seasonStart, weekNum)))}`
}

function getWeekNum(scheduledDate: string, seasonStart: string, totalWeeks: number): number | null {
  const start = new Date(seasonStart + 'T12:00:00')
  const date = new Date(scheduledDate + 'T12:00:00')
  const diffDays = Math.floor((date.getTime() - start.getTime()) / 86400000)
  if (diffDays < 0) return null
  const week = Math.floor(diffDays / 7) + 1
  if (week > totalWeeks) return null
  return week
}

function isWeekPast(seasonStart: string, weekNum: number): boolean {
  const end = weekEnd(seasonStart, weekNum)
  return end < new Date()
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function IntensityDots({ level }: { level: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <div
          key={i}
          className="w-1.5 h-1.5 rounded-full"
          style={{ backgroundColor: i <= level ? INTENSITY_COLOR[level] : 'rgba(241,245,249,0.1)' }}
        />
      ))}
    </div>
  )
}

function FocusPill({ focus }: { focus: string }) {
  const color = FOCUS_COLOR[focus] ?? '#6B7A99'
  return (
    <span
      className="text-xs px-2 py-0.5 rounded-full font-medium"
      style={{ backgroundColor: `${color}20`, color, border: `1px solid ${color}40` }}
    >
      {focus}
    </span>
  )
}

function ThemeBadge({ theme }: { theme: string }) {
  const color = THEME_COLOR[theme] ?? '#6B7A99'
  const icon = THEME_ICON[theme] ?? '●'
  return (
    <span
      className="text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1"
      style={{ backgroundColor: `${color}15`, color, border: `1px solid ${color}30` }}
    >
      <span>{icon}</span>
      <span>{theme}</span>
    </span>
  )
}

// ── Zone 2: Arc Timeline ───────────────────────────────────────────────────────

function ArcTimeline({
  plan,
  currentWeek,
}: {
  plan: SeasonPlan
  currentWeek: number | null
}) {
  const { phases, weekly_focus_rotation, total_weeks } = plan

  return (
    <div
      className="rounded-xl p-5 mb-6"
      style={{ backgroundColor: '#0E1520', border: '1px solid rgba(241,245,249,0.07)' }}
    >
      <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: 'rgba(241,245,249,0.3)' }}>
        Season Arc
      </p>

      {/* Phase progress bar */}
      <div className="mb-4">
        <div className="flex gap-0.5 rounded-lg overflow-hidden h-3 mb-1.5">
          {phases.map((phase, i) => {
            const width = ((phase.endWeek - phase.startWeek + 1) / total_weeks) * 100
            const color = phaseColor(phase.name)
            return (
              <div
                key={i}
                title={phase.name}
                className="relative h-full transition-all cursor-default"
                style={{ width: `${width}%`, backgroundColor: color, opacity: 0.85 }}
              />
            )
          })}
        </div>
        {/* Phase labels */}
        <div className="flex gap-0.5">
          {phases.map((phase, i) => {
            const width = ((phase.endWeek - phase.startWeek + 1) / total_weeks) * 100
            const color = phaseColor(phase.name)
            return (
              <div key={i} style={{ width: `${width}%` }} className="overflow-hidden">
                <span className="text-xs truncate block" style={{ color, opacity: 0.85 }}>
                  {phase.name}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Weekly dots: character themes */}
      {weekly_focus_rotation.length > 0 && (
        <div className="mb-3">
          <p className="text-xs mb-1.5" style={{ color: 'rgba(241,245,249,0.25)' }}>Character</p>
          <div className="flex flex-wrap gap-0.5">
            {weekly_focus_rotation.map((wf, i) => {
              const color = THEME_COLOR[wf.characterTheme] ?? 'rgba(241,245,249,0.15)'
              const isCurrent = currentWeek === wf.week
              return (
                <div
                  key={i}
                  title={`Wk ${wf.week}: ${wf.characterTheme}`}
                  className="rounded-sm transition-transform"
                  style={{
                    width: 10,
                    height: 10,
                    backgroundColor: wf.characterTheme ? color : 'rgba(241,245,249,0.08)',
                    outline: isCurrent ? `2px solid ${color}` : 'none',
                    outlineOffset: 1,
                    transform: isCurrent ? 'scale(1.2)' : 'scale(1)',
                  }}
                />
              )
            })}
          </div>
        </div>
      )}

      {/* Weekly dots: primary focus */}
      {weekly_focus_rotation.length > 0 && (
        <div>
          <p className="text-xs mb-1.5" style={{ color: 'rgba(241,245,249,0.25)' }}>Focus</p>
          <div className="flex flex-wrap gap-0.5">
            {weekly_focus_rotation.map((wf, i) => {
              const color = FOCUS_COLOR[wf.primaryFocus] ?? 'rgba(241,245,249,0.15)'
              const isCurrent = currentWeek === wf.week
              return (
                <div
                  key={i}
                  title={`Wk ${wf.week}: ${wf.primaryFocus}`}
                  className="rounded-sm transition-transform"
                  style={{
                    width: 10,
                    height: 10,
                    backgroundColor: color,
                    opacity: 0.75,
                    outline: isCurrent ? `2px solid ${color}` : 'none',
                    outlineOffset: 1,
                    transform: isCurrent ? 'scale(1.2)' : 'scale(1)',
                  }}
                />
              )
            })}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mt-4 pt-4" style={{ borderTop: '1px solid rgba(241,245,249,0.06)' }}>
        {phases.map((phase, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: phaseColor(phase.name) }} />
            <span className="text-xs" style={{ color: 'rgba(241,245,249,0.4)' }}>{phase.name}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Week Card ─────────────────────────────────────────────────────────────────

function WeekCard({
  weekNum,
  wf,
  practices,
  seasonId,
  seasonStart,
  practiceNum,
  totalPracticesInSeason,
}: {
  weekNum: number
  wf: WeeklyFocus | null
  practices: PracticePlan[]
  seasonId: string
  seasonStart: string
  practiceNum: number
  totalPracticesInSeason: number
}) {
  const isPast = isWeekPast(seasonStart, weekNum)
  const dateRange = formatWeekRange(seasonStart, weekNum)
  const newPracticeUrl = `/practice/build/new?seasonId=${seasonId}&week=${weekNum}&date=${toYMD(weekStart(seasonStart, weekNum))}`

  return (
    <div
      id={`week-${weekNum}`}
      className="rounded-xl p-4"
      style={{
        backgroundColor: '#080F1A',
        border: '1px solid rgba(241,245,249,0.06)',
        opacity: isPast && practices.length === 0 ? 0.5 : 1,
      }}
    >
      {/* Week header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-sp-text">Week {weekNum}</span>
            {wf && <IntensityDots level={wf.intensity} />}
          </div>
          <p className="text-xs mt-0.5" style={{ color: 'rgba(241,245,249,0.3)' }}>{dateRange}</p>
        </div>
        <span className="text-xs flex-shrink-0" style={{ color: 'rgba(241,245,249,0.2)' }}>
          #{practiceNum}
        </span>
      </div>

      {/* Focus pills */}
      {wf && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          <FocusPill focus={wf.primaryFocus} />
          {wf.secondaryFocus && wf.secondaryFocus !== wf.primaryFocus && (
            <FocusPill focus={wf.secondaryFocus} />
          )}
          {wf.characterTheme && <ThemeBadge theme={wf.characterTheme} />}
        </div>
      )}

      {/* Practices */}
      {practices.length > 0 ? (
        <div className="space-y-1.5 mb-3">
          {practices.map(p => (
            <Link
              key={p.id}
              href={`/practice/build/${p.id}`}
              className="flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-all hover:opacity-80"
              style={{ backgroundColor: 'rgba(241,245,249,0.04)', border: '1px solid rgba(241,245,249,0.07)' }}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-green-400">✓</span>
                <span className="text-sp-text font-medium truncate">{p.name}</span>
              </div>
              <span style={{ color: 'rgba(241,245,249,0.35)' }}>{p.duration_mins}min →</span>
            </Link>
          ))}
        </div>
      ) : null}

      {/* + Plan button */}
      <Link
        href={newPracticeUrl}
        className="flex items-center gap-1.5 text-xs transition-opacity hover:opacity-80 mt-1"
        style={{ color: practices.length > 0 ? 'rgba(241,245,249,0.2)' : '#F7620A' }}
      >
        <span style={{ fontSize: 14 }}>+</span>
        <span>{practices.length > 0 ? 'Add another' : 'Plan practice'}</span>
      </Link>
    </div>
  )
}

// ── Phase Section ─────────────────────────────────────────────────────────────

function PhaseSection({
  phase,
  plan,
  practicesByWeek,
  seasonPracticeCount,
  collapsedPhases,
  onToggleCollapse,
  startPracticeNum,
}: {
  phase: SeasonPhase
  plan: SeasonPlan
  practicesByWeek: Record<number, PracticePlan[]>
  seasonPracticeCount: number
  collapsedPhases: Set<string>
  onToggleCollapse: (name: string) => void
  startPracticeNum: number
}) {
  const color = phaseColor(phase.name)
  const isCollapsed = collapsedPhases.has(phase.name)
  const weekCount = phase.endWeek - phase.startWeek + 1
  const plannedInPhase = Array.from({ length: weekCount }, (_, i) =>
    practicesByWeek[phase.startWeek + i] ?? []
  ).flat().length
  const targetInPhase = weekCount * plan.practices_per_week
  const phaseStart = formatDate(toYMD(weekStart(plan.start_date, phase.startWeek)))
  const phaseEnd = formatDate(toYMD(weekEnd(plan.start_date, phase.endWeek)))

  const weeks = Array.from({ length: weekCount }, (_, i) => phase.startWeek + i)
  const wfMap: Record<number, WeeklyFocus> = {}
  for (const wf of plan.weekly_focus_rotation) wfMap[wf.week] = wf

  let practiceNum = startPracticeNum

  return (
    <div className="mb-4">
      {/* Phase header */}
      <button
        onClick={() => onToggleCollapse(phase.name)}
        className="w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all hover:opacity-90"
        style={{ backgroundColor: `${color}12`, border: `1px solid ${color}30` }}
      >
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
          <span className="text-sm font-bold" style={{ color }}>
            {phase.name}
          </span>
          <span className="text-xs" style={{ color: 'rgba(241,245,249,0.4)' }}>
            {phaseStart} – {phaseEnd}
          </span>
          <span
            className="text-xs px-2 py-0.5 rounded-full"
            style={{
              backgroundColor: `${INTENSITY_COLOR[phase.intensity]}20`,
              color: INTENSITY_COLOR[phase.intensity],
            }}
          >
            {INTENSITY_LABEL[phase.intensity]}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs" style={{ color: 'rgba(241,245,249,0.4)' }}>
            {plannedInPhase}/{targetInPhase} planned
          </span>
          <span style={{ color: 'rgba(241,245,249,0.4)', fontSize: 18 }}>
            {isCollapsed ? '›' : '‹'}
          </span>
        </div>
      </button>

      {/* Week cards grid */}
      {!isCollapsed && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-3">
          {weeks.map(weekNum => {
            const num = practiceNum
            practiceNum += plan.practices_per_week
            return (
              <WeekCard
                key={weekNum}
                weekNum={weekNum}
                wf={wfMap[weekNum] ?? null}
                practices={practicesByWeek[weekNum] ?? []}
                seasonId={plan.id}
                seasonStart={plan.start_date}
                practiceNum={num}
                totalPracticesInSeason={seasonPracticeCount}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Sidebar ────────────────────────────────────────────────────────────────────

function Sidebar({
  plan,
  practicesByWeek,
  totalPlanned,
}: {
  plan: SeasonPlan
  practicesByWeek: Record<number, PracticePlan[]>
  totalPlanned: number
}) {
  const totalTarget = plan.total_weeks * plan.practices_per_week
  const completionPct = totalTarget > 0 ? Math.round((totalPlanned / totalTarget) * 100) : 0

  // Skills coverage: count weeks where each focus is primary
  const focusCounts: Record<string, number> = {}
  for (const wf of plan.weekly_focus_rotation) {
    if (wf.primaryFocus) focusCounts[wf.primaryFocus] = (focusCounts[wf.primaryFocus] ?? 0) + 1
  }
  const maxFocusCount = Math.max(...Object.values(focusCounts), 1)

  // Themes used: deduplicated in sequence order
  const themesUsed: string[] = []
  const seen = new Set<string>()
  for (const wf of plan.weekly_focus_rotation) {
    if (wf.characterTheme && !seen.has(wf.characterTheme)) {
      seen.add(wf.characterTheme)
      themesUsed.push(wf.characterTheme)
    }
  }

  // Current week
  const today = new Date()
  const seasonStartDate = new Date(plan.start_date + 'T12:00:00')
  const diffDays = Math.floor((today.getTime() - seasonStartDate.getTime()) / 86400000)
  const currentWeek = diffDays >= 0 ? Math.min(Math.floor(diffDays / 7) + 1, plan.total_weeks) : null

  return (
    <div className="space-y-4">
      {/* Season at a glance */}
      <div className="rounded-xl p-4" style={{ backgroundColor: '#0E1520', border: '1px solid rgba(241,245,249,0.07)' }}>
        <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'rgba(241,245,249,0.3)' }}>
          At a Glance
        </p>
        {currentWeek !== null && (
          <div className="mb-3">
            <p className="text-xs" style={{ color: 'rgba(241,245,249,0.4)' }}>Current week</p>
            <p className="text-lg font-bold text-sp-text">Week {currentWeek} <span className="text-sm font-normal" style={{ color: 'rgba(241,245,249,0.4)' }}>of {plan.total_weeks}</span></p>
            <div className="mt-1.5 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(241,245,249,0.06)' }}>
              <div
                className="h-full rounded-full"
                style={{ width: `${(currentWeek / plan.total_weeks) * 100}%`, backgroundColor: '#F7620A' }}
              />
            </div>
          </div>
        )}
        <div className="space-y-1.5">
          <div className="flex justify-between">
            <span className="text-xs" style={{ color: 'rgba(241,245,249,0.4)' }}>Practices planned</span>
            <span className="text-xs font-semibold text-sp-text">{totalPlanned}/{totalTarget}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-xs" style={{ color: 'rgba(241,245,249,0.4)' }}>Completion</span>
            <span className="text-xs font-semibold" style={{ color: completionPct >= 80 ? '#22C55E' : completionPct >= 40 ? '#F5B731' : 'rgba(241,245,249,0.6)' }}>
              {completionPct}%
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-xs" style={{ color: 'rgba(241,245,249,0.4)' }}>Phases</span>
            <span className="text-xs font-semibold text-sp-text">{plan.phases.length}</span>
          </div>
        </div>
      </div>

      {/* Skills coverage */}
      <div className="rounded-xl p-4" style={{ backgroundColor: '#0E1520', border: '1px solid rgba(241,245,249,0.07)' }}>
        <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'rgba(241,245,249,0.3)' }}>
          Skills Distribution
        </p>
        <div className="space-y-2">
          {Object.entries(focusCounts)
            .sort((a, b) => b[1] - a[1])
            .map(([focus, count]) => (
              <div key={focus}>
                <div className="flex justify-between mb-0.5">
                  <span className="text-xs" style={{ color: FOCUS_COLOR[focus] ?? 'rgba(241,245,249,0.5)' }}>{focus}</span>
                  <span className="text-xs" style={{ color: 'rgba(241,245,249,0.3)' }}>{count}wks</span>
                </div>
                <div className="h-1 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(241,245,249,0.06)' }}>
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${(count / maxFocusCount) * 100}%`,
                      backgroundColor: FOCUS_COLOR[focus] ?? '#6B7A99',
                      opacity: 0.7,
                    }}
                  />
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Character themes */}
      {themesUsed.length > 0 && (
        <div className="rounded-xl p-4" style={{ backgroundColor: '#0E1520', border: '1px solid rgba(241,245,249,0.07)' }}>
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'rgba(241,245,249,0.3)' }}>
            Character Journey
          </p>
          <div className="space-y-1.5">
            {themesUsed.map((theme, i) => (
              <div key={theme} className="flex items-center gap-2">
                <span className="text-xs w-4" style={{ color: 'rgba(241,245,249,0.25)' }}>{i + 1}</span>
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: THEME_COLOR[theme] ?? '#6B7A99' }} />
                <span className="text-xs text-sp-text">{THEME_ICON[theme]} {theme}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Empty State ────────────────────────────────────────────────────────────────

function EmptyState({ plan }: { plan: SeasonPlan }) {
  return (
    <div className="rounded-xl p-8 text-center" style={{ backgroundColor: '#0E1520', border: '1px dashed rgba(241,245,249,0.12)' }}>
      <p className="text-4xl mb-3">📋</p>
      <p className="text-lg font-bold text-sp-text mb-1">No schedule yet</p>
      <p className="text-sm mb-6" style={{ color: 'rgba(241,245,249,0.4)' }}>
        This season plan doesn't have a weekly schedule. Choose how you'd like to build it.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md mx-auto">
        <Link
          href={`/practice/season?autoplan=${plan.id}`}
          className="rounded-xl p-5 text-left transition-all hover:opacity-85"
          style={{ backgroundColor: 'rgba(247,98,10,0.08)', border: '1px solid rgba(247,98,10,0.25)' }}
        >
          <p className="text-2xl mb-2">⚡</p>
          <p className="text-sm font-bold text-sp-text mb-1">Plan Full Season</p>
          <p className="text-xs" style={{ color: 'rgba(241,245,249,0.45)' }}>
            Auto-generate a complete week-by-week plan using AI based on your phases and goals.
          </p>
        </Link>
        <Link
          href={`/practice/build/new?seasonId=${plan.id}`}
          className="rounded-xl p-5 text-left transition-all hover:opacity-85"
          style={{ backgroundColor: 'rgba(56,189,248,0.06)', border: '1px solid rgba(56,189,248,0.2)' }}
        >
          <p className="text-2xl mb-2">🗓️</p>
          <p className="text-sm font-bold text-sp-text mb-1">Build Week by Week</p>
          <p className="text-xs" style={{ color: 'rgba(241,245,249,0.45)' }}>
            Create practices one at a time as you go. Flexible and manual.
          </p>
        </Link>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function SeasonDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { data: plan, isLoading } = useSeasonPlan(params.id)
  const { data: allPlans = [] } = usePracticePlans()

  const [collapsedPhases, setCollapsedPhases] = useState<Set<string>>(() => new Set())
  const [jumpWeek, setJumpWeek] = useState<string>('')
  const weekRefs = useRef<Record<number, HTMLElement | null>>({})

  // Load collapsed state from localStorage
  useEffect(() => {
    if (!plan) return
    try {
      const stored = localStorage.getItem(`sp_collapsed_${plan.id}`)
      if (stored) {
        const arr: string[] = JSON.parse(stored)
        // Auto-collapse past phases
        const today = new Date()
        const pastPhases = plan.phases.filter(p => {
          const end = weekEnd(plan.start_date, p.endWeek)
          return end < today
        })
        const combined = new Set([...arr, ...pastPhases.map(p => p.name)])
        setCollapsedPhases(combined)
      } else {
        // Default: collapse past phases
        const today = new Date()
        const pastPhases = plan.phases.filter(p => {
          const end = weekEnd(plan.start_date, p.endWeek)
          return end < today
        })
        setCollapsedPhases(new Set(pastPhases.map(p => p.name)))
      }
    } catch {
      // ignore
    }
  }, [plan?.id])

  function toggleCollapse(name: string) {
    setCollapsedPhases(prev => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      if (plan) {
        try {
          localStorage.setItem(`sp_collapsed_${plan.id}`, JSON.stringify(Array.from(next)))
        } catch { /* ignore */ }
      }
      return next
    })
  }

  // Compute current week
  const currentWeek = useMemo(() => {
    if (!plan) return null
    const today = new Date()
    const start = new Date(plan.start_date + 'T12:00:00')
    const diff = Math.floor((today.getTime() - start.getTime()) / 86400000)
    if (diff < 0) return null
    const wk = Math.floor(diff / 7) + 1
    return wk <= plan.total_weeks ? wk : null
  }, [plan])

  // Filter practices for this season
  const seasonPractices = useMemo(() => {
    if (!plan) return []
    return allPlans.filter(p => (p as PracticePlan & { season_plan_id?: string }).season_plan_id === plan.id)
  }, [allPlans, plan])

  // Group practices by week
  const practicesByWeek = useMemo(() => {
    if (!plan) return {}
    const m: Record<number, PracticePlan[]> = {}
    for (const p of seasonPractices) {
      if (!p.scheduled_date) continue
      const wk = getWeekNum(p.scheduled_date, plan.start_date, plan.total_weeks)
      if (wk === null) continue
      if (!m[wk]) m[wk] = []
      m[wk].push(p)
    }
    return m
  }, [seasonPractices, plan])

  function handleJumpWeek() {
    const n = parseInt(jumpWeek)
    if (!n || !plan || n < 1 || n > plan.total_weeks) return
    const el = document.getElementById(`week-${n}`)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      setJumpWeek('')
    }
  }

  if (isLoading) {
    return (
      <div>
        <PracticeSubNav />
        <div className="flex items-center justify-center h-64">
          <p className="text-sm" style={{ color: 'rgba(241,245,249,0.35)' }}>Loading season…</p>
        </div>
      </div>
    )
  }

  if (!plan) {
    return (
      <div>
        <PracticeSubNav />
        <div className="flex items-center justify-center h-64">
          <p className="text-sm" style={{ color: 'rgba(241,245,249,0.35)' }}>Season not found.</p>
        </div>
      </div>
    )
  }

  const hasSchedule = plan.phases.length > 0 && plan.weekly_focus_rotation.length > 0
  const totalTarget = plan.total_weeks * plan.practices_per_week
  const startFmt = new Date(plan.start_date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  const endFmt = new Date(plan.end_date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

  return (
    <div>
      <PracticeSubNav />

      {/* ── Zone 1: Season Header ── */}
      <div className="mb-6">
        {/* Back + breadcrumb */}
        <div className="flex items-center gap-2 mb-4">
          <Link
            href="/practice/season"
            className="text-xs transition-opacity hover:opacity-70"
            style={{ color: 'rgba(241,245,249,0.35)' }}
          >
            ← Season Plans
          </Link>
        </div>

        <div
          className="rounded-xl p-5"
          style={{ backgroundColor: '#0E1520', border: '1px solid rgba(241,245,249,0.07)' }}
        >
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap mb-1">
                <h1
                  className={`text-3xl uppercase tracking-wide text-sp-text ${barlow.className}`}
                  style={{ lineHeight: 1.1 }}
                >
                  {plan.name}
                </h1>
                <span
                  className="text-xs px-2.5 py-1 rounded-full font-semibold uppercase tracking-wide flex-shrink-0"
                  style={{
                    backgroundColor:
                      plan.status === 'active' ? 'rgba(34,197,94,0.15)'
                      : plan.status === 'completed' ? 'rgba(56,189,248,0.1)'
                      : 'rgba(241,245,249,0.07)',
                    color:
                      plan.status === 'active' ? '#22C55E'
                      : plan.status === 'completed' ? '#38BDF8'
                      : 'rgba(241,245,249,0.4)',
                    border: `1px solid ${
                      plan.status === 'active' ? 'rgba(34,197,94,0.3)'
                      : plan.status === 'completed' ? 'rgba(56,189,248,0.25)'
                      : 'rgba(241,245,249,0.1)'
                    }`,
                  }}
                >
                  {plan.status}
                </span>
              </div>
              <p className="text-sm" style={{ color: 'rgba(241,245,249,0.4)' }}>
                {startFmt} – {endFmt}
              </p>
            </div>
            <Link
              href={`/practice/season?edit=${plan.id}`}
              className="text-xs px-3 py-2 rounded-lg transition-opacity hover:opacity-80 flex-shrink-0"
              style={{ color: 'rgba(241,245,249,0.5)', border: '1px solid rgba(241,245,249,0.12)' }}
            >
              Edit plan
            </Link>
          </div>

          {/* Stats row */}
          <div className="flex flex-wrap gap-4 mt-4 pt-4" style={{ borderTop: '1px solid rgba(241,245,249,0.06)' }}>
            {[
              { label: 'Weeks', value: plan.total_weeks },
              { label: 'Per week', value: `${plan.practices_per_week}x` },
              { label: 'Total practices', value: totalTarget },
              { label: 'Phases', value: plan.phases.length },
              { label: 'Planned', value: `${seasonPractices.length}/${totalTarget}` },
              ...(plan.skill_level ? [{ label: 'Level', value: plan.skill_level }] : []),
              ...(plan.age_group ? [{ label: 'Age', value: plan.age_group }] : []),
            ].map(stat => (
              <div key={stat.label}>
                <p className="text-xs" style={{ color: 'rgba(241,245,249,0.35)' }}>{stat.label}</p>
                <p className="text-base font-bold text-sp-text">{stat.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Zone 2: Arc Timeline ── */}
      {hasSchedule && (
        <ArcTimeline plan={plan} currentWeek={currentWeek} />
      )}

      {/* ── Main layout: content + sidebar ── */}
      <div className="flex gap-6 items-start">
        {/* ── Zone 3: Phase Sections ── */}
        <div className="flex-1 min-w-0">
          {/* Jump-to-week + controls */}
          {hasSchedule && (
            <div className="flex items-center gap-3 mb-5 flex-wrap">
              <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'rgba(241,245,249,0.3)' }}>
                Weekly Schedule
              </p>
              <div className="flex items-center gap-2 ml-auto">
                <select
                  value={jumpWeek}
                  onChange={e => setJumpWeek(e.target.value)}
                  className="text-xs rounded-lg px-2 py-1.5 outline-none"
                  style={{
                    backgroundColor: 'rgba(241,245,249,0.05)',
                    color: 'rgba(241,245,249,0.5)',
                    border: '1px solid rgba(241,245,249,0.1)',
                  }}
                >
                  <option value="">Jump to week…</option>
                  {Array.from({ length: plan.total_weeks }, (_, i) => i + 1).map(w => (
                    <option key={w} value={w}>Week {w}</option>
                  ))}
                </select>
                <button
                  onClick={handleJumpWeek}
                  disabled={!jumpWeek}
                  className="text-xs px-3 py-1.5 rounded-lg transition-opacity"
                  style={{
                    backgroundColor: 'rgba(247,98,10,0.15)',
                    color: jumpWeek ? '#F7620A' : 'rgba(241,245,249,0.2)',
                    border: `1px solid ${jumpWeek ? 'rgba(247,98,10,0.3)' : 'rgba(241,245,249,0.08)'}`,
                  }}
                >
                  Go
                </button>
                <button
                  onClick={() => {
                    const allNames = plan.phases.map(p => p.name)
                    setCollapsedPhases(prev => {
                      const allCollapsed = allNames.every(n => prev.has(n))
                      const next = allCollapsed ? new Set<string>() : new Set(allNames)
                      if (plan) {
                        try { localStorage.setItem(`sp_collapsed_${plan.id}`, JSON.stringify(Array.from(next))) } catch { /* ignore */ }
                      }
                      return next
                    })
                  }}
                  className="text-xs px-3 py-1.5 rounded-lg transition-opacity hover:opacity-75"
                  style={{ color: 'rgba(241,245,249,0.4)', border: '1px solid rgba(241,245,249,0.1)' }}
                >
                  {plan.phases.every(p => collapsedPhases.has(p.name)) ? 'Expand all' : 'Collapse all'}
                </button>
              </div>
            </div>
          )}

          {/* Empty state OR phase sections */}
          {!hasSchedule ? (
            <EmptyState plan={plan} />
          ) : (
            <>
              {(() => {
                let runningPracticeNum = 1
                return plan.phases.map(phase => {
                  const startNum = runningPracticeNum
                  const phaseWeeks = phase.endWeek - phase.startWeek + 1
                  runningPracticeNum += phaseWeeks * plan.practices_per_week
                  return (
                    <PhaseSection
                      key={phase.name}
                      phase={phase}
                      plan={plan}
                      practicesByWeek={practicesByWeek}
                      seasonPracticeCount={seasonPractices.length}
                      collapsedPhases={collapsedPhases}
                      onToggleCollapse={toggleCollapse}
                      startPracticeNum={startNum}
                    />
                  )
                })
              })()}
            </>
          )}
        </div>

        {/* ── Sidebar (desktop only) ── */}
        {hasSchedule && (
          <div className="hidden lg:block flex-shrink-0 sticky top-6" style={{ width: 240 }}>
            <Sidebar
              plan={plan}
              practicesByWeek={practicesByWeek}
              totalPlanned={seasonPractices.length}
            />
          </div>
        )}
      </div>
    </div>
  )
}
