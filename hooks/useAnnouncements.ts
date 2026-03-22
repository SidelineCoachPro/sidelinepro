import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useTeam } from '@/lib/teamContext'

export interface Announcement {
  id: string
  team_id: string | null
  coach_id: string
  title: string
  body: string
  is_pinned: boolean
  created_at: string
  updated_at: string
}

const supabase = createClient()

export function useAnnouncements() {
  const { activeTeamId } = useTeam()
  return useQuery({
    queryKey: ['announcements', activeTeamId ?? 'all'],
    queryFn: async () => {
      let q = supabase
        .from('announcements')
        .select('*')
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false })
      if (activeTeamId) q = q.eq('team_id', activeTeamId)
      const { data, error } = await q
      if (error) throw error
      return data as Announcement[]
    },
  })
}

export function useCreateAnnouncement() {
  const qc = useQueryClient()
  const { activeTeamId } = useTeam()
  return useMutation({
    mutationFn: async (input: { title: string; body: string; is_pinned?: boolean }) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      const { data, error } = await supabase
        .from('announcements')
        .insert({ ...input, coach_id: user.id, team_id: activeTeamId ?? null })
        .select()
        .single()
      if (error) throw error
      return data as Announcement
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['announcements'] }),
  })
}

export function useUpdateAnnouncement() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; title?: string; body?: string; is_pinned?: boolean }) => {
      const { data, error } = await supabase
        .from('announcements')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data as Announcement
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['announcements'] }),
  })
}

export function useDeleteAnnouncement() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('announcements').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['announcements'] }),
  })
}
