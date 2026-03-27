'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import {
  type SubscriptionState,
  type Tier,
  type SubStatus,
  type SubPeriod,
  DEFAULT_SUB,
  hasFeature,
  getLimit,
  canAccess,
} from '@/lib/subscription'

export function useSubscription(): SubscriptionState {
  const { data, isLoading } = useQuery({
    queryKey: ['subscription'],
    queryFn: async (): Promise<SubscriptionState> => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return { ...DEFAULT_SUB, isLoading: false }

      const { data: coach } = await supabase
        .from('coaches')
        .select('subscription_tier, subscription_status, subscription_period, trial_ends_at, subscription_ends_at')
        .eq('id', user.id)
        .maybeSingle()

      if (!coach) return { ...DEFAULT_SUB, isLoading: false }

      return {
        tier: (coach.subscription_tier ?? 'free') as Tier,
        status: (coach.subscription_status ?? 'inactive') as SubStatus,
        period: (coach.subscription_period ?? null) as SubPeriod | null,
        trialEndsAt: coach.trial_ends_at ?? null,
        subscriptionEndsAt: coach.subscription_ends_at ?? null,
        isLoading: false,
      }
    },
    staleTime: 5 * 60 * 1000,
  })

  if (isLoading) return DEFAULT_SUB
  return data ?? { ...DEFAULT_SUB, isLoading: false }
}

// Convenience hooks
export function useHasFeature(feature: Parameters<typeof hasFeature>[1]): boolean {
  const sub = useSubscription()
  return hasFeature(sub, feature)
}

export function useLimit(limit: Parameters<typeof getLimit>[1]): number {
  const sub = useSubscription()
  return getLimit(sub, limit)
}

export function useCanAccess(requiredTier: Tier): boolean {
  const sub = useSubscription()
  return canAccess(sub.tier, sub.status, requiredTier)
}
