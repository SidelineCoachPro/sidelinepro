'use client'

import { useState, useMemo, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import PracticeSubNav from './components/PracticeSubNav'
import { usePracticePlans, type PracticePlan } from '@/hooks/usePracticePlans'
import { useSeasonPlans } from '@/hooks/useSeasonPlans'
import { useGames, type Game } from '@/hooks/useGames'

/* ── date helpers ─────────────────────────────────────────────────────────── */
function mondayOf(d: Date): Date {
  const dow = d.getDay() === 0 ? 6 : d.getDay() - 1 // Mon=0 … Sun=6
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() - dow)
}
function addDays(d: Date, n: number): Date {
  return new Date(d.getTime() + n * 86_400_000)
}
function toYMD(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
function parseYMD(s: string): Date {
  const [y, m, day] = s.split('-').map(Number)
  return new Date(y, m - 1, day)
}
function sameWeekMonday(a: Date, b: Date): boolean {
  return toYMD(mondayOf(a)) === toYMD(mondayOf(b))
}
const DOW = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

/* ── MiniCalendar ─────────────────────────────────────────────────────────── */
function MiniCalendar({
  selectedMonday,
  onSelectWeek,
  markedDates,
}: {
  selectedMonday: Date
  onSelectWeek: (monday: Date) => void
  markedDates: Set<string>
}) {
  const today = new Date()
  const [viewDate, setViewDate] = useState(
    () => new Date(selectedMonday.getFullYear(), selectedMonday.getMonth(), 1),
  )
  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()

  // Build weeks: start from Monday on/before the 1st
  const firstOfMonth = new Date(year, month, 1)
  const calStart = mondayOf(firstOfMonth)
  const weeks: Date[][] = []
  let cursor = new Date(calStart)
  while (weeks.length < 6) {
    const week: Date[] = Array.from({ length: 7 }, () => {
      const d = new Date(cursor)
      cursor = addDays(cursor, 1)
      return d
    })
    if (week[0].getMonth() > month && week[0].getFullYear() >= year) break
    weeks.push(week)
  }

  return (
    <div className="flex-shrink-0" style={{ width: 248 }}>
      {/* month header */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => setViewDate(new Date(year, month - 1, 1))}
          className="w-7 h-7 flex items-center justify-center rounded-lg hover:opacity-70 transition-opacity text-lg"
          style={{ color: 'rgba(241,245,249,0.4)' }}
        >
          ‹
        </button>
        <span className="text-sm font-semibold text-sp-text">
          {viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </span>
        <button
          onClick={() => setViewDate(new Date(year, month + 1, 1))}
          className="w-7 h-7 flex items-center justify-center rounded-lg hover:opacity-70 transition-opacity text-lg"
          style={{ color: 'rgba(241,245,249,0.4)' }}
        >
          ›
        </button>
      </div>

      {/* day headers */}
      <div className="grid grid-cols-7 mb-1">
        {['M','T','W','T','F','S','S'].map((l, i) => (
          <div key={i} className="text-center text-xs py-1 font-medium" style={{ color: 'rgba(241,245,249,0.25)' }}>
            {l}
          </div>
        ))}
      </div>

      {/* week rows */}
      {weeks.map((week, wi) => {
        const isSelected = sameWeekMonday(week[0], selectedMonday)
        return (
          <div
            key={wi}
            onClick={() => onSelectWeek(mondayOf(week[0]))}
            className="grid grid-cols-7 rounded-lg cursor-pointer transition-all mb-0.5"
            style={{
              backgroundColor: isSelected ? 'rgba(247,98,10,0.12)' : 'transparent',
              border: `1px solid ${isSelected ? 'rgba(247,98,10,0.25)' : 'transparent'}`,
            }}
          >
            {week.map((day, di) => {
              const ymd = toYMD(day)
              const isToday = toYMD(today) === ymd
              const otherMonth = day.getMonth() !== month
              const hasEvent = markedDates.has(ymd)
              return (
                <div key={di} className="flex flex-col items-center py-1">
                  <span
                    className="text-xs w-6 h-6 flex items-center justify-center rounded-full"
                    style={{
                      color: otherMonth
                        ? 'rgba(241,245,249,0.15)'
                        : isToday
                        ? '#F7620A'
                        : 'rgba(241,245,249,0.7)',
                      fontWeight: isToday ? 700 : 400,
                      backgroundColor: isToday ? 'rgba(247,98,10,0.15)' : 'transparent',
                    }}
                  >
                    {day.getDate()}
                  </span>
                  {hasEvent && (
                    <div
                      className="w-1 h-1 rounded-full"
                      style={{ backgroundColor: '#F7620A', marginTop: 1 }}
                    />
                  )}
                </div>
              )
            })}
          </div>
        )
      })}

      <button
        onClick={() => {
          const mon = mondayOf(today)
          setViewDate(new Date(mon.getFullYear(), mon.getMonth(), 1))
          onSelectWeek(mon)
        }}
        className="w-full text-xs py-2 mt-2 rounded-lg transition-opacity hover:opacity-70"
        style={{ color: 'rgba(241,245,249,0.35)', border: '1px solid rgba(241,245,249,0.07)' }}
      >
        Today
      </button>
    </div>
  )
}

/* ── DayRow ───────────────────────────────────────────────────────────────── */
function DayRow({
  day,
  plans,
  games,
}: {
  day: Date
  plans: PracticePlan[]
  games: Game[]
}) {
  const today = new Date()
  const ymd = toYMD(day)
  const isToday = toYMD(today) === ymd
  const isPast = day < new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const isEmpty = plans.length === 0 && games.length === 0

  return (
    <div
      className="rounded-xl p-4"
      style={{
        backgroundColor: isToday ? 'rgba(247,98,10,0.05)' : '#0E1520',
        border: `1px solid ${isToday ? 'rgba(247,98,10,0.2)' : 'rgba(241,245,249,0.07)'}`,
      }}
    >
      <div className="flex items-start gap-4">
        {/* date label */}
        <div className="w-10 flex-shrink-0 text-center">
          <p className="text-xs font-semibold uppercase" style={{ color: isToday ? '#F7620A' : 'rgba(241,245,249,0.35)' }}>
            {DOW[day.getDay() === 0 ? 6 : day.getDay() - 1].slice(0, 3)}
          </p>
          <p
            className="text-xl font-bold leading-tight"
            style={{ color: isToday ? '#F7620A' : isPast ? 'rgba(241,245,249,0.25)' : 'rgba(241,245,249,0.85)' }}
          >
            {day.getDate()}
          </p>
        </div>

        {/* content */}
        <div className="flex-1 min-w-0 flex flex-wrap items-center gap-2 pt-1">
          {isEmpty && (
            <Link
              href={`/practice/build/new?date=${ymd}`}
              className="text-xs px-3 py-1.5 rounded-lg transition-all hover:opacity-80"
              style={{ color: 'rgba(241,245,249,0.25)', border: '1px dashed rgba(241,245,249,0.1)' }}
            >
              + Add practice
            </Link>
          )}

          {games.map(g => (
            <div
              key={g.id}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm"
              style={{ backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}
            >
              <span style={{ color: '#EF4444' }}>🏀</span>
              <span className="font-semibold text-sp-text">vs. {g.opponent}</span>
              {g.location && (
                <span className="hidden sm:inline text-xs" style={{ color: 'rgba(241,245,249,0.4)' }}>@ {g.location}</span>
              )}
            </div>
          ))}

          {plans.map(plan => (
            <div key={plan.id} className="flex items-center gap-2 rounded-lg overflow-hidden" style={{ border: '1px solid rgba(241,245,249,0.1)' }}>
              <Link
                href={`/practice/build/${plan.id}`}
                className="flex items-center gap-3 px-3 py-2 text-sm transition-all hover:opacity-85"
                style={{ backgroundColor: 'rgba(241,245,249,0.04)' }}
              >
                <div>
                  <p className="font-medium text-sp-text truncate max-w-[200px]">{plan.name}</p>
                  <p className="text-xs" style={{ color: 'rgba(241,245,249,0.35)' }}>
                    {plan.duration_mins}min
                    {plan.focus_areas?.length ? ` · ${plan.focus_areas[0]}` : ''}
                  </p>
                </div>
              </Link>
              <Link
                href={`/practice/run?id=${plan.id}`}
                className="px-3 py-3 text-xs font-bold transition-opacity hover:opacity-85"
                style={{ backgroundColor: 'rgba(34,197,94,0.15)', color: '#22C55E' }}
                title="Run practice"
              >
                ▶
              </Link>
            </div>
          ))}

          {!isEmpty && (
            <Link
              href={`/practice/build/new?date=${ymd}`}
              className="text-xs px-2.5 py-1.5 rounded-lg transition-all hover:opacity-80"
              style={{ color: 'rgba(241,245,249,0.25)', border: '1px dashed rgba(241,245,249,0.1)' }}
            >
              +
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}

/* ── main page ────────────────────────────────────────────────────────────── */
function PracticeOverviewInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: plans = [] } = usePracticePlans()
  const { data: games = [] } = useGames()
  const { data: seasons = [] } = useSeasonPlans()
  const today = new Date()

  const selectedMonday = useMemo(() => {
    const wp = searchParams.get('week')
    if (wp) { try { return parseYMD(wp) } catch { /* ignore */ } }
    return mondayOf(today)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  function setWeek(monday: Date) {
    const p = new URLSearchParams(searchParams.toString())
    p.set('week', toYMD(monday))
    router.push(`/practice?${p.toString()}`)
  }

  const plansByDate = useMemo(() => {
    const m: Record<string, PracticePlan[]> = {}
    for (const p of plans) {
      if (p.scheduled_date) {
        if (!m[p.scheduled_date]) m[p.scheduled_date] = []
        m[p.scheduled_date].push(p)
      }
    }
    return m
  }, [plans])

  const gamesByDate = useMemo(() => {
    const m: Record<string, Game[]> = {}
    for (const g of games) {
      const date = g.scheduled_at.split('T')[0]
      if (!m[date]) m[date] = []
      m[date].push(g)
    }
    return m
  }, [games])

  const markedDates = useMemo(() => {
    const s = new Set<string>([
      ...Object.keys(plansByDate),
      ...Object.keys(gamesByDate),
    ])
    return s
  }, [plansByDate, gamesByDate])

  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(selectedMonday, i)),
    [selectedMonday],
  )

  const unscheduled = plans.filter(p => !p.scheduled_date)
  const activeSeason = seasons.find(s => s.status === 'active') ?? seasons[0]

  // Season strip: current week + progress
  const seasonProgress = useMemo(() => {
    if (!activeSeason) return null
    const today = new Date()
    const start = new Date(activeSeason.start_date + 'T12:00:00')
    const diff = Math.floor((today.getTime() - start.getTime()) / 86400000)
    if (diff < 0) return null
    const currentWeek = Math.min(Math.floor(diff / 7) + 1, activeSeason.total_weeks)
    const pct = Math.round((currentWeek / activeSeason.total_weeks) * 100)
    const currentPhase = activeSeason.phases.find(
      p => currentWeek >= p.startWeek && currentWeek <= p.endWeek
    )
    const currentWf = activeSeason.weekly_focus_rotation.find(w => w.week === currentWeek)
    return { currentWeek, pct, currentPhase, currentWf }
  }, [activeSeason])

  const weekEnd = addDays(selectedMonday, 6)
  const weekLabel = `${selectedMonday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`

  return (
    <div>
      <PracticeSubNav />

      <div className="flex items-start justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-sp-text">Practice</h1>
          <p className="text-sm mt-1" style={{ color: 'rgba(241,245,249,0.4)' }}>
            {activeSeason ? activeSeason.name : 'No active season plan'}
          </p>
        </div>
        <Link
          href="/practice/build/new"
          className="flex-shrink-0 flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-opacity hover:opacity-85"
          style={{ backgroundColor: '#F7620A', color: '#fff' }}
        >
          + New
        </Link>
      </div>

      {/* Season strip */}
      {activeSeason && seasonProgress && (
        <div
          className="rounded-xl p-4 mb-5"
          style={{ backgroundColor: '#0E1520', border: '1px solid rgba(241,245,249,0.07)' }}
        >
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="text-sm font-semibold text-sp-text truncate">{activeSeason.name}</span>
                <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(34,197,94,0.1)', color: '#22C55E' }}>Week {seasonProgress.currentWeek} of {activeSeason.total_weeks}</span>
                {seasonProgress.currentPhase && (
                  <span className="text-xs" style={{ color: 'rgba(241,245,249,0.4)' }}>{seasonProgress.currentPhase.name}</span>
                )}
                {seasonProgress.currentWf?.primaryFocus && (
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{
                    backgroundColor: `${({ 'Ball Handling': '#F7620A', Shooting: '#38BDF8', Passing: '#F5B731', Defense: '#22C55E', Conditioning: '#E879F9', 'Team Play': '#8B5CF6' } as Record<string, string>)[seasonProgress.currentWf.primaryFocus] ?? '#6B7A99'}20`,
                    color: ({ 'Ball Handling': '#F7620A', Shooting: '#38BDF8', Passing: '#F5B731', Defense: '#22C55E', Conditioning: '#E879F9', 'Team Play': '#8B5CF6' } as Record<string, string>)[seasonProgress.currentWf.primaryFocus] ?? '#6B7A99',
                  }}>
                    {seasonProgress.currentWf.primaryFocus}
                  </span>
                )}
              </div>
              <div className="h-1.5 rounded-full overflow-hidden mt-2" style={{ backgroundColor: 'rgba(241,245,249,0.06)' }}>
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${seasonProgress.pct}%`, backgroundColor: '#F7620A' }}
                />
              </div>
              <p className="text-xs mt-1" style={{ color: 'rgba(241,245,249,0.3)' }}>{seasonProgress.pct}% through season</p>
            </div>
            <Link
              href={`/practice/season/${activeSeason.id}`}
              className="text-xs px-3 py-2 rounded-lg font-semibold transition-opacity hover:opacity-80 flex-shrink-0"
              style={{ backgroundColor: 'rgba(247,98,10,0.12)', color: '#F7620A', border: '1px solid rgba(247,98,10,0.25)' }}
            >
              View Full Season →
            </Link>
          </div>
        </div>
      )}

      <div className="flex gap-6">
        {/* Left: mini calendar — hidden on mobile */}
        <div className="hidden md:block">
          <MiniCalendar
            selectedMonday={selectedMonday}
            onSelectWeek={setWeek}
            markedDates={markedDates}
          />
        </div>

        {/* Right: week view — full width on mobile */}
        <div className="flex-1 min-w-0">
          {/* week nav */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setWeek(addDays(selectedMonday, -7))}
                className="w-10 h-10 flex items-center justify-center rounded-lg text-lg hover:opacity-70 transition-opacity"
                style={{ color: 'rgba(241,245,249,0.45)', border: '1px solid rgba(241,245,249,0.1)' }}
              >
                ‹
              </button>
              <span className="text-sm font-semibold text-sp-text">{weekLabel}</span>
              <button
                onClick={() => setWeek(addDays(selectedMonday, 7))}
                className="w-10 h-10 flex items-center justify-center rounded-lg text-lg hover:opacity-70 transition-opacity"
                style={{ color: 'rgba(241,245,249,0.45)', border: '1px solid rgba(241,245,249,0.1)' }}
              >
                ›
              </button>
            </div>
            <button
              onClick={() => setWeek(mondayOf(today))}
              className="text-xs px-4 py-2.5 rounded-lg transition-opacity hover:opacity-70"
              style={{ color: 'rgba(241,245,249,0.4)', border: '1px solid rgba(241,245,249,0.08)' }}
            >
              This Week
            </button>
          </div>

          <div className="space-y-2">
            {weekDays.map(day => (
              <DayRow
                key={toYMD(day)}
                day={day}
                plans={plansByDate[toYMD(day)] ?? []}
                games={gamesByDate[toYMD(day)] ?? []}
              />
            ))}
          </div>

          {/* Unscheduled plans */}
          {unscheduled.length > 0 && (
            <div className="mt-8">
              <h2 className="text-sm font-semibold mb-3" style={{ color: 'rgba(241,245,249,0.4)' }}>
                Unscheduled Plans ({unscheduled.length})
              </h2>
              <div className="flex flex-wrap gap-2">
                {unscheduled.map(plan => (
                  <Link
                    key={plan.id}
                    href={`/practice/build/${plan.id}`}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all hover:opacity-85"
                    style={{ backgroundColor: '#0E1520', border: '1px solid rgba(241,245,249,0.07)' }}
                  >
                    <span className="text-sp-text font-medium truncate max-w-[180px]">{plan.name}</span>
                    <span className="text-xs" style={{ color: 'rgba(241,245,249,0.35)' }}>{plan.duration_mins}min</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function PracticeOverviewPage() {
  return (
    <Suspense>
      <PracticeOverviewInner />
    </Suspense>
  )
}
