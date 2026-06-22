import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

const ALLOWED_KEYS = ["mp_access_token", "mp_public_key", "mp_plan_pro", "mp_webhook_secret"]

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const adminEmails = (process.env.ADMIN_EMAILS ?? "").split(",").map(e => e.trim()).filter(Boolean)
  if (!adminEmails.includes(user.email ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await req.json()
  const adminSupabase = createAdminClient()

  const upserts = ALLOWED_KEYS
    .filter(key => body[key] !== undefined && body[key] !== "")
    .map(key => ({ key, value: body[key], updated_at: new Date().toISOString() }))

  if (upserts.length === 0) return NextResponse.json({ ok: true })

  const { error } = await adminSupabase
    .from("admin_settings")
    .upsert(upserts, { onConflict: "key" })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}

export async function GET(req: NextRequest) {
  // Public key only — safe to expose
  const adminSupabase = createAdminClient()
  const { data } = await adminSupabase
    .from("admin_settings")
    .select("key, value")
    .eq("key", "mp_public_key")
    .single()

  return NextResponse.json({ public_key: data?.value ?? null })
}
