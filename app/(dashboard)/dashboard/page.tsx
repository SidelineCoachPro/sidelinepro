'use client'

import { useGames } from '@/hooks/useGames'
import Link from 'next/link'
import { Barlow_Condensed } from 'next/font/google'

const barlow = Barlow_Condensed({ subsets: ['latin'], weight: '900' })

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
}

function formatTime(iso: string) {
  const d = new Date(iso)
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

export default function DashboardPage() {
  const { data: games = [] } = useGames()
  const today = new Date()
  const todayGames = games.filter(g => isSameDay(new Date(g.scheduled_at), today))

  return (
    <div className="min-h-screen px-4 py-6" style={{ maxWidth: 520, margin: '0 auto' }}>

      {/* ── Game Today Banner ── */}
      {todayGames.length > 0 && (
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#F7620A' }}>
            🏀 Game Day
          </p>
          <div className="space-y-3">
            {todayGames.map(game => (
              <div
                key={game.id}
                className="rounded-2xl p-4"
                style={{ backgroundColor: 'rgba(247,98,10,0.07)', border: '1px solid rgba(247,98,10,0.25)' }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className={`text-2xl font-bold text-sp-text ${barlow.className}`}>
                      vs {game.opponent}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: 'rgba(241,245,249,0.45)' }}>
                      {formatTime(game.scheduled_at)}
                      {game.location ? ` · ${game.location}` : ''}
                    </p>
                  </div>
                  {(game.our_score !== null || game.opponent_score !== null) && (
                    <div className="text-right">
                      <p className={`text-xl font-bold ${barlow.className}`} style={{ color: '#F7620A' }}>
                        {game.our_score ?? 0} – {game.opponent_score ?? 0}
                      </p>
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Link
                    href={`/game/${game.id}/lineup`}
                    className="flex-1 py-2.5 text-center text-sm font-bold rounded-xl transition-opacity hover:opacity-80"
                    style={{ backgroundColor: 'rgba(56,189,248,0.12)', color: '#38BDF8', border: '1px solid rgba(56,189,248,0.25)' }}
                  >
                    Lineup
                  </Link>
                  <Link
                    href={`/game/${game.id}/track`}
                    className="flex-1 py-2.5 text-center text-sm font-bold rounded-xl transition-opacity hover:opacity-80"
                    style={{ backgroundColor: '#F7620A', color: '#fff' }}
                  >
                    Track Game →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Welcome / Default State ── */}
      {todayGames.length === 0 && (
        <div className="text-center py-16">
          <h1 className={`text-4xl font-bold text-sp-orange mb-2 ${barlow.className}`}>SidelinePro</h1>
          <p className="text-sp-text text-base font-medium">Welcome, Coach</p>
          <p className="mt-1 text-sm" style={{ color: 'rgba(241,245,249,0.35)' }}>No games scheduled for today.</p>
          <Link href="/game" className="inline-block mt-6 text-sm font-semibold transition-opacity hover:opacity-80" style={{ color: '#F7620A' }}>
            View Schedule →
          </Link>
        </div>
      )}

      {/* ── Quick Nav ── */}
      <div className="grid grid-cols-2 gap-3 mt-2">
        {[
          { label: 'Players', href: '/players', icon: '👥', desc: 'Roster & evals' },
          { label: 'Games', href: '/game', icon: '🏀', desc: 'Schedule & scores' },
          { label: 'Practice', href: '/practice', icon: '📋', desc: 'Plans & drills' },
          { label: 'Comms', href: '/comms', icon: '💬', desc: 'Message parents' },
        ].map(item => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-2xl p-4 transition-colors hover:opacity-80"
            style={{ backgroundColor: '#0E1520', border: '1px solid rgba(241,245,249,0.07)' }}
          >
            <p className="text-2xl mb-1">{item.icon}</p>
            <p className="text-sm font-bold text-sp-text">{item.label}</p>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(241,245,249,0.35)' }}>{item.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
