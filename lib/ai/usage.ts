import { createClient } from '@/lib/supabase/server'

export type AIFeature = 'practice' | 'devplan' | 'suggest' | 'weekly_arc' | 'assessment' | 'eval_insights'

export async function trackAIUsage(feature: AIFeature): Promise<void> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const month = new Date().toISOString().slice(0, 7) // "YYYY-MM"

    await supabase.rpc('increment_ai_usage', {
      p_coach_id: user.id,
      p_feature: feature,
      p_month: month,
    })
  } catch {
    // Non-critical — don't fail the request if tracking fails
  }
}
