import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { stripe, STRIPE_PRICES, type PriceKey } from '@/lib/stripe'

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { priceKey, trial } = await req.json() as { priceKey: PriceKey; trial?: boolean }
    if (!priceKey || !STRIPE_PRICES[priceKey]) {
      return NextResponse.json({ error: 'Invalid price' }, { status: 400 })
    }

    const admin = createAdminClient()
    const { data: coach } = await admin
      .from('coaches')
      .select('stripe_customer_id, email, full_name')
      .eq('id', user.id)
      .maybeSingle()

    // Get or create Stripe customer
    let customerId = coach?.stripe_customer_id as string | undefined

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email ?? coach?.email ?? '',
        name: coach?.full_name ?? undefined,
        metadata: { supabase_user_id: user.id },
      })
      customerId = customer.id
      await admin.from('coaches').update({ stripe_customer_id: customerId }).eq('id', user.id)
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? req.nextUrl.origin

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      payment_method_options: {
        card: { request_three_d_secure: 'automatic' },
      },
      line_items: [{ price: STRIPE_PRICES[priceKey], quantity: 1 }],
      mode: 'subscription',
      ...(trial
        ? { subscription_data: { trial_period_days: 7 } }
        : {}),
      success_url: `${baseUrl}/settings/billing?success=1`,
      cancel_url: `${baseUrl}/pricing?canceled=1`,
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('Stripe checkout error:', err)
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 })
  }
}
