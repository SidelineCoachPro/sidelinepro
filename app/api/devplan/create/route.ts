import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  try {
    // Auth check — get the current user
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { playerId, content, planName, createdBy, focusSkill } = await req.json()
    if (!playerId || !content) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Use admin client to bypass RLS for the deactivation step
    const admin = createAdminClient()

    // Deactivate any existing active plan for this player (bypasses RLS)
    await admin
      .from('dev_plans')
      .update({
        is_active: false,
        archived_at: new Date().toISOString(),
        archive_note: 'Replaced by new plan',
      })
      .eq('player_id', playerId)
      .eq('is_active', true)

    // Insert new plan
    const { data, error } = await admin
      .from('dev_plans')
      .insert({
        player_id: playerId,
        coach_id: user.id,
        version: 1,
        is_active: true,
        content,
        plan_name: planName ?? 'Development Plan',
        created_by: createdBy ?? 'ai',
        focus_skill: focusSkill ?? 'general',
        last_edited_at: new Date().toISOString(),
        edit_count: 0,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ plan: data })
  } catch (err) {
    console.error('Create dev plan error:', err)
    return NextResponse.json({ error: 'Failed to create plan' }, { status: 500 })
  }
}
