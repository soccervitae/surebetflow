"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { ArrowLeft, Send, Lock, CheckCircle, RotateCcw } from "lucide-react"

type Ticket = { id: string; assunto: string; status: string; prioridade: string; user_id: string; created_at: string }
type Mensagem = { id: string; ticket_id: string; sender_id: string; is_admin: boolean; conteudo: string; lida: boolean; created_at: string }

const STATUS_LABEL: Record<string, { label: string; color: string; bg: string }> = {
  aberto:     { label: "Aberto",     color: "text-yellow-400", bg: "bg-yellow-500/10" },
  respondido: { label: "Respondido", color: "text-blue-400",   bg: "bg-blue-500/10" },
  fechado:    { label: "Fechado",    color: "text-gray-400",   bg: "bg-gray-500/10" },
}

export default function AdminTicketClient({ ticket: initial, mensagens: initialMsgs, userEmail, adminId }: {
  ticket: Ticket
  mensagens: Mensagem[]
  userEmail: string
  adminId: string
}) {
  const [ticket, setTicket] = useState(initial)
  const [mensagens, setMensagens] = useState(initialMsgs)
  const [texto, setTexto] = useState("")
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [mensagens])

  useEffect(() => {
    const channel = supabase
      .channel(`admin-ticket-${ticket.id}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "ticket_mensagens",
        filter: `ticket_id=eq.${ticket.id}`,
      }, (payload) => {
        const nova = payload.new as Mensagem
        setMensagens(prev => prev.some(m => m.id === nova.id) ? prev : [...prev, nova])
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

    const { data: nova } = await supabase
      .from("ticket_mensagens")
      .insert({
        ticket_id: ticket.id,
        sender_id: adminId,
        is_admin: true,
        conteudo: texto.trim(),
      })
      .select()
      .single()

    if (nova) setMensagens(prev => [...prev, nova as Mensagem])

    await supabase.from("tickets").update({ status: "respondido" }).eq("id", ticket.id)

    setTexto("")
    setSending(false)
  }

  async function handleFechar() {
    await supabase.from("tickets").update({ status: "fechado" }).eq("id", ticket.id)
  }

  async function handleReabrir() {
    await supabase.from("tickets").update({ status: "aberto" }).eq("id", ticket.id)
  }

  const st = STATUS_LABEL[ticket.status] ?? STATUS_LABEL.aberto

  return (
    <div className="space-y-4 max-w-3xl">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Link href="/admin/suporte" className="text-gray-400 hover:text-white mt-1 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold text-white truncate">{ticket.assunto}</h1>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${st.bg} ${st.color}`}>
              {st.label}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            {userEmail} · Aberto em {new Date(ticket.created_at).toLocaleDateString("pt-BR")}
          </p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          {ticket.status !== "fechado" ? (
            <button
              onClick={handleFechar}
              className="text-xs text-gray-400 hover:text-red-400 border border-gray-700 hover:border-red-500/30 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              Fechar
            </button>
          ) : (
            <button
              onClick={handleReabrir}
              className="text-xs text-gray-400 hover:text-green-400 border border-gray-700 hover:border-green-500/30 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reabrir
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        <div className="p-4 space-y-4 min-h-[400px] max-h-[520px] overflow-y-auto">
          {mensagens.map(m => {
            const isAdmin = m.is_admin
            return (
              <div key={m.id} className={`flex ${isAdmin ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] ${isAdmin ? "items-end" : "items-start"} flex flex-col gap-1`}>
                  <div className={`flex items-center gap-2 ${isAdmin ? "flex-row-reverse" : ""}`}>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${isAdmin ? "bg-[#1e3a8a]" : "bg-gray-600"}`}>
                      {isAdmin ? "A" : "U"}
                    </div>
                    <span className="text-xs text-gray-500">
                      {isAdmin ? "Você (Admin)" : userEmail.split("@")[0]} · {new Date(m.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                    isAdmin
                      ? "bg-[#1e3a8a] text-white rounded-tr-sm"
                      : "bg-gray-800 text-gray-100 rounded-tl-sm border border-gray-700"
                  }`}>
                    {m.conteudo}
                  </div>
                  <span className="text-xs text-gray-600">
                    {new Date(m.created_at).toLocaleDateString("pt-BR")}
                  </span>
                </div>
              </div>
            )
          })}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="border-t border-gray-800 p-4">
          {ticket.status === "fechado" ? (
            <div className="flex items-center justify-center gap-2 py-3 text-gray-500 text-sm">
              <Lock className="w-4 h-4" />
              Este ticket foi fechado
            </div>
          ) : (
            <form onSubmit={handleSend} className="flex gap-3">
              <textarea
                value={texto}
                onChange={e => setTexto(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(e) } }}
                placeholder="Responder ao usuário... (Enter para enviar)"
                rows={2}
                className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-[#1e3a8a]/50 transition-colors resize-none"
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
