import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import NovaApostaClient from "./NovaApostaClient"

export default async function NovaApostaPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, nome, sobrenome, apelido")
    .eq("user_id", user.id)

  return <NovaApostaClient profiles={profiles ?? []} />
}
