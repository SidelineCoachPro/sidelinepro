import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useTeam } from '@/lib/teamContext'

export interface Evaluation {
  id: string
  player_id: string
  coach_id: string
  team_id: string | null
  ball_handling: number | null
  shooting: number | null
  passing: number | null
  defense: number | null
  athleticism: number | null
  coachability: number | null
  overall_avg: number | null
  grade: string | null
  notes: string | null
  evaluated_at: string
}

export type CreateEvalInput = {
  player_id: string
  ball_handling: number
  shooting: number
  passing: number
  defense: number
  athleticism: number
  coachability: number
  overall_avg: number
  grade: string
  notes?: string | null
  evaluated_at?: string
}

const supabase = createClient()

export function useEvaluations() {
  const { activeTeamId } = useTeam()
  return useQuery({
    queryKey: ['evaluations', activeTeamId ?? 'all'],
    queryFn: async () => {
      let q = supabase
        .from('evaluations')
        .select('*')
        .order('evaluated_at', { ascending: true })
      if (activeTeamId) q = q.eq('team_id', activeTeamId)
      const { data, error } = await q
      if (error) throw error
      return data as Evaluation[]
    },
  })
}

export function useCreateEvaluation() {
  const qc = useQueryClient()
  const { activeTeamId } = useTeam()
  return useMutation({
    mutationFn: async (input: CreateEvalInput) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      const { data, error } = await supabase
        .from('evaluations')
        .insert({ ...input, coach_id: user.id, team_id: activeTeamId ?? null })
        .select()
        .single()
      if (error) throw error
      return data as Evaluation
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['evaluations'] }),
  })
}
