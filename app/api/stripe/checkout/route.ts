import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { stripe, STRIPE_PLANS, StripePlanKey } from "@/lib/stripe"

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const { plan = "trader" } = await req.json() as { plan?: StripePlanKey }
  const planConfig = STRIPE_PLANS[plan]
  if (!planConfig) return NextResponse.json({ error: "Plano inválido" }, { status: 400 })

  const origin = req.headers.get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.surebetflow.bet"

  const adminSupabase = createAdminClient()

  // Get or create Stripe customer
  const { data: sub } = await adminSupabase
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("user_id", user.id)
    .single()

  let customerId = sub?.stripe_customer_id

  try {
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { user_id: user.id },
      })
      customerId = customer.id
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: planConfig.priceId, quantity: 1 }],
      success_url: `${origin}/assinatura?success=1`,
      cancel_url: `${origin}/assinatura/checkout?canceled=1`,
      metadata: { user_id: user.id, plan },
      subscription_data: {
        metadata: { user_id: user.id, plan },
      },
    })

    // Save customer ID
    await adminSupabase.from("subscriptions").upsert({
      user_id: user.id,
      stripe_customer_id: customerId,
      plan,
      status: "incomplete",
    }, { onConflict: "user_id" })

    return NextResponse.json({ url: session.url })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro ao iniciar pagamento"
    console.error("[checkout] Stripe error:", message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
