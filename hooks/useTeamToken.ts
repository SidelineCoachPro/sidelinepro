import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export interface TeamTokenData {
  token: string
  url: string
  isActive: boolean
  accessCount: number
}

export function useTeamToken(teamId: string | null) {
  return useQuery({
    queryKey: ['team_token', teamId],
    enabled: !!teamId,
    queryFn: async (): Promise<TeamTokenData> => {
      const res = await fetch(`/api/parent/token?teamId=${teamId}`)
      if (!res.ok) throw new Error('Failed to load token')
      return res.json()
    },
    staleTime: 5 * 60 * 1000,
  })
}

export function useRegenerateToken() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (teamId: string): Promise<TeamTokenData> => {
      const res = await fetch('/api/parent/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamId }),
      })
      if (!res.ok) throw new Error('Failed to regenerate token')
      return res.json()
    },
    onSuccess: (_data, teamId) => {
      qc.invalidateQueries({ queryKey: ['team_token', teamId] })
    },
  })
}
