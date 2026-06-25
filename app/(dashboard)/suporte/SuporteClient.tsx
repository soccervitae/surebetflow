"use client"

import { useState } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Plus, MessageCircle, Clock, CheckCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"

type Ticket = {
  id: string
  assunto: string
  status: "aberto" | "respondido" | "fechado"
  prioridade: "baixa" | "normal" | "alta"
  created_at: string
  updated_at: string
  ticket_mensagens: { id: string; is_admin: boolean; lida: boolean }[]
}

const STATUS_CONFIG = {
  aberto:     { label: "Aberto",     icon: Clock,         color: "text-yellow-400", bg: "bg-yellow-500/10" },
  respondido: { label: "Respondido", icon: MessageCircle, color: "text-blue-400",   bg: "bg-blue-500/10" },
  fechado:    { label: "Fechado",    icon: CheckCircle,   color: "text-gray-400",   bg: "bg-gray-500/10" },
}

const PRIORIDADE_CONFIG = {
  baixa:  { label: "Baixa",  color: "text-gray-400", bg: "bg-gray-500/10" },
  normal: { label: "Normal", color: "text-blue-400", bg: "bg-blue-500/10" },
  alta:   { label: "Alta",   color: "text-red-400",  bg: "bg-red-500/10" },
}

function TicketForm({
  onCancel,
  onSubmit,
  assunto, setAssunto,
  mensagem, setMensagem,
  prioridade, setPrioridade,
  loading, error,
}: {
  onCancel: () => void
  onSubmit: (e: React.FormEvent) => void
  assunto: string; setAssunto: (v: string) => void
  mensagem: string; setMensagem: (v: string) => void
  prioridade: "baixa" | "normal" | "alta"; setPrioridade: (v: "baixa" | "normal" | "alta") => void
  loading: boolean; error: string
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="sm:col-span-2 space-y-1.5">
          <label className="text-sm font-medium text-[var(--text-secondary)]">Assunto</label>
          <select
            value={assunto}
            onChange={e => setAssunto(e.target.value)}
            required
            className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-[var(--text-primary)] text-sm focus:outline-none focus:border-[#1e3a8a]/50 transition-colors"
          >
            <option value="" disabled>Selecione o assunto</option>
            <option value="Dúvidas">Dúvidas</option>
            <option value="Sugestões">Sugestões</option>
            <option value="Críticas">Críticas</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-[var(--text-secondary)]">Prioridade</label>
          <select
            value={prioridade}
            onChange={e => setPrioridade(e.target.value as "baixa" | "normal" | "alta")}
            className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-[var(--text-primary)] text-sm focus:outline-none focus:border-[#1e3a8a]/50 transition-colors"
          >
            <option value="baixa">Baixa</option>
            <option value="normal">Normal</option>
            <option value="alta">Alta</option>
          </select>
        </div>
      </div>
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-[var(--text-secondary)]">Mensagem</label>
        <textarea
          value={mensagem}
          onChange={e => setMensagem(e.target.value)}
          placeholder="Descreva detalhadamente sua dúvida ou problema..."
          required
          rows={5}
          className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-[var(--text-primary)] placeholder-[var(--text-muted)] text-sm focus:outline-none focus:border-[#1e3a8a]/50 transition-colors resize-none"
        />
      </div>
      {error && <p className="text-sm text-red-500 bg-red-500/5 border border-red-500/20 rounded-lg px-4 py-2">{error}</p>}
      <div className="flex gap-3 justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-xl border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] text-sm font-medium transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 rounded-xl bg-[#1e3a8a] hover:bg-[#1e40af] disabled:opacity-60 text-white text-sm font-semibold transition-colors"
        >
          {loading ? "Enviando..." : "Abrir ticket"}
        </button>
      </div>
    </form>
  )
}

export default function SuporteClient({ tickets: initial, userId }: { tickets: Ticket[]; userId: string }) {
  const [tickets] = useState(initial)
  const [showSheet, setShowSheet] = useState(false)   // mobile
  const [showModal, setShowModal] = useState(false)   // desktop
  const [assunto, setAssunto] = useState("")
  const [mensagem, setMensagem] = useState("")
  const [prioridade, setPrioridade] = useState<"baixa" | "normal" | "alta">("normal")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()
  const supabase = createClient()

  function resetForm() {
    setAssunto(""); setMensagem(""); setPrioridade("normal"); setError("")
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!assunto.trim() || !mensagem.trim()) return
    setLoading(true)
    setError("")

    const { data: ticket, error: tErr } = await supabase
      .from("tickets")
      .insert({ user_id: userId, assunto: assunto.trim(), prioridade })
      .select()
      .single()

    if (tErr || !ticket) { setError("Erro ao criar ticket."); setLoading(false); return }

    const { error: mErr } = await supabase
      .from("ticket_mensagens")
      .insert({ ticket_id: ticket.id, sender_id: userId, is_admin: false, conteudo: mensagem.trim() })

    if (mErr) { setError("Erro ao enviar mensagem."); setLoading(false); return }

    setShowSheet(false)
    setShowModal(false)
    resetForm()
    setLoading(false)
    router.push(`/suporte/${ticket.id}`)
  }

  const unreadCount = (t: Ticket) =>
    t.ticket_mensagens.filter(m => m.is_admin && !m.lida).length

  const formProps = {
    assunto, setAssunto, mensagem, setMensagem,
    prioridade, setPrioridade, loading, error,
    onSubmit: handleCreate,
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Suporte</h1>
          <p className="text-[var(--text-secondary)] text-sm mt-1">Envie mensagens e acompanhe seus tickets</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { resetForm(); setShowSheet(true) }}
            className="md:hidden inline-flex items-center gap-2 bg-[#1e3a8a] hover:bg-[#1e40af] text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Novo
          </button>
          <button
            onClick={() => { resetForm(); setShowModal(true) }}
            className="hidden md:inline-flex items-center gap-2 bg-[#1e3a8a] hover:bg-[#1e40af] text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Novo ticket
          </button>
        </div>
      </div>

      {/* Tickets list */}
      {tickets.length === 0 ? (
        <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-16 text-center">
          <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-[var(--text-secondary)]">Nenhum ticket aberto</p>
          <div className="mt-4 flex justify-center gap-2">
            <button
              onClick={() => { resetForm(); setShowSheet(true) }}
              className="md:hidden inline-flex items-center gap-2 bg-[#1e3a8a] hover:bg-[#1e40af] text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" /> Abrir primeiro ticket
            </button>
            <button
              onClick={() => { resetForm(); setShowModal(true) }}
              className="hidden md:inline-flex items-center gap-2 bg-[#1e3a8a] hover:bg-[#1e40af] text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" /> Abrir primeiro ticket
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map(t => {
            const st = STATUS_CONFIG[t.status]
            const pr = PRIORIDADE_CONFIG[t.prioridade]
            const unread = unreadCount(t)
            const StIcon = st.icon
            return (
              <Link key={t.id} href={`/suporte/${t.id}`}>
                <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-5 hover:border-[#1e3a8a]/30 transition-all cursor-pointer">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <h3 className="font-semibold text-[var(--text-primary)] truncate">{t.assunto}</h3>
                        {unread > 0 && (
                          <span className="bg-[#1e3a8a] text-white text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0">
                            {unread} nova{unread > 1 ? "s" : ""}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full ${st.bg} ${st.color}`}>
                          <StIcon className="w-3 h-3" />
                          {st.label}
                        </span>
                        <span className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full ${pr.bg} ${pr.color}`}>
                          {pr.label}
                        </span>
                        <span className="text-xs text-[var(--text-muted)]">
                          {t.ticket_mensagens.length} mensagem{t.ticket_mensagens.length !== 1 ? "s" : ""}
                        </span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs text-[var(--text-muted)]">
                        {new Date(t.updated_at).toLocaleDateString("pt-BR")}
                      </p>
                      <p className="text-xs text-[var(--text-muted)]">
                        {new Date(t.updated_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}

      {/* Sheet — mobile */}
      <Sheet open={showSheet} onOpenChange={v => { setShowSheet(v); if (!v) resetForm() }}>
        <SheetContent
          side="bottom"
          className="h-[80vh] flex flex-col p-0 rounded-t-2xl"
          onTouchStart={e => { (e.currentTarget as any)._swipeY = e.touches[0].clientY }}
          onTouchEnd={e => {
            const startY = (e.currentTarget as any)._swipeY
            if (startY !== undefined && e.changedTouches[0].clientY - startY > 80) setShowSheet(false)
          }}
        >
          <SheetHeader className="px-5 pt-5 pb-3 border-b border-[var(--border)] flex-shrink-0">
            <SheetTitle className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-[var(--accent-text)]" />
              Novo Ticket
            </SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-5 py-4">
            <TicketForm {...formProps} onCancel={() => { setShowSheet(false); resetForm() }} />
          </div>
        </SheetContent>
      </Sheet>

      {/* Dialog — desktop */}
      <Dialog open={showModal} onOpenChange={v => { setShowModal(v); if (!v) resetForm() }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-[var(--accent-text)]" />
              Novo Ticket
            </DialogTitle>
          </DialogHeader>
          <TicketForm {...formProps} onCancel={() => { setShowModal(false); resetForm() }} />
        </DialogContent>
      </Dialog>
    </div>
  )
}
