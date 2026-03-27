import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/admin'
import type Stripe from 'stripe'

// App Router: body is read via req.text(), no bodyParser config needed

// Map Stripe status → our status
function mapStatus(stripeStatus: string): string {
  switch (stripeStatus) {
    case 'trialing':  return 'trialing'
    case 'active':    return 'active'
    case 'past_due':  return 'past_due'
    case 'canceled':  return 'canceled'
    default:          return 'inactive'
  }
}

// Infer tier from price ID
function tierFromPriceId(priceId: string): string {
  const proMonthly   = process.env.STRIPE_PRO_MONTHLY_PRICE_ID
  const proAnnual    = process.env.STRIPE_PRO_ANNUAL_PRICE_ID
  const eliteMonthly = process.env.STRIPE_ELITE_MONTHLY_PRICE_ID
  const eliteAnnual  = process.env.STRIPE_ELITE_ANNUAL_PRICE_ID
  if (priceId === proMonthly || priceId === proAnnual) return 'pro'
  if (priceId === eliteMonthly || priceId === eliteAnnual) return 'elite'
  return 'free'
}

function periodFromPriceId(priceId: string): string | null {
  const monthly = [process.env.STRIPE_PRO_MONTHLY_PRICE_ID, process.env.STRIPE_ELITE_MONTHLY_PRICE_ID]
  const annual  = [process.env.STRIPE_PRO_ANNUAL_PRICE_ID, process.env.STRIPE_ELITE_ANNUAL_PRICE_ID]
  if (monthly.includes(priceId)) return 'monthly'
  if (annual.includes(priceId)) return 'annual'
  return null
}

async function syncSubscription(subscription: Stripe.Subscription) {
  const admin = createAdminClient()
  const customerId = subscription.customer as string
  const priceId = subscription.items.data[0]?.price.id ?? ''

  // In Stripe v21, billing cycle anchor lives on subscription directly
  // Use type assertion to access fields that may vary by API version
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sub = subscription as any

  const updates = {
    stripe_subscription_id: subscription.id,
    subscription_tier: tierFromPriceId(priceId),
    subscription_status: mapStatus(subscription.status),
    subscription_period: periodFromPriceId(priceId),
    trial_ends_at: subscription.trial_end
      ? new Date(subscription.trial_end * 1000).toISOString()
      : null,
    subscription_ends_at: sub.current_period_end
      ? new Date(sub.current_period_end * 1000).toISOString()
      : null,
  }

  await admin.from('coaches').update(updates).eq('stripe_customer_id', customerId)
}

async function handleCancellation(subscription: Stripe.Subscription) {
  const admin = createAdminClient()
  const customerId = subscription.customer as string

  await admin.from('coaches').update({
    subscription_tier: 'free',
    subscription_status: 'inactive',
    subscription_period: null,
    trial_ends_at: null,
    subscription_ends_at: null,
    stripe_subscription_id: null,
  }).eq('stripe_customer_id', customerId)
}

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')

  if (!sig) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    console.error('Webhook signature error:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await syncSubscription(event.data.object as Stripe.Subscription)
        break

      case 'customer.subscription.deleted':
        await handleCancellation(event.data.object as Stripe.Subscription)
        break

      case 'invoice.payment_failed': {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const invoice = event.data.object as any
        const subscriptionId = invoice.subscription ?? invoice.parent?.subscription_details?.subscription
        if (subscriptionId) {
          const sub = await stripe.subscriptions.retrieve(subscriptionId as string)
          await syncSubscription(sub)
        }
        break
      }
    }
  } catch (err) {
    console.error('Webhook handler error:', err)
    return NextResponse.json({ error: 'Handler failed' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
