'use client'

import { useState, useRef, useEffect } from 'react'

interface EditableFieldProps {
  value: string
  onSave: (newValue: string) => void
  placeholder?: string
  multiline?: boolean
  className?: string
  disabled?: boolean
  minHeight?: number
  textStyle?: React.CSSProperties
}

export default function EditableField({
  value,
  onSave,
  placeholder = 'Click to edit...',
  multiline = false,
  className = '',
  disabled = false,
  minHeight,
  textStyle,
}: EditableFieldProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const [hovered, setHovered] = useState(false)
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null)

  useEffect(() => {
    setDraft(value)
  }, [value])

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus()
      if (multiline) {
        autoResize(inputRef.current as HTMLTextAreaElement)
      }
    }
  }, [editing, multiline])

  function autoResize(el: HTMLTextAreaElement) {
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }

  function startEdit() {
    if (disabled) return
    setDraft(value)
    setEditing(true)
  }

  function handleSave() {
    setEditing(false)
    if (draft !== value) onSave(draft)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') {
      setDraft(value)
      setEditing(false)
    } else if (e.key === 'Enter' && !multiline) {
      handleSave()
    }
  }

  const editingStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(241,245,249,0.2)',
    borderRadius: 6,
    color: '#F1F5F9',
    padding: '4px 8px',
    width: '100%',
    outline: 'none',
    fontSize: 'inherit',
    fontFamily: 'inherit',
    resize: 'none',
    minHeight: minHeight ? `${minHeight}px` : undefined,
  }

  if (editing) {
    if (multiline) {
      return (
        <textarea
          ref={inputRef as React.RefObject<HTMLTextAreaElement>}
          value={draft}
          onChange={e => {
            setDraft(e.target.value)
            autoResize(e.target)
          }}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          style={{ ...editingStyle, minHeight: minHeight ? `${minHeight}px` : '60px' }}
          className={className}
        />
      )
    }
    return (
      <input
        ref={inputRef as React.RefObject<HTMLInputElement>}
        type="text"
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        style={editingStyle}
        className={className}
      />
    )
  }

  return (
    <div
      className={className}
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'flex-start',
        gap: 4,
        width: '100%',
        cursor: disabled ? 'default' : 'text',
      }}
      onClick={startEdit}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <span
        style={{
          color: value ? '#F1F5F9' : 'rgba(241,245,249,0.4)',
          flex: 1,
          minHeight: minHeight ? `${minHeight}px` : undefined,
          ...textStyle,
        }}
      >
        {value || placeholder}
      </span>
      {!disabled && hovered && (
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="rgba(241,245,249,0.4)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ flexShrink: 0, marginTop: 3 }}
        >
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
      )}
    </div>
  )
}
