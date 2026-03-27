'use client'

import { useState } from 'react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import EditableField from './EditableField'
import { type PlanItem } from '@/hooks/useDevPlan'

interface EditableListProps {
  items: PlanItem[]
  onAdd: (text: string) => void
  onEdit: (id: string, text: string) => void
  onDelete: (id: string) => void
  onReorder?: (newItems: PlanItem[]) => void
  placeholder?: string
  addLabel?: string
  maxItems?: number
  disabled?: boolean
  itemStyle?: 'pill' | 'line'
  pillColor?: string
}

interface SortableItemProps {
  item: PlanItem
  onEdit: (id: string, text: string) => void
  onDelete: (id: string) => void
  disabled?: boolean
  itemStyle: 'pill' | 'line'
  pillColor?: string
  canReorder: boolean
}

function SortableItem({
  item,
  onEdit,
  onDelete,
  disabled,
  itemStyle,
  pillColor,
  canReorder,
}: SortableItemProps) {
  const [hovered, setHovered] = useState(false)
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
    disabled: !canReorder || disabled,
  })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  if (itemStyle === 'pill') {
    return (
      <div
        ref={setNodeRef}
        style={{
          ...style,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          background: pillColor ? `${pillColor}22` : 'rgba(241,245,249,0.08)',
          border: `1px solid ${pillColor ? `${pillColor}44` : 'rgba(241,245,249,0.15)'}`,
          borderRadius: 20,
          padding: '4px 12px',
          marginBottom: 6,
          marginRight: 6,
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {canReorder && !disabled && (
          <span
            {...attributes}
            {...listeners}
            style={{ cursor: 'grab', color: 'rgba(241,245,249,0.3)', fontSize: 12 }}
          >
            ⋮⋮
          </span>
        )}
        <EditableField
          value={item.text}
          onSave={val => onEdit(item.id, val)}
          disabled={disabled}
          textStyle={{ fontSize: 13, color: pillColor ?? '#F1F5F9' }}
        />
        {!disabled && hovered && (
          <button
            onClick={() => onDelete(item.id)}
            style={{ color: 'rgba(241,245,249,0.4)', fontSize: 14, lineHeight: 1, marginLeft: 2 }}
          >
            ×
          </button>
        )}
      </div>
    )
  }

  // line style
  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        display: 'flex',
        alignItems: 'flex-start',
        gap: 8,
        padding: '4px 0',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {canReorder && !disabled && (
        <span
          {...attributes}
          {...listeners}
          style={{ cursor: 'grab', color: 'rgba(241,245,249,0.25)', fontSize: 13, paddingTop: 2, flexShrink: 0 }}
        >
          ⋮⋮
        </span>
      )}
      <span style={{ color: 'rgba(241,245,249,0.4)', paddingTop: 2, flexShrink: 0 }}>•</span>
      <EditableField
        value={item.text}
        onSave={val => onEdit(item.id, val)}
        disabled={disabled}
        textStyle={{ fontSize: 14 }}
      />
      {!disabled && hovered && (
        <button
          onClick={() => onDelete(item.id)}
          style={{ color: 'rgba(241,245,249,0.35)', fontSize: 16, lineHeight: 1, flexShrink: 0 }}
        >
          ×
        </button>
      )}
    </div>
  )
}

export default function EditableList({
  items,
  onAdd,
  onEdit,
  onDelete,
  onReorder,
  placeholder = 'Add item...',
  addLabel,
  maxItems,
  disabled = false,
  itemStyle = 'line',
  pillColor,
}: EditableListProps) {
  const [addText, setAddText] = useState('')
  const sensors = useSensors(useSensor(PointerSensor))
  const canReorder = !!onReorder && !disabled

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex(i => i.id === active.id)
      const newIndex = items.findIndex(i => i.id === over.id)
      onReorder!(arrayMove(items, oldIndex, newIndex))
    }
  }

  function handleAddKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && addText.trim()) {
      onAdd(addText.trim())
      setAddText('')
    }
  }

  const atMax = maxItems !== undefined && items.length >= maxItems
  const containerStyle: React.CSSProperties =
    itemStyle === 'pill' ? { display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start' } : {}

  return (
    <div>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
          <div style={containerStyle}>
            {items.map(item => (
              <SortableItem
                key={item.id}
                item={item}
                onEdit={onEdit}
                onDelete={onDelete}
                disabled={disabled}
                itemStyle={itemStyle}
                pillColor={pillColor}
                canReorder={canReorder}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {!disabled && !atMax && (
        <input
          type="text"
          value={addText}
          onChange={e => setAddText(e.target.value)}
          onKeyDown={handleAddKeyDown}
          placeholder={addLabel ?? placeholder}
          style={{
            background: 'transparent',
            border: 'none',
            borderBottom: '1px dashed rgba(241,245,249,0.15)',
            color: 'rgba(241,245,249,0.5)',
            padding: '4px 2px',
            fontSize: 13,
            width: '100%',
            outline: 'none',
            marginTop: 6,
          }}
        />
      )}
    </div>
  )
}
