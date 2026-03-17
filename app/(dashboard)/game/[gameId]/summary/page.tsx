'use client'

import { useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Barlow_Condensed } from 'next/font/google'
import { useGame } from '@/hooks/useGames'
import { usePlayers } from '@/hooks/usePlayers'
import type { GameEvent } from '@/stores/gameStore'

const barlow = Barlow_Condensed({ subsets: ['latin'], weight: '900' })

const PLAYER_COLORS = ['#3A86FF','#F7620A','#0ECFB0','#8B5CF6','#F5B731','#E879F9','#22C55E','#38BDF8','#FB923C','#A78BFA']

function initials(firstName: string, lastName: string | null) {
  return `${firstName[0]}${(lastName ?? '')[0] ?? ''}`.toUpperCase()
}

function formatDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
}

// ── Playing Time Calculator ────────────────────────────────────────────────────
// Returns a map of playerId → set of quarters (1-4) they played
function calcPlayingTime(
  lineups: (string | null)[][],
  gameLog: GameEvent[],
): Map<string, Set<number>> {
  const map = new Map<string, Set<number>>()

  function addQuarter(playerId: string, q: number) {
    if (!map.has(playerId)) map.set(playerId, new Set())
    map.get(playerId)!.add(q)
  }

  // Starting lineups per quarter
  lineups.forEach((lineup, idx) => {
    const q = idx + 1
    lineup.forEach(id => { if (id) addQuarter(id, q) })
  })

  // Sub events — "inPlayerId" gets credit for the quarter they entered
  for (const ev of gameLog) {
    if (ev.type === 'sub' && ev.inPlayerId) {
      addQuarter(ev.inPlayerId, ev.quarter)
    }
  }

  return map
}

// ── Score by Quarter Calculator ───────────────────────────────────────────────
function calcScoreByQuarter(gameLog: GameEvent[]): { us: number[]; them: number[] } {
  const us = [0, 0, 0, 0]
  const them = [0, 0, 0, 0]
  for (const ev of gameLog) {
    if (ev.type === 'score' && ev.points) {
      const idx = Math.min(ev.quarter - 1, 3)
      if (ev.team === 'us') us[idx] += ev.points
      else them[idx] += ev.points
    }
  }
  return { us, them }
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function SummaryPage() {
  const { gameId } = useParams() as { gameId: string }
  const router = useRouter()

  const { data: game, isLoading } = useGame(gameId)
  const { data: players = [] } = usePlayers()

  const gameLog = useMemo(() => (game?.game_log ?? []) as GameEvent[], [game])

  const { playingTime, scoreByQuarter, foulsMap, allPlayerIds } = useMemo(() => {
    const lineups = [game?.lineup_q1 ?? [], game?.lineup_q2 ?? [], game?.lineup_q3 ?? [], game?.lineup_q4 ?? []]
    const playingTime = calcPlayingTime(lineups, gameLog)
    const scoreByQuarter = calcScoreByQuarter(gameLog)

    const foulsMap = new Map<string, number>()
    for (const ev of gameLog) {
      if (ev.type === 'foul' && ev.foulPlayerId && ev.foulNumber) {
        foulsMap.set(ev.foulPlayerId, ev.foulNumber)
      }
    }

    // All player IDs that appeared at any point
    const allPlayerIds = new Set<string>()
    lineups.flat().forEach(id => { if (id) allPlayerIds.add(id) })
    gameLog.forEach(ev => {
      if (ev.type === 'sub') {
        if (ev.inPlayerId) allPlayerIds.add(ev.inPlayerId)
        if (ev.outPlayerId) allPlayerIds.add(ev.outPlayerId)
      }
    })

    return { playingTime, scoreByQuarter, foulsMap, allPlayerIds }
  }, [game, gameLog])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-sm" style={{ color: 'rgba(241,245,249,0.35)' }}>Loading...</p>
      </div>
    )
  }

  if (!game) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-3">
        <p className="text-sm" style={{ color: 'rgba(241,245,249,0.4)' }}>Game not found</p>
        <button onClick={() => router.push('/game')} className="text-sm font-semibold" style={{ color: '#F7620A' }}>
          ← Back to Games
        </button>
      </div>
    )
  }

  const ourScore = game.our_score ?? 0
  const opponentScore = game.opponent_score ?? 0
  const diff = ourScore - opponentScore
  const isWin = diff > 0
  const isTie = diff === 0
  const resultLabel = isWin ? 'W' : isTie ? 'T' : 'L'
  const resultColor = isWin ? '#22C55E' : isTie ? '#F5B731' : '#EF4444'

  // Build parent message
  const gameDate = formatDate(game.scheduled_at)
  const resultWord = isWin ? 'Win' : isTie ? 'Tie' : 'Loss'
  const parentMsg = `🏀 Game Update!\n\n${resultWord} vs ${game.opponent} · ${ourScore}–${opponentScore}\n${gameDate}${game.location ? ` · ${game.location}` : ''}\n\nGreat effort out there today! Keep working hard. 💪\n\n– Coach`
  const encodedMsg = encodeURIComponent(parentMsg)

  // Players who appeared in this game
  const gamePlayers = players.filter(p => allPlayerIds.has(p.id))
  // Sort: those who played more quarters first
  gamePlayers.sort((a, b) => (playingTime.get(b.id)?.size ?? 0) - (playingTime.get(a.id)?.size ?? 0))

  const qLabels = ['Q1', 'Q2', 'Q3', 'Q4']

  return (
    <div className="min-h-screen pb-24" style={{ maxWidth: 520, margin: '0 auto' }}>
      <div className="px-4 pt-4">

        {/* ── Back ── */}
        <button
          onClick={() => router.push('/game')}
          className="text-xs font-medium mb-4 block transition-opacity hover:opacity-70"
          style={{ color: 'rgba(241,245,249,0.4)', minHeight: 36 }}
        >
          ← Back to Games
        </button>

        {/* ── Result Header ── */}
        <div className="rounded-2xl p-6 mb-4 text-center" style={{ backgroundColor: '#0E1520', border: '1px solid rgba(241,245,249,0.07)' }}>
          <div className="flex items-center justify-center gap-4 mb-2">
            <div className="text-center">
              <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: 'rgba(241,245,249,0.4)' }}>Your Team</p>
              <p className={`text-6xl font-bold leading-none ${barlow.className}`} style={{ color: '#F7620A' }}>{ourScore}</p>
            </div>
            <div className="flex flex-col items-center">
              <p className={`text-5xl font-bold ${barlow.className}`} style={{ color: resultColor }}>{resultLabel}</p>
              <p className="text-sm font-semibold mt-0.5" style={{ color: 'rgba(241,245,249,0.3)' }}>FINAL</p>
            </div>
            <div className="text-center">
              <p className="text-xs font-semibold uppercase tracking-widest mb-1 truncate max-w-24" style={{ color: 'rgba(241,245,249,0.4)' }}>{game.opponent}</p>
              <p className={`text-6xl font-bold leading-none ${barlow.className}`} style={{ color: 'rgba(241,245,249,0.7)' }}>{opponentScore}</p>
            </div>
          </div>
          <p className="text-sm mt-3" style={{ color: 'rgba(241,245,249,0.4)' }}>
            vs {game.opponent} · {formatDate(game.scheduled_at)}
            {game.location ? ` · ${game.location}` : ''}
          </p>
        </div>

        {/* ── Score by Quarter ── */}
        <section className="rounded-2xl overflow-hidden mb-4" style={{ backgroundColor: '#0E1520', border: '1px solid rgba(241,245,249,0.07)' }}>
          <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(241,245,249,0.06)' }}>
            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'rgba(241,245,249,0.35)' }}>Score by Quarter</p>
          </div>
          <div className="px-4 py-3">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="text-left py-1 font-medium w-1/3" style={{ color: 'rgba(241,245,249,0.35)', fontSize: 11 }}></th>
                  {qLabels.map(q => (
                    <th key={q} className="text-center py-1 font-semibold" style={{ color: 'rgba(241,245,249,0.35)', fontSize: 11 }}>{q}</th>
                  ))}
                  <th className="text-center py-1 font-semibold" style={{ color: 'rgba(241,245,249,0.35)', fontSize: 11 }}>TOT</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="py-2 font-semibold" style={{ color: '#F7620A', fontSize: 13 }}>Your Team</td>
                  {scoreByQuarter.us.map((pts, i) => (
                    <td key={i} className="text-center py-2 font-bold" style={{ color: pts > 0 ? '#F1F5F9' : 'rgba(241,245,249,0.2)', fontSize: 15 }}>{pts}</td>
                  ))}
                  <td className="text-center py-2 font-bold" style={{ color: '#F7620A', fontSize: 15 }}>{ourScore}</td>
                </tr>
                <tr>
                  <td className="py-2 font-semibold truncate max-w-0" style={{ color: 'rgba(241,245,249,0.55)', fontSize: 13 }}>{game.opponent}</td>
                  {scoreByQuarter.them.map((pts, i) => (
                    <td key={i} className="text-center py-2 font-bold" style={{ color: pts > 0 ? 'rgba(241,245,249,0.6)' : 'rgba(241,245,249,0.2)', fontSize: 15 }}>{pts}</td>
                  ))}
                  <td className="text-center py-2 font-bold" style={{ color: 'rgba(241,245,249,0.6)', fontSize: 15 }}>{opponentScore}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* ── Playing Time ── */}
        {gamePlayers.length > 0 && (
          <section className="rounded-2xl overflow-hidden mb-4" style={{ backgroundColor: '#0E1520', border: '1px solid rgba(241,245,249,0.07)' }}>
            <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(241,245,249,0.06)' }}>
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'rgba(241,245,249,0.35)' }}>Playing Time</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(241,245,249,0.05)' }}>
                    <th className="text-left px-4 py-2 font-medium" style={{ color: 'rgba(241,245,249,0.35)', fontSize: 11, minWidth: 120 }}>Player</th>
                    {qLabels.map(q => (
                      <th key={q} className="text-center px-2 py-2 font-semibold" style={{ color: 'rgba(241,245,249,0.35)', fontSize: 11, width: 44 }}>{q}</th>
                    ))}
                    <th className="text-center px-3 py-2 font-semibold" style={{ color: 'rgba(241,245,249,0.35)', fontSize: 11 }}>Fouls</th>
                  </tr>
                </thead>
                <tbody>
                  {gamePlayers.map((player, idx) => {
                    const quarters = playingTime.get(player.id) ?? new Set()
                    const fouls = foulsMap.get(player.id) ?? 0
                    const color = PLAYER_COLORS[idx % PLAYER_COLORS.length]
                    return (
                      <tr key={player.id} style={{ borderBottom: '1px solid rgba(241,245,249,0.04)' }}>
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                              style={{ backgroundColor: `${color}22`, color, border: `1px solid ${color}44` }}>
                              {initials(player.first_name, player.last_name)}
                            </div>
                            <div>
                              <p className="text-xs font-semibold leading-tight text-sp-text">{player.first_name} {player.last_name ?? ''}</p>
                              {player.jersey_number && (
                                <p className="text-xs leading-tight" style={{ color: 'rgba(241,245,249,0.35)' }}>#{player.jersey_number}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        {[1, 2, 3, 4].map(q => (
                          <td key={q} className="text-center px-2 py-2.5">
                            {quarters.has(q) ? (
                              <span className="text-sm" style={{ color: '#22C55E' }}>✓</span>
                            ) : (
                              <span className="text-sm" style={{ color: 'rgba(241,245,249,0.12)' }}>–</span>
                            )}
                          </td>
                        ))}
                        <td className="text-center px-3 py-2.5">
                          {fouls > 0 ? (
                            <span className="text-xs font-bold px-1.5 py-0.5 rounded" style={{ backgroundColor: fouls >= 5 ? 'rgba(239,68,68,0.15)' : 'rgba(245,183,49,0.12)', color: fouls >= 5 ? '#EF4444' : '#F5B731' }}>
                              {fouls}
                            </span>
                          ) : (
                            <span className="text-xs" style={{ color: 'rgba(241,245,249,0.2)' }}>–</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* ── Coach Notes ── */}
        {game.notes && (
          <section className="rounded-2xl p-4 mb-4" style={{ backgroundColor: '#0E1520', border: '1px solid rgba(241,245,249,0.07)' }}>
            <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'rgba(241,245,249,0.35)' }}>Coach Notes</p>
            <p className="text-sm leading-relaxed" style={{ color: 'rgba(241,245,249,0.7)' }}>{game.notes}</p>
          </section>
        )}

        {/* ── Post-Game Parent Message ── */}
        <section className="rounded-2xl p-4 mb-4" style={{ backgroundColor: 'rgba(14,207,176,0.06)', border: '1px solid rgba(14,207,176,0.2)' }}>
          <div className="flex items-center gap-2 mb-3">
            <span style={{ color: '#0ECFB0', fontSize: 18 }}>📣</span>
            <p className="text-sm font-bold" style={{ color: '#0ECFB0' }}>Post-Game Parent Message</p>
          </div>
          <div className="rounded-xl p-3 mb-3 text-xs leading-relaxed whitespace-pre-wrap" style={{ backgroundColor: 'rgba(0,0,0,0.2)', color: 'rgba(241,245,249,0.65)', fontFamily: 'monospace' }}>
            {parentMsg}
          </div>
          <div className="flex gap-2">
            <a
              href={`sms:?body=${encodedMsg}`}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-xl py-3 text-xs font-bold transition-opacity hover:opacity-80"
              style={{ backgroundColor: 'rgba(34,197,94,0.12)', color: '#22C55E', border: '1px solid rgba(34,197,94,0.25)' }}
            >
              <span>💬</span> SMS
            </a>
            <a
              href={`mailto:?subject=${encodeURIComponent(`Game Update: ${resultWord} vs ${game.opponent}`)}&body=${encodedMsg}`}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-xl py-3 text-xs font-bold transition-opacity hover:opacity-80"
              style={{ backgroundColor: 'rgba(56,189,248,0.1)', color: '#38BDF8', border: '1px solid rgba(56,189,248,0.25)' }}
            >
              <span>✉️</span> Email
            </a>
            <a
              href={`https://wa.me/?text=${encodedMsg}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-1.5 rounded-xl py-3 text-xs font-bold transition-opacity hover:opacity-80"
              style={{ backgroundColor: 'rgba(37,211,102,0.1)', color: '#25D366', border: '1px solid rgba(37,211,102,0.25)' }}
            >
              <span>📱</span> WhatsApp
            </a>
          </div>
        </section>

        {/* ── Action Buttons ── */}
        <div className="flex gap-3 mt-2">
          <button
            onClick={() => router.push(`/game/${gameId}/track`)}
            className="flex-1 py-4 rounded-xl text-sm font-bold transition-all active:scale-98"
            style={{ backgroundColor: 'rgba(241,245,249,0.06)', color: 'rgba(241,245,249,0.6)', border: '1px solid rgba(241,245,249,0.1)' }}
          >
            ← Back to Game
          </button>
          <button
            onClick={() => router.push('/game')}
            className="flex-1 py-4 rounded-xl text-sm font-bold transition-all active:scale-98"
            style={{ backgroundColor: '#F7620A', color: '#fff' }}
          >
            All Games →
          </button>
        </div>
      </div>
    </div>
  )
}
