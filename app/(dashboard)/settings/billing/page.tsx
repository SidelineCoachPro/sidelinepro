'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useSubscription } from '@/hooks/useSubscription'
import { PRICING } from '@/lib/subscription'

const STATUS_LABEL: Record<string, string> = {
  active: 'Active',
  trialing: 'Trial',
  past_due: 'Past due',
  canceled: 'Canceled',
  inactive: 'Free',
}

const STATUS_COLOR: Record<string, string> = {
  active: '#22C55E',
  trialing: '#38BDF8',
  past_due: '#F59E0B',
  canceled: '#EF4444',
  inactive: 'rgba(241,245,249,0.4)',
}

function BillingPage() {
  const sub = useSubscription()
  const params = useSearchParams()
  const success = params.get('success') === '1'
  const [portalLoading, setPortalLoading] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    if (success) setToast('Subscription updated — welcome aboard!')
  }, [success])

  async function openPortal() {
    setPortalLoading(true)
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' })
      const { url, error } = await res.json()
      if (error || !url) throw new Error(error ?? 'No URL')
      window.location.href = url
    } catch {
      setToast('Could not open billing portal. Please try again.')
      setPortalLoading(false)
    }
  }

  const tierLabel = sub.tier === 'free' ? 'Free' : sub.tier === 'pro' ? 'Pro' : 'Elite'
  const statusLabel = STATUS_LABEL[sub.status] ?? sub.status
  const statusColor = STATUS_COLOR[sub.status] ?? '#F1F5F9'

  const renewalDate = sub.subscriptionEndsAt
    ? new Date(sub.subscriptionEndsAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : null

  const trialEnd = sub.trialEndsAt
    ? new Date(sub.trialEndsAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : null

  return (
    <div style={{ maxWidth: 640, padding: '32px 24px' }}>
      {toast && (
        <div
          style={{ marginBottom: 24, padding: '12px 20px', borderRadius: 10, background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)', fontSize: 14, color: '#22C55E', display: 'flex', justifyContent: 'space-between' }}
        >
          {toast}
          <button onClick={() => setToast(null)} style={{ color: 'rgba(241,245,249,0.5)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16 }}>✕</button>
        </div>
      )}

      <h1 style={{ fontSize: 22, fontWeight: 800, color: '#F1F5F9', marginBottom: 6 }}>Billing & Subscription</h1>
      <p style={{ fontSize: 14, color: 'rgba(241,245,249,0.5)', marginBottom: 32 }}>Manage your plan and payment details.</p>

      {/* Current plan card */}
      <div style={{ borderRadius: 14, padding: 24, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(241,245,249,0.08)', marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <p style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'rgba(241,245,249,0.4)', marginBottom: 6 }}>Current plan</p>
            <p style={{ fontSize: 24, fontWeight: 800, color: '#F1F5F9' }}>{tierLabel}</p>
          </div>
          <span style={{ fontSize: 12, fontWeight: 700, padding: '4px 12px', borderRadius: 20, background: `${statusColor}1A`, color: statusColor, border: `1px solid ${statusColor}40` }}>
            {statusLabel}
          </span>
        </div>

        {sub.status === 'trialing' && trialEnd && (
          <div style={{ marginBottom: 16, padding: '10px 14px', borderRadius: 8, background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.2)', fontSize: 13, color: '#38BDF8' }}>
            Your free trial ends on <strong>{trialEnd}</strong>. You won&apos;t be charged until then.
          </div>
        )}

        {sub.status === 'past_due' && (
          <div style={{ marginBottom: 16, padding: '10px 14px', borderRadius: 8, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', fontSize: 13, color: '#F59E0B' }}>
            Payment failed. Please update your payment method to keep access.
          </div>
        )}

        <div style={{ display: 'flex', gap: 24, marginBottom: 20 }}>
          {sub.period && (
            <div>
              <p style={{ fontSize: 11, color: 'rgba(241,245,249,0.4)', marginBottom: 2 }}>Billing</p>
              <p style={{ fontSize: 14, fontWeight: 600, color: '#F1F5F9', textTransform: 'capitalize' }}>{sub.period}</p>
            </div>
          )}
          {sub.period && sub.tier !== 'free' && (
            <div>
              <p style={{ fontSize: 11, color: 'rgba(241,245,249,0.4)', marginBottom: 2 }}>Price</p>
              <p style={{ fontSize: 14, fontWeight: 600, color: '#F1F5F9' }}>
                ${sub.period === 'annual'
                  ? (sub.tier === 'pro' ? PRICING.pro.annual : PRICING.elite.annual)
                  : (sub.tier === 'pro' ? PRICING.pro.monthly : PRICING.elite.monthly)
                }/{sub.period === 'annual' ? 'yr' : 'mo'}
              </p>
            </div>
          )}
          {renewalDate && sub.status === 'active' && (
            <div>
              <p style={{ fontSize: 11, color: 'rgba(241,245,249,0.4)', marginBottom: 2 }}>Renews</p>
              <p style={{ fontSize: 14, fontWeight: 600, color: '#F1F5F9' }}>{renewalDate}</p>
            </div>
          )}
        </div>

        {sub.tier !== 'free' ? (
          <button
            onClick={openPortal}
            disabled={portalLoading}
            style={{ padding: '10px 20px', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: portalLoading ? 'not-allowed' : 'pointer', background: 'rgba(241,245,249,0.08)', border: '1px solid rgba(241,245,249,0.15)', color: '#F1F5F9', opacity: portalLoading ? 0.6 : 1 }}
          >
            {portalLoading ? 'Opening…' : 'Manage billing →'}
          </button>
        ) : (
          <Link
            href="/pricing"
            style={{ display: 'inline-block', padding: '10px 20px', borderRadius: 10, fontSize: 13, fontWeight: 700, background: '#F7620A', color: '#fff', textDecoration: 'none' }}
          >
            Upgrade to Pro
          </Link>
        )}
      </div>

      {sub.tier === 'free' && (
        <div style={{ borderRadius: 14, padding: 20, background: 'rgba(247,98,10,0.06)', border: '1px solid rgba(247,98,10,0.2)' }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: '#F7620A', marginBottom: 6 }}>🚀 Get more with Pro</p>
          <p style={{ fontSize: 13, color: 'rgba(241,245,249,0.6)', marginBottom: 14 }}>
            Unlimited players, AI dev plans, PDF export, parent portal, season planning, and more — starting at $8/mo with annual billing.
          </p>
          <Link
            href="/pricing"
            style={{ display: 'inline-block', padding: '8px 20px', borderRadius: 8, fontSize: 13, fontWeight: 700, background: '#F7620A', color: '#fff', textDecoration: 'none' }}
          >
            View plans →
          </Link>
        </div>
      )}
    </div>
  )
}

export default function BillingPageWrapper() {
  return (
    <Suspense>
      <BillingPage />
    </Suspense>
  )
}
