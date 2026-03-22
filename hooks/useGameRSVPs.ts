import { useQuery } from '@tanstack/react-query'

export interface GameRsvp {
  player_name: string
  parent_name: string | null
  response: 'yes' | 'no' | 'maybe'
  note: string | null
  updated_at: string
}

export function useGameRSVPs(gameId: string | null, token: string | null) {
  return useQuery({
    queryKey: ['game_rsvps', gameId, token],
    enabled: !!gameId && !!token,
    queryFn: async (): Promise<GameRsvp[]> => {
      const res = await fetch(`/api/parent/rsvp?gameId=${gameId}&token=${token}`)
      if (!res.ok) return []
      const data = await res.json()
      return data.rsvps ?? []
    },
    staleTime: 60 * 1000,
  })
}
