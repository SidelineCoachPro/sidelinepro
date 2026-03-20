import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

export interface ParentContact {
  id: string
  player_id: string
  coach_id: string
  first_name: string
  last_name: string
  relationship: string
  phone: string | null
  email: string | null
  is_primary: boolean
  created_at: string
}

const supabase = createClient()

export function useParentContacts(playerId?: string) {
  return useQuery({
    queryKey: ['parent_contacts', playerId ?? 'all'],
    queryFn: async () => {
      let q = supabase
        .from('parent_contacts')
        .select('*')
        .order('is_primary', { ascending: false })
        .order('created_at')
      if (playerId) q = q.eq('player_id', playerId)
      const { data, error } = await q
      if (error) throw error
      return (data ?? []) as ParentContact[]
    },
  })
}

export function useCreateParentContact() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: Omit<ParentContact, 'id' | 'coach_id' | 'created_at'>) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      if (input.is_primary) {
        await supabase.from('parent_contacts').update({ is_primary: false }).eq('player_id', input.player_id)
      }
      const { data, error } = await supabase
        .from('parent_contacts')
        .insert({ ...input, coach_id: user.id })
        .select()
        .single()
      if (error) throw error
      return data as ParentContact
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['parent_contacts'] }),
  })
}

export function useUpdateParentContact() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, player_id, ...updates }: Partial<ParentContact> & { id: string; player_id: string }) => {
      if (updates.is_primary) {
        await supabase.from('parent_contacts').update({ is_primary: false }).eq('player_id', player_id)
      }
      const { data, error } = await supabase
        .from('parent_contacts')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data as ParentContact
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['parent_contacts'] }),
  })
}

export function useDeleteParentContact() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('parent_contacts').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['parent_contacts'] }),
  })
}
