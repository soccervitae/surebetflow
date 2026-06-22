"use client"

import { useState } from "react"
import {
  BookOpen, Home, Users, Calculator, DollarSign, BarChart2,
  Settings, HelpCircle, ChevronRight, CheckCircle, ArrowRight,
  Target, TrendingUp, Layers, PlusCircle, Search, Filter,
  CreditCard, MessageSquare, Bell, User, Star, Zap,
} from "lucide-react"

const SECTIONS = [
  { id: "inicio",       label: "Início",        icon: Home },
  { id: "perfis",       label: "Perfis",         icon: Users },
  { id: "calculadora",  label: "Calculadora",    icon: Calculator },
  { id: "apostas",      label: "Apostas",        icon: BookOpen },
  { id: "financeiro",   label: "Financeiro",     icon: DollarSign },
  { id: "assinatura",   label: "Assinatura",     icon: CreditCard },
  { id: "configuracoes",label: "Configurações",  icon: Settings },
  { id: "suporte",      label: "Suporte",        icon: HelpCircle },
]

function ScreenMock({ children, title, url }: { children: React.ReactNode; title: string; url: string }) {
  return (
    <div className="rounded-2xl overflow-hidden border border-[var(--border)] shadow-2xl">
      {/* Browser bar */}
      <div className="bg-[#1a1a1a] px-4 py-2.5 flex items-center gap-3 border-b border-white/5">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-500/70" />
          <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
          <div className="w-3 h-3 rounded-full bg-green-500/70" />
        </div>
        <div className="flex-1 bg-black/40 rounded-lg px-3 py-1 text-[11px] text-gray-500 font-mono">
          surebetflow.bet{url}
        </div>
      </div>
      {/* Screen content */}
      <div className="bg-[#111] min-h-[280px]">
        {/* Mini sidebar */}
        <div className="flex h-full">
          <div className="w-14 bg-[#0d0d0d] border-r border-white/5 flex flex-col items-center py-3 gap-3 shrink-0">
            <div className="w-7 h-7 bg-[#1e3a8a] rounded-lg flex items-center justify-center">
              <span className="text-white text-[9px] font-bold">S</span>
            </div>
            {[Home, Users, Calculator, BookOpen, DollarSign].map((Icon, i) => (
              <div key={i} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/5">
                <Icon className="w-3.5 h-3.5 text-gray-600" />
              </div>
            ))}
          </div>
          {/* Content area */}
          <div className="flex-1 p-4 overflow-hidden">
            <p className="text-[10px] text-gray-500 mb-3 font-mono">{title}</p>
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}

function Step({ num, text }: { num: number; text: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-6 h-6 rounded-full bg-[#1e3a8a]/20 border border-[#1e3a8a]/40 flex items-center justify-center shrink-0 mt-0.5">
        <span className="text-[#1e3a8a] text-xs font-bold">{num}</span>
      </div>
      <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{text}</p>
    </div>
  )
}

function Tip({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-2.5 bg-[#1e3a8a]/10 border border-[#1e3a8a]/20 rounded-xl px-4 py-3">
      <Zap className="w-4 h-4 text-[#1e3a8a] shrink-0 mt-0.5" />
      <p className="text-sm text-[var(--text-secondary)]">{text}</p>
    </div>
  )
}

export default function TutorialClient() {
  const [active, setActive] = useState("inicio")

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-9 h-9 bg-[#1e3a8a]/10 rounded-xl flex items-center justify-center">
          <BookOpen className="w-5 h-5 text-[#1e3a8a]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Tutorial</h1>
          <p className="text-sm text-[var(--text-secondary)]">Aprenda a usar todas as funcionalidades do SureBetFlow</p>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Sidebar nav */}
        <div className="w-52 shrink-0">
          <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl overflow-hidden sticky top-6">
            <div className="px-3 py-2 border-b border-[var(--border)]">
              <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Seções</p>
            </div>
            <ul className="py-1.5">
              {SECTIONS.map(({ id, label, icon: Icon }) => (
                <li key={id}>
                  <button
                    onClick={() => setActive(id)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg mx-1.5 transition-colors text-left
                      ${active === id
                        ? "bg-[#1e3a8a]/15 text-[#1e3a8a] font-medium"
                        : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/5"
                      }`}
                    style={{ width: "calc(100% - 12px)" }}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    {label}
                    {active === id && <ChevronRight className="w-3 h-3 ml-auto" />}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-8">

          {/* ── INÍCIO ── */}
          {active === "inicio" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-[var(--text-primary)] mb-1">Dashboard — Início</h2>
                <p className="text-sm text-[var(--text-secondary)]">Visão geral do seu desempenho como apostador.</p>
              </div>

              <ScreenMock title="Dashboard" url="/dashboard">
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {["Lucro Total", "Total Apostado", "ROI Médio"].map((l, i) => (
                    <div key={i} className="bg-white/5 rounded-xl p-2.5">
                      <p className="text-[9px] text-gray-500 mb-1">{l}</p>
                      <p className="text-sm font-bold text-white">{["R$ 1.240", "R$ 8.500", "14,6%"][i]}</p>
                    </div>
                  ))}
                </div>
                <div className="bg-white/5 rounded-xl p-2.5 h-16 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-[#1e3a8a] mr-2" />
                  <span className="text-[10px] text-gray-500">Gráfico de evolução de lucro</span>
                </div>
              </ScreenMock>

              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">O que você encontra aqui</h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { icon: TrendingUp, label: "Lucro total", desc: "Soma de todos os lucros dos seus perfis" },
                    { icon: BarChart2,  label: "ROI médio",   desc: "Retorno sobre investimento calculado automaticamente" },
                    { icon: Target,     label: "Apostas",     desc: "Total de apostas registradas e taxa de acerto" },
                    { icon: DollarSign, label: "Banca",       desc: "Valor total investido em todas as apostas" },
                  ].map(({ icon: Icon, label, desc }) => (
                    <div key={label} className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Icon className="w-4 h-4 text-[#1e3a8a]" />
                        <span className="text-sm font-medium text-[var(--text-primary)]">{label}</span>
                      </div>
                      <p className="text-xs text-[var(--text-muted)]">{desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              <Tip text="O dashboard mostra dados consolidados de todos os seus perfis. Troque o filtro de período (Dia, Semana, Mês, Ano) para ver resultados em diferentes janelas de tempo." />
            </div>
          )}

          {/* ── PERFIS ── */}
          {active === "perfis" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-[var(--text-primary)] mb-1">Perfis de Apostador</h2>
                <p className="text-sm text-[var(--text-secondary)]">Organize suas apostas separando diferentes estratégias ou bancas.</p>
              </div>

              <ScreenMock title="Perfis" url="/perfis">
                <div className="grid grid-cols-2 gap-2">
                  {["Perfil Principal", "Banca Conservadora"].map((name, i) => (
                    <div key={i} className="bg-white/5 rounded-xl p-2.5">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-7 h-7 rounded-full bg-[#1e3a8a] flex items-center justify-center text-white text-[9px] font-bold">{name[0]}</div>
                        <p className="text-[10px] font-medium text-white truncate">{name}</p>
                      </div>
                      <div className="flex gap-2">
                        <div className="flex-1 bg-black/30 rounded-lg p-1.5 text-center">
                          <p className="text-[8px] text-gray-500">ROI</p>
                          <p className="text-[10px] font-bold text-green-400">{["12%", "8%"][i]}</p>
                        </div>
                        <div className="flex-1 bg-black/30 rounded-lg p-1.5 text-center">
                          <p className="text-[8px] text-gray-500">Apostas</p>
                          <p className="text-[10px] font-bold text-white">{["48", "22"][i]}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <button className="mt-2 w-full bg-[#1e3a8a]/20 border border-[#1e3a8a]/30 rounded-xl py-2 flex items-center justify-center gap-1.5">
                  <PlusCircle className="w-3 h-3 text-[#1e3a8a]" />
                  <span className="text-[10px] text-[#1e3a8a]">Novo perfil</span>
                </button>
              </ScreenMock>

              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">Como criar um perfil</h3>
                <div className="space-y-3">
                  <Step num={1} text='Clique em "Perfis" no menu lateral.' />
                  <Step num={2} text='Clique no botão "+ Novo Perfil" no canto superior direito.' />
                  <Step num={3} text="Preencha o nome do perfil, sobrenome, apelido (opcional) e foto (opcional)." />
                  <Step num={4} text='Clique em "Salvar" — o perfil aparece na lista imediatamente.' />
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">Dentro de um perfil você encontra</h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Casas de apostas", desc: "Adicione e gerencie suas contas em cada bookmaker" },
                    { label: "Apostas",          desc: "Histórico completo de todas as apostas do perfil" },
                    { label: "Estatísticas",     desc: "ROI, lucro, taxa de acerto e evolução da banca" },
                    { label: "Edição",           desc: "Altere nome, foto e configurações do perfil" },
                  ].map(({ label, desc }) => (
                    <div key={label} className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-1.5">
                        <CheckCircle className="w-3.5 h-3.5 text-[#1e3a8a]" />
                        <span className="text-sm font-medium text-[var(--text-primary)]">{label}</span>
                      </div>
                      <p className="text-xs text-[var(--text-muted)]">{desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              <Tip text="Crie perfis separados para estratégias diferentes. Ex: um perfil para surebets, outro para value bets. Assim seus resultados ficam organizados por estratégia." />
            </div>
          )}

          {/* ── CALCULADORA ── */}
          {active === "calculadora" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-[var(--text-primary)] mb-1">Calculadora de Surebet</h2>
                <p className="text-sm text-[var(--text-secondary)]">Calcule apostas 2-way e 3-way para garantir lucro independente do resultado.</p>
              </div>

              <ScreenMock title="Calculadora" url="/calculadora">
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <div className="bg-white/5 rounded-xl p-2.5">
                    <p className="text-[9px] text-gray-500 mb-1">Time A vence — Casa 1</p>
                    <div className="bg-black/30 rounded-lg px-2 py-1 mb-1">
                      <p className="text-[10px] text-white font-mono">Odd: 2.10</p>
                    </div>
                    <div className="bg-black/30 rounded-lg px-2 py-1">
                      <p className="text-[10px] text-white font-mono">Stake: R$ 95,24</p>
                    </div>
                  </div>
                  <div className="bg-white/5 rounded-xl p-2.5">
                    <p className="text-[9px] text-gray-500 mb-1">Time B vence — Casa 2</p>
                    <div className="bg-black/30 rounded-lg px-2 py-1 mb-1">
                      <p className="text-[10px] text-white font-mono">Odd: 2.20</p>
                    </div>
                    <div className="bg-black/30 rounded-lg px-2 py-1">
                      <p className="text-[10px] text-white font-mono">Stake: R$ 90,91</p>
                    </div>
                  </div>
                </div>
                <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-2 text-center">
                  <p className="text-[9px] text-gray-400">Lucro garantido</p>
                  <p className="text-sm font-bold text-green-400">R$ 9,83 · ROI 5,2%</p>
                </div>
              </ScreenMock>

              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">Como usar a calculadora</h3>
                <div className="space-y-3">
                  <Step num={1} text='Escolha o tipo: "2-way" (dois resultados) ou "3-way" (três resultados, ex: futebol com empate).' />
                  <Step num={2} text="Digite as odds de cada resultado em casas de apostas diferentes." />
                  <Step num={3} text="Informe o valor total que deseja investir na surebet." />
                  <Step num={4} text="A calculadora mostra automaticamente quanto apostar em cada odd e o lucro garantido." />
                  <Step num={5} text='Clique em "Registrar apostas" para salvar as entradas diretamente no seu perfil.' />
                </div>
              </div>

              <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-4 space-y-2">
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">O que é uma Surebet?</h3>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                  Surebet (ou arbitragem esportiva) é quando você aposta em todos os resultados possíveis de um evento em casas diferentes, aproveitando divergência de odds, garantindo lucro independente de quem vencer.
                </p>
              </div>

              <Tip text="Quanto menor o ROI calculado, mais comum é encontrar a odd. Surebets acima de 3% de ROI geralmente têm odds que fecham rápido — aja rápido!" />
            </div>
          )}

          {/* ── APOSTAS ── */}
          {active === "apostas" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-[var(--text-primary)] mb-1">Registro de Apostas</h2>
                <p className="text-sm text-[var(--text-secondary)]">Registre e acompanhe todas as suas apostas em um só lugar.</p>
              </div>

              <ScreenMock title="Apostas" url="/apostas">
                <div className="flex gap-2 mb-2">
                  <div className="flex-1 bg-white/5 rounded-lg px-2 py-1 flex items-center gap-1">
                    <Search className="w-3 h-3 text-gray-500" />
                    <span className="text-[9px] text-gray-500">Buscar apostas...</span>
                  </div>
                  <div className="bg-white/5 rounded-lg px-2 py-1 flex items-center gap-1">
                    <Filter className="w-3 h-3 text-gray-500" />
                  </div>
                </div>
                {[
                  { ev: "Flamengo x Corinthians", status: "green", stake: "R$ 95,24", lucro: "+R$ 9,83" },
                  { ev: "Real x Barça", status: "red", stake: "R$ 100,00", lucro: "-R$ 100,00" },
                  { ev: "Djokovic x Alcaraz", status: "yellow", stake: "R$ 80,00", lucro: "Pendente" },
                ].map(({ ev, status, stake, lucro }, i) => (
                  <div key={i} className="bg-white/5 rounded-xl p-2 mb-1.5 flex items-center justify-between">
                    <div>
                      <p className="text-[9px] font-medium text-white">{ev}</p>
                      <p className="text-[8px] text-gray-500">{stake}</p>
                    </div>
                    <div className={`text-[9px] font-bold ${status === "green" ? "text-green-400" : status === "red" ? "text-red-400" : "text-yellow-400"}`}>
                      {lucro}
                    </div>
                  </div>
                ))}
              </ScreenMock>

              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">Como registrar uma aposta</h3>
                <div className="space-y-3">
                  <Step num={1} text='Vá em "Apostas" no menu lateral.' />
                  <Step num={2} text='Clique em "+ Nova Aposta" e selecione o perfil de apostador.' />
                  <Step num={3} text="Preencha: evento, mercado (1x2, Over/Under, etc.), odd, valor apostado e casa de aposta." />
                  <Step num={4} text="Após o resultado, volte e marque como Ganho, Perdido ou Devolvido." />
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">Status das apostas</h3>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "Pendente",   color: "text-yellow-400", bg: "bg-yellow-500/10 border-yellow-500/20", desc: "Aguardando resultado do evento" },
                    { label: "Ganho",      color: "text-green-400",  bg: "bg-green-500/10 border-green-500/20",   desc: "Aposta vencedora, lucro confirmado" },
                    { label: "Perdido",    color: "text-red-400",    bg: "bg-red-500/10 border-red-500/20",       desc: "Aposta perdedora, valor debitado" },
                  ].map(({ label, color, bg, desc }) => (
                    <div key={label} className={`border rounded-xl p-3 ${bg}`}>
                      <p className={`text-sm font-semibold mb-1 ${color}`}>{label}</p>
                      <p className="text-xs text-[var(--text-muted)]">{desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              <Tip text="Registre cada aposta logo após realizá-la, antes de esquecer a odd ou o valor. Quanto mais completo o histórico, mais precisas são as suas estatísticas." />
            </div>
          )}

          {/* ── FINANCEIRO ── */}
          {active === "financeiro" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-[var(--text-primary)] mb-1">Financeiro</h2>
                <p className="text-sm text-[var(--text-secondary)]">Análise completa do seu desempenho financeiro nas apostas.</p>
              </div>

              <ScreenMock title="Financeiro" url="/financeiro">
                <div className="grid grid-cols-4 gap-1.5 mb-2">
                  {[
                    { l: "Depositado", v: "R$ 5.000", c: "text-white" },
                    { l: "Retirado",   v: "R$ 2.500", c: "text-white" },
                    { l: "Lucro",      v: "R$ 1.240", c: "text-green-400" },
                    { l: "ROI",        v: "14,6%",    c: "text-green-400" },
                  ].map(({ l, v, c }) => (
                    <div key={l} className="bg-white/5 rounded-lg p-1.5 text-center">
                      <p className="text-[8px] text-gray-500">{l}</p>
                      <p className={`text-[10px] font-bold ${c}`}>{v}</p>
                    </div>
                  ))}
                </div>
                <div className="bg-white/5 rounded-xl p-2 h-20 flex items-end gap-1 px-3">
                  {[30, 50, 40, 70, 55, 80, 65].map((h, i) => (
                    <div key={i} className="flex-1 bg-[#1e3a8a]/60 rounded-t" style={{ height: `${h}%` }} />
                  ))}
                </div>
              </ScreenMock>

              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">O que você encontra no Financeiro</h3>
                <div className="space-y-2.5">
                  {[
                    { icon: TrendingUp, label: "Evolução da banca",      desc: "Gráfico mostrando o crescimento ou queda do seu saldo ao longo do tempo." },
                    { icon: BarChart2,  label: "Performance por casa",   desc: "Compare seus resultados em cada bookmaker: qual traz mais lucro." },
                    { icon: Target,     label: "Taxa de acerto",         desc: "Percentual de apostas ganhas sobre o total de apostas encerradas." },
                    { icon: Layers,     label: "Filtros avançados",      desc: "Filtre por período (dia, semana, mês, ano), perfil e casa de apostas." },
                  ].map(({ icon: Icon, label, desc }) => (
                    <div key={label} className="flex items-start gap-3 bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-4">
                      <div className="w-8 h-8 bg-[#1e3a8a]/10 rounded-lg flex items-center justify-center shrink-0">
                        <Icon className="w-4 h-4 text-[#1e3a8a]" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[var(--text-primary)] mb-0.5">{label}</p>
                        <p className="text-xs text-[var(--text-muted)]">{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Tip text="Use o filtro por perfil para comparar estratégias diferentes. Se um perfil tem ROI negativo, revise a estratégia antes de continuar." />
            </div>
          )}

          {/* ── ASSINATURA ── */}
          {active === "assinatura" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-[var(--text-primary)] mb-1">Assinatura</h2>
                <p className="text-sm text-[var(--text-secondary)]">Gerencie seu plano e forma de pagamento.</p>
              </div>

              <ScreenMock title="Assinatura" url="/assinatura">
                <div className="bg-white/5 border border-[#1e3a8a]/30 rounded-xl p-3 mb-2">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-[#1e3a8a]" />
                      <span className="text-[10px] font-bold text-white">Plano Pro</span>
                    </div>
                    <span className="text-[9px] bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">Ativa</span>
                  </div>
                  <p className="text-[10px] text-gray-400">Próxima cobrança: <span className="text-white">21/07/2026</span></p>
                </div>
                <div className="bg-white/5 rounded-xl p-2">
                  <p className="text-[9px] text-gray-500 mb-1.5">Detalhes da assinatura</p>
                  {["Status · Ativa", "Plano · Pro R$99/mês", "Próxima cobrança · 21/07"].map((row, i) => (
                    <div key={i} className="flex items-center justify-between py-1 border-b border-white/5 last:border-0">
                      <span className="text-[8px] text-gray-500">{row.split("·")[0]}</span>
                      <span className="text-[8px] text-white">{row.split("·")[1]}</span>
                    </div>
                  ))}
                </div>
              </ScreenMock>

              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">Como assinar</h3>
                <div className="space-y-3">
                  <Step num={1} text='Acesse "Assinatura" no menu lateral.' />
                  <Step num={2} text='Clique em "Assinar agora" para ir à página de pagamento.' />
                  <Step num={3} text="Escolha a forma de pagamento: PIX (aprovação imediata) ou Cartão de crédito/débito." />
                  <Step num={4} text="Para PIX: gere o QR Code, escaneie no banco e aguarde a confirmação automática." />
                  <Step num={5} text="Para cartão: preencha os dados e clique em assinar. A ativação é imediata." />
                </div>
              </div>

              <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-4">
                <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Plano Pro — R$ 99,00/mês</h3>
                <ul className="space-y-2">
                  {[
                    "Perfis ilimitados de apostador",
                    "Casas de apostas ilimitadas por perfil",
                    "Calculadora de surebet 2-way e 3-way",
                    "Dashboard financeiro completo",
                    "Histórico completo de apostas",
                    "Suporte prioritário por ticket",
                  ].map(f => (
                    <li key={f} className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                      <CheckCircle className="w-3.5 h-3.5 text-[#1e3a8a] shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>

              <Tip text="Para cancelar ou tirar dúvidas sobre sua assinatura, abra um ticket no Suporte. Nossa equipe responde em até 24 horas." />
            </div>
          )}

          {/* ── CONFIGURAÇÕES ── */}
          {active === "configuracoes" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-[var(--text-primary)] mb-1">Configurações</h2>
                <p className="text-sm text-[var(--text-secondary)]">Personalize sua conta e preferências da plataforma.</p>
              </div>

              <ScreenMock title="Configurações" url="/configuracoes">
                <div className="space-y-1.5">
                  {[
                    { label: "Meu perfil",    desc: "Nome, foto, e-mail" },
                    { label: "Segurança",     desc: "Alterar senha" },
                    { label: "Aparência",     desc: "Tema claro / escuro" },
                    { label: "Notificações",  desc: "E-mail e alertas" },
                  ].map(({ label, desc }) => (
                    <div key={label} className="bg-white/5 rounded-xl px-3 py-2 flex items-center justify-between">
                      <div>
                        <p className="text-[10px] font-medium text-white">{label}</p>
                        <p className="text-[8px] text-gray-500">{desc}</p>
                      </div>
                      <ArrowRight className="w-3 h-3 text-gray-600" />
                    </div>
                  ))}
                </div>
              </ScreenMock>

              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">O que você pode configurar</h3>
                <div className="space-y-2.5">
                  {[
                    { icon: User,         label: "Meu perfil",   desc: "Atualize seu nome, foto de perfil e endereço de e-mail da conta." },
                    { icon: Settings,     label: "Segurança",    desc: "Altere sua senha de acesso quando necessário." },
                    { icon: Bell,         label: "Notificações", desc: "Escolha quais alertas deseja receber por e-mail." },
                    { icon: MessageSquare,label: "Aparência",    desc: "Alterne entre o tema escuro e claro conforme sua preferência." },
                  ].map(({ icon: Icon, label, desc }) => (
                    <div key={label} className="flex items-start gap-3 bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-4">
                      <div className="w-8 h-8 bg-[#1e3a8a]/10 rounded-lg flex items-center justify-center shrink-0">
                        <Icon className="w-4 h-4 text-[#1e3a8a]" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[var(--text-primary)] mb-0.5">{label}</p>
                        <p className="text-xs text-[var(--text-muted)]">{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Tip text="Mantenha seu e-mail sempre atualizado nas configurações para receber notificações importantes sobre sua assinatura e apostas." />
            </div>
          )}

          {/* ── SUPORTE ── */}
          {active === "suporte" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-[var(--text-primary)] mb-1">Suporte</h2>
                <p className="text-sm text-[var(--text-secondary)]">Entre em contato com nossa equipe para tirar dúvidas ou resolver problemas.</p>
              </div>

              <ScreenMock title="Suporte" url="/suporte">
                <div className="space-y-1.5">
                  {[
                    { assunto: "Erro no cálculo da odd", status: "Aberto",    cor: "text-yellow-400" },
                    { assunto: "Dúvida sobre assinatura", status: "Resolvido", cor: "text-green-400"  },
                  ].map(({ assunto, status, cor }) => (
                    <div key={assunto} className="bg-white/5 rounded-xl p-2.5 flex items-center justify-between">
                      <div>
                        <p className="text-[9px] font-medium text-white">{assunto}</p>
                        <p className="text-[8px] text-gray-500">Atualizado há 2h</p>
                      </div>
                      <span className={`text-[8px] font-medium ${cor}`}>{status}</span>
                    </div>
                  ))}
                  <button className="w-full bg-[#1e3a8a]/20 border border-[#1e3a8a]/30 rounded-xl py-2 text-[9px] text-[#1e3a8a]">
                    + Novo ticket
                  </button>
                </div>
              </ScreenMock>

              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">Como abrir um ticket</h3>
                <div className="space-y-3">
                  <Step num={1} text='Acesse "Suporte" no menu lateral.' />
                  <Step num={2} text='Clique em "+ Novo Ticket".' />
                  <Step num={3} text="Escreva o assunto e descreva seu problema ou dúvida com o máximo de detalhes possível." />
                  <Step num={4} text="Clique em Enviar — nossa equipe responde em até 24 horas úteis." />
                  <Step num={5} text="Acompanhe a resposta clicando no ticket aberto. Você pode responder diretamente no chat do ticket." />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Aberto",    color: "text-yellow-400", bg: "bg-yellow-500/10 border-yellow-500/20", desc: "Aguardando resposta da equipe" },
                  { label: "Resolvido", color: "text-green-400",  bg: "bg-green-500/10 border-green-500/20",  desc: "Problema solucionado com sucesso" },
                ].map(({ label, color, bg, desc }) => (
                  <div key={label} className={`border rounded-xl p-3 ${bg}`}>
                    <p className={`text-sm font-semibold mb-1 ${color}`}>{label}</p>
                    <p className="text-xs text-[var(--text-muted)]">{desc}</p>
                  </div>
                ))}
              </div>

              <Tip text="Inclua prints de tela e o máximo de detalhes ao abrir um ticket. Isso agiliza muito a resolução do seu problema." />
            </div>
          )}

          {/* Nav buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-[var(--border)]">
            <button
              onClick={() => {
                const idx = SECTIONS.findIndex(s => s.id === active)
                if (idx > 0) setActive(SECTIONS[idx - 1].id)
              }}
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
              onClick={() => {
                const idx = SECTIONS.findIndex(s => s.id === active)
                if (idx < SECTIONS.length - 1) setActive(SECTIONS[idx + 1].id)
              }}
              disabled={SECTIONS[SECTIONS.length - 1].id === active}
              className="flex items-center gap-2 text-sm text-[#1e3a8a] hover:text-[#1e40af] disabled:opacity-30 transition-colors font-medium"
            >
              Próximo
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
