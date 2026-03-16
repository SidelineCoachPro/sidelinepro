'use client'

import { useState } from 'react'
import { useCreatePlayer } from '@/hooks/usePlayers'

const POSITIONS = ['PG', 'SG', 'SF', 'PF', 'C', 'G', 'F']
const labelStyle = { color: 'rgba(241,245,249,0.6)', fontSize: '13px', fontWeight: 500 } as const

export default function AddPlayerModal({ onClose }: { onClose: () => void }) {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName]   = useState('')
  const [jersey, setJersey]       = useState('')
  const [position, setPosition]   = useState('')
  const [age, setAge]             = useState('')
  const [error, setError]         = useState('')

  const { mutateAsync, isPending } = useCreatePlayer()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!firstName.trim()) { setError('First name is required'); return }
    setError('')
    try {
      await mutateAsync({
        first_name:    firstName.trim(),
        last_name:     lastName.trim() || null,
        jersey_number: jersey.trim() || null,
        position:      position || null,
        age:           age ? parseInt(age) : null,
      })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add player')
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="w-full max-w-md rounded-xl overflow-hidden"
        style={{ backgroundColor: '#0E1520', border: '1px solid rgba(241,245,249,0.07)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid rgba(241,245,249,0.07)' }}>
          <h2 className="text-base font-semibold text-sp-text">Add Player</h2>
          <button onClick={onClose} style={{ color: 'rgba(241,245,249,0.4)' }} className="hover:opacity-60 transition-opacity text-lg leading-none">✕</button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {/* Name row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block mb-1.5" style={labelStyle}>First Name *</label>
              <input value={firstName} onChange={e => setFirstName(e.target.value)} className="sp-input" placeholder="Marcus" />
            </div>
            <div>
              <label className="block mb-1.5" style={labelStyle}>Last Name</label>
              <input value={lastName} onChange={e => setLastName(e.target.value)} className="sp-input" placeholder="Johnson" />
            </div>
          </div>

          {/* Jersey + Position + Age */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block mb-1.5" style={labelStyle}>Jersey #</label>
              <input value={jersey} onChange={e => setJersey(e.target.value)} className="sp-input" placeholder="#5" />
            </div>
            <div>
              <label className="block mb-1.5" style={labelStyle}>Position</label>
              <select value={position} onChange={e => setPosition(e.target.value)} className="sp-input">
                <option value="" style={{ backgroundColor: '#0E1520' }}>—</option>
                {POSITIONS.map(p => <option key={p} value={p} style={{ backgroundColor: '#0E1520' }}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="block mb-1.5" style={labelStyle}>Age</label>
              <input type="number" min={5} max={25} value={age} onChange={e => setAge(e.target.value)} className="sp-input" placeholder="14" />
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-400 px-3 py-2 rounded-lg" style={{ backgroundColor: 'rgba(239,68,68,0.1)' }}>{error}</p>
          )}

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 pt-1">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium rounded-lg" style={{ color: 'rgba(241,245,249,0.5)' }}>
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-5 py-2 text-sm font-semibold rounded-lg disabled:opacity-50 transition-opacity hover:opacity-85"
              style={{ backgroundColor: '#F7620A', color: '#fff' }}
            >
              {isPending ? 'Adding...' : 'Add Player'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
