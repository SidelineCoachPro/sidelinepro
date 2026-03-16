'use client'

import { type Player } from '@/hooks/usePlayers'
import { type Evaluation } from '@/hooks/useEvaluations'
import { useDeletePlayer } from '@/hooks/usePlayers'
import { PLAYER_COLORS, SKILLS, gradeColor, calcAvg, aiInsight, playerInitials, formatEvalDate, type SkillKey } from './evalUtils'

interface Props {
  player: Player
  playerIndex: number
  evals: Evaluation[]       // all evals for this player, sorted oldest→newest
  onClose: () => void
  onNewEval: () => void
}

export default function PlayerDetailModal({ player, playerIndex, evals, onClose, onNewEval }: Props) {
  const color   = PLAYER_COLORS[playerIndex % PLAYER_COLORS.length]
  const latest  = evals[evals.length - 1] ?? null
  const prev    = evals.length >= 2 ? evals[evals.length - 2] : null

  const { mutateAsync: deletePlayer, isPending: isDeleting } = useDeletePlayer()
  const [confirmDelete, setConfirmDelete] = React.useState(false)

  async function handleDelete() {
    await deletePlayer(player.id)
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="w-full max-w-md rounded-xl flex flex-col overflow-hidden"
        style={{ backgroundColor: '#0E1520', border: '1px solid rgba(241,245,249,0.07)', maxHeight: '92vh' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 flex-shrink-0" style={{ borderBottom: '1px solid rgba(241,245,249,0.07)' }}>
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
              style={{ backgroundColor: `${color}22`, color, border: `1px solid ${color}55` }}
            >
              {playerInitials(player.first_name, player.last_name)}
            </div>
            <div>
              <p className="text-base font-semibold text-sp-text">
                {player.first_name} {player.last_name ?? ''}
              </p>
              <p className="text-xs" style={{ color: 'rgba(241,245,249,0.4)' }}>
                {[player.jersey_number, player.position, player.age ? `Age ${player.age}` : null].filter(Boolean).join(' · ')}
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ color: 'rgba(241,245,249,0.4)' }} className="hover:opacity-60 transition-opacity text-lg leading-none">✕</button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
          {latest ? (
            <>
              {/* Grade + avg */}
              <div className="flex items-center gap-4">
                <div
                  className="text-4xl font-bold w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${gradeColor(latest.grade ?? 'D')}18`, color: gradeColor(latest.grade ?? 'D') }}
                >
                  {latest.grade}
                </div>
                <div>
                  <p className="text-2xl font-bold text-sp-text">{latest.overall_avg?.toFixed(1)}</p>
                  <p className="text-xs" style={{ color: 'rgba(241,245,249,0.4)' }}>
                    {evals.length} eval{evals.length !== 1 ? 's' : ''} · Last: {formatEvalDate(latest.evaluated_at)}
                  </p>
                </div>
              </div>

              {/* Skill bars */}
              <div className="space-y-3">
                {SKILLS.map(skill => {
                  const val  = (latest[skill.key as SkillKey] ?? 0) as number
                  const prevVal = prev ? (prev[skill.key as SkillKey] ?? null) as number | null : null
                  const delta = prevVal !== null ? val - prevVal : null

                  return (
                    <div key={skill.key}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium" style={{ color: 'rgba(241,245,249,0.55)' }}>{skill.label}</span>
                        <div className="flex items-center gap-2">
                          {delta !== null && delta !== 0 && (
                            <span
                              className="text-xs font-semibold"
                              style={{ color: delta > 0 ? '#22C55E' : '#EF4444' }}
                            >
                              {delta > 0 ? `↑${delta.toFixed(1)}` : `↓${Math.abs(delta).toFixed(1)}`}
                            </span>
                          )}
                          <span className="text-xs font-bold" style={{ color: skill.color }}>{val.toFixed(1)}</span>
                        </div>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(241,245,249,0.08)' }}>
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${(val / 10) * 100}%`, backgroundColor: skill.color }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* AI Insight */}
              {(() => {
                const skillVals = Object.fromEntries(
                  SKILLS.map(s => [s.key, (latest[s.key as SkillKey] ?? 5) as number])
                ) as Record<SkillKey, number>
                return (
                  <div
                    className="px-4 py-3 rounded-xl"
                    style={{ backgroundColor: 'rgba(14,207,176,0.08)', border: '1px solid rgba(14,207,176,0.2)' }}
                  >
                    <p className="text-xs font-semibold mb-1" style={{ color: '#0ECFB0' }}>AI Insight</p>
                    <p className="text-sm" style={{ color: 'rgba(241,245,249,0.65)' }}>{aiInsight(skillVals)}</p>
                  </div>
                )
              })()}

              {/* Coach notes */}
              {latest.notes && (
                <div>
                  <p className="text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: 'rgba(241,245,249,0.35)' }}>Coach Notes</p>
                  <p className="text-sm" style={{ color: 'rgba(241,245,249,0.6)' }}>{latest.notes}</p>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 gap-3">
              <p className="text-sm" style={{ color: 'rgba(241,245,249,0.4)' }}>No evaluation yet</p>
              <button
                onClick={() => { onNewEval(); onClose() }}
                className="text-sm font-semibold transition-opacity hover:opacity-75"
                style={{ color: '#F7620A' }}
              >
                Evaluate now →
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 flex-shrink-0" style={{ borderTop: '1px solid rgba(241,245,249,0.07)' }}>
          {confirmDelete ? (
            <div className="flex items-center gap-3">
              <span className="text-sm" style={{ color: 'rgba(241,245,249,0.5)' }}>Remove player?</span>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="text-sm px-3 py-1.5 rounded-lg font-medium transition-opacity hover:opacity-85"
                style={{ backgroundColor: '#EF4444', color: '#fff' }}
              >
                {isDeleting ? '...' : 'Yes, remove'}
              </button>
              <button onClick={() => setConfirmDelete(false)} className="text-sm" style={{ color: 'rgba(241,245,249,0.4)' }}>
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="text-sm transition-opacity hover:opacity-60"
              style={{ color: 'rgba(241,245,249,0.35)' }}
            >
              Remove Player
            </button>
          )}
          <button
            onClick={() => { onNewEval(); onClose() }}
            className="px-4 py-2 text-sm font-semibold rounded-lg transition-opacity hover:opacity-85"
            style={{ backgroundColor: '#F7620A', color: '#fff' }}
          >
            New Evaluation
          </button>
        </div>
      </div>
    </div>
  )
}

// Need React for useState in the component
import React from 'react'
