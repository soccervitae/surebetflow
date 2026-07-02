import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "").split(",").map(e => e.trim()).filter(Boolean)

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || !ADMIN_EMAILS.includes(user.email ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { system_prompt } = await req.json()
  if (typeof system_prompt !== "string" || !system_prompt.trim()) {
    return NextResponse.json({ error: "Invalid prompt" }, { status: 400 })
  }

  const adminClient = createAdminClient()
  const { error } = await adminClient
    .from("ai_agent_config")
    .update({ system_prompt: system_prompt.trim(), updated_at: new Date().toISOString() })
    .eq("id", "default")

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
