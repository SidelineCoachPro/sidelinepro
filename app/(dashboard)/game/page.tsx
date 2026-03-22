'use client'

import { useState, useMemo, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Barlow_Condensed } from 'next/font/google'
import { useGames, useCreateGame, useUpdateGame, useDeleteGame, type Game } from '@/hooks/useGames'
import { usePracticePlans } from '@/hooks/usePracticePlans'
import { EVENT_COLORS } from '@/hooks/useCalendar'
import { useTeam } from '@/lib/teamContext'
import { useTeamToken } from '@/hooks/useTeamToken'

const barlow = Barlow_Condensed({ subsets: ['latin'], weight: '900' })

// ── RSVP types ────────────────────────────────────────────────────────────────
interface RsvpEntry {
  player_name: string
  parent_name: string
  response: 'yes' | 'no' | 'maybe'
  note: string | null
  updated_at: string
}

// ── Share Parent Link Modal ────────────────────────────────────────────────────
function ShareLinkModal({ token, url, onClose }: { token: string; url: string; onClose: () => void }) {
  const [copied, setCopied] = useState(false)
  function copy() {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="w-full max-w-md rounded-xl overflow-hidden" style={{ backgroundColor: '#0E1520', border: '1px solid rgba(241,245,249,0.1)' }}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid rgba(241,245,249,0.07)' }}>
          <h2 className="text-base font-semibold text-sp-text">Share Parent Link</h2>
          <button onClick={onClose} style={{ color: 'rgba(241,245,249,0.4)' }} className="hover:opacity-60 text-lg leading-none">✕</button>
        </div>
        <div className="px-5 py-5 space-y-4">
          <p className="text-sm" style={{ color: 'rgba(241,245,249,0.5)' }}>
            Share this link with parents so they can view the schedule, RSVP to games, and see announcements — no login required.
          </p>
          <div className="flex items-center gap-2">
            <div className="flex-1 px-3 py-2.5 rounded-lg text-sm truncate font-mono" style={{ backgroundColor: 'rgba(241,245,249,0.05)', color: 'rgba(241,245,249,0.7)', border: '1px solid rgba(241,245,249,0.1)' }}>
              {url}
            </div>
            <button
              onClick={copy}
              className="px-4 py-2.5 text-sm font-semibold rounded-lg flex-shrink-0 transition-all"
              style={{ backgroundColor: copied ? 'rgba(34,197,94,0.15)' : 'rgba(247,98,10,0.15)', color: copied ? '#22C55E' : '#F7620A', border: `1px solid ${copied ? 'rgba(34,197,94,0.3)' : 'rgba(247,98,10,0.3)'}` }}
            >
              {copied ? '✓ Copied' : 'Copy'}
            </button>
          </div>
          <p className="text-xs" style={{ color: 'rgba(241,245,249,0.3)' }}>Token: {token.slice(0, 8)}…</p>
        </div>
      </div>
    </div>
  )
}

// ── RSVP List Modal ───────────────────────────────────────────────────────────
function RsvpListModal({ game, token, onClose }: { game: Game; token: string; onClose: () => void }) {
  const [rsvps, setRsvps] = useState<RsvpEntry[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/parent/rsvp?gameId=${game.id}&token=${token}`)
      if (res.ok) {
        const data = await res.json()
        setRsvps(data.rsvps ?? [])
      }
    } finally {
      setLoading(false)
    }
  }, [game.id, token])

  useMemo(() => { load() }, [load])

  const counts = useMemo(() => {
    const c = { yes: 0, no: 0, maybe: 0 }
    for (const r of rsvps) c[r.response]++
    return c
  }, [rsvps])

  function exportCsv() {
    const rows = [
      ['Player', 'Parent', 'Response', 'Note', 'Updated'],
      ...rsvps.map(r => [r.player_name, r.parent_name, r.response, r.note ?? '', new Date(r.updated_at).toLocaleString()]),
    ]
    const csv = rows.map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = `rsvps-${game.opponent.replace(/\s+/g, '-')}.csv`; a.click()
    URL.revokeObjectURL(url)
  }

  const RESP_CONFIG = {
    yes:   { label: '✓ Yes',   bg: 'rgba(34,197,94,0.15)',   color: '#22C55E' },
    no:    { label: '✗ No',    bg: 'rgba(239,68,68,0.15)',   color: '#EF4444' },
    maybe: { label: '? Maybe', bg: 'rgba(245,183,49,0.15)',  color: '#F5B731' },
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="w-full max-w-lg rounded-xl flex flex-col overflow-hidden" style={{ backgroundColor: '#0E1520', border: '1px solid rgba(241,245,249,0.1)', maxHeight: '85vh' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid rgba(241,245,249,0.07)' }}>
          <div>
            <h2 className="text-base font-semibold text-sp-text">RSVPs — vs {game.opponent}</h2>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(241,245,249,0.4)' }}>{new Date(game.scheduled_at).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</p>
          </div>
          <button onClick={onClose} style={{ color: 'rgba(241,245,249,0.4)' }} className="hover:opacity-60 text-lg leading-none">✕</button>
        </div>
        {/* Summary bar */}
        {rsvps.length > 0 && (
          <div className="flex gap-3 px-5 py-3" style={{ borderBottom: '1px solid rgba(241,245,249,0.07)' }}>
            {(Object.entries(RESP_CONFIG) as [keyof typeof RESP_CONFIG, typeof RESP_CONFIG[keyof typeof RESP_CONFIG]][]).map(([key, cfg]) => (
              <div key={key} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg" style={{ backgroundColor: cfg.bg }}>
                <span className="text-sm font-bold" style={{ color: cfg.color }}>{counts[key]}</span>
                <span className="text-xs" style={{ color: cfg.color }}>{cfg.label}</span>
              </div>
            ))}
          </div>
        )}
        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12"><p className="text-sm" style={{ color: 'rgba(241,245,249,0.35)' }}>Loading…</p></div>
          ) : rsvps.length === 0 ? (
            <div className="flex items-center justify-center py-12"><p className="text-sm" style={{ color: 'rgba(241,245,249,0.35)' }}>No RSVPs yet</p></div>
          ) : (
            rsvps.map((r, i) => {
              const cfg = RESP_CONFIG[r.response]
              return (
                <div key={i} className="flex items-center gap-3 px-5 py-3.5" style={{ borderBottom: i < rsvps.length - 1 ? '1px solid rgba(241,245,249,0.05)' : 'none' }}>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold" style={{ backgroundColor: cfg.bg, color: cfg.color }}>
                    {r.player_name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-sp-text">{r.player_name}</p>
                    {r.parent_name && <p className="text-xs" style={{ color: 'rgba(241,245,249,0.4)' }}>via {r.parent_name}</p>}
                    {r.note && <p className="text-xs mt-0.5 italic" style={{ color: 'rgba(241,245,249,0.45)' }}>&ldquo;{r.note}&rdquo;</p>}
                  </div>
                  <span className="flex-shrink-0 px-2.5 py-1 rounded-full text-xs font-bold" style={{ backgroundColor: cfg.bg, color: cfg.color }}>{cfg.label}</span>
                </div>
              )
            })
          )}
        </div>
        {/* Footer */}
        {rsvps.length > 0 && (
          <div className="px-5 py-4" style={{ borderTop: '1px solid rgba(241,245,249,0.07)' }}>
            <button onClick={exportCsv} className="w-full py-2.5 rounded-lg text-sm font-semibold transition-opacity hover:opacity-80" style={{ backgroundColor: 'rgba(241,245,249,0.06)', color: 'rgba(241,245,249,0.6)', border: '1px solid rgba(241,245,249,0.1)' }}>
              Export CSV
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Date helpers ──────────────────────────────────────────────────────────────
function formatGameTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}
function daysUntil(iso: string): number {
  const game = new Date(iso); game.setHours(0, 0, 0, 0)
  const today = new Date(); today.setHours(0, 0, 0, 0)
  return Math.round((game.getTime() - today.getTime()) / 86400000)
}
function isoToDate(iso: string): string {
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
function todayStr(): string {
  return isoToDate(new Date().toISOString())
}
function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr + 'T00:00:00')
  d.setDate(d.getDate() + n)
  return isoToDate(d.toISOString())
}

// ── Game Form Modal ───────────────────────────────────────────────────────────
function GameFormModal({ game, onClose }: { game?: Game; onClose: () => void }) {
  const isEdit = !!game
  const { mutateAsync: createGame, isPending: isCreating } = useCreateGame()
  const { mutateAsync: updateGame, isPending: isUpdating } = useUpdateGame()
  const isPending = isCreating || isUpdating

  const dt = game ? new Date(game.scheduled_at) : null
  const [opponent, setOpponent] = useState(game?.opponent ?? '')
  const [location, setLocation] = useState(game?.location ?? '')
  const [date, setDate] = useState(dt ? dt.toISOString().split('T')[0] : new Date().toISOString().split('T')[0])
  const [time, setTime] = useState(dt ? dt.toTimeString().slice(0, 5) : '10:00')
  const [notes, setNotes]   = useState(game?.notes ?? '')
  const [error, setError]   = useState('')

  async function handleSave() {
    if (!opponent.trim()) { setError('Opponent name is required'); return }
    setError('')
    try {
      const scheduled_at = new Date(`${date}T${time}:00`).toISOString()
      if (isEdit && game) {
        await updateGame({ id: game.id, opponent: opponent.trim(), location: location.trim() || null, scheduled_at, notes: notes.trim() || null })
      } else {
        await createGame({ opponent: opponent.trim(), location: location.trim() || null, scheduled_at, notes: notes.trim() || null })
      }
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save game')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="w-full max-w-md rounded-xl flex flex-col overflow-hidden" style={{ backgroundColor: '#0E1520', border: '1px solid rgba(241,245,249,0.07)' }}>
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid rgba(241,245,249,0.07)' }}>
          <h2 className="text-base font-semibold text-sp-text">{isEdit ? 'Edit Game' : 'Add Game'}</h2>
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
            {isPending ? 'Saving...' : isEdit ? 'Save Changes' : 'Add Game'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Game Card ─────────────────────────────────────────────────────────────────
function GameCard({ game, onDelete, token, rsvpCounts }: {
  game: Game
  onDelete: () => void
  token?: string
  rsvpCounts?: { yes: number; no: number; maybe: number }
}) {
  const d = daysUntil(game.scheduled_at)
  const isPast = d < 0
  const isToday = d === 0
  const hasFinal = isPast && (game.our_score !== null || game.opponent_score !== null)
  const [confirmDel, setConfirmDel] = useState(false)
  const [editing, setEditing] = useState(false)
  const [showRsvps, setShowRsvps] = useState(false)

  return (
    <>
    <div className="rounded-xl p-4 flex gap-4" style={{ backgroundColor: '#0E1520', border: '1px solid rgba(241,245,249,0.07)', opacity: isPast ? 0.65 : 1 }}>
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
        {/* RSVP summary for upcoming games */}
        {!isPast && rsvpCounts && (rsvpCounts.yes + rsvpCounts.no + rsvpCounts.maybe) > 0 && (
          <div className="flex items-center gap-2 mb-2.5">
            {rsvpCounts.yes > 0 && <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(34,197,94,0.12)', color: '#22C55E' }}>{rsvpCounts.yes} ✓</span>}
            {rsvpCounts.no > 0 && <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(239,68,68,0.12)', color: '#EF4444' }}>{rsvpCounts.no} ✗</span>}
            {rsvpCounts.maybe > 0 && <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(245,183,49,0.12)', color: '#F5B731' }}>{rsvpCounts.maybe} ?</span>}
          </div>
        )}
        <div className="flex items-center gap-2 flex-wrap">
          <Link href={`/game/${game.id}/lineup`} className="px-3 py-1.5 text-xs font-semibold rounded-lg transition-opacity hover:opacity-80" style={{ backgroundColor: 'rgba(139,92,246,0.15)', color: '#8B5CF6', border: '1px solid rgba(139,92,246,0.3)' }}>
            Lineup
          </Link>
          <Link href={`/game/${game.id}/track`} className="px-3 py-1.5 text-xs font-semibold rounded-lg transition-opacity hover:opacity-80" style={{ backgroundColor: 'rgba(247,98,10,0.12)', color: '#F7620A', border: '1px solid rgba(247,98,10,0.25)' }}>
            Track Game
          </Link>
          {!isPast && token && (
            <button onClick={() => setShowRsvps(true)} className="px-3 py-1.5 text-xs font-semibold rounded-lg transition-opacity hover:opacity-80" style={{ backgroundColor: 'rgba(56,189,248,0.1)', color: '#38BDF8', border: '1px solid rgba(56,189,248,0.25)' }}>
              RSVPs
            </button>
          )}
          <button onClick={() => setEditing(true)} className="px-3 py-1.5 text-xs font-semibold rounded-lg transition-opacity hover:opacity-80" style={{ backgroundColor: 'rgba(241,245,249,0.06)', color: 'rgba(241,245,249,0.5)', border: '1px solid rgba(241,245,249,0.1)' }}>
            Edit
          </button>
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
    {editing && <GameFormModal game={game} onClose={() => setEditing(false)} />}
    {showRsvps && token && <RsvpListModal game={game} token={token} onClose={() => setShowRsvps(false)} />}
    </>
  )
}

// ── Season At A Glance ────────────────────────────────────────────────────────
function SeasonAtAGlance({ games }: { games: Game[] }) {
  const router = useRouter()
  const { data: plans = [] } = usePracticePlans()

  const today = todayStr()
  const days = useMemo(() => Array.from({ length: 14 }, (_, i) => addDays(today, i)), [today])

  // Build events for next 14 days from cached data
  const eventsByDate = useMemo(() => {
    const map: Record<string, Array<{ type: 'game' | 'practice'; label: string }>> = {}
    for (const g of games) {
      const d = isoToDate(g.scheduled_at)
      if (days.includes(d)) {
        if (!map[d]) map[d] = []
        map[d].push({ type: 'game', label: `vs ${g.opponent}` })
      }
    }
    for (const p of plans) {
      if (!p.scheduled_date) continue
      const d = p.scheduled_date
      if (days.includes(d)) {
        if (!map[d]) map[d] = []
        map[d].push({ type: 'practice', label: p.name })
      }
    }
    return map
  }, [games, plans, days])

  const hasAnyEvent = Object.keys(eventsByDate).length > 0
  if (!hasAnyEvent) return null

  return (
    <div className="mb-6 rounded-xl px-4 py-3 overflow-x-auto" style={{ backgroundColor: '#0E1520', border: '1px solid rgba(241,245,249,0.07)' }}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold uppercase tracking-wide flex-shrink-0" style={{ color: 'rgba(241,245,249,0.35)' }}>Season at a Glance</p>
        <Link href="/calendar" className="text-xs font-medium flex-shrink-0" style={{ color: '#F7620A' }}>Full calendar →</Link>
      </div>
      <div className="flex gap-2 min-w-0" style={{ minWidth: 'max-content' }}>
        {days.map(dateStr => {
          const evs = eventsByDate[dateStr] ?? []
          const d = new Date(dateStr + 'T00:00:00')
          const isToday = dateStr === today
          const monthStr = dateStr.slice(0, 7) // YYYY-MM

          return (
            <button
              key={dateStr}
              onClick={() => router.push(`/calendar?month=${monthStr}`)}
              className="flex flex-col items-center gap-1 px-2 py-2 rounded-lg transition-colors flex-shrink-0"
              style={{
                minWidth: 40,
                backgroundColor: isToday ? 'rgba(247,98,10,0.08)' : 'transparent',
                border: isToday ? '1px solid rgba(247,98,10,0.25)' : '1px solid transparent',
              }}
            >
              <span className="text-xs font-medium uppercase" style={{ color: isToday ? '#F7620A' : 'rgba(241,245,249,0.3)', fontSize: 10 }}>
                {d.toLocaleDateString('en-US', { weekday: 'narrow' })}
              </span>
              <span className="text-xs font-semibold" style={{ color: isToday ? '#F7620A' : evs.length ? 'rgba(241,245,249,0.7)' : 'rgba(241,245,249,0.3)' }}>
                {d.getDate()}
              </span>
              <div className="flex gap-0.5 min-h-[8px]">
                {evs.map((ev, i) => (
                  <div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: ev.type === 'game' ? EVENT_COLORS.game : EVENT_COLORS.practice }}
                  />
                ))}
              </div>
            </button>
          )
        })}
      </div>
      <div className="flex items-center gap-4 mt-2 pt-2" style={{ borderTop: '1px solid rgba(241,245,249,0.05)' }}>
        {[
          { color: EVENT_COLORS.game, label: 'Game' },
          { color: EVENT_COLORS.practice, label: 'Practice' },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
            <span className="text-xs" style={{ color: 'rgba(241,245,249,0.3)' }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Upcoming View ─────────────────────────────────────────────────────────────
function UpcomingView({ games, token, rsvpCountsMap }: {
  games: Game[]
  token?: string
  rsvpCountsMap?: Record<string, { yes: number; no: number; maybe: number }>
}) {
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
          {upcoming.map(g => (
            <GameCard
              key={g.id}
              game={g}
              onDelete={() => deleteGame(g.id)}
              token={token}
              rsvpCounts={rsvpCountsMap?.[g.id]}
            />
          ))}
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
  const [showAdd, setShowAdd] = useState(false)
  const [showShare, setShowShare] = useState(false)
  const { data: games = [], isLoading } = useGames()
  const { activeTeamId } = useTeam()
  const { data: tokenData } = useTeamToken(activeTeamId)
  const upcomingCount = games.filter(g => daysUntil(g.scheduled_at) >= 0).length

  // Fetch RSVP counts for upcoming games
  const [rsvpCountsMap, setRsvpCountsMap] = useState<Record<string, { yes: number; no: number; maybe: number }>>({})
  useMemo(() => {
    if (!tokenData?.token) return
    const upcomingIds = games.filter(g => daysUntil(g.scheduled_at) >= 0).map(g => g.id)
    if (upcomingIds.length === 0) return
    const token = tokenData.token
    Promise.all(
      upcomingIds.map(id =>
        fetch(`/api/parent/rsvp?gameId=${id}&token=${token}`)
          .then(r => r.ok ? r.json() : null)
          .then(data => data ? { id, counts: countRsvps(data.rsvps ?? []) } : null)
          .catch(() => null)
      )
    ).then(results => {
      const map: Record<string, { yes: number; no: number; maybe: number }> = {}
      for (const r of results) {
        if (r) map[r.id] = r.counts
      }
      setRsvpCountsMap(map)
    })
  }, [games, tokenData?.token])

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-sp-text">Game Day</h1>
          <p className="text-sm mt-0.5" style={{ color: 'rgba(241,245,249,0.4)' }}>
            {upcomingCount} upcoming game{upcomingCount !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {tokenData && (
            <button
              onClick={() => setShowShare(true)}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-lg transition-opacity hover:opacity-85"
              style={{ backgroundColor: 'rgba(241,245,249,0.07)', color: 'rgba(241,245,249,0.6)', border: '1px solid rgba(241,245,249,0.1)' }}
            >
              🔗 Parent Link
            </button>
          )}
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg transition-opacity hover:opacity-85"
            style={{ backgroundColor: '#F7620A', color: '#fff' }}
          >
            <span>+</span> Add Game
          </button>
        </div>
      </div>

      {!isLoading && <SeasonAtAGlance games={games} />}

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <p className="text-sm" style={{ color: 'rgba(241,245,249,0.35)' }}>Loading...</p>
        </div>
      ) : (
        <UpcomingView games={games} token={tokenData?.token} rsvpCountsMap={rsvpCountsMap} />
      )}

      {showAdd && <GameFormModal onClose={() => setShowAdd(false)} />}
      {showShare && tokenData && (
        <ShareLinkModal token={tokenData.token} url={tokenData.url} onClose={() => setShowShare(false)} />
      )}
    </div>
  )
}

function countRsvps(rsvps: RsvpEntry[]) {
  const c = { yes: 0, no: 0, maybe: 0 }
  for (const r of rsvps) c[r.response]++
  return c
}
