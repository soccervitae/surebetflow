import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { getMpClient } from "@/lib/settings"
import { PreApproval } from "mercadopago"

const STATUS_MAP: Record<string, string> = {
  authorized: "active",
  pending:    "incomplete",
  paused:     "past_due",
  cancelled:  "canceled",
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const type = body.type ?? body.topic
  const id = body.data?.id ?? body.id

  if (type !== "preapproval" || !id) return NextResponse.json({ received: true })

  try {
    const mp = await getMpClient()
    const preApproval = new PreApproval(mp)
    const sub = await preApproval.get({ id })

    const externalRef = sub.external_reference ? JSON.parse(sub.external_reference) : null
    if (!externalRef?.user_id) return NextResponse.json({ received: true })

    const adminSupabase = createAdminClient()
    await adminSupabase.from("subscriptions").upsert({
      user_id: externalRef.user_id,
      stripe_subscription_id: sub.id,
      plan: externalRef.plan ?? null,
      status: STATUS_MAP[sub.status ?? ""] ?? "incomplete",
      current_period_end: sub.next_payment_date
        ? new Date(sub.next_payment_date).toISOString()
        : null,
      cancel_at_period_end: false,
    }, { onConflict: "user_id" })
  } catch {
    // silent
  }

  return NextResponse.json({ received: true })
}
