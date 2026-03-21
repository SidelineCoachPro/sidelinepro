import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useTeam } from '@/lib/teamContext'

export interface Player {
  id: string
  coach_id: string
  team_id: string | null
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
  const { activeTeamId } = useTeam()
  return useQuery({
    queryKey: ['players', activeTeamId ?? 'all'],
    queryFn: async () => {
      let q = supabase
        .from('players')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: true })
      if (activeTeamId) q = q.eq('team_id', activeTeamId)
      const { data, error } = await q
      if (error) throw error
      return data as Player[]
    },
  })
}

export function useCreatePlayer() {
  const qc = useQueryClient()
  const { activeTeamId } = useTeam()
  return useMutation({
    mutationFn: async (input: CreatePlayerInput) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      const { data, error } = await supabase
        .from('players')
        .insert({ ...input, coach_id: user.id, team_id: activeTeamId ?? null })
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
      const snapshot = qc.getQueriesData<Player[]>({ queryKey: ['players'] })
      qc.setQueriesData<Player[]>({ queryKey: ['players'] }, old =>
        old?.map(p => p.id === id ? { ...p, ...updates } : p) ?? []
      )
      return { snapshot }
    },
    onError: (_err, _vars, context) => {
      if (context?.snapshot) {
        for (const [key, data] of context.snapshot) {
          qc.setQueryData(key, data)
        }
      }
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
