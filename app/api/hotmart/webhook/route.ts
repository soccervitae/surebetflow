import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

// Map Hotmart offer codes → internal plan keys
const OFFER_PLAN_MAP: Record<string, string> = {
  // Set these to match your Hotmart offer codes
  trader:     "trader",
  trader_pro: "trader_pro",
}

// Map Hotmart product IDs → internal plan keys (fallback)
function planFromProductId(productId: number): string {
  const TRADER_PRO_PRODUCT_ID = Number(process.env.HOTMART_PRODUCT_ID_TRADER_PRO ?? 0)
  if (productId === TRADER_PRO_PRODUCT_ID) return "trader_pro"
  return "trader"
}

export async function POST(req: NextRequest) {
  // Hotmart sends hottok as query param for validation
  const hottok = req.nextUrl.searchParams.get("hottok")
  const expectedHottok = process.env.HOTMART_HOTTOK
  if (expectedHottok && hottok !== expectedHottok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const event = body.event as string
  const data = body.data as Record<string, unknown> ?? {}

  const buyer = data.buyer as Record<string, unknown> | undefined
  const purchase = data.purchase as Record<string, unknown> | undefined
  const product = data.product as Record<string, unknown> | undefined
  const offer = data.offer as Record<string, unknown> | undefined
  const subscription = purchase?.subscription as Record<string, unknown> | undefined

  const buyerEmail = buyer?.email as string | undefined
  const transactionId = purchase?.transaction as string | undefined
  const offerCode = offer?.code as string | undefined
  const productId = product?.id as number | undefined

  if (!buyerEmail) {
    return NextResponse.json({ error: "No buyer email" }, { status: 400 })
  }

  const admin = createAdminClient()

  // Resolve user by email
  const { data: { users }, error: userError } = await admin.auth.admin.listUsers()
  if (userError) return NextResponse.json({ error: "DB error" }, { status: 500 })

  const user = users.find(u => u.email?.toLowerCase() === buyerEmail.toLowerCase())
  if (!user) {
    // User hasn't registered yet — store pending (ignore for now, they need to register first)
    console.warn(`[hotmart] No user found for email: ${buyerEmail}`)
    return NextResponse.json({ received: true })
  }

  const plan = (offerCode && OFFER_PLAN_MAP[offerCode])
    ?? (productId ? planFromProductId(productId) : "trader")

  // Subscription period: Hotmart renews monthly, set 32 days from now as safety margin
  const periodEnd = new Date(Date.now() + 32 * 24 * 60 * 60 * 1000).toISOString()

  switch (event) {
    case "PURCHASE_APPROVED":
    case "PURCHASE_COMPLETE":
    case "PURCHASE_BILLET_PRINTED": // boleto gerado — não ativa ainda
      if (event === "PURCHASE_BILLET_PRINTED") break

      await admin.from("subscriptions").upsert({
        user_id: user.id,
        plan,
        status: "active",
        stripe_subscription_id: `hotmart_${transactionId ?? Date.now()}`,
        current_period_end: periodEnd,
        cancel_at_period_end: false,
      }, { onConflict: "user_id" })
      break

    case "PURCHASE_CANCELED":
    case "PURCHASE_REFUNDED":
    case "PURCHASE_CHARGEBACK":
    case "SUBSCRIPTION_CANCELLATION":
      await admin.from("subscriptions")
        .update({ status: "canceled", cancel_at_period_end: false })
        .eq("user_id", user.id)
      break

    case "PURCHASE_DELAYED": // pagamento atrasado
      await admin.from("subscriptions")
        .update({ status: "past_due" })
        .eq("user_id", user.id)
      break

    case "PURCHASE_PROTEST": // disputa aberta
      await admin.from("subscriptions")
        .update({ status: "past_due" })
        .eq("user_id", user.id)
      break

    default:
      // Evento não tratado — só confirma recebimento
      break
  }

  return NextResponse.json({ received: true })
}
