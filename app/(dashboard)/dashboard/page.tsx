'use client'

import { useMemo, useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Barlow_Condensed } from 'next/font/google'
import { createClient } from '@/lib/supabase/client'
import { usePlayers, type Player } from '@/hooks/usePlayers'
import { useGames, type Game } from '@/hooks/useGames'
import { useEvaluations, type Evaluation } from '@/hooks/useEvaluations'
import { usePracticePlans, type PracticePlan } from '@/hooks/usePracticePlans'
import { useTeam } from '@/lib/teamContext'
import { useTeams } from '@/hooks/useTeams'
import { useProfile } from '@/hooks/useProfile'

const barlow = Barlow_Condensed({ subsets: ['latin'], weight: '900' })
const supabase = createClient()

const PLAYER_COLORS = ['#3A86FF','#F7620A','#0ECFB0','#8B5CF6','#F5B731','#E879F9','#22C55E','#38BDF8','#FB923C','#A78BFA']

// ── Helpers ────────────────────────────────────────────────────────────────────

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

function formatDateShort(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function daysUntil(iso: string) {
  return Math.ceil((new Date(iso).setHours(0,0,0,0) - new Date().setHours(0,0,0,0)) / 86400000)
}

function formatRelative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${Math.max(0, mins)}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days}d ago`
  return formatDateShort(iso)
}

function initials(p: Player) {
  return `${p.first_name[0]}${(p.last_name ?? '')[0] ?? ''}`.toUpperCase()
}

function getGreeting(firstName: string) {
  const h = new Date().getHours()
  const name = firstName || 'Coach'
  if (h < 12) return `Good morning, ${name}.`
  if (h < 17) return `Good afternoon, ${name}.`
  return `Good evening, ${name}.`
}

// ── Skeleton ───────────────────────────────────────────────────────────────────

function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`rounded animate-pulse ${className}`}
      style={{ backgroundColor: '#141E2D' }}
    />
  )
}

// ── Card wrapper with left accent bar ─────────────────────────────────────────

function AccentCard({ accent, children }: { accent: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: '#0E1520', border: '1px solid rgba(241,245,249,0.07)' }}>
      <div className="flex h-full">
        <div className="w-1 flex-shrink-0" style={{ backgroundColor: accent }} />
        <div className="flex-1 p-4 min-w-0">{children}</div>
      </div>
    </div>
  )
}

// ── Section label ─────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'rgba(241,245,249,0.35)' }}>
      {children}
    </p>
  )
}

// ── Attention players helper ───────────────────────────────────────────────────

function ProfileNudge() {
  const [dismissed, setDismissed] = useState(false)
  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('sp_profile_nudge_dismissed')) setDismissed(true)
  }, [])
  if (dismissed) return null
  return (
    <div
      className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl mb-5"
      style={{ backgroundColor: '#0E1520', border: '1px solid rgba(241,245,249,0.08)' }}
    >
      <div className="flex items-center gap-3">
        <span className="text-xl">👤</span>
        <div>
          <p className="text-sm font-semibold text-sp-text">Complete your profile</p>
          <p className="text-xs" style={{ color: 'rgba(241,245,249,0.4)' }}>Add your name and photo — they appear in PDFs you share with parents.</p>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <a href="/settings/profile" className="text-xs font-semibold px-3 py-1.5 rounded-lg" style={{ backgroundColor: 'rgba(247,98,10,0.15)', color: '#F7620A', border: '1px solid rgba(247,98,10,0.3)' }}>
          Set Up Profile →
        </a>
        <button
          onClick={() => { localStorage.setItem('sp_profile_nudge_dismissed', '1'); setDismissed(true) }}
          className="text-xs hover:opacity-60 transition-opacity"
          style={{ color: 'rgba(241,245,249,0.3)' }}
        >
          ✕
        </button>
      </div>
    </div>
  )
}

function computeAttentionPlayers(players: Player[], evals: Evaluation[], limit = 3) {
  const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000
  const now = Date.now()
  const latestEval = new Map<string, Evaluation>()
  for (const e of evals) {
    const cur = latestEval.get(e.player_id)
    if (!cur || new Date(e.evaluated_at) > new Date(cur.evaluated_at)) latestEval.set(e.player_id, e)
  }
  const seen = new Set<string>()
  const result: Array<{ player: Player; badge: string; badgeColor: string }> = []
  for (const p of players) {
    const ev = latestEval.get(p.id)
    if (!ev) { result.push({ player: p, badge: 'No eval yet', badgeColor: '#6B7280' }); seen.add(p.id) }
    else if (now - new Date(ev.evaluated_at).getTime() > THIRTY_DAYS) {
      result.push({ player: p, badge: `${Math.floor((now - new Date(ev.evaluated_at).getTime()) / 86400000)}d ago`, badgeColor: '#F5B731' })
      seen.add(p.id)
    }
  }
  for (const p of players) {
    if (seen.has(p.id)) continue
    const ev = latestEval.get(p.id)
    if (ev?.grade?.startsWith('D')) result.push({ player: p, badge: `${ev.grade} · ${ev.overall_avg?.toFixed(1)}`, badgeColor: '#EF4444' })
  }
  return result.slice(0, limit)
}

// ── Team summary card (All Teams view) ────────────────────────────────────────

interface TeamSection {
  team: import('@/hooks/useTeams').Team
  players: Player[]
  plans: PracticePlan[]
  nextGame: Game | null
  nextPractice: PracticePlan | null
  attentionPlayers: Array<{ player: Player; badge: string; badgeColor: string }>
  record: string
}

function TeamSummaryCard({ section, onSwitch }: { section: TeamSection; onSwitch: () => void }) {
  const { team, players, plans, nextGame, nextPractice, attentionPlayers, record } = section
  const hasContent = nextGame || nextPractice || attentionPlayers.length > 0

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ backgroundColor: '#0E1520', border: '1px solid rgba(241,245,249,0.07)', borderLeft: `3px solid ${team.color}` }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid rgba(241,245,249,0.05)' }}>
        <div className="flex items-center gap-2.5 min-w-0">
          <span style={{ fontSize: 22, flexShrink: 0 }}>{team.emoji}</span>
          <div className="min-w-0">
            <p className="text-sm font-bold text-sp-text leading-tight">{team.name}</p>
            <p className="text-xs leading-tight mt-0.5" style={{ color: 'rgba(241,245,249,0.35)' }}>
              {[team.team_type, team.age_group, team.season_year].filter(Boolean).join(' · ')}
            </p>
          </div>
        </div>
        <button
          onClick={onSwitch}
          className="text-xs font-bold px-2.5 py-1.5 rounded-lg flex-shrink-0 ml-2"
          style={{ backgroundColor: `${team.color}15`, color: team.color, border: `1px solid ${team.color}30` }}
        >
          View →
        </button>
      </div>

      {/* Mini stats */}
      <div className="grid grid-cols-3" style={{ borderBottom: '1px solid rgba(241,245,249,0.05)' }}>
        {[
          { value: players.length, label: 'Players' },
          { value: record, label: 'Record' },
          { value: plans.length, label: 'Practices' },
        ].map((s, i) => (
          <div key={s.label} className="py-2.5 text-center" style={i < 2 ? { borderRight: '1px solid rgba(241,245,249,0.05)' } : undefined}>
            <p className="text-base font-bold text-sp-text">{s.value}</p>
            <p className="text-xs" style={{ color: 'rgba(241,245,249,0.35)' }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Upcoming */}
      {(nextGame || nextPractice) && (
        <div className="px-4 py-3 space-y-1.5" style={{ borderBottom: attentionPlayers.length > 0 ? '1px solid rgba(241,245,249,0.05)' : 'none' }}>
          {nextGame && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold w-14 flex-shrink-0" style={{ color: '#F7620A' }}>Game</span>
              <span className="text-xs text-sp-text truncate flex-1">vs {nextGame.opponent}</span>
              <span className="text-xs flex-shrink-0" style={{ color: 'rgba(241,245,249,0.35)' }}>{formatDateShort(nextGame.scheduled_at)}</span>
            </div>
          )}
          {nextPractice && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold w-14 flex-shrink-0" style={{ color: '#0ECFB0' }}>Practice</span>
              <span className="text-xs text-sp-text truncate flex-1">{nextPractice.name}</span>
              {nextPractice.scheduled_date && (
                <span className="text-xs flex-shrink-0" style={{ color: 'rgba(241,245,249,0.35)' }}>
                  {new Date(nextPractice.scheduled_date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Players to watch */}
      {attentionPlayers.length > 0 && (
        <div className="px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'rgba(241,245,249,0.25)' }}>Players to Watch</p>
          <div className="space-y-2">
            {attentionPlayers.map(({ player, badge, badgeColor }, idx) => (
              <div key={player.id} className="flex items-center gap-2">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                  style={{ backgroundColor: `${PLAYER_COLORS[idx % PLAYER_COLORS.length]}22`, color: PLAYER_COLORS[idx % PLAYER_COLORS.length] }}
                >
                  {initials(player)}
                </div>
                <span className="text-xs text-sp-text flex-1 truncate">{player.first_name} {player.last_name ?? ''}</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded flex-shrink-0" style={{ backgroundColor: `${badgeColor}18`, color: badgeColor }}>{badge}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {!hasContent && (
        <div className="px-4 py-4">
          <p className="text-xs" style={{ color: 'rgba(241,245,249,0.3)' }}>No data for this team yet</p>
        </div>
      )}
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const router = useRouter()

  const { activeTeamId, setActiveTeamId } = useTeam()
  const { data: teams = [] } = useTeams()
  const activeTeam = teams.find(t => t.id === activeTeamId) ?? null
  const { data: profile } = useProfile()

  // Auth user (for first name)
  const { data: authUser } = useQuery({
    queryKey: ['auth_user'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      return user
    },
    staleTime: 5 * 60 * 1000,
  })

  // Core data
  const { data: players = [], isLoading: lPlayers } = usePlayers()
  const { data: games = [], isLoading: lGames } = useGames()
  const { data: plans = [], isLoading: lPlans } = usePracticePlans()
  const { data: evals = [], isLoading: lEvals } = useEvaluations()

  // Activity extras — dev_plans + message_log (gracefully ignores missing tables)
  const { data: extras } = useQuery({
    queryKey: ['activity_extras'],
    queryFn: async () => {
      const [dpRes, mlRes] = await Promise.all([
        supabase.from('dev_plans').select('id, created_at, player_id').order('created_at', { ascending: false }).limit(20),
        supabase.from('message_log').select('id, sent_at, subject').order('sent_at', { ascending: false }).limit(20),
      ])
      return {
        devPlans:    (dpRes.data ?? []) as { id: string; created_at: string; player_id: string }[],
        messageLogs: (mlRes.data ?? []) as { id: string; sent_at: string; subject: string }[],
      }
    },
    staleTime: 2 * 60 * 1000,
  })

  // ── Derived values ─────────────────────────────────────────────────────────

  const firstName = useMemo(() => {
    if (profile?.displayName) return profile.displayName
    if (profile?.fullName) return profile.fullName.split(' ')[0]
    const full = authUser?.user_metadata?.full_name as string | undefined
    return full?.split(' ')[0] ?? ''
  }, [profile, authUser])

  const today = useMemo(() => new Date(), [])

  const todayGame = useMemo(() =>
    games.find(g => isSameDay(new Date(g.scheduled_at), today)) ?? null
  , [games, today])

  const nextGame = useMemo(() => {
    return games.find(g => {
      const d = new Date(g.scheduled_at)
      return d >= today || isSameDay(d, today)
    }) ?? null
  }, [games, today])

  const recentPlan = useMemo(() =>
    [...plans].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())[0] ?? null
  , [plans])

  const nextPractice = useMemo(() => {
    const todayISO = new Date().toISOString().split('T')[0]
    return plans
      .filter(p => p.scheduled_date && p.scheduled_date >= todayISO)
      .sort((a, b) => a.scheduled_date!.localeCompare(b.scheduled_date!))
      [0] ?? null
  }, [plans])

  // Players needing attention (no eval / stale eval / grade D)
  const attentionPlayers = useMemo(() => computeAttentionPlayers(players, evals), [players, evals])

  // Per-team sections for All Teams view
  const teamSections = useMemo((): TeamSection[] => {
    if (activeTeamId || teams.length === 0) return []
    const todayISO = new Date().toISOString().split('T')[0]
    return teams.map(team => {
      const teamPlayers = players.filter(p => p.team_id === team.id)
      const teamGames   = games.filter(g => g.team_id === team.id)
      const teamPlans   = plans.filter(p => p.team_id === team.id)
      const teamEvals   = evals.filter(e => e.team_id === team.id)
      const scored      = teamGames.filter(g => g.our_score !== null && g.opponent_score !== null)
      const wins        = scored.filter(g => (g.our_score ?? 0) > (g.opponent_score ?? 0)).length
      const losses      = scored.filter(g => (g.our_score ?? 0) < (g.opponent_score ?? 0)).length
      const nextGame    = teamGames.find(g => {
        const d = new Date(g.scheduled_at)
        return d >= today || isSameDay(d, today)
      }) ?? null
      const nextPractice = teamPlans
        .filter(p => p.scheduled_date && p.scheduled_date >= todayISO)
        .sort((a, b) => a.scheduled_date!.localeCompare(b.scheduled_date!))[0] ?? null
      return {
        team,
        players:          teamPlayers,
        plans:            teamPlans,
        nextGame,
        nextPractice,
        attentionPlayers: computeAttentionPlayers(teamPlayers, teamEvals),
        record:           scored.length > 0 ? `${wins}-${losses}` : '—',
      }
    })
  }, [activeTeamId, teams, players, games, plans, evals, today])

  // Season stats
  const stats = useMemo(() => {
    const scored = games.filter(g => g.our_score !== null && g.opponent_score !== null)
    const wins   = scored.filter(g => (g.our_score ?? 0) > (g.opponent_score ?? 0)).length
    const losses = scored.filter(g => (g.our_score ?? 0) < (g.opponent_score ?? 0)).length
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
    const monthMins  = plans
      .filter(p => new Date(p.created_at) >= monthStart)
      .reduce((s, p) => s + p.duration_mins, 0)
    return {
      players:       players.length,
      record:        scored.length > 0 ? `${wins}-${losses}` : '0-0',
      practices:     plans.length,
      monthHours:    (monthMins / 60).toFixed(1),
    }
  }, [players, games, plans, today])

  // Recent activity feed
  const activityFeed = useMemo(() => {
    const playerMap = new Map(players.map(p => [p.id, p]))
    const items: Array<{ icon: string; text: string; ts: string }> = [
      ...plans.map(p => ({ icon: '📋', text: `Practice plan saved — ${p.name}`, ts: p.updated_at })),
      ...evals.map(e => {
        const p = playerMap.get(e.player_id)
        return { icon: '📊', text: `Player evaluated — ${p ? `${p.first_name} ${p.last_name ?? ''}`.trim() : 'Unknown'}`, ts: e.evaluated_at }
      }),
      ...games.map(g => ({ icon: '🏀', text: `Game added — vs ${g.opponent}`, ts: g.created_at })),
      ...(extras?.devPlans ?? []).map(d => {
        const p = playerMap.get(d.player_id)
        return { icon: '✨', text: `Dev plan generated — ${p ? p.first_name : 'Player'}`, ts: d.created_at }
      }),
      ...(extras?.messageLogs ?? []).map(m => ({ icon: '📣', text: `Message sent — ${m.subject}`, ts: m.sent_at })),
    ]
    return items
      .sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime())
      .slice(0, 8)
  }, [plans, evals, games, extras, players])

  const isLoading = lPlayers || lGames || lPlans || lEvals
  const isEmpty   = !isLoading && players.length === 0 && games.length === 0 && plans.length === 0

  const greeting  = getGreeting(firstName)
  const subtitle  = todayGame
    ? `You have a game today vs ${todayGame.opponent}. Tip-off at ${formatTime(todayGame.scheduled_at)}.`
    : recentPlan
      ? `Practice day. Your last plan was ${recentPlan.name}.`
      : 'No games or practice today. Good day to plan ahead.'

  function openCommsPanel() {
    window.dispatchEvent(new CustomEvent('openCommsPanel'))
  }

  const AVATAR_COLORS = ['#3A86FF','#F7620A','#0ECFB0','#8B5CF6','#F5B731','#E879F9','#22C55E','#EF4444']
  function avatarColor(id: string) { let h = 0; for (const c of id) h = (h * 31 + c.charCodeAt(0)) & 0xffffffff; return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length] }
  const accentColor = avatarColor(profile?.id ?? '')
  const showNudge = profile && !profile.displayName && !profile.avatarUrl

  return (
    <div>
      {/* ── Profile nudge ── */}
      {showNudge && <ProfileNudge />}

      {/* ── Greeting ── */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          {profile?.avatarUrl ? (
            <img src={profile.avatarUrl} alt="" className="rounded-full object-cover flex-shrink-0" style={{ width: 40, height: 40 }} />
          ) : (
            <div className="rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0" style={{ width: 40, height: 40, backgroundColor: accentColor }}>
              {(profile?.email?.[0] ?? '?').toUpperCase()}
            </div>
          )}
          <h1
            className={`${barlow.className} text-sp-text`}
            style={{ fontSize: 'clamp(22px, 6vw, 36px)', fontWeight: 900, lineHeight: 1.15 }}
          >
            {greeting}
          </h1>
        </div>
        {activeTeam ? (
          <div className="flex items-center gap-1.5 mt-1">
            <span style={{ fontSize: 16 }}>{activeTeam.emoji}</span>
            <span className="text-sm font-semibold" style={{ color: activeTeam.color }}>{activeTeam.name}</span>
            {activeTeam.age_group && (
              <span className="text-sm" style={{ color: 'rgba(241,245,249,0.3)' }}>· {activeTeam.age_group}</span>
            )}
            {activeTeam.season_year && (
              <span className="text-sm" style={{ color: 'rgba(241,245,249,0.3)' }}>· {activeTeam.season_year}</span>
            )}
          </div>
        ) : (
          <p className="mt-1" style={{ fontSize: 15, color: 'rgba(241,245,249,0.5)' }}>
            {subtitle}
          </p>
        )}
        {activeTeam && (
          <p className="mt-1" style={{ fontSize: 15, color: 'rgba(241,245,249,0.5)' }}>
            {subtitle}
          </p>
        )}
      </div>

      {/* ── Team Tab Bar ── */}
      {teams.length >= 1 && (
        <div
          className="flex items-center gap-2 mb-6 overflow-x-auto"
          style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' } as React.CSSProperties}
        >
          {teams.length >= 2 && (
            <button
              onClick={() => setActiveTeamId(null)}
              className="flex items-center px-3 py-2 rounded-xl text-sm font-semibold transition-all flex-shrink-0"
              style={{
                backgroundColor: !activeTeamId ? 'rgba(241,245,249,0.1)' : 'rgba(241,245,249,0.04)',
                color: !activeTeamId ? 'rgba(241,245,249,0.85)' : 'rgba(241,245,249,0.4)',
                border: !activeTeamId ? '1px solid rgba(241,245,249,0.2)' : '1px solid rgba(241,245,249,0.08)',
              }}
            >
              All Teams
            </button>
          )}
          {teams.map(team => (
            <button
              key={team.id}
              onClick={() => setActiveTeamId(team.id)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all flex-shrink-0"
              style={{
                backgroundColor: activeTeamId === team.id ? `${team.color}18` : 'rgba(241,245,249,0.04)',
                color: activeTeamId === team.id ? team.color : 'rgba(241,245,249,0.4)',
                border: activeTeamId === team.id ? `1px solid ${team.color}40` : '1px solid rgba(241,245,249,0.08)',
              }}
            >
              <span style={{ fontSize: 15 }}>{team.emoji}</span>
              <span>{team.name}</span>
            </button>
          ))}
        </div>
      )}

      {/* ── All Teams view ── */}
      {!activeTeamId && teamSections.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {teamSections.map(section => (
            <TeamSummaryCard
              key={section.team.id}
              section={section}
              onSwitch={() => setActiveTeamId(section.team.id)}
            />
          ))}
        </div>
      )}

      {/* ── Season Stats + detail (single-team view) ── */}
      {(activeTeamId || teamSections.length === 0) && (<>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {isLoading
          ? [1,2,3,4].map(i => (
              <div key={i} className="rounded-2xl p-4 animate-pulse" style={{ backgroundColor: '#0E1520', height: 80 }} />
            ))
          : ([
              { value: stats.players,    label: 'Players' },
              { value: stats.record,     label: 'Record' },
              { value: stats.practices,  label: 'Practices' },
              { value: `${stats.monthHours}h`, label: 'This month' },
            ] as const).map(s => (
              <div key={s.label} className="rounded-2xl p-4" style={{ backgroundColor: '#0E1520', border: '1px solid rgba(241,245,249,0.07)' }}>
                <p className={`${barlow.className} text-sp-orange`} style={{ fontSize: 36, lineHeight: 1 }}>{s.value}</p>
                <p className="text-xs font-semibold uppercase tracking-wide mt-1" style={{ color: 'rgba(241,245,249,0.35)' }}>{s.label}</p>
              </div>
            ))
        }
      </div>

      {/* ── Empty state ── */}
      {isEmpty ? (
        <div className="rounded-2xl p-6 sm:p-8 max-w-lg" style={{ backgroundColor: '#0E1520', border: '1px solid rgba(241,245,249,0.1)' }}>
          <p className="text-xl font-bold text-sp-text mb-1">Welcome to SidelinePro 🏀</p>
          <p className="text-sm mb-6" style={{ color: 'rgba(241,245,249,0.5)' }}>
            Let&apos;s get your program set up. Three steps to your first practice:
          </p>
          <div className="space-y-4">
            {[
              { num: '①', label: 'Add your players',          href: '/players',         cta: 'Add Players' },
              { num: '②', label: 'Build a practice plan',      href: '/practice/build/new', cta: 'Create Plan' },
              { num: '③', label: 'Schedule your first game',   href: '/game',            cta: 'Add Game' },
            ].map(step => (
              <div key={step.num} className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span style={{ color: '#F7620A', fontSize: 18 }}>{step.num}</span>
                  <span className="text-sm font-medium" style={{ color: 'rgba(241,245,249,0.75)' }}>{step.label}</span>
                </div>
                <Link
                  href={step.href}
                  className="text-xs font-bold px-3 py-1.5 rounded-lg transition-opacity hover:opacity-80 flex-shrink-0"
                  style={{ backgroundColor: 'rgba(247,98,10,0.12)', color: '#F7620A', border: '1px solid rgba(247,98,10,0.25)' }}
                >
                  → {step.cta}
                </Link>
              </div>
            ))}
          </div>
          <p className="text-xs mt-6" style={{ color: 'rgba(241,245,249,0.3)' }}>Takes less than 5 minutes.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* ── Left column ── */}
          <div className="lg:col-span-2 space-y-4">

            {/* Game Day Banner */}
            {todayGame && (
              <div className="rounded-2xl p-5" style={{ backgroundColor: 'rgba(247,98,10,0.08)', border: '1px solid rgba(247,98,10,0.28)' }}>
                <div className="flex items-center gap-2 mb-2">
                  <span style={{ fontSize: 20 }}>🏀</span>
                  <p className={`${barlow.className}`} style={{ fontSize: 15, fontWeight: 900, color: '#F7620A', letterSpacing: '0.1em' }}>
                    GAME DAY
                  </p>
                </div>
                <p className="text-sm font-medium mb-4">
                  <span className="font-bold text-sp-text">vs {todayGame.opponent}</span>
                  <span style={{ color: 'rgba(241,245,249,0.5)' }}>
                    {' · '}{formatTime(todayGame.scheduled_at)}
                    {todayGame.location ? ` · ${todayGame.location}` : ''}
                  </span>
                </p>
                <div className="flex gap-2">
                  <Link
                    href={`/game/${todayGame.id}/lineup`}
                    className="flex-1 py-2.5 text-center text-sm font-bold rounded-xl transition-opacity hover:opacity-80"
                    style={{ backgroundColor: 'rgba(56,189,248,0.12)', color: '#38BDF8', border: '1px solid rgba(56,189,248,0.25)' }}
                  >
                    View Lineup
                  </Link>
                  <Link
                    href={`/game/${todayGame.id}/track`}
                    className="flex-1 py-2.5 text-center text-sm font-bold rounded-xl transition-opacity hover:opacity-80"
                    style={{ backgroundColor: '#F7620A', color: '#fff' }}
                  >
                    Track Game →
                  </Link>
                </div>
              </div>
            )}

            {/* Next Game */}
            <AccentCard accent="#F7620A">
              <SectionLabel>Next Game</SectionLabel>
              {lGames ? (
                <div className="space-y-2"><Skeleton className="h-5 w-1/2" /><Skeleton className="h-4 w-1/3" /></div>
              ) : nextGame ? (
                <>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <p className="text-base font-bold text-sp-text">vs {nextGame.opponent}</p>
                      <p className="text-xs mt-0.5" style={{ color: 'rgba(241,245,249,0.45)' }}>
                        {formatDateShort(nextGame.scheduled_at)} · {formatTime(nextGame.scheduled_at)}
                        {nextGame.location ? ` · ${nextGame.location}` : ''}
                      </p>
                    </div>
                    {(() => {
                      const d = daysUntil(nextGame.scheduled_at)
                      return (
                        <span className="text-xs font-bold px-2.5 py-1 rounded-lg flex-shrink-0" style={{ backgroundColor: 'rgba(247,98,10,0.1)', color: '#F7620A', border: '1px solid rgba(247,98,10,0.2)' }}>
                          {d === 0 ? 'Today' : d === 1 ? 'Tomorrow' : `${d} days`}
                        </span>
                      )
                    })()}
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/game/${nextGame.id}/lineup`} className="flex-1 py-2 text-center text-xs font-bold rounded-lg" style={{ backgroundColor: 'rgba(56,189,248,0.1)', color: '#38BDF8', border: '1px solid rgba(56,189,248,0.2)' }}>
                      Set Lineup
                    </Link>
                    <button onClick={openCommsPanel} className="flex-1 py-2 text-xs font-bold rounded-lg" style={{ backgroundColor: 'rgba(247,98,10,0.08)', color: '#F7620A', border: '1px solid rgba(247,98,10,0.18)' }}>
                      Message Parents
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-sm mb-2" style={{ color: 'rgba(241,245,249,0.4)' }}>No games scheduled yet</p>
                  <Link href="/game" className="text-sm font-semibold" style={{ color: '#F7620A' }}>+ Add Game →</Link>
                </>
              )}
            </AccentCard>

            {/* Next Practice */}
            <AccentCard accent="#0ECFB0">
              <SectionLabel>Next Practice</SectionLabel>
              {lPlans ? (
                <div className="space-y-2"><Skeleton className="h-5 w-1/2" /><Skeleton className="h-4 w-1/3" /></div>
              ) : nextPractice ? (
                <>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <p className="text-base font-bold text-sp-text">{nextPractice.name}</p>
                    {(() => {
                      const d = daysUntil(nextPractice.scheduled_date! + 'T12:00:00')
                      return (
                        <span className="text-xs font-bold px-2.5 py-1 rounded-lg flex-shrink-0" style={{ backgroundColor: 'rgba(14,207,176,0.1)', color: '#0ECFB0', border: '1px solid rgba(14,207,176,0.2)' }}>
                          {d === 0 ? 'Today' : d === 1 ? 'Tomorrow' : `${d} days`}
                        </span>
                      )
                    })()}
                  </div>
                  <p className="text-xs mb-2" style={{ color: 'rgba(241,245,249,0.45)' }}>
                    {new Date(nextPractice.scheduled_date! + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    {nextPractice.scheduled_time ? ` · ${nextPractice.scheduled_time.slice(0, 5)}` : ''}
                    {' · '}{nextPractice.drills.length} drills · {nextPractice.duration_mins} min
                  </p>
                  <div className="flex gap-2">
                    <Link href="/practice/build/new" className="flex-1 py-2 text-center text-xs font-bold rounded-lg" style={{ backgroundColor: 'rgba(14,207,176,0.1)', color: '#0ECFB0', border: '1px solid rgba(14,207,176,0.2)' }}>
                      View Plan
                    </Link>
                    <Link href={`/practice/run?id=${nextPractice.id}`} className="flex-1 py-2 text-center text-xs font-bold rounded-lg" style={{ backgroundColor: 'rgba(14,207,176,0.15)', color: '#0ECFB0', border: '1px solid rgba(14,207,176,0.3)' }}>
                      Start Practice →
                    </Link>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-sm mb-2" style={{ color: 'rgba(241,245,249,0.4)' }}>No practice scheduled</p>
                  <Link href="/calendar" className="text-sm font-semibold" style={{ color: '#0ECFB0' }}>Schedule a practice →</Link>
                </>
              )}
            </AccentCard>

            {/* Recent Practice */}
            <AccentCard accent="#8B5CF6">
              <SectionLabel>Last Practice Plan</SectionLabel>
              {lPlans ? (
                <div className="space-y-2"><Skeleton className="h-5 w-1/2" /><Skeleton className="h-4 w-2/3" /></div>
              ) : recentPlan ? (
                <>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <p className="text-base font-bold text-sp-text">{recentPlan.name}</p>
                    <span className="text-xs flex-shrink-0" style={{ color: 'rgba(241,245,249,0.3)' }}>{formatDateShort(recentPlan.updated_at)}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 mb-3">
                    <span className="text-xs" style={{ color: 'rgba(241,245,249,0.4)' }}>{recentPlan.duration_mins} min</span>
                    {recentPlan.age_group && (
                      <><span style={{ color: 'rgba(241,245,249,0.2)' }}>·</span><span className="text-xs" style={{ color: 'rgba(241,245,249,0.4)' }}>{recentPlan.age_group}</span></>
                    )}
                    {(recentPlan.focus_areas ?? []).map(fa => (
                      <span key={fa} className="px-2 py-0.5 rounded text-xs font-medium" style={{ backgroundColor: 'rgba(139,92,246,0.12)', color: '#8B5CF6' }}>{fa}</span>
                    ))}
                    <span className="text-xs" style={{ color: 'rgba(241,245,249,0.3)' }}>{recentPlan.drills.length} drills</span>
                  </div>
                  <div className="flex gap-2">
                    <Link href="/practice/build/new" className="flex-1 py-2 text-center text-xs font-bold rounded-lg" style={{ backgroundColor: 'rgba(139,92,246,0.1)', color: '#8B5CF6', border: '1px solid rgba(139,92,246,0.2)' }}>
                      Edit Plan
                    </Link>
                    <Link href="/practice/run" className="flex-1 py-2 text-center text-xs font-bold rounded-lg" style={{ backgroundColor: 'rgba(139,92,246,0.15)', color: '#8B5CF6', border: '1px solid rgba(139,92,246,0.3)' }}>
                      Start Practice →
                    </Link>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-sm mb-2" style={{ color: 'rgba(241,245,249,0.4)' }}>No practice plans yet</p>
                  <Link href="/practice/build/new" className="text-sm font-semibold" style={{ color: '#F7620A' }}>+ Create Practice →</Link>
                </>
              )}
            </AccentCard>

            {/* Players Needing Attention */}
            <AccentCard accent="#F5B731">
              <SectionLabel>Players to Watch</SectionLabel>
              {lPlayers || lEvals ? (
                <div className="space-y-3">
                  {[1,2,3].map(i => (
                    <div key={i} className="flex items-center gap-3">
                      <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
                      <Skeleton className="h-4 flex-1" />
                    </div>
                  ))}
                </div>
              ) : players.length === 0 ? (
                <>
                  <p className="text-sm mb-2" style={{ color: 'rgba(241,245,249,0.4)' }}>No players on your roster yet</p>
                  <Link href="/players" className="text-sm font-semibold" style={{ color: '#F7620A' }}>+ Add Players →</Link>
                </>
              ) : attentionPlayers.length === 0 ? (
                <div className="flex items-center gap-3 py-1">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(34,197,94,0.15)' }}>
                    <span style={{ color: '#22C55E', fontSize: 14 }}>✓</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-sp-text">All players evaluated</p>
                    {evals.length > 0 && (
                      <p className="text-xs" style={{ color: 'rgba(241,245,249,0.4)' }}>
                        Last eval: {formatRelative([...evals].sort((a,b) => new Date(b.evaluated_at).getTime() - new Date(a.evaluated_at).getTime())[0].evaluated_at)}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {attentionPlayers.map(({ player, badge, badgeColor }, idx) => (
                    <div key={player.id} className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                        style={{ backgroundColor: `${PLAYER_COLORS[idx]}22`, color: PLAYER_COLORS[idx], border: `1px solid ${PLAYER_COLORS[idx]}44` }}
                      >
                        {initials(player)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-sp-text truncate">{player.first_name} {player.last_name ?? ''}</p>
                        {player.position && <p className="text-xs leading-tight" style={{ color: 'rgba(241,245,249,0.4)' }}>{player.position}</p>}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded" style={{ backgroundColor: `${badgeColor}18`, color: badgeColor }}>{badge}</span>
                        <Link href="/players" className="text-xs font-bold transition-opacity hover:opacity-80" style={{ color: '#F7620A' }}>Evaluate →</Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </AccentCard>
          </div>

          {/* ── Right column ── */}
          <div className="space-y-4">

            {/* Quick Actions */}
            <div className="rounded-2xl p-4" style={{ backgroundColor: '#0E1520', border: '1px solid rgba(241,245,249,0.07)' }}>
              <SectionLabel>Quick Actions</SectionLabel>
              <div className="space-y-2">
                {([
                  { icon: '📋', label: 'New Practice Plan',  action: () => router.push('/practice/build/new') },
                  { icon: '📊', label: 'Evaluate a Player',  action: () => router.push('/players?openEval=true') },
                  { icon: '🏀', label: 'Add a Game',          action: () => router.push('/game?openAdd=true') },
                  { icon: '📣', label: 'Message Parents',     action: openCommsPanel },
                  { icon: '👥', label: 'Manage Roster',       action: () => router.push('/players/roster') },
                ] as const).map(({ icon, label, action }) => (
                  <button
                    key={label}
                    onClick={action}
                    className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all"
                    style={{ backgroundColor: 'rgba(241,245,249,0.02)', border: '1px solid rgba(241,245,249,0.07)', minHeight: 52 }}
                    onMouseEnter={e => {
                      const el = e.currentTarget as HTMLElement
                      el.style.borderColor = 'rgba(241,245,249,0.13)'
                      el.style.backgroundColor = 'rgba(241,245,249,0.04)'
                    }}
                    onMouseLeave={e => {
                      const el = e.currentTarget as HTMLElement
                      el.style.borderColor = 'rgba(241,245,249,0.07)'
                      el.style.backgroundColor = 'rgba(241,245,249,0.02)'
                    }}
                  >
                    <span style={{ fontSize: 18, flexShrink: 0 }}>{icon}</span>
                    <span className="flex-1 text-sm font-medium text-sp-text">{label}</span>
                    <span style={{ color: 'rgba(241,245,249,0.25)', fontSize: 16 }}>›</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="rounded-2xl p-4" style={{ backgroundColor: '#0E1520', border: '1px solid rgba(241,245,249,0.07)' }}>
              <SectionLabel>Recent Activity</SectionLabel>
              {isLoading ? (
                <div className="space-y-3">
                  {[1,2,3,4].map(i => (
                    <div key={i} className="flex items-center gap-2">
                      <Skeleton className="w-5 h-5 rounded-full flex-shrink-0" />
                      <Skeleton className="h-3.5 flex-1" />
                    </div>
                  ))}
                </div>
              ) : activityFeed.length === 0 ? (
                <p className="text-xs" style={{ color: 'rgba(241,245,249,0.35)' }}>No activity yet</p>
              ) : activityFeed.map((item, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2.5 py-2.5"
                  style={{ borderBottom: i < activityFeed.length - 1 ? '1px solid rgba(241,245,249,0.04)' : 'none' }}
                >
                  <span className="flex-shrink-0 text-sm mt-px">{item.icon}</span>
                  <p className="flex-1 text-xs leading-snug min-w-0" style={{ color: 'rgba(241,245,249,0.6)' }}>{item.text}</p>
                  <p className="text-xs flex-shrink-0 ml-1" style={{ color: 'rgba(241,245,249,0.25)' }}>{formatRelative(item.ts)}</p>
                </div>
              ))}
            </div>

          </div>
        </div>
      )}
      </>)}
    </div>
  )
}
