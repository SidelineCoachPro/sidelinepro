'use client'

import { useState } from 'react'
import { useCreateParentContact, useUpdateParentContact, type ParentContact } from '@/hooks/useParentContacts'

const RELATIONSHIPS = ['Parent', 'Guardian', 'Grandparent', 'Aunt/Uncle', 'Other']

interface Props {
  playerId: string
  existing?: ParentContact
  isFirst: boolean
  onClose: () => void
}

export default function ContactModal({ playerId, existing, isFirst, onClose }: Props) {
  const { mutateAsync: create, isPending: creating } = useCreateParentContact()
  const { mutateAsync: update, isPending: updating } = useUpdateParentContact()
  const isPending = creating || updating

  const [firstName, setFirstName]       = useState(existing?.first_name ?? '')
  const [lastName, setLastName]         = useState(existing?.last_name ?? '')
  const [relationship, setRelationship] = useState(existing?.relationship ?? 'Parent')
  const [phone, setPhone]               = useState(existing?.phone ?? '')
  const [email, setEmail]               = useState(existing?.email ?? '')
  const [isPrimary, setIsPrimary]       = useState(existing?.is_primary ?? isFirst)
  const [error, setError]               = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!firstName.trim()) { setError('First name is required'); return }
    if (!phone.trim() && !email.trim()) { setError('Phone or email is required'); return }
    try {
      const payload = {
        player_id: playerId,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        relationship,
        phone: phone.trim() || null,
        email: email.trim() || null,
        is_primary: isPrimary,
      }
      if (existing) {
        await update({ id: existing.id, ...payload })
      } else {
        await create(payload)
      }
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save contact')
    }
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="w-full max-w-sm rounded-xl overflow-hidden"
        style={{ backgroundColor: '#0E1520', border: '1px solid rgba(241,245,249,0.1)' }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: '1px solid rgba(241,245,249,0.07)' }}
        >
          <p className="text-base font-bold text-sp-text">
            {existing ? 'Edit Contact' : 'Add Contact'}
          </p>
          <button onClick={onClose} className="hover:opacity-60 text-lg leading-none" style={{ color: 'rgba(241,245,249,0.4)' }}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
          {/* Name */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'rgba(241,245,249,0.5)' }}>First Name *</label>
              <input className="sp-input w-full text-sm" value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Jane" />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'rgba(241,245,249,0.5)' }}>Last Name</label>
              <input className="sp-input w-full text-sm" value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Smith" />
            </div>
          </div>

          {/* Relationship */}
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'rgba(241,245,249,0.5)' }}>Relationship</label>
            <select
              className="sp-input w-full text-sm"
              value={relationship}
              onChange={e => setRelationship(e.target.value)}
              style={{ backgroundColor: '#080C12' }}
            >
              {RELATIONSHIPS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          {/* Phone */}
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'rgba(241,245,249,0.5)' }}>Phone</label>
            <input className="sp-input w-full text-sm" type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="555-123-4567" />
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'rgba(241,245,249,0.5)' }}>Email</label>
            <input className="sp-input w-full text-sm" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="jane@example.com" />
          </div>

          {/* Primary toggle */}
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <button
              type="button"
              onClick={() => setIsPrimary(v => !v)}
              className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 transition-colors"
              style={{
                backgroundColor: isPrimary ? '#F7620A' : 'rgba(241,245,249,0.08)',
                border: `1px solid ${isPrimary ? '#F7620A' : 'rgba(241,245,249,0.15)'}`,
              }}
            >
              {isPrimary && <span className="text-white text-xs font-bold">✓</span>}
            </button>
            <span className="text-sm" style={{ color: 'rgba(241,245,249,0.6)' }}>Primary contact</span>
          </label>

          {error && <p className="text-xs text-red-400">{error}</p>}

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-opacity hover:opacity-70"
              style={{ backgroundColor: 'rgba(241,245,249,0.06)', color: 'rgba(241,245,249,0.5)' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: '#F7620A', color: '#fff' }}
            >
              {isPending ? 'Saving…' : existing ? 'Save Changes' : 'Add Contact'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
