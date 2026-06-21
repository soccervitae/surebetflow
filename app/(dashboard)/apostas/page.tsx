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

  const { data: apostas } = profileIds.length > 0
    ? await supabase
        .from("apostas")
        .select("*, profile:profiles(nome, sobrenome, apelido), legs:aposta_legs(*, profile_bet:profile_bets(*, bet:bets(*)))")
        .in("profile_id", profileIds)
        .order("created_at", { ascending: false })
    : { data: [] }

  return (
    <ApostasClient
      apostas={apostas ?? []}
      profiles={profiles ?? []}
    />
  )
}
