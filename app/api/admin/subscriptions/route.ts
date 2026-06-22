import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const adminEmails = (process.env.ADMIN_EMAILS ?? "").split(",").map(e => e.trim()).filter(Boolean)
  if (!adminEmails.includes(user.email ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { user_id, action } = await req.json()
  if (!user_id || !action) return NextResponse.json({ error: "Missing fields" }, { status: 400 })

  const adminSupabase = createAdminClient()

  if (action === "activate") {
    await adminSupabase.from("subscriptions").upsert({
      user_id,
      plan: "pro",
      status: "active",
      current_period_end: new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000).toISOString(),
      cancel_at_period_end: false,
    }, { onConflict: "user_id" })
  } else if (action === "cancel") {
    await adminSupabase.from("subscriptions")
      .update({ status: "canceled", cancel_at_period_end: false })
      .eq("user_id", user_id)
  }

  return NextResponse.json({ ok: true })
}
