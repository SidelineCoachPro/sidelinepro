'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Barlow_Condensed } from 'next/font/google'
import { useGames, useCreateGame, useDeleteGame, type Game } from '@/hooks/useGames'

const barlow = Barlow_Condensed({ subsets: ['latin'], weight: '900' })

// ── Date helpers ──────────────────────────────────────────────────────────────
function formatGameTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}
function daysUntil(iso: string): number {
  const game = new Date(iso); game.setHours(0, 0, 0, 0)
  const today = new Date(); today.setHours(0, 0, 0, 0)
  return Math.round((game.getTime() - today.getTime()) / 86400000)
}
function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}
function getCalendarDays(year: number, month: number): Date[] {
  const firstOfMonth = new Date(year, month, 1)
  const days: Date[] = []
  for (let i = firstOfMonth.getDay() - 1; i >= 0; i--) days.push(new Date(year, month, -i))
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  for (let d = 1; d <= daysInMonth; d++) days.push(new Date(year, month, d))
  let next = 1
  while (days.length < 42) days.push(new Date(year, month + 1, next++))
  return days
}
const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December']
const DAY_LABELS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

// ── Add Game Modal ────────────────────────────────────────────────────────────
function AddGameModal({ onClose }: { onClose: () => void }) {
  const { mutateAsync, isPending } = useCreateGame()
  const [opponent, setOpponent] = useState('')
  const [location, setLocation] = useState('')
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0])
  const [time, setTime] = useState('10:00')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')

  async function handleSave() {
    if (!opponent.trim()) { setError('Opponent name is required'); return }
    setError('')
    try {
      await mutateAsync({
        opponent: opponent.trim(),
        location: location.trim() || null,
        scheduled_at: new Date(`${date}T${time}:00`).toISOString(),
        notes: notes.trim() || null,
      })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save game')
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-md rounded-xl flex flex-col overflow-hidden" style={{ backgroundColor: '#0E1520', border: '1px solid rgba(241,245,249,0.07)' }}>
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid rgba(241,245,249,0.07)' }}>
          <h2 className="text-base font-semibold text-sp-text">Add Game</h2>
          <button onClick={onClose} style={{ color: 'rgba(241,245,249,0.4)' }} className="hover:opacity-60 text-lg leading-none">✕</button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block mb-1.5 text-xs font-medium" style={{ color: 'rgba(241,245,249,0.6)' }}>Opponent *</label>
            <input value={opponent} onChange={e => setOpponent(e.target.value)} className="sp-input" placeholder="e.g. Westside Eagles" />
          </div>
          <div>
            <label className="block mb-1.5 text-xs font-medium" style={{ color: 'rgba(241,245,249,0.6)' }}>Location</label>
            <input value={location} onChange={e => setLocation(e.target.value)} className="sp-input" placeholder="e.g. Lincoln Elementary Gym" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block mb-1.5 text-xs font-medium" style={{ color: 'rgba(241,245,249,0.6)' }}>Date</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} className="sp-input" style={{ colorScheme: 'dark' }} />
            </div>
            <div>
              <label className="block mb-1.5 text-xs font-medium" style={{ color: 'rgba(241,245,249,0.6)' }}>Time</label>
              <input type="time" value={time} onChange={e => setTime(e.target.value)} className="sp-input" style={{ colorScheme: 'dark' }} />
            </div>
          </div>
          <div>
            <label className="block mb-1.5 text-xs font-medium" style={{ color: 'rgba(241,245,249,0.6)' }}>Notes</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} className="sp-input" rows={2} placeholder="Optional notes..." style={{ resize: 'vertical' }} />
          </div>
          {error && <p className="text-sm text-red-400 px-3 py-2 rounded-lg" style={{ backgroundColor: 'rgba(239,68,68,0.1)' }}>{error}</p>}
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4" style={{ borderTop: '1px solid rgba(241,245,249,0.07)' }}>
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium" style={{ color: 'rgba(241,245,249,0.5)' }}>Cancel</button>
          <button onClick={handleSave} disabled={isPending} className="px-5 py-2 text-sm font-semibold rounded-lg disabled:opacity-50 hover:opacity-85 transition-opacity" style={{ backgroundColor: '#F7620A', color: '#fff' }}>
            {isPending ? 'Saving...' : 'Add Game'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Game Popover ──────────────────────────────────────────────────────────────
function GamePopover({ game, onClose }: { game: Game; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-sm rounded-xl p-5 space-y-3" style={{ backgroundColor: '#0E1520', border: '1px solid rgba(241,245,249,0.1)' }}>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium mb-0.5" style={{ color: 'rgba(241,245,249,0.4)' }}>
              {new Date(game.scheduled_at).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
            <p className={`text-2xl text-sp-text ${barlow.className}`}>vs {game.opponent}</p>
          </div>
          <button onClick={onClose} style={{ color: 'rgba(241,245,249,0.4)' }} className="hover:opacity-60 text-lg leading-none mt-1">✕</button>
        </div>
        {game.location && <p className="text-sm" style={{ color: 'rgba(241,245,249,0.5)' }}>📍 {game.location}</p>}
        <p className="text-sm font-medium" style={{ color: '#F7620A' }}>🕐 {formatGameTime(game.scheduled_at)}</p>
        <div className="flex gap-2 pt-1">
          <Link
            href={`/game/${game.id}/lineup`}
            onClick={onClose}
            className="flex-1 text-center py-2 text-sm font-semibold rounded-lg transition-opacity hover:opacity-85"
            style={{ backgroundColor: '#8B5CF6', color: '#fff' }}
          >
            Manage Lineup
          </Link>
          <Link
            href={`/game/${game.id}/track`}
            onClick={onClose}
            className="flex-1 text-center py-2 text-sm font-semibold rounded-lg transition-opacity hover:opacity-85"
            style={{ backgroundColor: '#F7620A', color: '#fff' }}
          >
            Track Game
          </Link>
        </div>
      </div>
    </div>
  )
}

// ── Calendar View ─────────────────────────────────────────────────────────────
function CalendarView({ games }: { games: Game[] }) {
  const today = new Date()
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1))
  const [popoverGame, setPopoverGame] = useState<Game | null>(null)

  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const days = getCalendarDays(year, month)

  function gamesOnDay(day: Date) {
    return games.filter(g => isSameDay(new Date(g.scheduled_at), day))
  }

  return (
    <>
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#0E1520', border: '1px solid rgba(241,245,249,0.07)' }}>
        {/* Month nav */}
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid rgba(241,245,249,0.07)' }}>
          <button onClick={() => setViewDate(new Date(year, month - 1, 1))} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/[0.05] transition-colors" style={{ color: 'rgba(241,245,249,0.5)' }}>←</button>
          <span className={`text-lg text-sp-text ${barlow.className}`}>{MONTH_NAMES[month]} {year}</span>
          <button onClick={() => setViewDate(new Date(year, month + 1, 1))} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/[0.05] transition-colors" style={{ color: 'rgba(241,245,249,0.5)' }}>→</button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7" style={{ borderBottom: '1px solid rgba(241,245,249,0.05)' }}>
          {DAY_LABELS.map(d => (
            <div key={d} className="text-center py-2 text-xs font-medium" style={{ color: 'rgba(241,245,249,0.3)' }}>{d}</div>
          ))}
        </div>

        {/* Day grid */}
        <div className="grid grid-cols-7">
          {days.map((day, i) => {
            const inMonth = day.getMonth() === month
            const isToday = isSameDay(day, today)
            const dayGames = gamesOnDay(day)
            const isPast = day < today && !isToday
            const hasGame = dayGames.length > 0

            return (
              <div
                key={i}
                onClick={() => hasGame && setPopoverGame(dayGames[0])}
                className="relative flex flex-col items-center py-2 px-1 transition-colors"
                style={{
                  minHeight: 52,
                  cursor: hasGame ? 'pointer' : 'default',
                  borderBottom: i < 35 ? '1px solid rgba(241,245,249,0.04)' : undefined,
                  borderRight: (i + 1) % 7 !== 0 ? '1px solid rgba(241,245,249,0.04)' : undefined,
                  outline: isToday ? '1px solid rgba(247,98,10,0.5)' : undefined,
                  backgroundColor: hasGame && !isPast ? 'rgba(247,98,10,0.04)' : 'transparent',
                }}
                onMouseEnter={e => { if (hasGame) (e.currentTarget as HTMLElement).style.backgroundColor = '#141E2D' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = hasGame && !isPast ? 'rgba(247,98,10,0.04)' : 'transparent' }}
              >
                <span className="text-xs font-medium" style={{
                  color: !inMonth ? 'rgba(241,245,249,0.15)'
                       : isToday ? '#F7620A'
                       : isPast ? 'rgba(241,245,249,0.3)'
                       : 'rgba(241,245,249,0.75)',
                }}>
                  {day.getDate()}
                </span>
                {hasGame && (
                  <div className="flex gap-0.5 mt-1">
                    {dayGames.slice(0, 3).map((_, gi) => (
                      <div key={gi} className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: isPast ? 'rgba(247,98,10,0.4)' : '#F7620A' }} />
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div className="flex items-center gap-2 px-5 py-3" style={{ borderTop: '1px solid rgba(241,245,249,0.05)' }}>
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#F7620A' }} />
          <span className="text-xs" style={{ color: 'rgba(241,245,249,0.3)' }}>Game scheduled · Click day to view details</span>
        </div>
      </div>

      {popoverGame && <GamePopover game={popoverGame} onClose={() => setPopoverGame(null)} />}
    </>
  )
}

// ── Game Card ─────────────────────────────────────────────────────────────────
function GameCard({ game, onDelete }: { game: Game; onDelete: () => void }) {
  const d = daysUntil(game.scheduled_at)
  const isPast = d < 0
  const isToday = d === 0
  const hasFinal = isPast && (game.our_score !== null || game.opponent_score !== null)
  const [confirmDel, setConfirmDel] = useState(false)

  return (
    <div
      className="rounded-xl p-4 flex gap-4"
      style={{ backgroundColor: '#0E1520', border: '1px solid rgba(241,245,249,0.07)', opacity: isPast ? 0.65 : 1 }}
    >
      {/* Date column */}
      <div className="flex-shrink-0 flex flex-col items-center justify-center w-14 text-center">
        <p className="text-xs font-medium uppercase" style={{ color: 'rgba(241,245,249,0.4)' }}>
          {new Date(game.scheduled_at).toLocaleDateString('en-US', { month: 'short' })}
        </p>
        <p className="text-3xl font-bold leading-tight text-sp-text">{new Date(game.scheduled_at).getDate()}</p>
        <p className="text-xs" style={{ color: 'rgba(241,245,249,0.4)' }}>
          {new Date(game.scheduled_at).toLocaleDateString('en-US', { weekday: 'short' })}
        </p>
      </div>

      <div className="w-px self-stretch" style={{ backgroundColor: 'rgba(241,245,249,0.07)' }} />

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <p className={`text-xl text-sp-text leading-tight truncate ${barlow.className}`}>vs {game.opponent}</p>
          {isToday ? (
            <span className="flex-shrink-0 text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(247,98,10,0.2)', color: '#F7620A' }}>TODAY</span>
          ) : hasFinal ? (
            <span className="flex-shrink-0 text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(241,245,249,0.08)', color: 'rgba(241,245,249,0.5)' }}>FINAL</span>
          ) : !isPast ? (
            <span className="flex-shrink-0 text-xs font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(56,189,248,0.1)', color: '#38BDF8' }}>
              {d === 1 ? 'Tomorrow' : `In ${d} days`}
            </span>
          ) : null}
        </div>

        {game.location && <p className="text-xs truncate mb-1" style={{ color: 'rgba(241,245,249,0.4)' }}>📍 {game.location}</p>}
        <p className="text-xs mb-2.5" style={{ color: 'rgba(241,245,249,0.4)' }}>🕐 {formatGameTime(game.scheduled_at)}</p>

        {hasFinal && (
          <p className="text-sm font-bold mb-2.5" style={{ color: (game.our_score ?? 0) > (game.opponent_score ?? 0) ? '#22C55E' : 'rgba(241,245,249,0.6)' }}>
            {game.our_score ?? '—'} – {game.opponent_score ?? '—'}
          </p>
        )}

        <div className="flex items-center gap-2 flex-wrap">
          <Link href={`/game/${game.id}/lineup`} className="px-3 py-1.5 text-xs font-semibold rounded-lg transition-opacity hover:opacity-80" style={{ backgroundColor: 'rgba(139,92,246,0.15)', color: '#8B5CF6', border: '1px solid rgba(139,92,246,0.3)' }}>
            Lineup
          </Link>
          <Link href={`/game/${game.id}/track`} className="px-3 py-1.5 text-xs font-semibold rounded-lg transition-opacity hover:opacity-80" style={{ backgroundColor: 'rgba(247,98,10,0.12)', color: '#F7620A', border: '1px solid rgba(247,98,10,0.25)' }}>
            Track Game
          </Link>
          {confirmDel ? (
            <>
              <button onClick={onDelete} className="px-3 py-1.5 text-xs font-semibold rounded-lg" style={{ backgroundColor: 'rgba(239,68,68,0.15)', color: '#EF4444' }}>Confirm delete</button>
              <button onClick={() => setConfirmDel(false)} className="text-xs" style={{ color: 'rgba(241,245,249,0.35)' }}>Cancel</button>
            </>
          ) : (
            <button onClick={() => setConfirmDel(true)} className="ml-auto text-xs hover:opacity-60 transition-opacity" style={{ color: 'rgba(241,245,249,0.2)' }}>✕</button>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Upcoming View ─────────────────────────────────────────────────────────────
function UpcomingView({ games }: { games: Game[] }) {
  const { mutateAsync: deleteGame } = useDeleteGame()

  const upcoming = games.filter(g => daysUntil(g.scheduled_at) >= 0)
  const past     = [...games.filter(g => daysUntil(g.scheduled_at) < 0)].reverse()

  if (games.length === 0) {
    return (
      <div className="flex items-center justify-center py-20 rounded-xl" style={{ border: '1px dashed rgba(241,245,249,0.1)' }}>
        <p className="text-sm" style={{ color: 'rgba(241,245,249,0.35)' }}>No games yet — add your first game above</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {upcoming.length > 0 && (
        <div className="space-y-3">
          {upcoming.map(g => <GameCard key={g.id} game={g} onDelete={() => deleteGame(g.id)} />)}
        </div>
      )}
      {past.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'rgba(241,245,249,0.25)' }}>Past Games</p>
          <div className="space-y-3">
            {past.map(g => <GameCard key={g.id} game={g} onDelete={() => deleteGame(g.id)} />)}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function GameDayPage() {
  const [tab, setTab]     = useState<'upcoming' | 'calendar'>('upcoming')
  const [showAdd, setShowAdd] = useState(false)
  const { data: games = [], isLoading } = useGames()

  const upcomingCount = games.filter(g => daysUntil(g.scheduled_at) >= 0).length

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-sp-text">Game Day</h1>
          <p className="text-sm mt-0.5" style={{ color: 'rgba(241,245,249,0.4)' }}>
            {upcomingCount} upcoming game{upcomingCount !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg transition-opacity hover:opacity-85"
          style={{ backgroundColor: '#F7620A', color: '#fff' }}
        >
          <span>+</span> Add Game
        </button>
      </div>

      <div className="flex gap-1 mb-5 p-1 rounded-xl w-fit" style={{ backgroundColor: 'rgba(241,245,249,0.04)', border: '1px solid rgba(241,245,249,0.07)' }}>
        {(['upcoming', 'calendar'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="px-4 py-1.5 rounded-lg text-sm font-medium transition-all"
            style={{ backgroundColor: tab === t ? '#F7620A' : 'transparent', color: tab === t ? '#fff' : 'rgba(241,245,249,0.45)' }}
          >
            {t === 'upcoming' ? 'Upcoming Games' : 'Calendar'}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <p className="text-sm" style={{ color: 'rgba(241,245,249,0.35)' }}>Loading...</p>
        </div>
      ) : tab === 'upcoming' ? (
        <UpcomingView games={games} />
      ) : (
        <CalendarView games={games} />
      )}

      {showAdd && <AddGameModal onClose={() => setShowAdd(false)} />}
    </div>
  )
}
