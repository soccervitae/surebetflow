import { notFound, redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import ApostaDetailClient from "./ApostaDetailClient"

export default async function ApostaDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: aposta, error } = await supabase
    .from("apostas")
    .select(`
      *,
      profile:profiles!inner(id, user_id, nome, sobrenome, apelido),
      legs:aposta_legs(
        *,
        profile_bet:profile_bets(
          id, email, saldo,
          bet:bets(id, nome, logo_url)
        )
      )
    `)
    .eq("id", params.id)
    .eq("profiles.user_id", user.id)
    .single()

  if (error || !aposta) notFound()

  return <ApostaDetailClient aposta={aposta} />
}
