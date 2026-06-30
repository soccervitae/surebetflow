import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { getMpClient } from "@/lib/settings"
import { Payment } from "mercadopago"

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const { email, plan } = await req.json()

  const PLAN_AMOUNTS: Record<string, { amount: number; label: string }> = {
    trader:     { amount: 99.00,  label: "SurebetFlow — Plano Trader" },
    trader_pro: { amount: 179.00, label: "SurebetFlow — Plano Trader Pro" },
  }
  const { amount, label } = PLAN_AMOUNTS[plan] ?? PLAN_AMOUNTS.trader

  try {
    const mpClient = await getMpClient()
    const payment = new Payment(mpClient)

    const result = await payment.create({
      body: {
        transaction_amount: amount,
        description: label,
        payment_method_id: "pix",
        payer: {
          email: email || user.email!,
        },
      },
    })

    const qrCode = result.point_of_interaction?.transaction_data?.qr_code
    const qrCodeBase64 = result.point_of_interaction?.transaction_data?.qr_code_base64
    const paymentId = result.id

    if (!qrCode) return NextResponse.json({ error: "Erro ao gerar PIX" }, { status: 500 })

    // Save pending subscription
    const admin = createAdminClient()
    await admin.from("subscriptions").upsert({
      user_id: user.id,
      plan: "pro",
      status: "pending",
      stripe_subscription_id: `pix_${paymentId}`,
      current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      cancel_at_period_end: false,
    }, { onConflict: "user_id" })

    return NextResponse.json({ qrCode, qrCodeBase64, paymentId })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Erro ao gerar PIX"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
