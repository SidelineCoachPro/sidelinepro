import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

export interface Player {
  id: string
  coach_id: string
  first_name: string
  last_name: string | null
  jersey_number: string | null
  position: string | null
  age: number | null
  is_active: boolean
  created_at: string
}

type CreatePlayerInput = {
  first_name: string
  last_name?: string | null
  jersey_number?: string | null
  position?: string | null
  age?: number | null
}

const supabase = createClient()

export function usePlayers() {
  return useQuery({
    queryKey: ['players'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('players')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: true })
      if (error) throw error
      return data as Player[]
    },
  })
}

export function useCreatePlayer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: CreatePlayerInput) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      const { data, error } = await supabase
        .from('players')
        .insert({ ...input, coach_id: user.id })
        .select()
        .single()
      if (error) throw error
      return data as Player
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['players'] }),
  })
}

export function useUpdatePlayer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Player> & { id: string }) => {
      const { data, error } = await supabase
        .from('players')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data as Player
    },
    onMutate: async ({ id, ...updates }) => {
      await qc.cancelQueries({ queryKey: ['players'] })
      const previous = qc.getQueryData<Player[]>(['players'])
      qc.setQueryData<Player[]>(['players'], old =>
        old?.map(p => p.id === id ? { ...p, ...updates } : p) ?? []
      )
      return { previous }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) qc.setQueryData(['players'], context.previous)
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['players'] }),
  })
}

export function useDeletePlayer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('players')
        .update({ is_active: false })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['players'] }),
  })
}
