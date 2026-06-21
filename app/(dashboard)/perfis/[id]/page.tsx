import { notFound, redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import PerfilDetailClient from "./PerfilDetailClient"

export default async function PerfilDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const session = await supabase.auth.getSession()

  if (!user) redirect("/login")

  const [profileRes, dashRes, apostasRes] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", params.id).eq("user_id", user.id).single(),
    supabase.from("profile_dashboard").select("*").eq("profile_id", params.id).maybeSingle(),
    supabase.from("apostas").select("*, legs:aposta_legs(*, profile_bet:profile_bets(*, bet:bets(*)))").eq("profile_id", params.id).order("created_at", { ascending: false }),
  ])

  if (profileRes.error || !profileRes.data) notFound()

  const userToken = session.data.session?.access_token ?? ""

  return (
    <PerfilDetailClient
      profile={profileRes.data}
      dashboard={dashRes.data}
      apostas={apostasRes.data ?? []}
      userToken={userToken}
    />
  )
}
