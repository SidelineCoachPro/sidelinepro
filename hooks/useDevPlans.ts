import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

export interface DevPlanDrill {
  id: string
  name: string
  duration_mins: number
  instructions: string
  focus: string
}

export interface DevPlanData {
  focus_skill: string
  drills: DevPlanDrill[]
  duration_mins: number
  message_text: string
}

export interface DevPlan {
  id: string
  player_id: string
  coach_id: string
  evaluation_id: string | null
  focus_skill: string
  drills: DevPlanDrill[]
  duration_mins: number
  message_text: string
  created_at: string
}

export type CreateDevPlanInput = {
  player_id: string
  evaluation_id?: string | null
  focus_skill: string
  drills: DevPlanDrill[]
  duration_mins: number
  message_text: string
}

const supabase = createClient()

export function useDevPlans(playerId: string) {
  return useQuery({
    queryKey: ['dev_plans', playerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dev_plans')
        .select('*')
        .eq('player_id', playerId)
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data ?? []).map(row => ({
        ...row,
        drills: row.drills as DevPlanDrill[],
      })) as DevPlan[]
    },
    enabled: !!playerId,
  })
}

export function useCreateDevPlan() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: CreateDevPlanInput) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      const { data, error } = await supabase
        .from('dev_plans')
        .insert({
          player_id: input.player_id,
          coach_id: user.id,
          evaluation_id: input.evaluation_id ?? null,
          focus_skill: input.focus_skill,
          drills: input.drills,
          duration_mins: input.duration_mins,
          message_text: input.message_text,
        })
        .select()
        .single()
      if (error) throw error
      return { ...data, drills: data.drills as DevPlanDrill[] } as DevPlan
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['dev_plans', data.player_id] })
    },
  })
}
