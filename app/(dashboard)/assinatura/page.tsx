import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import AssinaturaClient from "./AssinaturaClient"

export default async function AssinaturaPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", user.id)
    .single()

  return <AssinaturaClient subscription={subscription} />
}
