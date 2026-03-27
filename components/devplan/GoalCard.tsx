'use client'

import { useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useCustomDrills } from '@/hooks/useCustomDrills'
import { type PlanGoal, type PlanItem, genId } from '@/hooks/useDevPlan'
import EditableField from './EditableField'
import EditableList from './EditableList'
import DrillPicker from './DrillPicker'

interface GoalCardProps {
  goal: PlanGoal
  index: number
  onUpdate: (updated: PlanGoal) => void
  onDelete: (goalId: string) => void
  disabled?: boolean
}

export default function GoalCard({ goal, index, onUpdate, onDelete, disabled = false }: GoalCardProps) {
  const [showDrillPicker, setShowDrillPicker] = useState(false)
  const { data: drills = [] } = useCustomDrills()

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: goal.id, disabled })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  function update(patch: Partial<PlanGoal>) {
    onUpdate({ ...goal, ...patch })
  }

  function handleActionAdd(text: string) {
    update({ actionSteps: [...goal.actionSteps, { id: genId(), text }] })
  }
  function handleActionEdit(id: string, text: string) {
    update({ actionSteps: goal.actionSteps.map(s => s.id === id ? { ...s, text } : s) })
  }
  function handleActionDelete(id: string) {
    update({ actionSteps: goal.actionSteps.filter(s => s.id !== id) })
  }
  function handleActionReorder(newItems: PlanItem[]) {
    update({ actionSteps: newItems })
  }

  function handleDrillToggle(drillId: string) {
    const ids = goal.suggestedDrillIds ?? []
    const existing = ids.includes(drillId)
    update({
      suggestedDrillIds: existing
        ? ids.filter(id => id !== drillId)
        : [...ids, drillId],
    })
  }

  function handleRemoveDrill(drillId: string) {
    update({ suggestedDrillIds: (goal.suggestedDrillIds ?? []).filter(id => id !== drillId) })
  }

  function toggleComplete() {
    update({
      isComplete: !goal.isComplete,
      completedAt: !goal.isComplete ? new Date().toISOString() : undefined,
    })
  }

  const cardStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(241,245,249,0.07)',
    borderRadius: 12,
    padding: 20,
    marginBottom: 12,
    position: 'relative',
    ...style,
  }

  if (goal.isComplete) {
    cardStyle.opacity = 0.7
  }

  return (
    <div ref={setNodeRef} style={cardStyle}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        {!disabled && (
          <span
            {...attributes}
            {...listeners}
            style={{ cursor: 'grab', color: 'rgba(241,245,249,0.3)', fontSize: 16, flexShrink: 0 }}
          >
            ⠿
          </span>
        )}
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: 'rgba(241,245,249,0.4)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            flexShrink: 0,
          }}
        >
          GOAL {index + 1}
        </span>
        <EditableField
          value={goal.targetSkill}
          onSave={val => update({ targetSkill: val })}
          disabled={disabled}
          placeholder="skill"
          textStyle={{
            fontSize: 11,
            fontWeight: 600,
            background: 'rgba(247,98,10,0.12)',
            color: '#F7620A',
            border: '1px solid rgba(247,98,10,0.25)',
            borderRadius: 12,
            padding: '2px 8px',
          }}
        />
        <div style={{ flex: 1 }} />
        {!disabled && (
          <button
            onClick={() => {
              if (window.confirm('Delete this goal?')) onDelete(goal.id)
            }}
            style={{ color: 'rgba(241,245,249,0.3)', fontSize: 14 }}
            title="Delete goal"
          >
            🗑
          </button>
        )}
      </div>

      {/* Title */}
      <EditableField
        value={goal.title}
        onSave={val => update({ title: val })}
        disabled={disabled}
        placeholder="Goal title..."
        textStyle={{ fontSize: 16, fontWeight: 600, color: '#F1F5F9' }}
      />

      {/* Description */}
      <div style={{ marginTop: 8 }}>
        <EditableField
          value={goal.description}
          onSave={val => update({ description: val })}
          disabled={disabled}
          multiline
          placeholder="Describe this goal..."
          textStyle={{ fontSize: 14, color: 'rgba(241,245,249,0.7)', lineHeight: '1.5' }}
          minHeight={40}
        />
      </div>

      {/* Action Steps */}
      <div style={{ marginTop: 14 }}>
        <p
          style={{
            fontSize: 11,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.07em',
            color: 'rgba(241,245,249,0.4)',
            marginBottom: 8,
          }}
        >
          Action Steps
        </p>
        <EditableList
          items={goal.actionSteps ?? []}
          onAdd={handleActionAdd}
          onEdit={handleActionEdit}
          onDelete={handleActionDelete}
          onReorder={handleActionReorder}
          placeholder="Add action step..."
          addLabel="+ Action step (Enter to add)"
          disabled={disabled}
          itemStyle="line"
        />
      </div>

      {/* Suggested Drills */}
      <div style={{ marginTop: 14 }}>
        <p
          style={{
            fontSize: 11,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.07em',
            color: 'rgba(241,245,249,0.4)',
            marginBottom: 8,
          }}
        >
          Suggested Drills
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {(goal.suggestedDrillIds ?? []).map(drillId => {
            const drill = drills.find(d => d.id === drillId)
            if (!drill) return null
            return (
              <span
                key={drillId}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  background: 'rgba(56,189,248,0.1)',
                  border: '1px solid rgba(56,189,248,0.25)',
                  borderRadius: 20,
                  padding: '3px 10px',
                  fontSize: 12,
                  color: '#38BDF8',
                }}
              >
                {drill.name}
                {!disabled && (
                  <button
                    onClick={() => handleRemoveDrill(drillId)}
                    style={{ color: 'rgba(56,189,248,0.6)', marginLeft: 2, fontSize: 14 }}
                  >
                    ×
                  </button>
                )}
              </span>
            )
          })}
          {!disabled && (
            <button
              onClick={() => setShowDrillPicker(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                background: 'rgba(241,245,249,0.05)',
                border: '1px dashed rgba(241,245,249,0.15)',
                borderRadius: 20,
                padding: '3px 10px',
                fontSize: 12,
                color: 'rgba(241,245,249,0.4)',
                cursor: 'pointer',
              }}
            >
              + Add Drill
            </button>
          )}
        </div>
      </div>

      {/* Timeframe */}
      <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 12, color: 'rgba(241,245,249,0.45)' }}>Timeframe:</span>
        {disabled ? (
          <span style={{ fontSize: 12, color: '#F1F5F9' }}>{goal.timeframeWeeks} weeks</span>
        ) : (
          <input
            type="number"
            min={1}
            max={52}
            value={goal.timeframeWeeks}
            onChange={e => update({ timeframeWeeks: parseInt(e.target.value) || 1 })}
            style={{
              width: 48,
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(241,245,249,0.1)',
              borderRadius: 6,
              color: '#F1F5F9',
              padding: '2px 6px',
              fontSize: 12,
              textAlign: 'center',
              outline: 'none',
            }}
          />
        )}
        <span style={{ fontSize: 12, color: 'rgba(241,245,249,0.45)' }}>weeks</span>
      </div>

      {/* Complete toggle */}
      <div style={{ marginTop: 14 }}>
        <button
          onClick={toggleComplete}
          disabled={disabled}
          style={{
            padding: '6px 14px',
            borderRadius: 8,
            fontSize: 12,
            fontWeight: 600,
            cursor: disabled ? 'default' : 'pointer',
            background: goal.isComplete ? 'rgba(34,197,94,0.15)' : 'transparent',
            color: goal.isComplete ? '#22C55E' : 'rgba(241,245,249,0.4)',
            border: `1px solid ${goal.isComplete ? 'rgba(34,197,94,0.3)' : 'rgba(241,245,249,0.15)'}`,
            transition: 'all 0.15s',
          }}
        >
          {goal.isComplete ? '✓ Complete' : 'Mark Complete'}
        </button>
      </div>

      {/* Drill picker overlay */}
      {showDrillPicker && (
        <>
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 99 }}
            onClick={() => setShowDrillPicker(false)}
          />
          <DrillPicker
            selectedDrillIds={goal.suggestedDrillIds}
            targetSkill={goal.targetSkill}
            onToggle={handleDrillToggle}
            onClose={() => setShowDrillPicker(false)}
          />
        </>
      )}
    </div>
  )
}
