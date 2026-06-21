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

  return <PerfisClient profiles={profiles ?? []} userId={user!.id} />
}
