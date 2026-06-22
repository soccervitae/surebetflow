import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { stripe, PLANS, PlanKey } from "@/lib/stripe"

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { plan } = await req.json() as { plan: PlanKey }
  if (!PLANS[plan]) return NextResponse.json({ error: "Invalid plan" }, { status: 400 })

  const adminSupabase = createAdminClient()

  // Get or create Stripe customer
  const { data: sub } = await adminSupabase
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("user_id", user.id)
    .single()

  let customerId = sub?.stripe_customer_id

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { supabase_user_id: user.id },
    })
    customerId = customer.id

    await adminSupabase.from("subscriptions").upsert({
      user_id: user.id,
      stripe_customer_id: customerId,
      status: "inactive",
    }, { onConflict: "user_id" })
  }

  const origin = req.headers.get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    payment_method_types: ["card", "pix"],
    line_items: [{ price: PLANS[plan].priceId, quantity: 1 }],
    success_url: `${origin}/assinatura?success=1`,
    cancel_url: `${origin}/assinatura?canceled=1`,
    metadata: { user_id: user.id, plan },
    subscription_data: { metadata: { user_id: user.id, plan } },
    locale: "pt-BR",
  })

  return NextResponse.json({ url: session.url })
}
