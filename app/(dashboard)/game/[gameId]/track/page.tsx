'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Barlow_Condensed } from 'next/font/google'
import { useGame, useUpdateGame } from '@/hooks/useGames'
import { usePlayers, type Player } from '@/hooks/usePlayers'
import { useEvaluations } from '@/hooks/useEvaluations'
import { useGameStore, formatClock, QUARTER_SECONDS, type GameEvent } from '@/stores/gameStore'

const barlow = Barlow_Condensed({ subsets: ['latin'], weight: '900' })

const PLAYER_COLORS = ['#3A86FF','#F7620A','#0ECFB0','#8B5CF6','#F5B731','#E879F9','#22C55E','#38BDF8','#FB923C','#A78BFA']

function initials(p: Player) {
  return `${p.first_name[0]}${(p.last_name ?? '')[0] ?? ''}`.toUpperCase()
}

// ── Sub Modal ─────────────────────────────────────────────────────────────────
function SubModal({
  outPlayer, benchPlayers, gradeMap, onSub, onClose,
}: {
  outPlayer: Player
  benchPlayers: Player[]
  gradeMap: Map<string, string>
  onSub: (inId: string) => void
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-sm rounded-2xl overflow-hidden" style={{ backgroundColor: '#0E1520', border: '1px solid rgba(241,245,249,0.1)' }}>
        <div className="px-5 py-4" style={{ borderBottom: '1px solid rgba(241,245,249,0.07)' }}>
          <p className="text-xs font-medium mb-0.5" style={{ color: 'rgba(241,245,249,0.4)' }}>Substituting out</p>
          <p className={`text-xl text-sp-text ${barlow.className}`}>{outPlayer.first_name} {outPlayer.last_name ?? ''}</p>
        </div>
        <div className="py-2 max-h-72 overflow-y-auto">
          {benchPlayers.length === 0 ? (
            <p className="px-5 py-4 text-sm" style={{ color: 'rgba(241,245,249,0.4)' }}>No bench players available</p>
          ) : benchPlayers.map((p, i) => {
            const grade = gradeMap.get(p.id)
            const gradeColor = grade?.startsWith('A') ? '#0ECFB0' : grade?.startsWith('B') ? '#38BDF8' : grade?.startsWith('C') ? '#F5B731' : '#EF4444'
            const color = PLAYER_COLORS[i % PLAYER_COLORS.length]
            return (
              <button
                key={p.id}
                onClick={() => onSub(p.id)}
                className="w-full flex items-center gap-3 px-5 py-3.5 text-left transition-colors active:bg-white/[0.08]"
                style={{ minHeight: 56 }}
                onTouchStart={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(241,245,249,0.05)' }}
                onTouchEnd={e => { (e.currentTarget as HTMLElement).style.backgroundColor = '' }}
              >
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                  style={{ backgroundColor: `${color}22`, color, border: `1px solid ${color}44` }}>
                  {initials(p)}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-sp-text">{p.first_name} {p.last_name ?? ''}</p>
                  <p className="text-xs" style={{ color: 'rgba(241,245,249,0.4)' }}>
                    {[p.position, p.jersey_number ? `#${p.jersey_number}` : null].filter(Boolean).join(' · ')}
                  </p>
                </div>
                {grade && <span className="text-sm font-bold" style={{ color: gradeColor }}>{grade}</span>}
              </button>
            )
          })}
        </div>
        <div className="px-5 py-3" style={{ borderTop: '1px solid rgba(241,245,249,0.07)' }}>
          <button onClick={onClose} className="w-full py-3 text-sm font-medium rounded-xl" style={{ backgroundColor: 'rgba(241,245,249,0.06)', color: 'rgba(241,245,249,0.6)', minHeight: 48 }}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

// ── End Game Modal ────────────────────────────────────────────────────────────
function EndGameModal({
  ourScore, opponentScore, opponentName,
  onSave, onCancel, isSaving,
}: {
  ourScore: number; opponentScore: number; opponentName: string
  onSave: (notes: string) => void; onCancel: () => void; isSaving: boolean
}) {
  const [notes, setNotes] = useState('')
  const diff = ourScore - opponentScore
  const result = diff > 0 ? 'WIN' : diff < 0 ? 'LOSS' : 'TIE'
  const resultColor = diff > 0 ? '#22C55E' : diff < 0 ? '#EF4444' : '#F5B731'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-sm rounded-2xl overflow-hidden" style={{ backgroundColor: '#0E1520', border: '1px solid rgba(241,245,249,0.1)' }}>
        <div className="px-6 py-5 text-center" style={{ borderBottom: '1px solid rgba(241,245,249,0.07)' }}>
          <p className={`text-5xl font-bold mb-1 ${barlow.className}`} style={{ color: resultColor }}>{result}</p>
          <p className={`text-3xl text-sp-text ${barlow.className}`}>{ourScore} – {opponentScore}</p>
          <p className="text-sm mt-1" style={{ color: 'rgba(241,245,249,0.4)' }}>vs {opponentName}</p>
        </div>
        <div className="px-5 py-4 space-y-3">
          <div>
            <label className="block mb-1.5 text-xs font-medium" style={{ color: 'rgba(241,245,249,0.6)' }}>Game Notes</label>
            <textarea
              value={notes} onChange={e => setNotes(e.target.value)}
              className="sp-input" rows={3} placeholder="Add post-game notes..." style={{ resize: 'none' }}
            />
          </div>
        </div>
        <div className="flex gap-2 px-5 pb-5">
          <button onClick={onCancel} className="flex-1 py-3.5 text-sm font-medium rounded-xl" style={{ backgroundColor: 'rgba(241,245,249,0.06)', color: 'rgba(241,245,249,0.5)' }}>
            Cancel
          </button>
          <button onClick={() => onSave(notes)} disabled={isSaving}
            className="flex-1 py-3.5 text-sm font-bold rounded-xl disabled:opacity-50"
            style={{ backgroundColor: '#F7620A', color: '#fff' }}>
            {isSaving ? 'Saving...' : 'Save & View Summary'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Player Chip ───────────────────────────────────────────────────────────────
function PlayerChip({
  player, playerIndex, fouls, onFoulAdd, onFoulRemove, onSub,
}: {
  player: Player; playerIndex: number; fouls: number
  onFoulAdd: () => void; onFoulRemove: () => void; onSub: () => void
}) {
  const color = PLAYER_COLORS[playerIndex % PLAYER_COLORS.length]
  const disqualified = fouls >= 5

  return (
    <div className="rounded-xl p-3 flex flex-col gap-2"
      style={{ backgroundColor: 'rgba(241,245,249,0.03)', border: `1px solid ${disqualified ? 'rgba(239,68,68,0.4)' : 'rgba(241,245,249,0.08)'}` }}>
      {/* Name row */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
          style={{ backgroundColor: `${color}22`, color, border: `1px solid ${color}44` }}>
          {initials(player)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-sp-text truncate leading-tight">{player.first_name} {player.last_name ?? ''}</p>
          <p className="text-xs leading-tight" style={{ color: 'rgba(241,245,249,0.4)' }}>
            {[player.jersey_number ? `#${player.jersey_number}` : null, player.position].filter(Boolean).join(' ')}
          </p>
        </div>
        {disqualified && <span className="text-xs font-bold" style={{ color: '#EF4444' }}>DQ</span>}
      </div>

      {/* Foul dots */}
      <div className="flex items-center gap-1">
        {Array.from({ length: 5 }, (_, i) => (
          <button
            key={i}
            onClick={i < fouls ? onFoulRemove : onFoulAdd}
            className="w-6 h-6 rounded-full flex items-center justify-center transition-opacity"
            style={{
              backgroundColor: i < fouls ? 'rgba(239,68,68,0.8)' : 'rgba(241,245,249,0.1)',
              border: `1px solid ${i < fouls ? '#EF4444' : 'rgba(241,245,249,0.15)'}`,
            }}
            title={i < fouls ? 'Remove foul' : 'Add foul'}
          >
            <span className="text-xs font-bold" style={{ color: i < fouls ? '#fff' : 'rgba(241,245,249,0.3)' }}>
              {i < fouls ? '●' : '○'}
            </span>
          </button>
        ))}
        <button
          onClick={onSub}
          className="ml-auto px-3 py-1 rounded-lg text-xs font-bold transition-colors"
          style={{ backgroundColor: 'rgba(139,92,246,0.15)', color: '#8B5CF6', border: '1px solid rgba(139,92,246,0.3)', minHeight: 28 }}
        >
          SUB
        </button>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function TrackPage() {
  const { gameId } = useParams() as { gameId: string }
  const router = useRouter()

  const { data: game, isLoading } = useGame(gameId)
  const { data: players = [] } = usePlayers()
  const { data: evals = [] } = useEvaluations()
  const { mutateAsync: updateGame, isPending: isSavingGame } = useUpdateGame()

  const {
    ourScore, opponentScore, currentQuarter, clockSeconds, clockRunning,
    activeLineup, gameLog, playerFouls, isEnded,
    initGame, addScore, undoLastScore, nextQuarter, toggleClock, tickClock,
    substitutePlayers, addFoul, removeFoul, undoEvent, endGame,
  } = useGameStore()

  const [initialized, setInitialized] = useState(false)
  const [subFor, setSubFor] = useState<string | null>(null) // player ID being subbed out
  const [showEndGame, setShowEndGame] = useState(false)
  const [showLog, setShowLog] = useState(false)
  const [toast, setToast] = useState('')
  const [lastSaved, setLastSaved] = useState<Date | null>(null)

  // Init game from Supabase data
  useEffect(() => {
    if (!game || initialized) return
    initGame(gameId, game.lineup_q1)
    setInitialized(true)
  }, [game, initialized, gameId, initGame])

  // Clock tick
  useEffect(() => {
    if (!clockRunning) return
    const id = setInterval(() => tickClock(), 1000)
    return () => clearInterval(id)
  }, [clockRunning, tickClock])

  // Auto-save every 30s
  const autoSave = useCallback(async () => {
    if (!gameId || !initialized) return
    try {
      await updateGame({ id: gameId, our_score: ourScore, opponent_score: opponentScore, game_log: gameLog as unknown[] })
      setLastSaved(new Date())
    } catch { /* silent */ }
  }, [gameId, initialized, ourScore, opponentScore, gameLog, updateGame])

  useEffect(() => {
    const id = setInterval(autoSave, 30000)
    return () => clearInterval(id)
  }, [autoSave])

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  // Build grade map for sub modal
  const gradeMap = new Map<string, string>()
  for (const p of players) {
    const pe = evals.filter(e => e.player_id === p.id).sort((a, b) => new Date(b.evaluated_at).getTime() - new Date(a.evaluated_at).getTime())
    const latest = pe[0]
    if (latest?.grade) gradeMap.set(p.id, latest.grade)
  }

  // Active players
  const activePlayers = activeLineup
    .map(id => id ? players.find(p => p.id === id) ?? null : null)
    .filter((p): p is Player => p !== null)

  // Bench players
  const activeIds = new Set(activeLineup.filter(Boolean))
  const benchPlayers = players.filter(p => p.is_active && !activeIds.has(p.id))

  function handleSub(inId: string) {
    if (!subFor) return
    const outPlayer = players.find(p => p.id === subFor)
    const inPlayer = players.find(p => p.id === inId)
    substitutePlayers(subFor, inId)
    if (outPlayer && inPlayer) {
      showToast(`${outPlayer.first_name} OUT → ${inPlayer.first_name} IN`)
    }
    setSubFor(null)
  }

  async function handleEndGame(notes: string) {
    endGame()
    await updateGame({
      id: gameId,
      our_score: ourScore,
      opponent_score: opponentScore,
      game_log: gameLog as unknown[],
      notes: notes.trim() || null,
    })
    router.push(`/game/${gameId}/summary`)
  }

  if (isLoading || !initialized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-sm" style={{ color: 'rgba(241,245,249,0.35)' }}>Loading...</p>
      </div>
    )
  }

  if (!game) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-sm" style={{ color: 'rgba(241,245,249,0.4)' }}>Game not found</p>
      </div>
    )
  }

  const subOutPlayer = subFor ? players.find(p => p.id === subFor) ?? null : null
  const quarterDots = [1, 2, 3, 4]

  return (
    <div className="flex flex-col min-h-screen" style={{ maxWidth: 480, margin: '0 auto' }}>

      {/* ── Scoreboard ── */}
      <div className="sticky top-0 z-30 pt-2 pb-3 px-1" style={{ backgroundColor: '#080C12' }}>
        {/* Back + auto-save */}
        <div className="flex items-center justify-between mb-3 px-1">
          <button onClick={() => router.push('/game')} className="text-xs font-medium transition-opacity hover:opacity-70" style={{ color: 'rgba(241,245,249,0.4)', minHeight: 36, paddingRight: 8 }}>
            ← Games
          </button>
          <p className="text-xs" style={{ color: 'rgba(241,245,249,0.2)' }}>
            {lastSaved ? `Saved ${lastSaved.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}` : ''}
          </p>
        </div>

        {/* Scores */}
        <div className="grid grid-cols-3 items-center gap-2 px-1 mb-3">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-wide mb-1 truncate" style={{ color: 'rgba(241,245,249,0.5)' }}>Your Team</p>
            <p className={`text-7xl font-bold leading-none ${barlow.className}`} style={{ color: '#F7620A' }}>{ourScore}</p>
          </div>
          <div className="flex flex-col items-center gap-1">
            {/* Quarter dots */}
            <div className="flex gap-1.5 mb-1">
              {quarterDots.map(q => (
                <div key={q} className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: q < currentQuarter ? '#F7620A' : q === currentQuarter ? '#F7620A' : 'rgba(241,245,249,0.15)', opacity: q < currentQuarter ? 0.4 : 1 }} />
              ))}
            </div>
            {/* Quarter label */}
            <p className="text-xs font-bold" style={{ color: '#F7620A' }}>Q{currentQuarter}</p>
            {/* Clock */}
            <button
              onClick={toggleClock}
              className="font-mono font-bold rounded-lg px-3 py-1.5 transition-all"
              style={{
                fontSize: 22,
                color: clockRunning ? '#F7620A' : 'rgba(241,245,249,0.8)',
                backgroundColor: clockRunning ? 'rgba(247,98,10,0.1)' : 'rgba(241,245,249,0.06)',
                border: `1px solid ${clockRunning ? 'rgba(247,98,10,0.3)' : 'rgba(241,245,249,0.1)'}`,
                minHeight: 48,
                minWidth: 80,
              }}
            >
              {formatClock(clockSeconds)}
            </button>
            <p className="text-xs" style={{ color: 'rgba(241,245,249,0.3)' }}>{clockRunning ? 'tap to pause' : 'tap to start'}</p>
          </div>
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-wide mb-1 truncate" style={{ color: 'rgba(241,245,249,0.5)' }}>{game.opponent}</p>
            <p className={`text-7xl font-bold leading-none ${barlow.className}`} style={{ color: 'rgba(241,245,249,0.75)' }}>{opponentScore}</p>
          </div>
        </div>

        {/* Score buttons */}
        <div className="grid grid-cols-2 gap-2 px-1">
          {/* Our team */}
          <div className="flex gap-1.5">
            {([1, 2, 3] as const).map(pts => (
              <button key={pts} onClick={() => addScore('us', pts)}
                className="flex-1 rounded-xl font-bold transition-all active:scale-95"
                style={{ backgroundColor: '#F7620A', color: '#fff', height: 52, fontSize: 18 }}>
                +{pts}
              </button>
            ))}
          </div>
          {/* Opponent */}
          <div className="flex gap-1.5">
            {([1, 2, 3] as const).map(pts => (
              <button key={pts} onClick={() => addScore('them', pts)}
                className="flex-1 rounded-xl font-bold transition-all active:scale-95"
                style={{ backgroundColor: 'rgba(241,245,249,0.08)', color: 'rgba(241,245,249,0.6)', height: 52, fontSize: 18, border: '1px solid rgba(241,245,249,0.1)' }}>
                +{pts}
              </button>
            ))}
          </div>
        </div>
        <div className="flex justify-center mt-1.5 px-1">
          <button onClick={undoLastScore} className="text-xs px-4 py-1.5 rounded-lg transition-opacity hover:opacity-70" style={{ color: 'rgba(241,245,249,0.35)', minHeight: 36 }}>
            ↩ Undo last score
          </button>
        </div>
      </div>

      {/* ── Active Lineup ── */}
      <div className="flex-1 px-1 py-3">
        <p className="text-xs font-semibold uppercase tracking-wide mb-3 px-1" style={{ color: 'rgba(241,245,249,0.35)' }}>
          Current Lineup — Q{currentQuarter}
        </p>

        {activePlayers.length === 0 ? (
          <div className="rounded-xl px-4 py-6 text-center" style={{ border: '1px dashed rgba(241,245,249,0.1)' }}>
            <p className="text-sm mb-2" style={{ color: 'rgba(241,245,249,0.4)' }}>No lineup set for this game</p>
            <button onClick={() => router.push(`/game/${gameId}/lineup`)}
              className="text-sm font-semibold transition-opacity hover:opacity-80" style={{ color: '#F7620A' }}>
              Set Lineup →
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2">
            {activePlayers.map((player, i) => (
              <PlayerChip
                key={player.id}
                player={player}
                playerIndex={i}
                fouls={playerFouls[player.id] ?? 0}
                onFoulAdd={() => addFoul(player.id)}
                onFoulRemove={() => removeFoul(player.id)}
                onSub={() => setSubFor(player.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Game Log (collapsible) ── */}
      <div className="px-1 pb-2">
        <button
          onClick={() => setShowLog(v => !v)}
          className="w-full flex items-center justify-between px-4 py-3 rounded-xl transition-colors"
          style={{ backgroundColor: 'rgba(241,245,249,0.03)', border: '1px solid rgba(241,245,249,0.07)', minHeight: 48 }}
        >
          <span className="text-sm font-semibold" style={{ color: 'rgba(241,245,249,0.6)' }}>
            Game Log {gameLog.length > 0 ? `(${gameLog.length})` : ''}
          </span>
          <span style={{ color: 'rgba(241,245,249,0.4)' }}>{showLog ? '▴' : '▾'}</span>
        </button>

        {showLog && (
          <div className="mt-1 rounded-xl overflow-hidden" style={{ border: '1px solid rgba(241,245,249,0.07)', maxHeight: 240, overflowY: 'auto' }}>
            {gameLog.length === 0 ? (
              <p className="px-4 py-3 text-xs" style={{ color: 'rgba(241,245,249,0.35)' }}>No events yet</p>
            ) : [...gameLog].reverse().map(ev => {
              const isScore = ev.type === 'score'
              const isSub = ev.type === 'sub'
              const outPlayer = ev.outPlayerId ? players.find(p => p.id === ev.outPlayerId) : null
              const inPlayer = ev.inPlayerId ? players.find(p => p.id === ev.inPlayerId) : null
              const foulPlayer = ev.foulPlayerId ? players.find(p => p.id === ev.foulPlayerId) : null

              let desc = ev.description
              if (isSub && outPlayer && inPlayer) desc = `Q${ev.quarter} ${ev.timeStr} — ${outPlayer.first_name} OUT, ${inPlayer.first_name} IN`
              if (ev.type === 'foul' && foulPlayer) desc = `Q${ev.quarter} ${ev.timeStr} — ${foulPlayer.first_name} foul #${ev.foulNumber}`

              return (
                <div key={ev.id} className="flex items-center justify-between px-4 py-2.5" style={{ borderBottom: '1px solid rgba(241,245,249,0.04)' }}>
                  <span className="text-xs flex-1" style={{
                    color: isScore && ev.team === 'us' ? '#F7620A' : isScore ? 'rgba(241,245,249,0.5)' : isSub ? '#8B5CF6' : '#F5B731',
                  }}>
                    {desc}
                  </span>
                  <button onClick={() => undoEvent(ev.id)} className="ml-2 text-xs px-2 py-0.5 rounded transition-opacity hover:opacity-60" style={{ color: 'rgba(241,245,249,0.3)', minHeight: 28, minWidth: 28 }}>✕</button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Footer ── */}
      <div className="sticky bottom-0 px-1 pb-4 pt-2" style={{ backgroundColor: '#080C12', borderTop: '1px solid rgba(241,245,249,0.06)' }}>
        <div className="flex gap-2">
          <button
            onClick={nextQuarter}
            disabled={currentQuarter >= 4}
            className="flex-1 rounded-xl font-bold disabled:opacity-30 transition-all active:scale-98"
            style={{ backgroundColor: 'rgba(56,189,248,0.1)', color: '#38BDF8', border: '1px solid rgba(56,189,248,0.25)', height: 56, fontSize: 15 }}
          >
            {currentQuarter < 4 ? `Next → Q${currentQuarter + 1}` : 'Q4 (Final)'}
          </button>
          <button
            onClick={() => setShowEndGame(true)}
            className="flex-1 rounded-xl font-bold transition-all active:scale-98"
            style={{ backgroundColor: '#F7620A', color: '#fff', height: 56, fontSize: 15 }}
          >
            End Game
          </button>
        </div>
      </div>

      {/* ── Modals ── */}
      {subFor && subOutPlayer && (
        <SubModal
          outPlayer={subOutPlayer}
          benchPlayers={benchPlayers}
          gradeMap={gradeMap}
          onSub={handleSub}
          onClose={() => setSubFor(null)}
        />
      )}

      {showEndGame && (
        <EndGameModal
          ourScore={ourScore}
          opponentScore={opponentScore}
          opponentName={game.opponent}
          onSave={handleEndGame}
          onCancel={() => setShowEndGame(false)}
          isSaving={isSavingGame}
        />
      )}

      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 px-5 py-2.5 rounded-xl text-sm font-medium shadow-xl z-50"
          style={{ backgroundColor: '#1A2535', border: '1px solid rgba(241,245,249,0.12)', color: '#F1F5F9', whiteSpace: 'nowrap' }}>
          {toast}
        </div>
      )}
    </div>
  )
}
