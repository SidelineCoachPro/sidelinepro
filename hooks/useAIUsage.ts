import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

export interface AIUsageRow {
  feature: string
  month: string
  count: number
}

export interface AIUsageSummary {
  total: number
  thisMonth: number
  byFeature: Record<string, number>
  history: AIUsageRow[]
}

export function useAIUsage() {
  const supabase = createClient()
  return useQuery({
    queryKey: ['ai_usage'],
    queryFn: async (): Promise<AIUsageSummary> => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return { total: 0, thisMonth: 0, byFeature: {}, history: [] }

      const { data, error } = await supabase
        .from('ai_usage')
        .select('feature, month, count')
        .eq('coach_id', user.id)
        .order('month', { ascending: false })

      if (error || !data) return { total: 0, thisMonth: 0, byFeature: {}, history: [] }

      const currentMonth = new Date().toISOString().slice(0, 7)
      const rows = data as AIUsageRow[]

      const total = rows.reduce((s, r) => s + r.count, 0)
      const thisMonth = rows
        .filter(r => r.month === currentMonth)
        .reduce((s, r) => s + r.count, 0)

      const byFeature: Record<string, number> = {}
      for (const r of rows) {
        byFeature[r.feature] = (byFeature[r.feature] ?? 0) + r.count
      }

      return { total, thisMonth, byFeature, history: rows }
    },
  })
}
