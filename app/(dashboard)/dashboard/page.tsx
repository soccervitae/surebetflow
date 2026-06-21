import { createClient } from "@/lib/supabase/server"
import HomeDashboard from "../HomeDashboard"

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [dashResult, profilesResult, apostasResult] = await Promise.all([
    supabase
      .from("dashboard_geral")
      .select("*")
      .eq("user_id", user!.id)
      .maybeSingle(),
    supabase
      .from("profile_dashboard")
      .select("*")
      .eq("user_id", user!.id),
    supabase
      .from("apostas")
      .select("*, profile:profiles(nome, sobrenome, apelido)")
      .eq("profiles.user_id", user!.id)
      .order("created_at", { ascending: false })
      .limit(10),
  ])

  // Get finalized apostas for chart
  const { data: apostasFinalizadas } = await supabase
    .from("apostas")
    .select("lucro_garantido, resultado_real, finalizada_at, profile_id")
    .eq("status", "finalizada")
    .order("finalizada_at", { ascending: true })

  return (
    <HomeDashboard
      dashboard={dashResult.data}
      profiles={profilesResult.data ?? []}
      recentApostas={apostasResult.data ?? []}
      apostasFinalizadas={apostasFinalizadas ?? []}
    />
  )
}
