"use client"

import { useState, useRef } from "react"
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet"
import {
  BookOpen, Home, Users, Calculator, DollarSign,
  Settings, HelpCircle, ChevronRight, CheckCircle,
  TrendingUp, Clock, ArrowUpRight,
  CreditCard, Zap,
  BarChart2, ChevronLeft,
  Filter, X,
} from "lucide-react"

const SECTIONS = [
  { id: "inicio",        label: "Dashboard",      icon: Home },
  { id: "perfis",        label: "Perfis",          icon: Users },
  { id: "calculadora",   label: "Calculadora",     icon: Calculator },
  { id: "apostas",       label: "Apostas",         icon: BookOpen },
  { id: "financeiro",    label: "Financeiro",      icon: DollarSign },
  { id: "assinatura",    label: "Assinatura",      icon: CreditCard },
  { id: "configuracoes", label: "Configurações",   icon: Settings },
  { id: "suporte",       label: "Suporte",         icon: HelpCircle },
]

function Tip({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-2.5 bg-[#1e3a8a]/10 border border-[#1e3a8a]/20 rounded-xl px-4 py-3">
      <Zap className="w-4 h-4 text-[var(--accent-text)] shrink-0 mt-0.5" />
      <p className="text-sm text-[var(--text-secondary)]">{text}</p>
    </div>
  )
}

function Step({ num, text }: { num: number; text: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-6 h-6 rounded-full bg-[#1e3a8a]/20 border border-[#1e3a8a]/40 flex items-center justify-center shrink-0 mt-0.5">
        <span className="text-[var(--accent-text)] text-xs font-bold">{num}</span>
      </div>
      <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{text}</p>
    </div>
  )
}

/* ── SECTION CONTENT ── */
function SectionContent({ id }: { id: string }) {
  return (
    <div className="space-y-8 overflow-hidden">

      {/* ── DASHBOARD ── */}
      {id === "inicio" && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-[var(--text-primary)] mb-1">Dashboard — Painel Geral</h2>
            <p className="text-sm text-[var(--text-secondary)]">Visão consolidada de todos os seus perfis e apostas.</p>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">O que você encontra aqui</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: TrendingUp,   label: "Lucro", desc: "Soma de todos os lucros confirmados" },
                { icon: Clock,        label: "Lucro Pendente",  desc: "Apostas ainda não finalizadas" },
                { icon: ArrowUpRight, label: "ROI",             desc: "Retorno sobre investimento total" },
                { icon: BarChart2,    label: "Gráfico",         desc: "Evolução do lucro acumulado ao longo do tempo" },
              ].map(({ icon: Icon, label, desc }) => (
                <div key={label} className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Icon className="w-4 h-4 text-[var(--accent-text)]" />
                    <span className="text-sm font-medium text-[var(--text-primary)]">{label}</span>
                  </div>
                  <p className="text-xs text-[var(--text-muted)]">{desc}</p>
                </div>
              ))}
            </div>
          </div>
          <Tip text="Troque o filtro de período (Dia, Semana, Mês, Ano) no canto superior do gráfico para ver resultados em diferentes janelas de tempo." />
        </div>
      )}

      {/* ── PERFIS ── */}
      {id === "perfis" && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-[var(--text-primary)] mb-1">Perfis de Apostador</h2>
            <p className="text-sm text-[var(--text-secondary)]">Organize suas apostas separando diferentes estratégias ou bancas.</p>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">Como criar um perfil</h3>
            <div className="space-y-3">
              <Step num={1} text='Acesse "Perfis" no menu lateral.' />
              <Step num={2} text='Clique em "Novo perfil" no canto superior direito.' />
              <Step num={3} text="Preencha nome, sobrenome, apelido (opcional) e foto (opcional)." />
              <Step num={4} text='Clique em "Salvar" — o perfil aparece na grade imediatamente.' />
              <Step num={5} text="Clique no card do perfil para ver apostas, casas e estatísticas." />
            </div>
          </div>
          <Tip text="Crie perfis separados por estratégia: um para surebets, outro para value bets. Assim seus resultados ficam organizados e fáceis de comparar." />
        </div>
      )}

      {/* ── CALCULADORA ── */}
      {id === "calculadora" && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-[var(--text-primary)] mb-1">Calculadora de Surebet</h2>
            <p className="text-sm text-[var(--text-secondary)]">Calcule apostas 2-way e 3-way para garantir lucro independente do resultado.</p>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">Como usar a calculadora</h3>
            <div className="space-y-3">
              <Step num={1} text='Escolha "2-way" (dois resultados) ou "3-way" (futebol com empate).' />
              <Step num={2} text="Digite as odds de cada resultado encontradas em casas diferentes." />
              <Step num={3} text="Informe o valor total que deseja investir." />
              <Step num={4} text="A calculadora mostra quanto apostar em cada odd e o lucro garantido." />
              <Step num={5} text='"Registrar apostas" salva as entradas diretamente no perfil selecionado.' />
            </div>
          </div>
          <Tip text="Surebets acima de 3% de ROI têm odds que fecham rápido. Confirme os valores nas casas antes de apostar." />
        </div>
      )}

      {/* ── APOSTAS ── */}
      {id === "apostas" && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-[var(--text-primary)] mb-1">Registro de Apostas</h2>
            <p className="text-sm text-[var(--text-secondary)]">Registre e acompanhe todas as suas apostas em um só lugar.</p>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">Como registrar uma aposta</h3>
            <div className="space-y-3">
              <Step num={1} text='Acesse "Apostas" no menu lateral.' />
              <Step num={2} text='Clique em "+ Nova Aposta" e selecione o perfil.' />
              <Step num={3} text="Preencha evento, mercado, odd, valor e casa de aposta." />
              <Step num={4} text="Após o resultado, volte e marque como Ganho, Perdido ou Devolvido." />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Pendente",  color: "text-yellow-400", bg: "bg-yellow-500/10 border-yellow-500/20", desc: "Aguardando resultado" },
              { label: "Ganho",     color: "text-green-400",  bg: "bg-green-500/10 border-green-500/20",   desc: "Aposta vencedora" },
              { label: "Perdido",   color: "text-red-400",    bg: "bg-red-500/10 border-red-500/20",       desc: "Aposta perdedora" },
            ].map(({ label, color, bg, desc }) => (
              <div key={label} className={`border rounded-xl p-3 ${bg}`}>
                <p className={`text-sm font-semibold mb-1 ${color}`}>{label}</p>
                <p className="text-xs text-[var(--text-muted)]">{desc}</p>
              </div>
            ))}
          </div>
          <Tip text="Registre cada aposta logo após realizá-la. Quanto mais completo o histórico, mais precisas são suas estatísticas." />
        </div>
      )}

      {/* ── FINANCEIRO ── */}
      {id === "financeiro" && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-[var(--text-primary)] mb-1">Financeiro</h2>
            <p className="text-sm text-[var(--text-secondary)]">Análise detalhada do seu desempenho financeiro.</p>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">O que você encontra aqui</h3>
            <div className="space-y-2.5">
              {[
                { icon: BarChart2,    label: "Evolução da banca",  desc: "Gráfico do crescimento do saldo ao longo do tempo com filtros de período." },
                { icon: ArrowUpRight, label: "ROI por período",    desc: "Retorno sobre investimento filtrado por dia, semana, mês ou ano." },
                { icon: Filter,       label: "Filtros avançados",  desc: "Filtre por perfil e bet para análises específicas." },
              ].map(({ icon: Icon, label, desc }) => (
                <div key={label} className="flex items-start gap-3 bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-4">
                  <div className="w-8 h-8 bg-[#1e3a8a]/10 rounded-lg flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-[var(--accent-text)]" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[var(--text-primary)] mb-0.5">{label}</p>
                    <p className="text-xs text-[var(--text-muted)]">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <Tip text="Se um perfil tem ROI negativo, compare as casas de apostas usadas. Às vezes uma única casa está puxando o resultado para baixo." />
        </div>
      )}

      {/* ── ASSINATURA ── */}
      {id === "assinatura" && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-[var(--text-primary)] mb-1">Assinatura</h2>
            <p className="text-sm text-[var(--text-secondary)]">Gerencie seu plano e forma de pagamento.</p>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">Como assinar o plano</h3>
            <div className="space-y-3">
              <Step num={1} text='Acesse "Assinatura" no menu lateral.' />
              <Step num={2} text='Clique em "Assinar agora" para ir à página de pagamento.' />
              <Step num={3} text="Escolha cartão de crédito ou débito e preencha os dados." />
              <Step num={4} text="Ativação imediata após confirmação do pagamento." />
            </div>
          </div>
          <Tip text="Para cancelar a assinatura, abra um ticket no Suporte. Nossa equipe responde em até 24 horas." />
        </div>
      )}

      {/* ── CONFIGURAÇÕES ── */}
      {id === "configuracoes" && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-[var(--text-primary)] mb-1">Configurações</h2>
            <p className="text-sm text-[var(--text-secondary)]">Personalize sua conta e preferências.</p>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">O que você pode configurar</h3>
            <div className="space-y-2.5">
              {[
                { label: "Dados pessoais",  desc: "Atualize seu nome, foto de perfil e endereço de e-mail." },
                { label: "Segurança",       desc: "Altere sua senha de acesso quando necessário." },
                { label: "Aparência",       desc: "Alterne entre tema escuro e claro conforme sua preferência." },
                { label: "Legal",           desc: "Acesse Política de Privacidade e Termos de Uso." },
              ].map(({ label, desc }) => (
                <div key={label} className="flex items-start gap-3 bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-4">
                  <CheckCircle className="w-4 h-4 text-[var(--accent-text)] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-[var(--text-primary)] mb-0.5">{label}</p>
                    <p className="text-xs text-[var(--text-muted)]">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <Tip text="Mantenha seu e-mail sempre atualizado para receber notificações importantes sobre sua assinatura." />
        </div>
      )}

      {/* ── SUPORTE ── */}
      {id === "suporte" && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-[var(--text-primary)] mb-1">Suporte</h2>
            <p className="text-sm text-[var(--text-secondary)]">Abra tickets e acompanhe o atendimento da nossa equipe.</p>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">Como abrir um ticket</h3>
            <div className="space-y-3">
              <Step num={1} text='Acesse "Suporte" no menu lateral.' />
              <Step num={2} text='Clique em "+ Novo ticket".' />
              <Step num={3} text="Selecione o assunto: Dúvidas, Sugestões ou Críticas." />
              <Step num={4} text="Escolha a prioridade e descreva detalhadamente o problema." />
              <Step num={5} text="Clique em Abrir ticket — nossa equipe responde em até 24 horas úteis." />
              <Step num={6} text="Acompanhe e responda clicando no ticket aberto na lista." />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Aberto",     color: "text-yellow-400", bg: "bg-yellow-500/10 border-yellow-500/20", desc: "Aguardando resposta" },
              { label: "Respondido", color: "text-blue-400",   bg: "bg-blue-500/10 border-blue-500/20",    desc: "Equipe respondeu" },
              { label: "Fechado",    color: "text-gray-400",   bg: "bg-gray-500/10 border-gray-500/20",    desc: "Resolvido e encerrado" },
            ].map(({ label, color, bg, desc }) => (
              <div key={label} className={`border rounded-xl p-3 ${bg}`}>
                <p className={`text-sm font-semibold mb-1 ${color}`}>{label}</p>
                <p className="text-xs text-[var(--text-muted)]">{desc}</p>
              </div>
            ))}
          </div>
          <Tip text="Inclua prints e o máximo de detalhes no ticket. Isso agiliza muito a resolução do problema." />
        </div>
      )}
    </div>
  )
}

export default function TutorialClient() {
  const [active, setActive] = useState("inicio")
  const [sheetOpen, setSheetOpen] = useState(false)
  const [sheetSection, setSheetSection] = useState("inicio")
  const IDS = SECTIONS.map(s => s.id)
  const touchStartX = useRef(0)

  function handleTouchStart(e: React.TouchEvent) { touchStartX.current = e.touches[0].clientX }
  function handleTouchEnd(e: React.TouchEvent) {
    const dx = e.changedTouches[0].clientX - touchStartX.current
    if (Math.abs(dx) < 50) return
    const idx = IDS.indexOf(sheetSection)
    if (dx < 0 && idx < IDS.length - 1) setSheetSection(IDS[idx + 1])
    if (dx > 0 && idx > 0) setSheetSection(IDS[idx - 1])
  }

  function openSheet(id: string) { setSheetSection(id); setSheetOpen(true) }

  const sheetIdx = IDS.indexOf(sheetSection)
  const currentSection = SECTIONS.find(s => s.id === sheetSection)

  return (
    <div className="max-w-5xl mx-auto overflow-x-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="hidden md:flex w-9 h-9 bg-[#1e3a8a]/10 rounded-xl items-center justify-center shrink-0">
          <BookOpen className="w-5 h-5 text-[var(--accent-text)]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Tutorial</h1>
          <p className="text-sm text-[var(--text-secondary)]">Aprenda a usar todas as funcionalidades do SureBetFlow</p>
        </div>
      </div>

      {/* Mobile: card grid */}
      <div className="md:hidden grid grid-cols-2 gap-3 mb-2">
        {SECTIONS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => openSheet(id)}
            className="flex flex-col items-center gap-3 p-5 bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl hover:border-[#1e3a8a]/40 hover:bg-[#1e3a8a]/5 transition-all text-left active:scale-95"
          >
            <div className="w-10 h-10 bg-[#1e3a8a]/10 rounded-xl flex items-center justify-center">
              <Icon className="w-5 h-5 text-[var(--accent-text)]" />
            </div>
            <span className="text-sm font-medium text-[var(--text-primary)] text-center leading-tight">{label}</span>
          </button>
        ))}
      </div>

      {/* Desktop: tabs + content */}
      <div className="hidden md:block">
        <div className="mb-6">
          <div className="flex overflow-x-auto scrollbar-hide border-b border-[var(--border)]">
            {SECTIONS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActive(id)}
                className={`flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium whitespace-nowrap flex-shrink-0 border-b-2 -mb-px transition-colors ${
                  active === id
                    ? "border-[#1e3a8a] text-[var(--accent-text)]"
                    : "border-transparent text-[var(--text-secondary)]"
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                {label}
              </button>
            ))}
          </div>
        </div>

        <SectionContent id={active} />

        <div className="flex items-center justify-between pt-4 mt-8 border-t border-[var(--border)]">
          <button
            onClick={() => { const idx = SECTIONS.findIndex(s => s.id === active); if (idx > 0) setActive(SECTIONS[idx - 1].id) }}
            disabled={SECTIONS[0].id === active}
            className="flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] disabled:opacity-30 transition-colors"
          >
            <ChevronRight className="w-4 h-4 rotate-180" />
            Anterior
          </button>
          <span className="text-xs text-[var(--text-muted)]">
            {SECTIONS.findIndex(s => s.id === active) + 1} / {SECTIONS.length}
          </span>
          <button
            onClick={() => { const idx = SECTIONS.findIndex(s => s.id === active); if (idx < SECTIONS.length - 1) setActive(SECTIONS[idx + 1].id) }}
            disabled={SECTIONS[SECTIONS.length - 1].id === active}
            className="flex items-center gap-2 text-sm text-[var(--accent-text)] hover:text-[#1e40af] disabled:opacity-30 transition-colors font-medium"
          >
            Próximo
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Mobile Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent
          side="bottom"
          className="h-[80vh] flex flex-col p-0 rounded-t-2xl [&>button]:hidden"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)] flex-shrink-0">
            <div className="flex items-center gap-2">
              {currentSection && <currentSection.icon className="w-4 h-4 text-[var(--accent-text)]" />}
              <SheetTitle className="text-sm font-semibold text-[var(--text-primary)]">
                {currentSection?.label}
              </SheetTitle>
            </div>
            <button
              onClick={() => setSheetOpen(false)}
              className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center justify-center gap-1.5 py-2 flex-shrink-0">
            {SECTIONS.map(s => (
              <button
                key={s.id}
                onClick={() => setSheetSection(s.id)}
                className={`rounded-full transition-all ${
                  s.id === sheetSection
                    ? "w-4 h-1.5 bg-[#1e3a8a]"
                    : "w-1.5 h-1.5 bg-[var(--border)]"
                }`}
              />
            ))}
          </div>

          <div className="flex-1 overflow-y-auto relative">
            <button
              onClick={() => sheetIdx > 0 && setSheetSection(IDS[sheetIdx - 1])}
              disabled={sheetIdx === 0}
              className="fixed left-2 top-1/2 -translate-y-1/2 z-50 w-9 h-9 flex items-center justify-center rounded-full bg-[var(--bg-surface)] border border-[var(--border)] shadow-md text-[var(--text-secondary)] disabled:opacity-20 transition-all active:scale-95"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <button
              onClick={() => sheetIdx < IDS.length - 1 && setSheetSection(IDS[sheetIdx + 1])}
              disabled={sheetIdx === IDS.length - 1}
              className="fixed right-2 top-1/2 -translate-y-1/2 z-50 w-9 h-9 flex items-center justify-center rounded-full bg-[var(--bg-surface)] border border-[var(--border)] shadow-md text-[var(--accent-text)] disabled:opacity-20 transition-all active:scale-95"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            <div className="px-4 pb-8 pt-2">
              <SectionContent id={sheetSection} />
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
