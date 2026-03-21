import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

export interface SeasonPhase {
  name: string
  startWeek: number
  endWeek: number
  focusAreas: string[]
  description: string
  intensity: 1 | 2 | 3 | 4 | 5
}

export interface WeeklyFocus {
  week: number
  primaryFocus: string
  secondaryFocus: string
  characterTheme: string
  intensity: 1 | 2 | 3 | 4 | 5
}

export interface SeasonPlan {
  id: string
  coach_id: string
  name: string
  season_type: 'rec' | 'aau' | 'school' | 'custom'
  start_date: string
  end_date: string
  practices_per_week: number
  practice_duration_mins: number
  age_group: string | null
  skill_level: string
  phases: SeasonPhase[]
  weekly_focus_rotation: WeeklyFocus[]
  character_theme_sequence: string[]
  use_player_evals: boolean
  team_weaknesses: string[] | null
  status: 'draft' | 'active' | 'completed'
  total_weeks: number
  created_at: string
  updated_at: string
}

type CreateInput = Omit<SeasonPlan, 'id' | 'coach_id' | 'total_weeks' | 'created_at' | 'updated_at'>

const supabase = createClient()

export function useSeasonPlans() {
  return useQuery({
    queryKey: ['season_plans'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('season_plans')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data ?? []) as SeasonPlan[]
    },
  })
}

export function useSeasonPlan(id: string | null) {
  return useQuery({
    queryKey: ['season_plans', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('season_plans')
        .select('*')
        .eq('id', id!)
        .single()
      if (error) throw error
      return data as SeasonPlan
    },
  })
}

export function useCreateSeasonPlan() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: CreateInput) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      const { data, error } = await supabase
        .from('season_plans')
        .insert({ ...input, coach_id: user.id })
        .select()
        .single()
      if (error) throw error
      return data as SeasonPlan
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['season_plans'] }),
  })
}

export function useUpdateSeasonPlan() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...rest }: Partial<CreateInput> & { id: string }) => {
      const { data, error } = await supabase
        .from('season_plans')
        .update({ ...rest, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data as SeasonPlan
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['season_plans'] })
      qc.setQueryData(['season_plans', data.id], data)
    },
  })
}

export function useSeasonPracticeCounts() {
  return useQuery({
    queryKey: ['season_practice_counts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('practice_plans')
        .select('season_plan_id')
        .not('season_plan_id', 'is', null)
      if (error) throw error
      const counts: Record<string, number> = {}
      for (const row of data ?? []) {
        if (row.season_plan_id) counts[row.season_plan_id] = (counts[row.season_plan_id] ?? 0) + 1
      }
      return counts
    },
  })
}

export function useDeleteSeasonPlan() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('season_plans').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['season_plans'] }),
  })
}
