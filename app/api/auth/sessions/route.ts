import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ sessions: [] })
  }

  try {
    const res = await fetch(`${supabaseUrl}/auth/v1/admin/users/${user.id}/sessions`, {
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
      },
    })
    if (!res.ok) return NextResponse.json({ sessions: [] })
    const data = await res.json()
    return NextResponse.json({ sessions: data.sessions ?? data ?? [] })
  } catch {
    return NextResponse.json({ sessions: [] })
  }
}

export async function DELETE(req: Request) {
  const { sessionId } = await req.json()
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user || !sessionId) {
    return NextResponse.json({ error: "Inválido" }, { status: 400 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ error: "Configuração ausente" }, { status: 500 })
  }

  const res = await fetch(`${supabaseUrl}/auth/v1/admin/users/${user.id}/sessions/${sessionId}`, {
    method: "DELETE",
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
    },
  })

  return NextResponse.json({ ok: res.ok })
}
