import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

export interface Game {
  id: string
  coach_id: string
  opponent: string
  location: string | null
  scheduled_at: string
  our_score: number | null
  opponent_score: number | null
  lineup_q1: (string | null)[]
  lineup_q2: (string | null)[]
  lineup_q3: (string | null)[]
  lineup_q4: (string | null)[]
  game_log: unknown[]
  notes: string | null
  created_at: string
}

export type CreateGameInput = {
  opponent: string
  location?: string | null
  scheduled_at: string
  notes?: string | null
}

export type UpdateGameInput = Partial<{
  opponent: string
  location: string | null
  scheduled_at: string
  our_score: number | null
  opponent_score: number | null
  lineup_q1: (string | null)[]
  lineup_q2: (string | null)[]
  lineup_q3: (string | null)[]
  lineup_q4: (string | null)[]
  notes: string | null
}>

const supabase = createClient()

function normalizeLineup(raw: unknown): (string | null)[] {
  if (!Array.isArray(raw)) return Array(5).fill(null)
  const result: (string | null)[] = Array(5).fill(null)
  raw.slice(0, 5).forEach((id, i) => { result[i] = typeof id === 'string' ? id : null })
  return result
}

function normalizeGame(row: unknown): Game {
  const r = row as Record<string, unknown>
  return {
    ...(r as unknown as Game),
    lineup_q1: normalizeLineup(r.lineup_q1),
    lineup_q2: normalizeLineup(r.lineup_q2),
    lineup_q3: normalizeLineup(r.lineup_q3),
    lineup_q4: normalizeLineup(r.lineup_q4),
    game_log: Array.isArray(r.game_log) ? (r.game_log as unknown[]) : [],
  }
}

export function useGames() {
  return useQuery({
    queryKey: ['games'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('games')
        .select('*')
        .order('scheduled_at', { ascending: true })
      if (error) throw error
      return (data ?? []).map(row => normalizeGame(row))
    },
  })
}

export function useGame(gameId: string) {
  return useQuery({
    queryKey: ['games', gameId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('games')
        .select('*')
        .eq('id', gameId)
        .single()
      if (error) throw error
      return normalizeGame(data)
    },
    enabled: !!gameId,
  })
}

export function useCreateGame() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: CreateGameInput) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      const { data, error } = await supabase
        .from('games')
        .insert({ ...input, coach_id: user.id })
        .select()
        .single()
      if (error) throw error
      return normalizeGame(data)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['games'] }),
  })
}

export function useUpdateGame() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & UpdateGameInput) => {
      const { data, error } = await supabase
        .from('games')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return normalizeGame(data)
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['games'] })
      qc.invalidateQueries({ queryKey: ['games', data.id] })
    },
  })
}

export function useDeleteGame() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('games').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['games'] }),
  })
}
