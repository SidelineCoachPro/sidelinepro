import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

export interface Evaluation {
  id: string
  player_id: string
  coach_id: string
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
  return useQuery({
    queryKey: ['evaluations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('evaluations')
        .select('*')
        .order('evaluated_at', { ascending: true })
      if (error) throw error
      return data as Evaluation[]
    },
  })
}

export function useCreateEvaluation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: CreateEvalInput) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      const { data, error } = await supabase
        .from('evaluations')
        .insert({ ...input, coach_id: user.id })
        .select()
        .single()
      if (error) throw error
      return data as Evaluation
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['evaluations'] }),
  })
}
