import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { getMpClient, getMpPlanId } from "@/lib/settings"
import { PreApproval } from "mercadopago"

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const body = await req.json()
  const { token, email } = body
  if (!token) return NextResponse.json({ error: "Token do cartão inválido" }, { status: 400 })

  try {
    const mp = await getMpClient()
    const planId = await getMpPlanId()

    if (!planId) return NextResponse.json({ error: "Plano não configurado. Contate o suporte." }, { status: 500 })

    const preApproval = new PreApproval(mp)
    const result = await preApproval.create({
      body: {
        preapproval_plan_id: planId,
        payer_email: email ?? user.email,
        card_token_id: token,
        external_reference: JSON.stringify({ user_id: user.id, plan: "pro" }),
      },
    })

    const STATUS_MAP: Record<string, string> = {
      authorized: "active",
      pending:    "incomplete",
      paused:     "past_due",
      cancelled:  "canceled",
    }

    const adminSupabase = createAdminClient()
    await adminSupabase.from("subscriptions").upsert({
      user_id: user.id,
      stripe_subscription_id: result.id,
      plan: "pro",
      status: STATUS_MAP[result.status ?? ""] ?? "incomplete",
      current_period_end: result.next_payment_date
        ? new Date(result.next_payment_date).toISOString()
        : null,
      cancel_at_period_end: false,
    }, { onConflict: "user_id" })

    return NextResponse.json({ ok: true, status: result.status })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro ao processar pagamento"
    return NextResponse.json({ error: message }, { status: 422 })
  }
}
