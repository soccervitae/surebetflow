import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { mp, PLANS, PlanKey } from "@/lib/mercadopago"
import { PreApproval } from "mercadopago"

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { plan } = await req.json() as { plan: PlanKey }
  if (!PLANS[plan]) return NextResponse.json({ error: "Invalid plan" }, { status: 400 })

  const origin = req.headers.get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL

  const preApproval = new PreApproval(mp)
  const result = await preApproval.create({
    body: {
      preapproval_plan_id: PLANS[plan].planId,
      payer_email: user.email,
      back_url: `${origin}/assinatura?success=1`,
      external_reference: JSON.stringify({ user_id: user.id, plan }),
    },
  })

  // Save pending subscription
  const adminSupabase = createAdminClient()
  await adminSupabase.from("subscriptions").upsert({
    user_id: user.id,
    stripe_subscription_id: result.id, // reusing field for MP subscription id
    plan,
    status: "incomplete",
  }, { onConflict: "user_id" })

  return NextResponse.json({ url: result.init_point })
}
