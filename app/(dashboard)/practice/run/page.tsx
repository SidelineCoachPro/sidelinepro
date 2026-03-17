'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { usePracticePlan } from '@/hooks/usePracticePlans'
import { drills as staticDrills } from '@/data/drills'
import { useCustomDrills } from '@/hooks/useCustomDrills'

// ── Helpers ─────────────────────────────────────────────────────────────────
function formatTime(secs: number) {
  const m = Math.floor(secs / 60)
  const s = secs % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function getCategoryColor(category: string) {
  const map: Record<string, string> = {
    ballhandling: '#F7620A',
    shooting: '#38BDF8',
    passing: '#F5B731',
    defense: '#22C55E',
    conditioning: '#E879F9',
    team: '#8B5CF6',
    break: '#6B7280',
  }
  return map[category] ?? '#6B7280'
}

// ── Inner component (needs useSearchParams) ──────────────────────────────────
function RunInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const planId = searchParams.get('id')

  const { data: plan, isLoading } = usePracticePlan(planId)
  const { data: customDrillRows = [] } = useCustomDrills()

  const [currentIndex, setCurrentIndex] = useState(0)
  const [timeLeft, setTimeLeft] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [isFinished, setIsFinished] = useState(false)

  const drills = plan?.drills ?? []
  const current = drills[currentIndex]

  // Reset timer when drill changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (current) {
      setTimeLeft(current.durationMins * 60)
      setIsRunning(true)
      setIsFinished(false)
    }
  }, [currentIndex, current?.uid])

  // Countdown
  useEffect(() => {
    if (!isRunning || timeLeft <= 0) return
    const id = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(id)
          setIsRunning(false)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [isRunning, timeLeft])

  // Look up full drill data for cues
  const allDrillsMap = useCallback(() => {
    const map = new Map()
    for (const d of staticDrills) map.set(d.id, d)
    for (const d of customDrillRows) map.set(d.id, d)
    return map
  }, [customDrillRows])

  const drillData = current ? allDrillsMap().get(current.drillId) : null
  const cues: string[] = drillData?.cues ?? []

  function goNext() {
    if (currentIndex < drills.length - 1) {
      setCurrentIndex(i => i + 1)
    } else {
      setIsFinished(true)
      setIsRunning(false)
    }
  }

  function goPrev() {
    if (currentIndex > 0) setCurrentIndex(i => i - 1)
  }

  // ── Loading ──────────────────────────────────────────────────────────────
  if (!planId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-sp-text text-lg font-semibold">No practice plan selected</p>
        <button
          onClick={() => router.push('/practice/planner')}
          className="px-5 py-2 text-sm font-semibold rounded-lg transition-opacity hover:opacity-85"
          style={{ backgroundColor: '#F7620A', color: '#fff' }}
        >
          Go to Planner
        </button>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p style={{ color: 'rgba(241,245,249,0.4)' }}>Loading practice plan...</p>
      </div>
    )
  }

  if (!plan) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-sp-text">Practice plan not found</p>
        <button
          onClick={() => router.push('/practice/planner')}
          className="px-5 py-2 text-sm font-semibold rounded-lg"
          style={{ backgroundColor: '#F7620A', color: '#fff' }}
        >
          Back to Planner
        </button>
      </div>
    )
  }

  // ── Finished state ──────────────────────────────────────────────────────
  if (isFinished) {
    const totalMins = drills.reduce((s, d) => s + d.durationMins, 0)
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center">
        <div
          className="text-6xl w-24 h-24 rounded-full flex items-center justify-center"
          style={{ backgroundColor: 'rgba(34,197,94,0.15)' }}
        >
          🏆
        </div>
        <div>
          <h2 className="text-3xl font-bold text-sp-text mb-2">Practice Complete!</h2>
          <p style={{ color: 'rgba(241,245,249,0.5)' }}>
            {plan.name} · {drills.length} drills · {totalMins} min
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => { setCurrentIndex(0); setIsFinished(false) }}
            className="px-5 py-2.5 text-sm font-semibold rounded-lg transition-colors"
            style={{
              backgroundColor: 'rgba(241,245,249,0.06)',
              color: 'rgba(241,245,249,0.7)',
              border: '1px solid rgba(241,245,249,0.1)',
            }}
          >
            Run Again
          </button>
          <button
            onClick={() => router.push('/practice/planner')}
            className="px-5 py-2.5 text-sm font-semibold rounded-lg transition-opacity hover:opacity-85"
            style={{ backgroundColor: '#F7620A', color: '#fff' }}
          >
            Back to Planner
          </button>
        </div>
      </div>
    )
  }

  if (!current) return null

  const isBreak = current.category === 'break'
  const categoryColor = getCategoryColor(current.category)
  const progress = drills.length > 0 ? ((currentIndex + 1) / drills.length) * 100 : 0
  const timerPct = current.durationMins > 0 ? (timeLeft / (current.durationMins * 60)) * 100 : 0

  return (
    <div className="max-w-2xl mx-auto">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-sp-text">{plan.name}</h1>
          <p className="text-sm mt-0.5" style={{ color: 'rgba(241,245,249,0.4)' }}>
            Drill {currentIndex + 1} of {drills.length}
          </p>
        </div>
        <button
          onClick={() => router.push('/practice/planner')}
          className="text-sm transition-opacity hover:opacity-60"
          style={{ color: 'rgba(241,245,249,0.4)' }}
        >
          ✕ End Practice
        </button>
      </div>

      {/* Overall progress bar */}
      <div
        className="w-full h-1.5 rounded-full mb-6 overflow-hidden"
        style={{ backgroundColor: 'rgba(241,245,249,0.08)' }}
      >
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${progress}%`, backgroundColor: '#F7620A' }}
        />
      </div>

      {/* Main card */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ backgroundColor: '#0E1520', border: '1px solid rgba(241,245,249,0.07)' }}
      >
        {/* Color bar */}
        <div className="h-1.5" style={{ backgroundColor: categoryColor }} />

        <div className="px-6 py-6">
          {/* Category tag */}
          {!isBreak && (
            <p
              className="text-xs font-semibold uppercase tracking-wide mb-2"
              style={{ color: categoryColor }}
            >
              {current.category}
            </p>
          )}

          {/* Drill name */}
          <h2 className="text-3xl font-bold text-sp-text mb-1">{current.name}</h2>

          {/* Coach notes */}
          {current.notes && (
            <p className="text-sm mb-4" style={{ color: 'rgba(241,245,249,0.5)' }}>
              {current.notes}
            </p>
          )}

          {/* Timer */}
          <div className="flex flex-col items-center py-8">
            {/* Circular timer visual */}
            <div className="relative mb-4">
              <svg width="160" height="160" className="-rotate-90">
                <circle
                  cx="80" cy="80" r="70"
                  fill="none"
                  stroke="rgba(241,245,249,0.07)"
                  strokeWidth="8"
                />
                <circle
                  cx="80" cy="80" r="70"
                  fill="none"
                  stroke={timeLeft === 0 ? '#22C55E' : categoryColor}
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 70}`}
                  strokeDashoffset={`${2 * Math.PI * 70 * (1 - timerPct / 100)}`}
                  style={{ transition: 'stroke-dashoffset 1s linear' }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span
                  className="text-4xl font-bold tabular-nums"
                  style={{ color: timeLeft === 0 ? '#22C55E' : '#F1F5F9' }}
                >
                  {formatTime(timeLeft)}
                </span>
                <span className="text-xs mt-1" style={{ color: 'rgba(241,245,249,0.4)' }}>
                  {current.durationMins} min
                </span>
              </div>
            </div>

            {/* Timer controls */}
            <div className="flex items-center gap-3">
              <button
                onClick={goPrev}
                disabled={currentIndex === 0}
                className="px-4 py-2 text-sm font-medium rounded-lg disabled:opacity-30 transition-colors"
                style={{
                  backgroundColor: 'rgba(241,245,249,0.06)',
                  color: 'rgba(241,245,249,0.6)',
                  border: '1px solid rgba(241,245,249,0.1)',
                }}
              >
                ← Prev
              </button>

              <button
                onClick={() => setIsRunning(r => !r)}
                className="px-6 py-2.5 text-sm font-bold rounded-lg transition-opacity hover:opacity-85 min-w-24"
                style={{ backgroundColor: isRunning ? 'rgba(241,245,249,0.1)' : '#F7620A', color: '#fff' }}
              >
                {isRunning ? '⏸ Pause' : '▶ Resume'}
              </button>

              <button
                onClick={goNext}
                className="px-4 py-2 text-sm font-medium rounded-lg transition-opacity hover:opacity-85"
                style={{ backgroundColor: '#F7620A', color: '#fff' }}
              >
                Next →
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Coaching cues */}
      {cues.length > 0 && (
        <div
          className="mt-4 rounded-xl px-5 py-4"
          style={{ backgroundColor: '#0E1520', border: '1px solid rgba(241,245,249,0.07)' }}
        >
          <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'rgba(241,245,249,0.35)' }}>
            Coaching Cues
          </p>
          <ul className="space-y-2">
            {cues.map((cue, i) => (
              <li key={i} className="flex items-start gap-2 text-sm" style={{ color: 'rgba(241,245,249,0.7)' }}>
                <span style={{ color: categoryColor, flexShrink: 0 }}>→</span>
                {cue}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Drill queue */}
      {drills.length > 1 && (
        <div
          className="mt-4 rounded-xl px-5 py-4"
          style={{ backgroundColor: '#0E1520', border: '1px solid rgba(241,245,249,0.07)' }}
        >
          <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'rgba(241,245,249,0.35)' }}>
            Up Next
          </p>
          <div className="space-y-1.5">
            {drills.slice(currentIndex + 1, currentIndex + 4).map((d) => (
              <div key={d.uid} className="flex items-center gap-3">
                <div
                  className="w-1.5 h-5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: getCategoryColor(d.category) }}
                />
                <p className="text-sm flex-1 truncate" style={{ color: 'rgba(241,245,249,0.5)' }}>
                  {d.name}
                </p>
                <span className="text-xs flex-shrink-0" style={{ color: 'rgba(241,245,249,0.3)' }}>
                  {d.durationMins}m
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Page export (wrapped in Suspense for useSearchParams) ────────────────────
export default function RunPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[60vh]">
        <p style={{ color: 'rgba(241,245,249,0.4)' }}>Loading...</p>
      </div>
    }>
      <RunInner />
    </Suspense>
  )
}
