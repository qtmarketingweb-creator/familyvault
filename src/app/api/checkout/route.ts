import Stripe from 'stripe'
import { NextRequest, NextResponse } from 'next/server'
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string)
export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: process.env.STRIPE_PRICE_ID as string, quantity: 1 }],
      success_url: process.env.NEXT_PUBLIC_URL + '/success?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: process.env.NEXT_PUBLIC_URL + '/',
      customer_email: email || undefined,
    })
    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}