"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { ArrowLeft, Send, Lock } from "lucide-react"
import { useRouter } from "next/navigation"

type Ticket = { id: string; assunto: string; status: string; prioridade: string; created_at: string }
type Mensagem = { id: string; ticket_id: string; sender_id: string; is_admin: boolean; conteudo: string; lida: boolean; created_at: string }

const STATUS_LABEL: Record<string, { label: string; color: string; bg: string }> = {
  aberto:     { label: "Aberto",     color: "text-yellow-600", bg: "bg-yellow-500/10" },
  respondido: { label: "Respondido", color: "text-blue-600",   bg: "bg-blue-500/10" },
  fechado:    { label: "Fechado",    color: "text-gray-500",   bg: "bg-gray-500/10" },
}

export default function TicketDetailClient({ ticket: initial, mensagens: initialMsgs, userId }: {
  ticket: Ticket
  mensagens: Mensagem[]
  userId: string
}) {
  const [ticket, setTicket] = useState(initial)
  const [mensagens, setMensagens] = useState(initialMsgs)
  const [texto, setTexto] = useState("")
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [mensagens])

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel(`ticket-${ticket.id}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "ticket_mensagens",
        filter: `ticket_id=eq.${ticket.id}`,
      }, async (payload) => {
        const nova = payload.new as Mensagem
        setMensagens(prev => [...prev, nova])
        if (nova.is_admin) {
          await supabase.from("ticket_mensagens").update({ lida: true }).eq("id", nova.id)
        }
      })
      .on("postgres_changes", {
        event: "UPDATE",
        schema: "public",
        table: "tickets",
        filter: `id=eq.${ticket.id}`,
      }, (payload) => {
        setTicket(prev => ({ ...prev, ...payload.new }))
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [ticket.id]) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!texto.trim() || ticket.status === "fechado") return
    setSending(true)

    await supabase.from("ticket_mensagens").insert({
      ticket_id: ticket.id,
      sender_id: userId,
      is_admin: false,
      conteudo: texto.trim(),
    })

    // Reopen ticket if it was 'respondido'
    if (ticket.status === "respondido") {
      await supabase.from("tickets").update({ status: "aberto" }).eq("id", ticket.id)
    }

    setTexto("")
    setSending(false)
  }

  async function handleFechar() {
    await supabase.from("tickets").update({ status: "fechado" }).eq("id", ticket.id)
    router.refresh()
  }

  const st = STATUS_LABEL[ticket.status] ?? STATUS_LABEL.aberto

  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Link href="/suporte" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] mt-1 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold text-[var(--text-primary)] truncate">{ticket.assunto}</h1>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${st.bg} ${st.color}`}>
              {st.label}
            </span>
          </div>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            Aberto em {new Date(ticket.created_at).toLocaleDateString("pt-BR")} às {new Date(ticket.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>
        {ticket.status !== "fechado" && (
          <button
            onClick={handleFechar}
            className="text-xs text-gray-500 hover:text-red-500 border border-[var(--border)] hover:border-red-500/30 px-3 py-1.5 rounded-lg transition-colors flex-shrink-0"
          >
            Fechar ticket
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl overflow-hidden">
        <div className="p-4 space-y-4 min-h-[400px] max-h-[520px] overflow-y-auto">
          {mensagens.map(m => {
            const isMe = !m.is_admin
            return (
              <div key={m.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] ${isMe ? "items-end" : "items-start"} flex flex-col gap-1`}>
                  <div className={`flex items-center gap-2 ${isMe ? "flex-row-reverse" : ""}`}>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${isMe ? "bg-[#1e3a8a]" : "bg-gray-600"}`}>
                      {isMe ? "V" : "A"}
                    </div>
                    <span className="text-xs text-[var(--text-muted)]">
                      {m.is_admin ? "Suporte" : "Você"} · {new Date(m.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                    isMe
                      ? "bg-[#1e3a8a] text-white rounded-tr-sm"
                      : "bg-[var(--bg-elevated)] text-[var(--text-primary)] rounded-tl-sm border border-[var(--border)]"
                  }`}>
                    {m.conteudo}
                  </div>
                  <span className="text-xs text-[var(--text-muted)]">
                    {new Date(m.created_at).toLocaleDateString("pt-BR")}
                  </span>
                </div>
              </div>
            )
          })}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="border-t border-[var(--border)] p-4">
          {ticket.status === "fechado" ? (
            <div className="flex items-center justify-center gap-2 py-3 text-[var(--text-muted)] text-sm">
              <Lock className="w-4 h-4" />
              Este ticket foi fechado
            </div>
          ) : (
            <form onSubmit={handleSend} className="flex gap-3">
              <textarea
                value={texto}
                onChange={e => setTexto(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(e) } }}
                placeholder="Digite sua mensagem... (Enter para enviar)"
                rows={2}
                className="flex-1 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-[var(--text-primary)] placeholder-[var(--text-muted)] text-sm focus:outline-none focus:border-[#1e3a8a]/50 transition-colors resize-none"
              />
              <button
                type="submit"
                disabled={sending || !texto.trim()}
                className="bg-[#1e3a8a] hover:bg-[#1e40af] disabled:opacity-50 text-white px-4 py-2.5 rounded-xl transition-colors flex-shrink-0 flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
