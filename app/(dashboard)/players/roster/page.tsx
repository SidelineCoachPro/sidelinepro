'use client'

import { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { usePlayers, useUpdatePlayer } from '@/hooks/usePlayers'
import {
  useParentContacts,
  useUpdateParentContact,
  useCreateParentContact,
  type ParentContact,
} from '@/hooks/useParentContacts'
import { playerInitials, PLAYER_COLORS } from '../evalUtils'
import AddPlayerModal from '../AddPlayerModal'
import PlayersSubNav from '../components/PlayersSubNav'

const POSITIONS = ['', 'PG', 'SG', 'SF', 'PF', 'C', 'G', 'F']

type SortField = 'name' | 'jersey' | 'position' | 'age' | null
type SortDir = 'asc' | 'desc'

function getPlayerContacts(
  allContacts: ParentContact[],
  playerId: string,
): [ParentContact | null, ParentContact | null] {
  const list = allContacts
    .filter(c => c.player_id === playerId)
    .sort((a, b) => (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0))
  return [list[0] ?? null, list[1] ?? null]
}

// ── Inline cell ──────────────────────────────────────────────────────────────
function InlineCell({
  editKey,
  activeKey,
  displayValue,
  editValue,
  onChange,
  onActivate,
  onSave,
  onCancel,
  inputType = 'text',
  selectOptions,
  isAdd = false,
  disabled = false,
}: {
  editKey: string
  activeKey: string | null
  displayValue: string | null
  editValue: string
  onChange: (v: string) => void
  onActivate: (initValue: string) => void
  onSave: () => void
  onCancel: () => void
  inputType?: 'text' | 'number'
  selectOptions?: string[]
  isAdd?: boolean
  disabled?: boolean
}) {
  const isEditing = activeKey === editKey
  const inputRef = useRef<HTMLInputElement | HTMLSelectElement>(null)

  useEffect(() => {
    if (isEditing) (inputRef.current as HTMLElement | null)?.focus()
  }, [isEditing])

  if (isEditing) {
    if (selectOptions) {
      return (
        <select
          ref={inputRef as React.RefObject<HTMLSelectElement>}
          value={editValue}
          onChange={e => { onChange(e.target.value); onSave() }}
          onBlur={onSave}
          onKeyDown={e => { if (e.key === 'Escape') onCancel() }}
          className="w-full text-sm rounded px-1.5 py-0.5 outline-none"
          style={{
            backgroundColor: 'rgba(247,98,10,0.12)',
            border: '1px solid rgba(247,98,10,0.4)',
            color: '#F1F5F9',
          }}
        >
          {selectOptions.map(o => (
            <option key={o} value={o} style={{ backgroundColor: '#0E1520' }}>
              {o || '—'}
            </option>
          ))}
        </select>
      )
    }

    return (
      <input
        ref={inputRef as React.RefObject<HTMLInputElement>}
        type={inputType}
        value={editValue}
        onChange={e => onChange(e.target.value)}
        onBlur={onSave}
        onKeyDown={e => {
          if (e.key === 'Enter') onSave()
          if (e.key === 'Escape') onCancel()
        }}
        className="w-full text-sm rounded px-1.5 py-0.5 outline-none"
        style={{
          backgroundColor: 'rgba(247,98,10,0.12)',
          border: '1px solid rgba(247,98,10,0.4)',
          color: '#F1F5F9',
        }}
      />
    )
  }

  if (disabled) {
    return (
      <span className="text-sm" style={{ color: 'rgba(241,245,249,0.2)' }}>
        —
      </span>
    )
  }

  if (!displayValue && isAdd) {
    return (
      <button
        onClick={() => onActivate('')}
        className="text-xs font-medium transition-opacity hover:opacity-100"
        style={{ color: 'rgba(247,98,10,0.6)' }}
      >
        + Add
      </button>
    )
  }

  return (
    <button
      onClick={() => onActivate(displayValue ?? '')}
      className="w-full text-left text-sm transition-colors hover:text-white truncate"
      style={{ color: displayValue ? 'rgba(241,245,249,0.8)' : 'rgba(241,245,249,0.25)' }}
    >
      {displayValue || '—'}
    </button>
  )
}

// ── Sort icon ─────────────────────────────────────────────────────────────────
function SortIcon({ field, sortField, sortDir }: { field: SortField; sortField: SortField; sortDir: SortDir }) {
  if (sortField !== field) return <span style={{ color: 'rgba(241,245,249,0.2)' }}>⇅</span>
  return <span style={{ color: '#F7620A' }}>{sortDir === 'asc' ? '↑' : '↓'}</span>
}

// ── Roster page ───────────────────────────────────────────────────────────────
export default function RosterPage() {
  const router = useRouter()
  const { data: players = [], isLoading } = usePlayers()
  const { data: allContacts = [] } = useParentContacts()

  const updatePlayer = useUpdatePlayer()
  const updateContact = useUpdateParentContact()
  const createContact = useCreateParentContact()

  const [activeKey, setActiveKey] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [newPlayerId, setNewPlayerId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [showMissingOnly, setShowMissingOnly] = useState(false)
  const [sortField, setSortField] = useState<SortField>(null)
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  // Scroll to new player row after add
  const newRowRef = useRef<HTMLTableRowElement>(null)
  useEffect(() => {
    if (newPlayerId && newRowRef.current) {
      newRowRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
      const timer = setTimeout(() => setNewPlayerId(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [newPlayerId])

  // ── Sort toggle ─────────────────────────────────────────────────────────────
  function toggleSort(field: SortField) {
    if (sortField !== field) {
      setSortField(field)
      setSortDir('asc')
    } else if (sortDir === 'asc') {
      setSortDir('desc')
    } else {
      setSortField(null)
    }
  }

  // ── Filtered + sorted list ──────────────────────────────────────────────────
  const rows = useMemo(() => {
    let result = [...players]

    if (search.trim()) {
      const s = search.toLowerCase()
      result = result.filter(p => {
        const [p1, p2] = getPlayerContacts(allContacts, p.id)
        return (
          `${p.first_name} ${p.last_name ?? ''}`.toLowerCase().includes(s) ||
          (p.jersey_number ?? '').toLowerCase().includes(s) ||
          (p.position ?? '').toLowerCase().includes(s) ||
          (p1?.first_name ?? '').toLowerCase().includes(s) ||
          (p1?.last_name ?? '').toLowerCase().includes(s) ||
          (p1?.phone ?? '').includes(s) ||
          (p1?.email ?? '').toLowerCase().includes(s) ||
          (p2?.first_name ?? '').toLowerCase().includes(s) ||
          (p2?.last_name ?? '').toLowerCase().includes(s) ||
          (p2?.phone ?? '').includes(s) ||
          (p2?.email ?? '').toLowerCase().includes(s)
        )
      })
    }

    if (showMissingOnly) {
      result = result.filter(p => allContacts.filter(c => c.player_id === p.id).length === 0)
    }

    if (sortField) {
      result.sort((a, b) => {
        let va: string | number = ''
        let vb: string | number = ''
        if (sortField === 'name') {
          va = `${a.first_name} ${a.last_name ?? ''}`.toLowerCase()
          vb = `${b.first_name} ${b.last_name ?? ''}`.toLowerCase()
        } else if (sortField === 'jersey') {
          va = a.jersey_number ?? ''
          vb = b.jersey_number ?? ''
        } else if (sortField === 'position') {
          va = a.position ?? ''
          vb = b.position ?? ''
        } else if (sortField === 'age') {
          va = a.age ?? 0
          vb = b.age ?? 0
        }
        if (va < vb) return sortDir === 'asc' ? -1 : 1
        if (va > vb) return sortDir === 'asc' ? 1 : -1
        return 0
      })
    }

    return result
  }, [players, allContacts, search, showMissingOnly, sortField, sortDir])

  // ── Edit helpers ─────────────────────────────────────────────────────────────
  function activate(playerId: string, col: string, initValue: string) {
    setActiveKey(`${playerId}:${col}`)
    setEditValue(initValue)
  }

  const commitEdit = useCallback(() => {
    if (!activeKey) return
    const [playerId, col] = activeKey.split(':')
    const player = players.find(p => p.id === playerId)
    if (!player) { setActiveKey(null); return }

    const [p1, p2] = getPlayerContacts(allContacts, playerId)
    const val = editValue.trim()

    if (col === 'jersey') {
      const newVal = val || null
      if (newVal !== player.jersey_number) updatePlayer.mutate({ id: playerId, jersey_number: newVal })
    } else if (col === 'position') {
      const newVal = val || null
      if (newVal !== player.position) updatePlayer.mutate({ id: playerId, position: newVal })
    } else if (col === 'age') {
      const newNum = val ? parseInt(val) : null
      if (newNum !== player.age) updatePlayer.mutate({ id: playerId, age: newNum })
    } else if (col === 'p1_name') {
      const parts = val.split(/\s+/)
      const firstName = parts[0] ?? ''
      const lastName = parts.slice(1).join(' ') || ''
      if (!firstName) { setActiveKey(null); return }
      if (p1) {
        updateContact.mutate({ id: p1.id, player_id: playerId, first_name: firstName, last_name: lastName })
      } else {
        createContact.mutate({ player_id: playerId, first_name: firstName, last_name: lastName, relationship: 'Parent', phone: null, email: null, is_primary: true })
      }
    } else if (col === 'p1_phone') {
      if (p1) updateContact.mutate({ id: p1.id, player_id: playerId, phone: val || null })
    } else if (col === 'p1_email') {
      if (p1) updateContact.mutate({ id: p1.id, player_id: playerId, email: val || null })
    } else if (col === 'p2_name') {
      const parts = val.split(/\s+/)
      const firstName = parts[0] ?? ''
      const lastName = parts.slice(1).join(' ') || ''
      if (!firstName) { setActiveKey(null); return }
      if (p2) {
        updateContact.mutate({ id: p2.id, player_id: playerId, first_name: firstName, last_name: lastName })
      } else {
        createContact.mutate({ player_id: playerId, first_name: firstName, last_name: lastName, relationship: 'Parent', phone: null, email: null, is_primary: false })
      }
    } else if (col === 'p2_phone') {
      if (p2) updateContact.mutate({ id: p2.id, player_id: playerId, phone: val || null })
    } else if (col === 'p2_email') {
      if (p2) updateContact.mutate({ id: p2.id, player_id: playerId, email: val || null })
    }

    setActiveKey(null)
  }, [activeKey, editValue, players, allContacts, updatePlayer, updateContact, createContact])

  function cancelEdit() {
    setActiveKey(null)
    setEditValue('')
  }

  // ── CSV export ───────────────────────────────────────────────────────────────
  function exportCSV() {
    const headers = ['Player', 'Jersey', 'Position', 'Age', 'P1 First', 'P1 Last', 'P1 Phone', 'P1 Email', 'P2 First', 'P2 Last', 'P2 Phone', 'P2 Email']
    const dataRows = rows.map(p => {
      const [p1, p2] = getPlayerContacts(allContacts, p.id)
      return [
        `${p.first_name} ${p.last_name ?? ''}`.trim(),
        p.jersey_number ?? '',
        p.position ?? '',
        p.age?.toString() ?? '',
        p1?.first_name ?? '', p1?.last_name ?? '', p1?.phone ?? '', p1?.email ?? '',
        p2?.first_name ?? '', p2?.last_name ?? '', p2?.phone ?? '', p2?.email ?? '',
      ]
    })
    const csv = [headers, ...dataRows]
      .map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','))
      .join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `SidelinePro_Roster_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // ── Stats summary ────────────────────────────────────────────────────────────
  const totalContacts = allContacts.length
  const missingCount = players.filter(p => allContacts.filter(c => c.player_id === p.id).length === 0).length

  // ── Cell helper for this page ────────────────────────────────────────────────
  function cell(playerId: string, col: string, opts: {
    displayValue: string | null
    isAdd?: boolean
    disabled?: boolean
    inputType?: 'text' | 'number'
    selectOptions?: string[]
  }) {
    return (
      <InlineCell
        editKey={`${playerId}:${col}`}
        activeKey={activeKey}
        displayValue={opts.displayValue}
        editValue={editValue}
        onChange={setEditValue}
        onActivate={v => activate(playerId, col, v)}
        onSave={commitEdit}
        onCancel={cancelEdit}
        inputType={opts.inputType}
        selectOptions={opts.selectOptions}
        isAdd={opts.isAdd}
        disabled={opts.disabled}
      />
    )
  }

  const thStyle = {
    padding: '8px 12px',
    textAlign: 'left' as const,
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: '0.06em',
    color: 'rgba(241,245,249,0.35)',
    whiteSpace: 'nowrap' as const,
    backgroundColor: '#080C12',
    borderBottom: '1px solid rgba(241,245,249,0.07)',
  }

  const tdStyle = {
    padding: '0 12px',
    height: 52,
    verticalAlign: 'middle' as const,
    borderBottom: '1px solid rgba(241,245,249,0.05)',
  }

  return (
    <div>
      <PlayersSubNav />

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-sp-text">Roster</h1>
          <p className="text-sm mt-0.5" style={{ color: 'rgba(241,245,249,0.4)' }}>
            {players.length} players · {totalContacts} contacts
            {missingCount > 0 && (
              <span className="ml-2 text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(247,98,10,0.15)', color: '#F7620A' }}>
                {missingCount} missing contacts
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={exportCSV}
            className="hidden sm:flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-opacity hover:opacity-80"
            style={{
              backgroundColor: 'rgba(241,245,249,0.06)',
              color: 'rgba(241,245,249,0.6)',
              border: '1px solid rgba(241,245,249,0.08)',
            }}
          >
            ↓ Export CSV
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg transition-opacity hover:opacity-85"
            style={{ backgroundColor: '#F7620A', color: '#fff' }}
          >
            <span>+</span> Add Player
          </button>
        </div>
      </div>

      {/* Search + filter bar */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search players, parents, phone, email..."
          className="sp-input flex-1 min-w-0"
          style={{ maxWidth: 400 }}
        />
        <button
          onClick={() => setShowMissingOnly(v => !v)}
          className="flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg transition-all flex-shrink-0"
          style={{
            backgroundColor: showMissingOnly ? 'rgba(247,98,10,0.15)' : 'rgba(241,245,249,0.06)',
            color: showMissingOnly ? '#F7620A' : 'rgba(241,245,249,0.5)',
            border: `1px solid ${showMissingOnly ? 'rgba(247,98,10,0.3)' : 'rgba(241,245,249,0.08)'}`,
          }}
        >
          {showMissingOnly ? '✓' : ''} Missing contacts only
        </button>
      </div>

      {/* Mobile scroll hint */}
      <p className="sm:hidden text-xs mb-2" style={{ color: 'rgba(241,245,249,0.3)' }}>← Scroll for parent info</p>

      {/* Table container */}
      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(241,245,249,0.07)' }}>
        {isLoading ? (
          <div className="flex items-center justify-center py-16" style={{ backgroundColor: '#0E1520' }}>
            <p style={{ color: 'rgba(241,245,249,0.3)' }}>Loading roster...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table style={{ width: '100%', minWidth: 1100, borderCollapse: 'collapse' }}>
              <thead>
                {/* Group labels row */}
                <tr>
                  <th
                    style={{
                      ...thStyle,
                      position: 'sticky',
                      left: 0,
                      zIndex: 20,
                      width: 200,
                      minWidth: 200,
                    }}
                  >
                    PLAYER
                  </th>
                  <th
                    colSpan={3}
                    style={{
                      ...thStyle,
                      borderLeft: '1px solid rgba(241,245,249,0.07)',
                      color: 'rgba(56,189,248,0.7)',
                    }}
                  >
                    DETAILS
                  </th>
                  <th
                    colSpan={3}
                    style={{
                      ...thStyle,
                      borderLeft: '1px solid rgba(241,245,249,0.07)',
                      color: 'rgba(247,98,10,0.7)',
                    }}
                  >
                    PARENT 1
                  </th>
                  <th
                    colSpan={3}
                    style={{
                      ...thStyle,
                      borderLeft: '1px solid rgba(241,245,249,0.07)',
                      color: 'rgba(139,92,246,0.7)',
                    }}
                  >
                    PARENT 2
                  </th>
                  <th style={thStyle} />
                </tr>
                {/* Column names row */}
                <tr>
                  <th
                    style={{
                      ...thStyle,
                      position: 'sticky',
                      left: 0,
                      zIndex: 20,
                      cursor: 'pointer',
                      userSelect: 'none',
                    }}
                    onClick={() => toggleSort('name')}
                  >
                    NAME <SortIcon field="name" sortField={sortField} sortDir={sortDir} />
                  </th>
                  {/* Details */}
                  <th style={{ ...thStyle, borderLeft: '1px solid rgba(241,245,249,0.07)', cursor: 'pointer', userSelect: 'none', width: 64 }} onClick={() => toggleSort('jersey')}>
                    # <SortIcon field="jersey" sortField={sortField} sortDir={sortDir} />
                  </th>
                  <th style={{ ...thStyle, cursor: 'pointer', userSelect: 'none', width: 80 }} onClick={() => toggleSort('position')}>
                    POS <SortIcon field="position" sortField={sortField} sortDir={sortDir} />
                  </th>
                  <th style={{ ...thStyle, cursor: 'pointer', userSelect: 'none', width: 64 }} onClick={() => toggleSort('age')}>
                    AGE <SortIcon field="age" sortField={sortField} sortDir={sortDir} />
                  </th>
                  {/* Parent 1 */}
                  <th style={{ ...thStyle, borderLeft: '1px solid rgba(241,245,249,0.07)', width: 148 }}>NAME</th>
                  <th style={{ ...thStyle, width: 128 }}>PHONE</th>
                  <th style={{ ...thStyle, width: 180 }}>EMAIL</th>
                  {/* Parent 2 */}
                  <th style={{ ...thStyle, borderLeft: '1px solid rgba(241,245,249,0.07)', width: 148 }}>NAME</th>
                  <th style={{ ...thStyle, width: 128 }}>PHONE</th>
                  <th style={{ ...thStyle, width: 180 }}>EMAIL</th>
                  {/* Actions */}
                  <th style={{ ...thStyle, width: 96, textAlign: 'center' as const }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={11}
                      style={{
                        ...tdStyle,
                        textAlign: 'center',
                        color: 'rgba(241,245,249,0.3)',
                        fontSize: 14,
                        backgroundColor: '#0E1520',
                      }}
                    >
                      {search || showMissingOnly ? 'No players match your filters' : 'No players yet — add your first player above'}
                    </td>
                  </tr>
                ) : (
                  rows.map((player, idx) => {
                    const [p1, p2] = getPlayerContacts(allContacts, player.id)
                    const color = PLAYER_COLORS[idx % PLAYER_COLORS.length]
                    const isNew = player.id === newPlayerId
                    const hasMissingContacts = !p1
                    const rowBg = idx % 2 === 0 ? '#0E1520' : 'rgba(241,245,249,0.015)'
                    const p1Name = p1 ? `${p1.first_name} ${p1.last_name}`.trim() : null
                    const p2Name = p2 ? `${p2.first_name} ${p2.last_name}`.trim() : null

                    return (
                      <tr
                        key={player.id}
                        ref={isNew ? newRowRef : undefined}
                        style={{
                          backgroundColor: rowBg,
                          animation: isNew ? 'pulse-row 1.5s ease-out' : undefined,
                          borderLeft: hasMissingContacts ? '2px solid rgba(247,98,10,0.3)' : '2px solid transparent',
                        }}
                        className="group"
                      >
                        {/* Player (sticky) */}
                        <td
                          style={{
                            ...tdStyle,
                            position: 'sticky',
                            left: 0,
                            zIndex: 10,
                            backgroundColor: rowBg,
                            width: 200,
                            minWidth: 200,
                            borderRight: '1px solid rgba(241,245,249,0.05)',
                          }}
                        >
                          <div className="flex items-center gap-2.5">
                            <div
                              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                              style={{ backgroundColor: `${color}22`, color, border: `1px solid ${color}44` }}
                            >
                              {playerInitials(player.first_name, player.last_name)}
                            </div>
                            <span className="text-sm font-semibold text-sp-text truncate">
                              {player.first_name} {player.last_name ?? ''}
                            </span>
                          </div>
                        </td>

                        {/* Jersey */}
                        <td style={{ ...tdStyle, borderLeft: '1px solid rgba(241,245,249,0.05)', width: 64 }}>
                          {cell(player.id, 'jersey', { displayValue: player.jersey_number })}
                        </td>

                        {/* Position */}
                        <td style={{ ...tdStyle, width: 80 }}>
                          {cell(player.id, 'position', {
                            displayValue: player.position,
                            selectOptions: POSITIONS,
                          })}
                        </td>

                        {/* Age */}
                        <td style={{ ...tdStyle, width: 64 }}>
                          {cell(player.id, 'age', {
                            displayValue: player.age?.toString() ?? null,
                            inputType: 'number',
                          })}
                        </td>

                        {/* P1 Name */}
                        <td style={{ ...tdStyle, borderLeft: '1px solid rgba(241,245,249,0.05)', width: 148 }}>
                          {cell(player.id, 'p1_name', { displayValue: p1Name, isAdd: !p1 })}
                        </td>

                        {/* P1 Phone */}
                        <td style={{ ...tdStyle, width: 128 }}>
                          {cell(player.id, 'p1_phone', { displayValue: p1?.phone ?? null, disabled: !p1 })}
                        </td>

                        {/* P1 Email */}
                        <td style={{ ...tdStyle, width: 180 }}>
                          {cell(player.id, 'p1_email', { displayValue: p1?.email ?? null, disabled: !p1 })}
                        </td>

                        {/* P2 Name */}
                        <td style={{ ...tdStyle, borderLeft: '1px solid rgba(241,245,249,0.05)', width: 148 }}>
                          {cell(player.id, 'p2_name', { displayValue: p2Name, isAdd: !!p1 && !p2, disabled: !p1 })}
                        </td>

                        {/* P2 Phone */}
                        <td style={{ ...tdStyle, width: 128 }}>
                          {cell(player.id, 'p2_phone', { displayValue: p2?.phone ?? null, disabled: !p2 })}
                        </td>

                        {/* P2 Email */}
                        <td style={{ ...tdStyle, width: 180 }}>
                          {cell(player.id, 'p2_email', { displayValue: p2?.email ?? null, disabled: !p2 })}
                        </td>

                        {/* Actions */}
                        <td style={{ ...tdStyle, width: 96, textAlign: 'center' }}>
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => router.push(`/players?openEval=${player.id}`)}
                              title="Evaluate"
                              className="w-7 h-7 rounded-lg flex items-center justify-center text-sm transition-colors hover:bg-white/10"
                              style={{ color: 'rgba(241,245,249,0.4)' }}
                            >
                              📊
                            </button>
                            <button
                              onClick={() => router.push(`/players?openDetail=${player.id}`)}
                              title="Player Detail"
                              className="w-7 h-7 rounded-lg flex items-center justify-center text-sm transition-colors hover:bg-white/10"
                              style={{ color: 'rgba(241,245,249,0.4)' }}
                            >
                              👤
                            </button>
                            <button
                              onClick={() => router.push(`/players?openDevPlan=${player.id}`)}
                              title="Dev Plan"
                              className="w-7 h-7 rounded-lg flex items-center justify-center text-sm transition-colors hover:bg-white/10"
                              style={{ color: 'rgba(241,245,249,0.4)' }}
                            >
                              ✏️
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pulse animation */}
      <style>{`
        @keyframes pulse-row {
          0%   { background-color: rgba(247,98,10,0.15); }
          100% { background-color: inherit; }
        }
      `}</style>

      {showAddModal && (
        <AddPlayerModal
          onClose={() => setShowAddModal(false)}
          onSuccess={player => setNewPlayerId(player.id)}
        />
      )}
    </div>
  )
}
