import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// POST /api/parent/rsvp
export async function POST(req: NextRequest) {
  const { token, gameId, playerName, parentName, response, note } = await req.json()

  if (!token || !gameId || !playerName || !response) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const admin = createAdminClient()

  const { data: tokenRow } = await admin
    .from('team_tokens')
    .select('team_id, is_active')
    .eq('token', token)
    .maybeSingle()

  if (!tokenRow?.is_active) {
    return NextResponse.json({ error: 'Invalid or expired token' }, { status: 403 })
  }

  const { error } = await admin
    .from('game_rsvps')
    .upsert(
      {
        game_id: gameId,
        team_id: tokenRow.team_id,
        player_name: playerName.trim(),
        parent_name: (parentName ?? '').trim(),
        response,
        note: note?.trim() || null,
        token,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'game_id,token,player_name' },
    )
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Return updated counts for this game
  const { data: rsvps } = await admin
    .from('game_rsvps')
    .select('response')
    .eq('game_id', gameId)

  const counts = { yes: 0, no: 0, maybe: 0 }
  for (const r of rsvps ?? []) {
    counts[r.response as keyof typeof counts]++
  }

  return NextResponse.json({ success: true, counts })
}

// GET /api/parent/rsvp?gameId=xxx&token=yyy
// Returns full RSVP list (coach view)
export async function GET(req: NextRequest) {
  const gameId = req.nextUrl.searchParams.get('gameId')
  const token  = req.nextUrl.searchParams.get('token')

  if (!gameId || !token) {
    return NextResponse.json({ error: 'gameId and token required' }, { status: 400 })
  }

  const admin = createAdminClient()

  const { data: tokenRow } = await admin
    .from('team_tokens')
    .select('is_active')
    .eq('token', token)
    .maybeSingle()

  if (!tokenRow?.is_active) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 403 })
  }

  const { data: rsvps } = await admin
    .from('game_rsvps')
    .select('player_name, parent_name, response, note, updated_at')
    .eq('game_id', gameId)
    .order('updated_at', { ascending: false })

  return NextResponse.json({ rsvps: rsvps ?? [] })
}
