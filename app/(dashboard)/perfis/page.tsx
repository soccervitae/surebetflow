import { createClient } from "@/lib/supabase/server"
import PerfisClient from "./PerfisClient"

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

  const plan = (subData?.status === "active" || subData?.status === "trialing") ? (subData?.plan ?? "") : ""
  const planLimits: Record<string, number> = { trader_pro: 20, trader: 5, pro: 5 }
  const planLimit = planLimits[plan] ?? 5

  const currentProfiles = profiles ?? []

  return (
    <PerfisClient
      profiles={currentProfiles}
      userId={user!.id}
      planLimit={planLimit}
      currentCount={currentProfiles.length}
    />
  )
}
