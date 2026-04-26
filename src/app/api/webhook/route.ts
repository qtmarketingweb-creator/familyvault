import Stripe from 'stripe'
import { NextRequest, NextResponse } from 'next/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-06-20' })

// Store cancelled customers (in production use a database)
// For now we use a simple in-memory set — Vercel serverless resets between cold starts
// but the client-side re-verification handles the rest
const cancelledCustomers = new Set<string>()

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    console.error('Webhook signature failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  console.log('Stripe webhook event:', event.type)

  if (event.type === 'customer.subscription.deleted') {
    const sub = event.data.object as Stripe.Subscription
    const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id
    cancelledCustomers.add(customerId)
    console.log('Subscription cancelled for customer:', customerId)
  }

  if (event.type === 'customer.subscription.updated') {
    const sub = event.data.object as Stripe.Subscription
    const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id
    if (sub.status === 'canceled' || sub.status === 'unpaid' || sub.status === 'past_due') {
      cancelledCustomers.add(customerId)
      console.log('Subscription degraded for customer:', customerId, 'status:', sub.status)
    }
  }

  return NextResponse.json({ received: true })
}
