import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

export interface CustomPlayRow {
  id: string
  coach_id: string
  name: string
  category: string
  difficulty: string
  type: string
  description: string
  teaching_keys: string[]
  steps: string[]
  suggested_duration_mins: number
  created_at: string
}

export type NewCustomPlay = Omit<CustomPlayRow, 'id' | 'coach_id' | 'created_at'>

async function fetchCustomPlays(): Promise<CustomPlayRow[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('custom_plays')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export function useCustomPlays() {
  return useQuery({ queryKey: ['custom_plays'], queryFn: fetchCustomPlays })
}

export function useCreateCustomPlay() {
  const queryClient = useQueryClient()
  const supabase = createClient()
  return useMutation({
    mutationFn: async (play: NewCustomPlay) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      const { data, error } = await supabase
        .from('custom_plays')
        .insert({ ...play, coach_id: user.id })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['custom_plays'] }),
  })
}

export function useDeleteCustomPlay() {
  const queryClient = useQueryClient()
  const supabase = createClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('custom_plays').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['custom_plays'] }),
  })
}
