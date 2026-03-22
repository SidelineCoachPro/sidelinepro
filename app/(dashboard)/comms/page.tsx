'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { useMessageLog, useLogMessage } from '@/hooks/useMessageLog'
import { useParentContacts, type ParentContact } from '@/hooks/useParentContacts'
import { usePlayers } from '@/hooks/usePlayers'
import { TEMPLATES, type Template } from '@/lib/commsTemplates'
import {
  useAnnouncements,
  useCreateAnnouncement,
  useUpdateAnnouncement,
  useDeleteAnnouncement,
  type Announcement,
} from '@/hooks/useAnnouncements'

type Channel = 'sms' | 'email' | 'whatsapp'

const CHANNEL_CONFIG: Record<Channel, { label: string; color: string; bg: string; border: string }> = {
  sms:       { label: 'SMS',       color: '#22C55E', bg: 'rgba(34,197,94,0.1)',    border: 'rgba(34,197,94,0.25)' },
  email:     { label: 'Email',     color: '#38BDF8', bg: 'rgba(56,189,248,0.1)',   border: 'rgba(56,189,248,0.25)' },
  whatsapp:  { label: 'WhatsApp',  color: '#25D366', bg: 'rgba(37,211,102,0.1)',   border: 'rgba(37,211,102,0.25)' },
}

// ── Send Modal ─────────────────────────────────────────────────────────────────

function SendModal({
  template,
  allContacts,
  playerNames,
  onClose,
}: {
  template: Template
  allContacts: ParentContact[]
  playerNames: Record<string, string>
  onClose: () => void
}) {
  const [subject, setSubject] = useState(template.subject)
  const [body, setBody] = useState(template.body)
  const [channels, setChannels] = useState<Set<Channel>>(new Set<Channel>(['sms']))
  const [shouldLog, setShouldLog] = useState(true)
  const [sent, setSent] = useState<Channel[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [recipientsOpen, setRecipientsOpen] = useState(allContacts.length > 0)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const { mutate: logMessage } = useLogMessage()

  // Contacts grouped by player
  const grouped = useMemo(() => {
    const map = new Map<string, ParentContact[]>()
    for (const c of allContacts) {
      if (!map.has(c.player_id)) map.set(c.player_id, [])
      map.get(c.player_id)!.push(c)
    }
    return map
  }, [allContacts])

  const selectedContacts = allContacts.filter(c => selectedIds.has(c.id))
  const selectedPhones = selectedContacts.map(c => c.phone).filter(Boolean) as string[]
  const selectedEmails = selectedContacts.map(c => c.email).filter(Boolean) as string[]

  function toggleContact(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // Reset when template changes (intentionally only on id change, not every field re-render)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    setSubject(template.subject)
    setBody(template.body)
    setSent([])
  }, [template.id])

  // Find unfilled placeholders
  const placeholders = useMemo(() => {
    const matches = body.match(/\[[^\]]+\]/g) ?? []
    return Array.from(new Set(matches))
  }, [body])

  function selectPlaceholder(ph: string) {
    const el = textareaRef.current
    if (!el) return
    const idx = el.value.indexOf(ph)
    if (idx !== -1) {
      el.focus()
      el.setSelectionRange(idx, idx + ph.length)
    }
  }

  function toggleChannel(ch: Channel) {
    setChannels(prev => {
      const next = new Set(prev)
      if (next.has(ch)) next.delete(ch)
      else next.add(ch)
      return next
    })
  }

  function handleSend(channel: Channel, waPhone?: string) {
    const encodedBody = encodeURIComponent(body)
    if (channel === 'sms') {
      const phone = selectedPhones[0] ?? ''
      window.location.href = `sms:${phone}?body=${encodedBody}`
    } else if (channel === 'email') {
      const to = selectedEmails.join(',')
      window.location.href = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodedBody}`
    } else if (channel === 'whatsapp') {
      const phone = (waPhone ?? selectedPhones[0] ?? '').replace(/\D/g, '')
      window.open(`https://wa.me/${phone}?text=${encodedBody}`, '_blank')
    }
    if (shouldLog) {
      logMessage({ template_type: template.id, subject, body, channels: [channel] })
    }
    setSent(prev => [...prev, channel])
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="w-full max-w-lg rounded-2xl overflow-hidden flex flex-col"
        style={{
          backgroundColor: '#0E1520',
          border: '1px solid rgba(241,245,249,0.1)',
          maxHeight: '90vh',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid rgba(241,245,249,0.07)' }}>
          <div className="flex items-center gap-2.5">
            <span style={{ fontSize: 22 }}>{template.icon}</span>
            <div>
              <p className="text-base font-bold text-sp-text">{template.title}</p>
              <p className="text-xs" style={{ color: 'rgba(241,245,249,0.4)' }}>Customize then send</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full transition-colors"
            style={{ backgroundColor: 'rgba(241,245,249,0.06)', color: 'rgba(241,245,249,0.5)' }}
          >
            ✕
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">
          {/* Subject */}
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'rgba(241,245,249,0.5)' }}>Subject</label>
            <input
              className="sp-input w-full text-sm"
              value={subject}
              onChange={e => setSubject(e.target.value)}
            />
          </div>

          {/* Body */}
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'rgba(241,245,249,0.5)' }}>Message</label>
            <textarea
              ref={textareaRef}
              className="sp-input w-full text-sm leading-relaxed"
              rows={6}
              value={body}
              onChange={e => setBody(e.target.value)}
              style={{ resize: 'vertical' }}
            />
          </div>

          {/* Placeholder chips */}
          {placeholders.length > 0 && (
            <div>
              <p className="text-xs mb-2" style={{ color: 'rgba(241,245,249,0.35)' }}>
                Tap to select &amp; replace:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {placeholders.map(ph => (
                  <button
                    key={ph}
                    onClick={() => selectPlaceholder(ph)}
                    className="px-2.5 py-1 rounded-lg text-xs font-semibold transition-opacity hover:opacity-80"
                    style={{ backgroundColor: 'rgba(247,98,10,0.12)', color: '#F7620A', border: '1px solid rgba(247,98,10,0.25)' }}
                  >
                    {ph}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Channel selector */}
          <div>
            <label className="block text-xs font-semibold mb-2" style={{ color: 'rgba(241,245,249,0.5)' }}>Send via</label>
            <div className="flex gap-2">
              {(Object.keys(CHANNEL_CONFIG) as Channel[]).map(ch => {
                const cfg = CHANNEL_CONFIG[ch]
                const active = channels.has(ch)
                return (
                  <button
                    key={ch}
                    onClick={() => toggleChannel(ch)}
                    className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all"
                    style={{
                      backgroundColor: active ? cfg.bg : 'rgba(241,245,249,0.04)',
                      color: active ? cfg.color : 'rgba(241,245,249,0.35)',
                      border: `1px solid ${active ? cfg.border : 'rgba(241,245,249,0.08)'}`,
                    }}
                  >
                    {cfg.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Recipients */}
          {allContacts.length > 0 && (
            <div>
              <button
                type="button"
                onClick={() => setRecipientsOpen(v => !v)}
                className="flex items-center justify-between w-full text-xs font-semibold mb-2"
                style={{ color: 'rgba(241,245,249,0.5)' }}
              >
                <span>
                  Recipients
                  {selectedIds.size > 0 && (
                    <span
                      className="ml-2 px-1.5 py-0.5 rounded font-bold"
                      style={{ backgroundColor: 'rgba(247,98,10,0.2)', color: '#F7620A' }}
                    >
                      {selectedIds.size}
                    </span>
                  )}
                </span>
                <span>{recipientsOpen ? '▲' : '▼'}</span>
              </button>
              {recipientsOpen && (
                <div
                  className="rounded-xl overflow-hidden"
                  style={{ border: '1px solid rgba(241,245,249,0.08)' }}
                >
                  {Array.from(grouped.entries()).map(([playerId, pContacts]) => (
                    <div key={playerId} style={{ borderBottom: '1px solid rgba(241,245,249,0.05)' }}>
                      <p
                        className="px-3 pt-2.5 pb-1 text-xs font-semibold"
                        style={{ color: 'rgba(241,245,249,0.35)' }}
                      >
                        {playerNames[playerId] ?? 'Unknown Player'}
                      </p>
                      {pContacts.map(c => (
                        <label
                          key={c.id}
                          className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-white/[0.02]"
                        >
                          <div
                            onClick={() => toggleContact(c.id)}
                            className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0 transition-colors"
                            style={{
                              backgroundColor: selectedIds.has(c.id) ? '#F7620A' : 'rgba(241,245,249,0.08)',
                              border: `1px solid ${selectedIds.has(c.id) ? '#F7620A' : 'rgba(241,245,249,0.2)'}`,
                            }}
                          >
                            {selectedIds.has(c.id) && <span className="text-white" style={{ fontSize: 9, fontWeight: 900 }}>✓</span>}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-sp-text">
                              {c.first_name} {c.last_name ?? ''}
                              {c.is_primary && (
                                <span className="ml-1.5 text-xs" style={{ color: '#F7620A' }}>Primary</span>
                              )}
                            </p>
                            <p className="text-xs truncate" style={{ color: 'rgba(241,245,249,0.35)' }}>
                              {[c.phone, c.email].filter(Boolean).join(' · ')}
                            </p>
                          </div>
                        </label>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Log checkbox */}
          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <div
              onClick={() => setShouldLog(v => !v)}
              className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 transition-colors"
              style={{
                backgroundColor: shouldLog ? '#F7620A' : 'rgba(241,245,249,0.08)',
                border: `1px solid ${shouldLog ? '#F7620A' : 'rgba(241,245,249,0.15)'}`,
              }}
            >
              {shouldLog && <span className="text-white text-xs font-bold">✓</span>}
            </div>
            <span className="text-xs" style={{ color: 'rgba(241,245,249,0.5)' }}>Save to message history</span>
          </label>
        </div>

        {/* Send buttons */}
        <div className="px-5 pb-5 pt-3 space-y-2" style={{ borderTop: '1px solid rgba(241,245,249,0.07)' }}>
          {channels.size === 0 ? (
            <p className="text-xs text-center py-2" style={{ color: 'rgba(241,245,249,0.35)' }}>Select at least one channel above</p>
          ) : (
            Array.from(channels).map(ch => {
              const cfg = CHANNEL_CONFIG[ch]
              const alreadySent = sent.includes(ch)
              // WhatsApp: show one button per selected contact with a phone number
              if (ch === 'whatsapp' && selectedIds.size > 0) {
                const waContacts = selectedContacts.filter(c => c.phone)
                if (waContacts.length > 0) {
                  return (
                    <div key={ch} className="space-y-1.5">
                      {waContacts.map(c => (
                        <button
                          key={c.id}
                          onClick={() => handleSend('whatsapp', c.phone!)}
                          className="w-full py-3 rounded-xl text-sm font-bold transition-all"
                          style={{ backgroundColor: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}
                        >
                          WhatsApp → {c.first_name} {c.last_name ?? ''}
                        </button>
                      ))}
                    </div>
                  )
                }
              }
              return (
                <button
                  key={ch}
                  onClick={() => handleSend(ch)}
                  disabled={alreadySent}
                  className="w-full py-3.5 rounded-xl text-sm font-bold transition-all disabled:opacity-60"
                  style={{ backgroundColor: alreadySent ? 'rgba(241,245,249,0.06)' : cfg.bg, color: alreadySent ? 'rgba(241,245,249,0.4)' : cfg.color, border: `1px solid ${alreadySent ? 'rgba(241,245,249,0.1)' : cfg.border}` }}
                >
                  {alreadySent ? `✓ Opened in ${cfg.label}` : `Send via ${cfg.label} →`}
                </button>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}

// ── Template Card ─────────────────────────────────────────────────────────────

function TemplateCard({ template, onSend }: { template: Template; onSend: () => void }) {
  return (
    <div
      className="rounded-2xl overflow-hidden flex flex-col transition-all duration-150 hover:-translate-y-0.5"
      style={{
        backgroundColor: '#0E1520',
        border: '1px solid rgba(241,245,249,0.07)',
        cursor: 'default',
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(241,245,249,0.13)' }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(241,245,249,0.07)' }}
    >
      <div className="flex flex-1 gap-3 p-4">
        {/* Left accent bar */}
        <div className="w-1 rounded-full flex-shrink-0 self-stretch" style={{ backgroundColor: template.accent }} />

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span style={{ fontSize: 18 }}>{template.icon}</span>
            <p className="text-sm font-bold text-sp-text">{template.title}</p>
          </div>
          <p className="text-xs leading-relaxed line-clamp-2" style={{ color: 'rgba(241,245,249,0.4)' }}>
            {template.body}
          </p>
          {/* Channel badges */}
          <div className="flex gap-1.5 mt-2.5">
            {(Object.entries(CHANNEL_CONFIG) as [Channel, typeof CHANNEL_CONFIG[Channel]][]).map(([ch, cfg]) => (
              <span
                key={ch}
                className="px-2 py-0.5 rounded text-xs font-semibold"
                style={{ backgroundColor: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}
              >
                {cfg.label}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="px-4 pb-4">
        <button
          onClick={onSend}
          className="w-full py-2.5 rounded-xl text-xs font-bold transition-all active:scale-98 hover:opacity-90"
          style={{ backgroundColor: `${template.accent}18`, color: template.accent, border: `1px solid ${template.accent}33` }}
        >
          Customize &amp; Send
        </button>
      </div>
    </div>
  )
}

// ── Message History ────────────────────────────────────────────────────────────

const TEMPLATE_MAP = new Map(TEMPLATES.map(t => [t.id, t]))

function formatRelative(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 60) return `${diffMins}m ago`
  const diffHrs = Math.floor(diffMins / 60)
  if (diffHrs < 24) return `${diffHrs}h ago`
  const diffDays = Math.floor(diffHrs / 24)
  if (diffDays < 7) return `${diffDays}d ago`
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function MessageHistory() {
  const { data: logs = [], isLoading, isError } = useMessageLog()

  if (isLoading) {
    return (
      <div className="py-6 text-center">
        <p className="text-sm" style={{ color: 'rgba(241,245,249,0.3)' }}>Loading history…</p>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="rounded-xl px-4 py-5 text-center" style={{ border: '1px dashed rgba(241,245,249,0.1)' }}>
        <p className="text-sm font-medium mb-1" style={{ color: 'rgba(241,245,249,0.5)' }}>History unavailable</p>
        <p className="text-xs" style={{ color: 'rgba(241,245,249,0.3)' }}>
          Run the Supabase migration to enable message history.
        </p>
        <pre className="mt-3 text-left text-xs rounded-lg p-3 overflow-x-auto" style={{ backgroundColor: 'rgba(0,0,0,0.3)', color: 'rgba(241,245,249,0.5)' }}>
{`CREATE TABLE message_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id uuid NOT NULL,
  template_type text,
  subject text,
  body text,
  channels text[],
  sent_at timestamptz DEFAULT now()
);
ALTER TABLE message_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "message_log_own" ON message_log
  FOR ALL USING (auth.uid() = coach_id);`}
        </pre>
      </div>
    )
  }

  if (logs.length === 0) {
    return (
      <div className="rounded-xl px-4 py-8 text-center" style={{ border: '1px dashed rgba(241,245,249,0.08)' }}>
        <p className="text-sm" style={{ color: 'rgba(241,245,249,0.35)' }}>No messages sent yet this season.</p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(241,245,249,0.07)' }}>
      {logs.map((log, i) => {
        const tmpl = TEMPLATE_MAP.get(log.template_type)
        const icon = tmpl?.icon ?? '💬'
        const accent = tmpl?.accent ?? 'rgba(241,245,249,0.4)'
        return (
          <div
            key={log.id}
            className="flex items-start gap-3 px-4 py-3.5"
            style={{
              borderBottom: i < logs.length - 1 ? '1px solid rgba(241,245,249,0.05)' : 'none',
              backgroundColor: '#0E1520',
            }}
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm mt-0.5"
              style={{ backgroundColor: `${accent}15` }}
            >
              {icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-0.5">
                <p className="text-sm font-semibold text-sp-text truncate">{log.subject}</p>
                <p className="text-xs flex-shrink-0" style={{ color: 'rgba(241,245,249,0.3)' }}>{formatRelative(log.sent_at)}</p>
              </div>
              <p className="text-xs truncate mb-1.5" style={{ color: 'rgba(241,245,249,0.4)' }}>{log.body}</p>
              <div className="flex gap-1">
                {(log.channels ?? []).map(ch => {
                  const cfg = CHANNEL_CONFIG[ch as Channel]
                  if (!cfg) return null
                  return (
                    <span
                      key={ch}
                      className="px-1.5 py-0.5 rounded text-xs font-semibold"
                      style={{ backgroundColor: cfg.bg, color: cfg.color }}
                    >
                      {cfg.label}
                    </span>
                  )
                })}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Announcement Form Modal ────────────────────────────────────────────────────
function AnnouncementFormModal({
  announcement,
  onClose,
}: {
  announcement?: Announcement
  onClose: () => void
}) {
  const isEdit = !!announcement
  const { mutateAsync: create, isPending: isCreating } = useCreateAnnouncement()
  const { mutateAsync: update, isPending: isUpdating } = useUpdateAnnouncement()
  const isPending = isCreating || isUpdating

  const [title, setTitle] = useState(announcement?.title ?? '')
  const [body, setBody] = useState(announcement?.body ?? '')
  const [isPinned, setIsPinned] = useState(announcement?.is_pinned ?? false)
  const [error, setError] = useState('')

  async function handleSave() {
    if (!title.trim()) { setError('Title is required'); return }
    if (!body.trim()) { setError('Message body is required'); return }
    setError('')
    try {
      if (isEdit && announcement) {
        await update({ id: announcement.id, title: title.trim(), body: body.trim(), is_pinned: isPinned })
      } else {
        await create({ title: title.trim(), body: body.trim(), is_pinned: isPinned })
      }
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-md rounded-xl flex flex-col overflow-hidden" style={{ backgroundColor: '#0E1520', border: '1px solid rgba(241,245,249,0.1)' }}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid rgba(241,245,249,0.07)' }}>
          <h2 className="text-base font-semibold text-sp-text">{isEdit ? 'Edit Announcement' : 'New Announcement'}</h2>
          <button onClick={onClose} style={{ color: 'rgba(241,245,249,0.4)' }} className="hover:opacity-60 text-lg leading-none">✕</button>
        </div>
        <div className="px-5 py-5 space-y-4">
          <div>
            <label className="block mb-1.5 text-xs font-medium" style={{ color: 'rgba(241,245,249,0.6)' }}>Title *</label>
            <input value={title} onChange={e => setTitle(e.target.value)} className="sp-input w-full" placeholder="e.g. Practice cancelled Friday" />
          </div>
          <div>
            <label className="block mb-1.5 text-xs font-medium" style={{ color: 'rgba(241,245,249,0.6)' }}>Message *</label>
            <textarea value={body} onChange={e => setBody(e.target.value)} className="sp-input w-full" rows={4} placeholder="Write your announcement here..." style={{ resize: 'vertical' }} />
          </div>
          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <div
              onClick={() => setIsPinned(v => !v)}
              className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 transition-colors"
              style={{
                backgroundColor: isPinned ? '#F7620A' : 'rgba(241,245,249,0.08)',
                border: `1px solid ${isPinned ? '#F7620A' : 'rgba(241,245,249,0.15)'}`,
              }}
            >
              {isPinned && <span className="text-white text-xs font-bold">✓</span>}
            </div>
            <span className="text-sm" style={{ color: 'rgba(241,245,249,0.6)' }}>Pin to top</span>
          </label>
          {error && <p className="text-sm text-red-400 px-3 py-2 rounded-lg" style={{ backgroundColor: 'rgba(239,68,68,0.1)' }}>{error}</p>}
        </div>
        <div className="flex items-center justify-end gap-3 px-5 py-4" style={{ borderTop: '1px solid rgba(241,245,249,0.07)' }}>
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium" style={{ color: 'rgba(241,245,249,0.5)' }}>Cancel</button>
          <button
            onClick={handleSave}
            disabled={isPending}
            className="px-5 py-2 text-sm font-semibold rounded-lg disabled:opacity-50 hover:opacity-85 transition-opacity"
            style={{ backgroundColor: '#F7620A', color: '#fff' }}
          >
            {isPending ? 'Saving…' : isEdit ? 'Save Changes' : 'Post Announcement'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Announcement Card ──────────────────────────────────────────────────────────
function AnnouncementCard({ ann }: { ann: Announcement }) {
  const { mutateAsync: update } = useUpdateAnnouncement()
  const { mutateAsync: del } = useDeleteAnnouncement()
  const [editing, setEditing] = useState(false)
  const [confirmDel, setConfirmDel] = useState(false)

  function formatDate(iso: string) {
    const d = new Date(iso)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000)
    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays}d ago`
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  return (
    <>
      <div className="rounded-xl p-4" style={{ backgroundColor: '#0E1520', border: ann.is_pinned ? '1px solid rgba(247,98,10,0.3)' : '1px solid rgba(241,245,249,0.07)' }}>
        <div className="flex items-start gap-3">
          {ann.is_pinned && (
            <span className="flex-shrink-0 text-base mt-0.5" title="Pinned">📌</span>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <p className="text-sm font-bold text-sp-text leading-tight">{ann.title}</p>
              <p className="text-xs flex-shrink-0 mt-0.5" style={{ color: 'rgba(241,245,249,0.3)' }}>{formatDate(ann.created_at)}</p>
            </div>
            <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: 'rgba(241,245,249,0.6)' }}>{ann.body}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-3 pt-3" style={{ borderTop: '1px solid rgba(241,245,249,0.06)' }}>
          <button
            onClick={() => update({ id: ann.id, is_pinned: !ann.is_pinned })}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg transition-opacity hover:opacity-80"
            style={{ backgroundColor: ann.is_pinned ? 'rgba(247,98,10,0.12)' : 'rgba(241,245,249,0.06)', color: ann.is_pinned ? '#F7620A' : 'rgba(241,245,249,0.45)', border: `1px solid ${ann.is_pinned ? 'rgba(247,98,10,0.25)' : 'rgba(241,245,249,0.1)'}` }}
          >
            {ann.is_pinned ? '📌 Pinned' : 'Pin'}
          </button>
          <button onClick={() => setEditing(true)} className="px-3 py-1.5 text-xs font-semibold rounded-lg transition-opacity hover:opacity-80" style={{ backgroundColor: 'rgba(241,245,249,0.06)', color: 'rgba(241,245,249,0.45)', border: '1px solid rgba(241,245,249,0.1)' }}>
            Edit
          </button>
          {confirmDel ? (
            <>
              <button onClick={() => del(ann.id)} className="px-3 py-1.5 text-xs font-semibold rounded-lg" style={{ backgroundColor: 'rgba(239,68,68,0.15)', color: '#EF4444' }}>Confirm delete</button>
              <button onClick={() => setConfirmDel(false)} className="text-xs" style={{ color: 'rgba(241,245,249,0.35)' }}>Cancel</button>
            </>
          ) : (
            <button onClick={() => setConfirmDel(true)} className="ml-auto text-xs hover:opacity-60 transition-opacity" style={{ color: 'rgba(241,245,249,0.2)' }}>✕</button>
          )}
        </div>
      </div>
      {editing && <AnnouncementFormModal announcement={ann} onClose={() => setEditing(false)} />}
    </>
  )
}

// ── Announcements Section ──────────────────────────────────────────────────────
function AnnouncementsSection() {
  const { data: announcements = [], isLoading, isError } = useAnnouncements()
  const [showNew, setShowNew] = useState(false)

  return (
    <section className="mb-10">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'rgba(241,245,249,0.35)' }}>
          Team Announcements
        </h2>
        <button
          onClick={() => setShowNew(true)}
          className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg transition-opacity hover:opacity-85"
          style={{ backgroundColor: 'rgba(247,98,10,0.12)', color: '#F7620A', border: '1px solid rgba(247,98,10,0.25)' }}
        >
          + New
        </button>
      </div>

      {isLoading ? (
        <div className="py-6 text-center"><p className="text-sm" style={{ color: 'rgba(241,245,249,0.3)' }}>Loading…</p></div>
      ) : isError ? (
        <div className="rounded-xl px-4 py-5 text-center" style={{ border: '1px dashed rgba(241,245,249,0.1)' }}>
          <p className="text-sm" style={{ color: 'rgba(241,245,249,0.4)' }}>Run the Supabase migration to enable announcements.</p>
        </div>
      ) : announcements.length === 0 ? (
        <div className="rounded-xl px-4 py-8 text-center" style={{ border: '1px dashed rgba(241,245,249,0.08)' }}>
          <p className="text-sm" style={{ color: 'rgba(241,245,249,0.35)' }}>No announcements yet. Post one for parents to see.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {announcements.map(ann => <AnnouncementCard key={ann.id} ann={ann} />)}
        </div>
      )}

      {showNew && <AnnouncementFormModal onClose={() => setShowNew(false)} />}
    </section>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function CommsPage() {
  const searchParams = useSearchParams()
  const [activeTemplate, setActiveTemplate] = useState<Template | null>(null)

  const { data: players = [] }  = usePlayers()
  const { data: allContacts = [] } = useParentContacts()

  const playerNames: Record<string, string> = useMemo(() => {
    return Object.fromEntries(
      players.map(p => [p.id, `${p.first_name} ${p.last_name ?? ''}`.trim()])
    )
  }, [players])

  // Contacts summary stats
  const totalContacts = allContacts.length
  const playersWithContact = new Set(allContacts.map(c => c.player_id)).size
  const playersWithout = players.length - playersWithContact

  // Auto-open modal if ?send=<templateId> is in the URL
  useEffect(() => {
    const id = searchParams.get('send')
    if (id) {
      const t = TEMPLATES.find(t => t.id === id)
      if (t) setActiveTemplate(t)
    }
  }, [searchParams])

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-sp-text mb-1">Parent Communications</h1>
        <p className="text-sm" style={{ color: 'rgba(241,245,249,0.45)' }}>
          One tap to notify every parent. Opens in your SMS, Email, or WhatsApp.
        </p>
      </div>

      {/* Contacts summary bar */}
      {players.length > 0 && (
        <div
          className="flex items-center gap-4 px-4 py-3 rounded-xl mb-8"
          style={{ backgroundColor: '#0E1520', border: '1px solid rgba(241,245,249,0.07)' }}
        >
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-bold text-sp-text">{players.length}</span>
            <span className="text-xs" style={{ color: 'rgba(241,245,249,0.4)' }}>players</span>
          </div>
          <div className="w-px h-4" style={{ backgroundColor: 'rgba(241,245,249,0.1)' }} />
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-bold text-sp-text">{totalContacts}</span>
            <span className="text-xs" style={{ color: 'rgba(241,245,249,0.4)' }}>contacts</span>
          </div>
          {playersWithout > 0 && (
            <>
              <div className="w-px h-4" style={{ backgroundColor: 'rgba(241,245,249,0.1)' }} />
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold" style={{ color: '#F5B731' }}>{playersWithout}</span>
                <span className="text-xs" style={{ color: 'rgba(241,245,249,0.4)' }}>missing contacts</span>
              </div>
            </>
          )}
        </div>
      )}

      {/* Announcements */}
      <AnnouncementsSection />

      {/* Quick Templates */}
      <section className="mb-10">
        <h2 className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: 'rgba(241,245,249,0.35)' }}>
          Quick Templates
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {TEMPLATES.map(t => (
            <TemplateCard
              key={t.id}
              template={t}
              onSend={() => setActiveTemplate(t)}
            />
          ))}
        </div>
      </section>

      {/* Message History */}
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: 'rgba(241,245,249,0.35)' }}>
          Message History
        </h2>
        <MessageHistory />
      </section>

      {/* Send Modal */}
      {activeTemplate && (
        <SendModal
          template={activeTemplate}
          allContacts={allContacts}
          playerNames={playerNames}
          onClose={() => setActiveTemplate(null)}
        />
      )}
    </div>
  )
}
