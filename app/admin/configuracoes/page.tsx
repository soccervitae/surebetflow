import { createAdminClient } from "@/lib/supabase/admin"
import ConfiguracoesClient from "./ConfiguracoesClient"

export default async function AdminConfiguracoesPage() {
  const supabase = createAdminClient()

  const { data: rows } = await supabase
    .from("admin_settings")
    .select("key, value")
    .in("key", ["mp_access_token", "mp_public_key", "mp_plan_pro"])

  const settings: Record<string, string> = {}
  for (const row of rows ?? []) settings[row.key] = row.value

  return <ConfiguracoesClient settings={settings} />
}
