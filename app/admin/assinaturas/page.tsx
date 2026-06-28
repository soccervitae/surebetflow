import { createAdminClient } from "@/lib/supabase/admin"
import AssinaturasClient from "./AssinaturasClient"

export default async function AdminAssinaturasPage() {
  const supabase = createAdminClient()

  const { data: subs } = await supabase
    .from("subscriptions")
    .select("*")
    .order("created_at", { ascending: false })

  // Get emails for all users
  const userIds = (subs ?? []).map(s => s.user_id)
  const emailMap: Record<string, string> = {}
  for (const uid of userIds) {
    const { data: { user } } = await supabase.auth.admin.getUserById(uid)
    if (user) emailMap[uid] = user.email ?? uid
  }

  const PLAN_PRICES: Record<string, number> = { trader: 99, trader_pro: 179, pro: 99 }
  const activeSubs = subs?.filter(s => s.status === "active" || s.status === "trialing") ?? []

  const stats = {
    total:      subs?.length ?? 0,
    active:     activeSubs.length,
    canceled:   subs?.filter(s => s.status === "canceled").length ?? 0,
    incomplete: subs?.filter(s => s.status === "incomplete" || s.status === "inactive").length ?? 0,
    mrr:        activeSubs.reduce((sum, s) => sum + (PLAN_PRICES[s.plan ?? ""] ?? 99), 0),
  }

  return <AssinaturasClient subs={subs ?? []} emailMap={emailMap} stats={stats} />
}
