import { createAdminClient } from '@/lib/supabase/admin'
import ParentClient from './ParentClient'

export const dynamic = 'force-dynamic'

interface Props {
  params: { token: string }
}

export default async function ParentPage({ params }: Props) {
  const { token } = params
  const admin = createAdminClient()

  // ── Validate token ──────────────────────────────────────────────────────────
  const { data: tokenRow } = await admin
    .from('team_tokens')
    .select('id, team_id, coach_id, is_active, access_count')
    .eq('token', token)
    .maybeSingle()

  if (!tokenRow) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-white">
        <div className="text-center max-w-sm">
          <div className="text-4xl mb-4">🔗</div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Link not found</h1>
          <p className="text-gray-500 text-sm">Ask your coach for a new parent link.</p>
        </div>
      </div>
    )
  }

  if (!tokenRow.is_active) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-white">
        <div className="text-center max-w-sm">
          <div className="text-4xl mb-4">🔒</div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">This link is no longer valid</h1>
          <p className="text-gray-500 text-sm">Ask your coach for a new link.</p>
        </div>
      </div>
    )
  }

  // ── Update access stats (fire and forget) ───────────────────────────────────
  admin
    .from('team_tokens')
    .update({
      last_accessed_at: new Date().toISOString(),
      access_count: tokenRow.access_count + 1,
    })
    .eq('id', tokenRow.id)
    .then(() => {})

  const teamId   = tokenRow.team_id
  const coachId  = tokenRow.coach_id

  // ── Fetch data in parallel ──────────────────────────────────────────────────
  const todayISO = new Date().toISOString()
  const twoWeeksISO = new Date(Date.now() + 14 * 86400000).toISOString()
  const todayDate = todayISO.split('T')[0]

  const [teamRes, coachRes, upcomingGamesRes, pastGamesRes, practicesRes, announcementsRes, playersRes] =
    await Promise.all([
      admin.from('teams').select('id, name, emoji, color, season_year').eq('id', teamId).single(),
      admin.from('coaches').select('full_name, display_name, avatar_url').eq('id', coachId).single(),
      admin
        .from('games')
        .select('id, opponent, location, scheduled_at, our_score, opponent_score, notes')
        .eq('team_id', teamId)
        .gte('scheduled_at', todayISO)
        .order('scheduled_at', { ascending: true })
        .limit(10),
      admin
        .from('games')
        .select('id, opponent, location, scheduled_at, our_score, opponent_score, notes')
        .eq('team_id', teamId)
        .lt('scheduled_at', todayISO)
        .order('scheduled_at', { ascending: false })
        .limit(15),
      admin
        .from('practice_plans')
        .select('id, name, scheduled_date, duration_mins, focus_areas')
        .eq('team_id', teamId)
        .gte('scheduled_date', todayDate)
        .lte('scheduled_date', twoWeeksISO.split('T')[0])
        .order('scheduled_date', { ascending: true })
        .limit(5),
      admin
        .from('announcements')
        .select('id, title, body, is_pinned, created_at')
        .eq('team_id', teamId)
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false }),
      admin
        .from('players')
        .select('id, first_name, last_name')
        .eq('team_id', teamId)
        .order('first_name', { ascending: true }),
    ])

  // ── RSVP counts for upcoming games ─────────────────────────────────────────
  const upcomingGameIds = (upcomingGamesRes.data ?? []).map(g => g.id)
  const rsvpCounts: Record<string, { yes: number; no: number; maybe: number }> = {}
  if (upcomingGameIds.length > 0) {
    const { data: rsvps } = await admin
      .from('game_rsvps')
      .select('game_id, response')
      .in('game_id', upcomingGameIds)
    for (const r of rsvps ?? []) {
      if (!rsvpCounts[r.game_id]) rsvpCounts[r.game_id] = { yes: 0, no: 0, maybe: 0 }
      rsvpCounts[r.game_id][r.response as 'yes' | 'no' | 'maybe']++
    }
  }

  // ── My RSVP (will be loaded client-side from localStorage) ─────────────────

  return (
    <ParentClient
      token={token}
      team={teamRes.data!}
      coach={coachRes.data ?? null}
      upcomingGames={upcomingGamesRes.data ?? []}
      pastGames={pastGamesRes.data ?? []}
      practices={practicesRes.data ?? []}
      announcements={announcementsRes.data ?? []}
      rsvpCounts={rsvpCounts}
      players={(playersRes.data ?? []).map(p => ({ id: p.id, name: `${p.first_name} ${p.last_name ?? ''}`.trim() }))}
    />
  )
}
