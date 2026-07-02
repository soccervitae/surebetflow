"use client"

import { useState, useRef, useEffect } from "react"
import { Send, Bot, User, Trash2, Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

type Message = {
  id?: string
  role: "user" | "assistant"
  content: string
}

// ---------------------------------------------------------------------------
// FAQ engine — keyword matching, returns markdown-free plain text
// ---------------------------------------------------------------------------
type FAQ = { keywords: string[]; answer: string }

const FAQS: FAQ[] = [
  {
    keywords: ["surebet", "arbitragem", "o que é", "pra que serve", "serve", "plataforma"],
    answer:
      "A SurebetFlow é uma plataforma de gestão de apostas esportivas com foco em surebet (arbitragem esportiva). Ela permite registrar, acompanhar e analisar suas apostas em múltiplas casas, calculando lucro, ROI e investimento automaticamente.",
  },
  {
    keywords: ["perfil", "criar perfil", "novo perfil", "banca", "como criar"],
    answer:
      "Para criar um Perfil de Banca, clique no botão (+) no canto inferior direito da tela e escolha 'Novo Perfil'. Você também pode acessar o menu 'Perfis' e clicar em 'Novo'. Cada perfil representa uma estratégia ou conjunto de casas de apostas.",
  },
  {
    keywords: ["aposta", "nova aposta", "registrar aposta", "como adicionar aposta", "adicionar aposta", "cadastrar aposta"],
    answer:
      "Para registrar uma nova aposta, clique no botão (+) → 'Nova Aposta'. Informe o evento, competição, odds e stake de cada leg (ramificação). O sistema calcula automaticamente o investimento total, lucro garantido e ROI.",
  },
  {
    keywords: ["bet", "casa de aposta", "adicionar bet", "nova bet", "casa apostas"],
    answer:
      "Para adicionar uma casa de apostas a um perfil, acesse o perfil desejado, vá até a aba 'Bets' e clique em 'Adicionar'. Informe o email e senha da conta naquela casa. Você pode adicionar quantas casas quiser.",
  },
  {
    keywords: ["saldo", "saldo total", "como calcular saldo", "atualizar saldo"],
    answer:
      "O saldo total do perfil é a soma dos saldos em todas as casas de apostas cadastradas. Para atualizar o saldo de uma casa, acesse o perfil → aba 'Bets' → clique na bet e registre uma movimentação (depósito, saque, lucro ou perda).",
  },
  {
    keywords: ["roi", "retorno", "lucro", "como calcular roi"],
    answer:
      "O ROI (Retorno sobre Investimento) é calculado automaticamente: (Lucro / Investimento) × 100. Você pode ver o ROI de cada aposta individualmente e o ROI consolidado de cada perfil no Dashboard.",
  },
  {
    keywords: ["leg", "o que é leg", "ramificação"],
    answer:
      "Leg é cada parte de uma surebet. Em uma surebet simples você tem 2 legs: uma aposta na casa A e outra na casa B, com odds que garantem lucro independente do resultado. O sistema suporta multiple legs por aposta.",
  },
  {
    keywords: ["movimentação", "deposito", "depósito", "saque", "financeiro", "registrar deposito"],
    answer:
      "Para registrar uma movimentação financeira (depósito, saque, bônus, lucro ou perda), acesse o perfil → aba 'Bets' → clique no ícone (+) ao lado da casa de apostas. Você também pode usar o botão FAB (+) → 'Movimentação'.",
  },
  {
    keywords: ["resultado", "green", "red", "reembolso", "finalizar aposta", "resultado aposta"],
    answer:
      "Para finalizar uma aposta com resultado, acesse a aposta e registre o resultado de cada leg: Green (ganhou), Red (perdeu) ou Reembolso (devolvido). O sistema então calcula o lucro/perda real automaticamente.",
  },
  {
    keywords: ["assinatura", "plano", "pagamento", "preço", "valor", "assinar"],
    answer:
      "A SurebetFlow funciona por assinatura. Para ver os planos disponíveis e gerenciar sua assinatura, acesse 'Minha Conta' ou 'Assinatura' no menu. O pagamento é processado com segurança via Stripe.",
  },
  {
    keywords: ["cancelar", "cancelar assinatura", "desativar conta"],
    answer:
      "Para cancelar sua assinatura, acesse 'Assinatura' no menu. Se precisar de ajuda com o cancelamento, entre em contato com o suporte humano através da opção no menu.",
  },
  {
    keywords: ["senha", "trocar senha", "esqueci senha", "alterar senha", "redefinir senha"],
    answer:
      "Para trocar sua senha, acesse 'Minha Conta' → 'Configurações' e utilize a opção de alterar senha. Se esqueceu a senha e não consegue entrar, use a opção 'Esqueci minha senha' na tela de login.",
  },
  {
    keywords: ["configuração", "configuracoes", "configurações", "perfil do usuario", "minha conta", "editar perfil"],
    answer:
      "Acesse 'Minha Conta' no menu lateral para editar seus dados pessoais, trocar senha e gerenciar preferências da conta.",
  },
  {
    keywords: ["dashboard", "resumo", "visao geral", "visão geral", "inicio", "início"],
    answer:
      "O Dashboard mostra um resumo geral: saldo total, apostas realizadas, lucro acumulado, ROI e taxa de acerto. Acesse-o clicando em 'Dashboard' no menu lateral.",
  },
  {
    keywords: ["tutorial", "como usar", "primeiros passos", "começar", "comecar", "ajuda"],
    answer:
      "Acesse o menu 'Tutorial' para ver um guia passo a passo de como usar a plataforma. Ele cobre desde a criação do perfil até o registro de apostas e análise de resultados.",
  },
  {
    keywords: ["bug", "erro", "problema", "não funciona", "nao funciona", "travou", "falha"],
    answer:
      "Desculpe pelo inconveniente! Tente atualizar a página (F5) e repetir a ação. Se o problema persistir, entre em contato com o suporte humano para que possamos investigar — clique em 'Abrir ticket de suporte' no menu.",
  },
]

const FALLBACK =
  "Não encontrei uma resposta específica para isso. Tente reformular sua dúvida ou pergunte sobre funcionalidades como: perfis, apostas, bets, saldo, ROI, movimentações ou assinatura. Se precisar de ajuda personalizada, você pode abrir um ticket de suporte no menu."

const GREETING_TRIGGERS = ["oi", "olá", "ola", "bom dia", "boa tarde", "boa noite", "hello", "hi", "opa", "eai", "e aí"]

function getAnswer(text: string): string {
  const normalized = text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")

  const isGreeting = GREETING_TRIGGERS.some(g => normalized.trim() === g || normalized.trim().startsWith(g + " ") || normalized.trim().endsWith(" " + g))
  if (isGreeting) {
    return "Olá! Sou o assistente da SurebetFlow. Como posso ajudar você hoje? Pode perguntar sobre perfis, apostas, casas de apostas (bets), saldo, ROI, movimentações financeiras ou assinatura."
  }

  // Score each FAQ by how many keywords match
  let best: { score: number; answer: string } = { score: 0, answer: FALLBACK }
  for (const faq of FAQS) {
    const score = faq.keywords.filter(kw =>
      normalized.includes(kw.normalize("NFD").replace(/[̀-ͯ]/g, ""))
    ).length
    if (score > best.score) best = { score, answer: faq.answer }
  }

  return best.answer
}

// ---------------------------------------------------------------------------

export default function AiChat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(true)
  const [clearing, setClearing] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  useEffect(() => {
    async function loadHistory() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }
      const { data } = await supabase
        .from("support_chat_messages")
        .select("id, role, content")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true })
      setMessages((data ?? []) as Message[])
      setLoading(false)
    }
    loadHistory()
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  async function saveMessages(msgs: Message[]) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const rows = msgs.map(m => ({ user_id: user.id, role: m.role, content: m.content }))
    await supabase.from("support_chat_messages").insert(rows)
  }

  async function handleClear() {
    setClearing(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (user) await supabase.from("support_chat_messages").delete().eq("user_id", user.id)
    setMessages([])
    setClearing(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const text = input.trim()
    if (!text) return

    const userMsg: Message = { role: "user", content: text }
    const answer = getAnswer(text)
    const assistantMsg: Message = { role: "assistant", content: answer }

    setMessages(prev => [...prev, userMsg, assistantMsg])
    setInput("")
    saveMessages([userMsg, assistantMsg])
  }

  return (
    <div className="flex flex-col h-[600px] bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-[var(--border)] flex-shrink-0">
        <div className="w-8 h-8 rounded-full bg-[#1e3a8a]/20 flex items-center justify-center flex-shrink-0">
          <Bot className="w-4 h-4 text-[#3b82f6]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[var(--text-primary)]">Assistente SurebetFlow</p>
          <p className="text-xs text-[var(--text-muted)]">Tire suas dúvidas sobre o sistema</p>
        </div>
        {messages.length > 0 && (
          <button
            onClick={handleClear}
            disabled={clearing}
            title="Limpar conversa"
            className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] hover:text-red-400 transition-colors px-2 py-1 rounded-lg hover:bg-red-500/10"
          >
            {clearing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
            Limpar
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading && (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-5 h-5 animate-spin text-[var(--text-muted)]" />
          </div>
        )}
        {!loading && messages.length === 0 && (
          <div className="text-center py-10">
            <Bot className="w-10 h-10 text-[var(--text-muted)] mx-auto mb-3" />
            <p className="text-sm text-[var(--text-secondary)]">Olá! Como posso ajudar?</p>
            <p className="text-xs text-[var(--text-muted)] mt-1">Pergunte sobre qualquer funcionalidade da SurebetFlow.</p>
            {/* Quick suggestions */}
            <div className="mt-4 flex flex-wrap gap-2 justify-center">
              {["Como criar um perfil?", "Como registrar uma aposta?", "O que é ROI?", "Como adicionar uma bet?"].map(q => (
                <button
                  key={q}
                  onClick={() => {
                    const answer = getAnswer(q)
                    setMessages([{ role: "user", content: q }, { role: "assistant", content: answer }])
                  }}
                  className="text-xs px-3 py-1.5 rounded-full border border-[var(--border)] text-[var(--text-secondary)] hover:border-[#1e3a8a]/40 hover:text-[var(--text-primary)] transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}
        {!loading && messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
            <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
              msg.role === "user" ? "bg-[#1e3a8a]" : "bg-[#1e3a8a]/20"
            }`}>
              {msg.role === "user"
                ? <User className="w-3.5 h-3.5 text-white" />
                : <Bot className="w-3.5 h-3.5 text-[#3b82f6]" />
              }
            </div>
            <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm whitespace-pre-wrap leading-relaxed ${
              msg.role === "user"
                ? "bg-[#1e3a8a] text-white rounded-tr-sm"
                : "bg-[var(--bg-elevated)] text-[var(--text-primary)] rounded-tl-sm"
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="flex items-end gap-2 p-4 border-t border-[var(--border)] flex-shrink-0">
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => {
            if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(e as any) }
          }}
          placeholder="Digite sua dúvida..."
          rows={1}
          className="flex-1 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[#1e3a8a]/50 resize-none transition-colors"
          style={{ maxHeight: "120px", overflowY: "auto" }}
        />
        <button
          type="submit"
          disabled={!input.trim()}
          className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-xl bg-[#1e3a8a] hover:bg-[#1e40af] disabled:opacity-40 transition-colors"
        >
          <Send className="w-4 h-4 text-white" />
        </button>
      </form>
    </div>
  )
}
