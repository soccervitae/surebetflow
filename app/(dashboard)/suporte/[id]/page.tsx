import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import TicketDetailClient from "./TicketDetailClient"

export default async function TicketDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: ticket } = await supabase
    .from("tickets")
    .select("*")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .single()

  if (!ticket) notFound()

  const { data: mensagens } = await supabase
    .from("ticket_mensagens")
    .select("*")
    .eq("ticket_id", params.id)
    .order("created_at", { ascending: true })

  // Mark admin messages as read
  const unreadIds = (mensagens ?? []).filter(m => m.is_admin && !m.lida).map(m => m.id)
  if (unreadIds.length > 0) {
    await supabase.from("ticket_mensagens").update({ lida: true }).in("id", unreadIds)
  }

  return <TicketDetailClient ticket={ticket} mensagens={mensagens ?? []} userId={user.id} />
}
