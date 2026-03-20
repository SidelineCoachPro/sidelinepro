'use client'

import { useState } from 'react'
import {
  DndContext,
  closestCenter,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { type PlanDrill } from '@/hooks/usePracticePlans'
import { type Drill, CATEGORY_COLORS, CATEGORY_LABELS } from '@/data/drills'

// ── Drag handle icon ────────────────────────────────────────────────────────
function GripIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="9" cy="6" r="1.5" />
      <circle cx="15" cy="6" r="1.5" />
      <circle cx="9" cy="12" r="1.5" />
      <circle cx="15" cy="12" r="1.5" />
      <circle cx="9" cy="18" r="1.5" />
      <circle cx="15" cy="18" r="1.5" />
    </svg>
  )
}

// ── Sortable plan item ──────────────────────────────────────────────────────
function SortableItem({
  item,
  onRemove,
  onDurationChange,
  onNotesChange,
}: {
  item: PlanDrill
  onRemove: () => void
  onDurationChange: (mins: number) => void
  onNotesChange: (notes: string) => void
}) {
  const [showNotes, setShowNotes] = useState(false)
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.uid })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const isBreak = item.category === 'break'

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-start gap-3 px-4 py-3 rounded-xl"
      {...attributes}
      css-data-drag={isDragging ? 'true' : undefined}
    >
      {/* color bar */}
      <div
        className="w-1 self-stretch rounded-full flex-shrink-0"
        style={{ backgroundColor: item.categoryColor }}
      />

      {/* drag handle */}
      <button
        {...listeners}
        className="mt-1 cursor-grab active:cursor-grabbing flex-shrink-0"
        style={{ color: 'rgba(241,245,249,0.25)', touchAction: 'none' }}
        title="Drag to reorder"
      >
        <GripIcon />
      </button>

      {/* content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-sp-text truncate flex items-center gap-1.5">
                  {item.drillId?.startsWith('game-') && (
                    <span className="flex-shrink-0 text-xs" title="Practice Game">🎮</span>
                  )}
                  {item.name}
                </p>
            {!isBreak && (
              <p className="text-xs mt-0.5" style={{ color: 'rgba(241,245,249,0.4)' }}>
                {CATEGORY_LABELS[item.category] ?? item.category}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {/* duration */}
            <div className="flex items-center gap-1">
              <input
                type="number"
                min={1}
                max={60}
                value={item.durationMins}
                onChange={e => onDurationChange(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-12 text-center text-sm rounded-lg"
                style={{
                  backgroundColor: 'rgba(241,245,249,0.07)',
                  border: '1px solid rgba(241,245,249,0.1)',
                  color: '#F1F5F9',
                  padding: '4px 6px',
                  outline: 'none',
                }}
              />
              <span className="text-xs" style={{ color: 'rgba(241,245,249,0.4)' }}>min</span>
            </div>

            {/* notes toggle */}
            {!isBreak && (
              <button
                onClick={() => setShowNotes(v => !v)}
                className="text-xs px-2 py-1 rounded-lg transition-colors"
                style={{
                  backgroundColor: showNotes ? 'rgba(247,98,10,0.15)' : 'rgba(241,245,249,0.06)',
                  color: showNotes ? '#F7620A' : 'rgba(241,245,249,0.4)',
                  border: `1px solid ${showNotes ? 'rgba(247,98,10,0.3)' : 'rgba(241,245,249,0.08)'}`,
                }}
                title="Coaching notes"
              >
                📝
              </button>
            )}

            {/* remove */}
            <button
              onClick={onRemove}
              className="text-sm rounded-lg transition-opacity hover:opacity-60"
              style={{ color: 'rgba(241,245,249,0.3)', padding: '4px 6px' }}
              title="Remove"
            >
              ✕
            </button>
          </div>
        </div>

        {/* notes field */}
        {showNotes && (
          <textarea
            value={item.notes ?? ''}
            onChange={e => onNotesChange(e.target.value)}
            placeholder="Coaching notes for this drill..."
            rows={2}
            className="sp-input mt-2 text-xs"
            style={{ resize: 'vertical' }}
          />
        )}
      </div>
    </div>
  )
}

// ── Drill picker sidebar ─────────────────────────────────────────────────────
function DrillPicker({
  allDrills,
  onAdd,
  onClose,
}: {
  allDrills: Drill[]
  onAdd: (drill: Drill) => void
  onClose: () => void
}) {
  const [search, setSearch] = useState('')
  const [cat, setCat] = useState('all')

  const cats = [
    { key: 'all', label: 'All' },
    { key: 'ballhandling', label: 'Ball' },
    { key: 'shooting', label: 'Shoot' },
    { key: 'passing', label: 'Pass' },
    { key: 'defense', label: 'Defense' },
    { key: 'conditioning', label: 'Cond.' },
    { key: 'team', label: 'Team' },
  ]

  const filtered = allDrills.filter(d => {
    if (cat !== 'all' && d.category !== cat) return false
    if (search.trim()) {
      const s = search.toLowerCase()
      return d.name.toLowerCase().includes(s) || d.category.toLowerCase().includes(s)
    }
    return true
  })

  return (
    <div
      className="flex flex-col h-full"
      style={{
        backgroundColor: '#0E1520',
        border: '1px solid rgba(241,245,249,0.07)',
        borderRadius: 12,
      }}
    >
      {/* header */}
      <div
        className="flex items-center justify-between px-4 py-3 flex-shrink-0"
        style={{ borderBottom: '1px solid rgba(241,245,249,0.07)' }}
      >
        <p className="text-sm font-semibold text-sp-text">Add Drills</p>
        <button onClick={onClose} style={{ color: 'rgba(241,245,249,0.4)' }} className="hover:opacity-60 transition-opacity">✕</button>
      </div>

      {/* search */}
      <div className="px-3 pt-3 pb-2 flex-shrink-0">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search drills..."
          className="sp-input text-sm"
          style={{ padding: '8px 10px' }}
        />
      </div>

      {/* category pills */}
      <div className="flex flex-wrap gap-1.5 px-3 pb-2 flex-shrink-0">
        {cats.map(c => (
          <button
            key={c.key}
            onClick={() => setCat(c.key)}
            className="text-xs px-2.5 py-1 rounded-full transition-all"
            style={{
              backgroundColor: cat === c.key ? '#F7620A' : 'rgba(241,245,249,0.06)',
              color: cat === c.key ? '#fff' : 'rgba(241,245,249,0.45)',
              border: `1px solid ${cat === c.key ? '#F7620A' : 'rgba(241,245,249,0.08)'}`,
            }}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* drill list */}
      <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-1.5">
        {filtered.map(drill => (
          <button
            key={drill.id}
            onClick={() => onAdd(drill)}
            className="w-full text-left px-3 py-2.5 rounded-lg transition-colors hover:bg-white/5"
            style={{ border: '1px solid rgba(241,245,249,0.06)' }}
          >
            <div className="flex items-center gap-2">
              <div
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: CATEGORY_COLORS[drill.category] ?? '#6B7280' }}
              />
              <p className="text-sm font-medium text-sp-text truncate flex-1">{drill.name}</p>
              <span className="text-xs flex-shrink-0" style={{ color: 'rgba(241,245,249,0.35)' }}>
                {drill.durationMins}m
              </span>
            </div>
          </button>
        ))}
        {filtered.length === 0 && (
          <p className="text-xs text-center py-6" style={{ color: 'rgba(241,245,249,0.3)' }}>No drills found</p>
        )}
      </div>
    </div>
  )
}

// ── Main PlanBuilder ────────────────────────────────────────────────────────
interface Props {
  planName: string
  planDrills: PlanDrill[]
  allDrills: Drill[]
  isSaving: boolean
  onDrillsChange: (drills: PlanDrill[]) => void
  onSave: () => void
  onStartRun: () => void
  savedPlanId: string | null
}

export default function PlanBuilder({
  planName,
  planDrills,
  allDrills,
  isSaving,
  onDrillsChange,
  onSave,
  onStartRun,
  savedPlanId,
}: Props) {
  const [showPicker, setShowPicker] = useState(false)
  const sensors = useSensors(useSensor(PointerSensor))

  const totalMins = planDrills.reduce((sum, d) => sum + d.durationMins, 0)

  function handleDragEnd({ active, over }: DragEndEvent) {
    if (over && active.id !== over.id) {
      const oi = planDrills.findIndex(x => x.uid === active.id)
      const ni = planDrills.findIndex(x => x.uid === over.id)
      onDrillsChange(arrayMove(planDrills, oi, ni))
    }
  }

  function addDrill(drill: Drill) {
    const item: PlanDrill = {
      uid: crypto.randomUUID(),
      drillId: drill.id,
      name: drill.name,
      category: drill.category,
      categoryColor: drill.categoryColor,
      durationMins: drill.durationMins,
    }
    onDrillsChange([...planDrills, item])
  }

  function addBreak() {
    onDrillsChange([
      ...planDrills,
      {
        uid: crypto.randomUUID(),
        drillId: 'break',
        name: 'Water Break',
        category: 'break',
        categoryColor: '#6B7280',
        durationMins: 3,
      },
    ])
  }

  function removeDrill(uid: string) {
    onDrillsChange(planDrills.filter(d => d.uid !== uid))
  }

  function updateDuration(uid: string, mins: number) {
    onDrillsChange(planDrills.map(d => d.uid === uid ? { ...d, durationMins: mins } : d))
  }

  function updateNotes(uid: string, notes: string) {
    onDrillsChange(planDrills.map(d => d.uid === uid ? { ...d, notes } : d))
  }

  return (
    <div className="flex gap-4 h-full">
      {/* ── Plan list ─────────────────────────────────────────── */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* header row */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-sp-text">{planName}</h2>
            <p className="text-sm mt-0.5" style={{ color: 'rgba(241,245,249,0.4)' }}>
              {planDrills.length} drills · {totalMins} min total
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={addBreak}
              className="text-sm px-3 py-1.5 rounded-lg transition-colors"
              style={{
                backgroundColor: 'rgba(241,245,249,0.06)',
                color: 'rgba(241,245,249,0.6)',
                border: '1px solid rgba(241,245,249,0.08)',
              }}
            >
              + Water Break
            </button>
            <button
              onClick={() => setShowPicker(v => !v)}
              className="text-sm px-3 py-1.5 rounded-lg transition-opacity hover:opacity-85"
              style={{ backgroundColor: 'rgba(247,98,10,0.15)', color: '#F7620A', border: '1px solid rgba(247,98,10,0.3)' }}
            >
              + Add Drill
            </button>
          </div>
        </div>

        {/* drills */}
        <div
          className="flex-1 overflow-y-auto rounded-xl space-y-1"
          style={{ border: '1px solid rgba(241,245,249,0.07)', backgroundColor: '#0E1520' }}
        >
          {planDrills.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <p className="text-sm" style={{ color: 'rgba(241,245,249,0.3)' }}>
                No drills yet — add some from the panel →
              </p>
            </div>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={planDrills.map(d => d.uid)} strategy={verticalListSortingStrategy}>
                {planDrills.map(item => (
                  <SortableItem
                    key={item.uid}
                    item={item}
                    onRemove={() => removeDrill(item.uid)}
                    onDurationChange={m => updateDuration(item.uid, m)}
                    onNotesChange={n => updateNotes(item.uid, n)}
                  />
                ))}
              </SortableContext>
            </DndContext>
          )}
        </div>

        {/* footer actions */}
        <div className="flex items-center justify-between mt-4">
          <div />
          <div className="flex items-center gap-3">
            {savedPlanId && (
              <button
                onClick={onStartRun}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg transition-opacity hover:opacity-85"
                style={{ backgroundColor: '#22C55E', color: '#fff' }}
              >
                ▶ Start Practice
              </button>
            )}
            <button
              onClick={onSave}
              disabled={isSaving || planDrills.length === 0}
              className="px-5 py-2 text-sm font-semibold rounded-lg disabled:opacity-50 transition-opacity hover:opacity-85"
              style={{ backgroundColor: '#F7620A', color: '#fff' }}
            >
              {isSaving ? 'Saving...' : savedPlanId ? '✓ Saved' : 'Save Plan'}
            </button>
          </div>
        </div>
      </div>

      {/* ── Drill picker ─────────────────────────────────────── */}
      {showPicker && (
        <div className="w-72 flex-shrink-0" style={{ height: 'calc(100vh - 180px)' }}>
          <DrillPicker
            allDrills={allDrills}
            onAdd={drill => addDrill(drill)}
            onClose={() => setShowPicker(false)}
          />
        </div>
      )}
    </div>
  )
}
