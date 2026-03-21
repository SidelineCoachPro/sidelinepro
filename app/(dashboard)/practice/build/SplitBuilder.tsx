'use client'

import { useState } from 'react'
import {
  DndContext, closestCenter, DragEndEvent, PointerSensor, useSensor, useSensors,
} from '@dnd-kit/core'
import {
  SortableContext, verticalListSortingStrategy, arrayMove, useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { type PlanDrill } from '@/hooks/usePracticePlans'
import { drills, CATEGORY_COLORS, CATEGORY_LABELS } from '@/data/drills'
import { practiceGames, GAME_CATEGORY_COLORS } from '@/data/practiceGames'
import { PLAYS, PLAY_CATEGORY_COLORS, PLAY_CATEGORY_LABELS } from '@/data/plays'

/* ── icons ─────────────────────────────────────────────────────────────────── */
function GripIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="9" cy="6" r="1.5" /><circle cx="15" cy="6" r="1.5" />
      <circle cx="9" cy="12" r="1.5" /><circle cx="15" cy="12" r="1.5" />
      <circle cx="9" cy="18" r="1.5" /><circle cx="15" cy="18" r="1.5" />
    </svg>
  )
}

/* ── SortableItem ───────────────────────────────────────────────────────────── */
function SortableItem({
  item,
  onRemove,
  onDurationChange,
}: {
  item: PlanDrill
  onRemove: () => void
  onDurationChange: (m: number) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.uid })

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1, border: '1px solid rgba(241,245,249,0.06)' }}
      className="flex items-center gap-2 px-3 py-2.5 rounded-lg"
      {...attributes}
    >
      <div className="w-0.5 self-stretch rounded-full flex-shrink-0" style={{ backgroundColor: item.categoryColor }} />
      <button {...listeners} className="cursor-grab active:cursor-grabbing flex-shrink-0" style={{ color: 'rgba(241,245,249,0.2)', touchAction: 'none' }}>
        <GripIcon />
      </button>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          {item.drillId?.startsWith('game-') && (
            <span className="text-xs px-1 py-0.5 rounded font-bold" style={{ backgroundColor: 'rgba(14,207,176,0.15)', color: '#0ECFB0' }}>GAME</span>
          )}
          {item.drillId?.startsWith('play-') && (
            <span className="text-xs px-1 py-0.5 rounded font-bold" style={{ backgroundColor: 'rgba(58,134,255,0.15)', color: '#3A86FF' }}>PLAY</span>
          )}
          <span className="text-sm font-medium text-sp-text truncate">{item.name}</span>
        </div>
        <span className="text-xs" style={{ color: 'rgba(241,245,249,0.35)' }}>
          {CATEGORY_LABELS[item.category] ?? item.category}
        </span>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        <input
          type="number" min={1} max={60}
          value={item.durationMins}
          onChange={e => onDurationChange(Math.max(1, parseInt(e.target.value) || 1))}
          className="w-10 text-center text-sm rounded-md"
          style={{ backgroundColor: 'rgba(241,245,249,0.07)', border: '1px solid rgba(241,245,249,0.1)', color: '#F1F5F9', padding: '3px 4px', outline: 'none' }}
        />
        <span className="text-xs" style={{ color: 'rgba(241,245,249,0.3)' }}>m</span>
      </div>
      <button onClick={onRemove} className="text-xs hover:opacity-60 transition-opacity flex-shrink-0" style={{ color: 'rgba(241,245,249,0.3)' }}>✕</button>
    </div>
  )
}

/* ── Library tabs ───────────────────────────────────────────────────────────── */
type LibTab = 'drills' | 'games' | 'plays' | 'ai'

function DrillsTab({ onAdd }: { onAdd: (item: PlanDrill) => void }) {
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
  const filtered = drills.filter(d => {
    if (cat !== 'all' && d.category !== cat) return false
    if (search.trim()) return d.name.toLowerCase().includes(search.toLowerCase())
    return true
  })
  return (
    <div className="flex flex-col gap-2 h-full">
      <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search drills…" className="sp-input text-sm flex-shrink-0" style={{ padding: '7px 10px' }} />
      <div className="flex flex-wrap gap-1 flex-shrink-0">
        {cats.map(c => (
          <button key={c.key} onClick={() => setCat(c.key)}
            className="text-xs px-2.5 py-1 rounded-full transition-all"
            style={{ backgroundColor: cat === c.key ? '#F7620A' : 'rgba(241,245,249,0.06)', color: cat === c.key ? '#fff' : 'rgba(241,245,249,0.45)', border: `1px solid ${cat === c.key ? '#F7620A' : 'rgba(241,245,249,0.08)'}` }}
          >{c.label}</button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto space-y-1">
        {filtered.map(d => (
          <button key={d.id} onClick={() => onAdd({ uid: crypto.randomUUID(), drillId: d.id, name: d.name, category: d.category, categoryColor: d.categoryColor, durationMins: d.durationMins })}
            className="w-full text-left px-3 py-2 rounded-lg transition-colors hover:bg-white/5 flex items-center gap-2"
            style={{ border: '1px solid rgba(241,245,249,0.06)' }}
          >
            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: CATEGORY_COLORS[d.category] ?? '#6B7280' }} />
            <span className="text-sm text-sp-text flex-1 truncate">{d.name}</span>
            <span className="text-xs flex-shrink-0" style={{ color: 'rgba(241,245,249,0.3)' }}>{d.durationMins}m</span>
            <span className="text-xs flex-shrink-0" style={{ color: '#F7620A' }}>+</span>
          </button>
        ))}
        {filtered.length === 0 && <p className="text-xs text-center py-8" style={{ color: 'rgba(241,245,249,0.25)' }}>No drills found</p>}
      </div>
    </div>
  )
}

function GamesTab({ onAdd }: { onAdd: (item: PlanDrill) => void }) {
  const [search, setSearch] = useState('')
  const filtered = practiceGames.filter(g => !search.trim() || g.name.toLowerCase().includes(search.toLowerCase()))
  return (
    <div className="flex flex-col gap-2 h-full">
      <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search games…" className="sp-input text-sm flex-shrink-0" style={{ padding: '7px 10px' }} />
      <div className="flex-1 overflow-y-auto space-y-1">
        {filtered.map(g => (
          <button key={g.id} onClick={() => onAdd({ uid: crypto.randomUUID(), drillId: `game-${g.id}`, name: g.name, category: g.category, categoryColor: g.categoryColor, durationMins: g.durationMins })}
            className="w-full text-left px-3 py-2 rounded-lg transition-colors hover:bg-white/5 flex items-center gap-2"
            style={{ border: '1px solid rgba(241,245,249,0.06)' }}
          >
            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: GAME_CATEGORY_COLORS[g.category] ?? '#6B7280' }} />
            <span className="text-sm text-sp-text flex-1 truncate">{g.name}</span>
            <span className="text-xs flex-shrink-0" style={{ color: 'rgba(241,245,249,0.3)' }}>{g.durationMins}m</span>
            <span className="text-xs flex-shrink-0" style={{ color: '#0ECFB0' }}>+</span>
          </button>
        ))}
        {filtered.length === 0 && <p className="text-xs text-center py-8" style={{ color: 'rgba(241,245,249,0.25)' }}>No games found</p>}
      </div>
    </div>
  )
}

function PlaysTab({ onAdd }: { onAdd: (item: PlanDrill) => void }) {
  const [search, setSearch] = useState('')
  const filtered = PLAYS.filter(p => !search.trim() || p.name.toLowerCase().includes(search.toLowerCase()))
  return (
    <div className="flex flex-col gap-2 h-full">
      <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search plays…" className="sp-input text-sm flex-shrink-0" style={{ padding: '7px 10px' }} />
      <div className="flex-1 overflow-y-auto space-y-1">
        {filtered.map(p => (
          <button key={p.id} onClick={() => onAdd({ uid: crypto.randomUUID(), drillId: `play-${p.id}`, name: p.name, category: p.category, categoryColor: p.categoryColor, durationMins: p.suggestedDurationMins })}
            className="w-full text-left px-3 py-2 rounded-lg transition-colors hover:bg-white/5 flex items-center gap-2"
            style={{ border: '1px solid rgba(241,245,249,0.06)' }}
          >
            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: PLAY_CATEGORY_COLORS[p.category] ?? '#6B7280' }} />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-sp-text truncate">{p.name}</p>
              <p className="text-xs" style={{ color: 'rgba(241,245,249,0.3)' }}>{PLAY_CATEGORY_LABELS[p.category]}</p>
            </div>
            <span className="text-xs flex-shrink-0" style={{ color: 'rgba(241,245,249,0.3)' }}>{p.suggestedDurationMins}m</span>
            <span className="text-xs flex-shrink-0" style={{ color: '#3A86FF' }}>+</span>
          </button>
        ))}
        {filtered.length === 0 && <p className="text-xs text-center py-8" style={{ color: 'rgba(241,245,249,0.25)' }}>No plays found</p>}
      </div>
    </div>
  )
}

/* ── main SplitBuilder ───────────────────────────────────────────────────────── */
export interface SplitBuilderProps {
  initialName: string
  initialDate: string | null
  initialDrills: PlanDrill[]
  isSaving: boolean
  savedPlanId: string | null
  onSave: (name: string, date: string | null, items: PlanDrill[]) => void
  onStartRun?: () => void
  onBack: () => void
}

const FOCUS_OPTS = [
  'Ball Handling', 'Shooting', 'Passing', 'Defense', 'Conditioning', 'Team Play',
  'Transition', 'Special Situations',
]

export default function SplitBuilder({
  initialName,
  initialDate,
  initialDrills,
  isSaving,
  savedPlanId,
  onSave,
  onStartRun,
  onBack,
}: SplitBuilderProps) {
  const [name, setName] = useState(initialName)
  const [date, setDate] = useState(initialDate ?? '')
  const [items, setItems] = useState<PlanDrill[]>(initialDrills)
  const [focusAreas, setFocusAreas] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState<LibTab>('drills')
  const sensors = useSensors(useSensor(PointerSensor))

  const totalMins = items.reduce((s, d) => s + d.durationMins, 0)

  function handleDragEnd({ active, over }: DragEndEvent) {
    if (over && active.id !== over.id) {
      const oi = items.findIndex(x => x.uid === active.id)
      const ni = items.findIndex(x => x.uid === over.id)
      setItems(arrayMove(items, oi, ni))
    }
  }

  function addItem(item: PlanDrill) {
    setItems(prev => [...prev, item])
  }

  function toggleFocus(f: string) {
    setFocusAreas(prev => prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f])
  }

  const tabs: { key: LibTab; label: string }[] = [
    { key: 'drills', label: 'Drills' },
    { key: 'games',  label: 'Games' },
    { key: 'plays',  label: 'Plays' },
    { key: 'ai',     label: 'AI' },
  ]

  return (
    <div className="flex gap-0 h-full" style={{ minHeight: 'calc(100vh - 200px)' }}>
      {/* ── Left: plan editor (55%) ─────────────────────────────── */}
      <div className="flex flex-col" style={{ width: '55%', paddingRight: 20 }}>
        {/* breadcrumb */}
        <div className="flex items-center gap-2 mb-4">
          <button onClick={onBack} className="text-sm hover:opacity-70 transition-opacity" style={{ color: 'rgba(241,245,249,0.4)' }}>
            ← Practice
          </button>
          <span style={{ color: 'rgba(241,245,249,0.2)' }}>/</span>
          <span className="text-sm text-sp-text">{name || 'New Practice'}</span>
        </div>

        {/* plan name */}
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Practice name…"
          className="sp-input text-lg font-bold mb-3"
          style={{ padding: '10px 12px' }}
        />

        {/* date + duration row */}
        <div className="flex items-center gap-3 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs" style={{ color: 'rgba(241,245,249,0.4)' }}>Date</span>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="sp-input text-sm"
              style={{ padding: '6px 10px', colorScheme: 'dark' }}
            />
          </div>
          <div className="text-sm" style={{ color: 'rgba(241,245,249,0.4)' }}>
            {items.length} items · <span className="text-sp-text font-semibold">{totalMins} min</span>
          </div>
        </div>

        {/* focus areas */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {FOCUS_OPTS.map(f => (
            <button
              key={f}
              onClick={() => toggleFocus(f)}
              className="text-xs px-2.5 py-1 rounded-full transition-all"
              style={{
                backgroundColor: focusAreas.includes(f) ? 'rgba(247,98,10,0.2)' : 'rgba(241,245,249,0.06)',
                color: focusAreas.includes(f) ? '#F7620A' : 'rgba(241,245,249,0.4)',
                border: `1px solid ${focusAreas.includes(f) ? 'rgba(247,98,10,0.4)' : 'rgba(241,245,249,0.08)'}`,
              }}
            >
              {f}
            </button>
          ))}
        </div>

        {/* items list */}
        <div
          className="flex-1 overflow-y-auto rounded-xl"
          style={{ border: '1px solid rgba(241,245,249,0.07)', backgroundColor: '#0E1520', minHeight: 200 }}
        >
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <p className="text-sm" style={{ color: 'rgba(241,245,249,0.25)' }}>
                Add drills, games, or plays from the library →
              </p>
            </div>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={items.map(d => d.uid)} strategy={verticalListSortingStrategy}>
                <div className="p-2 space-y-1">
                  {items.map(item => (
                    <SortableItem
                      key={item.uid}
                      item={item}
                      onRemove={() => setItems(prev => prev.filter(d => d.uid !== item.uid))}
                      onDurationChange={m => setItems(prev => prev.map(d => d.uid === item.uid ? { ...d, durationMins: m } : d))}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>

        {/* add water break */}
        <button
          onClick={() => addItem({ uid: crypto.randomUUID(), drillId: 'break', name: 'Water Break', category: 'break', categoryColor: '#6B7280', durationMins: 3 })}
          className="mt-2 text-xs px-3 py-1.5 rounded-lg self-start transition-colors hover:opacity-70"
          style={{ backgroundColor: 'rgba(241,245,249,0.06)', color: 'rgba(241,245,249,0.45)', border: '1px solid rgba(241,245,249,0.08)' }}
        >
          + Water Break
        </button>

        {/* footer actions */}
        <div className="flex items-center justify-between mt-4 pt-4" style={{ borderTop: '1px solid rgba(241,245,249,0.07)' }}>
          {savedPlanId && onStartRun ? (
            <button
              onClick={onStartRun}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-opacity hover:opacity-85"
              style={{ backgroundColor: '#22C55E', color: '#fff' }}
            >
              ▶ Start Practice
            </button>
          ) : <div />}
          <button
            onClick={() => onSave(name, date || null, items)}
            disabled={isSaving || !name.trim()}
            className="px-5 py-2 text-sm font-semibold rounded-lg disabled:opacity-50 transition-opacity hover:opacity-85"
            style={{ backgroundColor: '#F7620A', color: '#fff' }}
          >
            {isSaving ? 'Saving…' : savedPlanId ? '✓ Save Changes' : 'Save Plan'}
          </button>
        </div>
      </div>

      {/* ── Right: library (45%) ────────────────────────────────── */}
      <div
        className="flex flex-col flex-shrink-0 rounded-xl overflow-hidden"
        style={{ width: 'calc(45% - 20px)', border: '1px solid rgba(241,245,249,0.07)', backgroundColor: '#0A1019' }}
      >
        {/* tab bar */}
        <div className="flex flex-shrink-0" style={{ borderBottom: '1px solid rgba(241,245,249,0.07)' }}>
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className="flex-1 py-3 text-sm font-medium transition-all"
              style={{
                backgroundColor: activeTab === t.key ? 'rgba(247,98,10,0.1)' : 'transparent',
                color: activeTab === t.key ? '#F7620A' : 'rgba(241,245,249,0.4)',
                borderBottom: activeTab === t.key ? '2px solid #F7620A' : '2px solid transparent',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* tab content */}
        <div className="flex-1 overflow-hidden p-3">
          {activeTab === 'drills' && <DrillsTab onAdd={addItem} />}
          {activeTab === 'games' && <GamesTab onAdd={addItem} />}
          {activeTab === 'plays' && <PlaysTab onAdd={addItem} />}
          {activeTab === 'ai' && (
            <div className="flex flex-col items-center justify-center h-full text-center px-6">
              <div className="text-3xl mb-3">🤖</div>
              <p className="text-sm font-semibold text-sp-text mb-2">AI Practice Builder</p>
              <p className="text-xs" style={{ color: 'rgba(241,245,249,0.35)' }}>
                Use the Season Plan generator to create full AI-generated practices. In-builder AI suggestions coming soon.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
