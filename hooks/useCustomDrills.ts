import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

export interface CustomDrillRow {
  id: string
  coach_id: string
  name: string
  category: string
  duration_mins: number
  players_needed: string
  level: string
  description: string
  setup: string | null
  instructions: string | null
  cues: string[]
  progression: string | null
  created_at: string
}

export type NewCustomDrill = Omit<CustomDrillRow, 'id' | 'coach_id' | 'created_at'>

async function fetchCustomDrills(): Promise<CustomDrillRow[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('custom_drills')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export function useCustomDrills() {
  return useQuery({
    queryKey: ['custom_drills'],
    queryFn: fetchCustomDrills,
  })
}

export function useCreateCustomDrill() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (drill: NewCustomDrill) => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('custom_drills')
        .insert({ ...drill, coach_id: user.id })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom_drills'] })
    },
  })
}

export function useUpdateCustomDrill() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({ id, drill }: { id: string; drill: Partial<NewCustomDrill> }) => {
      const { data, error } = await supabase
        .from('custom_drills')
        .update(drill)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom_drills'] })
    },
  })
}

export function useDeleteCustomDrill() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('custom_drills').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom_drills'] })
    },
  })
}
