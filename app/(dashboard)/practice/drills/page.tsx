'use client'

import { useState, useMemo } from 'react'
import { drills as staticDrills, CATEGORY_COLORS, type Drill } from '@/data/drills'
import { useCustomDrills } from '@/hooks/useCustomDrills'
import DrillCard from './DrillCard'
import CreateDrillModal from './CreateDrillModal'

const CATEGORIES = [
  { key: 'all', label: 'All' },
  { key: 'ballhandling', label: 'Ball Handling' },
  { key: 'shooting', label: 'Shooting' },
  { key: 'passing', label: 'Passing' },
  { key: 'defense', label: 'Defense' },
  { key: 'conditioning', label: 'Conditioning' },
  { key: 'team', label: 'Team' },
  { key: 'custom', label: 'My Drills' },
]

export default function DrillsPage() {
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('all')
  const [isModalOpen, setIsModalOpen] = useState(false)

  const { data: customDrillRows = [] } = useCustomDrills()

  // Convert DB rows → Drill interface and merge with static drills
  const allDrills: Drill[] = useMemo(() => {
    const converted: Drill[] = customDrillRows.map(d => ({
      id: d.id,
      name: d.name,
      category: d.category as Drill['category'],
      categoryColor: CATEGORY_COLORS[d.category] ?? '#8B5CF6',
      durationMins: d.duration_mins,
      playersNeeded: d.players_needed ?? 'Full team',
      level: d.level as Drill['level'],
      description: d.description,
      setup: d.setup ?? undefined,
      instructions: d.instructions ?? undefined,
      cues: d.cues ?? [],
      progression: d.progression ?? undefined,
      tags: [],
      isCustom: true,
    }))
    return [...converted, ...staticDrills]
  }, [customDrillRows])

  const filtered = useMemo(() => {
    let result = allDrills
    if (activeCategory === 'custom') result = result.filter(d => d.isCustom)
    else if (activeCategory !== 'all') result = result.filter(d => d.category === activeCategory)
    if (search.trim()) {
      const s = search.toLowerCase()
      result = result.filter(
        d =>
          d.name.toLowerCase().includes(s) ||
          d.description.toLowerCase().includes(s) ||
          d.tags.some(t => t.toLowerCase().includes(s))
      )
    }
    return result
  }, [allDrills, activeCategory, search])

  return (
    <div>
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-sp-text">Drill Library</h1>
          <p className="text-sm mt-0.5" style={{ color: 'rgba(241,245,249,0.4)' }}>
            {filtered.length} {filtered.length === 1 ? 'drill' : 'drills'}
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg transition-opacity hover:opacity-85"
          style={{ backgroundColor: '#F7620A', color: '#fff' }}
        >
          <span>+</span> New Drill
        </button>
      </div>

      {/* Search */}
      <input
        type="text"
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Search by name, description, or tags..."
        className="sp-input mb-4"
        style={{ maxWidth: 420 }}
      />

      {/* Category filter pills */}
      <div className="flex flex-wrap gap-2 mb-6">
        {CATEGORIES.map(({ key, label }) => {
          const isActive = activeCategory === key
          return (
            <button
              key={key}
              onClick={() => setActiveCategory(key)}
              className="px-3 py-1.5 rounded-full text-sm font-medium transition-all"
              style={{
                backgroundColor: isActive ? '#F7620A' : 'rgba(241,245,249,0.06)',
                color: isActive ? '#fff' : 'rgba(241,245,249,0.45)',
                border: `1px solid ${isActive ? '#F7620A' : 'rgba(241,245,249,0.08)'}`,
              }}
            >
              {label}
            </button>
          )
        })}
      </div>

      {/* Drill grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(drill => (
            <DrillCard key={drill.id} drill={drill} />
          ))}
        </div>
      ) : (
        <div
          className="flex flex-col items-center justify-center py-20 rounded-xl"
          style={{ border: '1px dashed rgba(241,245,249,0.1)' }}
        >
          <p className="text-sm" style={{ color: 'rgba(241,245,249,0.3)' }}>
            {activeCategory === 'custom'
              ? 'No custom drills yet — create your first one above'
              : 'No drills match your search'}
          </p>
        </div>
      )}

      {isModalOpen && <CreateDrillModal onClose={() => setIsModalOpen(false)} />}
    </div>
  )
}
