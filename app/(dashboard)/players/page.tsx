'use client'

import { useState, useMemo } from 'react'
import { Barlow_Condensed } from 'next/font/google'
import { usePlayers, type Player } from '@/hooks/usePlayers'
import { useEvaluations, type Evaluation } from '@/hooks/useEvaluations'
import AddPlayerModal from './AddPlayerModal'
import EvalModal from './EvalModal'
import PlayerDetailModal from './PlayerDetailModal'
import HeatmapView from './HeatmapView'
import ProgressView from './ProgressView'
import { PLAYER_COLORS, SKILLS, gradeColor, playerInitials, formatEvalDate, type SkillKey } from './evalUtils'

const barlow = Barlow_Condensed({ subsets: ['latin'], weight: '900' })

type Tab = 'roster' | 'heatmap' | 'progress'
type ModalState =
  | null
  | { type: 'addPlayer' }
  | { type: 'eval'; playerId?: string }
  | { type: 'detail'; playerId: string }

// ── Player Card ──────────────────────────────────────────────────────────────
function PlayerCard({
  player,
  index,
  evals,
  onDetail,
  onEval,
}: {
  player: Player
  index: number
  evals: Evaluation[]
  onDetail: () => void
  onEval: (e: React.MouseEvent) => void
}) {
  const color      = PLAYER_COLORS[index % PLAYER_COLORS.length]
  const playerEvals = evals
    .filter(e => e.player_id === player.id)
    .sort((a, b) => new Date(b.evaluated_at).getTime() - new Date(a.evaluated_at).getTime())
  const latest = playerEvals[0] ?? null

  return (
    <div
      className="drill-card rounded-xl p-5 cursor-pointer flex flex-col gap-4"
      style={{ backgroundColor: '#0E1520' }}
      onClick={onDetail}
    >
      {/* Top row: avatar + grade */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
            style={{ backgroundColor: `${color}22`, color, border: `1px solid ${color}55` }}
          >
            {playerInitials(player.first_name, player.last_name)}
          </div>
          <div>
            <p className={`text-lg leading-tight text-sp-text ${barlow.className}`}>
              {player.first_name} {player.last_name ?? ''}
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(241,245,249,0.4)' }}>
              {[player.jersey_number, player.position, player.age ? `Age ${player.age}` : null]
                .filter(Boolean).join(' · ')}
            </p>
          </div>
        </div>
        {latest?.grade && (
          <span
            className="text-base font-bold px-2.5 py-0.5 rounded-lg flex-shrink-0"
            style={{ backgroundColor: `${gradeColor(latest.grade)}18`, color: gradeColor(latest.grade) }}
          >
            {latest.grade}
          </span>
        )}
      </div>

      {/* Skill bars or no-eval placeholder */}
      {latest ? (
        <div className="space-y-2">
          {SKILLS.map(skill => {
            const val = (latest[skill.key as SkillKey] ?? 0) as number
            return (
              <div key={skill.key}>
                <div className="flex justify-between mb-0.5">
                  <span className="text-xs" style={{ color: 'rgba(241,245,249,0.4)' }}>{skill.label}</span>
                  <span className="text-xs font-semibold" style={{ color: skill.color }}>{val.toFixed(1)}</span>
                </div>
                <div className="h-1 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(241,245,249,0.07)' }}>
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${(val / 10) * 100}%`, backgroundColor: skill.color }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="flex items-center justify-between py-2">
          <p className="text-xs" style={{ color: 'rgba(241,245,249,0.3)' }}>No evaluation yet</p>
          <button
            onClick={e => { e.stopPropagation(); onEval(e) }}
            className="text-xs font-semibold transition-opacity hover:opacity-75"
            style={{ color: '#F7620A' }}
          >
            Evaluate now →
          </button>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-1" style={{ borderTop: '1px solid rgba(241,245,249,0.06)' }}>
        <p className="text-xs" style={{ color: 'rgba(241,245,249,0.3)' }}>
          {latest
            ? `${playerEvals.length} eval${playerEvals.length !== 1 ? 's' : ''} · Last: ${formatEvalDate(latest.evaluated_at)}`
            : 'No evaluations'}
        </p>
        <button
          onClick={e => { e.stopPropagation(); onEval(e) }}
          className="text-xs font-semibold transition-opacity hover:opacity-75"
          style={{ color: '#F7620A' }}
        >
          + New Eval
        </button>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function PlayersPage() {
  const [tab, setTab]       = useState<Tab>('roster')
  const [modal, setModal]   = useState<ModalState>(null)
  const [search, setSearch] = useState('')

  const { data: players = [], isLoading: loadingPlayers } = usePlayers()
  const { data: evals   = [], isLoading: loadingEvals   } = useEvaluations()

  const filteredPlayers = useMemo(() => {
    if (!search.trim()) return players
    const s = search.toLowerCase()
    return players.filter(p =>
      p.first_name.toLowerCase().includes(s) ||
      p.last_name?.toLowerCase().includes(s) ||
      p.position?.toLowerCase().includes(s) ||
      p.jersey_number?.toLowerCase().includes(s)
    )
  }, [players, search])

  const TABS: { key: Tab; label: string }[] = [
    { key: 'roster',   label: 'Roster' },
    { key: 'heatmap',  label: 'Skills Heatmap' },
    { key: 'progress', label: 'Progress Tracking' },
  ]

  const modalPlayer = modal?.type === 'detail' || modal?.type === 'eval'
    ? players.find(p => p.id === modal.playerId) ?? null
    : null

  const isLoading = loadingPlayers || loadingEvals

  return (
    <div>
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-sp-text">Players</h1>
          <p className="text-sm mt-0.5" style={{ color: 'rgba(241,245,249,0.4)' }}>
            {players.length} {players.length === 1 ? 'player' : 'players'} on roster
          </p>
        </div>
        <button
          onClick={() => setModal({ type: 'addPlayer' })}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg transition-opacity hover:opacity-85"
          style={{ backgroundColor: '#F7620A', color: '#fff' }}
        >
          <span>+</span> Add Player
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 p-1 rounded-xl w-fit" style={{ backgroundColor: 'rgba(241,245,249,0.04)', border: '1px solid rgba(241,245,249,0.07)' }}>
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="px-4 py-1.5 rounded-lg text-sm font-medium transition-all"
            style={{
              backgroundColor: tab === t.key ? '#F7620A' : 'transparent',
              color: tab === t.key ? '#fff' : 'rgba(241,245,249,0.45)',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Search (roster only) */}
      {tab === 'roster' && (
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, position, or jersey..."
          className="sp-input mb-5"
          style={{ maxWidth: 380 }}
        />
      )}

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <p className="text-sm" style={{ color: 'rgba(241,245,249,0.35)' }}>Loading...</p>
        </div>
      ) : tab === 'roster' ? (
        filteredPlayers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 rounded-xl" style={{ border: '1px dashed rgba(241,245,249,0.1)' }}>
            <p className="text-sm mb-3" style={{ color: 'rgba(241,245,249,0.35)' }}>
              {players.length === 0 ? 'No players yet — add your first player' : 'No players match your search'}
            </p>
            {players.length === 0 && (
              <button
                onClick={() => setModal({ type: 'addPlayer' })}
                className="px-5 py-2 text-sm font-semibold rounded-lg transition-opacity hover:opacity-85"
                style={{ backgroundColor: '#F7620A', color: '#fff' }}
              >
                Add Player
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPlayers.map((player, i) => {
              const idx = players.indexOf(player)
              return (
                <PlayerCard
                  key={player.id}
                  player={player}
                  index={idx}
                  evals={evals}
                  onDetail={() => setModal({ type: 'detail', playerId: player.id })}
                  onEval={e => { e.stopPropagation(); setModal({ type: 'eval', playerId: player.id }) }}
                />
              )
            })}
          </div>
        )
      ) : tab === 'heatmap' ? (
        <HeatmapView players={players} evals={evals} />
      ) : (
        <ProgressView players={players} evals={evals} />
      )}

      {/* Modals */}
      {modal?.type === 'addPlayer' && (
        <AddPlayerModal onClose={() => setModal(null)} />
      )}

      {modal?.type === 'eval' && (
        <EvalModal
          players={players}
          evals={evals}
          initialPlayerId={modal.playerId}
          onClose={() => setModal(null)}
        />
      )}

      {modal?.type === 'detail' && modalPlayer && (
        <PlayerDetailModal
          player={modalPlayer}
          playerIndex={players.indexOf(modalPlayer)}
          evals={evals.filter(e => e.player_id === modalPlayer.id).sort((a, b) => new Date(a.evaluated_at).getTime() - new Date(b.evaluated_at).getTime())}
          onClose={() => setModal(null)}
          onNewEval={() => setModal({ type: 'eval', playerId: modalPlayer.id })}
        />
      )}
    </div>
  )
}
