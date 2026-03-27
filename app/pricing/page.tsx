'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { PRICING, type PriceKey } from '@/lib/subscription'
// Note: PriceKey imported from subscription.ts to keep this client-safe
import { useSubscription } from '@/hooks/useSubscription'

// Re-export PRICING shape isn't on subscription.ts, so define here
const TIERS = [
  {
    key: 'free' as const,
    name: 'Free',
    desc: 'Get started with the basics',
    color: 'rgba(241,245,249,0.15)',
    monthly: 0,
    annual: 0,
    priceKeyMonthly: null as PriceKey | null,
    priceKeyAnnual: null as PriceKey | null,
    features: [
      'Up to 15 players',
      '1 team',
      '3 AI dev plans / month',
      '5 practice templates',
      '10 custom drills',
      'Basic whiteboard',
    ],
    missing: ['PDF export', 'Parent portal', 'Season planning', 'Plays library', 'Unlimited AI plans'],
  },
  {
    key: 'pro' as const,
    name: 'Pro',
    desc: 'Everything growing coaches need',
    color: '#F7620A',
    monthly: PRICING.pro.monthly,
    annual: PRICING.pro.annual,
    annualMonthly: PRICING.pro.annualMonthly,
    priceKeyMonthly: 'pro_monthly' as PriceKey,
    priceKeyAnnual: 'pro_annual' as PriceKey,
    trial: true,
    features: [
      'Unlimited players',
      'Up to 3 teams',
      'Unlimited AI dev plans',
      'Unlimited practice templates',
      'Unlimited custom drills',
      'PDF export',
      'Parent portal',
      'Season planning',
      'Plays library',
      'Whiteboard save',
    ],
    missing: ['Game film', 'Advanced stats'],
  },
  {
    key: 'elite' as const,
    name: 'Elite',
    desc: 'For serious programs',
    color: '#8B5CF6',
    monthly: PRICING.elite.monthly,
    annual: PRICING.elite.annual,
    annualMonthly: PRICING.elite.annualMonthly,
    priceKeyMonthly: 'elite_monthly' as PriceKey,
    priceKeyAnnual: 'elite_annual' as PriceKey,
    features: [
      'Everything in Pro',
      'Unlimited teams',
      'Game film',
      'Advanced stats',
      'Priority support',
    ],
    missing: [],
  },
]

export default function PricingPage() {
  const [annual, setAnnual] = useState(false)
  const [loading, setLoading] = useState<string | null>(null)
  const sub = useSubscription()
  const router = useRouter()
  const params = useSearchParams()
  const canceled = params.get('canceled') === '1'

  async function handleCheckout(tier: typeof TIERS[0], withTrial = false) {
    const priceKey = annual ? tier.priceKeyAnnual : tier.priceKeyMonthly
    if (!priceKey) return
    setLoading(tier.key)
    try {
      const res = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceKey, trial: withTrial }),
      })
      const { url, error } = await res.json()
      if (error || !url) throw new Error(error ?? 'No URL')
      window.location.href = url
    } catch (err) {
      console.error(err)
      setLoading(null)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#080E18', color: '#F1F5F9', padding: '60px 24px' }}>
      {/* Back link */}
      <div style={{ maxWidth: 960, margin: '0 auto 40px' }}>
        <Link href="/dashboard" style={{ fontSize: 13, color: 'rgba(241,245,249,0.5)', textDecoration: 'none' }}>
          ← Back to dashboard
        </Link>
      </div>

      {canceled && (
        <div style={{ maxWidth: 960, margin: '0 auto 24px', padding: '12px 20px', borderRadius: 10, background: 'rgba(241,245,249,0.06)', border: '1px solid rgba(241,245,249,0.1)', fontSize: 13, color: 'rgba(241,245,249,0.7)' }}>
          Checkout canceled — you have not been charged.
        </div>
      )}

      {/* Header */}
      <div style={{ maxWidth: 960, margin: '0 auto', textAlign: 'center', marginBottom: 48 }}>
        <h1 style={{ fontSize: 36, fontWeight: 800, marginBottom: 12 }}>Simple, transparent pricing</h1>
        <p style={{ fontSize: 16, color: 'rgba(241,245,249,0.6)', marginBottom: 28 }}>
          Start free. Upgrade when you&apos;re ready.
        </p>

        {/* Toggle */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, background: 'rgba(255,255,255,0.05)', borderRadius: 40, padding: '6px 16px' }}>
          <button
            onClick={() => setAnnual(false)}
            style={{
              padding: '6px 20px', borderRadius: 30, fontSize: 13, fontWeight: 600, cursor: 'pointer', border: 'none',
              background: !annual ? '#F7620A' : 'transparent',
              color: !annual ? '#fff' : 'rgba(241,245,249,0.5)',
            }}
          >
            Monthly
          </button>
          <button
            onClick={() => setAnnual(true)}
            style={{
              padding: '6px 20px', borderRadius: 30, fontSize: 13, fontWeight: 600, cursor: 'pointer', border: 'none',
              background: annual ? '#F7620A' : 'transparent',
              color: annual ? '#fff' : 'rgba(241,245,249,0.5)',
            }}
          >
            Annual <span style={{ fontSize: 11, marginLeft: 4, color: '#22C55E', fontWeight: 700 }}>SAVE 33%</span>
          </button>
        </div>
      </div>

      {/* Cards */}
      <div style={{ maxWidth: 960, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
        {TIERS.map(tier => {
          const isCurrent = sub.tier === tier.key && (sub.status === 'active' || sub.status === 'trialing' || tier.key === 'free')
          const price = annual && tier.annualMonthly ? tier.annualMonthly : tier.monthly
          const isPopular = tier.key === 'pro'

          return (
            <div
              key={tier.key}
              style={{
                borderRadius: 16,
                padding: 28,
                background: isPopular ? 'rgba(247,98,10,0.08)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${isCurrent ? tier.color : isPopular ? 'rgba(247,98,10,0.4)' : 'rgba(241,245,249,0.08)'}`,
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {isPopular && (
                <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: '#F7620A', color: '#fff', fontSize: 11, fontWeight: 700, padding: '3px 14px', borderRadius: 20 }}>
                  MOST POPULAR
                </div>
              )}

              <div style={{ marginBottom: 20 }}>
                <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 4 }}>{tier.name}</h2>
                <p style={{ fontSize: 13, color: 'rgba(241,245,249,0.5)' }}>{tier.desc}</p>
              </div>

              <div style={{ marginBottom: 24 }}>
                {price === 0 ? (
                  <span style={{ fontSize: 36, fontWeight: 800 }}>Free</span>
                ) : (
                  <>
                    <span style={{ fontSize: 36, fontWeight: 800 }}>${price}</span>
                    <span style={{ fontSize: 14, color: 'rgba(241,245,249,0.5)', marginLeft: 4 }}>/mo</span>
                    {annual && tier.annualMonthly && (
                      <p style={{ fontSize: 12, color: '#22C55E', marginTop: 4 }}>
                        Billed ${tier.annual}/yr
                      </p>
                    )}
                  </>
                )}
              </div>

              {/* CTA */}
              {tier.key === 'free' ? (
                isCurrent ? (
                  <div style={{ padding: '10px 0', textAlign: 'center', fontSize: 13, color: 'rgba(241,245,249,0.5)', fontWeight: 600 }}>Current plan</div>
                ) : (
                  <button
                    onClick={() => router.push('/dashboard')}
                    style={{ padding: '10px 0', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', border: '1px solid rgba(241,245,249,0.15)', background: 'transparent', color: '#F1F5F9' }}
                  >
                    Get started free
                  </button>
                )
              ) : isCurrent ? (
                <div style={{ padding: '10px 0', textAlign: 'center', fontSize: 13, color: tier.color, fontWeight: 700 }}>✓ Current plan</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {tier.trial && (
                    <button
                      onClick={() => handleCheckout(tier, true)}
                      disabled={!!loading}
                      style={{
                        padding: '10px 0', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
                        background: tier.color, color: '#fff', border: 'none', opacity: loading === tier.key ? 0.7 : 1,
                      }}
                    >
                      {loading === tier.key ? 'Loading…' : 'Start 7-day free trial'}
                    </button>
                  )}
                  <button
                    onClick={() => handleCheckout(tier, false)}
                    disabled={!!loading}
                    style={{
                      padding: '10px 0', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
                      background: 'transparent', color: tier.trial ? 'rgba(241,245,249,0.5)' : '#F1F5F9',
                      border: `1px solid ${tier.trial ? 'rgba(241,245,249,0.1)' : tier.color}`,
                    }}
                  >
                    {tier.trial ? 'Subscribe without trial' : (loading === tier.key ? 'Loading…' : `Upgrade to ${tier.name}`)}
                  </button>
                </div>
              )}

              {/* Features */}
              <ul style={{ marginTop: 24, listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
                {tier.features.map(f => (
                  <li key={f} style={{ fontSize: 13, color: 'rgba(241,245,249,0.8)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ color: '#22C55E', flexShrink: 0 }}>✓</span> {f}
                  </li>
                ))}
                {tier.missing.map(f => (
                  <li key={f} style={{ fontSize: 13, color: 'rgba(241,245,249,0.3)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ flexShrink: 0 }}>✗</span> {f}
                  </li>
                ))}
              </ul>
            </div>
          )
        })}
      </div>

      <p style={{ textAlign: 'center', marginTop: 40, fontSize: 12, color: 'rgba(241,245,249,0.35)' }}>
        All plans include a 30-day money-back guarantee. Cancel anytime.
      </p>
    </div>
  )
}
