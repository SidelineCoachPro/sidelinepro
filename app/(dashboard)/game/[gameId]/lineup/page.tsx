'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { Barlow_Condensed } from 'next/font/google'
import { useGame, useUpdateGame } from '@/hooks/useGames'
import { usePlayers, type Player } from '@/hooks/usePlayers'
import { useEvaluations } from '@/hooks/useEvaluations'

const barlow = Barlow_Condensed({ subsets: ['latin'], weight: '900' })

const POSITIONS = ['PG', 'SG', 'SF', 'PF', 'C'] as const
type QuarterKey = 'q1' | 'q2' | 'q3' | 'q4'
const QUARTERS: QuarterKey[] = ['q1', 'q2', 'q3', 'q4']

// ── Grade helpers ─────────────────────────────────────────────────────────────
function calcGrade(avg: number): string {
  if (avg >= 9)   return 'A+'
  if (avg >= 8.5) return 'A'
  if (avg >= 8)   return 'A-'
  if (avg >= 7.5) return 'B+'
  if (avg >= 7)   return 'B'
  if (avg >= 6.5) return 'B-'
  if (avg >= 6)   return 'C+'
  if (avg >= 5.5) return 'C'
  if (avg >= 5)   return 'C-'
  return 'D'
}
function gradeColor(grade: string): string {
  if (grade.startsWith('A')) return '#0ECFB0'
  if (grade.startsWith('B')) return '#38BDF8'
  if (grade.startsWith('C')) return '#F5B731'
  return '#EF4444'
}

// ── Draggable Player Chip ─────────────────────────────────────────────────────
function DraggableChip({ player, avg, grade, used }: { player: Player; avg: number | null; grade: string | null; used: boolean }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: `player-${player.id}` })
  const gColor = grade ? gradeColor(grade) : 'rgba(241,245,249,0.3)'

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className="flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-grab active:cursor-grabbing select-none transition-opacity"
      style={{
        backgroundColor: 'rgba(241,245,249,0.04)',
        border: '1px solid rgba(241,245,249,0.08)',
        opacity: isDragging ? 0.4 : used ? 0.35 : 1,
        touchAction: 'none',
      }}
    >
      <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ backgroundColor: `${gColor}18`, color: gColor, border: `1px solid ${gColor}33` }}>
        {player.first_name[0]}{(player.last_name ?? '')[0] ?? ''}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-sp-text truncate">{player.first_name} {player.last_name ?? ''}</p>
        <p className="text-xs" style={{ color: 'rgba(241,245,249,0.4)' }}>
          {[player.position, player.jersey_number ? `#${player.jersey_number}` : null].filter(Boolean).join(' · ')}
        </p>
      </div>
      {grade && (
        <span className="text-xs font-bold flex-shrink-0" style={{ color: gColor }}>{grade}</span>
      )}
    </div>
  )
}

// Chip used in DragOverlay (no dnd hooks)
function PlayerChip({ player, avg, grade }: { player: Player; avg: number | null; grade: string | null }) {
  const gColor = grade ? gradeColor(grade) : 'rgba(241,245,249,0.3)'
  return (
    <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg" style={{ backgroundColor: '#1A2535', border: '1px solid rgba(241,245,249,0.15)', minWidth: 160 }}>
      <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ backgroundColor: `${gColor}18`, color: gColor }}>
        {player.first_name[0]}{(player.last_name ?? '')[0] ?? ''}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-sp-text truncate">{player.first_name} {player.last_name ?? ''}</p>
      </div>
      {grade && <span className="text-xs font-bold" style={{ color: gColor }}>{grade}</span>}
    </div>
  )
}

// ── Droppable Slot ────────────────────────────────────────────────────────────
function LineupSlot({
  qtr, slotIdx, playerId, players, gradeMap, pickerSlot, onSetPicker, onRemove, onPickPlayer,
}: {
  qtr: QuarterKey
  slotIdx: number
  playerId: string | null
  players: Player[]
  gradeMap: Map<string, { grade: string; avg: number }>
  pickerSlot: string | null
  onSetPicker: (key: string | null) => void
  onRemove: () => void
  onPickPlayer: (playerId: string) => void
}) {
  const slotKey = `${qtr}-${slotIdx}`
  const { setNodeRef, isOver } = useDroppable({ id: `slot-${slotKey}` })
  const position = POSITIONS[slotIdx]
  const player = playerId ? players.find(p => p.id === playerId) ?? null : null
  const gradeInfo = player ? gradeMap.get(player.id) ?? null : null
  const gColor = gradeInfo ? gradeColor(gradeInfo.grade) : '#38BDF8'
  const pickerRef = useRef<HTMLDivElement>(null)

  // Close picker on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        onSetPicker(null)
      }
    }
    if (pickerSlot === slotKey) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [pickerSlot, slotKey, onSetPicker])

  // Available players (not yet in any slot of same quarter — handled by parent)
  const availablePlayers = players.filter(p => p.id !== playerId)

  return (
    <div
      ref={setNodeRef}
      className="relative rounded-xl p-3.5 transition-all"
      style={{
        backgroundColor: isOver ? 'rgba(139,92,246,0.12)' : player ? 'rgba(241,245,249,0.03)' : 'rgba(241,245,249,0.02)',
        border: isOver ? '1px solid rgba(139,92,246,0.5)' : player ? '1px solid rgba(241,245,249,0.1)' : '1px dashed rgba(241,245,249,0.12)',
        minHeight: 72,
      }}
    >
      <div className="flex items-center gap-2">
        {/* Position label */}
        <span className="text-xs font-bold w-8 flex-shrink-0" style={{ color: player ? 'rgba(241,245,249,0.35)' : '#38BDF8' }}>
          {position}
        </span>

        {player ? (
          <>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-sp-text truncate">{player.first_name} {player.last_name ?? ''}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                {player.jersey_number && <span className="text-xs" style={{ color: 'rgba(241,245,249,0.4)' }}>#{player.jersey_number}</span>}
                {player.position && <span className="text-xs" style={{ color: 'rgba(241,245,249,0.4)' }}>{player.position}</span>}
              </div>
            </div>
            {gradeInfo && (
              <span className="text-sm font-bold flex-shrink-0" style={{ color: gradeColor(gradeInfo.grade) }}>
                {gradeInfo.grade}
              </span>
            )}
            <button
              onClick={onRemove}
              className="w-5 h-5 flex items-center justify-center rounded-full flex-shrink-0 transition-opacity hover:opacity-100 opacity-40"
              style={{ color: 'rgba(241,245,249,0.8)' }}
            >
              ✕
            </button>
          </>
        ) : (
          <button
            onClick={() => onSetPicker(pickerSlot === slotKey ? null : slotKey)}
            className="flex-1 text-left text-xs transition-opacity hover:opacity-75"
            style={{ color: 'rgba(241,245,249,0.3)' }}
          >
            Tap to assign player…
          </button>
        )}
      </div>

      {/* Picker dropdown */}
      {pickerSlot === slotKey && (
        <div
          ref={pickerRef}
          className="absolute left-0 right-0 top-full mt-1 rounded-xl overflow-hidden z-20 shadow-xl"
          style={{ backgroundColor: '#141E2D', border: '1px solid rgba(241,245,249,0.12)', maxHeight: 200, overflowY: 'auto' }}
        >
          {availablePlayers.length === 0 ? (
            <p className="px-4 py-3 text-xs" style={{ color: 'rgba(241,245,249,0.4)' }}>No players available</p>
          ) : (
            availablePlayers.map(p => {
              const gi = gradeMap.get(p.id)
              const gc = gi ? gradeColor(gi.grade) : 'rgba(241,245,249,0.3)'
              return (
                <button
                  key={p.id}
                  onClick={() => { onPickPlayer(p.id); onSetPicker(null) }}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-left transition-colors hover:bg-white/[0.04]"
                >
                  <span className="text-xs font-semibold text-sp-text flex-1 truncate">{p.first_name} {p.last_name ?? ''}</span>
                  {p.position && <span className="text-xs" style={{ color: 'rgba(241,245,249,0.35)' }}>{p.position}</span>}
                  {gi && <span className="text-xs font-bold" style={{ color: gc }}>{gi.grade}</span>}
                </button>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function LineupPage() {
  const { gameId } = useParams() as { gameId: string }
  const router = useRouter()

  const { data: game, isLoading: loadingGame } = useGame(gameId)
  const { data: players = [] } = usePlayers()
  const { data: evals = [] } = useEvaluations()
  const { mutateAsync: updateGame, isPending: isSaving } = useUpdateGame()

  const [activeQtr, setActiveQtr] = useState<QuarterKey>('q1')
  const [lineups, setLineups] = useState<Record<QuarterKey, (string | null)[]>>({
    q1: Array(5).fill(null), q2: Array(5).fill(null), q3: Array(5).fill(null), q4: Array(5).fill(null),
  })
  const [pickerSlot, setPickerSlot] = useState<string | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [toast, setToast] = useState('')
  const [confirmAutoFill, setConfirmAutoFill] = useState(false)
  const [confirmCopy, setConfirmCopy] = useState(false)

  // Init lineups from game data
  useEffect(() => {
    if (!game) return
    setLineups({
      q1: game.lineup_q1,
      q2: game.lineup_q2,
      q3: game.lineup_q3,
      q4: game.lineup_q4,
    })
  }, [game?.id]) // eslint-disable-line

  // Build grade map: playerId → { grade, avg }
  const gradeMap = new Map<string, { grade: string; avg: number }>()
  for (const player of players) {
    const pe = evals
      .filter(e => e.player_id === player.id)
      .sort((a, b) => new Date(b.evaluated_at).getTime() - new Date(a.evaluated_at).getTime())
    const latest = pe[0]
    if (latest?.overall_avg != null) {
      gradeMap.set(player.id, { grade: latest.grade ?? calcGrade(latest.overall_avg), avg: latest.overall_avg })
    }
  }

  const currentLineup = lineups[activeQtr]
  const usedIds = new Set(currentLineup.filter(Boolean) as string[])

  function setSlot(qtr: QuarterKey, slotIdx: number, playerId: string | null) {
    setLineups(prev => {
      const updated = [...prev[qtr]]
      // If player already in lineup, remove from old slot
      if (playerId) {
        const oldIdx = updated.indexOf(playerId)
        if (oldIdx !== -1) updated[oldIdx] = null
      }
      updated[slotIdx] = playerId
      return { ...prev, [qtr]: updated }
    })
  }

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor),
  )

  function handleDragStart(e: DragStartEvent) {
    setActiveId(e.active.id as string)
    setPickerSlot(null)
  }

  function handleDragEnd(e: DragEndEvent) {
    setActiveId(null)
    if (!e.over) return
    const overId = e.over.id as string
    if (!overId.startsWith('slot-')) return

    const playerId = (e.active.id as string).replace('player-', '')
    const parts = overId.replace('slot-', '').split('-') // e.g. "q1-2"
    const slotQtr = parts[0] as QuarterKey
    const slotIdx = parseInt(parts[1])

    setSlot(slotQtr, slotIdx, playerId)
  }

  function autoFill() {
    const hasExisting = currentLineup.some(Boolean)
    if (hasExisting && !confirmAutoFill) { setConfirmAutoFill(true); return }
    setConfirmAutoFill(false)

    const sorted = [...players]
      .filter(p => p.is_active)
      .sort((a, b) => {
        const aAvg = gradeMap.get(a.id)?.avg ?? 0
        const bAvg = gradeMap.get(b.id)?.avg ?? 0
        return bAvg - aAvg
      })
      .slice(0, 5)

    const newLineup: (string | null)[] = Array(5).fill(null)
    sorted.forEach((p, i) => { newLineup[i] = p.id })
    setLineups(prev => ({ ...prev, [activeQtr]: newLineup }))
  }

  function copyQ1ToAll() {
    const hasOthers = (['q2','q3','q4'] as QuarterKey[]).some(q => lineups[q].some(Boolean))
    if (hasOthers && !confirmCopy) { setConfirmCopy(true); return }
    setConfirmCopy(false)
    const q1 = [...lineups.q1]
    setLineups(prev => ({ ...prev, q2: [...q1], q3: [...q1], q4: [...q1] }))
    showToast('Q1 lineup copied to Q2, Q3, Q4')
  }

  async function handleSave() {
    try {
      await updateGame({
        id: gameId,
        lineup_q1: lineups.q1,
        lineup_q2: lineups.q2,
        lineup_q3: lineups.q3,
        lineup_q4: lineups.q4,
      })
      showToast('Lineup saved!')
    } catch {
      showToast('Failed to save. Try again.')
    }
  }

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  // Team grade for current quarter
  const lineupPlayers = currentLineup
    .filter(Boolean)
    .map(id => ({ id: id!, info: gradeMap.get(id!) }))
    .filter(p => p.info)

  const teamAvg = lineupPlayers.length > 0
    ? lineupPlayers.reduce((s, p) => s + (p.info?.avg ?? 0), 0) / lineupPlayers.length
    : null
  const teamGrade = teamAvg !== null ? calcGrade(teamAvg) : null

  const draggedPlayerId = activeId?.replace('player-', '')
  const draggedPlayer = draggedPlayerId ? players.find(p => p.id === draggedPlayerId) ?? null : null

  if (loadingGame) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm" style={{ color: 'rgba(241,245,249,0.35)' }}>Loading...</p>
      </div>
    )
  }

  if (!game) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <p className="text-sm" style={{ color: 'rgba(241,245,249,0.35)' }}>Game not found</p>
        <Link href="/game" className="text-sm font-medium" style={{ color: '#F7620A' }}>← Back to Game Day</Link>
      </div>
    )
  }

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="max-w-3xl">
        {/* Back + Game header */}
        <div className="mb-6">
          <Link href="/game" className="text-xs font-medium mb-3 inline-block transition-opacity hover:opacity-75" style={{ color: 'rgba(241,245,249,0.4)' }}>
            ← Game Day
          </Link>
          <h1 className={`text-2xl text-sp-text ${barlow.className}`}>
            vs {game.opponent}
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'rgba(241,245,249,0.4)' }}>
            {new Date(game.scheduled_at).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            {game.location ? ` · ${game.location}` : ''}
          </p>
        </div>

        {/* Quarter tabs */}
        <div className="flex gap-1 mb-5 p-1 rounded-xl w-fit" style={{ backgroundColor: 'rgba(241,245,249,0.04)', border: '1px solid rgba(241,245,249,0.07)' }}>
          {QUARTERS.map(q => {
            const filled = lineups[q].filter(Boolean).length
            return (
              <button
                key={q}
                onClick={() => setActiveQtr(q)}
                className="px-4 py-1.5 rounded-lg text-sm font-medium transition-all relative"
                style={{
                  backgroundColor: activeQtr === q ? '#F7620A' : 'transparent',
                  color: activeQtr === q ? '#fff' : 'rgba(241,245,249,0.45)',
                }}
              >
                {q.toUpperCase()}
                {filled > 0 && (
                  <span
                    className="ml-1.5 text-xs font-bold"
                    style={{ color: activeQtr === q ? 'rgba(255,255,255,0.7)' : 'rgba(241,245,249,0.3)' }}
                  >
                    {filled}/5
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Main grid: lineup + pool */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-5">

          {/* Left: lineup slots */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'rgba(241,245,249,0.35)' }}>
                {activeQtr.toUpperCase()} Lineup
              </p>
              {teamGrade && (
                <div className="flex items-center gap-2">
                  <span className="text-xs" style={{ color: 'rgba(241,245,249,0.35)' }}>Lineup Strength</span>
                  <span className="text-sm font-bold px-2 py-0.5 rounded-lg" style={{ color: gradeColor(teamGrade), backgroundColor: `${gradeColor(teamGrade)}18` }}>
                    {teamGrade} · {teamAvg?.toFixed(1)}
                  </span>
                </div>
              )}
            </div>

            {POSITIONS.map((pos, slotIdx) => (
              <LineupSlot
                key={`${activeQtr}-${slotIdx}`}
                qtr={activeQtr}
                slotIdx={slotIdx}
                playerId={currentLineup[slotIdx] ?? null}
                players={players.filter(p => p.is_active)}
                gradeMap={gradeMap}
                pickerSlot={pickerSlot}
                onSetPicker={setPickerSlot}
                onRemove={() => setSlot(activeQtr, slotIdx, null)}
                onPickPlayer={id => setSlot(activeQtr, slotIdx, id)}
              />
            ))}

            {/* Action buttons */}
            <div className="flex flex-wrap gap-2 pt-2">
              {confirmAutoFill ? (
                <>
                  <button onClick={autoFill} className="px-3 py-2 text-xs font-semibold rounded-lg" style={{ backgroundColor: 'rgba(247,98,10,0.15)', color: '#F7620A' }}>Replace existing lineup?</button>
                  <button onClick={() => setConfirmAutoFill(false)} className="px-3 py-2 text-xs" style={{ color: 'rgba(241,245,249,0.4)' }}>Cancel</button>
                </>
              ) : (
                <button onClick={autoFill} className="px-3 py-2 text-xs font-semibold rounded-lg transition-opacity hover:opacity-80" style={{ backgroundColor: 'rgba(245,183,49,0.12)', color: '#F5B731', border: '1px solid rgba(245,183,49,0.25)' }}>
                  ⚡ Auto-Fill Best Lineup
                </button>
              )}

              {activeQtr === 'q1' && (
                confirmCopy ? (
                  <>
                    <button onClick={copyQ1ToAll} className="px-3 py-2 text-xs font-semibold rounded-lg" style={{ backgroundColor: 'rgba(56,189,248,0.12)', color: '#38BDF8' }}>Copy and replace Q2–Q4?</button>
                    <button onClick={() => setConfirmCopy(false)} className="px-3 py-2 text-xs" style={{ color: 'rgba(241,245,249,0.4)' }}>Cancel</button>
                  </>
                ) : (
                  <button onClick={copyQ1ToAll} className="px-3 py-2 text-xs font-semibold rounded-lg transition-opacity hover:opacity-80" style={{ backgroundColor: 'rgba(56,189,248,0.1)', color: '#38BDF8', border: '1px solid rgba(56,189,248,0.2)' }}>
                    Copy Q1 to All Quarters
                  </button>
                )
              )}

              <button
                onClick={handleSave}
                disabled={isSaving}
                className="ml-auto px-5 py-2 text-sm font-semibold rounded-lg disabled:opacity-50 transition-opacity hover:opacity-85"
                style={{ backgroundColor: '#F7620A', color: '#fff' }}
              >
                {isSaving ? 'Saving...' : 'Save Lineup'}
              </button>
            </div>
          </div>

          {/* Right: player pool */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'rgba(241,245,249,0.35)' }}>
              Player Pool
            </p>
            <div className="space-y-2">
              {players
                .filter(p => p.is_active)
                .sort((a, b) => {
                  const aAvg = gradeMap.get(a.id)?.avg ?? 0
                  const bAvg = gradeMap.get(b.id)?.avg ?? 0
                  return bAvg - aAvg
                })
                .map(player => {
                  const gi = gradeMap.get(player.id) ?? null
                  return (
                    <DraggableChip
                      key={player.id}
                      player={player}
                      avg={gi?.avg ?? null}
                      grade={gi?.grade ?? null}
                      used={usedIds.has(player.id)}
                    />
                  )
                })}
              {players.filter(p => p.is_active).length === 0 && (
                <p className="text-xs py-4 text-center" style={{ color: 'rgba(241,245,249,0.3)' }}>No players on roster</p>
              )}
            </div>
            <p className="text-xs mt-3" style={{ color: 'rgba(241,245,249,0.25)' }}>Drag to a slot or tap a slot to pick</p>
          </div>
        </div>
      </div>

      {/* Drag overlay */}
      <DragOverlay>
        {draggedPlayer && (
          <PlayerChip
            player={draggedPlayer}
            avg={gradeMap.get(draggedPlayer.id)?.avg ?? null}
            grade={gradeMap.get(draggedPlayer.id)?.grade ?? null}
          />
        )}
      </DragOverlay>

      {/* Toast */}
      {toast && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 px-5 py-3 rounded-xl text-sm font-medium shadow-xl z-50 transition-all"
          style={{ backgroundColor: '#1A2535', border: '1px solid rgba(241,245,249,0.12)', color: '#F1F5F9' }}
        >
          ✓ {toast}
        </div>
      )}
    </DndContext>
  )
}
