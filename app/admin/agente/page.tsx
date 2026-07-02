import { createAdminClient } from "@/lib/supabase/admin"
import AgenteClient from "./AgenteClient"

export const metadata = { title: "Admin – Agente IA" }

export default async function AdminAgentePage() {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from("ai_agent_config")
    .select("system_prompt")
    .eq("id", "default")
    .single()

  return <AgenteClient initialPrompt={data?.system_prompt ?? ""} />
}
