'use client'

import { type Player } from '@/hooks/usePlayers'
import { type Evaluation } from '@/hooks/useEvaluations'
import { PLAYER_COLORS, SKILLS, gradeColor, playerInitials, formatEvalDate, type SkillKey } from './evalUtils'

interface Props {
  players: Player[]
  evals: Evaluation[]
}

export default function ProgressView({ players, evals }: Props) {
  const playersWithEvals = players.filter(p => evals.some(e => e.player_id === p.id))

  if (playersWithEvals.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm" style={{ color: 'rgba(241,245,249,0.3)' }}>Evaluate players to track progress</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {players.map((player, idx) => {
        const pe = evals
          .filter(e => e.player_id === player.id)
          .sort((a, b) => new Date(a.evaluated_at).getTime() - new Date(b.evaluated_at).getTime())

        if (pe.length === 0) return null

        const color = PLAYER_COLORS[idx % PLAYER_COLORS.length]

        return (
          <div key={player.id} className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(241,245,249,0.07)' }}>
            {/* Player header */}
            <div className="flex items-center gap-3 px-4 py-3" style={{ backgroundColor: 'rgba(241,245,249,0.02)', borderBottom: '1px solid rgba(241,245,249,0.07)' }}>
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                style={{ backgroundColor: `${color}22`, color, border: `1px solid ${color}44` }}
              >
                {playerInitials(player.first_name, player.last_name)}
              </div>
              <span className="text-sm font-semibold text-sp-text">
                {player.first_name} {player.last_name ?? ''}
              </span>
              <span className="text-xs ml-1" style={{ color: 'rgba(241,245,249,0.35)' }}>
                {pe.length} evaluation{pe.length !== 1 ? 's' : ''}
              </span>
            </div>

            {pe.length === 1 ? (
              <div className="px-4 py-4">
                <p className="text-sm" style={{ color: 'rgba(241,245,249,0.4)' }}>
                  Evaluate again to see progress
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(241,245,249,0.06)' }}>
                      <th className="text-left px-4 py-2 font-medium" style={{ color: 'rgba(241,245,249,0.4)', minWidth: 110 }}>Date</th>
                      <th className="text-center px-3 py-2 font-medium" style={{ color: 'rgba(241,245,249,0.4)' }}>Grade</th>
                      <th className="text-center px-3 py-2 font-medium" style={{ color: 'rgba(241,245,249,0.4)' }}>Avg</th>
                      {SKILLS.map(s => (
                        <th key={s.key} className="text-center px-3 py-2 font-medium" style={{ color: s.color }}>{s.short}</th>
                      ))}
                      <th className="text-center px-3 py-2 font-medium" style={{ color: 'rgba(241,245,249,0.4)' }}>Δ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pe.map((ev, i) => {
                      const prevEv = i > 0 ? pe[i - 1] : null
                      const delta  = prevEv?.overall_avg != null && ev.overall_avg != null
                        ? ev.overall_avg - prevEv.overall_avg
                        : null

                      return (
                        <tr key={ev.id} style={{ borderBottom: '1px solid rgba(241,245,249,0.04)' }} className="hover:bg-white/[0.015] transition-colors">
                          <td className="px-4 py-2.5" style={{ color: 'rgba(241,245,249,0.5)' }}>
                            {formatEvalDate(ev.evaluated_at)}
                          </td>
                          <td className="px-3 py-2.5 text-center">
                            <span className="font-bold" style={{ color: gradeColor(ev.grade ?? 'D') }}>{ev.grade ?? '—'}</span>
                          </td>
                          <td className="px-3 py-2.5 text-center font-semibold text-sp-text">
                            {ev.overall_avg?.toFixed(1) ?? '—'}
                          </td>
                          {SKILLS.map(s => (
                            <td key={s.key} className="px-3 py-2.5 text-center" style={{ color: 'rgba(241,245,249,0.6)' }}>
                              {(ev[s.key as SkillKey] as number | null)?.toFixed(1) ?? '—'}
                            </td>
                          ))}
                          <td className="px-3 py-2.5 text-center font-semibold">
                            {delta !== null ? (
                              <span style={{ color: delta >= 0 ? '#22C55E' : '#EF4444' }}>
                                {delta >= 0 ? `+${delta.toFixed(1)}` : delta.toFixed(1)}
                              </span>
                            ) : (
                              <span style={{ color: 'rgba(241,245,249,0.2)' }}>—</span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
