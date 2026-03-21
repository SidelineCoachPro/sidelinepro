import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useTeam } from '@/lib/teamContext'
import { useGames } from './useGames'
import { usePracticePlans, type PlanDrill } from './usePracticePlans'

export type CalendarEventType = 'game' | 'practice' | 'other'

export interface CalendarEvent {
  id: string
  type: CalendarEventType
  title: string
  date: string        // YYYY-MM-DD
  time?: string       // HH:MM 24h
  location?: string
  color: string
  sourceId: string    // original record id
  // Practice-specific
  practicePlanId?: string
  drillCount?: number
  durationMins?: number
  focusAreas?: string[] | null
  characterTheme?: string | null
  drills?: PlanDrill[]
  ageGroup?: string | null
  // Game-specific
  opponent?: string
  ourScore?: number | null
  opponentScore?: number | null
  gameStatus?: 'upcoming' | 'final'
  // Other-specific
  notes?: string
}

export const EVENT_COLORS = {
  game:     '#F7620A',
  practice: '#0ECFB0',
  other:    '#6B7A99',
} as const

const supabase = createClient()

interface CalendarEventRow {
  id: string
  title: string
  event_date: string
  event_time: string | null
  location: string | null
  notes: string | null
  event_type: string
  created_at: string
}

function isoToDate(iso: string): string {
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function isoToTime(iso: string): string {
  const d = new Date(iso)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export function useCalendarEventsRaw(year: number, month: number) {
  // month is 1-indexed
  const { activeTeamId } = useTeam()
  const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0]
  const endDate   = new Date(year, month, 0).toISOString().split('T')[0]

  return useQuery({
    queryKey: ['calendar_events', year, month, activeTeamId ?? 'all'],
    queryFn: async () => {
      let q = supabase
        .from('calendar_events')
        .select('*')
        .gte('event_date', startDate)
        .lte('event_date', endDate)
        .order('event_date', { ascending: true })
      if (activeTeamId) q = q.eq('team_id', activeTeamId)
      const { data, error } = await q
      if (error) throw error
      return (data ?? []) as CalendarEventRow[]
    },
  })
}

export function useCalendar(year: number, month: number): CalendarEvent[] {
  // month is 1-indexed
  const { data: games = [] }     = useGames()
  const { data: plans = [] }     = usePracticePlans()
  const { data: calRows = [] }   = useCalendarEventsRaw(year, month)

  const startOfMonth = new Date(year, month - 1, 1)
  const endOfMonth   = new Date(year, month, 0)

  const events: CalendarEvent[] = []

  // Games in this month
  for (const g of games) {
    const d = new Date(g.scheduled_at)
    if (d >= startOfMonth && d <= endOfMonth) {
      const hasFinal = g.our_score !== null || g.opponent_score !== null
      events.push({
        id:            `game-${g.id}`,
        type:          'game',
        title:         `vs ${g.opponent}`,
        date:          isoToDate(g.scheduled_at),
        time:          isoToTime(g.scheduled_at),
        location:      g.location ?? undefined,
        color:         EVENT_COLORS.game,
        sourceId:      g.id,
        opponent:      g.opponent,
        ourScore:      g.our_score,
        opponentScore: g.opponent_score,
        gameStatus:    hasFinal ? 'final' : 'upcoming',
      })
    }
  }

  // Practice plans with scheduled_date in this month
  for (const p of plans) {
    if (!p.scheduled_date) continue
    const [y, m] = p.scheduled_date.split('-').map(Number)
    if (y !== year || m !== month) continue
    events.push({
      id:             `practice-${p.id}`,
      type:           'practice',
      title:          p.name,
      date:           p.scheduled_date,
      time:           p.scheduled_time ? p.scheduled_time.slice(0, 5) : undefined,
      color:          EVENT_COLORS.practice,
      sourceId:       p.id,
      practicePlanId: p.id,
      drillCount:     p.drills.length,
      durationMins:   p.duration_mins,
      focusAreas:     p.focus_areas,
      characterTheme: p.character_theme,
      drills:         p.drills,
      ageGroup:       p.age_group,
    })
  }

  // Other calendar events
  for (const e of calRows) {
    events.push({
      id:       `other-${e.id}`,
      type:     'other',
      title:    e.title,
      date:     e.event_date,
      time:     e.event_time ? e.event_time.slice(0, 5) : undefined,
      location: e.location ?? undefined,
      color:    EVENT_COLORS.other,
      sourceId: e.id,
      notes:    e.notes ?? undefined,
    })
  }

  // Sort: date asc, then time asc (no-time events last within their day)
  events.sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date)
    if (!a.time && !b.time) return 0
    if (!a.time) return 1
    if (!b.time) return -1
    return a.time.localeCompare(b.time)
  })

  return events
}

// ── CRUD for calendar_events ────────────────────────────────────────────────

export function useCreateCalendarEvent() {
  const qc = useQueryClient()
  const { activeTeamId } = useTeam()
  return useMutation({
    mutationFn: async (input: {
      title: string
      event_date: string
      event_time?: string | null
      location?: string | null
      notes?: string | null
    }) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      const { data, error } = await supabase
        .from('calendar_events')
        .insert({ ...input, coach_id: user.id, event_type: 'other', team_id: activeTeamId ?? null })
        .select()
        .single()
      if (error) throw error
      return data as CalendarEventRow
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['calendar_events'] }),
  })
}

export function useUpdateCalendarEvent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id, ...rest
    }: {
      id: string
      title?: string
      event_date?: string
      event_time?: string | null
      location?: string | null
      notes?: string | null
    }) => {
      const { data, error } = await supabase
        .from('calendar_events')
        .update(rest)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data as CalendarEventRow
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['calendar_events'] }),
  })
}

export function useDeleteCalendarEvent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('calendar_events')
        .delete()
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['calendar_events'] }),
  })
}
