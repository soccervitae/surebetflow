import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import ApostasClient from "./ApostasClient"

export default async function ApostasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, nome, sobrenome, apelido")
    .eq("user_id", user.id)

  const profileIds = (profiles ?? []).map(p => p.id)

  const [{ data: apostas }, { data: betCounts }] = await Promise.all([
    profileIds.length > 0
      ? supabase
          .from("apostas")
          .select("*, profile:profiles(nome, sobrenome, apelido), legs:aposta_legs(*, profile_bet:profile_bets(*, bet:bets(*)))")
          .in("profile_id", profileIds)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [] }),
    profileIds.length > 0
      ? supabase.from("profile_bets").select("profile_id").in("profile_id", profileIds)
      : Promise.resolve({ data: [] }),
  ])

  const betCountMap: Record<string, number> = {}
  for (const row of betCounts ?? []) {
    betCountMap[row.profile_id] = (betCountMap[row.profile_id] ?? 0) + 1
  }

  return (
    <ApostasClient
      apostas={apostas ?? []}
      profiles={profiles ?? []}
      betCountMap={betCountMap}
    />
  )
}
