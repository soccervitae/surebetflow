import type { Metadata } from "next"
import { createClient } from "@/lib/supabase/server"
import { getPlanLimits } from "@/lib/stripe"
import PerfisClient from "./PerfisClient"

export const metadata: Metadata = {
  title: "Perfis",
  description: "Organize suas apostas por perfil. Crie perfis separados por estratégia ou banca e acompanhe o desempenho individual de cada um.",
}

export default async function PerfisPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profiles } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false })

  const { data: subData } = await supabase
    .from("subscriptions")
    .select("plan, status")
    .eq("user_id", user!.id)
    .single()

  const limits = getPlanLimits(subData?.plan, subData?.status)
  const planLimit = limits.maxProfiles

  const currentProfiles = profiles ?? []

  return (
    <PerfisClient
      profiles={currentProfiles}
      userId={user!.id}
      planLimit={planLimit}
    />
  )
}
