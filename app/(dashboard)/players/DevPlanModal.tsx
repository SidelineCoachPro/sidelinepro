'use client'

import { type Player } from '@/hooks/usePlayers'
import { type DevPlan } from '@/hooks/useDevPlans'
import { useParentContacts } from '@/hooks/useParentContacts'
import { SKILLS } from './evalUtils'

interface Props {
  player: Player
  plan: DevPlan
  onClose: () => void
}

const SKILL_LABEL: Record<string, string> = Object.fromEntries(
  SKILLS.map(s => [s.key, s.label])
)
const SKILL_COLOR: Record<string, string> = Object.fromEntries(
  SKILLS.map(s => [s.key, s.color])
)

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function DevPlanModal({ player, plan, onClose }: Props) {
  const skillLabel = SKILL_LABEL[plan.focus_skill] ?? plan.focus_skill
  const skillColor = SKILL_COLOR[plan.focus_skill] ?? '#F7620A'

  const { data: contacts = [] } = useParentContacts(player.id)
  const primary = contacts.find(c => c.is_primary) ?? contacts[0] ?? null

  const playerFullName = `${player.first_name} ${player.last_name ?? ''}`.trim()
  const parentName = primary ? primary.first_name : 'there'
  const message = plan.message_text
    .replace('[Player Name]', playerFullName)
    .replace('[Parent Name]', parentName)

  // Deep-link helpers — pre-fill primary contact when available
  function smsLink() {
    const body = encodeURIComponent(`${message}\n\nDev Plan: ${plan.drills.map((d, i) => `${i + 1}. ${d.name} (${d.duration_mins} min)`).join(', ')}`)
    const phone = primary?.phone ?? ''
    return `sms:${phone}?body=${body}`
  }

  function emailLink() {
    const subject = encodeURIComponent(`${playerFullName}'s ${skillLabel} Development Plan`)
    const body = encodeURIComponent(
      `${message}\n\nDRILLS (${plan.duration_mins} min total):\n\n` +
      plan.drills.map((d, i) =>
        `${i + 1}. ${d.name} (${d.duration_mins} min)\n${d.instructions}`
      ).join('\n\n')
    )
    const to = primary?.email ?? ''
    return `mailto:${to}?subject=${subject}&body=${body}`
  }

  function whatsappLink() {
    const text = encodeURIComponent(
      `${message}\n\n*${playerFullName}'s ${skillLabel} Dev Plan (${plan.duration_mins} min)*\n\n` +
      plan.drills.map((d, i) => `${i + 1}. *${d.name}* (${d.duration_mins} min)\n${d.instructions}`).join('\n\n')
    )
    const phone = primary?.phone?.replace(/\D/g, '') ?? ''
    return `https://wa.me/${phone}?text=${text}`
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="w-full max-w-lg rounded-xl flex flex-col overflow-hidden"
        style={{ backgroundColor: '#0E1520', border: '1px solid rgba(241,245,249,0.07)', maxHeight: '92vh' }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 flex-shrink-0"
          style={{ borderBottom: '1px solid rgba(241,245,249,0.07)' }}
        >
          <div>
            <h2 className="text-base font-semibold text-sp-text">Development Plan</h2>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(241,245,249,0.4)' }}>
              {playerFullName} · {formatDate(plan.created_at)}
            </p>
          </div>
          <button onClick={onClose} style={{ color: 'rgba(241,245,249,0.4)' }} className="hover:opacity-60 transition-opacity text-lg leading-none">✕</button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
          {/* Focus skill badge */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'rgba(241,245,249,0.35)' }}>Focus</span>
            <span
              className="text-sm font-bold px-3 py-1 rounded-full"
              style={{ backgroundColor: `${skillColor}18`, color: skillColor, border: `1px solid ${skillColor}33` }}
            >
              {skillLabel}
            </span>
            <span className="text-xs ml-auto" style={{ color: 'rgba(241,245,249,0.35)' }}>
              {plan.duration_mins} min total
            </span>
          </div>

          {/* Drill cards */}
          <div className="space-y-3">
            {plan.drills.map((drill, i) => (
              <div
                key={drill.id}
                className="rounded-xl px-4 py-3"
                style={{ backgroundColor: 'rgba(241,245,249,0.03)', border: '1px solid rgba(241,245,249,0.07)' }}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                      style={{ backgroundColor: `${skillColor}22`, color: skillColor }}
                    >
                      {i + 1}
                    </span>
                    <span className="text-sm font-semibold text-sp-text">{drill.name}</span>
                  </div>
                  <span className="text-xs" style={{ color: 'rgba(241,245,249,0.35)' }}>{drill.duration_mins} min</span>
                </div>
                <p className="text-xs leading-relaxed pl-7" style={{ color: 'rgba(241,245,249,0.55)' }}>
                  {drill.instructions}
                </p>
              </div>
            ))}
          </div>

          {/* Parent message preview */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'rgba(241,245,249,0.35)' }}>
              Message to Parent
            </p>
            <div
              className="rounded-xl px-4 py-3"
              style={{ backgroundColor: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.2)' }}
            >
              <p className="text-sm leading-relaxed" style={{ color: 'rgba(241,245,249,0.65)' }}>
                {message}
              </p>
            </div>
          </div>

          {/* Send options */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide mb-2.5" style={{ color: 'rgba(241,245,249,0.35)' }}>
              Send to Parent
            </p>
            <div className="flex gap-2 flex-wrap">
              <a
                href={smsLink()}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-opacity hover:opacity-80"
                style={{ backgroundColor: 'rgba(34,197,94,0.12)', color: '#22C55E', border: '1px solid rgba(34,197,94,0.25)' }}
              >
                <span>💬</span> Text
              </a>
              <a
                href={emailLink()}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-opacity hover:opacity-80"
                style={{ backgroundColor: 'rgba(56,189,248,0.12)', color: '#38BDF8', border: '1px solid rgba(56,189,248,0.25)' }}
              >
                <span>✉️</span> Email
              </a>
              <a
                href={whatsappLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-opacity hover:opacity-80"
                style={{ backgroundColor: 'rgba(37,211,102,0.12)', color: '#25D366', border: '1px solid rgba(37,211,102,0.25)' }}
              >
                <span>📱</span> WhatsApp
              </a>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          className="flex-shrink-0 px-6 py-4 flex justify-end"
          style={{ borderTop: '1px solid rgba(241,245,249,0.07)' }}
        >
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium rounded-lg transition-opacity hover:opacity-75"
            style={{ color: 'rgba(241,245,249,0.5)' }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
