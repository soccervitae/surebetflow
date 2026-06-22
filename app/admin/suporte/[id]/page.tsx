import { createAdminClient } from "@/lib/supabase/admin"
import { notFound } from "next/navigation"
import AdminTicketClient from "./AdminTicketClient"

export default async function AdminTicketPage({ params }: { params: { id: string } }) {
  const supabase = createAdminClient()

  const { data: ticket } = await supabase
    .from("tickets")
    .select("*")
    .eq("id", params.id)
    .single()

  if (!ticket) notFound()

  const { data: mensagens } = await supabase
    .from("ticket_mensagens")
    .select("*")
    .eq("ticket_id", params.id)
    .order("created_at", { ascending: true })

  // Mark user messages as read
  const unreadIds = (mensagens ?? []).filter(m => !m.is_admin && !m.lida).map(m => m.id)
  if (unreadIds.length > 0) {
    await supabase.from("ticket_mensagens").update({ lida: true }).in("id", unreadIds)
  }

  const { data: { user } } = await supabase.auth.admin.getUserById(ticket.user_id)
  const userEmail = user?.email ?? ticket.user_id

  return <AdminTicketClient ticket={ticket} mensagens={mensagens ?? []} userEmail={userEmail} />
}
