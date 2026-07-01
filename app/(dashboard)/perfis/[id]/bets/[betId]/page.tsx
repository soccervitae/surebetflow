import { notFound, redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import BetDetailClient from "./BetDetailClient"

export default async function BetDetailPage({ params }: { params: { id: string; betId: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const [profileRes, profileBetRes, movsRes] = await Promise.all([
    supabase.from("profiles").select("id, nome, sobrenome, apelido").eq("id", params.id).eq("user_id", user.id).single(),
    supabase.from("profile_bets").select("*, bet:bets(*)").eq("id", params.betId).eq("profile_id", params.id).single(),
    supabase.from("movimentacoes_financeiras").select("*").eq("profile_bet_id", params.betId).order("created_at", { ascending: false }),
  ])

  if (profileRes.error || !profileRes.data) notFound()
  if (profileBetRes.error || !profileBetRes.data) notFound()

  return (
    <BetDetailClient
      profile={profileRes.data as { id: string; nome: string; sobrenome: string; apelido?: string | null }}
      profileBet={profileBetRes.data as any}
      movimentacoes={movsRes.data ?? []}
    />
  )
}
