'use client'

import { useRouter } from 'next/navigation'
import { useSubscription } from '@/hooks/useSubscription'
import { canAccess, type Tier, type TierLimits, hasFeature } from '@/lib/subscription'

interface FeatureGateProps {
  /** Minimum tier required */
  tier?: Tier
  /** Specific boolean feature flag required */
  feature?: keyof TierLimits
  /** What to show when access is denied. Defaults to upgrade prompt overlay. */
  fallback?: React.ReactNode
  /** Don't render children at all when locked (vs. showing dimmed overlay) */
  hide?: boolean
  children: React.ReactNode
}

export default function FeatureGate({
  tier,
  feature,
  fallback,
  hide = false,
  children,
}: FeatureGateProps) {
  const sub = useSubscription()
  const router = useRouter()

  const allowed =
    (tier == null || canAccess(sub.tier, sub.status, tier)) &&
    (feature == null || hasFeature(sub, feature))

  if (allowed) return <>{children}</>
  if (hide) return null

  if (fallback) return <>{fallback}</>

  const requiredTier = tier ?? 'pro'

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ opacity: 0.35, pointerEvents: 'none', userSelect: 'none' }}>
        {children}
      </div>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
          background: 'rgba(14,21,32,0.75)',
          backdropFilter: 'blur(4px)',
          borderRadius: 12,
          border: '1px solid rgba(247,98,10,0.3)',
        }}
      >
        <span style={{ fontSize: 22 }}>🔒</span>
        <p style={{ fontSize: 13, fontWeight: 700, color: '#F1F5F9', textAlign: 'center' }}>
          {requiredTier === 'elite' ? 'Elite' : 'Pro'} feature
        </p>
        <button
          onClick={() => router.push('/pricing')}
          style={{
            padding: '6px 18px',
            borderRadius: 8,
            background: '#F7620A',
            color: '#fff',
            fontSize: 12,
            fontWeight: 700,
            cursor: 'pointer',
            border: 'none',
          }}
        >
          Upgrade
        </button>
      </div>
    </div>
  )
}
