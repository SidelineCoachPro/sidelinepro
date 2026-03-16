import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

export interface PlanDrill {
  uid: string          // unique key within the plan (for DnD)
  drillId: string      // references static drill id or custom drill UUID
  name: string
  category: string
  categoryColor: string
  durationMins: number
  notes?: string
}

export interface PracticePlan {
  id: string
  coach_id: string
  name: string
  age_group: string | null
  duration_mins: number
  focus_areas: string[] | null
  character_theme: string | null
  drills: PlanDrill[]
  is_template: boolean
  created_at: string
  updated_at: string
}

type CreateInput = {
  name: string
  age_group?: string | null
  duration_mins: number
  focus_areas?: string[] | null
  character_theme?: string | null
  drills: PlanDrill[]
  is_template?: boolean
}

type UpdateInput = Partial<CreateInput> & { id: string }

const supabase = createClient()

export function usePracticePlans() {
  return useQuery({
    queryKey: ['practice_plans'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('practice_plans')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as PracticePlan[]
    },
  })
}

export function usePracticePlan(id: string | null) {
  return useQuery({
    queryKey: ['practice_plans', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('practice_plans')
        .select('*')
        .eq('id', id!)
        .single()
      if (error) throw error
      return data as PracticePlan
    },
  })
}

export function useCreatePracticePlan() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: CreateInput) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      const { data, error } = await supabase
        .from('practice_plans')
        .insert({ ...input, coach_id: user.id })
        .select()
        .single()
      if (error) throw error
      return data as PracticePlan
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['practice_plans'] }),
  })
}

export function useUpdatePracticePlan() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...rest }: UpdateInput) => {
      const { data, error } = await supabase
        .from('practice_plans')
        .update(rest)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data as PracticePlan
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['practice_plans'] })
      qc.setQueryData(['practice_plans', data.id], data)
    },
  })
}

export function useDeletePracticePlan() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('practice_plans')
        .delete()
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['practice_plans'] }),
  })
}
