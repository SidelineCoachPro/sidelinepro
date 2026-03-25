'use client'

import { useState } from 'react'
import {
  DndContext, closestCenter, DragEndEvent, PointerSensor, useSensor, useSensors,
} from '@dnd-kit/core'
import {
  SortableContext, verticalListSortingStrategy, arrayMove, useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { type PlanDrill, type PracticePlan } from '@/hooks/usePracticePlans'
import PracticePlanButton from '@/lib/pdf/PracticePlanButton'
import { drills, type Drill, CATEGORY_COLORS, CATEGORY_LABELS } from '@/data/drills'
import { practiceGames, type PracticeGame, GAME_CATEGORY_COLORS } from '@/data/practiceGames'
import { PLAYS, type Play, PLAY_CATEGORY_COLORS, PLAY_CATEGORY_LABELS } from '@/data/plays'
import PlayDiagram from '@/components/plays/PlayDiagram'

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

/* ── Detail lookup helper ───────────────────────────────────────────────────── */
type DetailItem =
  | { type: 'drill'; data: Drill }
  | { type: 'game'; data: PracticeGame }
  | { type: 'play'; data: Play }
  | null

function lookupDetail(drillId: string): DetailItem {
  if (drillId.startsWith('play-')) {
    const id = drillId.slice(5)
    const p = PLAYS.find(x => x.id === id)
    return p ? { type: 'play', data: p } : null
  }
  if (drillId.startsWith('game-')) {
    const id = drillId.slice(5)
    const g = practiceGames.find(x => x.id === id)
    return g ? { type: 'game', data: g } : null
  }
  const d = drills.find(x => x.id === drillId)
  return d ? { type: 'drill', data: d } : null
}

/* ── Detail Modal ────────────────────────────────────────────────────────────── */
function DetailModal({ detail, onClose }: { detail: DetailItem; onClose: () => void }) {
  if (!detail) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl p-6"
        style={{ backgroundColor: '#0E1520', border: '1px solid rgba(241,245,249,0.12)' }}
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full hover:opacity-60 transition-opacity"
          style={{ color: 'rgba(241,245,249,0.5)', backgroundColor: 'rgba(241,245,249,0.07)' }}
        >
          ✕
        </button>

        {detail.type === 'drill' && (
          <DrillDetail drill={detail.data} />
        )}
        {detail.type === 'game' && (
          <GameDetail game={detail.data} />
        )}
        {detail.type === 'play' && (
          <PlayDetail play={detail.data} />
        )}
      </div>
    </div>
  )
}

function DrillDetail({ drill }: { drill: Drill }) {
  return (
    <>
      <div className="flex items-start gap-3 mb-4 pr-8">
        <div className="w-3 h-3 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: drill.categoryColor }} />
        <div>
          <h2 className="text-lg font-bold text-sp-text">{drill.name}</h2>
          <div className="flex flex-wrap gap-2 mt-1">
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: `${drill.categoryColor}20`, color: drill.categoryColor }}>{CATEGORY_LABELS[drill.category] ?? drill.category}</span>
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(241,245,249,0.07)', color: 'rgba(241,245,249,0.5)' }}>{drill.level}</span>
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(241,245,249,0.07)', color: 'rgba(241,245,249,0.5)' }}>{drill.durationMins} min</span>
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(241,245,249,0.07)', color: 'rgba(241,245,249,0.5)' }}>{drill.playersNeeded}</span>
          </div>
        </div>
      </div>
      <p className="text-sm mb-4" style={{ color: 'rgba(241,245,249,0.7)' }}>{drill.description}</p>
      {drill.setup && (
        <Section label="Setup" text={drill.setup} />
      )}
      {drill.instructions && (
        <Section label="Instructions" text={drill.instructions} />
      )}
      {drill.cues.length > 0 && (
        <BulletSection label="Coaching Cues" items={drill.cues} color={drill.categoryColor} />
      )}
      {drill.progression && (
        <Section label="Progression" text={drill.progression} />
      )}
    </>
  )
}

function GameDetail({ game }: { game: PracticeGame }) {
  const color = GAME_CATEGORY_COLORS[game.category] ?? '#6B7280'
  return (
    <>
      <div className="flex items-start gap-3 mb-4 pr-8">
        <div className="w-3 h-3 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: color }} />
        <div>
          <span className="text-xs px-1.5 py-0.5 rounded font-bold mb-1 inline-block" style={{ backgroundColor: 'rgba(14,207,176,0.15)', color: '#0ECFB0' }}>GAME</span>
          <h2 className="text-lg font-bold text-sp-text">{game.name}</h2>
          <div className="flex flex-wrap gap-2 mt-1">
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: `${color}20`, color }}>{game.category}</span>
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(241,245,249,0.07)', color: 'rgba(241,245,249,0.5)' }}>{game.energyLevel} energy</span>
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(241,245,249,0.07)', color: 'rgba(241,245,249,0.5)' }}>{game.durationMins} min</span>
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(241,245,249,0.07)', color: 'rgba(241,245,249,0.5)' }}>{game.playersMin}–{game.playersMax} players</span>
          </div>
        </div>
      </div>
      <p className="text-sm mb-4" style={{ color: 'rgba(241,245,249,0.7)' }}>{game.description}</p>
      <Section label="Setup" text={game.setup} />
      <Section label="How to Play" text={game.howToPlay} />
      {game.coachingTips.length > 0 && (
        <BulletSection label="Coaching Tips" items={game.coachingTips} color={color} />
      )}
      {game.variations && game.variations.length > 0 && (
        <BulletSection label="Variations" items={game.variations} color="#6B7A99" />
      )}
    </>
  )
}

function PlayDetail({ play }: { play: Play }) {
  const diffLabel: Record<string, string> = { beg: 'Beginner', int: 'Intermediate', adv: 'Advanced' }
  return (
    <>
      <div className="flex items-start gap-3 mb-4 pr-8">
        <div className="w-3 h-3 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: play.categoryColor }} />
        <div>
          <span className="text-xs px-1.5 py-0.5 rounded font-bold mb-1 inline-block" style={{ backgroundColor: 'rgba(58,134,255,0.15)', color: '#3A86FF' }}>PLAY</span>
          <h2 className="text-lg font-bold text-sp-text">{play.name}</h2>
          <div className="flex flex-wrap gap-2 mt-1">
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: `${play.categoryColor}20`, color: play.categoryColor }}>{PLAY_CATEGORY_LABELS[play.category]}</span>
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(241,245,249,0.07)', color: 'rgba(241,245,249,0.5)' }}>{diffLabel[play.difficulty] ?? play.difficulty}</span>
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(241,245,249,0.07)', color: 'rgba(241,245,249,0.5)' }}>{play.suggestedDurationMins} min</span>
          </div>
        </div>
      </div>
      <div className="rounded-xl overflow-hidden mb-4" style={{ backgroundColor: '#0A1019', border: '1px solid rgba(241,245,249,0.07)' }}>
        <PlayDiagram
          agents={play.agents}
          ballStartX={play.ballStartX}
          ballStartY={play.ballStartY}
          ballEndX={play.ballEndX}
          ballEndY={play.ballEndY}
          width={280}
          height={193}
        />
      </div>
      <p className="text-sm mb-4" style={{ color: 'rgba(241,245,249,0.7)' }}>{play.description}</p>
      {play.steps.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'rgba(241,245,249,0.3)' }}>Steps</p>
          <div className="space-y-1.5">
            {play.steps.map(s => (
              <div key={s.step} className="flex gap-2.5 text-sm">
                <span className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold" style={{ backgroundColor: `${play.categoryColor}25`, color: play.categoryColor }}>{s.step}</span>
                <span style={{ color: 'rgba(241,245,249,0.7)' }}>{s.description}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {play.teachingKeys.length > 0 && (
        <BulletSection label="Teaching Keys" items={play.teachingKeys} color={play.categoryColor} />
      )}
    </>
  )
}

function Section({ label, text }: { label: string; text: string }) {
  return (
    <div className="mb-4">
      <p className="text-xs font-semibold uppercase tracking-widest mb-1.5" style={{ color: 'rgba(241,245,249,0.3)' }}>{label}</p>
      <p className="text-sm" style={{ color: 'rgba(241,245,249,0.65)' }}>{text}</p>
    </div>
  )
}

function BulletSection({ label, items, color }: { label: string; items: string[]; color: string }) {
  return (
    <div className="mb-4">
      <p className="text-xs font-semibold uppercase tracking-widest mb-1.5" style={{ color: 'rgba(241,245,249,0.3)' }}>{label}</p>
      <ul className="space-y-1">
        {items.map((item, i) => (
          <li key={i} className="flex gap-2 text-sm">
            <span className="flex-shrink-0 mt-1 w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
            <span style={{ color: 'rgba(241,245,249,0.65)' }}>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/* ── SortableItem ───────────────────────────────────────────────────────────── */
function SortableItem({
  item,
  onRemove,
  onDurationChange,
  onInfo,
}: {
  item: PlanDrill
  onRemove: () => void
  onDurationChange: (m: number) => void
  onInfo: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.uid })

  const isCustom = item.drillId?.startsWith('custom-')

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
      <button onClick={isCustom ? undefined : onInfo} className={`flex-1 min-w-0 text-left ${isCustom ? 'cursor-default' : 'group'}`} title={isCustom ? undefined : 'View details'}>
        <div className="flex items-center gap-1.5">
          {item.drillId?.startsWith('game-') && (
            <span className="text-xs px-1 py-0.5 rounded font-bold" style={{ backgroundColor: 'rgba(14,207,176,0.15)', color: '#0ECFB0' }}>GAME</span>
          )}
          {item.drillId?.startsWith('play-') && (
            <span className="text-xs px-1 py-0.5 rounded font-bold" style={{ backgroundColor: 'rgba(58,134,255,0.15)', color: '#3A86FF' }}>PLAY</span>
          )}
          {isCustom && (
            <span className="text-xs px-1 py-0.5 rounded font-bold" style={{ backgroundColor: 'rgba(139,92,246,0.15)', color: '#8B5CF6' }}>CUSTOM</span>
          )}
          <span className="text-sm font-medium text-sp-text truncate group-hover:text-orange-400 transition-colors">{item.name}</span>
          {!isCustom && <span className="text-xs opacity-0 group-hover:opacity-60 transition-opacity flex-shrink-0" style={{ color: '#F7620A' }}>ℹ</span>}
        </div>
        <span className="text-xs" style={{ color: 'rgba(241,245,249,0.35)' }}>
          {CATEGORY_LABELS[item.category] ?? item.category}
        </span>
      </button>
      <div className="flex items-center gap-1 flex-shrink-0">
        <input
          type="number" min={1} max={60}
          value={item.durationMins}
          onChange={e => onDurationChange(Math.max(1, parseInt(e.target.value) || 1))}
          className="w-12 text-center text-sm rounded-md"
          style={{ backgroundColor: 'rgba(241,245,249,0.07)', border: '1px solid rgba(241,245,249,0.1)', color: '#F1F5F9', padding: '5px 4px', outline: 'none' }}
        />
        <span className="text-xs" style={{ color: 'rgba(241,245,249,0.3)' }}>m</span>
      </div>
      <button onClick={onRemove} className="text-xs hover:opacity-60 transition-opacity flex-shrink-0" style={{ color: 'rgba(241,245,249,0.3)' }}>✕</button>
    </div>
  )
}

/* ── Library tabs ───────────────────────────────────────────────────────────── */
type LibTab = 'drills' | 'games' | 'plays' | 'ai'

function DrillsTab({ onAdd, onInfo }: { onAdd: (item: PlanDrill) => void; onInfo: (d: DetailItem) => void }) {
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
          <div key={d.id} className="flex items-center gap-1 rounded-lg" style={{ border: '1px solid rgba(241,245,249,0.06)' }}>
            <button onClick={() => onAdd({ uid: crypto.randomUUID(), drillId: d.id, name: d.name, category: d.category, categoryColor: d.categoryColor, durationMins: d.durationMins })}
              className="flex-1 text-left px-3 py-2 transition-colors hover:bg-white/5 flex items-center gap-2 min-w-0"
            >
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: CATEGORY_COLORS[d.category] ?? '#6B7280' }} />
              <span className="text-sm text-sp-text flex-1 truncate">{d.name}</span>
              <span className="text-xs flex-shrink-0" style={{ color: 'rgba(241,245,249,0.3)' }}>{d.durationMins}m</span>
              <span className="text-xs flex-shrink-0" style={{ color: '#F7620A' }}>+</span>
            </button>
            <button onClick={() => onInfo({ type: 'drill', data: d })} className="px-2 py-2 text-xs hover:opacity-80 transition-opacity flex-shrink-0" style={{ color: 'rgba(241,245,249,0.25)' }} title="Details">ℹ</button>
          </div>
        ))}
        {filtered.length === 0 && <p className="text-xs text-center py-8" style={{ color: 'rgba(241,245,249,0.25)' }}>No drills found</p>}
      </div>
    </div>
  )
}

function GamesTab({ onAdd, onInfo }: { onAdd: (item: PlanDrill) => void; onInfo: (d: DetailItem) => void }) {
  const [search, setSearch] = useState('')
  const filtered = practiceGames.filter(g => !search.trim() || g.name.toLowerCase().includes(search.toLowerCase()))
  return (
    <div className="flex flex-col gap-2 h-full">
      <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search games…" className="sp-input text-sm flex-shrink-0" style={{ padding: '7px 10px' }} />
      <div className="flex-1 overflow-y-auto space-y-1">
        {filtered.map(g => (
          <div key={g.id} className="flex items-center gap-1 rounded-lg" style={{ border: '1px solid rgba(241,245,249,0.06)' }}>
            <button onClick={() => onAdd({ uid: crypto.randomUUID(), drillId: `game-${g.id}`, name: g.name, category: g.category, categoryColor: g.categoryColor, durationMins: g.durationMins })}
              className="flex-1 text-left px-3 py-2 transition-colors hover:bg-white/5 flex items-center gap-2 min-w-0"
            >
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: GAME_CATEGORY_COLORS[g.category] ?? '#6B7280' }} />
              <span className="text-sm text-sp-text flex-1 truncate">{g.name}</span>
              <span className="text-xs flex-shrink-0" style={{ color: 'rgba(241,245,249,0.3)' }}>{g.durationMins}m</span>
              <span className="text-xs flex-shrink-0" style={{ color: '#0ECFB0' }}>+</span>
            </button>
            <button onClick={() => onInfo({ type: 'game', data: g })} className="px-2 py-2 text-xs hover:opacity-80 transition-opacity flex-shrink-0" style={{ color: 'rgba(241,245,249,0.25)' }} title="Details">ℹ</button>
          </div>
        ))}
        {filtered.length === 0 && <p className="text-xs text-center py-8" style={{ color: 'rgba(241,245,249,0.25)' }}>No games found</p>}
      </div>
    </div>
  )
}

function PlaysTab({ onAdd, onInfo }: { onAdd: (item: PlanDrill) => void; onInfo: (d: DetailItem) => void }) {
  const [search, setSearch] = useState('')
  const filtered = PLAYS.filter(p => !search.trim() || p.name.toLowerCase().includes(search.toLowerCase()))
  return (
    <div className="flex flex-col gap-2 h-full">
      <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search plays…" className="sp-input text-sm flex-shrink-0" style={{ padding: '7px 10px' }} />
      <div className="flex-1 overflow-y-auto space-y-1">
        {filtered.map(p => (
          <div key={p.id} className="flex items-center gap-1 rounded-lg" style={{ border: '1px solid rgba(241,245,249,0.06)' }}>
            <button onClick={() => onAdd({ uid: crypto.randomUUID(), drillId: `play-${p.id}`, name: p.name, category: p.category, categoryColor: p.categoryColor, durationMins: p.suggestedDurationMins })}
              className="flex-1 text-left px-3 py-2 transition-colors hover:bg-white/5 flex items-center gap-2 min-w-0"
            >
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: PLAY_CATEGORY_COLORS[p.category] ?? '#6B7280' }} />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-sp-text truncate">{p.name}</p>
                <p className="text-xs" style={{ color: 'rgba(241,245,249,0.3)' }}>{PLAY_CATEGORY_LABELS[p.category]}</p>
              </div>
              <span className="text-xs flex-shrink-0" style={{ color: 'rgba(241,245,249,0.3)' }}>{p.suggestedDurationMins}m</span>
              <span className="text-xs flex-shrink-0" style={{ color: '#3A86FF' }}>+</span>
            </button>
            <button onClick={() => onInfo({ type: 'play', data: p })} className="px-2 py-2 text-xs hover:opacity-80 transition-opacity flex-shrink-0" style={{ color: 'rgba(241,245,249,0.25)' }} title="Details">ℹ</button>
          </div>
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
  plan?: PracticePlan
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
  plan,
  onSave,
  onStartRun,
  onBack,
}: SplitBuilderProps) {
  const [name, setName] = useState(initialName)
  const [date, setDate] = useState(initialDate ?? '')
  const [items, setItems] = useState<PlanDrill[]>(initialDrills)
  const [focusAreas, setFocusAreas] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState<LibTab>('drills')
  const [mobilePanel, setMobilePanel] = useState<'plan' | 'library'>('plan')
  const [detailItem, setDetailItem] = useState<DetailItem>(null)
  const [customFormOpen, setCustomFormOpen] = useState(false)
  const [customName, setCustomName] = useState('')
  const [customDuration, setCustomDuration] = useState(10)
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

  function addCustomItem() {
    if (!customName.trim()) return
    addItem({
      uid: crypto.randomUUID(),
      drillId: `custom-${crypto.randomUUID()}`,
      name: customName.trim(),
      category: 'custom',
      categoryColor: '#8B5CF6',
      durationMins: customDuration,
    })
    setCustomName('')
    setCustomDuration(10)
    setCustomFormOpen(false)
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
    <div className="flex flex-col md:flex-row h-full" style={{ minHeight: 'calc(100vh - 200px)' }}>

      {/* ── Mobile panel switcher ────────────────────────────────── */}
      <div className="flex md:hidden rounded-xl overflow-hidden mb-4 flex-shrink-0" style={{ border: '1px solid rgba(241,245,249,0.1)' }}>
        <button
          onClick={() => setMobilePanel('plan')}
          className="flex-1 py-2.5 text-sm font-semibold transition-colors"
          style={{ backgroundColor: mobilePanel === 'plan' ? '#F7620A' : 'rgba(241,245,249,0.04)', color: mobilePanel === 'plan' ? '#fff' : 'rgba(241,245,249,0.45)' }}
        >
          📋 Plan
        </button>
        <button
          onClick={() => setMobilePanel('library')}
          className="flex-1 py-2.5 text-sm font-semibold transition-colors"
          style={{ backgroundColor: mobilePanel === 'library' ? '#F7620A' : 'rgba(241,245,249,0.04)', color: mobilePanel === 'library' ? '#fff' : 'rgba(241,245,249,0.45)' }}
        >
          📚 Library
        </button>
      </div>

      {/* ── Left: plan editor ───────────────────────────────────── */}
      <div className={`${mobilePanel === 'plan' ? 'flex' : 'hidden'} md:flex flex-col w-full md:w-[55%] md:pr-5`}>
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
        <div className="flex flex-wrap items-center gap-3 mb-3">
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
              <p className="text-sm hidden md:block" style={{ color: 'rgba(241,245,249,0.25)' }}>
                Add drills, games, or plays from the library →
              </p>
              <p className="text-sm md:hidden" style={{ color: 'rgba(241,245,249,0.25)' }}>
                Tap Library above to add drills, games, or plays
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
                      onInfo={() => setDetailItem(lookupDetail(item.drillId))}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>

        {/* add water break + custom item */}
        <div className="mt-2 flex flex-wrap gap-2">
          <button
            onClick={() => addItem({ uid: crypto.randomUUID(), drillId: 'break', name: 'Water Break', category: 'break', categoryColor: '#6B7280', durationMins: 3 })}
            className="text-xs px-3 py-1.5 rounded-lg transition-colors hover:opacity-70"
            style={{ backgroundColor: 'rgba(241,245,249,0.06)', color: 'rgba(241,245,249,0.45)', border: '1px solid rgba(241,245,249,0.08)' }}
          >
            + Water Break
          </button>
          {!customFormOpen && (
            <button
              onClick={() => setCustomFormOpen(true)}
              className="text-xs px-3 py-1.5 rounded-lg transition-colors hover:opacity-70"
              style={{ backgroundColor: 'rgba(139,92,246,0.1)', color: 'rgba(139,92,246,0.7)', border: '1px solid rgba(139,92,246,0.2)' }}
            >
              + Custom Item
            </button>
          )}
        </div>
        {customFormOpen && (
          <div className="mt-2 flex flex-wrap items-center gap-2 p-2 rounded-lg" style={{ backgroundColor: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)' }}>
            <input
              autoFocus
              value={customName}
              onChange={e => setCustomName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') addCustomItem(); if (e.key === 'Escape') { setCustomFormOpen(false); setCustomName(''); setCustomDuration(10) } }}
              placeholder="Item name…"
              className="flex-1 text-sm rounded-md"
              style={{ backgroundColor: 'rgba(241,245,249,0.07)', border: '1px solid rgba(241,245,249,0.1)', color: '#F1F5F9', padding: '5px 8px', outline: 'none', minWidth: 120 }}
            />
            <div className="flex items-center gap-1">
              <input
                type="number" min={1} max={120}
                value={customDuration}
                onChange={e => setCustomDuration(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-12 text-center text-sm rounded-md"
                style={{ backgroundColor: 'rgba(241,245,249,0.07)', border: '1px solid rgba(241,245,249,0.1)', color: '#F1F5F9', padding: '5px 4px', outline: 'none' }}
              />
              <span className="text-xs" style={{ color: 'rgba(241,245,249,0.3)' }}>m</span>
            </div>
            <div className="flex gap-1">
              <button
                onClick={addCustomItem}
                disabled={!customName.trim()}
                className="text-xs px-3 py-1.5 rounded-lg disabled:opacity-40 transition-opacity hover:opacity-85"
                style={{ backgroundColor: '#8B5CF6', color: '#fff' }}
              >
                Add
              </button>
              <button
                onClick={() => { setCustomFormOpen(false); setCustomName(''); setCustomDuration(10) }}
                className="text-xs px-3 py-1.5 rounded-lg transition-opacity hover:opacity-70"
                style={{ backgroundColor: 'rgba(241,245,249,0.06)', color: 'rgba(241,245,249,0.45)', border: '1px solid rgba(241,245,249,0.08)' }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* footer actions */}
        <div className="flex items-center justify-between mt-4 pt-4" style={{ borderTop: '1px solid rgba(241,245,249,0.07)' }}>
          {savedPlanId && onStartRun ? (
            <button
              onClick={onStartRun}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-opacity hover:opacity-85"
              style={{ backgroundColor: '#22C55E', color: '#fff' }}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                <path d="M2 1.5l8 4.5-8 4.5V1.5z"/>
              </svg>
              Start Practice
            </button>
          ) : <div />}
          <div className="flex items-center gap-2">
            {plan && (
              <PracticePlanButton
                plan={plan}
                className="px-4 py-2 text-sm font-semibold rounded-lg transition-opacity hover:opacity-85"
                style={{ backgroundColor: 'rgba(241,245,249,0.08)', color: 'rgba(241,245,249,0.6)', border: '1px solid rgba(241,245,249,0.12)' }}
              />
            )}
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
      </div>

      {/* ── Right: library ──────────────────────────────────────── */}
      <div
        className={`${mobilePanel === 'library' ? 'flex' : 'hidden'} md:flex flex-col flex-shrink-0 rounded-xl overflow-hidden w-full md:flex-1`}
        style={{ border: '1px solid rgba(241,245,249,0.07)', backgroundColor: '#0A1019' }}
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
          {activeTab === 'drills' && <DrillsTab onAdd={addItem} onInfo={setDetailItem} />}
          {activeTab === 'games' && <GamesTab onAdd={addItem} onInfo={setDetailItem} />}
          {activeTab === 'plays' && <PlaysTab onAdd={addItem} onInfo={setDetailItem} />}
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

      {/* Detail modal */}
      {detailItem && <DetailModal detail={detailItem} onClose={() => setDetailItem(null)} />}
    </div>
  )
}
