import type { Metadata } from "next"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import SuporteClient from "./SuporteClient"

export const metadata: Metadata = {
  title: "Suporte",
  description: "Abra tickets de suporte, envie dúvidas, sugestões ou críticas. Nossa equipe responde em até 24 horas úteis.",
}

export default async function SuportePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: tickets } = await supabase
    .from("tickets")
    .select("*, ticket_mensagens(id, is_admin, lida)")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false })

  return <SuporteClient tickets={tickets ?? []} userId={user.id} />
}
