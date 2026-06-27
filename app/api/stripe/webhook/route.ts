import { NextRequest, NextResponse } from "next/server"
import { stripe, STATUS_MAP } from "@/lib/stripe"
import { createAdminClient } from "@/lib/supabase/admin"
import type Stripe from "stripe"

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get("stripe-signature")
  const secret = process.env.STRIPE_WEBHOOK_SECRET

  if (!sig || !secret) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, secret)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Invalid signature"
    return NextResponse.json({ error: msg }, { status: 400 })
  }

  const adminSupabase = createAdminClient()

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session
      if (session.mode !== "subscription") break

      const userId = session.metadata?.user_id
      const plan = session.metadata?.plan ?? "pro"
      if (!userId) break

      const subscriptionId = session.subscription as string
      const sub = await stripe.subscriptions.retrieve(subscriptionId)

      await adminSupabase.from("subscriptions").upsert({
        user_id: userId,
        stripe_subscription_id: subscriptionId,
        stripe_customer_id: session.customer as string,
        plan,
        status: STATUS_MAP[sub.status] ?? "incomplete",
        current_period_end: new Date((sub as any).current_period_end * 1000).toISOString(),
        cancel_at_period_end: sub.cancel_at_period_end,
      }, { onConflict: "user_id" })
      break
    }

    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription
      const userId = sub.metadata?.user_id
      if (!userId) break

      await adminSupabase.from("subscriptions").upsert({
        user_id: userId,
        stripe_subscription_id: sub.id,
        stripe_customer_id: sub.customer as string,
        plan: sub.metadata?.plan ?? "pro",
        status: STATUS_MAP[sub.status] ?? "incomplete",
        current_period_end: new Date((sub as any).current_period_end * 1000).toISOString(),
        cancel_at_period_end: sub.cancel_at_period_end,
      }, { onConflict: "user_id" })
      break
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription
      const userId = sub.metadata?.user_id
      if (!userId) break

      await adminSupabase.from("subscriptions")
        .update({ status: "canceled", cancel_at_period_end: false })
        .eq("user_id", userId)
      break
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice
      const customerId = invoice.customer as string
      const { data: sub } = await adminSupabase
        .from("subscriptions")
        .select("user_id")
        .eq("stripe_customer_id", customerId)
        .single()
      if (sub?.user_id) {
        await adminSupabase.from("subscriptions")
          .update({ status: "past_due" })
          .eq("user_id", sub.user_id)
      }
      break
    }
  }

  return NextResponse.json({ received: true })
}
