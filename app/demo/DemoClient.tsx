"use client"

import Link from "next/link"
import { useState, useId } from "react"
import {
  DollarSign, TrendingUp, Clock, ArrowUpRight, ClipboardList, Wallet,
  ChevronRight, Target, CheckCircle2, Calculator, BarChart3, FileText,
  Home, X, Plus, AlertTriangle, Play, Sparkles, Check,
} from "lucide-react"
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar,
} from "recharts"

// ─── TYPES ───────────────────────────────────────────────────────────────────

type Profile = {
  id: string; apelido: string
}
type Bet = {
  id: string; profileId: string; nome: string; saldo: number
}
type Movimentacao = {
  id: string; profileId: string; betId: string; betNome: string
  tipo: "deposito" | "saque" | "lucro"; valor: number; date: string
}
type ApostaLeg = {
  betId: string; betNome: string; resultado: string; odd: number; stake: number
}
type Aposta = {
  id: string; profileId: string; evento: string; esporte: string
  competicao: string; tipo: string; investimento: number
  lucro: number; roi: number; status: "pendente" | "finalizada"
  legs: ApostaLeg[]
}

// ─── INITIAL MOCK DATA ───────────────────────────────────────────────────────

const INIT_PROFILES: Profile[] = [
  { id: "p1", apelido: "Banca Principal" },
  { id: "p2", apelido: "Banca Teste" },
]

const INIT_BETS: Bet[] = [
  { id: "b1", profileId: "p1", nome: "Bet365",   saldo: 2100 },
  { id: "b2", profileId: "p1", nome: "Betano",   saldo: 1840 },
  { id: "b3", profileId: "p1", nome: "KTO",      saldo: 900 },
  { id: "b4", profileId: "p2", nome: "Superbet", saldo: 950 },
]

const INIT_MOVS: Movimentacao[] = [
  { id: "m1", profileId: "p1", betId: "b1", betNome: "Bet365",  tipo: "deposito", valor: 2100, date: "01/06" },
  { id: "m2", profileId: "p1", betId: "b2", betNome: "Betano",  tipo: "deposito", valor: 1840, date: "02/06" },
  { id: "m3", profileId: "p1", betId: "b3", betNome: "KTO",     tipo: "deposito", valor: 900,  date: "03/06" },
  { id: "m4", profileId: "p2", betId: "b4", betNome: "Superbet",tipo: "deposito", valor: 950,  date: "04/06" },
]

const INIT_APOSTAS: Aposta[] = [
  {
    id: "a1", profileId: "p1", evento: "Flamengo x Corinthians",
    esporte: "Futebol", competicao: "Brasileirão", tipo: "2-way",
    investimento: 600, lucro: 34.80, roi: 5.8, status: "finalizada",
    legs: [
      { betId: "b1", betNome: "Bet365", resultado: "Flamengo",            odd: 2.15, stake: 280 },
      { betId: "b2", betNome: "Betano", resultado: "Corinthians ou Empate",odd: 2.05, stake: 320 },
    ],
  },
  {
    id: "a2", profileId: "p1", evento: "Djokovic x Alcaraz",
    esporte: "Tênis", competicao: "Roland Garros", tipo: "2-way",
    investimento: 400, lucro: 22.40, roi: 5.6, status: "pendente",
    legs: [
      { betId: "b2", betNome: "Betano", resultado: "Djokovic", odd: 2.10, stake: 195 },
      { betId: "b3", betNome: "KTO",    resultado: "Alcaraz",  odd: 2.08, stake: 205 },
    ],
  },
]

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function fmt(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

function uid() {
  return Math.random().toString(36).slice(2, 9)
}

function today() {
  return new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })
}

function StatusBadge({ status }: { status: string }) {
  if (status === "finalizada")
    return <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-green-500/15 text-green-400">Finalizada</span>
  return <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-yellow-500/15 text-yellow-400">Pendente</span>
}

// ─── MODAL WRAPPER ───────────────────────────────────────────────────────────

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70" onClick={onClose}>
      <div className="w-full max-w-md bg-[#1e293b] border border-white/10 rounded-2xl p-6 space-y-5" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-white">{title}</h3>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors"><X className="w-4 h-4" /></button>
        </div>
        {children}
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs text-white/50 uppercase tracking-wide">{label}</label>
      {children}
    </div>
  )
}

function DemoInput({ value, onChange, placeholder, type = "text" }: {
  value: string; onChange: (v: string) => void; placeholder?: string; type?: string
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50"
    />
  )
}

function DemoSelect({ value, onChange, children }: {
  value: string; onChange: (v: string) => void; children: React.ReactNode
}) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500/50"
    >
      {children}
    </select>
  )
}

function SaveBtn({ onClick, disabled, children }: { onClick: () => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full py-2.5 rounded-xl bg-[#1e3a8a] hover:bg-[#1e40af] disabled:opacity-40 text-white text-sm font-semibold transition-colors"
    >
      {children}
    </button>
  )
}

// ─── NAV ─────────────────────────────────────────────────────────────────────

const NAV = [
  { id: "dashboard",   label: "Painel",       icon: Home },
  { id: "perfis",      label: "Perfis",        icon: BarChart3 },
  { id: "apostas",     label: "Apostas",       icon: FileText },
  { id: "financeiro",  label: "Financeiro",    icon: Wallet },
  { id: "calculadora", label: "Calculadora",   icon: Calculator },
]

// ─── CALCULADORA ─────────────────────────────────────────────────────────────

function Calculadora({
  profiles, bets, onSave,
}: {
  profiles: Profile[]
  bets: Bet[]
  onSave: (a: Omit<Aposta, "id">) => void
}) {
  const [evento, setEvento] = useState("")
  const [esporte, setEsporte] = useState("Futebol")
  const [competicao, setCompeticao] = useState("")
  const [inv, setInv] = useState("")
  const [profileId, setProfileId] = useState(profiles[0]?.id ?? "")
  const [legs, setLegs] = useState([
    { betId: "", resultado: "", odd: "" },
    { betId: "", resultado: "", odd: "" },
  ])
  const [numLegs, setNumLegs] = useState(2)
  const [saved, setSaved] = useState(false)

  const investment = parseFloat(inv.replace(/\./g, "").replace(",", ".")) || 0
  const odds = legs.slice(0, numLegs).map(l => parseFloat(l.odd) || 0)
  const probs = odds.map(o => o > 0 ? 1 / o : 0)
  const sumProbs = probs.reduce((a, b) => a + b, 0)
  const isArb = sumProbs > 0 && sumProbs < 1
  const stakes = isArb && investment > 0
    ? probs.map((p, i) => i < numLegs - 1 ? Math.round((p / sumProbs) * investment * 100) / 100 : 0)
      .map((s, i, arr) => i < numLegs - 1 ? s : parseFloat((investment - arr.slice(0, -1).reduce((a, b) => a + b, 0)).toFixed(2)))
    : probs.map(() => 0)
  const payouts = stakes.map((s, i) => s * (odds[i] || 0))
  const guaranteed = isArb && stakes[0] > 0 ? Math.min(...payouts.filter(p => p > 0)) : 0
  const lucro = guaranteed - investment
  const roi = investment > 0 && isArb ? (lucro / investment) * 100 : 0

  const profileBets = bets.filter(b => b.profileId === profileId)
  const usedBetIds = legs.slice(0, numLegs).map(l => l.betId).filter(Boolean)

  function updateLeg(i: number, field: string, value: string) {
    setLegs(prev => prev.map((l, idx) => idx === i ? { ...l, [field]: value } : l))
  }

  function handleSave() {
    if (!evento.trim() || !isArb) return
    const legsData: ApostaLeg[] = legs.slice(0, numLegs).map((l, i) => {
      const bet = bets.find(b => b.id === l.betId)
      return { betId: l.betId, betNome: bet?.nome ?? "—", resultado: l.resultado, odd: parseFloat(l.odd) || 0, stake: stakes[i] }
    })
    onSave({
      profileId, evento: evento.trim(), esporte, competicao: competicao.trim(),
      tipo: numLegs >= 3 ? "3-way" : "2-way",
      investimento: investment, lucro: parseFloat(lucro.toFixed(2)),
      roi: parseFloat(roi.toFixed(2)), status: "pendente", legs: legsData,
    })
    setSaved(true)
    setTimeout(() => {
      setSaved(false)
      setEvento(""); setCompeticao(""); setInv("")
      setLegs([{ betId: "", resultado: "", odd: "" }, { betId: "", resultado: "", odd: "" }])
    }, 1500)
  }

  return (
    <div className="max-w-lg space-y-5">
      <div>
        <h1 className="text-xl font-bold text-white">Calculadora de Surebet</h1>
        <p className="text-white/40 text-sm mt-0.5">Calcule e registre sua arbitragem</p>
      </div>

      {/* Evento */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
        <p className="text-xs font-semibold text-white/50 uppercase tracking-wide">Informações do evento</p>
        <Field label="Evento">
          <DemoInput value={evento} onChange={setEvento} placeholder="Ex: Flamengo x Corinthians" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Competição">
            <DemoInput value={competicao} onChange={setCompeticao} placeholder="Ex: Brasileirão" />
          </Field>
          <Field label="Esporte">
            <DemoSelect value={esporte} onChange={setEsporte}>
              {["Futebol","Tênis","Basquete","Vôlei","MMA/UFC","Outros"].map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </DemoSelect>
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Perfil">
            <DemoSelect value={profileId} onChange={setProfileId}>
              {profiles.map(p => <option key={p.id} value={p.id}>{p.apelido}</option>)}
            </DemoSelect>
          </Field>
          <Field label="Investimento (R$)">
            <DemoInput value={inv} onChange={setInv} placeholder="600,00" />
          </Field>
        </div>
      </div>

      {/* Legs */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-white/50 uppercase tracking-wide">{numLegs === 2 ? "2 apostas (2-way)" : "3 apostas (3-way)"}</p>
          {numLegs === 2
            ? <button onClick={() => { setNumLegs(3); setLegs(prev => [...prev, { betId: "", resultado: "", odd: "" }]) }} className="text-xs text-blue-400 hover:underline flex items-center gap-1"><Plus className="w-3 h-3" />3ª aposta</button>
            : <button onClick={() => { setNumLegs(2); setLegs(prev => prev.slice(0, 2)) }} className="text-xs text-red-400 hover:underline flex items-center gap-1"><X className="w-3 h-3" />Remover 3ª</button>
          }
        </div>
        {legs.slice(0, numLegs).map((leg, i) => (
          <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
            <p className="text-xs font-semibold text-white/60">Aposta {i + 1}</p>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Casa de Apostas">
                <DemoSelect value={leg.betId} onChange={v => updateLeg(i, "betId", v)}>
                  <option value="">Selecionar...</option>
                  {profileBets.filter(b => !usedBetIds.includes(b.id) || b.id === leg.betId).map(b => (
                    <option key={b.id} value={b.id}>{b.nome}</option>
                  ))}
                </DemoSelect>
              </Field>
              <Field label="Resultado Apostado">
                <DemoInput value={leg.resultado} onChange={v => updateLeg(i, "resultado", v)} placeholder={["Casa","Visitante","Empate"][i] ?? "Resultado"} />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Odd">
                <DemoInput value={leg.odd} onChange={v => updateLeg(i, "odd", v)} placeholder="2.15" />
              </Field>
              <Field label="Stake calculada">
                <div className="w-full bg-white/5 border border-white/5 rounded-lg px-3 py-2.5 text-sm font-semibold text-blue-300">
                  {stakes[i] > 0 ? fmt(stakes[i]) : "—"}
                </div>
              </Field>
            </div>
          </div>
        ))}
      </div>

      {/* Result */}
      <div className={`rounded-xl p-4 border ${isArb ? "border-green-500/30 bg-green-500/10" : sumProbs > 0 ? "border-red-500/20 bg-red-500/5" : "border-white/10 bg-white/5"}`}>
        {isArb ? (
          <div className="grid grid-cols-3 gap-3 text-center">
            <div><p className="text-[10px] text-white/50 mb-1">Retorno</p><p className="text-sm font-bold text-white">{fmt(guaranteed)}</p></div>
            <div><p className="text-[10px] text-white/50 mb-1">Lucro</p><p className="text-sm font-bold text-green-400">{fmt(lucro)}</p></div>
            <div><p className="text-[10px] text-white/50 mb-1">ROI</p><p className="text-sm font-bold text-purple-400">{roi.toFixed(2)}%</p></div>
          </div>
        ) : sumProbs > 0 ? (
          <p className="text-sm text-red-400 text-center font-medium">Sem arbitragem ({(sumProbs * 100).toFixed(1)}%) — tente outras odds</p>
        ) : (
          <p className="text-sm text-white/30 text-center">Preencha as odds para calcular</p>
        )}
      </div>

      {saved ? (
        <div className="flex items-center justify-center gap-2 py-3 rounded-xl bg-green-500/20 border border-green-500/30 text-green-400 text-sm font-semibold">
          <Check className="w-4 h-4" /> Aposta registrada!
        </div>
      ) : (
        <SaveBtn onClick={handleSave} disabled={!isArb || !evento.trim()}>
          Registrar Aposta
        </SaveBtn>
      )}
    </div>
  )
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────

export default function DemoClient() {
  const [tab, setTab] = useState("dashboard")
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // ── State (resets on reload) ──
  const [profiles, setProfiles] = useState<Profile[]>(INIT_PROFILES)
  const [bets, setBets] = useState<Bet[]>(INIT_BETS)
  const [movs, setMovs] = useState<Movimentacao[]>(INIT_MOVS)
  const [apostas, setApostas] = useState<Aposta[]>(INIT_APOSTAS)

  // ── Modals ──
  const [modalPerfil, setModalPerfil] = useState(false)
  const [modalBet, setModalBet] = useState<string | null>(null)       // profileId
  const [modalMov, setModalMov] = useState<string | null>(null)        // profileId
  const [modalAposta, setModalAposta] = useState<string | null>(null)  // aposta id para finalizar

  // ── Form states ──
  const [newPerfil, setNewPerfil] = useState("")
  const [newBetNome, setNewBetNome] = useState("")
  const [newBetSaldo, setNewBetSaldo] = useState("")
  const [newBetProfileId, setNewBetProfileId] = useState("")
  const [movTipo, setMovTipo] = useState<"deposito" | "saque">("deposito")
  const [movValor, setMovValor] = useState("")
  const [movBetId, setMovBetId] = useState("")

  // ── Computed stats ──
  function profileSaldo(pid: string) {
    return bets.filter(b => b.profileId === pid).reduce((s, b) => s + b.saldo, 0)
  }
  function profileLucro(pid: string) {
    return apostas.filter(a => a.profileId === pid && a.status === "finalizada").reduce((s, a) => s + a.lucro, 0)
  }
  function profileRoi(pid: string) {
    const fins = apostas.filter(a => a.profileId === pid && a.status === "finalizada")
    if (!fins.length) return 0
    const inv = fins.reduce((s, a) => s + a.investimento, 0)
    const luc = fins.reduce((s, a) => s + a.lucro, 0)
    return inv > 0 ? (luc / inv) * 100 : 0
  }
  function profileApostas(pid: string) {
    return apostas.filter(a => a.profileId === pid).length
  }

  const totalSaldo = profiles.reduce((s, p) => s + profileSaldo(p.id), 0)
  const totalLucro = profiles.reduce((s, p) => s + profileLucro(p.id), 0)
  const lucroP = apostas.filter(a => a.status === "pendente").reduce((s, a) => s + a.lucro, 0)
  const roiMedio = (() => {
    const fins = apostas.filter(a => a.status === "finalizada")
    const inv = fins.reduce((s, a) => s + a.investimento, 0)
    const luc = fins.reduce((s, a) => s + a.lucro, 0)
    return inv > 0 ? (luc / inv) * 100 : 0
  })()
  const pendentes = apostas.filter(a => a.status === "pendente").length
  const finalizadas = apostas.filter(a => a.status === "finalizada").length

  // ── Chart data ──
  let cum = 0
  const chartData = apostas.filter(a => a.status === "finalizada").map(a => {
    cum += a.lucro; return { date: today(), lucro: parseFloat(cum.toFixed(2)) }
  })
  // Add some base data so chart isn't empty initially
  const baseChart = [
    { date: "01/05", lucro: 47 }, { date: "08/05", lucro: 98 }, { date: "15/05", lucro: 167 },
    { date: "22/05", lucro: 210 }, { date: "29/05", lucro: 289 }, ...chartData,
  ]

  // ── Actions ──
  function addPerfil() {
    if (!newPerfil.trim()) return
    setProfiles(p => [...p, { id: uid(), apelido: newPerfil.trim() }])
    setNewPerfil(""); setModalPerfil(false)
  }

  function addBet() {
    const pid = modalBet ?? newBetProfileId
    if (!newBetNome.trim() || !pid) return
    const saldo = parseFloat(newBetSaldo.replace(",", ".")) || 0
    const betId = uid()
    setBets(b => [...b, { id: betId, profileId: pid, nome: newBetNome.trim(), saldo }])
    if (saldo > 0) {
      setMovs(m => [...m, { id: uid(), profileId: pid, betId, betNome: newBetNome.trim(), tipo: "deposito", valor: saldo, date: today() }])
    }
    setNewBetNome(""); setNewBetSaldo(""); setModalBet(null)
  }

  function addMov() {
    const pid = modalMov!
    const val = parseFloat(movValor.replace(",", ".")) || 0
    if (!movBetId || val <= 0) return
    const bet = bets.find(b => b.id === movBetId)
    if (!bet) return
    const delta = movTipo === "deposito" ? val : -val
    setBets(bs => bs.map(b => b.id === movBetId ? { ...b, saldo: Math.max(0, b.saldo + delta) } : b))
    setMovs(m => [...m, { id: uid(), profileId: pid, betId: movBetId, betNome: bet.nome, tipo: movTipo, valor: val, date: today() }])
    setMovValor(""); setMovBetId(""); setModalMov(null)
  }

  function addAposta(a: Omit<Aposta, "id">) {
    const id = uid()
    setApostas(prev => [{ id, ...a }, ...prev])
    // deduct stakes from bets
    a.legs.forEach(leg => {
      if (leg.betId) setBets(bs => bs.map(b => b.id === leg.betId ? { ...b, saldo: Math.max(0, b.saldo - leg.stake) } : b))
    })
    setTab("apostas")
  }

  function finalizarAposta(id: string) {
    setApostas(prev => prev.map(a => a.id === id ? { ...a, status: "finalizada" } : a))
    // add lucro to first leg's bet
    const ap = apostas.find(a => a.id === id)
    if (ap && ap.legs[0]?.betId) {
      setBets(bs => bs.map(b => b.id === ap.legs[0].betId ? { ...b, saldo: b.saldo + ap.investimento + ap.lucro } : b))
      setMovs(m => [...m, { id: uid(), profileId: ap.profileId, betId: ap.legs[0].betId, betNome: ap.legs[0].betNome, tipo: "lucro", valor: ap.lucro, date: today() }])
    }
    setModalAposta(null)
  }

  const summaryStats = [
    { label: "Saldo Total",    value: fmt(totalSaldo),  icon: DollarSign,   color: "text-blue-400",   bg: "bg-blue-500/10",   border: "border-blue-500/20" },
    { label: "Lucro",          value: fmt(totalLucro),  icon: TrendingUp,   color: "text-green-400",  bg: "bg-green-500/10",  border: "border-green-500/20" },
    { label: "Lucro Pendente", value: fmt(lucroP),      icon: Clock,        color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/20" },
    { label: "ROI Médio",      value: `${roiMedio.toFixed(2)}%`, icon: ArrowUpRight, color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/20" },
  ]
  const apostasStats = [
    { label: "Total",      value: String(apostas.length), icon: ClipboardList, color: "text-white",      bg: "bg-white/10",      border: "border-white/10" },
    { label: "Finalizadas",value: String(finalizadas),    icon: CheckCircle2,  color: "text-green-400",  bg: "bg-green-500/10",  border: "border-green-500/20" },
    { label: "Pendentes",  value: String(pendentes),      icon: Clock,         color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/20" },
    { label: "ROI Médio",  value: `${roiMedio.toFixed(1)}%`, icon: Target,    color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/20" },
  ]

  return (
    <div className="min-h-screen bg-[#0f172a] text-white flex flex-col">

      {/* Demo Banner */}
      <div className="bg-amber-500 text-amber-950 py-2.5 px-4 flex items-center justify-center gap-3 flex-shrink-0 flex-wrap">
        <div className="flex items-center gap-2 font-semibold text-sm">
          <Play className="w-4 h-4 fill-amber-950" />
          MODO DEMO
        </div>
        <span className="text-xs font-medium">Você está visualizando o painel em modo demonstração. Os dados são fictícios e serão apagados ao recarregar a página.</span>
        <Link href="/cadastro" className="bg-amber-950 text-amber-400 text-xs font-bold px-3 py-1 rounded-full hover:bg-amber-900 transition-colors whitespace-nowrap">
          Criar conta grátis →
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
            <img src="https://gkkuttabavwxjuibmrnr.supabase.co/storage/v1/object/public/logos/SUREBETFLOW%20LOGOSS%20DARK.png" alt="SurebetFlow" className="h-7 w-auto" />
          </div>
          <nav className="flex-1 p-3 space-y-0.5">
            {NAV.map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => { setTab(id); setSidebarOpen(false) }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${tab === id ? "bg-[#1e3a8a] text-white" : "text-white/50 hover:text-white hover:bg-white/5"}`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />{label}
              </button>
            ))}
          </nav>
          <div className="p-3 border-t border-white/5 space-y-2">
            <Link href="/cadastro" className="block w-full text-center py-2 rounded-lg bg-[#1e3a8a] hover:bg-[#1e40af] text-white text-xs font-semibold transition-colors">Criar conta grátis</Link>
            <Link href="/" className="block w-full text-center py-2 rounded-lg border border-white/10 text-white/50 hover:text-white text-xs transition-colors">Voltar ao site</Link>
          </div>
        </aside>

        {sidebarOpen && <div className="fixed inset-0 z-30 bg-black/60 md:hidden" onClick={() => setSidebarOpen(false)} />}

        {/* Main */}
        <main className="flex-1 overflow-y-auto">
          <div className="md:hidden flex items-center justify-between px-4 py-3 border-b border-white/5 bg-[#0a1628]">
            <button onClick={() => setSidebarOpen(true)} className="text-white/60 hover:text-white">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <span className="text-sm font-semibold">{NAV.find(n => n.id === tab)?.label}</span>
            <div className="w-5" />
          </div>

          <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6">

            {/* ── DASHBOARD ── */}
            {tab === "dashboard" && (<>
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-xl font-bold text-white">Painel Geral</h1>
                  <p className="text-white/40 text-sm">Visão consolidada de todos os perfis</p>
                </div>
                <button onClick={() => setTab("calculadora")} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#1e3a8a] hover:bg-[#1e40af] text-white text-xs font-semibold transition-colors">
                  <Calculator className="w-3.5 h-3.5" />Nova aposta
                </button>
              </div>

              {pendentes > 0 && (
                <div className="flex items-center gap-3 rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-3.5">
                  <AlertTriangle className="h-4 w-4 text-yellow-400 flex-shrink-0" />
                  <p className="text-xs text-yellow-300 font-medium flex-1">Você tem {pendentes} aposta{pendentes > 1 ? "s" : ""} pendente{pendentes > 1 ? "s" : ""}.</p>
                  <button onClick={() => setTab("apostas")} className="text-xs text-yellow-300 underline">Ver →</button>
                </div>
              )}

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {summaryStats.map(({ label, value, icon: Icon, color, bg, border }) => (
                  <div key={label} className={`rounded-xl border ${border} bg-white/5 p-4`}>
                    <div className="flex items-center gap-2">
                      <div className={`p-2 ${bg} rounded-lg flex-shrink-0`}><Icon className={`h-4 w-4 ${color}`} /></div>
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
                      <div className={`p-2 ${bg} rounded-lg flex-shrink-0`}><Icon className={`h-4 w-4 ${color}`} /></div>
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
                  <h2 className="text-xs font-semibold text-white uppercase tracking-wide mb-4">Lucro Acumulado</h2>
                  <ResponsiveContainer width="100%" height={180}>
                    <LineChart data={baseChart}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="date" tick={{ fontSize: 9, fill: "rgba(255,255,255,0.3)" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 9, fill: "rgba(255,255,255,0.3)" }} axisLine={false} tickLine={false} tickFormatter={v => `R$${v}`} />
                      <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "#fff" }} formatter={(v: unknown) => [fmt(v as number), "Lucro"]} />
                      <Line type="monotone" dataKey="lucro" stroke="#3b82f6" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-5 flex flex-col">
                  <h2 className="text-xs font-semibold text-white uppercase tracking-wide mb-4">Resumo</h2>
                  <div className="flex-1 space-y-2.5">
                    {[
                      { label: "Saldo Total",    value: fmt(totalSaldo), cls: "text-blue-400" },
                      { label: "Lucro Realizado", value: fmt(totalLucro), cls: "text-green-400" },
                      { label: "Lucro Pendente",  value: fmt(lucroP),    cls: "text-yellow-400" },
                      { label: "Total Apostas",   value: String(apostas.length), cls: "text-white" },
                    ].map(({ label, value, cls }) => (
                      <div key={label} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                        <span className="text-xs text-white/40">{label}</span>
                        <span className={`text-xs font-semibold ${cls}`}>{value}</span>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => setTab("financeiro")} className="mt-4 flex items-center justify-center gap-2 w-full py-2.5 rounded-lg border border-blue-500/30 text-blue-400 text-xs font-medium hover:bg-blue-500/10 transition-colors">
                    <Wallet className="w-3.5 h-3.5" />Ver Financeiro
                  </button>
                </div>
              </div>

              {/* Perfis mini */}
              {profiles.length > 0 && (
                <div className="rounded-xl border border-white/10 bg-white/5 p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xs font-semibold text-white uppercase tracking-wide">Perfis</h2>
                    <button onClick={() => setTab("perfis")} className="text-xs text-blue-400 hover:underline flex items-center gap-1">Ver todos <ChevronRight className="w-3 h-3" /></button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {profiles.map(p => (
                      <div key={p.id} className="flex flex-col gap-3 p-4 rounded-xl border border-white/5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-bold text-blue-300">{p.apelido.charAt(0)}</span>
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-white">{p.apelido}</p>
                            <p className="text-[10px] text-white/40">{profileApostas(p.id)} apostas</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-1 pt-2 border-t border-white/5">
                          <div><p className="text-[9px] text-white/30 uppercase">Saldo</p><p className="text-[11px] font-bold text-blue-400">{fmt(profileSaldo(p.id))}</p></div>
                          <div><p className="text-[9px] text-white/30 uppercase">Lucro</p><p className="text-[11px] font-bold text-green-400">{fmt(profileLucro(p.id))}</p></div>
                          <div><p className="text-[9px] text-white/30 uppercase">ROI</p><p className="text-[11px] font-bold text-purple-400">{profileRoi(p.id).toFixed(1)}%</p></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Apostas recentes */}
              <div>
                <h2 className="text-xs font-semibold text-white uppercase tracking-wide mb-3">Apostas Recentes</h2>
                {apostas.length === 0 ? (
                  <div className="rounded-xl border border-white/10 bg-white/5 p-10 text-center text-white/30 text-sm">Nenhuma aposta registrada</div>
                ) : (
                  <div className="space-y-2">
                    {apostas.slice(0, 3).map(a => (
                      <div key={a.id} className="rounded-xl border border-white/10 bg-white/5 p-4 flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-0.5">
                            <p className="text-sm font-semibold text-white truncate">{a.evento}</p>
                            <StatusBadge status={a.status} />
                          </div>
                          <p className="text-[10px] text-white/40">{a.esporte} · {a.competicao} · {a.tipo.toUpperCase()}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-sm font-bold text-green-400">+{fmt(a.lucro)}</p>
                          <p className="text-[10px] text-purple-400">ROI {a.roi}%</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>)}

            {/* ── PERFIS ── */}
            {tab === "perfis" && (<>
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-xl font-bold text-white">Perfis</h1>
                  <p className="text-white/40 text-sm">Organize suas bancas por estratégia</p>
                </div>
                <button onClick={() => setModalPerfil(true)} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#1e3a8a] hover:bg-[#1e40af] text-white text-xs font-semibold transition-colors">
                  <Plus className="w-3.5 h-3.5" />Novo perfil
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {profiles.map(p => {
                  const profBets = bets.filter(b => b.profileId === p.id)
                  return (
                    <div key={p.id} className="rounded-xl border border-white/10 bg-white/5 p-5 space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                          <span className="text-sm font-bold text-blue-300">{p.apelido.charAt(0)}</span>
                        </div>
                        <div>
                          <p className="font-semibold text-white">{p.apelido}</p>
                          <p className="text-xs text-white/40">{profileApostas(p.id)} apostas · {profBets.length} casas</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2 pt-3 border-t border-white/5 text-center">
                        <div><p className="text-[10px] text-white/30 uppercase mb-1">Saldo</p><p className="text-sm font-bold text-blue-400">{fmt(profileSaldo(p.id))}</p></div>
                        <div><p className="text-[10px] text-white/30 uppercase mb-1">Lucro</p><p className="text-sm font-bold text-green-400">{fmt(profileLucro(p.id))}</p></div>
                        <div><p className="text-[10px] text-white/30 uppercase mb-1">ROI</p><p className="text-sm font-bold text-purple-400">{profileRoi(p.id).toFixed(1)}%</p></div>
                      </div>
                      {/* Bets */}
                      {profBets.length > 0 && (
                        <div className="space-y-1.5 pt-1">
                          {profBets.map(b => (
                            <div key={b.id} className="flex items-center justify-between">
                              <span className="text-xs text-white/50">{b.nome}</span>
                              <span className="text-xs font-semibold text-blue-300">{fmt(b.saldo)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="flex gap-2 pt-1">
                        <button onClick={() => { setModalBet(p.id); setNewBetNome(""); setNewBetSaldo("") }} className="flex-1 text-center py-1.5 rounded-lg border border-white/10 text-white/50 hover:text-white hover:border-white/20 text-xs transition-colors">
                          + Adicionar bet
                        </button>
                        <button onClick={() => { setModalMov(p.id); setMovValor(""); setMovBetId(profBets[0]?.id ?? "") }} className="flex-1 text-center py-1.5 rounded-lg border border-white/10 text-white/50 hover:text-white hover:border-white/20 text-xs transition-colors">
                          + Movimentação
                        </button>
                      </div>
                    </div>
                  )
                })}
                <button onClick={() => setModalPerfil(true)} className="rounded-xl border border-dashed border-white/10 bg-transparent p-5 flex flex-col items-center justify-center gap-2 hover:border-blue-500/40 hover:bg-blue-500/5 transition-colors min-h-[200px]">
                  <div className="w-10 h-10 rounded-full border border-dashed border-white/20 flex items-center justify-center">
                    <span className="text-white/30 text-xl">+</span>
                  </div>
                  <p className="text-xs text-white/30">Criar novo perfil</p>
                </button>
              </div>
            </>)}

            {/* ── APOSTAS ── */}
            {tab === "apostas" && (<>
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-xl font-bold text-white">Apostas</h1>
                  <p className="text-white/40 text-sm">Histórico completo de arbitragens</p>
                </div>
                <button onClick={() => setTab("calculadora")} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#1e3a8a] hover:bg-[#1e40af] text-white text-xs font-semibold transition-colors">
                  <Calculator className="w-3.5 h-3.5" />Nova aposta
                </button>
              </div>
              {apostas.length === 0 ? (
                <div className="rounded-xl border border-white/10 bg-white/5 p-16 text-center">
                  <p className="text-white/30 text-sm mb-3">Nenhuma aposta registrada</p>
                  <button onClick={() => setTab("calculadora")} className="text-xs text-blue-400 hover:underline">Registrar primeira aposta →</button>
                </div>
              ) : (
                <div className="space-y-3">
                  {apostas.map(a => (
                    <div key={a.id} className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <p className="font-semibold text-white">{a.evento}</p>
                            <StatusBadge status={a.status} />
                            <span className="text-[10px] text-white/30 border border-white/10 px-1.5 py-0.5 rounded uppercase">{a.tipo}</span>
                          </div>
                          <p className="text-xs text-white/40">{a.esporte} · {a.competicao} · {profiles.find(p => p.id === a.profileId)?.apelido}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-sm font-bold text-green-400">+{fmt(a.lucro)}</p>
                          <p className="text-xs text-purple-400">ROI {a.roi}%</p>
                          <p className="text-[10px] text-white/30">{fmt(a.investimento)}</p>
                        </div>
                      </div>
                      <div className="flex gap-2 flex-wrap pt-2 border-t border-white/5">
                        {a.legs.map((l, i) => (
                          <div key={i} className="text-[10px] bg-white/5 border border-white/10 rounded-lg px-2 py-1.5">
                            <span className="text-white/50">{l.betNome}</span>
                            <span className="text-white/30 mx-1">·</span>
                            <span className="text-white/70">{l.resultado}</span>
                            <span className="text-white/30 mx-1">@</span>
                            <span className="text-blue-300 font-semibold">{l.odd}</span>
                            <span className="text-white/30 mx-1">·</span>
                            <span className="text-white/50">{fmt(l.stake)}</span>
                          </div>
                        ))}
                      </div>
                      {a.status === "pendente" && (
                        <button onClick={() => setModalAposta(a.id)} className="w-full py-1.5 rounded-lg border border-green-500/30 text-green-400 text-xs font-medium hover:bg-green-500/10 transition-colors">
                          Finalizar aposta
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>)}

            {/* ── FINANCEIRO ── */}
            {tab === "financeiro" && (<>
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-xl font-bold text-white">Financeiro</h1>
                  <p className="text-white/40 text-sm">Saldos, depósitos e saques</p>
                </div>
                <button onClick={() => { setModalMov(profiles[0]?.id ?? null); setMovValor(""); setMovBetId("") }} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#1e3a8a] hover:bg-[#1e40af] text-white text-xs font-semibold transition-colors">
                  <Plus className="w-3.5 h-3.5" />Movimentação
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: "Saldo Total",  value: fmt(totalSaldo),  color: "text-blue-400" },
                  { label: "Total Lucro",  value: fmt(totalLucro),  color: "text-green-400" },
                  { label: "Luc. Pendente",value: fmt(lucroP),     color: "text-yellow-400" },
                  { label: "Total Perfis", value: String(profiles.length), color: "text-white" },
                ].map(({ label, value, color }) => (
                  <div key={label} className="rounded-xl border border-white/10 bg-white/5 p-4">
                    <p className="text-[10px] text-white/40 uppercase mb-1">{label}</p>
                    <p className={`text-sm font-bold ${color}`}>{value}</p>
                  </div>
                ))}
              </div>

              {/* Saldo por bet */}
              <div className="rounded-xl border border-white/10 bg-white/5 p-5">
                <h2 className="text-xs font-semibold text-white uppercase tracking-wide mb-4">Saldo por Casa de Apostas</h2>
                {bets.length === 0 ? (
                  <p className="text-xs text-white/30 text-center py-4">Nenhuma casa cadastrada</p>
                ) : (
                  <div className="space-y-2.5">
                    {bets.map(b => {
                      const profile = profiles.find(p => p.id === b.profileId)
                      const total = bets.filter(x => x.profileId === b.profileId).reduce((s, x) => s + x.saldo, 0)
                      return (
                        <div key={b.id} className="flex items-center gap-3">
                          <div className="w-28 flex-shrink-0">
                            <p className="text-xs text-white/60 truncate">{b.nome}</p>
                            <p className="text-[10px] text-white/30 truncate">{profile?.apelido}</p>
                          </div>
                          <div className="flex-1 bg-white/5 rounded-full h-2 overflow-hidden">
                            <div className="h-full bg-blue-500 rounded-full" style={{ width: total > 0 ? `${Math.min((b.saldo / total) * 100, 100)}%` : "0%" }} />
                          </div>
                          <span className="text-xs font-semibold text-blue-400 w-24 text-right flex-shrink-0">{fmt(b.saldo)}</span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Movimentações */}
              <div className="rounded-xl border border-white/10 bg-white/5 p-5">
                <h2 className="text-xs font-semibold text-white uppercase tracking-wide mb-3">Movimentações Recentes</h2>
                {movs.length === 0 ? (
                  <p className="text-xs text-white/30 text-center py-4">Nenhuma movimentação</p>
                ) : (
                  <div>
                    {[...movs].reverse().slice(0, 10).map(m => {
                      const isIn = m.tipo === "deposito" || m.tipo === "lucro"
                      return (
                        <div key={m.id} className="flex items-center gap-3 py-2.5 border-b border-white/5 last:border-0">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${isIn ? "bg-green-500/15" : "bg-red-500/15"}`}>
                            <span className={`text-xs font-bold ${isIn ? "text-green-400" : "text-red-400"}`}>{isIn ? "+" : "−"}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-white truncate">{m.betNome} · {profiles.find(p => p.id === m.profileId)?.apelido}</p>
                            <p className="text-[10px] text-white/40 capitalize">{m.tipo} · {m.date}</p>
                          </div>
                          <span className={`text-xs font-bold flex-shrink-0 ${isIn ? "text-green-400" : "text-red-400"}`}>
                            {isIn ? "+" : "−"}{fmt(m.valor)}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </>)}

            {/* ── CALCULADORA ── */}
            {tab === "calculadora" && (
              <Calculadora profiles={profiles} bets={bets} onSave={addAposta} />
            )}

            {/* CTA bottom */}
            <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-6 text-center">
              <p className="text-lg font-bold text-white mb-1">Gostou do que viu?</p>
              <p className="text-sm text-white/50 mb-4">Crie sua conta grátis e comece a controlar suas apostas com dados reais.</p>
              <div className="flex items-center justify-center gap-3 flex-wrap">
                <Link href="/cadastro" className="px-6 py-2.5 rounded-xl bg-[#1e3a8a] hover:bg-[#1e40af] text-white text-sm font-semibold transition-colors">Criar conta grátis</Link>
                <Link href="/" className="px-6 py-2.5 rounded-xl border border-white/10 text-white/60 hover:text-white text-sm transition-colors">Ver planos</Link>
              </div>
            </div>

          </div>
        </main>
      </div>

      {/* ── MODAIS ── */}

      {/* Novo Perfil */}
      {modalPerfil && (
        <Modal title="Novo Perfil" onClose={() => setModalPerfil(false)}>
          <Field label="Apelido / Nome da banca">
            <DemoInput value={newPerfil} onChange={setNewPerfil} placeholder="Ex: Banca Principal" />
          </Field>
          <SaveBtn onClick={addPerfil} disabled={!newPerfil.trim()}>Criar perfil</SaveBtn>
        </Modal>
      )}

      {/* Adicionar Bet */}
      {modalBet && (
        <Modal title="Adicionar Casa de Apostas" onClose={() => setModalBet(null)}>
          <Field label="Nome da casa">
            <DemoInput value={newBetNome} onChange={setNewBetNome} placeholder="Ex: Bet365, Betano, KTO..." />
          </Field>
          <Field label="Saldo inicial (R$)">
            <DemoInput value={newBetSaldo} onChange={setNewBetSaldo} placeholder="0,00" />
          </Field>
          <SaveBtn onClick={addBet} disabled={!newBetNome.trim()}>Adicionar bet</SaveBtn>
        </Modal>
      )}

      {/* Nova Movimentação */}
      {modalMov && (
        <Modal title="Nova Movimentação" onClose={() => setModalMov(null)}>
          <Field label="Perfil">
            <DemoSelect value={modalMov ?? ""} onChange={v => { setModalMov(v); setMovBetId("") }}>
              {profiles.map(p => <option key={p.id} value={p.id}>{p.apelido}</option>)}
            </DemoSelect>
          </Field>
          <Field label="Casa de Apostas">
            <DemoSelect value={movBetId} onChange={setMovBetId}>
              <option value="">Selecionar...</option>
              {bets.filter(b => b.profileId === modalMov).map(b => (
                <option key={b.id} value={b.id}>{b.nome} — {fmt(b.saldo)}</option>
              ))}
            </DemoSelect>
          </Field>
          <Field label="Tipo">
            <DemoSelect value={movTipo} onChange={v => setMovTipo(v as "deposito" | "saque")}>
              <option value="deposito">Depósito</option>
              <option value="saque">Saque</option>
            </DemoSelect>
          </Field>
          <Field label="Valor (R$)">
            <DemoInput value={movValor} onChange={setMovValor} placeholder="0,00" />
          </Field>
          <SaveBtn onClick={addMov} disabled={!movBetId || !movValor}>Salvar movimentação</SaveBtn>
        </Modal>
      )}

      {/* Finalizar Aposta */}
      {modalAposta && (() => {
        const ap = apostas.find(a => a.id === modalAposta)
        if (!ap) return null
        return (
          <Modal title="Finalizar Aposta" onClose={() => setModalAposta(null)}>
            <div className="bg-white/5 rounded-xl p-4 space-y-1">
              <p className="text-sm font-semibold text-white">{ap.evento}</p>
              <p className="text-xs text-white/40">{ap.esporte} · {ap.tipo.toUpperCase()}</p>
              <p className="text-sm font-bold text-green-400 pt-1">Lucro previsto: +{fmt(ap.lucro)}</p>
            </div>
            <p className="text-xs text-white/50">Ao finalizar, o lucro será creditado no saldo da primeira casa e a aposta ficará marcada como finalizada.</p>
            <SaveBtn onClick={() => finalizarAposta(ap.id)}>Confirmar finalização</SaveBtn>
          </Modal>
        )
      })()}

    </div>
  )
}
