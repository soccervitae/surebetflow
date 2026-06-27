import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import HomeDashboard from "../HomeDashboard"

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "").split(",").map(e => e.trim()).filter(Boolean)

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user && ADMIN_EMAILS.includes(user.email ?? "")) {
    redirect("/admin")
  }

  const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()

  const [dashResult, profilesResult, apostasResult, apostasPendentesResult] = await Promise.all([
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
    supabase
      .from("apostas")
      .select("id", { count: "exact", head: true })
      .eq("status", "pendente")
      .lt("created_at", threeDaysAgo),
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
      apostasPendentesAntigas={apostasPendentesResult.count ?? 0}
    />
  )
}
