import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

// Map Cakto product IDs → internal plan keys
function planFromProductId(productId: string): string {
  const traderProId = process.env.CAKTO_PRODUCT_ID_TRADER_PRO ?? ""
  if (traderProId && productId === traderProId) return "trader_pro"
  return "trader"
}

export async function POST(req: NextRequest) {
  // Cakto sends token for validation
  const token = req.headers.get("x-cakto-token") ?? req.nextUrl.searchParams.get("token")
  const expectedToken = process.env.CAKTO_WEBHOOK_TOKEN
  if (expectedToken && token !== expectedToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  // Cakto payload structure:
  // { event: "order.paid", data: { customer: { email }, order: { id }, product: { id } } }
  const event = body.event as string
  const data = body.data as Record<string, unknown> ?? {}

  const customer = data.customer as Record<string, unknown> | undefined
  const order = data.order as Record<string, unknown> | undefined
  const product = data.product as Record<string, unknown> | undefined

  const buyerEmail = customer?.email as string | undefined
  const orderId = order?.id as string | undefined
  const productId = product?.id as string | undefined

  if (!buyerEmail) {
    return NextResponse.json({ error: "No buyer email" }, { status: 400 })
  }

  const admin = createAdminClient()

  // Resolve user by email
  const { data: { users }, error: userError } = await admin.auth.admin.listUsers()
  if (userError) return NextResponse.json({ error: "DB error" }, { status: 500 })

  const user = users.find(u => u.email?.toLowerCase() === buyerEmail.toLowerCase())
  if (!user) {
    console.warn(`[cakto] No user found for email: ${buyerEmail}`)
    return NextResponse.json({ received: true })
  }

  const plan = productId ? planFromProductId(productId) : "trader"

  // Set period end 32 days from now as safety margin for monthly billing
  const periodEnd = new Date(Date.now() + 32 * 24 * 60 * 60 * 1000).toISOString()

  switch (event) {
    case "order.paid":
    case "order.approved":
      await admin.from("subscriptions").upsert({
        user_id: user.id,
        plan,
        status: "active",
        stripe_subscription_id: `cakto_${orderId ?? Date.now()}`,
        current_period_end: periodEnd,
        cancel_at_period_end: false,
      }, { onConflict: "user_id" })
      break

    case "order.refunded":
    case "order.cancelled":
    case "order.chargedback":
    case "subscription.cancelled":
    case "subscription.expired":
      await admin.from("subscriptions")
        .update({ status: "canceled", cancel_at_period_end: false })
        .eq("user_id", user.id)
      break

    case "subscription.overdue":
    case "order.overdue":
      await admin.from("subscriptions")
        .update({ status: "past_due" })
        .eq("user_id", user.id)
      break

    default:
      break
  }

  return NextResponse.json({ received: true })
}
