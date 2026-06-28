import { createAdminClient } from "@/lib/supabase/admin"
import UsuariosAdminClient from "./UsuariosAdminClient"

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "").split(",").map(e => e.trim()).filter(Boolean)

export default async function AdminUsuariosPage() {
  const supabase = createAdminClient()

  const { data: { users }, error } = await supabase.auth.admin.listUsers({ perPage: 1000 })
  if (error) return <p className="text-red-400">Erro ao carregar usuários: {error.message}</p>

  const filtered = users.filter(u => !ADMIN_EMAILS.includes(u.email ?? ""))

  const { data: profiles } = await supabase.from("profiles").select("id, user_id")
  const profileCountMap: Record<string, number> = {}
  for (const p of profiles ?? []) {
    profileCountMap[p.user_id] = (profileCountMap[p.user_id] ?? 0) + 1
  }

  const usuarios = filtered.map(u => ({
    id:             u.id,
    email:          u.email ?? "",
    full_name:      (u.user_metadata?.full_name as string) ?? "",
    profile_count:  profileCountMap[u.id] ?? 0,
    created_at:     u.created_at,
    last_sign_in_at:u.last_sign_in_at ?? null,
  }))

  return <UsuariosAdminClient usuarios={usuarios} />
}
