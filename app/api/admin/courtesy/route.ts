import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "surebetflow@gmail.com"
  if (user.email !== ADMIN_EMAIL) return NextResponse.json({ error: "Não autorizado" }, { status: 403 })

  const { userId, email, action, endsAt } = await req.json()
  if (!["grant", "revoke"].includes(action)) {
    return NextResponse.json({ error: "Parâmetros inválidos" }, { status: 400 })
  }

  const admin = createAdminClient()

  // Resolve userId from email if not provided
  let targetUserId = userId
  if (!targetUserId && email) {
    const { data: { users }, error } = await admin.auth.admin.listUsers()
    if (error) return NextResponse.json({ error: "Erro ao buscar usuário" }, { status: 500 })
    const found = users.find(u => u.email?.toLowerCase() === email.toLowerCase())
    if (!found) return NextResponse.json({ error: "Usuário não encontrado com esse e-mail" }, { status: 404 })
    targetUserId = found.id
  }

  if (!targetUserId) return NextResponse.json({ error: "Usuário não identificado" }, { status: 400 })

  if (action === "grant") {
    if (!endsAt) return NextResponse.json({ error: "Data de expiração obrigatória" }, { status: 400 })
    await admin.from("subscriptions").upsert({
      user_id: targetUserId,
      plan: "trader_pro",
      status: "courtesy",
      stripe_subscription_id: null,
      current_period_end: new Date(endsAt + "T23:59:59").toISOString(),
      cancel_at_period_end: false,
    }, { onConflict: "user_id" })
  } else {
    await admin.from("subscriptions")
      .update({ status: "inactive", current_period_end: null })
      .eq("user_id", targetUserId)
      .eq("status", "courtesy")
  }

  return NextResponse.json({ ok: true })
}
