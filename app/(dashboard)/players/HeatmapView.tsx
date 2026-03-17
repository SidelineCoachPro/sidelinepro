'use client'

import { type Player } from '@/hooks/usePlayers'
import { type Evaluation } from '@/hooks/useEvaluations'
import { PLAYER_COLORS, SKILLS, playerInitials, type SkillKey } from './evalUtils'

function heatColor(val: number | null): { bg: string; text: string } {
  if (val === null) return { bg: 'transparent', text: 'rgba(241,245,249,0.2)' }
  if (val >= 8)  return { bg: 'rgba(14,207,176,0.15)',  text: '#0ECFB0' }
  if (val >= 6)  return { bg: 'rgba(245,183,49,0.15)',  text: '#F5B731' }
  return               { bg: 'rgba(247,98,10,0.15)',   text: '#F7620A' }
}

interface Props {
  players: Player[]
  evals: Evaluation[]
  onGeneratePlan: (playerId: string) => void
  generatingPlanFor: string | null
}

export default function HeatmapView({ players, evals, onGeneratePlan, generatingPlanFor }: Props) {
  // Latest eval per player
  function latestEval(playerId: string): Evaluation | null {
    const pe = evals.filter(e => e.player_id === playerId)
    if (!pe.length) return null
    return pe.reduce((a, b) => new Date(a.evaluated_at) > new Date(b.evaluated_at) ? a : b)
  }

  if (players.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm" style={{ color: 'rgba(241,245,249,0.3)' }}>No players yet</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-xl" style={{ border: '1px solid rgba(241,245,249,0.07)' }}>
      <table className="w-full text-sm">
        <thead>
          <tr style={{ borderBottom: '1px solid rgba(241,245,249,0.07)', backgroundColor: 'rgba(241,245,249,0.02)' }}>
            <th className="text-left px-4 py-3 font-medium" style={{ color: 'rgba(241,245,249,0.4)', minWidth: 160 }}>
              Player
            </th>
            {SKILLS.map(skill => (
              <th key={skill.key} className="text-center px-3 py-3 font-medium" style={{ color: skill.color, minWidth: 72 }}>
                <div className="text-xs">{skill.short}</div>
                <div className="text-xs font-normal" style={{ color: 'rgba(241,245,249,0.3)', fontSize: 10 }}>{skill.label}</div>
              </th>
            ))}
            <th className="text-center px-3 py-3 font-medium" style={{ color: 'rgba(241,245,249,0.4)', minWidth: 64 }}>
              Avg
            </th>
            <th className="text-center px-3 py-3 font-medium" style={{ color: 'rgba(241,245,249,0.4)', minWidth: 96 }}>
              Dev Plan
            </th>
          </tr>
        </thead>
        <tbody>
          {players.map((player, idx) => {
            const latest = latestEval(player.id)
            const color  = PLAYER_COLORS[idx % PLAYER_COLORS.length]
            const isGenerating = generatingPlanFor === player.id

            return (
              <tr
                key={player.id}
                style={{ borderBottom: '1px solid rgba(241,245,249,0.05)' }}
                className="transition-colors hover:bg-white/[0.02]"
              >
                {/* Player name */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                      style={{ backgroundColor: `${color}22`, color, border: `1px solid ${color}44` }}
                    >
                      {playerInitials(player.first_name, player.last_name)}
                    </div>
                    <span className="font-medium text-sp-text truncate">
                      {player.first_name} {player.last_name ?? ''}
                    </span>
                  </div>
                </td>

                {/* Skill cells */}
                {SKILLS.map(skill => {
                  const val = latest ? (latest[skill.key as SkillKey] ?? null) as number | null : null
                  const { bg, text } = heatColor(val)
                  return (
                    <td key={skill.key} className="px-3 py-3 text-center">
                      <span
                        className="inline-block px-2 py-0.5 rounded font-semibold text-xs"
                        style={{ backgroundColor: bg, color: text, minWidth: 36 }}
                      >
                        {val !== null ? val.toFixed(1) : '—'}
                      </span>
                    </td>
                  )
                })}

                {/* Avg */}
                <td className="px-3 py-3 text-center">
                  {latest?.overall_avg != null ? (
                    <span className="text-sm font-bold text-sp-text">{latest.overall_avg.toFixed(1)}</span>
                  ) : (
                    <span style={{ color: 'rgba(241,245,249,0.2)' }}>—</span>
                  )}
                </td>

                {/* Dev Plan button */}
                <td className="px-3 py-3 text-center">
                  {latest ? (
                    <button
                      onClick={() => onGeneratePlan(player.id)}
                      disabled={!!generatingPlanFor}
                      className="text-xs font-semibold px-2.5 py-1 rounded-lg transition-opacity hover:opacity-80 disabled:opacity-40"
                      style={{ backgroundColor: 'rgba(139,92,246,0.15)', color: '#8B5CF6', border: '1px solid rgba(139,92,246,0.3)' }}
                    >
                      {isGenerating ? '...' : '✦ Plan'}
                    </button>
                  ) : (
                    <span style={{ color: 'rgba(241,245,249,0.2)', fontSize: 11 }}>no eval</span>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
