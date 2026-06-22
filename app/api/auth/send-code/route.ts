import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { generateCode, sendVerificationEmail } from "@/lib/resend"

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { nome } = await req.json()
  const adminSupabase = createAdminClient()

  // Rate limit: max 3 codes per 15 min
  const { count } = await adminSupabase
    .from("email_verifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("created_at", new Date(Date.now() - 15 * 60 * 1000).toISOString())

  if ((count ?? 0) >= 3) {
    return NextResponse.json({ error: "Muitas tentativas. Aguarde 15 minutos." }, { status: 429 })
  }

  const code = generateCode()

  await adminSupabase.from("email_verifications").insert({
    user_id: user.id,
    email: user.email,
    code,
    expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
  })

  await sendVerificationEmail(user.email!, nome ?? "usuário", code)

  return NextResponse.json({ ok: true })
}
