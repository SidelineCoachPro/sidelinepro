'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { useMessageLog, useLogMessage } from '@/hooks/useMessageLog'
import { TEMPLATES, type Template } from '@/lib/commsTemplates'

type Channel = 'sms' | 'email' | 'whatsapp'

const CHANNEL_CONFIG: Record<Channel, { label: string; color: string; bg: string; border: string }> = {
  sms:       { label: 'SMS',       color: '#22C55E', bg: 'rgba(34,197,94,0.1)',    border: 'rgba(34,197,94,0.25)' },
  email:     { label: 'Email',     color: '#38BDF8', bg: 'rgba(56,189,248,0.1)',   border: 'rgba(56,189,248,0.25)' },
  whatsapp:  { label: 'WhatsApp',  color: '#25D366', bg: 'rgba(37,211,102,0.1)',   border: 'rgba(37,211,102,0.25)' },
}

// ── Send Modal ─────────────────────────────────────────────────────────────────

function SendModal({ template, onClose }: { template: Template; onClose: () => void }) {
  const [subject, setSubject] = useState(template.subject)
  const [body, setBody] = useState(template.body)
  const [channels, setChannels] = useState<Set<Channel>>(new Set<Channel>(['sms']))
  const [shouldLog, setShouldLog] = useState(true)
  const [sent, setSent] = useState<Channel[]>([])
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const { mutate: logMessage } = useLogMessage()

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

  function handleSend(channel: Channel) {
    if (channel === 'sms') {
      window.location.href = `sms:?body=${encodeURIComponent(body)}`
    } else if (channel === 'email') {
      window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    } else if (channel === 'whatsapp') {
      window.open(`https://wa.me/?text=${encodeURIComponent(body)}`, '_blank')
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

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function CommsPage() {
  const searchParams = useSearchParams()
  const [activeTemplate, setActiveTemplate] = useState<Template | null>(null)

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
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-sp-text mb-1">Parent Communications</h1>
        <p className="text-sm" style={{ color: 'rgba(241,245,249,0.45)' }}>
          One tap to notify every parent. Opens in your SMS, Email, or WhatsApp.
        </p>
      </div>

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
          onClose={() => setActiveTemplate(null)}
        />
      )}
    </div>
  )
}
