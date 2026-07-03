"use client"

import { useState, useRef, useEffect } from "react"
import { Send, Bot, User, Trash2, Loader2, Paperclip, X, ImageIcon } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

type Message = {
  id?: string
  role: "user" | "assistant"
  content: string
  image_url?: string | null
}

// ---------------------------------------------------------------------------
// FAQ engine
// ---------------------------------------------------------------------------
type FAQ = { keywords: string[]; answer: string }

const FAQS: FAQ[] = [
  // Platform overview
  {
    keywords: ["surebet", "arbitragem", "o que é", "pra que serve", "serve", "plataforma"],
    answer:
      "A SurebetFlow é uma plataforma de gestão de apostas esportivas com foco em surebet (arbitragem esportiva). Ela permite registrar, acompanhar e analisar suas apostas em múltiplas casas, calculando lucro, ROI e investimento automaticamente.",
  },

  // Perfil
  {
    keywords: ["perfil", "criar perfil", "novo perfil", "banca", "adicionar perfil", "cadastrar perfil"],
    answer:
      "Como criar um Perfil de Banca:\n\n📱 No celular: toque no ícone (+) azul no centro do menu inferior da tela.\n🖥️ No desktop: clique no botão (+) no canto inferior direito da tela.\n\nEm seguida:\n1. Escolha a opção 'Novo Perfil'.\n2. Preencha o nome do perfil e as informações solicitadas.\n3. Clique em 'Salvar'.\n\nCada perfil representa uma estratégia ou conjunto de casas de apostas. Você pode ter quantos perfis quiser.",
  },

  // Aposta
  {
    keywords: ["aposta", "nova aposta", "registrar aposta", "como adicionar aposta", "adicionar aposta", "cadastrar aposta", "como registro", "registrar"],
    answer:
      "Como adicionar uma Nova Aposta:\n\n📱 No celular: toque no ícone (+) azul no centro do menu inferior da tela.\n🖥️ No desktop: clique no botão (+) no canto inferior direito da tela.\n\nEm seguida:\n1. Escolha a opção 'Nova Aposta'.\n2. Selecione o perfil de banca.\n3. Preencha os dados do evento: nome, competição, data e tipo de aposta.\n4. Adicione os legs: para cada leg informe a casa de apostas, a odd e o valor de stake.\n5. O sistema calcula automaticamente o investimento total, lucro garantido e ROI.\n6. Clique em 'Salvar'.\n\nApós o resultado do evento, volte à aposta e registre o resultado de cada leg (Green, Red ou Reembolso).",
  },

  // Bet / Casa de apostas
  {
    keywords: ["bet", "casa de aposta", "adicionar bet", "nova bet", "casa apostas", "cadastrar bet", "como adiciono bet"],
    answer:
      "Como adicionar uma Casa de Apostas (Bet) ao perfil:\n\n📱 No celular: toque no ícone (+) azul no centro do menu inferior da tela.\n🖥️ No desktop: clique no botão (+) no canto inferior direito da tela.\n\nEm seguida:\n1. Escolha a opção 'Adicionar Bet'.\n2. Busque e selecione a casa de apostas desejada.\n3. Informe o e-mail e senha da sua conta nessa casa.\n4. Clique em 'Salvar'.\n\nVocê pode adicionar quantas casas quiser ao mesmo perfil. Cada bet terá seu saldo, lucro e ROI rastreados individualmente.",
  },

  // Depósito
  {
    keywords: ["deposito", "depósito", "como depositar", "registrar deposito", "adicionar deposito", "como faço deposito"],
    answer:
      "Como registrar um Depósito:\n\n📱 No celular: toque no ícone (+) azul no centro do menu inferior da tela.\n🖥️ No desktop: clique no botão (+) no canto inferior direito da tela.\n\nEm seguida:\n1. Escolha a opção 'Nova Movimentação'.\n2. Selecione a bet (casa de apostas) e o tipo 'Depósito'.\n3. Informe o valor depositado e uma descrição opcional.\n4. Clique em 'Salvar'.\n\nO saldo da bet será atualizado automaticamente.",
  },

  // Saque
  {
    keywords: ["saque", "como sacar", "registrar saque", "retirada", "como faço saque"],
    answer:
      "Como registrar um Saque:\n\n📱 No celular: toque no ícone (+) azul no centro do menu inferior da tela.\n🖥️ No desktop: clique no botão (+) no canto inferior direito da tela.\n\nEm seguida:\n1. Escolha a opção 'Nova Movimentação'.\n2. Selecione a bet (casa de apostas) e o tipo 'Saque'.\n3. Informe o valor sacado e uma descrição opcional.\n4. Clique em 'Salvar'.\n\nO valor será subtraído do saldo da bet automaticamente.",
  },

  // Lucro
  {
    keywords: ["lucro", "registrar lucro", "como adiciono lucro", "ganho", "como registro lucro"],
    answer:
      "Como registrar um Lucro:\n\n📱 No celular: toque no ícone (+) azul no centro do menu inferior da tela.\n🖥️ No desktop: clique no botão (+) no canto inferior direito da tela.\n\nEm seguida:\n1. Escolha a opção 'Nova Movimentação'.\n2. Selecione a bet (casa de apostas) e o tipo 'Lucro'.\n3. Informe o valor do lucro e uma descrição opcional.\n4. Clique em 'Salvar'.\n\nO lucro será somado ao saldo da bet e contabilizado no ROI do perfil.\n\nDica: você também pode registrar o resultado de uma aposta individualmente acessando a aposta → resultado de cada leg (Green).",
  },

  // Perda
  {
    keywords: ["perda", "registrar perda", "como registro perda", "prejuizo", "prejuízo", "como adiciono perda"],
    answer:
      "Como registrar uma Perda:\n\n📱 No celular: toque no ícone (+) azul no centro do menu inferior da tela.\n🖥️ No desktop: clique no botão (+) no canto inferior direito da tela.\n\nEm seguida:\n1. Escolha a opção 'Nova Movimentação'.\n2. Selecione a bet (casa de apostas) e o tipo 'Perda'.\n3. Informe o valor da perda e uma descrição opcional.\n4. Clique em 'Salvar'.\n\nO valor será subtraído do saldo da bet e contabilizado negativamente no ROI.\n\nDica: ao registrar o resultado de uma aposta como Red (perdeu), o sistema já calcula a perda automaticamente.",
  },

  // Bônus
  {
    keywords: ["bonus", "bônus", "registrar bonus", "como adiciono bonus", "frebet", "freebet"],
    answer:
      "Como registrar um Bônus:\n\n📱 No celular: toque no ícone (+) azul no centro do menu inferior da tela.\n🖥️ No desktop: clique no botão (+) no canto inferior direito da tela.\n\nEm seguida:\n1. Escolha a opção 'Nova Movimentação'.\n2. Selecione a bet (casa de apostas) e o tipo 'Bônus'.\n3. Informe o valor do bônus e uma descrição opcional.\n4. Clique em 'Salvar'.\n\nImportante: o valor do bônus é registrado separadamente e não entra no saldo real da conta — serve apenas para controle de promoções.",
  },

  // Movimentação geral
  {
    keywords: ["movimentação", "movimentacao", "financeiro", "nova movimentacao", "registrar movimentacao"],
    answer:
      "Como registrar uma Movimentação Financeira:\n\n📱 No celular: toque no ícone (+) azul no centro do menu inferior da tela.\n🖥️ No desktop: clique no botão (+) no canto inferior direito da tela.\n\nEm seguida:\n1. Escolha a opção 'Nova Movimentação'.\n2. Selecione a bet (casa de apostas) e o tipo: Depósito, Saque, Lucro, Perda ou Bônus.\n3. Informe o valor e uma descrição opcional.\n4. Clique em 'Salvar'.\n\nVocê também pode acessar o módulo 'Financeiro' no menu lateral para ver o histórico completo de todas as movimentações.",
  },

  // ROI
  {
    keywords: ["roi", "retorno sobre investimento", "como calcular roi", "o que e roi", "o que é roi"],
    answer:
      "O ROI (Retorno sobre Investimento) é calculado automaticamente pela SurebetFlow.\n\nFórmula: ROI = (Lucro líquido / Total investido) × 100\n\nExemplo: Se você investiu R$ 1.000 e obteve R$ 30 de lucro, o ROI é de 3%.\n\nVocê encontra o ROI em:\n• Cada aposta individualmente (ROI daquela operação)\n• Em cada perfil de banca (ROI acumulado do perfil)\n• Em cada bet/casa de apostas (ROI histórico naquela casa)\n• No Dashboard (visão geral consolidada)",
  },

  // Leg
  {
    keywords: ["leg", "o que é leg", "ramificação", "o que e leg"],
    answer:
      "Leg é cada parte de uma surebet. Em uma surebet simples você tem 2 legs: uma aposta na casa A e outra na casa B, com odds complementares que garantem lucro independente do resultado.\n\nCada leg tem:\n• Casa de apostas (bet)\n• Odd negociada\n• Valor de stake (quanto apostar)\n• Resultado (Green/Red/Reembolso)\n\nO sistema suporta múltiplos legs por aposta e calcula automaticamente o lucro garantido considerando todos os legs.",
  },

  // Resultado / finalizar aposta
  {
    keywords: ["resultado", "green", "red", "reembolso", "finalizar aposta", "resultado aposta", "como registro resultado"],
    answer:
      "Como registrar o Resultado de uma Aposta:\n\n1. Acesse o menu 'Apostas' e clique na aposta desejada.\n2. Clique em 'Registrar Resultado'.\n3. Para cada leg, selecione o resultado:\n   • Green → ganhou (o lucro é somado ao saldo)\n   • Red → perdeu (a perda é subtraída do saldo)\n   • Reembolso → stake devolvida (sem lucro nem perda)\n4. Clique em 'Salvar'.\n\nApós registrar, o sistema atualiza automaticamente o lucro real, ROI e o saldo das bets envolvidas.",
  },

  // Saldo
  {
    keywords: ["saldo", "saldo total", "como calcular saldo", "atualizar saldo"],
    answer:
      "O saldo de cada bet é atualizado automaticamente conforme você registra movimentações:\n• Depósito → soma ao saldo\n• Saque → subtrai do saldo\n• Lucro → soma ao saldo\n• Perda → subtrai do saldo\n• Bônus → registrado separadamente, não afeta o saldo real\n\nO saldo total do perfil é a soma dos saldos de todas as casas de apostas ativas. Você pode ver o saldo de cada bet na aba 'Bets' do perfil.",
  },

  // Assinatura
  {
    keywords: ["assinatura", "plano", "pagamento", "preço", "valor", "assinar"],
    answer:
      "A SurebetFlow funciona por assinatura. Para ver os planos disponíveis e gerenciar sua assinatura, acesse 'Minha Conta' ou 'Assinatura' no menu. O pagamento é processado com segurança via Stripe.",
  },

  // Cancelar
  {
    keywords: ["cancelar", "cancelar assinatura", "desativar conta"],
    answer:
      "Para cancelar sua assinatura, acesse 'Assinatura' no menu. Se precisar de ajuda com o cancelamento, entre em contato com o suporte humano através da opção no menu.",
  },

  // Senha
  {
    keywords: ["senha", "trocar senha", "esqueci senha", "alterar senha", "redefinir senha"],
    answer:
      "Para trocar sua senha, acesse 'Minha Conta' → 'Configurações' e utilize a opção de alterar senha. Se esqueceu a senha e não consegue entrar, use a opção 'Esqueci minha senha' na tela de login.",
  },

  // Configurações
  {
    keywords: ["configuração", "configuracoes", "configurações", "perfil do usuario", "minha conta", "editar perfil"],
    answer:
      "Acesse 'Minha Conta' no menu lateral para editar seus dados pessoais, trocar senha e gerenciar preferências da conta.",
  },

  // Dashboard
  {
    keywords: ["dashboard", "resumo", "visao geral", "visão geral", "inicio", "início"],
    answer:
      "O Dashboard mostra um resumo geral: saldo total, apostas realizadas, lucro acumulado, ROI e taxa de acerto. Acesse-o clicando em 'Dashboard' no menu lateral.",
  },

  // Tutorial
  {
    keywords: ["tutorial", "como usar", "primeiros passos", "começar", "comecar", "ajuda"],
    answer:
      "Acesse o menu 'Tutorial' para ver um guia passo a passo de como usar a plataforma. Ele cobre desde a criação do perfil até o registro de apostas e análise de resultados.",
  },

  // Erros
  {
    keywords: ["bug", "erro", "problema", "não funciona", "nao funciona", "travou", "falha"],
    answer:
      "Desculpe pelo inconveniente! Tente atualizar a página (F5) e repetir a ação. Se o problema persistir, entre em contato com o suporte humano para que possamos investigar.",
  },
]

const FALLBACK =
  "Não encontrei uma resposta específica para isso. Tente reformular sua dúvida ou pergunte sobre funcionalidades como: perfis, apostas, bets, saldo, ROI, movimentações ou assinatura. Se precisar de ajuda personalizada, você pode abrir um ticket de suporte no menu."

const GREETING_TRIGGERS = ["oi", "olá", "ola", "bom dia", "boa tarde", "boa noite", "hello", "hi", "opa", "eai", "e aí"]

function getAnswer(text: string, name?: string): string {
  const hi = name ? `, ${name}` : ""
  const normalized = text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")

  const isGreeting = GREETING_TRIGGERS.some(
    g => normalized.trim() === g || normalized.trim().startsWith(g + " ") || normalized.trim().endsWith(" " + g)
  )
  if (isGreeting) {
    return `Olá${hi}! Sou o assistente da SurebetFlow. Como posso ajudar você hoje? Pode perguntar sobre perfis, apostas, casas de apostas (bets), saldo, ROI, movimentações financeiras ou assinatura.`
  }

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
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [firstName, setFirstName] = useState("")
  const bottomRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  useEffect(() => {
    document.body.style.overflow = "hidden"
    return () => { document.body.style.overflow = "" }
  }, [])

  useEffect(() => {
    async function loadHistory() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      const [{ data: profile }, { data: msgs }] = await Promise.all([
        supabase.from("profiles").select("nome").eq("user_id", user.id).single(),
        supabase
          .from("support_chat_messages")
          .select("id, role, content, image_url")
          .eq("user_id", user.id)
          .order("created_at", { ascending: true }),
      ])

      if (profile?.nome) setFirstName(profile.nome.split(" ")[0])
      setMessages((msgs ?? []) as Message[])
      setLoading(false)
    }
    loadHistory()
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
    e.target.value = ""
  }

  function removeImage() {
    setImageFile(null)
    if (imagePreview) URL.revokeObjectURL(imagePreview)
    setImagePreview(null)
  }

  async function uploadImage(file: File, userId: string): Promise<string | null> {
    const ext = file.name.split(".").pop() ?? "jpg"
    const path = `${userId}/${Date.now()}.${ext}`
    const { error } = await supabase.storage.from("support-chat-images").upload(path, file)
    if (error) return null
    const { data } = supabase.storage.from("support-chat-images").getPublicUrl(path)
    return data.publicUrl
  }

  async function saveMessages(msgs: Message[]) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const rows = msgs.map(m => ({ user_id: user.id, role: m.role, content: m.content, image_url: m.image_url ?? null }))
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
    if (!text && !imageFile) return

    setUploading(true)
    const { data: { user } } = await supabase.auth.getUser()
    let uploadedUrl: string | null = null
    if (imageFile && user) uploadedUrl = await uploadImage(imageFile, user.id)

    const userMsg: Message = { role: "user", content: text, image_url: uploadedUrl }
    const answer = text ? getAnswer(text, firstName) : "Imagem recebida! Se quiser, descreva sua dúvida em texto para que eu possa ajudar melhor."
    const assistantMsg: Message = { role: "assistant", content: answer }

    setMessages(prev => [...prev, userMsg, assistantMsg])
    setInput("")
    removeImage()
    setUploading(false)
    saveMessages([userMsg, assistantMsg])
  }

  const canSend = (input.trim() || imageFile) && !uploading

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl">

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

      {/* Messages — scrollable */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading && (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-5 h-5 animate-spin text-[var(--text-muted)]" />
          </div>
        )}
        {!loading && messages.length === 0 && (
          <div className="text-center py-10">
            <Bot className="w-10 h-10 text-[var(--text-muted)] mx-auto mb-3" />
            <p className="text-sm text-[var(--text-secondary)]">{firstName ? `Olá, ${firstName}! Como posso ajudar?` : "Olá! Como posso ajudar?"}</p>
            <p className="text-xs text-[var(--text-muted)] mt-1">Pergunte sobre qualquer funcionalidade da SurebetFlow.</p>
            <div className="mt-4 flex flex-wrap gap-2 justify-center">
              {["Como criar um perfil?", "Como registrar uma aposta?", "O que é ROI?", "Como adicionar uma bet?"].map(q => (
                <button
                  key={q}
                  onClick={() => {
                    const answer = getAnswer(q, firstName)
                    const msgs = [{ role: "user" as const, content: q }, { role: "assistant" as const, content: answer }]
                    setMessages(msgs)
                    saveMessages(msgs)
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
            <div className={`max-w-[80%] flex flex-col gap-2 ${msg.role === "user" ? "items-end" : "items-start"}`}>
              {msg.image_url && (
                <img
                  src={msg.image_url}
                  alt="Imagem anexada"
                  className="max-w-[260px] max-h-[200px] rounded-xl object-cover border border-[var(--border)]"
                />
              )}
              {msg.content && (
                <div className={`px-4 py-2.5 rounded-2xl text-sm whitespace-pre-wrap leading-relaxed ${
                  msg.role === "user"
                    ? "bg-[#1e3a8a] text-white rounded-tr-sm"
                    : "bg-[var(--bg-elevated)] text-[var(--text-primary)] rounded-tl-sm"
                }`}>
                  {msg.content}
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input — fixed at bottom */}
      <div className="border-t border-[var(--border)] flex-shrink-0 bg-[var(--bg-surface)]">
        {/* Image preview */}
        {imagePreview && (
          <div className="px-4 pt-3">
            <div className="relative w-fit">
              <img src={imagePreview} alt="Preview" className="h-16 w-auto rounded-xl border border-[var(--border)] object-cover" />
              <button
                type="button"
                onClick={removeImage}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[var(--bg-elevated)] border border-[var(--border)] flex items-center justify-center hover:bg-red-500 hover:border-red-500 hover:text-white transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}
        <form onSubmit={handleSubmit} className="flex items-end gap-2 p-4">
          {/* Image attach button */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageSelect}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            title="Anexar imagem"
            className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-xl border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[#1e3a8a]/50 hover:bg-[#1e3a8a]/5 transition-colors"
          >
            {imageFile ? <ImageIcon className="w-4 h-4 text-[#3b82f6]" /> : <Paperclip className="w-4 h-4" />}
          </button>

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
            disabled={!canSend}
            className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-xl bg-[#1e3a8a] hover:bg-[#1e40af] disabled:opacity-40 transition-colors"
          >
            {uploading ? <Loader2 className="w-4 h-4 text-white animate-spin" /> : <Send className="w-4 h-4 text-white" />}
          </button>
        </form>
      </div>
    </div>
  )
}
