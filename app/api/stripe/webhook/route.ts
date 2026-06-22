import { NextRequest, NextResponse } from "next/server"
import { stripe } from "@/lib/stripe"
import { createAdminClient } from "@/lib/supabase/admin"
import Stripe from "stripe"

export const runtime = "nodejs"

async function upsertSubscription(subscription: Stripe.Subscription) {
  const adminSupabase = createAdminClient()
  const userId = subscription.metadata?.user_id
  const plan = subscription.metadata?.plan as string | undefined
  if (!userId) return

  const item = subscription.items.data[0]
  await adminSupabase.from("subscriptions").upsert({
    user_id: userId,
    stripe_subscription_id: subscription.id,
    stripe_price_id: item?.price.id ?? null,
    plan: plan ?? null,
    status: subscription.status,
    current_period_end: new Date((subscription as unknown as { current_period_end: number }).current_period_end * 1000).toISOString(),
    cancel_at_period_end: subscription.cancel_at_period_end,
  }, { onConflict: "user_id" })
}

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get("stripe-signature")!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  const adminSupabase = createAdminClient()

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session
      if (session.mode === "subscription" && session.subscription) {
        const subscription = await stripe.subscriptions.retrieve(session.subscription as string)
        // Ensure user_id is in subscription metadata
        if (!subscription.metadata?.user_id && session.metadata?.user_id) {
          await stripe.subscriptions.update(subscription.id, {
            metadata: { user_id: session.metadata.user_id, plan: session.metadata.plan ?? "" },
          })
          subscription.metadata = { ...subscription.metadata, ...session.metadata }
        }
        await upsertSubscription(subscription)
      }
      break
    }
    case "customer.subscription.created":
    case "customer.subscription.updated":
      await upsertSubscription(event.data.object as Stripe.Subscription)
      break

    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription
      const userId = sub.metadata?.user_id
      if (userId) {
        await adminSupabase.from("subscriptions")
          .update({ status: "canceled", stripe_subscription_id: null })
          .eq("user_id", userId)
      }
      break
    }
  }

  return NextResponse.json({ received: true })
}
