import Stripe from 'stripe'
import { NextRequest, NextResponse } from 'next/server'
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-06-20' })
export async function GET(req: NextRequest) {
  try {
    const sessionId = req.nextUrl.searchParams.get('session_id')
    const customerId = req.nextUrl.searchParams.get('customer_id')
    if (sessionId) {
      const session = await stripe.checkout.sessions.retrieve(sessionId)
      return NextResponse.json({ status: session.payment_status, customerId: session.customer })
    }
    if (customerId) {
      const subs = await stripe.subscriptions.list({ customer: customerId as string, status: 'active', limit: 1 })
      return NextResponse.json({ active: subs.data.length > 0 })
    }
    return NextResponse.json({ error: 'Missing params' }, { status: 400 })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}