'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { usePlayers } from '@/hooks/usePlayers'
import { useEvaluations } from '@/hooks/useEvaluations'
import { useProfile } from '@/hooks/useProfile'
import {
  useDevPlan,
  useDevPlanHistory,
  useUpdateDevPlan,
  useArchiveDevPlan,
  useCreateDevPlanV2,
  useRestoreDevPlan,
  blankPlanContent,
  normalizePlanContent,
  genId,
  timeAgo,
  type PlanContent,
  type PlanGoal,
  type DevPlanV2,
} from '@/hooks/useDevPlan'
import EditableField from '@/components/devplan/EditableField'
import EditableList from '@/components/devplan/EditableList'
import GoalCard from '@/components/devplan/GoalCard'
import { SKILLS, type SkillKey } from '@/app/(dashboard)/players/evalUtils'

// ── Helpers ──────────────────────────────────────────────────────────────────

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

// ── Page ──────────────────────────────────────────────────────────────────────

export default function DevPlanPage({ params }: { params: { id: string } }) {
  const { data: players } = usePlayers()
  const player = players?.find(p => p.id === params.id)
  const { data: plan, isLoading: planLoading } = useDevPlan(params.id)
  const { data: history = [] } = useDevPlanHistory(params.id)
  const { update: debouncedUpdate, isSaving, lastSaved } = useUpdateDevPlan()
  const { archive, isArchiving } = useArchiveDevPlan()
  const { create: createPlan, isCreating } = useCreateDevPlanV2()
  const { restore, isRestoring } = useRestoreDevPlan()
  const { data: profile } = useProfile()
  const { data: evals = [] } = useEvaluations()

  const [activeTab, setActiveTab] = useState<'plan' | 'history'>('plan')
  const [localContent, setLocalContent] = useState<PlanContent | null>(null)
  const [isDirty, setIsDirty] = useState(false)
  const [showArchiveModal, setShowArchiveModal] = useState(false)
  const [archiveNote, setArchiveNote] = useState('')
  const [showRegenConfirm, setShowRegenConfirm] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [genError, setGenError] = useState<string | null>(null)
  const [viewingHistoryPlan, setViewingHistoryPlan] = useState<DevPlanV2 | null>(null)
  const [comparingWith, setComparingWith] = useState<DevPlanV2 | null>(null)
  const [planName, setPlanName] = useState<string>('')
  const isFirstMount = useRef(true)

  // Initialize localContent from plan
  useEffect(() => {
    if (plan) {
      setLocalContent(normalizePlanContent(plan.content))
      setPlanName(plan.plan_name ?? 'Development Plan')
      setIsDirty(false)
    }
  }, [plan?.id])

  // Debounced auto-save
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false
      return
    }
    if (!plan || !localContent || !isDirty) return
    debouncedUpdate(plan.id, params.id, localContent)
  }, [localContent])

  const sensors = useSensors(useSensor(PointerSensor))

  function updateContent(updater: (prev: PlanContent) => PlanContent) {
    setLocalContent(prev => {
      if (!prev) return prev
      const next = updater(prev)
      setIsDirty(true)
      return next
    })
  }

  // ── Goal helpers ──────────────────────────────────────────────────────────

  function handleGoalDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (active.id !== over?.id) {
      updateContent(prev => {
        const oldIndex = prev.goals.findIndex(g => g.id === active.id)
        const newIndex = prev.goals.findIndex(g => g.id === over!.id)
        return { ...prev, goals: arrayMove(prev.goals, oldIndex, newIndex) }
      })
    }
  }

  function handleAddGoal() {
    const newGoal: PlanGoal = {
      id: genId(),
      title: 'New Goal',
      description: '',
      targetSkill: 'ball_handling',
      actionSteps: [],
      suggestedDrillIds: [],
      timeframeWeeks: 4,
      isComplete: false,
    }
    updateContent(prev => ({ ...prev, goals: [...prev.goals, newGoal] }))
  }

  function handleUpdateGoal(updated: PlanGoal) {
    updateContent(prev => ({
      ...prev,
      goals: prev.goals.map(g => g.id === updated.id ? updated : g),
    }))
  }

  function handleDeleteGoal(goalId: string) {
    updateContent(prev => ({ ...prev, goals: prev.goals.filter(g => g.id !== goalId) }))
  }

  // ── AI Generation ─────────────────────────────────────────────────────────

  async function handleGenerateAI() {
    setIsGenerating(true)
    setGenError(null)
    try {
      const playerEvals = evals
        .filter(e => e.player_id === params.id)
        .sort((a, b) => new Date(b.evaluated_at).getTime() - new Date(a.evaluated_at).getTime())
      const latestEval = playerEvals[0]
      const scores: Record<string, number | null> = latestEval ? {
        ball_handling: latestEval.ball_handling,
        shooting: latestEval.shooting,
        passing: latestEval.passing,
        defense: latestEval.defense,
        athleticism: latestEval.athleticism,
        coachability: latestEval.coachability,
      } : {}
      const focusSkill = latestEval
        ? getWeakestSkill(scores)
        : 'ball_handling'
      const skillScores = Object.fromEntries(
        SKILLS.map((s: { key: SkillKey }) => [s.key, (scores[s.key] ?? 5) as number])
      )
      const playerName = player ? `${player.first_name} ${player.last_name ?? ''}`.trim() : 'Player'
      const res = await fetch('/api/ai/devplan?format=v2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerName, focusSkill, skillScores }),
      })
      if (!res.ok) throw new Error('Failed to generate plan')
      const data = await res.json()
      if (!data.content) throw new Error('No content returned')
      const coachId = profile?.id ?? ''
      await createPlan(params.id, coachId, data.content, {
        created_by: 'ai',
        focus_skill: focusSkill,
        plan_name: 'AI Development Plan',
      })
    } catch (err) {
      setGenError(err instanceof Error ? err.message : 'Failed to generate plan')
    } finally {
      setIsGenerating(false)
    }
  }

  async function handleBuildManual() {
    try {
      const blankContent = blankPlanContent()
      const coachId = profile?.id ?? ''
      await createPlan(params.id, coachId, blankContent, {
        created_by: 'manual',
        plan_name: 'Development Plan',
      })
    } catch (err) {
      setGenError(err instanceof Error ? err.message : 'Failed to create plan')
    }
  }

  async function handleArchive() {
    if (!plan) return
    await archive(plan, archiveNote)
    setShowArchiveModal(false)
    setArchiveNote('')
  }

  async function handleRegen() {
    setShowRegenConfirm(false)
    if (plan) {
      await archive(plan, 'Regenerated')
    }
    await handleGenerateAI()
  }

  async function handleRestore(historicalPlan: DevPlanV2) {
    await restore(historicalPlan, plan ?? null)
    setActiveTab('plan')
    setViewingHistoryPlan(null)
  }

  // ── Render helpers ────────────────────────────────────────────────────────

  if (planLoading) {
    return (
      <div style={{ minHeight: '100vh', background: '#0E1520', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'rgba(241,245,249,0.4)', fontSize: 14 }}>Loading...</div>
      </div>
    )
  }

  if (!player && !planLoading && players) {
    return (
      <div style={{ minHeight: '100vh', background: '#0E1520', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
        <p style={{ color: 'rgba(241,245,249,0.5)', fontSize: 16 }}>Player not found</p>
        <Link href="/players" style={{ color: '#F7620A', fontSize: 14 }}>← Back to Players</Link>
      </div>
    )
  }

  const playerName = player ? `${player.first_name} ${player.last_name ?? ''}`.trim() : '...'

  // No plan state
  if (!plan && !planLoading) {
    return (
      <div style={{ minHeight: '100vh', background: '#0E1520', color: '#F1F5F9' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(241,245,249,0.07)' }}>
          <Link href="/players" style={{ color: 'rgba(241,245,249,0.5)', fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            ← Players
          </Link>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 24px', gap: 8 }}>
          <p style={{ fontSize: 13, color: 'rgba(241,245,249,0.4)', marginBottom: 8 }}>{playerName}</p>
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>No Development Plan Yet</h2>
          <p style={{ fontSize: 14, color: 'rgba(241,245,249,0.5)', marginBottom: 32 }}>Create one with AI or build it manually.</p>

          {genError && (
            <p style={{ color: '#EF4444', fontSize: 13, marginBottom: 16 }}>{genError}</p>
          )}

          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
            <button
              onClick={handleGenerateAI}
              disabled={isGenerating || isCreating}
              style={{
                padding: '20px 28px',
                borderRadius: 12,
                background: 'rgba(139,92,246,0.1)',
                border: '1px solid rgba(139,92,246,0.3)',
                color: '#8B5CF6',
                fontSize: 15,
                fontWeight: 600,
                cursor: 'pointer',
                minWidth: 200,
                textAlign: 'center',
              }}
            >
              {isGenerating ? 'Generating...' : '✦ Generate AI Plan'}
              <p style={{ fontSize: 12, color: 'rgba(139,92,246,0.6)', fontWeight: 400, marginTop: 6 }}>
                AI analyzes eval data to build a plan
              </p>
            </button>

            <button
              onClick={handleBuildManual}
              disabled={isCreating}
              style={{
                padding: '20px 28px',
                borderRadius: 12,
                background: 'rgba(247,98,10,0.08)',
                border: '1px solid rgba(247,98,10,0.25)',
                color: '#F7620A',
                fontSize: 15,
                fontWeight: 600,
                cursor: 'pointer',
                minWidth: 200,
                textAlign: 'center',
              }}
            >
              {isCreating ? 'Creating...' : '✏️ Build Manually'}
              <p style={{ fontSize: 12, color: 'rgba(247,98,10,0.5)', fontWeight: 400, marginTop: 6 }}>
                Start with a blank template
              </p>
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Full plan view ────────────────────────────────────────────────────────

  const content = localContent

  // Comparison view
  if (comparingWith) {
    return (
      <div style={{ minHeight: '100vh', background: '#0E1520', color: '#F1F5F9' }}>
        <div style={{ padding: '16px 24px', borderBottom: '1px solid rgba(241,245,249,0.07)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 600, fontSize: 15 }}>Comparing Plans</span>
          <button
            onClick={() => setComparingWith(null)}
            style={{ color: '#F7620A', fontSize: 13 }}
          >
            ← Back
          </button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
          <CompareColumn label={`Current (v${plan?.version})`} content={plan?.content ?? null} />
          <CompareColumn label={`v${comparingWith.version}`} content={comparingWith.content} isHistorical />
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0E1520', color: '#F1F5F9' }}>

      {/* Header */}
      <div style={{ padding: '16px 24px', borderBottom: '1px solid rgba(241,245,249,0.07)', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <Link href="/players" style={{ color: 'rgba(241,245,249,0.5)', fontSize: 13, flexShrink: 0 }}>
          ← Players
        </Link>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 12, color: 'rgba(241,245,249,0.4)' }}>{playerName}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
            <EditableField
              value={planName}
              onSave={async (val) => {
                setPlanName(val)
                if (plan) {
                  const supabase = (await import('@/lib/supabase/client')).createClient()
                  await supabase.from('dev_plans').update({ plan_name: val }).eq('id', plan.id)
                }
              }}
              textStyle={{ fontSize: 18, fontWeight: 700 }}
              placeholder="Plan name..."
            />
            <span style={{ fontSize: 12, color: 'rgba(241,245,249,0.3)', flexShrink: 0 }}>
              v{plan?.version ?? 1}
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {isSaving && (
            <span style={{ fontSize: 12, color: 'rgba(241,245,249,0.35)' }}>Saving...</span>
          )}
          {!isSaving && lastSaved && (
            <span style={{ fontSize: 12, color: 'rgba(241,245,249,0.35)' }}>
              Saved {timeAgo(lastSaved)}
            </span>
          )}
          <button
            onClick={() => setShowRegenConfirm(true)}
            style={{
              padding: '6px 12px',
              borderRadius: 8,
              background: 'rgba(139,92,246,0.1)',
              border: '1px solid rgba(139,92,246,0.25)',
              color: '#8B5CF6',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            ✦ Regenerate
          </button>
          <button
            onClick={() => setShowArchiveModal(true)}
            style={{
              padding: '6px 12px',
              borderRadius: 8,
              background: 'rgba(241,245,249,0.05)',
              border: '1px solid rgba(241,245,249,0.1)',
              color: 'rgba(241,245,249,0.5)',
              fontSize: 12,
              cursor: 'pointer',
            }}
          >
            Archive
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ padding: '0 24px', borderBottom: '1px solid rgba(241,245,249,0.07)', display: 'flex', gap: 0 }}>
        {(['plan', 'history'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '12px 20px',
              fontSize: 13,
              fontWeight: 600,
              borderBottom: `2px solid ${activeTab === tab ? '#F7620A' : 'transparent'}`,
              color: activeTab === tab ? '#F7620A' : 'rgba(241,245,249,0.45)',
              background: 'transparent',
              cursor: 'pointer',
              marginBottom: -1,
            }}
          >
            {tab === 'plan' ? 'Development Plan' : `History (${history.length})`}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px' }}>
        {activeTab === 'plan' && content ? (
          <PlanEditor
            content={content}
            updateContent={updateContent}
            sensors={sensors}
            handleGoalDragEnd={handleGoalDragEnd}
            handleAddGoal={handleAddGoal}
            handleUpdateGoal={handleUpdateGoal}
            handleDeleteGoal={handleDeleteGoal}
          />
        ) : activeTab === 'history' ? (
          <HistoryView
            history={history}
            onView={setViewingHistoryPlan}
            onRestore={handleRestore}
            onCompare={setComparingWith}
            isRestoring={isRestoring}
            viewingPlan={viewingHistoryPlan}
            onCloseView={() => setViewingHistoryPlan(null)}
          />
        ) : null}
      </div>

      {/* Archive Modal */}
      {showArchiveModal && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
          onClick={e => { if (e.target === e.currentTarget) setShowArchiveModal(false) }}
        >
          <div style={{ background: '#1a2535', borderRadius: 12, border: '1px solid rgba(241,245,249,0.1)', padding: 24, width: '100%', maxWidth: 420 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Archive & Create New Version</h3>
            <p style={{ fontSize: 13, color: 'rgba(241,245,249,0.5)', marginBottom: 16 }}>
              The current plan will be archived. A new v{(plan?.version ?? 1) + 1} will be created.
            </p>
            <input
              type="text"
              value={archiveNote}
              onChange={e => setArchiveNote(e.target.value)}
              placeholder="Archive note (optional)..."
              style={{
                width: '100%',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(241,245,249,0.1)',
                borderRadius: 8,
                color: '#F1F5F9',
                padding: '8px 12px',
                fontSize: 13,
                outline: 'none',
                marginBottom: 16,
              }}
            />
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowArchiveModal(false)}
                style={{ padding: '8px 16px', borderRadius: 8, background: 'transparent', border: '1px solid rgba(241,245,249,0.1)', color: 'rgba(241,245,249,0.5)', fontSize: 13, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={handleArchive}
                disabled={isArchiving}
                style={{ padding: '8px 16px', borderRadius: 8, background: '#F7620A', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', border: 'none' }}
              >
                {isArchiving ? 'Archiving...' : 'Archive & Version'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Regen confirm */}
      {showRegenConfirm && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
          onClick={e => { if (e.target === e.currentTarget) setShowRegenConfirm(false) }}
        >
          <div style={{ background: '#1a2535', borderRadius: 12, border: '1px solid rgba(241,245,249,0.1)', padding: 24, width: '100%', maxWidth: 400 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Regenerate Plan?</h3>
            <p style={{ fontSize: 13, color: 'rgba(241,245,249,0.5)', marginBottom: 20 }}>
              The current plan will be archived as &quot;Regenerated&quot; and a new AI plan will be created.
            </p>
            {genError && <p style={{ color: '#EF4444', fontSize: 12, marginBottom: 12 }}>{genError}</p>}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowRegenConfirm(false)} style={{ padding: '8px 16px', borderRadius: 8, background: 'transparent', border: '1px solid rgba(241,245,249,0.1)', color: 'rgba(241,245,249,0.5)', fontSize: 13, cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleRegen} disabled={isGenerating} style={{ padding: '8px 16px', borderRadius: 8, background: 'rgba(139,92,246,0.2)', border: '1px solid rgba(139,92,246,0.4)', color: '#8B5CF6', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                {isGenerating ? 'Generating...' : '✦ Regenerate'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

interface PlanEditorProps {
  content: PlanContent
  updateContent: (updater: (prev: PlanContent) => PlanContent) => void
  sensors: ReturnType<typeof useSensors>
  handleGoalDragEnd: (event: DragEndEvent) => void
  handleAddGoal: () => void
  handleUpdateGoal: (goal: PlanGoal) => void
  handleDeleteGoal: (id: string) => void
}

function PlanEditor({
  content,
  updateContent,
  sensors,
  handleGoalDragEnd,
  handleAddGoal,
  handleUpdateGoal,
  handleDeleteGoal,
}: PlanEditorProps) {
  const sectionStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(241,245,249,0.06)',
    borderRadius: 12,
    padding: 24,
    marginBottom: 20,
  }

  const sectionLabel: React.CSSProperties = {
    fontSize: 11,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: 'rgba(241,245,249,0.4)',
    marginBottom: 12,
  }

  return (
    <div>
      {/* Overview */}
      <div style={sectionStyle}>
        <p style={sectionLabel}>Overview</p>
        <EditableField
          value={content.summary}
          onSave={val => updateContent(prev => ({ ...prev, summary: val }))}
          multiline
          placeholder="Write a brief player overview..."
          textStyle={{ fontSize: 15, lineHeight: '1.6', color: 'rgba(241,245,249,0.85)' }}
          minHeight={60}
        />
      </div>

      {/* Strengths & Growth */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
        <div style={sectionStyle}>
          <p style={sectionLabel}>Strengths</p>
          <EditableList
            items={content.strengths ?? []}
            onAdd={text => updateContent(prev => ({ ...prev, strengths: [...(prev.strengths ?? []), { id: genId(), text }] }))}
            onEdit={(id, text) => updateContent(prev => ({ ...prev, strengths: (prev.strengths ?? []).map(s => s.id === id ? { ...s, text } : s) }))}
            onDelete={id => updateContent(prev => ({ ...prev, strengths: (prev.strengths ?? []).filter(s => s.id !== id) }))}
            onReorder={items => updateContent(prev => ({ ...prev, strengths: items }))}
            addLabel="+ Add strength"
            itemStyle="line"
          />
        </div>
        <div style={sectionStyle}>
          <p style={sectionLabel}>Areas for Growth</p>
          <EditableList
            items={content.areasForGrowth ?? []}
            onAdd={text => updateContent(prev => ({ ...prev, areasForGrowth: [...(prev.areasForGrowth ?? []), { id: genId(), text }] }))}
            onEdit={(id, text) => updateContent(prev => ({ ...prev, areasForGrowth: (prev.areasForGrowth ?? []).map(s => s.id === id ? { ...s, text } : s) }))}
            onDelete={id => updateContent(prev => ({ ...prev, areasForGrowth: (prev.areasForGrowth ?? []).filter(s => s.id !== id) }))}
            onReorder={items => updateContent(prev => ({ ...prev, areasForGrowth: items }))}
            addLabel="+ Add area"
            itemStyle="line"
          />
        </div>
      </div>

      {/* Goals */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <p style={{ ...sectionLabel, marginBottom: 0 }}>Development Goals</p>
          <button
            onClick={handleAddGoal}
            style={{
              padding: '5px 12px',
              borderRadius: 8,
              background: 'rgba(247,98,10,0.1)',
              border: '1px solid rgba(247,98,10,0.25)',
              color: '#F7620A',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            + Add Goal
          </button>
        </div>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleGoalDragEnd}>
          <SortableContext items={(content.goals ?? []).map(g => g.id)} strategy={verticalListSortingStrategy}>
            {(content.goals ?? []).map((goal, i) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                index={i}
                onUpdate={handleUpdateGoal}
                onDelete={handleDeleteGoal}
              />
            ))}
          </SortableContext>
        </DndContext>
        {content.goals.length === 0 && (
          <div style={{ border: '1px dashed rgba(241,245,249,0.1)', borderRadius: 12, padding: '32px 24px', textAlign: 'center' }}>
            <p style={{ color: 'rgba(241,245,249,0.35)', fontSize: 14 }}>No goals yet — add one above</p>
          </div>
        )}
      </div>

      {/* Coaching Cues */}
      <div style={sectionStyle}>
        <p style={sectionLabel}>Coaching Cues</p>
        <EditableList
          items={content.coachingCues ?? []}
          onAdd={text => updateContent(prev => ({ ...prev, coachingCues: [...(prev.coachingCues ?? []), { id: genId(), text }] }))}
          onEdit={(id, text) => updateContent(prev => ({ ...prev, coachingCues: (prev.coachingCues ?? []).map(c => c.id === id ? { ...c, text } : c) }))}
          onDelete={id => updateContent(prev => ({ ...prev, coachingCues: (prev.coachingCues ?? []).filter(c => c.id !== id) }))}
          onReorder={items => updateContent(prev => ({ ...prev, coachingCues: items }))}
          addLabel="+ Add coaching cue"
          itemStyle="line"
        />
      </div>

      {/* Parent Summary */}
      <div style={sectionStyle}>
        <p style={sectionLabel}>Parent Summary</p>
        <EditableField
          value={content.parentSummary}
          onSave={val => updateContent(prev => ({ ...prev, parentSummary: val }))}
          multiline
          placeholder="Write a message for parents..."
          textStyle={{ fontSize: 14, lineHeight: '1.6', color: 'rgba(241,245,249,0.8)' }}
          minHeight={80}
        />
      </div>

      {/* Weekly Focus */}
      <div style={sectionStyle}>
        <p style={sectionLabel}>Weekly Focus</p>
        <EditableField
          value={content.weeklyFocus}
          onSave={val => updateContent(prev => ({ ...prev, weeklyFocus: val }))}
          placeholder="What is the focus for this week?"
          textStyle={{ fontSize: 14, color: 'rgba(241,245,249,0.8)' }}
        />
      </div>
    </div>
  )
}

function HistoryView({
  history,
  onView,
  onRestore,
  onCompare,
  isRestoring,
  viewingPlan,
  onCloseView,
}: {
  history: DevPlanV2[]
  onView: (plan: DevPlanV2) => void
  onRestore: (plan: DevPlanV2) => void
  onCompare: (plan: DevPlanV2) => void
  isRestoring: boolean
  viewingPlan: DevPlanV2 | null
  onCloseView: () => void
}) {
  if (viewingPlan) {
    const c = viewingPlan.content
    return (
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <button onClick={onCloseView} style={{ color: '#F7620A', fontSize: 13 }}>← Back</button>
          <span style={{ fontWeight: 700, fontSize: 16 }}>v{viewingPlan.version} — {viewingPlan.plan_name ?? 'Plan'}</span>
          {viewingPlan.archived_at && (
            <span style={{ fontSize: 12, color: 'rgba(241,245,249,0.35)' }}>Archived {timeAgo(viewingPlan.archived_at)}</span>
          )}
        </div>
        {c ? (
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(241,245,249,0.07)', borderRadius: 12, padding: 24 }}>
            {c.summary && <p style={{ fontSize: 14, color: 'rgba(241,245,249,0.8)', lineHeight: '1.6', marginBottom: 16 }}>{c.summary}</p>}
            {c.goals?.map((g, i) => (
              <div key={g.id} style={{ marginBottom: 16 }}>
                <p style={{ fontWeight: 600, fontSize: 14, color: '#F1F5F9' }}>Goal {i + 1}: {g.title}</p>
                <p style={{ fontSize: 13, color: 'rgba(241,245,249,0.6)', marginTop: 4 }}>{g.description}</p>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: 'rgba(241,245,249,0.4)', fontSize: 14 }}>No content available for this version.</p>
        )}
      </div>
    )
  }

  if (history.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 0' }}>
        <p style={{ color: 'rgba(241,245,249,0.35)', fontSize: 14 }}>No archived versions yet.</p>
        <p style={{ color: 'rgba(241,245,249,0.25)', fontSize: 13, marginTop: 8 }}>Archive the current plan to create a new version.</p>
      </div>
    )
  }

  return (
    <div>
      <p style={{ fontSize: 13, color: 'rgba(241,245,249,0.4)', marginBottom: 16 }}>
        {history.length} archived version{history.length !== 1 ? 's' : ''}
      </p>
      {history.map(hp => (
        <div
          key={hp.id}
          style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(241,245,249,0.07)',
            borderRadius: 12,
            padding: '16px 20px',
            marginBottom: 10,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontWeight: 600, fontSize: 14 }}>v{hp.version}</span>
              <span style={{ fontSize: 13, color: 'rgba(241,245,249,0.6)' }}>{hp.plan_name ?? 'Plan'}</span>
              {hp.archive_note && (
                <span style={{ fontSize: 12, color: 'rgba(241,245,249,0.35)' }}>— {hp.archive_note}</span>
              )}
            </div>
            {hp.archived_at && (
              <p style={{ fontSize: 12, color: 'rgba(241,245,249,0.35)', marginTop: 4 }}>
                Archived {timeAgo(hp.archived_at)}
              </p>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            <button
              onClick={() => onView(hp)}
              style={{ padding: '5px 10px', borderRadius: 6, background: 'rgba(241,245,249,0.06)', color: 'rgba(241,245,249,0.6)', fontSize: 12, cursor: 'pointer', border: 'none' }}
            >
              View
            </button>
            <button
              onClick={() => onCompare(hp)}
              style={{ padding: '5px 10px', borderRadius: 6, background: 'rgba(56,189,248,0.08)', color: '#38BDF8', fontSize: 12, cursor: 'pointer', border: '1px solid rgba(56,189,248,0.2)' }}
            >
              Compare →
            </button>
            <button
              onClick={() => onRestore(hp)}
              disabled={isRestoring}
              style={{ padding: '5px 10px', borderRadius: 6, background: 'rgba(34,197,94,0.1)', color: '#22C55E', fontSize: 12, cursor: 'pointer', border: '1px solid rgba(34,197,94,0.2)' }}
            >
              {isRestoring ? '...' : 'Restore'}
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

function CompareColumn({
  label,
  content,
  isHistorical = false,
}: {
  label: string
  content: PlanContent | null
  isHistorical?: boolean
}) {
  const borderColor = isHistorical ? 'rgba(56,189,248,0.15)' : 'rgba(247,98,10,0.15)'
  const labelColor = isHistorical ? '#38BDF8' : '#F7620A'

  return (
    <div style={{ borderRight: isHistorical ? 'none' : '1px solid rgba(241,245,249,0.07)', padding: '24px 24px' }}>
      <p style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: labelColor, marginBottom: 16 }}>
        {label}
      </p>
      {!content ? (
        <p style={{ color: 'rgba(241,245,249,0.35)', fontSize: 13 }}>No content</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <CompareBlock label="Summary" value={content.summary} borderColor={borderColor} />
          <CompareBlock label="Goals" value={content.goals?.map((g, i) => `${i + 1}. ${g.title}`).join('\n')} borderColor={borderColor} />
          <CompareBlock label="Strengths" value={content.strengths?.map(s => `• ${s.text}`).join('\n')} borderColor={borderColor} />
          <CompareBlock label="Areas for Growth" value={content.areasForGrowth?.map(s => `• ${s.text}`).join('\n')} borderColor={borderColor} />
          <CompareBlock label="Weekly Focus" value={content.weeklyFocus} borderColor={borderColor} />
        </div>
      )}
    </div>
  )
}

function CompareBlock({ label, value, borderColor }: { label: string; value: string; borderColor: string }) {
  return (
    <div style={{ borderLeft: `3px solid ${borderColor}`, paddingLeft: 12 }}>
      <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'rgba(241,245,249,0.35)', marginBottom: 4 }}>{label}</p>
      <p style={{ fontSize: 13, color: 'rgba(241,245,249,0.75)', whiteSpace: 'pre-line', lineHeight: '1.5' }}>{value || '—'}</p>
    </div>
  )
}
