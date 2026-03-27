'use client'

import { useRouter } from 'next/navigation'
import { useSubscription } from '@/hooks/useSubscription'
import { getLimit, type TierLimits } from '@/lib/subscription'

interface LimitGateProps {
  /** Which numeric limit to check */
  limit: keyof TierLimits
  /** Current count of the resource */
  count: number
  /** What to show when limit is reached */
  fallback?: React.ReactNode
  children: React.ReactNode
}

export default function LimitGate({ limit, count, fallback, children }: LimitGateProps) {
  const sub = useSubscription()
  const router = useRouter()
  const max = getLimit(sub, limit)

  // -1 = unlimited
  if (max === -1 || count < max) return <>{children}</>

  if (fallback) return <>{fallback}</>

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
        padding: '16px 24px',
        borderRadius: 12,
        background: 'rgba(247,98,10,0.08)',
        border: '1px solid rgba(247,98,10,0.25)',
        textAlign: 'center',
      }}
    >
      <p style={{ fontSize: 13, fontWeight: 600, color: '#F7620A' }}>
        {max} {limit} limit reached
      </p>
      <p style={{ fontSize: 12, color: 'rgba(241,245,249,0.6)' }}>
        Upgrade to Pro for unlimited access.
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
          marginTop: 4,
        }}
      >
        Upgrade
      </button>
    </div>
  )
}
