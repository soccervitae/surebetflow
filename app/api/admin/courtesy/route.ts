import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const adminRes = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/is-admin`, {
    headers: { cookie: "" },
  })
  // Simpler: check email directly
  const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "surebetflow@gmail.com"
  if (user.email !== ADMIN_EMAIL) return null
  return user
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "surebetflow@gmail.com"
  if (user.email !== ADMIN_EMAIL) return NextResponse.json({ error: "Não autorizado" }, { status: 403 })

  const { userId, action } = await req.json()
  if (!userId || !["grant", "revoke"].includes(action)) {
    return NextResponse.json({ error: "Parâmetros inválidos" }, { status: 400 })
  }

  const admin = createAdminClient()

  if (action === "grant") {
    await admin.from("subscriptions").upsert({
      user_id: userId,
      plan: "trader_pro",
      status: "courtesy",
      stripe_subscription_id: null,
      current_period_end: null,
      cancel_at_period_end: false,
    }, { onConflict: "user_id" })
  } else {
    await admin.from("subscriptions")
      .update({ status: "inactive" })
      .eq("user_id", userId)
      .eq("status", "courtesy")
  }

  return NextResponse.json({ ok: true })
}
