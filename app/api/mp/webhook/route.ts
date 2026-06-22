import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { getMpClient, getMpWebhookSecret } from "@/lib/settings"
import { PreApproval } from "mercadopago"
import { createHmac } from "crypto"

const STATUS_MAP: Record<string, string> = {
  authorized: "active",
  pending:    "incomplete",
  paused:     "past_due",
  cancelled:  "canceled",
}

export async function POST(req: NextRequest) {
  const body = await req.text()

  // Validate MP signature
  const secret = await getMpWebhookSecret()
  if (secret) {
    const xSignature = req.headers.get("x-signature") ?? ""
    const xRequestId = req.headers.get("x-request-id") ?? ""
    const url = new URL(req.url)
    const dataId = url.searchParams.get("data.id") ?? ""

    const manifest = `id:${dataId};request-id:${xRequestId};ts:${xSignature.split(",").find(p => p.startsWith("ts="))?.split("=")[1] ?? ""};`
    const ts = xSignature.split(",").find(p => p.startsWith("ts="))?.split("=")[1] ?? ""
    const v1 = xSignature.split(",").find(p => p.startsWith("v1="))?.split("=")[1] ?? ""
    const expected = createHmac("sha256", secret)
      .update(`id:${dataId};request-id:${xRequestId};ts:${ts};`)
      .digest("hex")

    if (v1 && expected !== v1) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
    }
  }

  const payload = JSON.parse(body)
  const type = payload.type ?? payload.topic
  const id = payload.data?.id ?? payload.id

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
