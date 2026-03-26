'use client'

import { useState, useEffect } from 'react'
import { type Player } from '@/hooks/usePlayers'
import { type Evaluation, useCreateEvaluation } from '@/hooks/useEvaluations'
import { SKILLS, calcGrade, gradeColor, calcAvg, aiInsight, type SkillKey } from './evalUtils'

const labelStyle = { color: 'rgba(241,245,249,0.6)', fontSize: '13px', fontWeight: 500 } as const

function SkillSlider({
  label, color, value, onChange,
}: {
  label: string; color: string; value: number; onChange: (v: number) => void
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span style={labelStyle}>{label}</span>
        <span className="text-sm font-bold" style={{ color }}>{value.toFixed(1)}</span>
      </div>
      <input
        type="range" min={0} max={10} step={0.5}
        value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
        style={{ accentColor: color, backgroundColor: 'rgba(241,245,249,0.1)' }}
      />
      <div className="flex justify-between mt-1">
        {['Needs work', 'Average', 'Elite'].map(l => (
          <span key={l} className="text-xs" style={{ color: 'rgba(241,245,249,0.25)' }}>{l}</span>
        ))}
      </div>
    </div>
  )
}

interface Props {
  players: Player[]
  evals: Evaluation[]
  initialPlayerId?: string
  onClose: () => void
}

export default function EvalModal({ players, evals, initialPlayerId, onClose }: Props) {
  const [selectedId, setSelectedId] = useState(initialPlayerId ?? players[0]?.id ?? '')
  const [vals, setVals] = useState<Record<SkillKey, number>>({
    ball_handling: 5, shooting: 5, passing: 5, defense: 5, athleticism: 5, coachability: 5,
  })
  const [notes, setNotes]     = useState('')
  const [evalDate, setEvalDate] = useState(() => new Date().toISOString().split('T')[0])
  const [error, setError]     = useState('')
  const [insights, setInsights] = useState<{ insights: string[]; topPriority: string } | null>(null)
  const [loadingInsights, setLoadingInsights] = useState(false)

  const { mutateAsync, isPending } = useCreateEvaluation()

  // Pre-fill from latest eval when player changes
  useEffect(() => {
    const playerEvals = evals
      .filter(e => e.player_id === selectedId)
      .sort((a, b) => new Date(b.evaluated_at).getTime() - new Date(a.evaluated_at).getTime())
    const latest = playerEvals[0]
    if (latest) {
      setVals({
        ball_handling: latest.ball_handling ?? 5,
        shooting:      latest.shooting      ?? 5,
        passing:       latest.passing       ?? 5,
        defense:       latest.defense       ?? 5,
        athleticism:   latest.athleticism   ?? 5,
        coachability:  latest.coachability  ?? 5,
      })
      setNotes(latest.notes ?? '')
    } else {
      setVals({ ball_handling: 5, shooting: 5, passing: 5, defense: 5, athleticism: 5, coachability: 5 })
      setNotes('')
    }
  }, [selectedId, evals])

  const avg   = calcAvg(Object.values(vals))
  const grade = calcGrade(avg)
  const gColor = gradeColor(grade)
  const insight = aiInsight(vals)

  async function handleSave() {
    if (!selectedId) { setError('Select a player'); return }
    setError('')
    try {
      await mutateAsync({
        player_id:     selectedId,
        ball_handling: vals.ball_handling,
        shooting:      vals.shooting,
        passing:       vals.passing,
        defense:       vals.defense,
        athleticism:   vals.athleticism,
        coachability:  vals.coachability,
        overall_avg:   avg,
        grade,
        notes:         notes.trim() || null,
        evaluated_at:  new Date(evalDate + 'T12:00:00').toISOString(),
      })
      // Fetch AI insights after saving
      setLoadingInsights(true)
      const player = players.find(p => p.id === selectedId)
      const playerName = player ? `${player.first_name} ${player.last_name ?? ''}`.trim() : 'Player'
      const prevEval = evals
        .filter(e => e.player_id === selectedId)
        .sort((a, b) => new Date(b.evaluated_at).getTime() - new Date(a.evaluated_at).getTime())[0]
      const previousScores = prevEval
        ? { ball_handling: prevEval.ball_handling, shooting: prevEval.shooting, passing: prevEval.passing, defense: prevEval.defense, athleticism: prevEval.athleticism, coachability: prevEval.coachability }
        : undefined
      try {
        const res = await fetch('/api/ai/eval-insights', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ playerName, skillScores: vals, isFirstEval: !prevEval, previousScores }),
        })
        if (res.ok) {
          const data = await res.json()
          setInsights(data)
        }
      } catch { /* insights are optional — don't block close */ }
      setLoadingInsights(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save evaluation')
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="w-full max-w-lg rounded-xl flex flex-col overflow-hidden"
        style={{ backgroundColor: '#0E1520', border: '1px solid rgba(241,245,249,0.07)', maxHeight: '92vh' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 flex-shrink-0" style={{ borderBottom: '1px solid rgba(241,245,249,0.07)' }}>
          <h2 className="text-base font-semibold text-sp-text">New Evaluation</h2>
          <button onClick={onClose} style={{ color: 'rgba(241,245,249,0.4)' }} className="hover:opacity-60 transition-opacity text-lg leading-none">✕</button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
          {/* Player + Date row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block mb-1.5" style={labelStyle}>Player</label>
              <select
                value={selectedId}
                onChange={e => setSelectedId(e.target.value)}
                className="sp-input"
              >
                {players.map(p => (
                  <option key={p.id} value={p.id} style={{ backgroundColor: '#0E1520' }}>
                    {p.first_name} {p.last_name ?? ''}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block mb-1.5" style={labelStyle}>Eval Date</label>
              <input
                type="date"
                value={evalDate}
                onChange={e => setEvalDate(e.target.value)}
                className="sp-input"
                style={{ colorScheme: 'dark' }}
              />
            </div>
          </div>

          {/* Skill sliders */}
          <div className="space-y-4">
            {SKILLS.map(skill => (
              <SkillSlider
                key={skill.key}
                label={skill.label}
                color={skill.color}
                value={vals[skill.key]}
                onChange={v => setVals(prev => ({ ...prev, [skill.key]: v }))}
              />
            ))}
          </div>

          {/* Notes */}
          <div>
            <label className="block mb-1.5" style={labelStyle}>Coach Notes</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="sp-input"
              rows={2}
              placeholder="Optional notes about this player's session..."
              style={{ resize: 'vertical' }}
            />
          </div>

          {error && (
            <p className="text-sm text-red-400 px-3 py-2 rounded-lg" style={{ backgroundColor: 'rgba(239,68,68,0.1)' }}>{error}</p>
          )}
        </div>

        {/* Footer */}
        <div
          className="flex-shrink-0 px-6 py-4"
          style={{ borderTop: '1px solid rgba(241,245,249,0.07)' }}
        >
          {/* AI insights panel — shown after save */}
          {loadingInsights && (
            <div className="flex items-center gap-2 mb-4 px-4 py-3 rounded-xl" style={{ backgroundColor: 'rgba(58,134,255,0.08)', border: '1px solid rgba(58,134,255,0.2)' }}>
              <div className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin flex-shrink-0" style={{ borderColor: '#3A86FF', borderTopColor: 'transparent' }} />
              <p className="text-xs" style={{ color: 'rgba(241,245,249,0.5)' }}>Generating AI insights…</p>
            </div>
          )}
          {insights && !loadingInsights && (
            <div className="mb-4 rounded-xl overflow-hidden" style={{ border: '1px solid rgba(58,134,255,0.25)' }}>
              <div className="px-4 py-2" style={{ backgroundColor: 'rgba(58,134,255,0.12)' }}>
                <p className="text-xs font-semibold" style={{ color: '#3A86FF' }}>🤖 AI Coaching Insights</p>
              </div>
              <div className="px-4 py-3 space-y-2" style={{ backgroundColor: 'rgba(58,134,255,0.05)' }}>
                {insights.insights.map((ins, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="text-xs flex-shrink-0 mt-0.5" style={{ color: '#3A86FF' }}>→</span>
                    <p className="text-xs leading-relaxed" style={{ color: 'rgba(241,245,249,0.65)' }}>{ins}</p>
                  </div>
                ))}
                {insights.topPriority && (
                  <div className="mt-2 pt-2" style={{ borderTop: '1px solid rgba(58,134,255,0.15)' }}>
                    <p className="text-xs font-semibold mb-0.5" style={{ color: 'rgba(241,245,249,0.35)' }}>NEXT PRACTICE PRIORITY</p>
                    <p className="text-xs" style={{ color: 'rgba(241,245,249,0.6)' }}>{insights.topPriority}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Grade + insight (shown before save) */}
          {!insights && !loadingInsights && (
            <div
              className="flex items-start gap-3 px-4 py-3 rounded-xl mb-4"
              style={{ backgroundColor: 'rgba(14,207,176,0.08)', border: '1px solid rgba(14,207,176,0.2)' }}
            >
              <div className="text-center flex-shrink-0">
                <div className="text-2xl font-bold" style={{ color: gColor }}>{grade}</div>
                <div className="text-xs" style={{ color: 'rgba(241,245,249,0.4)' }}>{avg.toFixed(1)}</div>
              </div>
              <p className="text-sm" style={{ color: 'rgba(241,245,249,0.6)' }}>{insight}</p>
            </div>
          )}

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium rounded-lg" style={{ color: 'rgba(241,245,249,0.5)' }}>
              {insights ? 'Done' : 'Cancel'}
            </button>
            {!insights && !loadingInsights && (
              <button
                onClick={handleSave}
                disabled={isPending || !selectedId}
                className="px-5 py-2 text-sm font-semibold rounded-lg disabled:opacity-50 transition-opacity hover:opacity-85"
                style={{ backgroundColor: '#F7620A', color: '#fff' }}
              >
                {isPending ? 'Saving...' : 'Save Evaluation'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
