import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useTeam } from '@/lib/teamContext'

export interface MessageLog {
  id: string
  coach_id: string
  team_id: string | null
  template_type: string
  subject: string
  body: string
  channels: string[]
  sent_at: string
}

const supabase = createClient()

export function useMessageLog() {
  const { activeTeamId } = useTeam()
  return useQuery({
    queryKey: ['message_log', activeTeamId ?? 'all'],
    queryFn: async () => {
      let q = supabase
        .from('message_log')
        .select('*')
        .order('sent_at', { ascending: false })
        .limit(20)
      if (activeTeamId) q = q.eq('team_id', activeTeamId)
      const { data, error } = await q
      if (error) throw error
      return (data ?? []) as MessageLog[]
    },
  })
}

export function useLogMessage() {
  const qc = useQueryClient()
  const { activeTeamId } = useTeam()
  return useMutation({
    mutationFn: async (input: {
      template_type: string
      subject: string
      body: string
      channels: string[]
    }) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      const { error } = await supabase
        .from('message_log')
        .insert({ ...input, coach_id: user.id, team_id: activeTeamId ?? null })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['message_log'] }),
  })
}
