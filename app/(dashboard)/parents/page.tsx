'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useTeam } from '@/lib/teamContext'
import { useTeamToken, useRegenerateToken } from '@/hooks/useTeamToken'
import { useAnnouncements } from '@/hooks/useAnnouncements'
import { useGames } from '@/hooks/useGames'

// ── Helpers ───────────────────────────────────────────────────────────────────
function daysUntil(iso: string) {
  const game = new Date(iso); game.setHours(0, 0, 0, 0)
  const today = new Date(); today.setHours(0, 0, 0, 0)
  return Math.round((game.getTime() - today.getTime()) / 86400000)
}
function formatGameDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}
function formatAnnDate(iso: string) {
  const d = new Date(iso)
  const diffDays = Math.floor((Date.now() - d.getTime()) / 86400000)
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays}d ago`
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function ParentsPage() {
  const { activeTeamId } = useTeam()
  const { data: tokenData, isLoading: tokenLoading } = useTeamToken(activeTeamId)
  const { mutateAsync: regenerate, isPending: isRegenerating } = useRegenerateToken()
  const { data: announcements = [] } = useAnnouncements()
  const { data: games = [] } = useGames()

  const [copied, setCopied] = useState(false)
  const [confirmRegen, setConfirmRegen] = useState(false)

  const upcomingGames = games
    .filter(g => daysUntil(g.scheduled_at) >= 0)
    .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())
    .slice(0, 5)

  function copyLink() {
    if (!tokenData?.url) return
    navigator.clipboard.writeText(tokenData.url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  async function handleRegenerate() {
    if (!activeTeamId) return
    await regenerate(activeTeamId)
    setConfirmRegen(false)
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-sp-text">Parent View</h1>
        <p className="text-sm mt-0.5" style={{ color: 'rgba(241,245,249,0.4)' }}>
          What parents see when you share your team link
        </p>
      </div>

      {/* ── Parent Link Card ── */}
      <div className="rounded-xl p-5 mb-6" style={{ backgroundColor: '#0E1520', border: '1px solid rgba(241,245,249,0.07)' }}>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">🔗</span>
          <p className="text-sm font-semibold text-sp-text">Parent Link</p>
        </div>

        {tokenLoading ? (
          <p className="text-sm" style={{ color: 'rgba(241,245,249,0.35)' }}>Loading…</p>
        ) : tokenData ? (
          <>
            <p className="text-xs mb-3" style={{ color: 'rgba(241,245,249,0.45)' }}>
              Share this link with parents — no login required. They can view the schedule, RSVP to games, and read announcements.
            </p>
            <div className="flex items-center gap-2 mb-4">
              <div
                className="flex-1 px-3 py-2.5 rounded-lg text-xs truncate font-mono"
                style={{ backgroundColor: 'rgba(241,245,249,0.05)', color: 'rgba(241,245,249,0.6)', border: '1px solid rgba(241,245,249,0.08)' }}
              >
                {tokenData.url}
              </div>
              <button
                onClick={copyLink}
                className="px-4 py-2.5 text-sm font-semibold rounded-lg flex-shrink-0 transition-all"
                style={{
                  backgroundColor: copied ? 'rgba(34,197,94,0.15)' : 'rgba(247,98,10,0.15)',
                  color: copied ? '#22C55E' : '#F7620A',
                  border: `1px solid ${copied ? 'rgba(34,197,94,0.3)' : 'rgba(247,98,10,0.3)'}`,
                }}
              >
                {copied ? '✓ Copied' : 'Copy'}
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <a
                  href={tokenData.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-semibold transition-opacity hover:opacity-80"
                  style={{ color: '#38BDF8' }}
                >
                  Preview as parent →
                </a>
                <span className="text-xs" style={{ color: 'rgba(241,245,249,0.2)' }}>
                  {tokenData.accessCount} view{tokenData.accessCount !== 1 ? 's' : ''}
                </span>
              </div>
              {confirmRegen ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs" style={{ color: 'rgba(241,245,249,0.4)' }}>Old link breaks — confirm?</span>
                  <button onClick={handleRegenerate} disabled={isRegenerating} className="text-xs font-semibold" style={{ color: '#EF4444' }}>
                    {isRegenerating ? 'Regenerating…' : 'Yes, regenerate'}
                  </button>
                  <button onClick={() => setConfirmRegen(false)} className="text-xs" style={{ color: 'rgba(241,245,249,0.35)' }}>Cancel</button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmRegen(true)}
                  className="text-xs transition-opacity hover:opacity-60"
                  style={{ color: 'rgba(241,245,249,0.3)' }}
                >
                  Regenerate link
                </button>
              )}
            </div>
          </>
        ) : (
          <p className="text-sm" style={{ color: 'rgba(241,245,249,0.4)' }}>No team selected.</p>
        )}
      </div>

      {/* ── What Parents See ── */}
      <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: 'rgba(241,245,249,0.3)' }}>
        What parents see right now
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">

        {/* Announcements preview */}
        <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#0E1520', border: '1px solid rgba(241,245,249,0.07)' }}>
          <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid rgba(241,245,249,0.06)' }}>
            <p className="text-xs font-semibold text-sp-text">📢 Announcements</p>
            <Link href="/comms" className="text-xs font-medium" style={{ color: '#F7620A' }}>Manage →</Link>
          </div>
          {announcements.length === 0 ? (
            <div className="px-4 py-6 text-center">
              <p className="text-xs" style={{ color: 'rgba(241,245,249,0.3)' }}>No announcements posted</p>
              <Link href="/comms" className="text-xs font-semibold mt-2 block" style={{ color: '#F7620A' }}>+ Post one</Link>
            </div>
          ) : (
            <div>
              {announcements.slice(0, 4).map((a, i) => (
                <div
                  key={a.id}
                  className="px-4 py-3 flex items-start gap-2"
                  style={{ borderBottom: i < Math.min(announcements.length, 4) - 1 ? '1px solid rgba(241,245,249,0.04)' : 'none' }}
                >
                  {a.is_pinned && <span className="text-xs flex-shrink-0 mt-0.5">📌</span>}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-sp-text truncate">{a.title}</p>
                    <p className="text-xs truncate mt-0.5" style={{ color: 'rgba(241,245,249,0.4)' }}>{a.body}</p>
                  </div>
                  <p className="text-xs flex-shrink-0" style={{ color: 'rgba(241,245,249,0.25)' }}>{formatAnnDate(a.created_at)}</p>
                </div>
              ))}
              {announcements.length > 4 && (
                <div className="px-4 py-2.5 text-center" style={{ borderTop: '1px solid rgba(241,245,249,0.04)' }}>
                  <Link href="/comms" className="text-xs" style={{ color: 'rgba(241,245,249,0.3)' }}>+{announcements.length - 4} more</Link>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Upcoming games preview */}
        <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#0E1520', border: '1px solid rgba(241,245,249,0.07)' }}>
          <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid rgba(241,245,249,0.06)' }}>
            <p className="text-xs font-semibold text-sp-text">🏀 Upcoming Games</p>
            <Link href="/game" className="text-xs font-medium" style={{ color: '#F7620A' }}>Manage →</Link>
          </div>
          {upcomingGames.length === 0 ? (
            <div className="px-4 py-6 text-center">
              <p className="text-xs" style={{ color: 'rgba(241,245,249,0.3)' }}>No upcoming games</p>
              <Link href="/game" className="text-xs font-semibold mt-2 block" style={{ color: '#F7620A' }}>+ Add one</Link>
            </div>
          ) : (
            <div>
              {upcomingGames.map((g, i) => {
                const d = daysUntil(g.scheduled_at)
                return (
                  <div
                    key={g.id}
                    className="px-4 py-3 flex items-center gap-3"
                    style={{ borderBottom: i < upcomingGames.length - 1 ? '1px solid rgba(241,245,249,0.04)' : 'none' }}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-sp-text truncate">vs {g.opponent}</p>
                      <p className="text-xs mt-0.5" style={{ color: 'rgba(241,245,249,0.4)' }}>{formatGameDate(g.scheduled_at)}</p>
                    </div>
                    <span
                      className="text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
                      style={{
                        backgroundColor: d === 0 ? 'rgba(247,98,10,0.15)' : 'rgba(56,189,248,0.1)',
                        color: d === 0 ? '#F7620A' : '#38BDF8',
                      }}
                    >
                      {d === 0 ? 'Today' : d === 1 ? 'Tomorrow' : `${d}d`}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Tip */}
      <div className="rounded-xl px-4 py-3" style={{ backgroundColor: 'rgba(247,98,10,0.06)', border: '1px solid rgba(247,98,10,0.15)' }}>
        <p className="text-xs" style={{ color: 'rgba(241,245,249,0.5)' }}>
          <span style={{ color: '#F7620A', fontWeight: 600 }}>Tip:</span> Post an announcement or add games above — parents will see updates instantly when they open their link.
        </p>
      </div>
    </div>
  )
}
