import Stripe from 'stripe'
import { NextRequest, NextResponse } from 'next/server'
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string)
export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature') as string
  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET as string)
  } catch (err) {
    console.error('Webhook error:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }
  console.log('Webhook:', event.type)
  if (event.type === 'customer.subscription.deleted' || event.type === 'customer.subscription.updated') {
    const sub = event.data.object as Stripe.Subscription
    const cid = typeof sub.customer === 'string' ? sub.customer : sub.customer.id
    console.log('Subscription event for customer:', cid, 'status:', sub.status)
  }
  return NextResponse.json({ received: true })
}