'use client'

import { useState } from 'react'
import { type Player } from '@/hooks/usePlayers'
import { useDeletePlayer } from '@/hooks/usePlayers'
import { type Evaluation } from '@/hooks/useEvaluations'
import { useDevPlans, useCreateDevPlan, type DevPlan } from '@/hooks/useDevPlans'
import { useParentContacts, useDeleteParentContact, type ParentContact } from '@/hooks/useParentContacts'
import { PLAYER_COLORS, SKILLS, gradeColor, aiInsight, playerInitials, formatEvalDate, type SkillKey } from './evalUtils'
import DevPlanModal from './DevPlanModal'
import ContactModal from './ContactModal'

interface Props {
  player: Player
  playerIndex: number
  evals: Evaluation[]       // all evals for this player, sorted oldest→newest
  onClose: () => void
  onNewEval: () => void
}

function formatPlanDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const SKILL_LABEL: Record<string, string> = Object.fromEntries(
  SKILLS.map(s => [s.key, s.label])
)
const SKILL_COLOR: Record<string, string> = Object.fromEntries(
  SKILLS.map(s => [s.key, s.color])
)

export default function PlayerDetailModal({ player, playerIndex, evals, onClose, onNewEval }: Props) {
  const color   = PLAYER_COLORS[playerIndex % PLAYER_COLORS.length]
  const latest  = evals[evals.length - 1] ?? null
  const prev    = evals.length >= 2 ? evals[evals.length - 2] : null

  const { mutateAsync: deletePlayer, isPending: isDeleting } = useDeletePlayer()
  const { mutateAsync: createDevPlan } = useCreateDevPlan()
  const { data: devPlans = [] } = useDevPlans(player.id)

  const { data: contacts = [] }                           = useParentContacts(player.id)
  const { mutateAsync: deleteContact, isPending: deleting } = useDeleteParentContact()

  const [confirmDelete, setConfirmDelete]   = useState(false)
  const [isGenerating, setIsGenerating]     = useState(false)
  const [genError, setGenError]             = useState('')
  const [activePlan, setActivePlan]         = useState<DevPlan | null>(null)
  const [contactModal, setContactModal]     = useState<{ existing?: ParentContact } | null>(null)
  const [confirmDeleteContact, setConfirmDeleteContact] = useState<string | null>(null)

  async function handleDelete() {
    await deletePlayer(player.id)
    onClose()
  }

  // Auto-detect weakest skill from latest eval
  function getWeakestSkill(): string {
    if (!latest) return 'ball_handling'
    let weakest = SKILLS[0].key as string
    let lowestVal = Infinity
    for (const skill of SKILLS) {
      const val = (latest[skill.key as SkillKey] ?? 10) as number
      if (val < lowestVal) {
        lowestVal = val
        weakest = skill.key
      }
    }
    return weakest
  }

  async function handleGeneratePlan() {
    setIsGenerating(true)
    setGenError('')
    try {
      const focusSkill = getWeakestSkill()
      const skillScores = latest
        ? Object.fromEntries(SKILLS.map(s => [s.key, (latest[s.key as SkillKey] ?? 5) as number]))
        : {}

      const res = await fetch('/api/ai/devplan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerName: `${player.first_name} ${player.last_name ?? ''}`.trim(),
          focusSkill,
          skillScores,
        }),
      })
      if (!res.ok) throw new Error('Failed to generate plan')
      const data = await res.json()

      const saved = await createDevPlan({
        player_id: player.id,
        evaluation_id: latest?.id ?? null,
        focus_skill: focusSkill,
        drills: data.drills,
        duration_mins: data.duration_mins,
        message_text: data.message_text,
      })

      setActivePlan(saved)
    } catch (err) {
      setGenError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <>
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
                    const val     = (latest[skill.key as SkillKey] ?? 0) as number
                    const prevVal = prev ? (prev[skill.key as SkillKey] ?? null) as number | null : null
                    const delta   = prevVal !== null ? val - prevVal : null

                    return (
                      <div key={skill.key}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium" style={{ color: 'rgba(241,245,249,0.55)' }}>{skill.label}</span>
                          <div className="flex items-center gap-2">
                            {delta !== null && delta !== 0 && (
                              <span className="text-xs font-semibold" style={{ color: delta > 0 ? '#22C55E' : '#EF4444' }}>
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

                {/* Generate Dev Plan */}
                <div>
                  {genError && (
                    <p className="text-xs text-red-400 mb-2">{genError}</p>
                  )}
                  <button
                    onClick={handleGeneratePlan}
                    disabled={isGenerating}
                    className="w-full py-2.5 text-sm font-semibold rounded-xl transition-opacity hover:opacity-85 disabled:opacity-50"
                    style={{ backgroundColor: 'rgba(139,92,246,0.15)', color: '#8B5CF6', border: '1px solid rgba(139,92,246,0.3)' }}
                  >
                    {isGenerating ? 'Generating Plan...' : '✦ Generate Dev Plan'}
                  </button>
                </div>

                {/* Past dev plans */}
                {devPlans.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'rgba(241,245,249,0.35)' }}>
                      Past Plans
                    </p>
                    <div className="space-y-1.5">
                      {devPlans.map(plan => {
                        const skillLabel = SKILL_LABEL[plan.focus_skill] ?? plan.focus_skill
                        const skillColor = SKILL_COLOR[plan.focus_skill] ?? '#8B5CF6'
                        return (
                          <button
                            key={plan.id}
                            onClick={() => setActivePlan(plan)}
                            className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left transition-colors hover:bg-white/[0.03]"
                            style={{ border: '1px solid rgba(241,245,249,0.06)' }}
                          >
                            <div className="flex items-center gap-2">
                              <span
                                className="text-xs font-semibold px-2 py-0.5 rounded-full"
                                style={{ backgroundColor: `${skillColor}18`, color: skillColor }}
                              >
                                {skillLabel}
                              </span>
                              <span className="text-xs" style={{ color: 'rgba(241,245,249,0.4)' }}>
                                {plan.drills.length} drills · {plan.duration_mins} min
                              </span>
                            </div>
                            <span className="text-xs" style={{ color: 'rgba(241,245,249,0.3)' }}>
                              {formatPlanDate(plan.created_at)}
                            </span>
                          </button>
                        )
                      })}
                    </div>
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

          {/* Parents / Contacts */}
          <div style={{ borderTop: '1px solid rgba(241,245,249,0.07)', paddingTop: '1.25rem' }}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'rgba(241,245,249,0.35)' }}>
                Parents / Contacts
              </p>
              {contacts.length < 2 && (
                <button
                  onClick={() => setContactModal({})}
                  className="text-xs font-semibold transition-opacity hover:opacity-70"
                  style={{ color: '#F7620A' }}
                >
                  + Add
                </button>
              )}
            </div>

            {contacts.length === 0 ? (
              <div
                className="rounded-xl px-4 py-4 flex items-center justify-between"
                style={{ border: '1px dashed rgba(241,245,249,0.1)' }}
              >
                <p className="text-xs" style={{ color: 'rgba(241,245,249,0.35)' }}>No contacts added yet</p>
                <button
                  onClick={() => setContactModal({})}
                  className="text-xs font-semibold transition-opacity hover:opacity-70"
                  style={{ color: '#F7620A' }}
                >
                  Add Contact
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {contacts.map(c => (
                  <div
                    key={c.id}
                    className="rounded-xl px-4 py-3"
                    style={{ backgroundColor: 'rgba(241,245,249,0.03)', border: '1px solid rgba(241,245,249,0.07)' }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                          style={{ backgroundColor: 'rgba(247,98,10,0.15)', color: '#F7620A' }}
                        >
                          {c.first_name[0]}{c.last_name?.[0] ?? ''}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <p className="text-sm font-semibold text-sp-text">
                              {c.first_name} {c.last_name ?? ''}
                            </p>
                            {c.is_primary && (
                              <span
                                className="text-xs px-1.5 py-0.5 rounded font-semibold flex-shrink-0"
                                style={{ backgroundColor: 'rgba(247,98,10,0.15)', color: '#F7620A' }}
                              >
                                Primary
                              </span>
                            )}
                          </div>
                          <p className="text-xs mt-0.5" style={{ color: 'rgba(241,245,249,0.4)' }}>{c.relationship}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => setContactModal({ existing: c })}
                          className="text-xs transition-opacity hover:opacity-60"
                          style={{ color: 'rgba(241,245,249,0.35)' }}
                        >
                          Edit
                        </button>
                        {confirmDeleteContact === c.id ? (
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={async () => { await deleteContact(c.id); setConfirmDeleteContact(null) }}
                              disabled={deleting}
                              className="text-xs font-semibold transition-opacity hover:opacity-80"
                              style={{ color: '#EF4444' }}
                            >
                              Remove
                            </button>
                            <button
                              onClick={() => setConfirmDeleteContact(null)}
                              className="text-xs transition-opacity hover:opacity-60"
                              style={{ color: 'rgba(241,245,249,0.35)' }}
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmDeleteContact(c.id)}
                            className="text-xs transition-opacity hover:opacity-60"
                            style={{ color: 'rgba(241,245,249,0.3)' }}
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="mt-2 space-y-0.5 pl-10">
                      {c.phone && (
                        <a
                          href={`tel:${c.phone}`}
                          className="block text-xs transition-opacity hover:opacity-75"
                          style={{ color: '#22C55E' }}
                          onClick={e => e.stopPropagation()}
                        >
                          📞 {c.phone}
                        </a>
                      )}
                      {c.email && (
                        <a
                          href={`mailto:${c.email}`}
                          className="block text-xs transition-opacity hover:opacity-75"
                          style={{ color: '#38BDF8' }}
                          onClick={e => e.stopPropagation()}
                        >
                          ✉️ {c.email}
                        </a>
                      )}
                    </div>
                  </div>
                ))}
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

      {/* Contact Modal */}
      {contactModal !== null && (
        <ContactModal
          playerId={player.id}
          existing={contactModal.existing}
          isFirst={contacts.length === 0}
          onClose={() => setContactModal(null)}
        />
      )}

      {/* Dev Plan Modal (renders on top) */}
      {activePlan && (
        <DevPlanModal
          player={player}
          plan={activePlan}
          onClose={() => setActivePlan(null)}
        />
      )}
    </>
  )
}
