'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { drills as staticDrills } from '@/data/drills'
import { useCustomDrills } from '@/hooks/useCustomDrills'
import {
  usePracticePlans,
  useCreatePracticePlan,
  useUpdatePracticePlan,
  useDeletePracticePlan,
  useSchedulePractice,
  type PlanDrill,
  type PracticePlan,
} from '@/hooks/usePracticePlans'
import { useCoachName } from '@/hooks/useCoachName'
import PlanBuilder from './PlanBuilder'
import PracticeSubNav from '../components/PracticeSubNav'

const PracticePlanButton = dynamic(() => import('@/lib/pdf/PracticePlanButton'), { ssr: false })

// ── Constants ────────────────────────────────────────────────────────────────
const FOCUS_OPTIONS = [
  { key: 'Ball Handling', color: '#F7620A' },
  { key: 'Shooting', color: '#38BDF8' },
  { key: 'Passing', color: '#F5B731' },
  { key: 'Defense', color: '#22C55E' },
  { key: 'Conditioning', color: '#E879F9' },
  { key: 'Team Play', color: '#8B5CF6' },
]
const FOCUS_COLOR: Record<string, string> = Object.fromEntries(FOCUS_OPTIONS.map(f => [f.key, f.color]))

const AGE_GROUPS = ['U8', 'U10', 'U12', 'U14', 'U16', 'High School', 'Adult']
const SKILL_LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'Mixed']
const DURATIONS = [30, 45, 60, 75, 90, 120]
const CHARACTER_THEMES = ['', 'Effort', 'Teamwork', 'Resilience', 'Leadership', 'Respect', 'Discipline']

// ── Types ────────────────────────────────────────────────────────────────────
interface PracticeSettings {
  name: string
  ageGroup: string
  skillLevel: string
  durationMins: number
  focusAreas: string[]
  characterTheme: string | null
  generatedDrills?: PlanDrill[]
}

// ── Saved Plans List ──────────────────────────────────────────────────────────
function ScheduleInline({ plan, onDone }: { plan: PracticePlan; onDone: () => void }) {
  const { mutateAsync: schedulePractice, isPending } = useSchedulePractice()
  const [date, setDate] = useState(plan.scheduled_date ?? new Date().toISOString().split('T')[0])
  const [time, setTime] = useState(plan.scheduled_time ? plan.scheduled_time.slice(0, 5) : '')
  const [done, setDone] = useState(false)
  const router = useRouter()

  async function handleSchedule() {
    await schedulePractice({ id: plan.id, scheduled_date: date, scheduled_time: time || null })
    setDone(true)
    setTimeout(onDone, 2000)
  }

  if (done) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium" style={{ backgroundColor: 'rgba(14,207,176,0.1)', color: '#0ECFB0' }}>
        <span>✓ Scheduled for {new Date(date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
        <button onClick={() => router.push('/calendar')} className="underline opacity-70 hover:opacity-100">View on calendar →</button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 p-2 rounded-xl" style={{ backgroundColor: 'rgba(14,207,176,0.06)', border: '1px solid rgba(14,207,176,0.2)' }}>
      <input
        type="date"
        value={date}
        onChange={e => setDate(e.target.value)}
        className="sp-input py-1 text-xs"
        style={{ colorScheme: 'dark', flex: '0 0 auto', width: 'auto' }}
      />
      <input
        type="time"
        value={time}
        onChange={e => setTime(e.target.value)}
        className="sp-input py-1 text-xs"
        placeholder="Time (opt)"
        style={{ colorScheme: 'dark', flex: '0 0 auto', width: 'auto' }}
      />
      <button
        onClick={handleSchedule}
        disabled={isPending}
        className="flex-shrink-0 px-3 py-1 text-xs font-semibold rounded-lg disabled:opacity-50 transition-opacity hover:opacity-85"
        style={{ backgroundColor: '#0ECFB0', color: '#0E1520' }}
      >
        {isPending ? '...' : 'Schedule →'}
      </button>
      <button onClick={onDone} className="text-xs" style={{ color: 'rgba(241,245,249,0.3)' }}>✕</button>
    </div>
  )
}

function SavedPlansList({
  onNew,
  onOpen,
  onRun,
}: {
  onNew: () => void
  onOpen: (plan: PracticePlan) => void
  onRun: (plan: PracticePlan) => void
}) {
  const { data: plans = [], isLoading } = usePracticePlans()
  const { mutate: deletePlan } = useDeletePracticePlan()
  const coachName = useCoachName()
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [schedulingId, setSchedulingId] = useState<string | null>(null)

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-sp-text">Practice Planner</h1>
          <p className="text-sm mt-0.5" style={{ color: 'rgba(241,245,249,0.4)' }}>
            {plans.length} saved {plans.length === 1 ? 'plan' : 'plans'}
          </p>
        </div>
        <button
          onClick={onNew}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg transition-opacity hover:opacity-85"
          style={{ backgroundColor: '#F7620A', color: '#fff' }}
        >
          <span>+</span> New Plan
        </button>
      </div>

      {/* List */}
      {isLoading ? (
        <p className="text-sm py-8 text-center" style={{ color: 'rgba(241,245,249,0.35)' }}>Loading...</p>
      ) : plans.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-20 rounded-xl"
          style={{ border: '1px dashed rgba(241,245,249,0.1)' }}
        >
          <p className="text-sm mb-4" style={{ color: 'rgba(241,245,249,0.35)' }}>
            No saved plans yet
          </p>
          <button
            onClick={onNew}
            className="px-5 py-2 text-sm font-semibold rounded-lg transition-opacity hover:opacity-85"
            style={{ backgroundColor: '#F7620A', color: '#fff' }}
          >
            Create your first plan
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {plans.map(plan => {
            const totalMins = plan.drills.reduce((s, d) => s + d.durationMins, 0)
            const isDeleting = confirmDelete === plan.id

            return (
              <div key={plan.id}>
              <div
                className="flex items-center gap-4 px-5 py-4 rounded-xl"
                style={{ backgroundColor: '#0E1520', border: '1px solid rgba(241,245,249,0.07)' }}
              >
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-sp-text truncate">{plan.name}</p>
                  <div className="flex items-center flex-wrap gap-2 mt-1">
                    {plan.age_group && (
                      <span className="text-xs" style={{ color: 'rgba(241,245,249,0.4)' }}>{plan.age_group}</span>
                    )}
                    <span className="text-xs" style={{ color: 'rgba(241,245,249,0.25)' }}>·</span>
                    <span className="text-xs" style={{ color: 'rgba(241,245,249,0.4)' }}>
                      {plan.drills.length} drills · {totalMins} min
                    </span>
                    <span className="text-xs" style={{ color: 'rgba(241,245,249,0.25)' }}>·</span>
                    <span className="text-xs" style={{ color: 'rgba(241,245,249,0.3)' }}>
                      {formatDate(plan.created_at)}
                    </span>
                  </div>

                  {/* Focus area tags */}
                  {plan.focus_areas && plan.focus_areas.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {plan.focus_areas.map(area => (
                        <span
                          key={area}
                          className="text-xs px-2 py-0.5 rounded-full"
                          style={{
                            backgroundColor: `${FOCUS_COLOR[area] ?? '#6B7280'}18`,
                            color: FOCUS_COLOR[area] ?? '#6B7280',
                          }}
                        >
                          {area}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {isDeleting ? (
                    <>
                      <span className="text-xs mr-1" style={{ color: 'rgba(241,245,249,0.5)' }}>Delete?</span>
                      <button
                        onClick={() => { deletePlan(plan.id); setConfirmDelete(null) }}
                        className="text-xs px-3 py-1.5 rounded-lg font-medium transition-opacity hover:opacity-85"
                        style={{ backgroundColor: '#EF4444', color: '#fff' }}
                      >
                        Yes
                      </button>
                      <button
                        onClick={() => setConfirmDelete(null)}
                        className="text-xs px-3 py-1.5 rounded-lg font-medium transition-colors"
                        style={{ backgroundColor: 'rgba(241,245,249,0.06)', color: 'rgba(241,245,249,0.5)' }}
                      >
                        No
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => setConfirmDelete(plan.id)}
                        className="text-xs px-3 py-1.5 rounded-lg transition-colors hover:opacity-60"
                        style={{ color: 'rgba(241,245,249,0.3)' }}
                        title="Delete"
                      >
                        ✕
                      </button>
                      <PracticePlanButton
                        plan={plan}
                        coachName={coachName}
                        className="text-xs px-3 py-1.5 rounded-lg font-medium transition-opacity hover:opacity-85"
                        style={{
                          textDecoration: 'none',
                          backgroundColor: 'rgba(241,245,249,0.06)',
                          color: 'rgba(241,245,249,0.6)',
                          border: '1px solid rgba(241,245,249,0.08)',
                        }}
                      />
                      <button
                        onClick={() => setSchedulingId(schedulingId === plan.id ? null : plan.id)}
                        className="text-xs px-3 py-1.5 rounded-lg font-medium transition-opacity hover:opacity-85"
                        style={{
                          backgroundColor: plan.scheduled_date ? 'rgba(14,207,176,0.12)' : 'rgba(241,245,249,0.06)',
                          color: plan.scheduled_date ? '#0ECFB0' : 'rgba(241,245,249,0.6)',
                          border: `1px solid ${plan.scheduled_date ? 'rgba(14,207,176,0.25)' : 'rgba(241,245,249,0.08)'}`,
                        }}
                      >
                        {plan.scheduled_date ? '📅 Scheduled' : 'Schedule'}
                      </button>
                      <button
                        onClick={() => onOpen(plan)}
                        className="text-xs px-3 py-1.5 rounded-lg font-medium transition-colors"
                        style={{
                          backgroundColor: 'rgba(241,245,249,0.06)',
                          color: 'rgba(241,245,249,0.6)',
                          border: '1px solid rgba(241,245,249,0.08)',
                        }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => onRun(plan)}
                        className="text-xs px-3 py-1.5 rounded-lg font-medium transition-opacity hover:opacity-85"
                        style={{ backgroundColor: '#22C55E', color: '#fff' }}
                      >
                        ▶ Run
                      </button>
                    </>
                  )}
                </div>
              </div>
              {/* Inline schedule picker */}
              {schedulingId === plan.id && (
                <div className="mt-2 px-1 pb-1">
                  <ScheduleInline plan={plan} onDone={() => setSchedulingId(null)} />
                </div>
              )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Settings form ─────────────────────────────────────────────────────────────
function SettingsPanel({
  onGenerate,
  onManual,
  onBack,
}: {
  onGenerate: (settings: PracticeSettings) => void
  onManual: (settings: PracticeSettings) => void
  onBack: () => void
}) {
  const [name, setName] = useState('')
  const [ageGroup, setAgeGroup] = useState('U12')
  const [skillLevel, setSkillLevel] = useState('Intermediate')
  const [durationMins, setDurationMins] = useState(75)
  const [focusAreas, setFocusAreas] = useState<string[]>([])
  const [characterTheme, setCharacterTheme] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState('')

  const labelStyle = { color: 'rgba(241,245,249,0.6)', fontSize: '13px', fontWeight: 500 } as const

  function toggleFocus(key: string) {
    setFocusAreas(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    )
  }

  const settings: PracticeSettings = {
    name: name.trim() || `${ageGroup} Practice`,
    ageGroup,
    skillLevel,
    durationMins,
    focusAreas,
    characterTheme: characterTheme || null,
  }

  async function handleGenerate() {
    setError('')
    setIsGenerating(true)
    try {
      const res = await fetch('/api/ai/practice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Generation failed')
      onGenerate({ ...settings, generatedDrills: data.drills })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={onBack}
          className="text-sm transition-opacity hover:opacity-60"
          style={{ color: 'rgba(241,245,249,0.4)' }}
        >
          ← Back
        </button>
        <h1 className="text-2xl font-bold text-sp-text">New Practice Plan</h1>
      </div>

      <div
        className="max-w-xl rounded-xl p-6"
        style={{ backgroundColor: '#0E1520', border: '1px solid rgba(241,245,249,0.07)' }}
      >
        <div className="space-y-4">
          {/* Name */}
          <div>
            <label className="block mb-1.5" style={labelStyle}>Practice Name</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Tuesday Shooting Practice"
              className="sp-input"
            />
          </div>

          {/* Age + Skill */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block mb-1.5" style={labelStyle}>Age Group</label>
              <select value={ageGroup} onChange={e => setAgeGroup(e.target.value)} className="sp-input">
                {AGE_GROUPS.map(g => (
                  <option key={g} value={g} style={{ backgroundColor: '#0E1520' }}>{g}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block mb-1.5" style={labelStyle}>Skill Level</label>
              <select value={skillLevel} onChange={e => setSkillLevel(e.target.value)} className="sp-input">
                {SKILL_LEVELS.map(l => (
                  <option key={l} value={l} style={{ backgroundColor: '#0E1520' }}>{l}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Duration */}
          <div>
            <label className="block mb-1.5" style={labelStyle}>Duration</label>
            <div className="flex flex-wrap gap-2">
              {DURATIONS.map(d => (
                <button
                  key={d}
                  onClick={() => setDurationMins(d)}
                  className="px-4 py-1.5 rounded-full text-sm font-medium transition-all"
                  style={{
                    backgroundColor: durationMins === d ? '#F7620A' : 'rgba(241,245,249,0.06)',
                    color: durationMins === d ? '#fff' : 'rgba(241,245,249,0.45)',
                    border: `1px solid ${durationMins === d ? '#F7620A' : 'rgba(241,245,249,0.08)'}`,
                  }}
                >
                  {d} min
                </button>
              ))}
            </div>
          </div>

          {/* Focus Areas */}
          <div>
            <label className="block mb-1.5" style={labelStyle}>
              Focus Areas{' '}
              <span style={{ color: 'rgba(241,245,249,0.3)', fontWeight: 400 }}>(select all that apply)</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {FOCUS_OPTIONS.map(({ key, color }) => {
                const active = focusAreas.includes(key)
                return (
                  <button
                    key={key}
                    onClick={() => toggleFocus(key)}
                    className="px-3 py-1.5 rounded-full text-sm font-medium transition-all"
                    style={{
                      backgroundColor: active ? `${color}22` : 'rgba(241,245,249,0.06)',
                      color: active ? color : 'rgba(241,245,249,0.45)',
                      border: `1px solid ${active ? color + '55' : 'rgba(241,245,249,0.08)'}`,
                    }}
                  >
                    {key}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Character Theme */}
          <div>
            <label className="block mb-1.5" style={labelStyle}>
              Character Theme{' '}
              <span style={{ color: 'rgba(241,245,249,0.3)', fontWeight: 400 }}>(optional)</span>
            </label>
            <select value={characterTheme} onChange={e => setCharacterTheme(e.target.value)} className="sp-input">
              {CHARACTER_THEMES.map(t => (
                <option key={t} value={t} style={{ backgroundColor: '#0E1520' }}>{t || '— None —'}</option>
              ))}
            </select>
          </div>

          {error && (
            <p className="text-sm text-red-400 rounded-lg px-3 py-2" style={{ backgroundColor: 'rgba(239,68,68,0.1)' }}>
              {error}
            </p>
          )}

          <div className="flex gap-3 pt-1">
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-lg disabled:opacity-60 transition-opacity hover:opacity-85"
              style={{ backgroundColor: '#F7620A', color: '#fff' }}
            >
              {isGenerating ? <><span className="animate-spin">⟳</span> Generating...</> : <>✨ Generate with AI</>}
            </button>
            <button
              onClick={() => onManual(settings)}
              className="px-5 py-2.5 text-sm font-semibold rounded-lg transition-colors"
              style={{
                backgroundColor: 'rgba(241,245,249,0.06)',
                color: 'rgba(241,245,249,0.7)',
                border: '1px solid rgba(241,245,249,0.1)',
              }}
            >
              Build Manually
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function PlannerPage() {
  const router = useRouter()
  const [phase, setPhase] = useState<'list' | 'settings' | 'building'>('list')
  const [settings, setSettings] = useState<PracticeSettings | null>(null)
  const [planDrills, setPlanDrills] = useState<PlanDrill[]>([])
  const [savedPlanId, setSavedPlanId] = useState<string | null>(null)
  const [saveError, setSaveError] = useState('')
  const [hasQueuedGame, setHasQueuedGame] = useState(false)
  const [addedGameName, setAddedGameName] = useState('')

  const { data: customDrillRows = [] } = useCustomDrills()
  const { mutateAsync: createPlan, isPending: isCreating } = useCreatePracticePlan()
  const { mutateAsync: updatePlan, isPending: isUpdating } = useUpdatePracticePlan()

  // Check for queued game from games library
  useEffect(() => {
    setHasQueuedGame(!!localStorage.getItem('sp_queued_game'))
  }, [])

  // Auto-add queued game when entering building phase
  useEffect(() => {
    if (phase !== 'building') return
    const raw = localStorage.getItem('sp_queued_game')
    if (!raw) return
    try {
      const item = JSON.parse(raw) as PlanDrill
      setPlanDrills(prev => prev.some(d => d.uid === item.uid) ? prev : [...prev, item])
      setAddedGameName(item.name)
      localStorage.removeItem('sp_queued_game')
      setHasQueuedGame(false)
      setTimeout(() => setAddedGameName(''), 3000)
    } catch {
      localStorage.removeItem('sp_queued_game')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  const isSaving = isCreating || isUpdating

  const allDrills = useMemo(() => {
    const custom = customDrillRows.map(d => ({
      id: d.id,
      name: d.name,
      category: d.category as 'ballhandling' | 'shooting' | 'passing' | 'defense' | 'conditioning' | 'team',
      categoryColor: ({ ballhandling: '#F7620A', shooting: '#38BDF8', passing: '#F5B731', defense: '#22C55E', conditioning: '#E879F9', team: '#8B5CF6' } as Record<string, string>)[d.category] ?? '#8B5CF6',
      durationMins: d.duration_mins,
      playersNeeded: d.players_needed ?? 'Full team',
      level: d.level as 'Beginner' | 'Intermediate' | 'Advanced' | 'All levels',
      description: d.description,
      setup: d.setup ?? undefined,
      instructions: d.instructions ?? undefined,
      cues: d.cues ?? [],
      progression: d.progression ?? undefined,
      tags: [],
      isCustom: true,
    }))
    return [...custom, ...staticDrills]
  }, [customDrillRows])

  function handleGenerate(s: PracticeSettings) {
    setSettings(s)
    setPlanDrills(s.generatedDrills ?? [])
    setSavedPlanId(null)
    setSaveError('')
    setPhase('building')
  }

  function handleManual(s: PracticeSettings) {
    setSettings(s)
    setPlanDrills([])
    setSavedPlanId(null)
    setSaveError('')
    setPhase('building')
  }

  function handleOpenSaved(plan: PracticePlan) {
    setSettings({
      name: plan.name,
      ageGroup: plan.age_group ?? 'U12',
      skillLevel: 'Intermediate',
      durationMins: plan.duration_mins,
      focusAreas: plan.focus_areas ?? [],
      characterTheme: plan.character_theme,
    })
    setPlanDrills(plan.drills)
    setSavedPlanId(plan.id)
    setSaveError('')
    setPhase('building')
  }

  async function handleSave() {
    if (!settings) return
    setSaveError('')
    const payload = {
      name: settings.name,
      age_group: settings.ageGroup,
      duration_mins: settings.durationMins,
      focus_areas: settings.focusAreas,
      character_theme: settings.characterTheme,
      drills: planDrills,
    }
    try {
      if (savedPlanId) {
        await updatePlan({ id: savedPlanId, ...payload })
      } else {
        const plan = await createPlan(payload)
        setSavedPlanId(plan.id)
      }
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Save failed')
    }
  }

  function handleStartRun() {
    if (savedPlanId) router.push(`/practice/run?id=${savedPlanId}`)
  }

  if (phase === 'list') {
    return (
      <div>
        <PracticeSubNav />
        {hasQueuedGame && (
          <div
            className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl mb-5"
            style={{ backgroundColor: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)' }}
          >
            <p className="text-sm font-medium" style={{ color: '#22C55E' }}>
              🎮 A practice game is queued — open or create a plan to add it.
            </p>
            <button
              onClick={() => { localStorage.removeItem('sp_queued_game'); setHasQueuedGame(false) }}
              className="text-xs transition-opacity hover:opacity-60 flex-shrink-0"
              style={{ color: 'rgba(34,197,94,0.6)' }}
            >
              Dismiss
            </button>
          </div>
        )}
        <SavedPlansList
          onNew={() => setPhase('settings')}
          onOpen={handleOpenSaved}
          onRun={plan => router.push(`/practice/run?id=${plan.id}`)}
        />
      </div>
    )
  }

  if (phase === 'settings') {
    return <SettingsPanel onGenerate={handleGenerate} onManual={handleManual} onBack={() => setPhase('list')} />
  }

  return (
    <div>
      <PracticeSubNav />
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => setPhase('list')}
          className="text-sm transition-opacity hover:opacity-60"
          style={{ color: 'rgba(241,245,249,0.4)' }}
        >
          ← My Plans
        </button>
        <div>
          <h1 className="text-2xl font-bold text-sp-text">{settings?.name ?? 'Practice Plan'}</h1>
          {settings && (
            <p className="text-sm mt-0.5" style={{ color: 'rgba(241,245,249,0.4)' }}>
              {settings.ageGroup} · {settings.skillLevel} · {settings.durationMins} min
            </p>
          )}
        </div>
      </div>

      {saveError && (
        <p className="mb-4 text-sm text-red-400 px-3 py-2 rounded-lg" style={{ backgroundColor: 'rgba(239,68,68,0.1)' }}>
          {saveError}
        </p>
      )}
      {addedGameName && (
        <div
          className="mb-4 px-4 py-2.5 rounded-xl text-sm font-medium"
          style={{ backgroundColor: 'rgba(34,197,94,0.1)', color: '#22C55E', border: '1px solid rgba(34,197,94,0.2)' }}
        >
          🎮 &ldquo;{addedGameName}&rdquo; added to plan
        </div>
      )}

      <PlanBuilder
        planName={settings?.name ?? 'Practice Plan'}
        planDrills={planDrills}
        allDrills={allDrills}
        isSaving={isSaving}
        onDrillsChange={setPlanDrills}
        onSave={handleSave}
        onStartRun={handleStartRun}
        savedPlanId={savedPlanId}
      />
    </div>
  )
}
