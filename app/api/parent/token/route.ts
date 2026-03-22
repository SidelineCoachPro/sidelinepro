import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

function appUrl(req: NextRequest) {
  const origin = req.headers.get('origin') ?? req.nextUrl.origin
  return origin
}

// GET /api/parent/token?teamId=xxx
// Returns (or creates) the active token for this team
export async function GET(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const teamId = req.nextUrl.searchParams.get('teamId')
  if (!teamId) return NextResponse.json({ error: 'teamId required' }, { status: 400 })

  const admin = createAdminClient()

  const { data: existing } = await admin
    .from('team_tokens')
    .select('*')
    .eq('team_id', teamId)
    .eq('coach_id', user.id)
    .eq('is_active', true)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({
      token: existing.token,
      url: `${appUrl(req)}/parent/${existing.token}`,
      isActive: existing.is_active,
      accessCount: existing.access_count,
    })
  }

  const { data: created, error } = await admin
    .from('team_tokens')
    .insert({ team_id: teamId, coach_id: user.id })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({
    token: created.token,
    url: `${appUrl(req)}/parent/${created.token}`,
    isActive: true,
    accessCount: 0,
  })
}

// POST /api/parent/token  body: { teamId }
// Deactivates current token, creates a fresh one
export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { teamId } = await req.json()
  if (!teamId) return NextResponse.json({ error: 'teamId required' }, { status: 400 })

  const admin = createAdminClient()

  await admin
    .from('team_tokens')
    .update({ is_active: false })
    .eq('team_id', teamId)
    .eq('coach_id', user.id)

  const { data: created, error } = await admin
    .from('team_tokens')
    .insert({ team_id: teamId, coach_id: user.id })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({
    token: created.token,
    url: `${appUrl(req)}/parent/${created.token}`,
    isActive: true,
    accessCount: 0,
  })
}
