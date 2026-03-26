import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

export interface CustomGameRow {
  id: string
  coach_id: string
  name: string
  category: string
  duration_mins: number
  players_min: number
  players_max: number
  energy_level: string
  skill_focus: string[]
  description: string
  setup: string | null
  how_to_play: string | null
  coaching_tips: string[]
  variations: string[]
  created_at: string
}

export type NewCustomGame = Omit<CustomGameRow, 'id' | 'coach_id' | 'created_at'>

async function fetchCustomGames(): Promise<CustomGameRow[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('custom_games')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export function useCustomGames() {
  return useQuery({ queryKey: ['custom_games'], queryFn: fetchCustomGames })
}

export function useCreateCustomGame() {
  const queryClient = useQueryClient()
  const supabase = createClient()
  return useMutation({
    mutationFn: async (game: NewCustomGame) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      const { data, error } = await supabase
        .from('custom_games')
        .insert({ ...game, coach_id: user.id })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['custom_games'] }),
  })
}

export function useDeleteCustomGame() {
  const queryClient = useQueryClient()
  const supabase = createClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('custom_games').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['custom_games'] }),
  })
}
