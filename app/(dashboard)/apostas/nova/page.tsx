import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import NovaApostaClient from "./NovaApostaClient"

export default async function NovaApostaPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, nome, sobrenome, apelido")
    .eq("user_id", user.id)

  const profileIds = (profiles ?? []).map(p => p.id)
  const { data: betCounts } = profileIds.length > 0
    ? await supabase
        .from("profile_bets")
        .select("profile_id")
        .in("profile_id", profileIds)
    : { data: [] }

  const betCountMap: Record<string, number> = {}
  for (const row of betCounts ?? []) {
    betCountMap[row.profile_id] = (betCountMap[row.profile_id] ?? 0) + 1
  }

  return <NovaApostaClient profiles={profiles ?? []} betCountMap={betCountMap} />
}
