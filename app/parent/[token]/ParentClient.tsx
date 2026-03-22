'use client'

import { useState, useEffect, useCallback } from 'react'
import { Barlow_Condensed, DM_Sans } from 'next/font/google'

const barlow = Barlow_Condensed({ subsets: ['latin'], weight: ['700', '900'] })
const dmSans = DM_Sans({ subsets: ['latin'], weight: ['400', '500', '600'] })

/* ── Types ─────────────────────────────────────────────────────────────────── */
interface Team {
  id: string; name: string; emoji: string; color: string; season_year: string | null
}
interface Coach {
  full_name: string | null; display_name: string | null; avatar_url: string | null
}
interface UpcomingGame {
  id: string; opponent: string; location: string | null
  scheduled_at: string; our_score: number | null; opponent_score: number | null; notes: string | null
}
interface Practice {
  id: string; name: string; scheduled_date: string; duration_mins: number; focus_areas: string[] | null
}
interface Announcement {
  id: string; title: string; body: string; is_pinned: boolean; created_at: string
}
type RsvpCounts = Record<string, { yes: number; no: number; maybe: number }>
type RsvpResponse = 'yes' | 'no' | 'maybe'

/* ── Helpers ───────────────────────────────────────────────────────────────── */
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}
function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}
function formatAnnDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
function isToday(iso: string) {
  return new Date(iso).toDateString() === new Date().toDateString()
}
function coachDisplayName(coach: Coach | null) {
  return coach?.display_name ?? coach?.full_name ?? 'Your Coach'
}
function initials(name: string) {
  const parts = name.trim().split(' ')
  return (parts[0][0] + (parts[1]?.[0] ?? '')).toUpperCase()
}

const RESPONSE_COLOR: Record<RsvpResponse, { bg: string; text: string; border: string }> = {
  yes:   { bg: 'rgba(34,197,94,0.12)',  text: '#22C55E', border: 'rgba(34,197,94,0.3)'  },
  no:    { bg: 'rgba(239,68,68,0.12)',  text: '#EF4444', border: 'rgba(239,68,68,0.3)'  },
  maybe: { bg: 'rgba(245,183,49,0.12)', text: '#F5B731', border: 'rgba(245,183,49,0.3)' },
}

/* ── RSVP Modal ─────────────────────────────────────────────────────────────── */
function RsvpModal({
  game,
  token,
  existingRsvp,
  onClose,
  onSaved,
}: {
  game: UpcomingGame
  token: string
  existingRsvp: { playerName: string; parentName: string; response: RsvpResponse } | null
  onClose: () => void
  onSaved: (gameId: string, response: RsvpResponse, counts: { yes: number; no: number; maybe: number }) => void
}) {
  const [playerName, setPlayerName] = useState(existingRsvp?.playerName ?? '')
  const [parentName, setParentName] = useState(existingRsvp?.parentName ?? '')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [confirmed, setConfirmed] = useState<RsvpResponse | null>(null)

  // Pre-fill from localStorage
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('sp_parent_info') ?? '{}')
      if (!playerName && saved.playerName) setPlayerName(saved.playerName)
      if (!parentName && saved.parentName) setParentName(saved.parentName)
    } catch { /* ignore */ }
  }, [])

  async function submit(response: RsvpResponse) {
    if (!playerName.trim()) return
    setSaving(true)
    try {
      // Save to localStorage for next time
      localStorage.setItem('sp_parent_info', JSON.stringify({ playerName: playerName.trim(), parentName: parentName.trim() }))

      const res = await fetch('/api/parent/rsvp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, gameId: game.id, playerName: playerName.trim(), parentName: parentName.trim(), response, note }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setConfirmed(response)
      onSaved(game.id, response, data.counts)
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to save RSVP')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className={`${dmSans.className} w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl overflow-hidden`}
        style={{ backgroundColor: '#fff', maxHeight: '90vh', overflowY: 'auto' }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 rounded-full" style={{ backgroundColor: '#E2E8F0' }} />
        </div>

        <div className="px-5 py-4">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#64748B' }}>
                {confirmed ? 'Got it!' : 'RSVP for'}
              </p>
              <p className="text-base font-bold" style={{ color: '#0F172A' }}>
                vs {game.opponent} · {formatDate(game.scheduled_at)}
              </p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none p-1">✕</button>
          </div>

          {confirmed ? (
            <div className="py-4 text-center">
              <div className="text-4xl mb-3">
                {confirmed === 'yes' ? '🎉' : confirmed === 'no' ? '😔' : '🤔'}
              </div>
              <p className="text-base font-semibold" style={{ color: '#0F172A' }}>
                {playerName} is marked as{' '}
                <span style={{ color: RESPONSE_COLOR[confirmed].text }}>
                  {confirmed === 'yes' ? 'Going' : confirmed === 'no' ? 'Not Coming' : 'Maybe'}
                </span>
              </p>
              <button
                onClick={onClose}
                className="mt-5 w-full py-3 rounded-xl text-sm font-semibold"
                style={{ backgroundColor: '#F7620A', color: '#fff' }}
              >
                Done
              </button>
            </div>
          ) : (
            <>
              <div className="space-y-3 mb-5">
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: '#64748B' }}>
                    Player name *
                  </label>
                  <input
                    value={playerName}
                    onChange={e => setPlayerName(e.target.value)}
                    placeholder="e.g. Marcus Thompson"
                    className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                    style={{ border: '1.5px solid #E2E8F0', color: '#0F172A', backgroundColor: '#F8FAFC' }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: '#64748B' }}>
                    Your name (optional)
                  </label>
                  <input
                    value={parentName}
                    onChange={e => setParentName(e.target.value)}
                    placeholder="Parent name"
                    className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                    style={{ border: '1.5px solid #E2E8F0', color: '#0F172A', backgroundColor: '#F8FAFC' }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: '#64748B' }}>
                    Note (optional)
                  </label>
                  <input
                    value={note}
                    onChange={e => setNote(e.target.value)}
                    placeholder="e.g. We'll be 10 min late"
                    className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                    style={{ border: '1.5px solid #E2E8F0', color: '#0F172A', backgroundColor: '#F8FAFC' }}
                  />
                </div>
              </div>

              {!playerName.trim() && (
                <p className="text-xs text-center mb-3" style={{ color: '#EF4444' }}>Enter player name to continue</p>
              )}

              <div className="grid grid-cols-3 gap-2">
                {(['yes', 'maybe', 'no'] as RsvpResponse[]).map(r => {
                  const c = RESPONSE_COLOR[r]
                  const labels: Record<RsvpResponse, string> = { yes: '✓ Going!', maybe: '? Maybe', no: '✗ Can\'t Go' }
                  return (
                    <button
                      key={r}
                      onClick={() => submit(r)}
                      disabled={saving || !playerName.trim()}
                      className="py-3 rounded-xl text-sm font-bold transition-all disabled:opacity-40"
                      style={{ backgroundColor: c.bg, color: c.text, border: `1.5px solid ${c.border}` }}
                    >
                      {saving ? '…' : labels[r]}
                    </button>
                  )
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

/* ── Game Card ───────────────────────────────────────────────────────────────── */
function GameCard({
  game,
  token,
  counts,
  myRsvp,
  onRsvpUpdated,
}: {
  game: UpcomingGame
  token: string
  counts: { yes: number; no: number; maybe: number }
  myRsvp: RsvpResponse | null
  onRsvpUpdated: (gameId: string, response: RsvpResponse, counts: { yes: number; no: number; maybe: number }) => void
}) {
  const [rsvpOpen, setRsvpOpen] = useState(false)
  const [localCounts, setLocalCounts] = useState(counts)
  const today = isToday(game.scheduled_at)

  function handleSaved(gameId: string, response: RsvpResponse, newCounts: { yes: number; no: number; maybe: number }) {
    setLocalCounts(newCounts)
    onRsvpUpdated(gameId, response, newCounts)
  }

  const existingRsvp = myRsvp
    ? { playerName: '', parentName: '', response: myRsvp }
    : null

  return (
    <>
      <div
        className="rounded-xl p-4 mb-3"
        style={{
          backgroundColor: '#fff',
          border: '1px solid #E2E8F0',
          borderLeft: '4px solid #F7620A',
          boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        }}
      >
        {/* Header row */}
        <div className="flex items-start justify-between gap-2 mb-1">
          <p className={`${barlow.className} text-xl font-bold`} style={{ color: '#0F172A' }}>
            🏀 vs {game.opponent}
          </p>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {today && (
              <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(247,98,10,0.1)', color: '#F7620A' }}>
                TODAY
              </span>
            )}
            <span className="text-xs font-semibold" style={{ color: '#64748B' }}>
              {formatDate(game.scheduled_at)}
            </span>
          </div>
        </div>

        <p className="text-sm mb-3" style={{ color: '#64748B' }}>
          {formatTime(game.scheduled_at)}{game.location ? ` · ${game.location}` : ''}
        </p>

        {/* RSVP buttons */}
        <div className="flex gap-2 mb-3">
          {(['yes', 'maybe', 'no'] as RsvpResponse[]).map(r => {
            const c = RESPONSE_COLOR[r]
            const active = myRsvp === r
            const labels: Record<RsvpResponse, string> = { yes: '✓ Going', maybe: '? Maybe', no: '✗ Can\'t Go' }
            return (
              <button
                key={r}
                onClick={() => setRsvpOpen(true)}
                className="flex-1 py-2 rounded-lg text-xs font-semibold transition-all"
                style={{
                  backgroundColor: active ? c.bg : '#F8FAFC',
                  color: active ? c.text : '#64748B',
                  border: `1.5px solid ${active ? c.border : '#E2E8F0'}`,
                }}
              >
                {labels[r]}
              </button>
            )
          })}
        </div>

        {/* Count summary */}
        {(localCounts.yes + localCounts.no + localCounts.maybe) > 0 && (
          <p className="text-xs" style={{ color: '#94A3B8' }}>
            {localCounts.yes > 0 && `${localCounts.yes} going`}
            {localCounts.yes > 0 && localCounts.maybe > 0 && ' · '}
            {localCounts.maybe > 0 && `${localCounts.maybe} maybe`}
            {(localCounts.yes > 0 || localCounts.maybe > 0) && localCounts.no > 0 && ' · '}
            {localCounts.no > 0 && `${localCounts.no} can't go`}
          </p>
        )}
      </div>

      {rsvpOpen && (
        <RsvpModal
          game={game}
          token={token}
          existingRsvp={existingRsvp}
          onClose={() => setRsvpOpen(false)}
          onSaved={handleSaved}
        />
      )}
    </>
  )
}

/* ── Past Game Card ─────────────────────────────────────────────────────────── */
function PastGameCard({ game }: { game: UpcomingGame }) {
  const [expanded, setExpanded] = useState(false)
  const hasScore = game.our_score !== null || game.opponent_score !== null
  const won = hasScore && (game.our_score ?? 0) > (game.opponent_score ?? 0)

  return (
    <div
      className="rounded-xl p-4 mb-3"
      style={{ backgroundColor: '#fff', border: '1px solid #E2E8F0', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}
    >
      <div className="flex items-start justify-between gap-2 mb-1">
        <div className="flex items-center gap-2">
          {hasScore && (
            <span
              className="text-xs font-bold px-2 py-0.5 rounded-full"
              style={{ backgroundColor: won ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', color: won ? '#22C55E' : '#EF4444' }}
            >
              {won ? 'W' : 'L'} {game.our_score ?? '—'}–{game.opponent_score ?? '—'}
            </span>
          )}
          {!hasScore && (
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: '#F1F5F9', color: '#94A3B8' }}>
              Result pending
            </span>
          )}
          <p className="text-sm font-semibold" style={{ color: '#0F172A' }}>vs {game.opponent}</p>
        </div>
        <span className="text-xs flex-shrink-0" style={{ color: '#94A3B8' }}>{formatDate(game.scheduled_at)}</span>
      </div>
      {game.location && (
        <p className="text-xs mb-1" style={{ color: '#94A3B8' }}>📍 {game.location}</p>
      )}
      {game.notes && (
        <div className="mt-2">
          <p className={`text-sm italic ${expanded ? '' : 'line-clamp-3'}`} style={{ color: '#475569' }}>
            &ldquo;{game.notes}&rdquo;
          </p>
          {game.notes.length > 120 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-xs mt-1 font-medium"
              style={{ color: '#F7620A' }}
            >
              {expanded ? 'Show less' : 'Read more'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

/* ── Main Component ─────────────────────────────────────────────────────────── */
export default function ParentClient({
  token,
  team,
  coach,
  upcomingGames,
  pastGames,
  practices,
  announcements,
  rsvpCounts,
}: {
  token: string
  team: Team
  coach: Coach | null
  upcomingGames: UpcomingGame[]
  pastGames: UpcomingGame[]
  practices: Practice[]
  announcements: Announcement[]
  rsvpCounts: RsvpCounts
}) {
  const [tab, setTab] = useState<'schedule' | 'results' | 'announcements'>('schedule')
  const [liveCounts, setLiveCounts] = useState<RsvpCounts>(rsvpCounts)
  // gameId → response
  const [myRsvps, setMyRsvps] = useState<Record<string, RsvpResponse>>({})

  // Load persisted RSVP choices from localStorage on mount
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(`sp_rsvps_${token}`) ?? '{}')
      setMyRsvps(saved)
    } catch { /* ignore */ }
  }, [token])

  const handleRsvpUpdated = useCallback((gameId: string, response: RsvpResponse, counts: { yes: number; no: number; maybe: number }) => {
    setLiveCounts(prev => ({ ...prev, [gameId]: counts }))
    setMyRsvps(prev => {
      const next = { ...prev, [gameId]: response }
      try { localStorage.setItem(`sp_rsvps_${token}`, JSON.stringify(next)) } catch { /* ignore */ }
      return next
    })
  }, [token])

  const coachName = coachDisplayName(coach)
  const avatarSrc = coach?.avatar_url?.split('?')[0] ?? null
  const unreadAnnouncements = announcements.length

  return (
    <div className={`${dmSans.className} min-h-screen`} style={{ backgroundColor: '#F8FAFC', color: '#0F172A' }}>
      {/* ── Orange top bar ── */}
      <div style={{ height: 4, backgroundColor: '#F7620A' }} />

      {/* ── Header ── */}
      <div style={{ backgroundColor: '#fff', borderBottom: '1px solid #E2E8F0' }}>
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-3">
          {avatarSrc ? (
            <img src={avatarSrc} alt="" className="rounded-full object-cover flex-shrink-0" style={{ width: 44, height: 44 }} />
          ) : (
            <div
              className="rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
              style={{ width: 44, height: 44, backgroundColor: team.color ?? '#F7620A' }}
            >
              {initials(coachName)}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h1
              className={`${barlow.className} text-2xl font-black leading-tight truncate`}
              style={{ color: '#F7620A' }}
            >
              {team.emoji} {team.name}
            </h1>
            <p className="text-xs" style={{ color: '#64748B' }}>
              Coach {coachName}{team.season_year ? ` · ${team.season_year}` : ''}
            </p>
          </div>
        </div>

        {/* Tab nav */}
        <div className="max-w-lg mx-auto px-4 flex gap-0 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {([
            { key: 'schedule',      label: 'Schedule' },
            { key: 'results',       label: 'Results' },
            { key: 'announcements', label: `Announcements${unreadAnnouncements > 0 ? ` (${unreadAnnouncements})` : ''}` },
          ] as const).map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className="whitespace-nowrap px-4 py-3 text-sm font-semibold transition-all"
              style={{
                color: tab === t.key ? '#F7620A' : '#64748B',
                borderBottom: tab === t.key ? '2px solid #F7620A' : '2px solid transparent',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Content ── */}
      <div className="max-w-lg mx-auto px-4 py-5">

        {/* ── Schedule Tab ── */}
        {tab === 'schedule' && (
          <>
            {/* Upcoming Games */}
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#94A3B8' }}>
              Upcoming Games
            </p>
            {upcomingGames.length === 0 ? (
              <div className="rounded-xl p-6 text-center mb-6" style={{ backgroundColor: '#fff', border: '1px solid #E2E8F0' }}>
                <p className="text-sm" style={{ color: '#94A3B8' }}>No games scheduled yet. Check back soon!</p>
              </div>
            ) : (
              <div className="mb-6">
                {upcomingGames.map(game => (
                  <GameCard
                    key={game.id}
                    game={game}
                    token={token}
                    counts={liveCounts[game.id] ?? { yes: 0, no: 0, maybe: 0 }}
                    myRsvp={myRsvps[game.id] ?? null}
                    onRsvpUpdated={handleRsvpUpdated}
                  />
                ))}
              </div>
            )}

            {/* Upcoming Practices */}
            <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: 20, marginBottom: 4 }}>
              <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#94A3B8' }}>
                Practices This Week
              </p>
            </div>
            {practices.length === 0 ? (
              <div className="rounded-xl p-5 text-center" style={{ backgroundColor: '#fff', border: '1px solid #E2E8F0' }}>
                <p className="text-sm" style={{ color: '#94A3B8' }}>No practices scheduled this week.</p>
              </div>
            ) : (
              practices.map(p => (
                <div
                  key={p.id}
                  className="rounded-xl p-4 mb-2"
                  style={{ backgroundColor: '#fff', border: '1px solid #E2E8F0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}
                >
                  <p className="text-sm font-semibold mb-0.5" style={{ color: '#0F172A' }}>
                    📋 {new Date(p.scheduled_date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                  </p>
                  <p className="text-xs" style={{ color: '#64748B' }}>
                    {p.name}{p.focus_areas?.length ? ` · ${p.focus_areas.slice(0, 2).join(', ')}` : ''} · {p.duration_mins} min
                  </p>
                </div>
              ))
            )}
          </>
        )}

        {/* ── Results Tab ── */}
        {tab === 'results' && (
          <>
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#94A3B8' }}>
              Recent Results
            </p>
            {pastGames.length === 0 ? (
              <div className="rounded-xl p-6 text-center" style={{ backgroundColor: '#fff', border: '1px solid #E2E8F0' }}>
                <p className="text-sm" style={{ color: '#94A3B8' }}>
                  No results yet — season is just getting started!
                </p>
              </div>
            ) : (
              pastGames.map(game => <PastGameCard key={game.id} game={game} />)
            )}
          </>
        )}

        {/* ── Announcements Tab ── */}
        {tab === 'announcements' && (
          <>
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#94A3B8' }}>
              Announcements
            </p>
            {announcements.length === 0 ? (
              <div className="rounded-xl p-6 text-center" style={{ backgroundColor: '#fff', border: '1px solid #E2E8F0' }}>
                <p className="text-sm" style={{ color: '#94A3B8' }}>No announcements yet.</p>
              </div>
            ) : (
              announcements.map(a => (
                <div
                  key={a.id}
                  className="rounded-xl p-4 mb-3"
                  style={{ backgroundColor: '#fff', border: '1px solid #E2E8F0', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}
                >
                  {a.is_pinned && (
                    <p className="text-xs font-bold mb-1.5" style={{ color: '#F7620A' }}>📌 PINNED</p>
                  )}
                  <p className="text-base font-semibold mb-1" style={{ color: '#0F172A' }}>{a.title}</p>
                  <p className="text-sm leading-relaxed mb-2" style={{ color: '#475569' }}>{a.body}</p>
                  <p className="text-xs" style={{ color: '#94A3B8' }}>Posted {formatAnnDate(a.created_at)}</p>
                </div>
              ))
            )}
          </>
        )}
      </div>

      {/* ── Footer ── */}
      <div className="max-w-lg mx-auto px-4 py-6 text-center">
        <p className="text-xs" style={{ color: '#CBD5E1' }}>
          Powered by{' '}
          <span style={{ color: '#F7620A', fontWeight: 600 }}>SidelinePro</span>
          {' '}· sidelinecoachpro.com
        </p>
      </div>
    </div>
  )
}
