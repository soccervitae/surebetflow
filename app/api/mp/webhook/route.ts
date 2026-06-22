import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { mp } from "@/lib/mercadopago"
import { PreApproval } from "mercadopago"

const STATUS_MAP: Record<string, string> = {
  authorized: "active",
  pending:    "incomplete",
  paused:     "past_due",
  cancelled:  "canceled",
}

export async function POST(req: NextRequest) {
  const body = await req.json()

  // MercadoPago sends different notification types
  const type = body.type ?? body.topic
  const id = body.data?.id ?? body.id

  if (type !== "preapproval" || !id) {
    return NextResponse.json({ received: true })
  }

  try {
    const preApproval = new PreApproval(mp)
    const sub = await preApproval.get({ id })

    const externalRef = sub.external_reference
      ? JSON.parse(sub.external_reference)
      : null

    if (!externalRef?.user_id) return NextResponse.json({ received: true })

    const adminSupabase = createAdminClient()
    const status = STATUS_MAP[sub.status ?? ""] ?? "incomplete"

    // next billing date
    const periodEnd = sub.next_payment_date
      ? new Date(sub.next_payment_date).toISOString()
      : null

    await adminSupabase.from("subscriptions").upsert({
      user_id: externalRef.user_id,
      stripe_subscription_id: sub.id,
      plan: externalRef.plan ?? null,
      status,
      current_period_end: periodEnd,
      cancel_at_period_end: false,
    }, { onConflict: "user_id" })
  } catch {
    // Log silently — don't expose errors to MP
  }

  return NextResponse.json({ received: true })
}
