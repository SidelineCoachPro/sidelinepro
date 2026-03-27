// ── Stripe price key type (safe to import in client components) ───────────────
export type PriceKey = 'pro_monthly' | 'pro_annual' | 'elite_monthly' | 'elite_annual'

// ── Tier definitions ──────────────────────────────────────────────────────────

export type Tier = 'free' | 'pro' | 'elite'
export type SubStatus = 'trialing' | 'active' | 'past_due' | 'canceled' | 'inactive'
export type SubPeriod = 'monthly' | 'annual'

export interface SubscriptionState {
  tier: Tier
  status: SubStatus
  period: SubPeriod | null
  trialEndsAt: string | null
  subscriptionEndsAt: string | null
  isLoading: boolean
}

// ── Feature flags ─────────────────────────────────────────────────────────────

export interface TierLimits {
  players: number          // -1 = unlimited
  teams: number
  aiPlansPerMonth: number  // -1 = unlimited
  practiceTemplates: number
  gameFilm: boolean
  exportPDF: boolean
  parentPortal: boolean
  whiteboardSave: boolean
  customDrills: number     // -1 = unlimited
  seasonPlanning: boolean
  playsLibrary: boolean
  advancedStats: boolean
}

export const TIER_LIMITS: Record<Tier, TierLimits> = {
  free: {
    players: 15,
    teams: 1,
    aiPlansPerMonth: 3,
    practiceTemplates: 5,
    gameFilm: false,
    exportPDF: false,
    parentPortal: false,
    whiteboardSave: false,
    customDrills: 10,
    seasonPlanning: false,
    playsLibrary: false,
    advancedStats: false,
  },
  pro: {
    players: -1,
    teams: 3,
    aiPlansPerMonth: -1,
    practiceTemplates: -1,
    gameFilm: false,
    exportPDF: true,
    parentPortal: true,
    whiteboardSave: true,
    customDrills: -1,
    seasonPlanning: true,
    playsLibrary: true,
    advancedStats: false,
  },
  elite: {
    players: -1,
    teams: -1,
    aiPlansPerMonth: -1,
    practiceTemplates: -1,
    gameFilm: true,
    exportPDF: true,
    parentPortal: true,
    whiteboardSave: true,
    customDrills: -1,
    seasonPlanning: true,
    playsLibrary: true,
    advancedStats: true,
  },
}

// ── Pricing ───────────────────────────────────────────────────────────────────

export const PRICING = {
  pro: { monthly: 12, annual: 96, annualMonthly: 8 },
  elite: { monthly: 29, annual: 232, annualMonthly: 19 },
} as const

// ── Helpers ───────────────────────────────────────────────────────────────────

export function isActive(status: SubStatus): boolean {
  return status === 'active' || status === 'trialing'
}

export function canAccess(tier: Tier, status: SubStatus, requiredTier: Tier): boolean {
  if (!isActive(status) && tier !== 'free') return false
  const order: Tier[] = ['free', 'pro', 'elite']
  return order.indexOf(tier) >= order.indexOf(requiredTier)
}

export function hasFeature(sub: SubscriptionState, feature: keyof TierLimits): boolean {
  if (!isActive(sub.status) && sub.tier !== 'free') {
    return TIER_LIMITS.free[feature] as boolean
  }
  return TIER_LIMITS[sub.tier][feature] as boolean
}

export function getLimit(sub: SubscriptionState, limit: keyof TierLimits): number {
  if (!isActive(sub.status) && sub.tier !== 'free') {
    return TIER_LIMITS.free[limit] as number
  }
  return TIER_LIMITS[sub.tier][limit] as number
}

export const DEFAULT_SUB: SubscriptionState = {
  tier: 'free',
  status: 'inactive',
  period: null,
  trialEndsAt: null,
  subscriptionEndsAt: null,
  isLoading: true,
}
