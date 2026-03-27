'use client'

import { useState, useMemo } from 'react'
import { useCustomDrills } from '@/hooks/useCustomDrills'

interface DrillPickerProps {
  selectedDrillIds: string[]
  targetSkill?: string
  onToggle: (drillId: string) => void
  onClose: () => void
}

export default function DrillPicker({
  selectedDrillIds,
  targetSkill,
  onToggle,
  onClose,
}: DrillPickerProps) {
  const { data: drills = [] } = useCustomDrills()
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')

  const categories = useMemo(() => {
    const cats = Array.from(new Set(drills.map(d => d.category))).filter(Boolean)
    return ['All', ...cats]
  }, [drills])

  const filtered = useMemo(() => {
    return drills.filter(d => {
      const matchesSearch = !search || d.name.toLowerCase().includes(search.toLowerCase())
      const matchesCat = activeCategory === 'All' || d.category === activeCategory
      return matchesSearch && matchesCat
    })
  }, [drills, search, activeCategory])

  const recommended = useMemo(() => {
    if (!targetSkill) return []
    return filtered.filter(d => d.category?.toLowerCase() === targetSkill.toLowerCase())
  }, [filtered, targetSkill])

  const others = useMemo(() => {
    if (!targetSkill) return filtered
    return filtered.filter(d => d.category?.toLowerCase() !== targetSkill.toLowerCase())
  }, [filtered, targetSkill])

  return (
    <div
      style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        background: '#1a2535',
        borderRadius: 12,
        border: '1px solid rgba(241,245,249,0.1)',
        boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        zIndex: 100,
        width: 360,
        maxHeight: 480,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 16px 10px',
          borderBottom: '1px solid rgba(241,245,249,0.07)',
          flexShrink: 0,
        }}
      >
        <span style={{ color: '#F1F5F9', fontWeight: 600, fontSize: 14 }}>Add Drill</span>
        <button
          onClick={onClose}
          style={{ color: 'rgba(241,245,249,0.4)', fontSize: 18, lineHeight: 1 }}
        >
          ×
        </button>
      </div>

      {/* Search */}
      <div style={{ padding: '10px 16px 0', flexShrink: 0 }}>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search drills..."
          autoFocus
          style={{
            width: '100%',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(241,245,249,0.1)',
            borderRadius: 8,
            color: '#F1F5F9',
            padding: '6px 10px',
            fontSize: 13,
            outline: 'none',
          }}
        />
      </div>

      {/* Category pills */}
      <div
        style={{
          display: 'flex',
          gap: 6,
          padding: '10px 16px',
          overflowX: 'auto',
          flexShrink: 0,
        }}
      >
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            style={{
              padding: '3px 10px',
              borderRadius: 20,
              fontSize: 12,
              whiteSpace: 'nowrap',
              background: activeCategory === cat ? '#F7620A' : 'rgba(241,245,249,0.07)',
              color: activeCategory === cat ? '#fff' : 'rgba(241,245,249,0.6)',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Drill list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 16px' }}>
        {targetSkill && recommended.length > 0 && (
          <>
            <p style={{ fontSize: 11, color: '#F7620A', fontWeight: 600, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Recommended
            </p>
            {recommended.map(drill => (
              <DrillRow
                key={drill.id}
                drill={drill}
                selected={selectedDrillIds.includes(drill.id)}
                onToggle={() => onToggle(drill.id)}
              />
            ))}
            {others.length > 0 && (
              <p style={{ fontSize: 11, color: 'rgba(241,245,249,0.4)', fontWeight: 600, marginTop: 12, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Other Drills
              </p>
            )}
          </>
        )}
        {(targetSkill ? others : filtered).map(drill => (
          <DrillRow
            key={drill.id}
            drill={drill}
            selected={selectedDrillIds.includes(drill.id)}
            onToggle={() => onToggle(drill.id)}
          />
        ))}
        {filtered.length === 0 && (
          <p style={{ color: 'rgba(241,245,249,0.35)', fontSize: 13, textAlign: 'center', paddingTop: 20 }}>
            No drills found
          </p>
        )}
      </div>
    </div>
  )
}

function DrillRow({
  drill,
  selected,
  onToggle,
}: {
  drill: { id: string; name: string; category: string; duration_mins: number }
  selected: boolean
  onToggle: () => void
}) {
  return (
    <button
      onClick={onToggle}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        width: '100%',
        padding: '8px 10px',
        borderRadius: 8,
        marginBottom: 4,
        background: selected ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.03)',
        border: `1px solid ${selected ? 'rgba(34,197,94,0.3)' : 'rgba(241,245,249,0.06)'}`,
        cursor: 'pointer',
        textAlign: 'left',
      }}
    >
      {selected ? (
        <span style={{ color: '#22C55E', fontSize: 14, flexShrink: 0 }}>✓</span>
      ) : (
        <span style={{ width: 14, flexShrink: 0 }} />
      )}
      <span style={{ flex: 1, color: '#F1F5F9', fontSize: 13, fontWeight: 500 }}>
        {drill.name}
      </span>
      <span
        style={{
          fontSize: 11,
          background: 'rgba(241,245,249,0.07)',
          color: 'rgba(241,245,249,0.5)',
          padding: '2px 6px',
          borderRadius: 10,
          whiteSpace: 'nowrap',
        }}
      >
        {drill.category}
      </span>
      <span style={{ fontSize: 11, color: 'rgba(241,245,249,0.35)', whiteSpace: 'nowrap' }}>
        {drill.duration_mins}m
      </span>
    </button>
  )
}
