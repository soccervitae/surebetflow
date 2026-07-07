"use client"

import Link from "next/link"
import { useState } from "react"
import {
  DollarSign, TrendingUp, Clock, ArrowUpRight, ClipboardList, Wallet,
  ChevronRight, Target, CheckCircle2, Calculator, BarChart3, BookOpen,
  Home, LineChart as LineChartIcon, FileText, Settings, X, Sparkles,
  AlertTriangle, Play,
} from "lucide-react"
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar,
} from "recharts"

// ─── MOCK DATA ────────────────────────────────────────────────────────────────

const CHART_DATA = [
  { date: "01/05", lucro: 47.20 },
  { date: "03/05", lucro: 89.50 },
  { date: "05/05", lucro: 124.80 },
  { date: "08/05", lucro: 98.30 },
  { date: "10/05", lucro: 165.40 },
  { date: "12/05", lucro: 210.90 },
  { date: "15/05", lucro: 188.60 },
  { date: "17/05", lucro: 254.20 },
  { date: "20/05", lucro: 312.75 },
  { date: "22/05", lucro: 289.40 },
  { date: "25/05", lucro: 358.90 },
  { date: "28/05", lucro: 412.30 },
  { date: "01/06", lucro: 376.80 },
  { date: "04/06", lucro: 445.20 },
  { date: "07/06", lucro: 498.60 },
]

const BAR_DATA = [
  { mes: "Jan", lucro: 210 },
  { mes: "Fev", lucro: 340 },
  { mes: "Mar", lucro: 285 },
  { mes: "Abr", lucro: 420 },
  { mes: "Mai", lucro: 498 },
  { mes: "Jun", lucro: 180 },
]

const PROFILES = [
  { id: "1", apelido: "Banca Principal", apostas: 38, saldo: 3840.00, lucro: 312.50, roi: 3.8 },
  { id: "2", apelido: "Banca Teste",     apostas: 12, saldo: 950.00,  lucro: 86.20,  roi: 2.9 },
  { id: "3", apelido: "Trader Pro",      apostas: 21, saldo: 2100.00, lucro: 98.80,  roi: 4.1 },
]

const APOSTAS = [
  {
    id: "1",
    evento: "Flamengo x Corinthians",
    esporte: "Futebol",
    competicao: "Brasileirão Série A",
    data_evento: "2024-06-07T21:00:00",
    tipo: "2-way",
    investimento_total: 600,
    lucro_garantido: 34.80,
    roi_percentual: 5.8,
    status: "finalizada",
    legs: [
      { bookmaker: "Bet365", resultado: "Flamengo", odd: 2.15, stake: 280 },
      { bookmaker: "Betano", resultado: "Corinthians ou Empate", odd: 2.05, stake: 320 },
    ],
  },
  {
    id: "2",
    evento: "Novak Djokovic x Carlos Alcaraz",
    esporte: "Tênis",
    competicao: "Roland Garros",
    data_evento: "2024-06-05T14:00:00",
    tipo: "2-way",
    investimento_total: 400,
    lucro_garantido: 22.40,
    roi_percentual: 5.6,
    status: "finalizada",
    legs: [
      { bookmaker: "Superbet", resultado: "Djokovic", odd: 2.10, stake: 195 },
      { bookmaker: "KTO",      resultado: "Alcaraz",  odd: 2.08, stake: 205 },
    ],
  },
  {
    id: "3",
    evento: "Real Madrid x Bayern de Munique",
    esporte: "Futebol",
    competicao: "Champions League",
    data_evento: "2024-06-09T16:00:00",
    tipo: "3-way",
    investimento_total: 750,
    lucro_garantido: 52.50,
    roi_percentual: 7.0,
    status: "pendente",
    legs: [
      { bookmaker: "Bet365",  resultado: "Real Madrid", odd: 2.30, stake: 280 },
      { bookmaker: "Betano",  resultado: "Empate",      odd: 3.40, stake: 185 },
      { bookmaker: "Betfair", resultado: "Bayern",      odd: 2.95, stake: 285 },
    ],
  },
  {
    id: "4",
    evento: "Brasil x Argentina",
    esporte: "Futebol",
    competicao: "Copa América",
    data_evento: "2024-06-04T20:00:00",
    tipo: "2-way",
    investimento_total: 500,
    lucro_garantido: 29.50,
    roi_percentual: 5.9,
    status: "finalizada",
    legs: [
      { bookmaker: "KTO",      resultado: "Brasil",    odd: 2.20, stake: 235 },
      { bookmaker: "Superbet", resultado: "Argentina", odd: 2.18, stake: 265 },
    ],
  },
]

const MOVIMENTACOES = [
  { id: "1", tipo: "deposito",  valor: 1000, bet: "Bet365",  profile: "Banca Principal", date: "07/06" },
  { id: "2", tipo: "lucro",     valor: 34.80, bet: "Betano", profile: "Banca Principal", date: "07/06" },
  { id: "3", tipo: "deposito",  valor: 500,  bet: "Superbet", profile: "Banca Teste",    date: "05/06" },
  { id: "4", tipo: "saque",     valor: 200,  bet: "KTO",     profile: "Trader Pro",      date: "04/06" },
  { id: "5", tipo: "lucro",     valor: 52.50, bet: "Betfair", profile: "Banca Principal", date: "03/06" },
]

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function fmt(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

function StatusBadge({ status }: { status: string }) {
  if (status === "finalizada")
    return <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-green-500/15 text-green-400">Finalizada</span>
  if (status === "cancelada")
    return <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-500/15 text-red-400">Cancelada</span>
  return <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-yellow-500/15 text-yellow-400">Pendente</span>
}

function MovRow({ m }: { m: typeof MOVIMENTACOES[0] }) {
  const isIn = m.tipo === "deposito" || m.tipo === "lucro"
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-white/5 last:border-0">
      <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${isIn ? "bg-green-500/15" : "bg-red-500/15"}`}>
        <span className={`text-xs font-bold ${isIn ? "text-green-400" : "text-red-400"}`}>{isIn ? "+" : "−"}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-white truncate">{m.bet} · {m.profile}</p>
        <p className="text-[10px] text-white/40 capitalize">{m.tipo} · {m.date}</p>
      </div>
      <span className={`text-xs font-bold flex-shrink-0 ${isIn ? "text-green-400" : "text-red-400"}`}>
        {isIn ? "+" : "−"}{fmt(m.valor)}
      </span>
    </div>
  )
}

// ─── SIDEBAR NAV ──────────────────────────────────────────────────────────────

const NAV = [
  { id: "dashboard", label: "Painel", icon: Home },
  { id: "perfis",    label: "Perfis", icon: BarChart3 },
  { id: "apostas",   label: "Apostas", icon: FileText },
  { id: "financeiro", label: "Financeiro", icon: Wallet },
  { id: "calculadora", label: "Calculadora", icon: Calculator },
]

// ─── CALCULADORA DEMO ─────────────────────────────────────────────────────────

function CalculadoraDemo() {
  const [inv, setInv] = useState("600,00")
  const [odd1, setOdd1] = useState("2.15")
  const [odd2, setOdd2] = useState("2.05")

  const investment = parseFloat(inv.replace(/\./g, "").replace(",", ".")) || 0
  const o1 = parseFloat(odd1) || 0
  const o2 = parseFloat(odd2) || 0
  const sum = (o1 > 0 ? 1 / o1 : 0) + (o2 > 0 ? 1 / o2 : 0)
  const isArb = sum > 0 && sum < 1
  const s1 = isArb && investment > 0 ? (1 / o1 / sum) * investment : 0
  const s2 = isArb && investment > 0 ? investment - s1 : 0
  const ret = isArb && s1 > 0 ? Math.min(s1 * o1, s2 * o2) : 0
  const lucro = ret - investment
  const roi = investment > 0 && isArb ? (lucro / investment) * 100 : 0

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-bold text-white">Calculadora de Surebet</h2>
        <p className="text-xs text-white/50 mt-0.5">Simule uma aposta de arbitragem</p>
      </div>

      <div className="bg-white/5 rounded-xl p-4 border border-white/10 space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="w-4 h-4 text-blue-400" />
          <span className="text-xs font-semibold text-blue-300">Preencher com IA</span>
          <span className="text-[10px] text-white/30 ml-auto">Cole print ou texto</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[10px] text-white/50 uppercase">Odd Casa 1</label>
            <input
              value={odd1}
              onChange={e => setOdd1(e.target.value)}
              className="w-full bg-white/10 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500/50"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] text-white/50 uppercase">Odd Casa 2</label>
            <input
              value={odd2}
              onChange={e => setOdd2(e.target.value)}
              className="w-full bg-white/10 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500/50"
            />
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-[10px] text-white/50 uppercase">Investimento Total (R$)</label>
          <input
            value={inv}
            onChange={e => setInv(e.target.value)}
            className="w-full bg-white/10 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500/50"
          />
        </div>
      </div>

      {/* Stakes */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "Stake Casa 1", value: s1 },
          { label: "Stake Casa 2", value: s2 },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white/5 border border-white/10 rounded-xl p-3">
            <p className="text-[10px] text-white/40 uppercase mb-1">{label}</p>
            <p className="text-lg font-bold text-white">{value > 0 ? fmt(value) : "—"}</p>
          </div>
        ))}
      </div>

      {/* Result */}
      <div className={`rounded-xl p-4 border ${isArb ? "border-green-500/30 bg-green-500/10" : "border-red-500/20 bg-red-500/5"}`}>
        {isArb ? (
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-[10px] text-white/50 mb-1">Retorno</p>
              <p className="text-sm font-bold text-white">{fmt(ret)}</p>
            </div>
            <div>
              <p className="text-[10px] text-white/50 mb-1">Lucro</p>
              <p className="text-sm font-bold text-green-400">{fmt(lucro)}</p>
            </div>
            <div>
              <p className="text-[10px] text-white/50 mb-1">ROI</p>
              <p className="text-sm font-bold text-purple-400">{roi.toFixed(2)}%</p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-red-400 text-center font-medium">Sem arbitragem — tente outras odds</p>
        )}
      </div>

      <div className="pt-2">
        <Link href="/cadastro" className="block w-full text-center py-3 rounded-xl bg-[#1e3a8a] hover:bg-[#1e40af] text-white text-sm font-semibold transition-colors">
          Criar conta grátis para salvar apostas →
        </Link>
      </div>
    </div>
  )
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────

export default function DemoClient() {
  const [tab, setTab] = useState("dashboard")
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const summaryStats = [
    { label: "Saldo Total",    value: fmt(6890.00),  icon: DollarSign,  color: "text-blue-400",   bg: "bg-blue-500/10",   border: "border-blue-500/20" },
    { label: "Lucro",          value: fmt(497.50),   icon: TrendingUp,  color: "text-green-400",  bg: "bg-green-500/10",  border: "border-green-500/20" },
    { label: "Lucro Pendente", value: fmt(52.50),    icon: Clock,       color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/20" },
    { label: "ROI Médio",      value: "3.92%",       icon: ArrowUpRight,color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/20" },
  ]

  const apostasStats = [
    { label: "Total Apostas", value: "71",    icon: ClipboardList, color: "text-white",      bg: "bg-white/10",      border: "border-white/10" },
    { label: "Finalizadas",   value: "58",    icon: CheckCircle2,  color: "text-green-400",  bg: "bg-green-500/10",  border: "border-green-500/20" },
    { label: "Pendentes",     value: "13",    icon: Clock,         color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/20" },
    { label: "Taxa de Acerto",value: "91.4%", icon: Target,        color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/20" },
  ]

  return (
    <div className="min-h-screen bg-[#0f172a] text-white flex flex-col">

      {/* Top banner */}
      <div className="bg-[#1e3a8a] text-white text-center text-xs py-2 px-4 flex items-center justify-center gap-2 flex-shrink-0">
        <Play className="w-3 h-3" />
        <span>Você está no modo demonstração — os dados são fictícios.</span>
        <Link href="/cadastro" className="font-semibold underline underline-offset-2 hover:opacity-80 ml-1">
          Criar conta grátis
        </Link>
      </div>

      <div className="flex flex-1 overflow-hidden">

        {/* Sidebar */}
        <aside className={`
          fixed inset-y-0 left-0 z-40 w-56 bg-[#0a1628] border-r border-white/5 flex flex-col transition-transform
          md:relative md:translate-x-0 md:flex-shrink-0
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `} style={{ top: "32px" }}>
          <div className="p-4 border-b border-white/5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://gkkuttabavwxjuibmrnr.supabase.co/storage/v1/object/public/logos/SUREBETFLOW%20LOGOSS%20DARK.png"
              alt="SurebetFlow"
              className="h-7 w-auto"
            />
          </div>
          <nav className="flex-1 p-3 space-y-0.5">
            {NAV.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => { setTab(id); setSidebarOpen(false) }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  tab === id
                    ? "bg-[#1e3a8a] text-white"
                    : "text-white/50 hover:text-white hover:bg-white/5"
                }`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {label}
              </button>
            ))}
          </nav>
          <div className="p-3 border-t border-white/5 space-y-2">
            <Link
              href="/cadastro"
              className="block w-full text-center py-2 rounded-lg bg-[#1e3a8a] hover:bg-[#1e40af] text-white text-xs font-semibold transition-colors"
            >
              Criar conta grátis
            </Link>
            <Link
              href="/"
              className="block w-full text-center py-2 rounded-lg border border-white/10 text-white/50 hover:text-white text-xs transition-colors"
            >
              Voltar ao site
            </Link>
          </div>
        </aside>

        {/* Overlay mobile */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-30 bg-black/60 md:hidden" onClick={() => setSidebarOpen(false)} />
        )}

        {/* Main */}
        <main className="flex-1 overflow-y-auto">
          {/* Mobile header */}
          <div className="md:hidden flex items-center justify-between px-4 py-3 border-b border-white/5 bg-[#0a1628]">
            <button onClick={() => setSidebarOpen(true)} className="text-white/60 hover:text-white">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <span className="text-sm font-semibold text-white">{NAV.find(n => n.id === tab)?.label}</span>
            <div className="w-5" />
          </div>

          <div className="p-4 md:p-6 max-w-5xl mx-auto">

            {/* ── DASHBOARD ── */}
            {tab === "dashboard" && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-xl font-bold text-white">Painel Geral</h1>
                  <p className="text-white/40 text-sm mt-0.5">Visão consolidada de todos os perfis</p>
                </div>

                <div className="flex items-start gap-3 rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-3.5">
                  <AlertTriangle className="h-4 w-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-yellow-300 font-medium">
                    Você tem 2 apostas pendentes há mais de 3 dias. <span className="underline cursor-pointer" onClick={() => setTab("apostas")}>Ver pendentes →</span>
                  </p>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {summaryStats.map(({ label, value, icon: Icon, color, bg, border }) => (
                    <div key={label} className={`rounded-xl border ${border} bg-white/5 p-4`}>
                      <div className="flex items-center gap-2">
                        <div className={`p-2 ${bg} rounded-lg flex-shrink-0`}>
                          <Icon className={`h-4 w-4 ${color}`} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] text-white/40 truncate">{label}</p>
                          <p className={`text-sm font-bold ${color} truncate`}>{value}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {apostasStats.map(({ label, value, icon: Icon, color, bg, border }) => (
                    <div key={label} className={`rounded-xl border ${border} bg-white/5 p-4`}>
                      <div className="flex items-center gap-2">
                        <div className={`p-2 ${bg} rounded-lg flex-shrink-0`}>
                          <Icon className={`h-4 w-4 ${color}`} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] text-white/40 truncate">{label}</p>
                          <p className={`text-sm font-bold ${color} truncate`}>{value}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div className="lg:col-span-2 rounded-xl border border-white/10 bg-white/5 p-5">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xs font-semibold text-white uppercase tracking-wide">Lucro Acumulado</h2>
                      <span className="text-[10px] text-white/30">Apostas finalizadas</span>
                    </div>
                    <ResponsiveContainer width="100%" height={180}>
                      <LineChart data={CHART_DATA}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis dataKey="date" tick={{ fontSize: 9, fill: "rgba(255,255,255,0.3)" }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 9, fill: "rgba(255,255,255,0.3)" }} axisLine={false} tickLine={false} tickFormatter={v => `R$${v}`} />
                        <Tooltip
                          contentStyle={{ backgroundColor: "#1e293b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "#fff" }}
                          formatter={(v: unknown) => [fmt(v as number), "Lucro"]}
                        />
                        <Line type="monotone" dataKey="lucro" stroke="#3b82f6" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-white/5 p-5 flex flex-col">
                    <h2 className="text-xs font-semibold text-white uppercase tracking-wide mb-4">Resumo Financeiro</h2>
                    <div className="flex-1 space-y-2.5">
                      {[
                        { label: "Total Investido", value: fmt(12700), cls: "text-white" },
                        { label: "Lucro Realizado", value: fmt(497.50), cls: "text-green-400" },
                        { label: "Lucro Pendente",  value: fmt(52.50),  cls: "text-yellow-400" },
                        { label: "Total Apostas",   value: "71",        cls: "text-white" },
                      ].map(({ label, value, cls }) => (
                        <div key={label} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                          <span className="text-xs text-white/40">{label}</span>
                          <span className={`text-xs font-semibold ${cls}`}>{value}</span>
                        </div>
                      ))}
                    </div>
                    <button onClick={() => setTab("financeiro")} className="mt-4 flex items-center justify-center gap-2 w-full py-2.5 rounded-lg border border-blue-500/30 text-blue-400 text-xs font-medium hover:bg-blue-500/10 transition-colors">
                      <Wallet className="w-3.5 h-3.5" />
                      Ver Financeiro
                    </button>
                  </div>
                </div>

                {/* Perfis mini */}
                <div className="rounded-xl border border-white/10 bg-white/5 p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xs font-semibold text-white uppercase tracking-wide">Perfis</h2>
                    <button onClick={() => setTab("perfis")} className="text-xs text-blue-400 hover:underline flex items-center gap-1">Ver todos <ChevronRight className="w-3 h-3" /></button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {PROFILES.map(p => (
                      <div key={p.id} className="flex flex-col gap-3 p-4 rounded-xl border border-white/5 hover:border-blue-500/30 transition-colors">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-bold text-blue-300">{p.apelido.charAt(0)}</span>
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-white">{p.apelido}</p>
                            <p className="text-[10px] text-white/40">{p.apostas} apostas</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-1 pt-2 border-t border-white/5">
                          <div>
                            <p className="text-[9px] text-white/30 uppercase">Saldo</p>
                            <p className="text-[11px] font-bold text-blue-400">{fmt(p.saldo)}</p>
                          </div>
                          <div>
                            <p className="text-[9px] text-white/30 uppercase">Lucro</p>
                            <p className="text-[11px] font-bold text-green-400">{fmt(p.lucro)}</p>
                          </div>
                          <div>
                            <p className="text-[9px] text-white/30 uppercase">ROI</p>
                            <p className="text-[11px] font-bold text-purple-400">{p.roi}%</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Apostas recentes */}
                <div>
                  <h2 className="text-xs font-semibold text-white uppercase tracking-wide mb-3">Apostas Recentes</h2>
                  <div className="space-y-2">
                    {APOSTAS.slice(0, 3).map(a => (
                      <div key={a.id} className="rounded-xl border border-white/10 bg-white/5 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-sm font-semibold text-white truncate">{a.evento}</p>
                              <StatusBadge status={a.status} />
                            </div>
                            <p className="text-[10px] text-white/40 mt-0.5">{a.esporte} · {a.competicao} · {a.tipo.toUpperCase()}</p>
                            <div className="flex gap-3 mt-2">
                              {a.legs.map((l, i) => (
                                <span key={i} className="text-[10px] text-white/50">{l.bookmaker}: {l.odd}</span>
                              ))}
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-sm font-bold text-green-400">+{fmt(a.lucro_garantido)}</p>
                            <p className="text-[10px] text-purple-400">ROI {a.roi_percentual}%</p>
                            <p className="text-[10px] text-white/30 mt-0.5">{fmt(a.investimento_total)}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── PERFIS ── */}
            {tab === "perfis" && (
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-xl font-bold text-white">Perfis</h1>
                    <p className="text-white/40 text-sm mt-0.5">Organize suas bancas por estratégia</p>
                  </div>
                  <Link href="/cadastro" className="px-3 py-2 rounded-lg bg-[#1e3a8a] hover:bg-[#1e40af] text-white text-xs font-semibold transition-colors">
                    + Criar perfil
                  </Link>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {PROFILES.map(p => (
                    <div key={p.id} className="rounded-xl border border-white/10 bg-white/5 p-5 space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                          <span className="text-sm font-bold text-blue-300">{p.apelido.charAt(0)}</span>
                        </div>
                        <div>
                          <p className="font-semibold text-white">{p.apelido}</p>
                          <p className="text-xs text-white/40">{p.apostas} apostas registradas</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2 pt-3 border-t border-white/5">
                        <div className="text-center">
                          <p className="text-[10px] text-white/30 uppercase mb-1">Saldo</p>
                          <p className="text-sm font-bold text-blue-400">{fmt(p.saldo)}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-[10px] text-white/30 uppercase mb-1">Lucro</p>
                          <p className="text-sm font-bold text-green-400">{fmt(p.lucro)}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-[10px] text-white/30 uppercase mb-1">ROI</p>
                          <p className="text-sm font-bold text-purple-400">{p.roi}%</p>
                        </div>
                      </div>
                      <Link href="/cadastro" className="block w-full text-center py-2 rounded-lg border border-white/10 text-white/50 hover:text-white hover:border-white/20 text-xs transition-colors">
                        Ver detalhes →
                      </Link>
                    </div>
                  ))}
                  {/* placeholder novo perfil */}
                  <Link href="/cadastro" className="rounded-xl border border-dashed border-white/10 bg-transparent p-5 flex flex-col items-center justify-center gap-2 hover:border-blue-500/40 hover:bg-blue-500/5 transition-colors min-h-[180px]">
                    <div className="w-10 h-10 rounded-full border border-dashed border-white/20 flex items-center justify-center">
                      <span className="text-white/30 text-xl">+</span>
                    </div>
                    <p className="text-xs text-white/30">Criar novo perfil</p>
                  </Link>
                </div>
              </div>
            )}

            {/* ── APOSTAS ── */}
            {tab === "apostas" && (
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-xl font-bold text-white">Apostas</h1>
                    <p className="text-white/40 text-sm mt-0.5">Histórico completo de arbitragens</p>
                  </div>
                  <button onClick={() => setTab("calculadora")} className="px-3 py-2 rounded-lg bg-[#1e3a8a] hover:bg-[#1e40af] text-white text-xs font-semibold transition-colors flex items-center gap-1.5">
                    <Calculator className="w-3.5 h-3.5" />
                    Nova aposta
                  </button>
                </div>

                <div className="flex gap-2 flex-wrap">
                  {["Todas", "Pendentes", "Finalizadas"].map(f => (
                    <button key={f} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${f === "Todas" ? "bg-[#1e3a8a] text-white" : "border border-white/10 text-white/50 hover:text-white"}`}>
                      {f}
                    </button>
                  ))}
                </div>

                <div className="space-y-3">
                  {APOSTAS.map(a => (
                    <div key={a.id} className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <p className="font-semibold text-white">{a.evento}</p>
                            <StatusBadge status={a.status} />
                            <span className="text-[10px] text-white/30 uppercase border border-white/10 px-1.5 py-0.5 rounded">{a.tipo}</span>
                          </div>
                          <p className="text-xs text-white/40">{a.esporte} · {a.competicao}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-sm font-bold text-green-400">+{fmt(a.lucro_garantido)}</p>
                          <p className="text-xs text-purple-400">ROI {a.roi_percentual}%</p>
                        </div>
                      </div>
                      <div className="flex gap-2 flex-wrap pt-2 border-t border-white/5">
                        {a.legs.map((l, i) => (
                          <div key={i} className="text-[10px] bg-white/5 border border-white/10 rounded-lg px-2 py-1.5">
                            <span className="text-white/50">{l.bookmaker}</span>
                            <span className="text-white/30 mx-1">·</span>
                            <span className="text-white/70">{l.resultado}</span>
                            <span className="text-white/30 mx-1">@</span>
                            <span className="text-blue-300 font-semibold">{l.odd}</span>
                            <span className="text-white/30 mx-1">·</span>
                            <span className="text-white/50">{fmt(l.stake)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── FINANCEIRO ── */}
            {tab === "financeiro" && (
              <div className="space-y-5">
                <div>
                  <h1 className="text-xl font-bold text-white">Financeiro</h1>
                  <p className="text-white/40 text-sm mt-0.5">Controle de saldos, depósitos e saques</p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: "Saldo Total",  value: fmt(6890),   color: "text-blue-400" },
                    { label: "Depositado",   value: fmt(13200),  color: "text-white" },
                    { label: "Sacado",       value: fmt(6800),   color: "text-red-400" },
                    { label: "Lucro Total",  value: fmt(497.50), color: "text-green-400" },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="rounded-xl border border-white/10 bg-white/5 p-4">
                      <p className="text-[10px] text-white/40 uppercase mb-1">{label}</p>
                      <p className={`text-sm font-bold ${color}`}>{value}</p>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="rounded-xl border border-white/10 bg-white/5 p-5">
                    <h2 className="text-xs font-semibold text-white uppercase tracking-wide mb-4">Lucro por Mês</h2>
                    <ResponsiveContainer width="100%" height={160}>
                      <BarChart data={BAR_DATA}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis dataKey="mes" tick={{ fontSize: 10, fill: "rgba(255,255,255,0.3)" }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 10, fill: "rgba(255,255,255,0.3)" }} axisLine={false} tickLine={false} tickFormatter={v => `${v}`} />
                        <Tooltip
                          contentStyle={{ backgroundColor: "#1e293b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "#fff" }}
                          formatter={(v: unknown) => [fmt(v as number), "Lucro"]}
                        />
                        <Bar dataKey="lucro" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-white/5 p-5">
                    <h2 className="text-xs font-semibold text-white uppercase tracking-wide mb-3">Movimentações Recentes</h2>
                    <div>
                      {MOVIMENTACOES.map(m => <MovRow key={m.id} m={m} />)}
                    </div>
                  </div>
                </div>

                {/* Saldo por casa */}
                <div className="rounded-xl border border-white/10 bg-white/5 p-5">
                  <h2 className="text-xs font-semibold text-white uppercase tracking-wide mb-4">Saldo por Casa de Apostas</h2>
                  <div className="space-y-2">
                    {[
                      { bet: "Bet365",  saldo: 2100, deposito: 5000 },
                      { bet: "Betano",  saldo: 1840, deposito: 3200 },
                      { bet: "Superbet",saldo: 950,  deposito: 2000 },
                      { bet: "KTO",     saldo: 1200, deposito: 2500 },
                      { bet: "Betfair", saldo: 800,  deposito: 500 },
                    ].map(({ bet, saldo, deposito }) => (
                      <div key={bet} className="flex items-center gap-3">
                        <div className="w-20 flex-shrink-0">
                          <p className="text-xs text-white/60 truncate">{bet}</p>
                        </div>
                        <div className="flex-1 bg-white/5 rounded-full h-2 overflow-hidden">
                          <div
                            className="h-full bg-blue-500 rounded-full"
                            style={{ width: `${Math.min((saldo / deposito) * 100, 100)}%` }}
                          />
                        </div>
                        <span className="text-xs font-semibold text-blue-400 w-24 text-right flex-shrink-0">{fmt(saldo)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── CALCULADORA ── */}
            {tab === "calculadora" && (
              <div className="max-w-md">
                <CalculadoraDemo />
              </div>
            )}

            {/* CTA bottom */}
            <div className="mt-10 rounded-2xl border border-blue-500/20 bg-blue-500/5 p-6 text-center">
              <p className="text-lg font-bold text-white mb-1">Gostou do que viu?</p>
              <p className="text-sm text-white/50 mb-4">Crie sua conta grátis e comece a controlar suas apostas agora.</p>
              <div className="flex items-center justify-center gap-3 flex-wrap">
                <Link href="/cadastro" className="px-6 py-2.5 rounded-xl bg-[#1e3a8a] hover:bg-[#1e40af] text-white text-sm font-semibold transition-colors">
                  Criar conta grátis
                </Link>
                <Link href="/" className="px-6 py-2.5 rounded-xl border border-white/10 text-white/60 hover:text-white text-sm transition-colors">
                  Ver planos
                </Link>
              </div>
            </div>

          </div>
        </main>
      </div>
    </div>
  )
}
