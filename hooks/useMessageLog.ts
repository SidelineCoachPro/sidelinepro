import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

export interface MessageLog {
  id: string
  coach_id: string
  template_type: string
  subject: string
  body: string
  channels: string[]
  sent_at: string
}

const supabase = createClient()

export function useMessageLog() {
  return useQuery({
    queryKey: ['message_log'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('message_log')
        .select('*')
        .order('sent_at', { ascending: false })
        .limit(20)
      if (error) throw error
      return (data ?? []) as MessageLog[]
    },
  })
}

export function useLogMessage() {
  const qc = useQueryClient()
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
        .insert({ ...input, coach_id: user.id })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['message_log'] }),
  })
}
