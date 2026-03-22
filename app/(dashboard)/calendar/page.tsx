'use client'

import { useState, useEffect, useMemo, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Barlow_Condensed } from 'next/font/google'
import {
  useCalendar,
  useCreateCalendarEvent,
  useDeleteCalendarEvent,
  EVENT_COLORS,
  type CalendarEvent,
} from '@/hooks/useCalendar'
import { useCreateGame } from '@/hooks/useGames'
import { usePracticePlans, useSchedulePractice } from '@/hooks/usePracticePlans'
import { useTeam } from '@/lib/teamContext'
import { useTeamToken } from '@/hooks/useTeamToken'

const barlow = Barlow_Condensed({ subsets: ['latin'], weight: '900' })

const MONTH_NAMES = ['January','February','March','April','May','June',
                     'July','August','September','October','November','December']
const DAY_LABELS  = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

const FOCUS_COLOR: Record<string, string> = {
  'Ball Handling': '#F7620A',
  'Shooting':      '#38BDF8',
  'Passing':       '#F5B731',
  'Defense':       '#22C55E',
  'Conditioning':  '#E879F9',
  'Team Play':     '#8B5CF6',
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getCalendarDays(year: number, month: number): Date[] {
  // month is 0-indexed (JS style)
  const firstOfMonth = new Date(year, month, 1)
  const days: Date[] = []
  for (let i = firstOfMonth.getDay() - 1; i >= 0; i--) days.push(new Date(year, month, -i))
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  for (let d = 1; d <= daysInMonth; d++) days.push(new Date(year, month, d))
  let next = 1
  while (days.length < 42) days.push(new Date(year, month + 1, next++))
  return days
}

function dateToStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function todayStr(): string {
  return dateToStr(new Date())
}

function formatHHMM(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const hr   = h % 12 || 12
  return m === 0 ? `${hr} ${ampm}` : `${hr}:${String(m).padStart(2, '0')} ${ampm}`
}

function formatDateLong(dateStr: string): string {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  })
}

function daysFromToday(dateStr: string): number {
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const target = new Date(dateStr + 'T00:00:00')
  return Math.round((target.getTime() - today.getTime()) / 86400000)
}

// ── Event Pill ────────────────────────────────────────────────────────────────

function EventPill({ event, onClick }: { event: CalendarEvent; onClick: () => void }) {
  const isDark = event.type === 'practice'  // teal bg → dark text
  return (
    <button
      onClick={e => { e.stopPropagation(); onClick() }}
      className="w-full text-left truncate rounded px-1.5 py-0.5 text-xs leading-tight transition-opacity hover:opacity-80"
      style={{
        backgroundColor: event.color + (event.type === 'other' ? '33' : '22'),
        color: isDark ? '#0E1520' : event.color,
        border: `1px solid ${event.color}40`,
        fontSize: 11,
      }}
      title={event.title}
    >
      {event.time ? <span className="opacity-70 mr-1">{formatHHMM(event.time)}</span> : null}
      {event.title}
    </button>
  )
}

// ── Practice Summary Panel ────────────────────────────────────────────────────

function PracticeSummaryPanel({ event, onBack, onUnschedule }: {
  event: CalendarEvent
  onBack: () => void
  onUnschedule: () => void
}) {
  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <button onClick={onBack} className="flex items-center gap-1.5 mb-4 text-sm transition-opacity hover:opacity-60" style={{ color: 'rgba(241,245,249,0.45)' }}>
        ← Back
      </button>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: EVENT_COLORS.practice }}>Practice Plan</p>
          <h2 className={`text-2xl text-sp-text leading-tight ${barlow.className}`}>{event.title}</h2>
        </div>
        <span className="flex-shrink-0 text-xs font-semibold px-2 py-1 rounded-lg" style={{ backgroundColor: `${EVENT_COLORS.practice}20`, color: EVENT_COLORS.practice, border: `1px solid ${EVENT_COLORS.practice}40` }}>
          Practice
        </span>
      </div>

      {/* Meta */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-4 text-xs" style={{ color: 'rgba(241,245,249,0.5)' }}>
        {event.durationMins && <span>{event.durationMins} min</span>}
        {event.ageGroup && <><span>·</span><span>{event.ageGroup}</span></>}
        {event.drillCount !== undefined && <><span>·</span><span>{event.drillCount} drills</span></>}
        {event.time && <><span>·</span><span>{formatHHMM(event.time)}</span></>}
      </div>

      {/* Focus areas */}
      {(event.focusAreas ?? []).length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {(event.focusAreas ?? []).map(fa => (
            <span key={fa} className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: `${FOCUS_COLOR[fa] ?? '#6B7280'}18`, color: FOCUS_COLOR[fa] ?? '#6B7280' }}>{fa}</span>
          ))}
        </div>
      )}

      {event.characterTheme && (
        <p className="text-xs mb-4" style={{ color: 'rgba(241,245,249,0.5)' }}>Theme: <span className="font-semibold text-sp-text">{event.characterTheme}</span></p>
      )}

      {/* Drill list */}
      {event.drills && event.drills.length > 0 && (
        <div className="space-y-2 mb-5">
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'rgba(241,245,249,0.3)' }}>Drills</p>
          {event.drills.map((drill, i) => (
            <div key={drill.uid} className="flex items-center gap-3 py-2 px-3 rounded-lg" style={{ backgroundColor: 'rgba(241,245,249,0.04)' }}>
              <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: drill.categoryColor }} />
              <span className="flex-1 text-sm text-sp-text truncate">{i + 1}. {drill.name}</span>
              <span className="text-xs flex-shrink-0" style={{ color: 'rgba(241,245,249,0.35)' }}>{drill.durationMins} min</span>
            </div>
          ))}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-2 mt-auto pt-2">
        <Link
          href={`/practice/planner`}
          className="flex-1 py-2.5 text-center text-sm font-bold rounded-xl transition-opacity hover:opacity-80"
          style={{ backgroundColor: 'rgba(241,245,249,0.08)', color: 'rgba(241,245,249,0.7)', border: '1px solid rgba(241,245,249,0.12)' }}
        >
          Edit Plan
        </Link>
        <Link
          href={`/practice/run?id=${event.practicePlanId}`}
          className="flex-1 py-2.5 text-center text-sm font-bold rounded-xl transition-opacity hover:opacity-80"
          style={{ backgroundColor: EVENT_COLORS.practice, color: '#0E1520' }}
        >
          Start Practice →
        </Link>
      </div>

      {/* Unschedule */}
      <button onClick={onUnschedule} className="mt-3 text-xs text-center transition-opacity hover:opacity-60" style={{ color: 'rgba(241,245,249,0.3)' }}>
        Remove from calendar
      </button>
    </div>
  )
}

// ── Day Detail Popover ────────────────────────────────────────────────────────

function DayDetailPopover({ dateStr, events, onClose, onUnschedule, onDeleteOther }: {
  dateStr: string
  events: CalendarEvent[]
  onClose: () => void
  onUnschedule: (planId: string) => void
  onDeleteOther: (id: string) => void
}) {
  const [summaryEvent, setSummaryEvent] = useState<CalendarEvent | null>(null)

  if (summaryEvent?.type === 'practice') {
    return (
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" style={{ backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
        <div className="w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl p-5 overflow-y-auto" style={{ backgroundColor: '#0E1520', border: '1px solid rgba(241,245,249,0.1)', maxHeight: '90vh' }}>
          <PracticeSummaryPanel
            event={summaryEvent}
            onBack={() => setSummaryEvent(null)}
            onUnschedule={() => { onUnschedule(summaryEvent.practicePlanId!); onClose() }}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" style={{ backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl overflow-hidden flex flex-col" style={{ backgroundColor: '#0E1520', border: '1px solid rgba(241,245,249,0.1)', maxHeight: '90vh' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid rgba(241,245,249,0.07)' }}>
          <h2 className="text-base font-bold text-sp-text">{formatDateLong(dateStr)}</h2>
          <button onClick={onClose} className="text-lg leading-none hover:opacity-60 transition-opacity" style={{ color: 'rgba(241,245,249,0.4)' }}>✕</button>
        </div>

        {/* Event cards */}
        <div className="overflow-y-auto flex-1">
          {events.length === 0 ? (
            <p className="text-sm px-5 py-8 text-center" style={{ color: 'rgba(241,245,249,0.35)' }}>No events this day.</p>
          ) : (
            <div className="p-4 space-y-3">
              {events.map(ev => {
                if (ev.type === 'game') {
                  const d = daysFromToday(ev.date)
                  const isFinal = ev.gameStatus === 'final'
                  const won = (ev.ourScore ?? 0) > (ev.opponentScore ?? 0)
                  return (
                    <div key={ev.id} className="rounded-xl p-4" style={{ backgroundColor: `${EVENT_COLORS.game}12`, border: `1px solid ${EVENT_COLORS.game}30` }}>
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <span className="text-xs font-bold mr-2" style={{ color: EVENT_COLORS.game }}>Game</span>
                          <span className="text-base font-bold text-sp-text">vs {ev.opponent}</span>
                        </div>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0" style={{ backgroundColor: isFinal ? 'rgba(241,245,249,0.08)' : 'rgba(56,189,248,0.12)', color: isFinal ? 'rgba(241,245,249,0.5)' : '#38BDF8' }}>
                          {isFinal ? 'Final' : d === 0 ? 'Today' : d === 1 ? 'Tomorrow' : `In ${d} days`}
                        </span>
                      </div>
                      {(ev.time || ev.location) && (
                        <p className="text-xs mb-2" style={{ color: 'rgba(241,245,249,0.4)' }}>
                          {ev.time ? formatHHMM(ev.time) : ''}{ev.time && ev.location ? ' · ' : ''}{ev.location ?? ''}
                        </p>
                      )}
                      {isFinal && ev.ourScore !== null && (
                        <p className="text-sm font-bold mb-2" style={{ color: won ? '#22C55E' : 'rgba(241,245,249,0.6)' }}>
                          {won ? 'W' : 'L'} {ev.ourScore} – {ev.opponentScore}
                        </p>
                      )}
                      <div className="flex gap-2 mt-3">
                        <Link href={`/game/${ev.sourceId}/lineup`} onClick={onClose} className="flex-1 py-2 text-center text-xs font-bold rounded-lg transition-opacity hover:opacity-80" style={{ backgroundColor: 'rgba(139,92,246,0.15)', color: '#8B5CF6', border: '1px solid rgba(139,92,246,0.3)' }}>
                          View Lineup
                        </Link>
                        <Link href={`/game/${ev.sourceId}/track`} onClick={onClose} className="flex-1 py-2 text-center text-xs font-bold rounded-lg transition-opacity hover:opacity-80" style={{ backgroundColor: `${EVENT_COLORS.game}18`, color: EVENT_COLORS.game, border: `1px solid ${EVENT_COLORS.game}35` }}>
                          Track Game
                        </Link>
                      </div>
                    </div>
                  )
                }

                if (ev.type === 'practice') {
                  return (
                    <div key={ev.id} className="rounded-xl p-4" style={{ backgroundColor: `${EVENT_COLORS.practice}12`, border: `1px solid ${EVENT_COLORS.practice}30` }}>
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <span className="text-xs font-bold mr-2" style={{ color: EVENT_COLORS.practice }}>Practice</span>
                          <span className="text-base font-bold text-sp-text">{ev.title}</span>
                        </div>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0" style={{ backgroundColor: `${EVENT_COLORS.practice}20`, color: EVENT_COLORS.practice }}>
                          Practice
                        </span>
                      </div>
                      {(ev.time || ev.durationMins) && (
                        <p className="text-xs mb-2" style={{ color: 'rgba(241,245,249,0.4)' }}>
                          {ev.time ? formatHHMM(ev.time) : ''}{ev.time && ev.durationMins ? ' · ' : ''}{ev.durationMins ? `${ev.durationMins} min` : ''}
                        </p>
                      )}
                      {(ev.focusAreas ?? []).length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {(ev.focusAreas ?? []).map(fa => (
                            <span key={fa} className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: `${FOCUS_COLOR[fa] ?? '#6B7280'}18`, color: FOCUS_COLOR[fa] ?? '#6B7280' }}>{fa}</span>
                          ))}
                        </div>
                      )}
                      {ev.drillCount !== undefined && (
                        <p className="text-xs mb-3" style={{ color: 'rgba(241,245,249,0.4)' }}>{ev.drillCount} drills</p>
                      )}
                      <div className="flex gap-2">
                        <button onClick={() => setSummaryEvent(ev)} className="flex-1 py-2 text-xs font-bold rounded-lg transition-opacity hover:opacity-80" style={{ backgroundColor: 'rgba(241,245,249,0.08)', color: 'rgba(241,245,249,0.7)', border: '1px solid rgba(241,245,249,0.12)' }}>
                          View Plan
                        </button>
                        <Link href={`/practice/run?id=${ev.practicePlanId}`} onClick={onClose} className="flex-1 py-2 text-center text-xs font-bold rounded-lg transition-opacity hover:opacity-80" style={{ backgroundColor: EVENT_COLORS.practice, color: '#0E1520' }}>
                          Start Practice →
                        </Link>
                      </div>
                    </div>
                  )
                }

                // other
                return (
                  <div key={ev.id} className="rounded-xl p-4" style={{ backgroundColor: `${EVENT_COLORS.other}12`, border: `1px solid ${EVENT_COLORS.other}30` }}>
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <span className="text-xs font-bold mr-2" style={{ color: EVENT_COLORS.other }}>Event</span>
                        <span className="text-base font-bold text-sp-text">{ev.title}</span>
                      </div>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0" style={{ backgroundColor: `${EVENT_COLORS.other}20`, color: EVENT_COLORS.other }}>Event</span>
                    </div>
                    {(ev.time || ev.location) && (
                      <p className="text-xs mb-1" style={{ color: 'rgba(241,245,249,0.4)' }}>
                        {ev.time ? formatHHMM(ev.time) : ''}{ev.time && ev.location ? ' · ' : ''}{ev.location ?? ''}
                      </p>
                    )}
                    {ev.notes && <p className="text-xs mb-3" style={{ color: 'rgba(241,245,249,0.5)' }}>{ev.notes}</p>}
                    <button onClick={() => onDeleteOther(ev.sourceId)} className="text-xs transition-opacity hover:opacity-60" style={{ color: '#EF4444' }}>
                      Delete
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Add Event Modal ───────────────────────────────────────────────────────────

function AddEventModal({ defaultDate, defaultType, onClose }: {
  defaultDate?: string
  defaultType?: 'game' | 'practice' | 'other'
  onClose: () => void
}) {
  const [type, setType] = useState<'game' | 'practice' | 'other'>(defaultType ?? 'game')
  const today = todayStr()

  // Game form
  const { mutateAsync: createGame, isPending: isCreatingGame } = useCreateGame()
  const [gOpponent, setGOpponent] = useState('')
  const [gDate,     setGDate]     = useState(defaultDate ?? today)
  const [gTime,     setGTime]     = useState('10:00')
  const [gLocation, setGLocation] = useState('')

  // Practice form
  const { data: plans = [] } = usePracticePlans()
  const { mutateAsync: schedulePractice, isPending: isScheduling } = useSchedulePractice()
  const [pPlanId, setPPlanId] = useState('')
  const [pDate,   setPDate]   = useState(defaultDate ?? today)
  const [pTime,   setPTime]   = useState('')

  // Other form
  const { mutateAsync: createEvent, isPending: isCreatingEvent } = useCreateCalendarEvent()
  const [oTitle,    setOTitle]    = useState('')
  const [oDate,     setODate]     = useState(defaultDate ?? today)
  const [oTime,     setOTime]     = useState('')
  const [oLocation, setOLocation] = useState('')
  const [oNotes,    setONotes]    = useState('')

  const [error, setError]     = useState('')
  const isPending = isCreatingGame || isScheduling || isCreatingEvent

  const selectedPlan = plans.find(p => p.id === pPlanId)

  async function handleSave() {
    setError('')
    try {
      if (type === 'game') {
        if (!gOpponent.trim()) { setError('Opponent name is required'); return }
        await createGame({
          opponent: gOpponent.trim(),
          location: gLocation.trim() || null,
          scheduled_at: new Date(`${gDate}T${gTime || '00:00'}:00`).toISOString(),
          notes: null,
        })
      } else if (type === 'practice') {
        if (!pPlanId) { setError('Please select a practice plan'); return }
        await schedulePractice({
          id: pPlanId,
          scheduled_date: pDate,
          scheduled_time: pTime || null,
        })
      } else {
        if (!oTitle.trim()) { setError('Title is required'); return }
        await createEvent({
          title: oTitle.trim(),
          event_date: oDate,
          event_time: oTime || null,
          location: oLocation.trim() || null,
          notes: oNotes.trim() || null,
        })
      }
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    }
  }

  const inputStyle = "sp-input"
  const labelStyle = { color: 'rgba(241,245,249,0.6)', fontSize: '13px' } as const

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" style={{ backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl flex flex-col overflow-hidden" style={{ backgroundColor: '#0E1520', border: '1px solid rgba(241,245,249,0.1)', maxHeight: '90vh' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid rgba(241,245,249,0.07)' }}>
          <h2 className="text-base font-semibold text-sp-text">Add to Calendar</h2>
          <button onClick={onClose} className="text-lg leading-none hover:opacity-60" style={{ color: 'rgba(241,245,249,0.4)' }}>✕</button>
        </div>

        {/* Type selector */}
        <div className="px-5 pt-4 flex gap-2">
          {([
            { key: 'game',     icon: '🏀', label: 'Game' },
            { key: 'practice', icon: '📋', label: 'Practice' },
            { key: 'other',    icon: '📌', label: 'Other' },
          ] as const).map(({ key, icon, label }) => (
            <button
              key={key}
              onClick={() => setType(key)}
              className="flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all"
              style={{
                backgroundColor: type === key ? (key === 'game' ? 'rgba(247,98,10,0.15)' : key === 'practice' ? 'rgba(14,207,176,0.15)' : 'rgba(107,122,153,0.15)') : 'rgba(241,245,249,0.04)',
                color: type === key ? (key === 'game' ? EVENT_COLORS.game : key === 'practice' ? EVENT_COLORS.practice : EVENT_COLORS.other) : 'rgba(241,245,249,0.45)',
                border: `1px solid ${type === key ? (key === 'game' ? EVENT_COLORS.game + '50' : key === 'practice' ? EVENT_COLORS.practice + '50' : EVENT_COLORS.other + '50') : 'rgba(241,245,249,0.08)'}`,
              }}
            >
              {icon} {label}
            </button>
          ))}
        </div>

        {/* Form */}
        <div className="px-5 py-4 overflow-y-auto space-y-4">
          {type === 'game' && (
            <>
              <div>
                <label className="block mb-1.5 text-xs font-medium" style={labelStyle}>Opponent *</label>
                <input value={gOpponent} onChange={e => setGOpponent(e.target.value)} className={inputStyle} placeholder="e.g. Westside Eagles" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1.5 text-xs font-medium" style={labelStyle}>Date *</label>
                  <input type="date" value={gDate} onChange={e => setGDate(e.target.value)} className={inputStyle} style={{ colorScheme: 'dark' }} />
                </div>
                <div>
                  <label className="block mb-1.5 text-xs font-medium" style={labelStyle}>Time</label>
                  <input type="time" value={gTime} onChange={e => setGTime(e.target.value)} className={inputStyle} style={{ colorScheme: 'dark' }} />
                </div>
              </div>
              <div>
                <label className="block mb-1.5 text-xs font-medium" style={labelStyle}>Location</label>
                <input value={gLocation} onChange={e => setGLocation(e.target.value)} className={inputStyle} placeholder="Optional" />
              </div>
            </>
          )}

          {type === 'practice' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1.5 text-xs font-medium" style={labelStyle}>Date *</label>
                  <input type="date" value={pDate} onChange={e => setPDate(e.target.value)} className={inputStyle} style={{ colorScheme: 'dark' }} />
                </div>
                <div>
                  <label className="block mb-1.5 text-xs font-medium" style={labelStyle}>Time</label>
                  <input type="time" value={pTime} onChange={e => setPTime(e.target.value)} className={inputStyle} style={{ colorScheme: 'dark' }} />
                </div>
              </div>
              <div>
                <label className="block mb-1.5 text-xs font-medium" style={labelStyle}>Practice Plan *</label>
                <select value={pPlanId} onChange={e => setPPlanId(e.target.value)} className={inputStyle} style={{ colorScheme: 'dark' }}>
                  <option value="" style={{ backgroundColor: '#0E1520' }}>— Pick an existing plan —</option>
                  {plans.map(p => (
                    <option key={p.id} value={p.id} style={{ backgroundColor: '#0E1520' }}>{p.name}</option>
                  ))}
                </select>
              </div>
              {selectedPlan && (
                <div className="rounded-xl p-3 text-xs space-y-1" style={{ backgroundColor: `${EVENT_COLORS.practice}12`, border: `1px solid ${EVENT_COLORS.practice}30` }}>
                  <p className="font-semibold" style={{ color: EVENT_COLORS.practice }}>{selectedPlan.name}</p>
                  <p style={{ color: 'rgba(241,245,249,0.5)' }}>{selectedPlan.duration_mins} min · {selectedPlan.drills.length} drills{selectedPlan.age_group ? ` · ${selectedPlan.age_group}` : ''}</p>
                  {(selectedPlan.focus_areas ?? []).length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {(selectedPlan.focus_areas ?? []).map(fa => (
                        <span key={fa} className="px-1.5 py-0.5 rounded" style={{ backgroundColor: `${FOCUS_COLOR[fa] ?? '#6B7280'}18`, color: FOCUS_COLOR[fa] ?? '#6B7280' }}>{fa}</span>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {!pPlanId && (
                <p className="text-xs" style={{ color: 'rgba(241,245,249,0.35)' }}>
                  Or{' '}
                  <Link href="/practice/planner" className="underline" style={{ color: EVENT_COLORS.practice }}>create a new plan</Link>
                  {' '}first, then schedule it here.
                </p>
              )}
            </>
          )}

          {type === 'other' && (
            <>
              <div>
                <label className="block mb-1.5 text-xs font-medium" style={labelStyle}>Title *</label>
                <input value={oTitle} onChange={e => setOTitle(e.target.value)} className={inputStyle} placeholder="e.g. Team Meeting" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1.5 text-xs font-medium" style={labelStyle}>Date *</label>
                  <input type="date" value={oDate} onChange={e => setODate(e.target.value)} className={inputStyle} style={{ colorScheme: 'dark' }} />
                </div>
                <div>
                  <label className="block mb-1.5 text-xs font-medium" style={labelStyle}>Time</label>
                  <input type="time" value={oTime} onChange={e => setOTime(e.target.value)} className={inputStyle} style={{ colorScheme: 'dark' }} />
                </div>
              </div>
              <div>
                <label className="block mb-1.5 text-xs font-medium" style={labelStyle}>Location</label>
                <input value={oLocation} onChange={e => setOLocation(e.target.value)} className={inputStyle} placeholder="Optional" />
              </div>
              <div>
                <label className="block mb-1.5 text-xs font-medium" style={labelStyle}>Notes</label>
                <textarea value={oNotes} onChange={e => setONotes(e.target.value)} className={inputStyle} rows={2} placeholder="Optional" style={{ resize: 'vertical' }} />
              </div>
            </>
          )}

          {error && <p className="text-xs text-red-400 rounded-lg px-3 py-2" style={{ backgroundColor: 'rgba(239,68,68,0.1)' }}>{error}</p>}
        </div>

        <div className="flex gap-3 px-5 py-4" style={{ borderTop: '1px solid rgba(241,245,249,0.07)' }}>
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium" style={{ color: 'rgba(241,245,249,0.5)' }}>Cancel</button>
          <button onClick={handleSave} disabled={isPending} className="flex-1 py-2 text-sm font-semibold rounded-lg disabled:opacity-50 transition-opacity hover:opacity-85" style={{ backgroundColor: '#F7620A', color: '#fff' }}>
            {isPending ? 'Saving...' : 'Add to Calendar'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Calendar Grid ─────────────────────────────────────────────────────────────

function CalendarGrid({ year, month, events, onDaySelect }: {
  year: number
  month: number    // 1-indexed
  events: CalendarEvent[]
  onDaySelect: (dateStr: string, evs: CalendarEvent[]) => void
}) {
  const days = getCalendarDays(year, month - 1)   // getCalendarDays uses 0-indexed month
  const today = todayStr()

  const eventsByDate = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {}
    for (const ev of events) {
      if (!map[ev.date]) map[ev.date] = []
      map[ev.date].push(ev)
    }
    return map
  }, [events])

  return (
    <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#0E1520', border: '1px solid rgba(241,245,249,0.07)' }}>
      {/* Day header labels */}
      <div className="grid grid-cols-7" style={{ borderBottom: '1px solid rgba(241,245,249,0.06)' }}>
        {DAY_LABELS.map(d => (
          <div key={d} className="py-2 text-center text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgba(241,245,249,0.3)', fontSize: 11 }}>
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7">
        {days.map((day, i) => {
          const dateStr   = dateToStr(day)
          const inMonth   = day.getMonth() === month - 1
          const isToday   = dateStr === today
          const dayEvents = eventsByDate[dateStr] ?? []
          const MAX_SHOWN = 3
          const shown     = dayEvents.slice(0, MAX_SHOWN)
          const extra     = dayEvents.length - MAX_SHOWN

          return (
            <div
              key={i}
              className="relative flex flex-col transition-colors"
              style={{
                minHeight: 100,
                cursor: 'pointer',
                borderBottom: i < 35 ? '1px solid rgba(241,245,249,0.04)' : undefined,
                borderRight: (i + 1) % 7 !== 0 ? '1px solid rgba(241,245,249,0.04)' : undefined,
                outline: isToday ? '2px solid rgba(247,98,10,0.6)' : undefined,
                outlineOffset: '-2px',
                backgroundColor: 'transparent',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = '#141E2D' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent' }}
              onClick={() => onDaySelect(dateStr, dayEvents)}
            >
              {/* Date number */}
              <div className="flex justify-end px-2 pt-1.5 pb-1">
                <span
                  className="inline-flex items-center justify-center text-xs font-medium leading-none"
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: '50%',
                    backgroundColor: isToday ? '#F7620A' : 'transparent',
                    color: !inMonth ? 'rgba(241,245,249,0.18)'
                         : isToday  ? '#fff'
                         : 'rgba(241,245,249,0.7)',
                    fontSize: 13,
                    fontWeight: isToday ? 700 : 500,
                  }}
                >
                  {day.getDate()}
                </span>
              </div>

              {/* Event pills (desktop) */}
              <div className="hidden sm:flex flex-col gap-0.5 px-1 pb-1 flex-1">
                {shown.map(ev => (
                  <EventPill key={ev.id} event={ev} onClick={() => onDaySelect(dateStr, dayEvents)} />
                ))}
                {extra > 0 && (
                  <button
                    onClick={e => { e.stopPropagation(); onDaySelect(dateStr, dayEvents) }}
                    className="text-left px-1.5 text-xs transition-opacity hover:opacity-80"
                    style={{ color: 'rgba(241,245,249,0.35)', fontSize: 11 }}
                  >
                    + {extra} more
                  </button>
                )}
              </div>

              {/* Event dots (mobile) */}
              <div className="sm:hidden flex justify-center gap-0.5 pb-1.5">
                {dayEvents.slice(0, 4).map((ev, di) => (
                  <div key={di} className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: ev.color }} />
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 px-4 py-2.5" style={{ borderTop: '1px solid rgba(241,245,249,0.05)' }}>
        {[
          { color: EVENT_COLORS.game,     label: 'Game' },
          { color: EVENT_COLORS.practice, label: 'Practice' },
          { color: EVENT_COLORS.other,    label: 'Other' },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
            <span className="text-xs" style={{ color: 'rgba(241,245,249,0.3)' }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Empty Month State ─────────────────────────────────────────────────────────

function EmptyMonth({ monthName, onAdd }: { monthName: string; onAdd: (type: 'game' | 'practice' | 'other') => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 rounded-xl" style={{ border: '1px dashed rgba(241,245,249,0.1)' }}>
      <p className="text-base font-semibold text-sp-text mb-1">Nothing scheduled for {monthName}</p>
      <p className="text-sm mb-6" style={{ color: 'rgba(241,245,249,0.4)' }}>Add a game or schedule a practice to get started.</p>
      <div className="flex gap-3">
        <button onClick={() => onAdd('game')} className="px-4 py-2 text-sm font-semibold rounded-xl transition-opacity hover:opacity-85" style={{ backgroundColor: `${EVENT_COLORS.game}18`, color: EVENT_COLORS.game, border: `1px solid ${EVENT_COLORS.game}35` }}>
          + Add Game
        </button>
        <button onClick={() => onAdd('practice')} className="px-4 py-2 text-sm font-semibold rounded-xl transition-opacity hover:opacity-85" style={{ backgroundColor: `${EVENT_COLORS.practice}18`, color: EVENT_COLORS.practice, border: `1px solid ${EVENT_COLORS.practice}35` }}>
          + Schedule Practice
        </button>
      </div>
    </div>
  )
}

// ── Share Link Modal ──────────────────────────────────────────────────────────

function ShareLinkModal({ token, url, onClose }: { token: string; url: string; onClose: () => void }) {
  const [copied, setCopied] = useState(false)
  function copy() {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="w-full max-w-md rounded-xl overflow-hidden" style={{ backgroundColor: '#0E1520', border: '1px solid rgba(241,245,249,0.1)' }}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid rgba(241,245,249,0.07)' }}>
          <h2 className="text-base font-semibold text-sp-text">Parent Link</h2>
          <button onClick={onClose} style={{ color: 'rgba(241,245,249,0.4)' }} className="hover:opacity-60 text-lg leading-none">✕</button>
        </div>
        <div className="px-5 py-5 space-y-4">
          <p className="text-sm" style={{ color: 'rgba(241,245,249,0.5)' }}>
            Share this link with parents so they can view the schedule, RSVP to games, and see announcements — no login required.
          </p>
          <div className="flex items-center gap-2">
            <div className="flex-1 px-3 py-2.5 rounded-lg text-sm truncate font-mono" style={{ backgroundColor: 'rgba(241,245,249,0.05)', color: 'rgba(241,245,249,0.7)', border: '1px solid rgba(241,245,249,0.1)' }}>
              {url}
            </div>
            <button
              onClick={copy}
              className="px-4 py-2.5 text-sm font-semibold rounded-lg flex-shrink-0 transition-all"
              style={{ backgroundColor: copied ? 'rgba(34,197,94,0.15)' : 'rgba(247,98,10,0.15)', color: copied ? '#22C55E' : '#F7620A', border: `1px solid ${copied ? 'rgba(34,197,94,0.3)' : 'rgba(247,98,10,0.3)'}` }}
            >
              {copied ? '✓ Copied' : 'Copy'}
            </button>
          </div>
          <p className="text-xs" style={{ color: 'rgba(241,245,249,0.3)' }}>Token: {token.slice(0, 8)}…</p>
        </div>
      </div>
    </div>
  )
}

// ── Inner Page (uses useSearchParams) ────────────────────────────────────────

function CalendarPageInner() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const { mutateAsync: schedulePractice } = useSchedulePractice()
  const { mutateAsync: deleteCalEvent }   = useDeleteCalendarEvent()
  const { activeTeamId } = useTeam()
  const { data: tokenData } = useTeamToken(activeTeamId)
  const [showShare, setShowShare] = useState(false)

  // Parse month from URL or default to current
  const [year, month] = useMemo(() => {
    const param = searchParams.get('month')  // "2025-03"
    if (param) {
      const [y, m] = param.split('-').map(Number)
      if (!isNaN(y) && m >= 1 && m <= 12) return [y, m]
    }
    const now = new Date()
    return [now.getFullYear(), now.getMonth() + 1]
  }, [searchParams])

  const events = useCalendar(year, month)

  // State
  const [selectedDay,      setSelectedDay]      = useState<{ date: string; events: CalendarEvent[] } | null>(null)
  const [addModal,         setAddModal]          = useState<{ type?: 'game' | 'practice' | 'other'; date?: string } | null>(null)
  const [toastMsg,         setToastMsg]          = useState<string>('')

  // Keyboard navigation
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) return
      if (e.key === 'ArrowLeft')  navMonth(-1)
      if (e.key === 'ArrowRight') navMonth(1)
      if (e.key === 't' || e.key === 'T') jumpToToday()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, month])

  function navMonth(delta: number) {
    let m = month + delta, y = year
    if (m < 1)  { m += 12; y-- }
    if (m > 12) { m -= 12; y++ }
    router.replace(`/calendar?month=${y}-${String(m).padStart(2, '0')}`)
  }

  function jumpToToday() {
    const now = new Date()
    router.replace(`/calendar?month=${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`)
  }

  function handleUnschedule(planId: string) {
    schedulePractice({ id: planId, scheduled_date: null }).then(() => {
      showToast('Practice removed from calendar')
    })
  }

  function handleDeleteOther(id: string) {
    deleteCalEvent(id).then(() => {
      setSelectedDay(null)
      showToast('Event deleted')
    })
  }

  function showToast(msg: string) {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(''), 3000)
  }

  const isCurrentMonth = (() => {
    const now = new Date()
    return year === now.getFullYear() && month === now.getMonth() + 1
  })()

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-4">
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-sp-text">Season Calendar</h1>
        </div>

        {/* Month nav (center on desktop) */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => navMonth(-1)}
            className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors hover:bg-white/[0.06]"
            style={{ color: 'rgba(241,245,249,0.5)' }}
          >
            ←
          </button>
          <span className={`text-lg font-bold text-sp-text min-w-[160px] text-center ${barlow.className}`} style={{ fontSize: 20 }}>
            {MONTH_NAMES[month - 1]} {year}
          </span>
          <button
            onClick={() => navMonth(1)}
            className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors hover:bg-white/[0.06]"
            style={{ color: 'rgba(241,245,249,0.5)' }}
          >
            →
          </button>
          {!isCurrentMonth && (
            <button
              onClick={jumpToToday}
              className="px-3 py-1 text-xs font-semibold rounded-lg transition-opacity hover:opacity-75"
              style={{ backgroundColor: 'rgba(241,245,249,0.08)', color: 'rgba(241,245,249,0.6)', border: '1px solid rgba(241,245,249,0.1)' }}
            >
              Today
            </button>
          )}
        </div>

        {/* Right: view options + add button */}
        <div className="flex items-center gap-2 sm:justify-end">
          {/* View switcher (Month active, others disabled) */}
          <div className="flex items-center gap-1 p-1 rounded-lg" style={{ backgroundColor: 'rgba(241,245,249,0.04)', border: '1px solid rgba(241,245,249,0.07)' }}>
            {([
              { key: 'month', label: 'Month' },
              { key: 'week',  label: 'Week' },
              { key: 'list',  label: 'List' },
            ] as const).map(({ key, label }) => (
              <div key={key} className="relative group">
                <button
                  disabled={key !== 'month'}
                  className="px-3 py-1 rounded text-xs font-medium transition-all"
                  style={{
                    backgroundColor: key === 'month' ? '#F7620A' : 'transparent',
                    color: key === 'month' ? '#fff' : 'rgba(241,245,249,0.25)',
                    cursor: key !== 'month' ? 'not-allowed' : 'pointer',
                  }}
                >
                  {label}
                </button>
                {key !== 'month' && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10" style={{ backgroundColor: '#141E2D', color: 'rgba(241,245,249,0.7)', border: '1px solid rgba(241,245,249,0.1)' }}>
                    Coming soon
                  </div>
                )}
              </div>
            ))}
          </div>

          {tokenData && (
            <button
              onClick={() => setShowShare(true)}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-lg transition-opacity hover:opacity-85"
              style={{ backgroundColor: 'rgba(241,245,249,0.07)', color: 'rgba(241,245,249,0.6)', border: '1px solid rgba(241,245,249,0.1)' }}
            >
              🔗 Parent Link
            </button>
          )}
          <button
            onClick={() => setAddModal({})}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg transition-opacity hover:opacity-85"
            style={{ backgroundColor: '#F7620A', color: '#fff' }}
          >
            + Add Event
          </button>
        </div>
      </div>

      {/* Toast */}
      {toastMsg && (
        <div className="mb-4 px-4 py-2.5 rounded-xl text-sm font-medium" style={{ backgroundColor: 'rgba(14,207,176,0.1)', color: EVENT_COLORS.practice, border: `1px solid ${EVENT_COLORS.practice}30` }}>
          {toastMsg}
        </div>
      )}

      {/* Calendar grid or empty state */}
      {events.length === 0 ? (
        <EmptyMonth
          monthName={`${MONTH_NAMES[month - 1]} ${year}`}
          onAdd={type => setAddModal({ type })}
        />
      ) : (
        <CalendarGrid
          year={year}
          month={month}
          events={events}
          onDaySelect={(dateStr, evs) => setSelectedDay({ date: dateStr, events: evs })}
        />
      )}

      {/* Day detail popover */}
      {selectedDay && (
        <DayDetailPopover
          dateStr={selectedDay.date}
          events={selectedDay.events}
          onClose={() => setSelectedDay(null)}
          onUnschedule={handleUnschedule}
          onDeleteOther={handleDeleteOther}
        />
      )}

      {/* Add event modal */}
      {addModal !== null && (
        <AddEventModal
          defaultDate={addModal.date}
          defaultType={addModal.type}
          onClose={() => setAddModal(null)}
        />
      )}

      {/* Parent Link modal */}
      {showShare && tokenData && (
        <ShareLinkModal token={tokenData.token} url={tokenData.url} onClose={() => setShowShare(false)} />
      )}
    </div>
  )
}

// ── Page export (Suspense required for useSearchParams) ───────────────────────
export default function CalendarPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-20">
        <p className="text-sm" style={{ color: 'rgba(241,245,249,0.35)' }}>Loading calendar...</p>
      </div>
    }>
      <CalendarPageInner />
    </Suspense>
  )
}
