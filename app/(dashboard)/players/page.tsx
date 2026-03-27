'use client'

import { useState, useMemo } from 'react'
import { Barlow_Condensed } from 'next/font/google'
import { usePlayers, type Player } from '@/hooks/usePlayers'
import { useEvaluations, type Evaluation } from '@/hooks/useEvaluations'
import { useCreateDevPlan, type DevPlan } from '@/hooks/useDevPlans'
import { useParentContacts } from '@/hooks/useParentContacts'
import { useProfile } from '@/hooks/useProfile'
import { createClient } from '@/lib/supabase/client'
import AddPlayerModal from './AddPlayerModal'
import EvalModal from './EvalModal'
import PlayerDetailModal from './PlayerDetailModal'
import DevPlanModal from './DevPlanModal'
import HeatmapView from './HeatmapView'
import ProgressView from './ProgressView'
import { PLAYER_COLORS, SKILLS, gradeColor, playerInitials, formatEvalDate, type SkillKey } from './evalUtils'
import PlayersSubNav from './components/PlayersSubNav'

function getWeakestSkill(scores: Record<string, number | null>): string {
  let weakest = 'ball_handling'
  let lowestVal = Infinity
  for (const skill of SKILLS) {
    const val = (scores[skill.key] ?? 10) as number
    if (val < lowestVal) {
      lowestVal = val
      weakest = skill.key
    }
  }
  return weakest
}

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
  contactCount,
  onDetail,
  onEval,
}: {
  player: Player
  index: number
  evals: Evaluation[]
  contactCount: number
  onDetail: () => void
  onEval: (e: React.MouseEvent) => void
}) {
  const color = PLAYER_COLORS[index % PLAYER_COLORS.length]
  // sorted newest → oldest
  const playerEvals = evals
    .filter(e => e.player_id === player.id)
    .sort((a, b) => new Date(b.evaluated_at).getTime() - new Date(a.evaluated_at).getTime())

  const [evalIdx, setEvalIdx] = useState(0)
  const shown = playerEvals[evalIdx] ?? null
  const total = playerEvals.length

  function goPrev(e: React.MouseEvent) {
    e.stopPropagation()
    setEvalIdx(i => Math.min(i + 1, total - 1)) // older
  }
  function goNext(e: React.MouseEvent) {
    e.stopPropagation()
    setEvalIdx(i => Math.max(i - 1, 0))         // newer
  }

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
        {shown?.grade && (
          <span
            className="text-base font-bold px-2.5 py-0.5 rounded-lg flex-shrink-0"
            style={{ backgroundColor: `${gradeColor(shown.grade)}18`, color: gradeColor(shown.grade) }}
          >
            {shown.grade}
          </span>
        )}
      </div>

      {/* Skill bars or no-eval placeholder */}
      {shown ? (
        <div className="space-y-2">
          {SKILLS.map(skill => {
            const val = (shown[skill.key as SkillKey] ?? 0) as number
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
        {/* Eval navigator */}
        {total > 0 ? (
          <div className="flex items-center gap-1.5">
            <button
              onClick={goPrev}
              disabled={evalIdx >= total - 1}
              className="text-xs px-1.5 py-0.5 rounded transition-opacity disabled:opacity-20 hover:opacity-60"
              style={{ color: 'rgba(241,245,249,0.5)' }}
              title="Older eval"
            >
              ←
            </button>
            <span className="text-xs" style={{ color: 'rgba(241,245,249,0.35)' }}>
              {shown ? formatEvalDate(shown.evaluated_at) : '—'}
            </span>
            <button
              onClick={goNext}
              disabled={evalIdx <= 0}
              className="text-xs px-1.5 py-0.5 rounded transition-opacity disabled:opacity-20 hover:opacity-60"
              style={{ color: 'rgba(241,245,249,0.5)' }}
              title="Newer eval"
            >
              →
            </button>
            <span className="text-xs" style={{ color: 'rgba(241,245,249,0.2)' }}>
              {evalIdx + 1}/{total}
            </span>
          </div>
        ) : (
          <span className="text-xs" style={{ color: 'rgba(241,245,249,0.25)' }}>No evaluations</span>
        )}

        <div className="flex items-center gap-2">
          <span
            className="text-xs px-2 py-0.5 rounded-full"
            style={{
              backgroundColor: contactCount > 0 ? 'rgba(247,98,10,0.12)' : 'rgba(241,245,249,0.06)',
              color: contactCount > 0 ? '#F7620A' : 'rgba(241,245,249,0.25)',
            }}
          >
            👤 {contactCount}
          </span>
          <button
            onClick={e => { e.stopPropagation(); onEval(e) }}
            className="text-xs font-semibold transition-opacity hover:opacity-75"
            style={{ color: '#F7620A' }}
          >
            + New Eval
          </button>
        </div>
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
  const { data: allContacts = [] }                        = useParentContacts()
  const { mutateAsync: createDevPlan } = useCreateDevPlan()
  const { data: profile } = useProfile()

  const [generatingPlanFor, setGeneratingPlanFor] = useState<string | null>(null)
  const [activePlan, setActivePlan]               = useState<DevPlan | null>(null)
  const [planError, setPlanError]                 = useState('')

  // Bulk generation state
  const [selectMode, setSelectMode] = useState(false)
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<Set<string>>(new Set())
  const [bulkGenModal, setBulkGenModal] = useState(false)
  const [bulkProgress, setBulkProgress] = useState<{ current: number; total: number; currentName: string; done: boolean } | null>(null)

  function toggleSelectPlayer(id: string) {
    setSelectedPlayerIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function cancelSelectMode() {
    setSelectMode(false)
    setSelectedPlayerIds(new Set())
  }

  async function handleBulkGenerate() {
    setBulkGenModal(false)
    const ids = Array.from(selectedPlayerIds)
    setBulkProgress({ current: 0, total: ids.length, currentName: '', done: false })
    for (let i = 0; i < ids.length; i++) {
      const p = players.find(pl => pl.id === ids[i])
      if (!p) continue
      setBulkProgress({ current: i + 1, total: ids.length, currentName: `${p.first_name} ${p.last_name ?? ''}`, done: false })
      const playerEvals = evals.filter(e => e.player_id === p.id)
      const latestEval = playerEvals.sort((a, b) => new Date(b.evaluated_at).getTime() - new Date(a.evaluated_at).getTime())[0]
      const scores = latestEval ? {
        ball_handling: latestEval.ball_handling,
        shooting: latestEval.shooting,
        passing: latestEval.passing,
        defense: latestEval.defense,
        athleticism: latestEval.athleticism,
        coachability: latestEval.coachability,
      } : {}
      const focusSkill = latestEval ? getWeakestSkill(scores as Record<string, number | null>) : 'ball_handling'
      const skillScores = Object.fromEntries(
        SKILLS.map(s => [s.key, (scores[s.key as SkillKey] ?? 5) as number])
      )
      try {
        const res = await fetch('/api/ai/devplan?format=v2', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            playerName: `${p.first_name} ${p.last_name ?? ''}`.trim(),
            focusSkill,
            skillScores,
          }),
        })
        const data = await res.json()
        if (data.content) {
          const supabase = createClient()
          await supabase.from('dev_plans').update({ is_active: false }).eq('player_id', p.id).eq('is_active', true)
          await supabase.from('dev_plans').insert({
            player_id: p.id,
            coach_id: profile?.id,
            version: 1,
            is_active: true,
            content: data.content,
            plan_name: 'Season Plan',
            created_by: 'ai',
            last_edited_at: new Date().toISOString(),
            edit_count: 0,
          })
        }
      } catch {
        // continue on error
      }
      await new Promise(r => setTimeout(r, 500))
    }
    setBulkProgress(prev => prev ? { ...prev, done: true } : null)
    setSelectMode(false)
    setSelectedPlayerIds(new Set())
  }

  async function handleGeneratePlan(playerId: string) {
    if (generatingPlanFor) return
    setGeneratingPlanFor(playerId)
    setPlanError('')
    try {
      const player = players.find(p => p.id === playerId)
      if (!player) throw new Error('Player not found')

      const playerEvals = evals.filter(e => e.player_id === playerId)
      const latest = playerEvals.sort((a, b) =>
        new Date(b.evaluated_at).getTime() - new Date(a.evaluated_at).getTime()
      )[0] ?? null

      // Auto-detect weakest skill
      let focusSkill = 'ball_handling'
      if (latest) {
        let lowestVal = Infinity
        for (const skill of SKILLS) {
          const val = (latest[skill.key as SkillKey] ?? 10) as number
          if (val < lowestVal) { lowestVal = val; focusSkill = skill.key }
        }
      }

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
        player_id: playerId,
        evaluation_id: latest?.id ?? null,
        focus_skill: focusSkill,
        drills: data.drills,
        duration_mins: data.duration_mins,
        message_text: data.message_text,
      })
      setActivePlan(saved)
    } catch (err) {
      setPlanError(err instanceof Error ? err.message : 'Failed to generate plan')
    } finally {
      setGeneratingPlanFor(null)
    }
  }

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
      <PlayersSubNav />
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-sp-text">Players</h1>
          <p className="text-sm mt-0.5" style={{ color: 'rgba(241,245,249,0.4)' }}>
            {players.length} {players.length === 1 ? 'player' : 'players'} on roster
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (selectMode) cancelSelectMode()
              else setSelectMode(true)
            }}
            className="px-3 py-2 text-sm font-medium rounded-lg transition-opacity hover:opacity-75"
            style={{ background: selectMode ? 'rgba(247,98,10,0.1)' : 'rgba(241,245,249,0.06)', color: selectMode ? '#F7620A' : 'rgba(241,245,249,0.6)', border: `1px solid ${selectMode ? 'rgba(247,98,10,0.2)' : 'rgba(241,245,249,0.1)'}` }}
          >
            {selectMode ? 'Cancel' : 'Select'}
          </button>
          <button
            onClick={() => setModal({ type: 'addPlayer' })}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg transition-opacity hover:opacity-85"
            style={{ backgroundColor: '#F7620A', color: '#fff' }}
          >
            <span>+</span> Add Player
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="overflow-x-auto mb-5 -mx-1 px-1">
        <div className="flex gap-1 p-1 rounded-xl w-fit" style={{ backgroundColor: 'rgba(241,245,249,0.04)', border: '1px solid rgba(241,245,249,0.07)' }}>
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className="whitespace-nowrap px-4 py-1.5 rounded-lg text-sm font-medium transition-all"
              style={{
                backgroundColor: tab === t.key ? '#F7620A' : 'transparent',
                color: tab === t.key ? '#fff' : 'rgba(241,245,249,0.45)',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Search (roster only) */}
      {tab === 'roster' && (
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, position, or jersey..."
          className="sp-input mb-5 w-full max-w-[380px]"
        />
      )}

      {/* Plan generation error */}
      {planError && (
        <p className="text-sm text-red-400 mb-4 px-3 py-2 rounded-lg" style={{ backgroundColor: 'rgba(239,68,68,0.1)' }}>
          {planError}
        </p>
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
            {filteredPlayers.map((player) => {
              const idx = players.indexOf(player)
              const isSelected = selectedPlayerIds.has(player.id)
              return (
                <div key={player.id} style={{ position: 'relative' }}>
                  {selectMode && (
                    <div
                      style={{
                        position: 'absolute',
                        top: 10,
                        right: 10,
                        zIndex: 10,
                        width: 22,
                        height: 22,
                        borderRadius: 6,
                        background: isSelected ? '#F7620A' : 'rgba(241,245,249,0.1)',
                        border: `2px solid ${isSelected ? '#F7620A' : 'rgba(241,245,249,0.25)'}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                      }}
                      onClick={e => { e.stopPropagation(); toggleSelectPlayer(player.id) }}
                    >
                      {isSelected && <span style={{ color: '#fff', fontSize: 12, lineHeight: 1 }}>✓</span>}
                    </div>
                  )}
                  <PlayerCard
                    player={player}
                    index={idx}
                    evals={evals}
                    contactCount={allContacts.filter(c => c.player_id === player.id).length}
                    onDetail={() => {
                      if (selectMode) { toggleSelectPlayer(player.id); return }
                      setModal({ type: 'detail', playerId: player.id })
                    }}
                    onEval={e => { e.stopPropagation(); if (!selectMode) setModal({ type: 'eval', playerId: player.id }) }}
                  />
                </div>
              )
            })}
          </div>
        )
      ) : tab === 'heatmap' ? (
        <HeatmapView
          players={players}
          evals={evals}
          onGeneratePlan={handleGeneratePlan}
          generatingPlanFor={generatingPlanFor}
        />
      ) : (
        <ProgressView
          players={players}
          evals={evals}
          onGeneratePlan={handleGeneratePlan}
          generatingPlanFor={generatingPlanFor}
        />
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

      {activePlan && (() => {
        const player = players.find(p => p.id === activePlan.player_id)
        return player ? (
          <DevPlanModal
            player={player}
            plan={activePlan}
            onClose={() => setActivePlan(null)}
          />
        ) : null
      })()}

      {/* Floating bulk action bar */}
      {selectMode && selectedPlayerIds.size > 0 && (
        <div
          style={{
            position: 'fixed',
            bottom: 24,
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#1a2535',
            border: '1px solid rgba(241,245,249,0.1)',
            borderRadius: 12,
            padding: '12px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            zIndex: 40,
            whiteSpace: 'nowrap',
          }}
        >
          <span style={{ color: '#F1F5F9', fontSize: 13, fontWeight: 600 }}>
            {selectedPlayerIds.size} player{selectedPlayerIds.size !== 1 ? 's' : ''} selected
          </span>
          <button
            onClick={() => setBulkGenModal(true)}
            style={{
              padding: '7px 14px',
              borderRadius: 8,
              background: 'rgba(139,92,246,0.15)',
              border: '1px solid rgba(139,92,246,0.3)',
              color: '#8B5CF6',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            ✦ Generate Dev Plans
          </button>
          <button
            onClick={cancelSelectMode}
            style={{ padding: '7px 14px', borderRadius: 8, background: 'transparent', border: '1px solid rgba(241,245,249,0.1)', color: 'rgba(241,245,249,0.5)', fontSize: 12, cursor: 'pointer' }}
          >
            Cancel
          </button>
        </div>
      )}

      {/* Bulk gen confirm modal */}
      {bulkGenModal && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
          onClick={e => { if (e.target === e.currentTarget) setBulkGenModal(false) }}
        >
          <div style={{ background: '#1a2535', borderRadius: 12, border: '1px solid rgba(241,245,249,0.1)', padding: 24, maxWidth: 400, width: '100%' }}>
            <h3 style={{ color: '#F1F5F9', fontWeight: 700, fontSize: 16, marginBottom: 8 }}>Generate Dev Plans</h3>
            <p style={{ color: 'rgba(241,245,249,0.5)', fontSize: 13, marginBottom: 20 }}>
              This will generate AI development plans for {selectedPlayerIds.size} player{selectedPlayerIds.size !== 1 ? 's' : ''}. Existing active plans will be replaced.
            </p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setBulkGenModal(false)} style={{ padding: '8px 16px', borderRadius: 8, background: 'transparent', border: '1px solid rgba(241,245,249,0.1)', color: 'rgba(241,245,249,0.5)', fontSize: 13, cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleBulkGenerate} style={{ padding: '8px 16px', borderRadius: 8, background: 'rgba(139,92,246,0.2)', border: '1px solid rgba(139,92,246,0.4)', color: '#8B5CF6', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                Generate All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk progress modal */}
      {bulkProgress && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ background: '#1a2535', borderRadius: 12, border: '1px solid rgba(241,245,249,0.1)', padding: 28, maxWidth: 380, width: '100%' }}>
            {bulkProgress.done ? (
              <>
                <div style={{ textAlign: 'center', marginBottom: 16 }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>✓</div>
                  <h3 style={{ color: '#22C55E', fontWeight: 700, fontSize: 16 }}>Done!</h3>
                  <p style={{ color: 'rgba(241,245,249,0.5)', fontSize: 13, marginTop: 6 }}>
                    Generated {bulkProgress.total} development plan{bulkProgress.total !== 1 ? 's' : ''}.
                  </p>
                </div>
                <button
                  onClick={() => setBulkProgress(null)}
                  style={{ width: '100%', padding: '9px 16px', borderRadius: 8, background: '#F7620A', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', border: 'none' }}
                >
                  Done
                </button>
              </>
            ) : (
              <>
                <h3 style={{ color: '#F1F5F9', fontWeight: 700, fontSize: 15, marginBottom: 4 }}>Generating Plans...</h3>
                <p style={{ color: 'rgba(241,245,249,0.5)', fontSize: 13, marginBottom: 16 }}>
                  {bulkProgress.currentName && `Working on ${bulkProgress.currentName}...`}
                </p>
                <div style={{ background: 'rgba(241,245,249,0.07)', borderRadius: 8, height: 8, overflow: 'hidden', marginBottom: 8 }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${(bulkProgress.current / bulkProgress.total) * 100}%`,
                      background: '#F7620A',
                      borderRadius: 8,
                      transition: 'width 0.4s ease',
                    }}
                  />
                </div>
                <p style={{ color: 'rgba(241,245,249,0.35)', fontSize: 12, textAlign: 'right' }}>
                  {bulkProgress.current} / {bulkProgress.total}
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
