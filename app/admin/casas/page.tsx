import { createClient } from "@/lib/supabase/server"
import AdminCasasClient from "./AdminCasasClient"

export default async function AdminCasasPage() {
  const supabase = await createClient()
  const { data: bets } = await supabase.from("bets").select("*").order("nome")
  return <AdminCasasClient bets={bets ?? []} />
}
