import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { code } = await req.json()
  if (!code || code.length !== 6) {
    return NextResponse.json({ error: "Código inválido" }, { status: 400 })
  }

  const adminSupabase = createAdminClient()

  // Get latest unverified code for this user
  const { data: verification } = await adminSupabase
    .from("email_verifications")
    .select("*")
    .eq("user_id", user.id)
    .is("verified_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .single()

  if (!verification) {
    return NextResponse.json({ error: "Código não encontrado. Solicite um novo." }, { status: 404 })
  }

  // Check expiry
  if (new Date(verification.expires_at) < new Date()) {
    return NextResponse.json({ error: "Código expirado. Solicite um novo." }, { status: 400 })
  }

  // Check attempts
  if (verification.attempts >= 5) {
    return NextResponse.json({ error: "Muitas tentativas incorretas. Solicite um novo código." }, { status: 400 })
  }

  // Increment attempts
  await adminSupabase
    .from("email_verifications")
    .update({ attempts: verification.attempts + 1 })
    .eq("id", verification.id)

  if (verification.code !== code) {
    const remaining = 4 - verification.attempts
    return NextResponse.json({ error: `Código incorreto. ${remaining} tentativa${remaining !== 1 ? "s" : ""} restante${remaining !== 1 ? "s" : ""}.` }, { status: 400 })
  }

  // Mark as verified
  await adminSupabase
    .from("email_verifications")
    .update({ verified_at: new Date().toISOString() })
    .eq("id", verification.id)

  // Confirm user email via admin
  await adminSupabase.auth.admin.updateUserById(user.id, {
    email_confirm: true,
  })

  return NextResponse.json({ ok: true })
}
