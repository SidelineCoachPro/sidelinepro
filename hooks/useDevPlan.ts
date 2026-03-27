import { useQuery, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useRef, useState, useCallback } from 'react'

// ── Types ────────────────────────────────────────────────────────────────────

export interface PlanItem { id: string; text: string }

export interface PlanGoal {
  id: string
  title: string
  description: string
  targetSkill: string
  actionSteps: PlanItem[]
  suggestedDrillIds: string[]
  timeframeWeeks: number
  isComplete: boolean
  completedAt?: string
}

export interface PlanContent {
  summary: string
  strengths: PlanItem[]
  areasForGrowth: PlanItem[]
  goals: PlanGoal[]
  coachingCues: PlanItem[]
  parentSummary: string
  weeklyFocus: string
}

export interface DevPlanV2 {
  id: string
  player_id: string
  coach_id: string
  version: number
  is_active: boolean
  archived_at: string | null
  archive_note: string | null
  plan_name: string | null
  created_by: string
  last_edited_at: string
  edit_count: number
  content: PlanContent | null
  focus_skill?: string
  drills?: unknown[]
  duration_mins?: number
  message_text?: string
  created_at: string
}

// ── Helpers ──────────────────────────────────────────────────────────────────

export function genId(): string {
  return Math.random().toString(36).slice(2, 9)
}

export function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

export function blankPlanContent(): PlanContent {
  return {
    summary: '',
    strengths: [],
    areasForGrowth: [],
    goals: [],
    coachingCues: [],
    parentSummary: '',
    weeklyFocus: '',
  }
}

export function normalizePlanContent(content: PlanContent | null | undefined): PlanContent {
  if (!content) return blankPlanContent()
  return {
    summary: content.summary ?? '',
    strengths: content.strengths ?? [],
    areasForGrowth: content.areasForGrowth ?? [],
    goals: (content.goals ?? []).map(g => ({
      ...g,
      actionSteps: g.actionSteps ?? [],
      suggestedDrillIds: g.suggestedDrillIds ?? [],
      isComplete: g.isComplete ?? false,
    })),
    coachingCues: content.coachingCues ?? [],
    parentSummary: content.parentSummary ?? '',
    weeklyFocus: content.weeklyFocus ?? '',
  }
}

// ── Hooks ────────────────────────────────────────────────────────────────────

export function useDevPlan(playerId: string | undefined) {
  return useQuery({
    queryKey: ['devplan', playerId],
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('dev_plans')
        .select('*')
        .eq('player_id', playerId!)
        .eq('is_active', true)
        .maybeSingle()
      if (error) throw error
      return data as DevPlanV2 | null
    },
    enabled: !!playerId,
  })
}

export function useDevPlanHistory(playerId: string | undefined) {
  return useQuery({
    queryKey: ['devplan-history', playerId],
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('dev_plans')
        .select('*')
        .eq('player_id', playerId!)
        .eq('is_active', false)
        .order('version', { ascending: false })
      if (error) throw error
      return (data ?? []) as DevPlanV2[]
    },
    enabled: !!playerId,
  })
}

export function useUpdateDevPlan() {
  const qc = useQueryClient()
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<string | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const update = useCallback(
    (planId: string, playerId: string, content: PlanContent) => {
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(async () => {
        setIsSaving(true)
        try {
          const supabase = createClient()
          const { data: current } = await supabase
            .from('dev_plans')
            .select('edit_count')
            .eq('id', planId)
            .single()
          const editCount = (current?.edit_count ?? 0) + 1
          await supabase
            .from('dev_plans')
            .update({
              content,
              last_edited_at: new Date().toISOString(),
              edit_count: editCount,
            })
            .eq('id', planId)
          setLastSaved(new Date().toISOString())
          qc.invalidateQueries({ queryKey: ['devplan', playerId] })
        } finally {
          setIsSaving(false)
        }
      }, 500)
    },
    [qc],
  )

  return { update, isSaving, lastSaved }
}

export function useArchiveDevPlan() {
  const qc = useQueryClient()
  const [isArchiving, setIsArchiving] = useState(false)

  const archive = useCallback(
    async (plan: DevPlanV2, archiveNote: string) => {
      setIsArchiving(true)
      try {
        const supabase = createClient()
        await supabase
          .from('dev_plans')
          .update({
            is_active: false,
            archived_at: new Date().toISOString(),
            archive_note: archiveNote,
          })
          .eq('id', plan.id)

        await supabase.from('dev_plans').insert({
          player_id: plan.player_id,
          coach_id: plan.coach_id,
          version: plan.version + 1,
          is_active: true,
          content: plan.content,
          plan_name: plan.plan_name,
          created_by: plan.created_by,
          focus_skill: plan.focus_skill,
          last_edited_at: new Date().toISOString(),
          edit_count: 0,
        })

        qc.invalidateQueries({ queryKey: ['devplan', plan.player_id] })
        qc.invalidateQueries({ queryKey: ['devplan-history', plan.player_id] })
      } finally {
        setIsArchiving(false)
      }
    },
    [qc],
  )

  return { archive, isArchiving }
}

export function useCreateDevPlanV2() {
  const qc = useQueryClient()
  const [isCreating, setIsCreating] = useState(false)

  const create = useCallback(
    async (
      playerId: string,
      _coachId: string,
      content: PlanContent,
      opts?: { created_by?: string; focus_skill?: string; plan_name?: string },
    ) => {
      setIsCreating(true)
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        const coachId = user?.id
        if (!coachId) throw new Error('Not authenticated')

        await supabase
          .from('dev_plans')
          .update({ is_active: false })
          .eq('player_id', playerId)
          .eq('is_active', true)

        const { data, error } = await supabase
          .from('dev_plans')
          .insert({
            player_id: playerId,
            coach_id: coachId,
            version: 1,
            is_active: true,
            content,
            plan_name: opts?.plan_name ?? 'Development Plan',
            created_by: opts?.created_by ?? 'ai',
            focus_skill: opts?.focus_skill ?? 'general',
            last_edited_at: new Date().toISOString(),
            edit_count: 0,
          })
          .select()
          .single()
        if (error) throw error

        qc.invalidateQueries({ queryKey: ['devplan', playerId] })
        qc.invalidateQueries({ queryKey: ['devplan-history', playerId] })
        return data as DevPlanV2
      } finally {
        setIsCreating(false)
      }
    },
    [qc],
  )

  return { create, isCreating }
}

export function useRestoreDevPlan() {
  const qc = useQueryClient()
  const [isRestoring, setIsRestoring] = useState(false)

  const restore = useCallback(
    async (historicalPlan: DevPlanV2, currentPlan: DevPlanV2 | null) => {
      setIsRestoring(true)
      try {
        const supabase = createClient()

        if (currentPlan) {
          await supabase
            .from('dev_plans')
            .update({
              is_active: false,
              archived_at: new Date().toISOString(),
              archive_note: `Restored from v${historicalPlan.version}`,
            })
            .eq('id', currentPlan.id)
        }

        await supabase
          .from('dev_plans')
          .update({
            is_active: true,
            archived_at: null,
            archive_note: null,
          })
          .eq('id', historicalPlan.id)

        qc.invalidateQueries({ queryKey: ['devplan', historicalPlan.player_id] })
        qc.invalidateQueries({ queryKey: ['devplan-history', historicalPlan.player_id] })
      } finally {
        setIsRestoring(false)
      }
    },
    [qc],
  )

  return { restore, isRestoring }
}
