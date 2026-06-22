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

  const stats = {
    total: subs?.length ?? 0,
    active: subs?.filter(s => s.status === "active" || s.status === "trialing").length ?? 0,
    canceled: subs?.filter(s => s.status === "canceled").length ?? 0,
    incomplete: subs?.filter(s => s.status === "incomplete" || s.status === "inactive").length ?? 0,
    mrr: (subs?.filter(s => s.status === "active" || s.status === "trialing").length ?? 0) * 99,
  }

  return <AssinaturasClient subs={subs ?? []} emailMap={emailMap} stats={stats} />
}
