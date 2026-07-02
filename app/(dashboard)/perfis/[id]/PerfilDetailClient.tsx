"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import AddBetToProfile from "@/components/AddBetToProfile"
import { formatCurrency } from "@/lib/utils"
import { useToast } from "@/hooks/useToast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DollarSign, TrendingUp, Clock, ArrowUpRight, Pencil, Calculator, Gift, ArrowDownLeft, Wallet, SlidersHorizontal, X, Check, Filter, ChevronDown, CalendarIcon, BookOpen, Download, Target, CheckCircle2, ClipboardList, ChevronRight } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import SurebetCalculator from "@/components/SurebetCalculator"
import type { Profile, ProfileDashboard, Aposta, ApostaLeg, MovimentacaoFinanceira, ProfileBet } from "@/lib/types"

interface Props {
  profile: Profile
  dashboard: ProfileDashboard | null
  apostas: Aposta[]
  userToken: string
}

function statusBadge(status: string) {
  switch (status) {
    case "finalizada": return <Badge variant="default">Finalizada</Badge>
    case "cancelada": return <Badge variant="destructive">Cancelada</Badge>
    default: return <Badge variant="yellow">Pendente</Badge>
  }
}

export default function PerfilDetailClient({ profile, dashboard, apostas, userToken }: Props) {
  const [currentProfile, setCurrentProfile] = useState(profile)
  const [currentApostas, setCurrentApostas] = useState(apostas)
  const [showCalculadoraSheet, setShowCalculadoraSheet] = useState(false)
  const [showCalculadoraModal, setShowCalculadoraModal] = useState(false)
  const [minBetsAlertOpen, setMinBetsAlertOpen] = useState(false)
  const [finalizarDialog, setFinalizarDialog] = useState<Aposta | null>(null)
  const [periodoFiltro, setPeriodoFiltro] = useState<"dia" | "semana" | "mes" | "ano">("dia")
  const [casaFiltro, setCasaFiltro] = useState<string>("todas")
  const [resultadoReal, setResultadoReal] = useState("")
  const [greenLegId, setGreenLegId] = useState<string | null>(null)
  const [finalizando, setFinalizando] = useState(false)
  // Financeiro tab state
  const [movimentacoes, setMovimentacoes] = useState<MovimentacaoFinanceira[]>([])
  const [movLoaded, setMovLoaded] = useState(false)
  const [profileBetsFinanceiro, setProfileBetsFinanceiro] = useState<(ProfileBet & { bet?: { id: string; nome: string } })[]>([])
  const [finPeriodo, setFinPeriodo] = useState<"hoje" | "semana" | "mes" | "ano" | "todos" | "custom">("todos")
  const [finCustomMode, setFinCustomMode] = useState<"single" | "range">("single")
  const [finCustomDate, setFinCustomDate] = useState("")
  const [finCustomFrom, setFinCustomFrom] = useState("")
  const [finCustomTo, setFinCustomTo] = useState("")
  const [finTipo, setFinTipo] = useState<"todos" | "deposito" | "saque" | "bonus" | "lucro" | "perda">("todos")
  const [finCasa, setFinCasa] = useState("todos")
  const [bonusEntries, setBonusEntries] = useState<{ id: string; profile_bet_id: string | null; valor: number; descricao: string | null; created_at: string; _tipo: "bonus" }[]>([])
  const [finShowForm, setFinShowForm] = useState(false)
  const [finShowFilter, setFinShowFilter] = useState(false)
  const [finFormBet, setFinFormBet] = useState("")
  const [finFormTipo, setFinFormTipo] = useState<"deposito" | "saque" | "bonus" | "lucro" | "perda">("deposito")
  const [finFormValor, setFinFormValor] = useState("")
  const [finFormDescricao, setFinFormDescricao] = useState("")
  const [finSaving, setFinSaving] = useState(false)
  // Apostas tab state
  const [apFilterStatus, setApFilterStatus] = useState("todos")
  const [apFilterPeriod, setApFilterPeriod] = useState<"todos" | "dia" | "semana" | "mes" | "custom">("todos")
  const [apFilterCustomMode, setApFilterCustomMode] = useState<"single" | "range">("single")
  const [apFilterCustomDate, setApFilterCustomDate] = useState("")
  const [apFilterCustomFrom, setApFilterCustomFrom] = useState("")
  const [apFilterCustomTo, setApFilterCustomTo] = useState("")
  const [apFilterEsporte, setApFilterEsporte] = useState("")
  const [apFilterCompeticao, setApFilterCompeticao] = useState("")
  const [apSortBy, setApSortBy] = useState<"data_desc" | "data_asc" | "valor_desc" | "roi_desc">("data_desc")
  const [apShowFilter, setApShowFilter] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  // Real-time subscriptions: sync profile, apostas and movimentacoes across devices
  useEffect(() => {
    const supabase = createClient()

    async function refetchApostas() {
      const { data } = await supabase
        .from("apostas")
        .select("*, legs:aposta_legs(*, profile_bet:profile_bets(*, bet:bets(*)))")
        .eq("profile_id", currentProfile.id)
        .order("created_at", { ascending: false })
      if (data) setCurrentApostas(data)
    }

    async function refetchMovimentacoes() {
      const { data } = await supabase
        .from("movimentacoes_financeiras")
        .select("*")
        .eq("profile_id", currentProfile.id)
        .order("created_at", { ascending: false })
      if (data) setMovimentacoes(data as any)
    }

    const channel = supabase
      .channel(`perfil-detail-${currentProfile.id}`)
      .on("postgres_changes", {
        event: "UPDATE",
        schema: "public",
        table: "profiles",
        filter: `id=eq.${currentProfile.id}`,
      }, (payload) => {
        setCurrentProfile(prev => ({ ...prev, ...payload.new }))
      })
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "apostas",
        filter: `profile_id=eq.${currentProfile.id}`,
      }, refetchApostas)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "aposta_legs",
      }, refetchApostas)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "movimentacoes_financeiras",
        filter: `profile_id=eq.${currentProfile.id}`,
      }, refetchMovimentacoes)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "bonus",
      }, async () => {
        const { data } = await supabase
          .from("bonus")
          .select("*")
          .eq("profile_id", currentProfile.id)
        if (data) setBonusEntries(data.map((b: any) => ({ ...b, _tipo: "bonus" as const })))
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [currentProfile.id])

  function formatBRL(raw: string) {
    const digits = raw.replace(/\D/g, "")
    if (!digits) return ""
    const num = parseInt(digits, 10) / 100
    return num.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  function parseBRL(formatted: string) {
    return parseFloat(formatted.replace(/\./g, "").replace(",", ".")) || 0
  }
  const supabase = createClient()


  async function loadMovimentacoes() {
    const [movRes, betsRes, bonusRes] = await Promise.all([
      supabase
        .from("movimentacoes_financeiras")
        .select("*, profile_bet:profile_bets(*, bet:bets(*))")
        .eq("profile_id", profile.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("profile_bets")
        .select("*, bet:bets(*)")
        .eq("profile_id", profile.id),
      supabase
        .from("bonus")
        .select("*")
        .eq("profile_id", profile.id)
        .order("created_at", { ascending: false }),
    ])
    if (movRes.data) setMovimentacoes(movRes.data as MovimentacaoFinanceira[])
    if (betsRes.data) setProfileBetsFinanceiro(betsRes.data as (ProfileBet & { bet?: { id: string; nome: string } })[])
    if (bonusRes.data) setBonusEntries(bonusRes.data.map(b => ({ ...b, _tipo: "bonus" as const })))
    setMovLoaded(true)
  }

  const nowFin = new Date()
  function applyFinPeriod(date: Date): boolean {
    if (finPeriodo === "hoje") {
      if (date.toDateString() !== nowFin.toDateString()) return false
    } else if (finPeriodo === "semana") {
      const s = new Date(nowFin); s.setDate(nowFin.getDate() - 7)
      if (date < s) return false
    } else if (finPeriodo === "mes") {
      if (date.getMonth() !== nowFin.getMonth() || date.getFullYear() !== nowFin.getFullYear()) return false
    } else if (finPeriodo === "ano") {
      if (date.getFullYear() !== nowFin.getFullYear()) return false
    } else if (finPeriodo === "custom") {
      if (finCustomMode === "single" && finCustomDate) {
        const from = new Date(finCustomDate); from.setHours(0,0,0,0)
        const to = new Date(finCustomDate); to.setHours(23,59,59,999)
        if (date < from || date > to) return false
      } else if (finCustomMode === "range") {
        if (finCustomFrom) { const f = new Date(finCustomFrom); f.setHours(0,0,0,0); if (date < f) return false }
        if (finCustomTo)   { const t = new Date(finCustomTo);   t.setHours(23,59,59,999); if (date > t) return false }
      }
    }
    return true
  }
  const finFiltered = movimentacoes.filter(m => {
    if (!applyFinPeriod(new Date(m.created_at))) return false
    if (finTipo !== "todos" && m.tipo !== finTipo) return false
    if (finCasa !== "todos" && m.profile_bet_id !== finCasa) return false
    return true
  })

  // Filtrar bonus entries
  const bonusFiltered = bonusEntries.filter(b => {
    if (!applyFinPeriod(new Date(b.created_at))) return false
    if (finTipo !== "todos" && finTipo !== "bonus") return false
    if (finCasa !== "todos" && b.profile_bet_id !== finCasa) return false
    return true
  })

  const totalDepositos = finFiltered.filter(m => m.tipo === "deposito").reduce((s, m) => s + m.valor, 0)
  const totalSaques = finFiltered.filter(m => m.tipo === "saque").reduce((s, m) => s + m.valor, 0)
  const totalLucro = finFiltered.filter(m => m.tipo === "lucro").reduce((s, m) => s + m.valor, 0)
  const totalPerda = finFiltered.filter(m => m.tipo === "perda").reduce((s, m) => s + m.valor, 0)
  const totalBonusMov = finFiltered.filter(m => m.tipo === "bonus").reduce((s, m) => s + m.valor, 0)
  const totalBonusTabela = (finTipo === "todos" || finTipo === "bonus") ? bonusFiltered.reduce((s, b) => s + b.valor, 0) : 0
  const totalBonus = totalBonusMov + totalBonusTabela
  const saldoLiquido = totalDepositos + totalLucro - totalSaques - totalPerda

  async function handleFinSave() {
    const valor = parseBRL(finFormValor)
    if (!valor || valor <= 0) {
      toast({ title: "Informe um valor válido", variant: "destructive" })
      return
    }
    setFinSaving(true)

    if (finFormTipo === "bonus") {
      // Inserir na tabela bonus
      const { error } = await supabase.from("bonus").insert({
        profile_id: profile.id,
        profile_bet_id: finFormBet || null,
        valor,
        descricao: finFormDescricao.trim() || null,
      })
      if (error) {
        toast({ title: "Erro ao registrar bônus", variant: "destructive" })
        setFinSaving(false)
        return
      }
      // Atualiza saldo_bonus do profile_bet
      if (finFormBet) {
        const { data: bns } = await supabase.from("bonus").select("valor").eq("profile_bet_id", finFormBet)
        const totalBonus = (bns ?? []).reduce((acc, b) => acc + b.valor, 0)
        await supabase.from("profile_bets").update({ saldo_bonus: totalBonus }).eq("id", finFormBet)
      }
    } else {
      // Inserir em movimentacoes_financeiras
      const { error } = await supabase.from("movimentacoes_financeiras").insert({
        profile_id: profile.id,
        profile_bet_id: finFormBet || null,
        tipo: finFormTipo,
        valor,
        descricao: finFormDescricao.trim() || null,
      })
      if (error) {
        toast({ title: "Erro ao registrar movimentação", variant: "destructive" })
        setFinSaving(false)
        return
      }
      // Atualiza saldo do profile_bet vinculado
      if (finFormBet) {
        const { data: movs } = await supabase
          .from("movimentacoes_financeiras")
          .select("tipo, valor")
          .eq("profile_bet_id", finFormBet)
        const saldoReal = (movs ?? []).reduce((acc, m) => acc + (m.tipo === "deposito" || m.tipo === "lucro" ? m.valor : -m.valor), 0)
        // perda subtrai (saque já subtrai pela lógica acima)
        await supabase.from("profile_bets").update({ saldo: saldoReal }).eq("id", finFormBet)
      }
    }

    toast({ title: finFormTipo === "bonus" ? "Bônus registrado!" : finFormTipo === "lucro" ? "Lucro registrado!" : finFormTipo === "perda" ? "Perda registrada!" : "Movimentação registrada!" })
    setFinShowForm(false)
    setFinFormBet("")
    setFinFormTipo("deposito")
    setFinFormValor("")
    setFinFormDescricao("")
    await loadMovimentacoes()
    router.refresh()
    setFinSaving(false)
  }

  // Casas únicas extraídas das legs de todas as apostas
  const casasUnicas = Array.from(
    new Map(
      currentApostas.flatMap(a =>
        (a as Aposta & { legs?: { profile_bet?: { id: string; bet?: { id: string; nome: string } } }[] }).legs ?? []
      )
        .filter(l => l.profile_bet?.bet)
        .map(l => [l.profile_bet!.bet!.id, { id: l.profile_bet!.bet!.id, nome: l.profile_bet!.bet!.nome }])
    ).values()
  )

  // Filtro de período + casa
  const now = new Date()
  const apostasFiltradasPeriodo = currentApostas.filter(a => {
    const date = new Date(a.created_at)
    const passaPeriodo = (() => {
      if (periodoFiltro === "dia") {
        return date.toDateString() === now.toDateString()
      }
      if (periodoFiltro === "semana") {
        const semanaAtras = new Date(now)
        semanaAtras.setDate(now.getDate() - 7)
        return date >= semanaAtras
      }
      if (periodoFiltro === "mes") {
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
      }
      return date.getFullYear() === now.getFullYear()
    })()
    if (!passaPeriodo) return false
    if (casaFiltro === "todas") return true
    const legs = (a as Aposta & { legs?: { profile_bet?: { bet?: { id: string } } }[] }).legs ?? []
    return legs.some(l => l.profile_bet?.bet?.id === casaFiltro)
  })

  async function handleFinalizar() {
    if (!finalizarDialog) return
    if (!greenLegId) {
      toast({ title: "Selecione qual casa deu green", variant: "destructive" })
      return
    }
    setFinalizando(true)
    const greenLeg = (finalizarDialog.legs ?? []).find(l => l.id === greenLegId)
    if (!greenLeg) { setFinalizando(false); return }
    const valor = greenLeg.stake * greenLeg.odd - finalizarDialog.investimento_total
    const { error } = await supabase
      .from("apostas")
      .update({
        status: "finalizada",
        resultado_real: valor,
        finalizada_at: new Date().toISOString(),
      })
      .eq("id", finalizarDialog.id)

    if (error) {
      toast({ title: "Erro ao finalizar aposta", variant: "destructive" })
    } else {
      for (const leg of finalizarDialog.legs ?? []) {
        if (!leg.profile_bet_id) continue
        const isGreen = leg.id === greenLegId
        const tipo = isGreen ? "lucro" : "perda"
        const movValor = isGreen ? leg.stake * leg.odd - leg.stake : leg.stake
        if (movValor > 0) {
          await supabase.from("movimentacoes_financeiras").insert({
            profile_id: finalizarDialog.profile_id,
            profile_bet_id: leg.profile_bet_id,
            tipo,
            valor: movValor,
            descricao: `Aposta: ${finalizarDialog.evento}`,
          })
        }
        const { data: movs } = await supabase
          .from("movimentacoes_financeiras")
          .select("tipo, valor")
          .eq("profile_bet_id", leg.profile_bet_id)
        const novoSaldo = (movs ?? []).reduce((acc, m) => {
          const val = parseFloat(String(m.valor)) || 0
          if (m.tipo === "deposito" || m.tipo === "lucro") return acc + val
          if (m.tipo === "saque" || m.tipo === "perda") return acc - val
          return acc
        }, 0)
        await supabase.from("profile_bets").update({ saldo: novoSaldo }).eq("id", leg.profile_bet_id)
      }

      setCurrentApostas(prev =>
        prev.map(a => a.id === finalizarDialog.id
          ? { ...a, status: "finalizada" as const, resultado_real: valor, finalizada_at: new Date().toISOString() }
          : a
        )
      )
      toast({ title: "Aposta finalizada com sucesso!" })
      setFinalizarDialog(null)
      setGreenLegId(null)
      setResultadoReal("")
      router.refresh()
    }
    setFinalizando(false)
  }

  const searchParams = useSearchParams()
  const initialTab = searchParams.get("tab") === "bets" ? "casas" : "dashboard"
  const [activeTab, setActiveTab] = useState(initialTab)
  const TABS = ["dashboard", "casas", "financeiro"]

  function changeTab(v: string) {
    setActiveTab(v)
    if (v === "financeiro" && !movLoaded) loadMovimentacoes()
  }

  const touchStartX = useRef(0)
  function handleTouchStart(e: React.TouchEvent) { touchStartX.current = e.touches[0].clientX }
  function handleTouchEnd(e: React.TouchEvent) {
    const dx = e.changedTouches[0].clientX - touchStartX.current
    if (Math.abs(dx) < 50) return
    const idx = TABS.indexOf(activeTab)
    if (dx < 0 && idx < TABS.length - 1) changeTab(TABS[idx + 1])
    if (dx > 0 && idx > 0) changeTab(TABS[idx - 1])
  }

  return (
    <div className="space-y-0">
      {/* Mobile header */}
      <div className="md:hidden flex flex-col items-center text-center space-y-3 mb-6 pt-2">
        <div className="relative">
          <Avatar className="h-24 w-24 ring-4 ring-[var(--bg-surface)] shadow-lg">
            {currentProfile.foto_url && <AvatarImage src={currentProfile.foto_url} />}
            <AvatarFallback className="text-2xl font-bold">{currentProfile.nome.charAt(0)}{currentProfile.sobrenome.charAt(0)}</AvatarFallback>
          </Avatar>
          <span className={`absolute bottom-1 right-1 w-4 h-4 rounded-full border-2 border-white ${currentProfile.ativo ? "bg-green-500" : "bg-red-500"}`} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-[var(--text-primary)]">
            {currentProfile.apelido || `${currentProfile.nome} ${currentProfile.sobrenome}`}
          </h1>
          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium mt-1 ${currentProfile.ativo ? "bg-green-500/10 text-green-600" : "bg-red-500/10 text-red-500"}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${currentProfile.ativo ? "bg-green-500" : "bg-red-500"}`} />
            {currentProfile.ativo ? "Ativo" : "Inativo"}
          </span>
        </div>
        <p className="text-sm text-[var(--text-secondary)] flex items-center gap-1.5">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          Criado em {new Date(currentProfile.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}
        </p>
        <div className="flex items-center gap-2 w-full pt-1">
          <Button
            className="flex-1"
            onClick={async () => {
              const { data } = await createClient().from("profile_bets").select("id").eq("profile_id", currentProfile.id)
              if (!data || data.length < 2) setMinBetsAlertOpen(true)
              else setShowCalculadoraSheet(true)
            }}
          >
            <Calculator className="h-4 w-4 mr-2" />
            Nova Aposta
          </Button>
          <Button variant="outline" onClick={() => { if (!movLoaded) loadMovimentacoes(); setFinShowForm(true) }}>
            <DollarSign className="h-4 w-4 mr-2" />
            Movimentação
          </Button>
          <Link href={`/perfis/${profile.id}/editar`}>
            <Button variant="outline" size="icon">
              <Pencil className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Desktop banner */}
      <div className="hidden md:block -mx-6 -mt-6 mb-0">
        <div className="relative overflow-hidden bg-gradient-to-br from-[#e8eaf6] to-[#c5cae9] dark:from-[#1e1e3a] dark:to-[#12122a] px-8 pt-8 pb-0">
          {/* Decorative curves */}
          <svg className="absolute right-0 top-0 h-full w-1/3 opacity-30" viewBox="0 0 400 300" fill="none" preserveAspectRatio="xMidYMid slice">
            <ellipse cx="350" cy="80" rx="220" ry="180" fill="#7986cb" opacity="0.4" />
            <ellipse cx="320" cy="220" rx="160" ry="120" fill="#5c6bc0" opacity="0.3" />
          </svg>

          <div className="relative z-10 flex items-end justify-between gap-6">
            {/* Left: avatar + info */}
            <div className="flex items-end gap-6 pb-6">
              <Avatar className="h-24 w-24 flex-shrink-0 ring-4 ring-white/60 shadow-lg">
                {currentProfile.foto_url && <AvatarImage src={currentProfile.foto_url} />}
                <AvatarFallback className="text-3xl font-bold bg-[#3949ab] text-white">
                  {currentProfile.nome.charAt(0)}{currentProfile.sobrenome.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="pb-1">
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-3xl font-bold text-[#1a237e] dark:text-white">
                    {currentProfile.apelido || currentProfile.nome}
                  </h1>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${currentProfile.ativo ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${currentProfile.ativo ? "bg-green-500" : "bg-red-500"}`} />
                    {currentProfile.ativo ? "Ativo" : "Inativo"}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm text-[#3949ab]/70 dark:text-white/60">
                  <span className="flex items-center gap-1.5">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                    Criado em {new Date(currentProfile.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}
                  </span>
                </div>
              </div>
            </div>

            <div className="pb-6 flex-shrink-0" />
          </div>

          {/* Tabs row */}
          <div className="relative z-10 flex items-center gap-0 mt-2">
            {[
              { value: "dashboard", label: "Dashboard" },
              { value: "apostas", label: "Apostas" },
              { value: "casas", label: "Bets" },
              { value: "financeiro", label: "Financeiro" },
            ].map(tab => (
              <button
                key={tab.value}
                onClick={() => changeTab(tab.value)}
                className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.value
                    ? "border-[#1a237e] text-[#1a237e] dark:border-white dark:text-white"
                    : "border-transparent text-[#3949ab]/60 dark:text-white/50 hover:text-[#1a237e] dark:hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            ))}
            <div className="ml-auto pb-0 mb-2" />
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={changeTab}>
        {/* Mobile: full-width centered tabs */}
        <div className="-mx-4 md:hidden">
          <div className="flex border-b border-[var(--border)]">
            {[
              { value: "dashboard", label: "Dashboard" },
              { value: "apostas", label: "Apostas" },
              { value: "casas", label: "Bets" },
              { value: "financeiro", label: "Financeiro" },
            ].map(tab => (
              <button
                key={tab.value}
                onClick={() => changeTab(tab.value)}
                className={`flex-1 py-3 text-sm font-medium border-b-2 -mb-px transition-colors text-center ${
                  activeTab === tab.value
                    ? "border-[#1e3a8a] text-[var(--accent-text)]"
                    : "border-transparent text-[var(--text-secondary)]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Swipe wrapper (mobile) */}
        <div onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd} className="md:mt-6">

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-6">
          {(() => {
            // Chart data: finalized apostas sorted by date
            const finalizadas = [...currentApostas]
              .filter(a => a.status === "finalizada" && a.finalizada_at)
              .sort((a, b) => new Date(a.finalizada_at!).getTime() - new Date(b.finalizada_at!).getTime())
            let cumulative = 0
            const chartData = finalizadas.map(a => {
              cumulative += parseFloat(String(a.resultado_real ?? a.lucro_garantido))
              return {
                date: new Date(a.finalizada_at!).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
                lucro: parseFloat(cumulative.toFixed(2)),
              }
            })
            const totalFinalizadas = finalizadas.length
            const wins = finalizadas.filter(a => parseFloat(String(a.resultado_real ?? 0)) > 0).length
            const winRate = totalFinalizadas > 0 ? (wins / totalFinalizadas) * 100 : 0
            const pendentesCount = currentApostas.filter(a => a.status === "pendente").length
            const recentApostas = currentApostas.slice(0, 8)

            function detectGreen(legs: ApostaLeg[], inv: number, res: number | null | undefined): string | null {
              if (res == null || !legs.length) return null
              const invF = parseFloat(String(inv)), resF = parseFloat(String(res))
              let minDiff = Infinity, minId: string | null = null
              for (const l of legs) {
                const diff = Math.abs(parseFloat(String(l.stake)) * parseFloat(String(l.odd)) - invF - resF)
                if (diff < minDiff) { minDiff = diff; minId = l.id }
              }
              return minDiff < 5 ? minId : null
            }

            return (
              <>
                {/* Financial stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {[
                    { label: "Saldo Total", value: formatCurrency(dashboard?.saldo_total ?? 0), icon: DollarSign, color: "text-[#3b82f6]", bg: "bg-[#3b82f6]/10", border: "border-[#3b82f6]/20" },
                    { label: "Lucro", value: formatCurrency(dashboard?.lucro_realizado ?? 0), icon: TrendingUp, color: "text-green-500", bg: "bg-green-500/10", border: "border-green-500/20" },
                    { label: "Lucro Pendente", value: formatCurrency(dashboard?.lucro_pendente ?? 0), icon: Clock, color: "text-yellow-500", bg: "bg-yellow-500/10", border: "border-yellow-500/20" },
                    { label: "ROI", value: `${parseFloat(String(dashboard?.roi_percentual ?? 0)).toFixed(2)}%`, icon: ArrowUpRight, color: "text-[#a855f7]", bg: "bg-[#a855f7]/10", border: "border-[#a855f7]/20" },
                  ].map(({ label, value, icon: Icon, color, bg, border }) => (
                    <div key={label} className={`rounded-xl border ${border} bg-[var(--bg-surface)] p-4`}>
                      <div className="flex items-center gap-2 min-w-0">
                        <div className={`p-2 ${bg} rounded-lg flex-shrink-0`}><Icon className={`h-4 w-4 ${color}`} /></div>
                        <div className="min-w-0">
                          <p className="text-xs text-[var(--text-secondary)] truncate">{label}</p>
                          <p className={`text-sm font-bold ${color} truncate`}>{value}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Apostas stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {[
                    { label: "Total Apostas", value: String(dashboard?.total_apostas ?? 0), icon: ClipboardList, color: "text-[var(--text-primary)]", bg: "bg-[var(--bg-elevated)]", border: "border-[var(--border)]" },
                    { label: "Finalizadas", value: String(totalFinalizadas), icon: CheckCircle2, color: "text-green-500", bg: "bg-green-500/10", border: "border-green-500/20" },
                    { label: "Pendentes", value: String(pendentesCount), icon: Clock, color: "text-yellow-500", bg: "bg-yellow-500/10", border: "border-yellow-500/20" },
                    { label: "Taxa de Acerto", value: `${winRate.toFixed(1)}%`, icon: Target, color: "text-[#a855f7]", bg: "bg-[#a855f7]/10", border: "border-[#a855f7]/20" },
                  ].map(({ label, value, icon: Icon, color, bg, border }) => (
                    <div key={label} className={`rounded-xl border ${border} bg-[var(--bg-surface)] p-4`}>
                      <div className="flex items-center gap-2 min-w-0">
                        <div className={`p-2 ${bg} rounded-lg flex-shrink-0`}><Icon className={`h-4 w-4 ${color}`} /></div>
                        <div className="min-w-0">
                          <p className="text-xs text-[var(--text-secondary)] truncate">{label}</p>
                          <p className={`text-sm font-bold ${color} truncate`}>{value}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Chart + Resumo Financeiro */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div className="lg:col-span-2 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-5">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wide">Lucro Acumulado</h2>
                      <span className="text-xs text-[var(--text-secondary)]">Apostas finalizadas</span>
                    </div>
                    {chartData.length === 0 ? (
                      <div className="flex items-center justify-center h-[200px] text-[var(--text-secondary)] text-sm">Nenhuma aposta finalizada ainda</div>
                    ) : (
                      <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                          <XAxis dataKey="date" tick={{ fontSize: 10, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fontSize: 10, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} tickFormatter={v => `R$${v}`} />
                          <Tooltip
                            contentStyle={{ backgroundColor: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--text-primary)" }}
                            formatter={(v: unknown) => [formatCurrency(v as number), "Lucro"]}
                          />
                          <Line type="monotone" dataKey="lucro" stroke="#1e3a8a" strokeWidth={2.5} dot={{ fill: "#1e3a8a", r: 3 }} activeDot={{ r: 5 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    )}
                  </div>

                  <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-5 flex flex-col">
                    <h2 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wide mb-4">Resumo Financeiro</h2>
                    <div className="flex-1 space-y-3">
                      {[
                        { label: "Total Investido", value: formatCurrency(dashboard?.total_investido ?? 0), cls: "text-[var(--text-primary)]" },
                        { label: "Lucro", value: formatCurrency(dashboard?.lucro_realizado ?? 0), cls: "text-green-500" },
                        { label: "Lucro Pendente", value: formatCurrency(dashboard?.lucro_pendente ?? 0), cls: "text-yellow-500" },
                        { label: "Bônus", value: formatCurrency(dashboard?.bonus_total ?? 0), cls: "text-[#f97316]" },
                        { label: "Total Apostas", value: String(dashboard?.total_apostas ?? 0), cls: "text-[var(--text-primary)]" },
                      ].map(({ label, value, cls }) => (
                        <div key={label} className="flex items-center justify-between py-2 border-b border-[var(--border-subtle)] last:border-0">
                          <span className="text-sm text-[var(--text-secondary)]">{label}</span>
                          <span className={`text-sm font-semibold ${cls}`}>{value}</span>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={() => changeTab("financeiro")}
                      className="mt-4 flex items-center justify-center gap-2 w-full py-2.5 rounded-lg border border-[#1e3a8a]/40 text-[var(--accent-text)] text-sm font-medium hover:bg-[#1e3a8a]/10 transition-colors"
                    >
                      <Wallet className="w-4 h-4" />
                      Ver Financeiro
                    </button>
                  </div>
                </div>

                {/* Quick Access */}
                <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-5">
                  <h2 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wide mb-4">Acesso Rápido</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { label: "Nova Aposta", sub: "Registrar", icon: Calculator, color: "text-[var(--accent-text)]", bg: "bg-[#1e3a8a]/10 border-[#1e3a8a]/20", onClick: () => setShowCalculadoraModal(true) },
                      { label: "Apostas", sub: "Ver todas", icon: ClipboardList, color: "text-[#a855f7]", bg: "bg-[#a855f7]/10 border-[#a855f7]/20", onClick: () => changeTab("apostas") },
                      { label: "Bets", sub: "Gerenciar", icon: Wallet, color: "text-[#f97316]", bg: "bg-[#f97316]/10 border-[#f97316]/20", onClick: () => changeTab("casas") },
                      { label: "Financeiro", sub: "Movimentações", icon: TrendingUp, color: "text-green-500", bg: "bg-green-500/10 border-green-500/20", onClick: () => changeTab("financeiro") },
                    ].map(({ label, sub, icon: Icon, color, bg, onClick }) => (
                      <button
                        key={label}
                        onClick={onClick}
                        className={`flex flex-col items-center gap-2 p-3 rounded-xl border ${bg} hover:scale-[1.02] transition-transform`}
                      >
                        <div className={`p-2 rounded-lg ${bg}`}><Icon className={`h-5 w-5 ${color}`} /></div>
                        <div className="text-center">
                          <p className={`text-xs font-semibold ${color}`}>{label}</p>
                          <p className="text-[10px] text-[var(--text-secondary)]">{sub}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Apostas Recentes */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wide">Apostas Recentes</h2>
                    <button onClick={() => changeTab("apostas")} className="text-xs text-[var(--accent-text)] hover:underline flex items-center gap-1">
                      Ver todas <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>

                  {recentApostas.length === 0 ? (
                    <Card><CardContent className="flex flex-col items-center justify-center py-16">
                      <BookOpen className="h-12 w-12 text-gray-300 mb-4" />
                      <p className="text-[var(--text-secondary)]">Nenhuma aposta registrada</p>
                    </CardContent></Card>
                  ) : (
                    <>
                      {/* Desktop table */}
                      <div className="hidden md:block space-y-3">
                        {recentApostas.map(aposta => {
                          const legs = (aposta.legs ?? []) as ApostaLeg[]
                          const d = aposta.data_evento ? new Date(aposta.data_evento) : new Date(aposta.created_at)
                          const dataStr = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })
                          const horaStr = aposta.data_evento ? d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : null
                          const isFinished = aposta.status === "finalizada" && aposta.resultado_real != null
                          const detectedGreenLegId = isFinished ? detectGreen(legs, aposta.investimento_total, aposta.resultado_real) : null
                          return (
                            <Card key={aposta.id} className="overflow-hidden cursor-pointer hover:border-[#1e3a8a]/40 transition-colors" onClick={() => window.location.href = `/apostas/${aposta.id}`}>
                              <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--border)] bg-[var(--bg-elevated)]">
                                <div className="flex items-center gap-3 min-w-0">
                                  <p className="font-semibold truncate text-[var(--text-primary)]">{aposta.evento}</p>
                                  {aposta.esporte && <span className="text-xs text-[var(--text-muted)] flex-shrink-0">{aposta.esporte}</span>}
                                </div>
                                <div className="flex items-center gap-3 flex-shrink-0">
                                  <span className="text-xs text-[var(--text-secondary)]">{dataStr}{horaStr ? ` · ${horaStr}` : ""}</span>
                                  {statusBadge(aposta.status)}
                                  <span className={`font-bold text-base ${isFinished ? ((aposta.resultado_real ?? 0) >= 0 ? "text-green-500" : "text-[#DC2626]") : "text-green-500"}`}>
                                    {isFinished ? formatCurrency(aposta.resultado_real ?? 0) : formatCurrency(aposta.lucro_garantido)}
                                  </span>
                                  <span className="text-xs text-[var(--text-muted)]">{parseFloat(String(aposta.roi_percentual)).toFixed(2)}%</span>
                                </div>
                              </div>
                              <div className="divide-y divide-[var(--border)]">
                                {legs.map(leg => {
                                  const isGreen = detectedGreenLegId === leg.id
                                  const isRed = isFinished && detectedGreenLegId !== null && !isGreen
                                  return (
                                    <div key={leg.id} className={`flex items-center gap-4 px-5 py-3 ${isGreen ? "bg-green-500/5" : isRed ? "bg-[#DC2626]/5" : ""}`}>
                                      <div className="w-36 flex-shrink-0">
                                        <p className="font-semibold text-[var(--text-primary)] text-sm">{leg.profile_bet?.bet?.nome ?? "—"}</p>
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm text-[var(--text-secondary)] truncate">{leg.resultado_apostado}</p>
                                      </div>
                                      <div className="text-right flex-shrink-0 w-28">
                                        <p className="text-xs text-[var(--text-muted)]">Stake</p>
                                        <p className="text-sm font-semibold text-[var(--text-primary)]">{formatCurrency(leg.stake)}</p>
                                      </div>
                                      <div className="text-right flex-shrink-0 w-20">
                                        <p className="text-xs text-[var(--text-muted)]">Odd</p>
                                        <p className="text-sm font-bold text-[var(--text-primary)]">{parseFloat(String(leg.odd)).toFixed(3)}</p>
                                      </div>
                                      {isFinished && (
                                        <div className="text-right flex-shrink-0 w-28">
                                          <p className="text-xs text-[var(--text-muted)]">{isGreen ? "Retorno" : "Perda"}</p>
                                          <p className={`text-sm font-bold ${isGreen ? "text-green-600" : "text-[#DC2626]"}`}>
                                            {isGreen ? `+${formatCurrency(parseFloat(String(leg.stake)) * parseFloat(String(leg.odd)))}` : `-${formatCurrency(parseFloat(String(leg.stake)))}`}
                                          </p>
                                        </div>
                                      )}
                                      {isFinished && (
                                        <span className={`px-2.5 py-1 rounded text-xs font-bold w-14 text-center flex-shrink-0 ${isGreen ? "bg-green-600 text-white" : "bg-[#DC2626] text-white"}`}>
                                          {isGreen ? "GREEN" : "RED"}
                                        </span>
                                      )}
                                    </div>
                                  )
                                })}
                              </div>
                            </Card>
                          )
                        })}
                      </div>

                      {/* Mobile cards */}
                      <div className="md:hidden space-y-3">
                        {recentApostas.map(aposta => {
                          const legs = (aposta.legs ?? []) as ApostaLeg[]
                          const isFinished = aposta.status === "finalizada" && aposta.resultado_real != null
                          const detectedGreenLegId = isFinished ? detectGreen(legs, aposta.investimento_total, aposta.resultado_real) : null
                          return (
                            <Link key={aposta.id} href={`/apostas/${aposta.id}`}>
                              <Card className="hover:border-[#1e3a8a]/40 transition-colors cursor-pointer overflow-hidden">
                                <CardContent className="p-4">
                                  <div className="flex items-center gap-2 flex-wrap mb-1">
                                    <p className="font-medium text-[var(--text-primary)] truncate">{aposta.evento}</p>
                                    {statusBadge(aposta.status)}
                                  </div>
                                  <p className="text-xs text-[var(--text-muted)] mb-3 flex items-center gap-1">
                                    <CalendarIcon className="h-3 w-3" />
                                    {(aposta.data_evento ? new Date(aposta.data_evento) : new Date(aposta.created_at)).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" })}
                                  </p>
                                  {legs.length > 0 && (
                                    <div className="space-y-1.5 mb-3">
                                      {legs.map(leg => {
                                        const isGreen = detectedGreenLegId === leg.id
                                        const isRed = detectedGreenLegId !== null && !isGreen
                                        return (
                                          <div key={leg.id} className={`rounded-xl px-3 py-3 flex items-center gap-3 ${isGreen ? "bg-green-500/10" : isRed ? "bg-[#DC2626]/5" : "bg-[var(--bg-elevated)]"}`}>
                                            <div className="flex-1 min-w-0 space-y-1">
                                              <p className={`text-base font-bold leading-tight ${isGreen ? "text-green-600" : isRed ? "text-[#DC2626]" : "text-[var(--accent-text)]"}`}>{leg.profile_bet?.bet?.nome ?? "Casa"}</p>
                                              <p className="text-sm text-[var(--text-secondary)]">{leg.resultado_apostado}</p>
                                              <p className="text-sm text-[var(--text-secondary)]">@{parseFloat(String(leg.odd)).toFixed(2)} · {formatCurrency(leg.stake)}</p>
                                              {(isGreen || isRed) && (
                                                <p className={`text-sm font-bold ${isGreen ? "text-green-600" : "text-[#DC2626]"}`}>
                                                  {isGreen ? `Retorno: +${formatCurrency(parseFloat(String(leg.stake)) * parseFloat(String(leg.odd)))}` : `Perda: -${formatCurrency(parseFloat(String(leg.stake)))}`}
                                                </p>
                                              )}
                                            </div>
                                            {(isGreen || isRed) && (
                                              <span className={`px-2.5 py-1 rounded text-xs font-bold flex-shrink-0 ${isGreen ? "bg-green-600 text-white" : "bg-[#DC2626] text-white"}`}>
                                                {isGreen ? "GREEN" : "RED"}
                                              </span>
                                            )}
                                          </div>
                                        )
                                      })}
                                    </div>
                                  )}
                                  <div className="flex items-end justify-between gap-2 pt-2 border-t border-[var(--border)]">
                                    <div>
                                      <p className="text-xs text-[var(--text-muted)]">Investimento</p>
                                      <p className="text-sm font-bold text-[var(--text-primary)]">{formatCurrency(aposta.investimento_total)}</p>
                                    </div>
                                    <div className="text-center">
                                      <p className="text-xs text-[var(--text-muted)]">ROI</p>
                                      <p className="text-sm font-bold text-[#a855f7]">{parseFloat(String(aposta.roi_percentual)).toFixed(2)}%</p>
                                    </div>
                                    {aposta.status !== "cancelada" && (
                                      <div className="text-right">
                                        <p className="text-xs text-[var(--text-muted)]">{aposta.status === "finalizada" ? "Lucro" : "Lucro esperado"}</p>
                                        <p className={`text-sm font-bold ${aposta.status === "finalizada" ? ((aposta.resultado_real ?? 0) >= 0 ? "text-[var(--accent-text)]" : "text-[#DC2626]") : "text-[#D97706]"}`}>
                                          {aposta.status === "finalizada" ? formatCurrency(aposta.resultado_real ?? 0) : formatCurrency(aposta.lucro_garantido)}
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                </CardContent>
                              </Card>
                            </Link>
                          )
                        })}
                      </div>
                    </>
                  )}
                </div>
              </>
            )
          })()}
        </TabsContent>

        {/* Apostas Tab */}
        <TabsContent value="apostas" className="space-y-6">
          {(() => {
            function getPeriodRange() {
              const now = new Date()
              if (apFilterPeriod === "dia") {
                const from = new Date(now); from.setHours(0, 0, 0, 0)
                const to = new Date(now); to.setHours(23, 59, 59, 999)
                return { from, to }
              }
              if (apFilterPeriod === "semana") {
                const from = new Date(now); from.setDate(now.getDate() - now.getDay()); from.setHours(0, 0, 0, 0)
                const to = new Date(now); to.setHours(23, 59, 59, 999)
                return { from, to }
              }
              if (apFilterPeriod === "mes") {
                const from = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0)
                const to = new Date(now); to.setHours(23, 59, 59, 999)
                return { from, to }
              }
              if (apFilterPeriod === "custom") {
                if (apFilterCustomMode === "single" && apFilterCustomDate) {
                  const from = new Date(apFilterCustomDate); from.setHours(0, 0, 0, 0)
                  const to = new Date(apFilterCustomDate); to.setHours(23, 59, 59, 999)
                  return { from, to }
                }
                if (apFilterCustomMode === "range") {
                  const from = apFilterCustomFrom ? (() => { const d = new Date(apFilterCustomFrom); d.setHours(0,0,0,0); return d })() : null
                  const to = apFilterCustomTo ? (() => { const d = new Date(apFilterCustomTo); d.setHours(23,59,59,999); return d })() : null
                  return { from, to }
                }
              }
              return { from: null, to: null }
            }

            const apFiltered = currentApostas.filter(a => {
              if (apFilterStatus !== "todos" && a.status !== apFilterStatus) return false
              const { from, to } = getPeriodRange()
              const created = new Date(a.created_at)
              if (from && created < from) return false
              if (to && created > to) return false
              if (apFilterEsporte && !(a.esporte ?? "").toLowerCase().includes(apFilterEsporte.toLowerCase())) return false
              if (apFilterCompeticao && !(a.competicao ?? "").toLowerCase().includes(apFilterCompeticao.toLowerCase())) return false
              return true
            }).sort((a, b) => {
              if (apSortBy === "data_asc") return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
              if (apSortBy === "valor_desc") return b.investimento_total - a.investimento_total
              if (apSortBy === "roi_desc") return b.roi_percentual - a.roi_percentual
              return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            })

            const hasActiveFilter = apFilterStatus !== "todos" || apFilterPeriod !== "todos" || apFilterEsporte || apFilterCompeticao

            return (
              <>
                {/* Filter card — hidden; filter button is inline with date groups */}
                <Card className="hidden">
                  <CardContent className="p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => setApShowFilter(v => !v)}
                        className="flex items-center gap-2 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                      >
                        <Filter className="h-4 w-4" />
                        Filtrar
                        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${apShowFilter ? "rotate-180" : ""}`} />
                      </button>
                      {hasActiveFilter && (
                        <button
                          onClick={() => { setApFilterStatus("todos"); setApFilterPeriod("todos"); setApFilterCustomDate(""); setApFilterCustomFrom(""); setApFilterCustomTo(""); setApFilterEsporte(""); setApFilterCompeticao("") }}
                          className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center gap-1 transition-colors"
                        >
                          <X className="h-3 w-3" />
                          Limpar
                        </button>
                      )}
                    </div>

                    {apShowFilter && <>
                      {/* Status + Ordenar */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs">Status</Label>
                          <Select value={apFilterStatus} onValueChange={setApFilterStatus}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="todos">Todos</SelectItem>
                              <SelectItem value="pendente">Pendentes</SelectItem>
                              <SelectItem value="finalizada">Finalizadas</SelectItem>
                              <SelectItem value="cancelada">Canceladas</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">Ordenar por</Label>
                          <Select value={apSortBy} onValueChange={v => setApSortBy(v as typeof apSortBy)}>
                            <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="data_desc">Data (mais recente)</SelectItem>
                              <SelectItem value="data_asc">Data (mais antigo)</SelectItem>
                              <SelectItem value="valor_desc">Maior investimento</SelectItem>
                              <SelectItem value="roi_desc">Maior ROI</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Esporte + Competição */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs">Esporte</Label>
                          <Input value={apFilterEsporte} onChange={e => setApFilterEsporte(e.target.value)} placeholder="ex: Futebol" className="text-xs h-9" />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">Competição</Label>
                          <Input value={apFilterCompeticao} onChange={e => setApFilterCompeticao(e.target.value)} placeholder="ex: Champions League" className="text-xs h-9" />
                        </div>
                      </div>

                      {/* Period pills */}
                      <div className="space-y-2">
                        <Label className="text-xs flex items-center gap-1">
                          <CalendarIcon className="h-3 w-3" />
                          Período
                        </Label>
                        <div className="flex flex-wrap gap-2">
                          {(["todos", "dia", "semana", "mes"] as const).map(p => (
                            <button
                              key={p}
                              onClick={() => setApFilterPeriod(p)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                                apFilterPeriod === p
                                  ? "bg-[#1e3a8a] border-[#1e3a8a] text-white"
                                  : "border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]"
                              }`}
                            >
                              {{ todos: "Todos", dia: "Hoje", semana: "Semana", mes: "Mês" }[p]}
                            </button>
                          ))}
                          <button
                            onClick={() => setApFilterPeriod("custom")}
                            title="Data personalizada"
                            className={`flex items-center justify-center w-[34px] h-[34px] rounded-lg transition-colors border ${
                              apFilterPeriod === "custom"
                                ? "bg-[#1e3a8a] border-[#1e3a8a] text-white"
                                : "border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]"
                            }`}
                          >
                            <CalendarIcon className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        {apFilterPeriod === "custom" && (
                          <div className="mt-2 space-y-2">
                            <div className="flex gap-1 p-0.5 bg-[var(--bg-elevated)] rounded-lg w-fit">
                              <button onClick={() => setApFilterCustomMode("single")} className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${apFilterCustomMode === "single" ? "bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-sm" : "text-[var(--text-secondary)]"}`}>Data</button>
                              <button onClick={() => setApFilterCustomMode("range")} className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${apFilterCustomMode === "range" ? "bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-sm" : "text-[var(--text-secondary)]"}`}>Intervalo</button>
                            </div>
                            {apFilterCustomMode === "single" ? (
                              <Input type="date" value={apFilterCustomDate} onChange={e => setApFilterCustomDate(e.target.value)} className="text-xs h-8 max-w-[160px]" />
                            ) : (
                              <div className="flex items-center gap-2">
                                <Input type="date" value={apFilterCustomFrom} onChange={e => setApFilterCustomFrom(e.target.value)} className="text-xs h-8 max-w-[140px]" />
                                <span className="text-[var(--text-muted)] text-xs">até</span>
                                <Input type="date" value={apFilterCustomTo} onChange={e => setApFilterCustomTo(e.target.value)} className="text-xs h-8 max-w-[140px]" />
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </>}
                  </CardContent>
                </Card>

                {/* Filter panel — shown when inline Filtrar button is active */}
                {apShowFilter && (
                  <Card>
                    <CardContent className="p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">Filtros</span>
                        {hasActiveFilter && (
                          <button
                            onClick={() => { setApFilterStatus("todos"); setApFilterPeriod("todos"); setApFilterCustomDate(""); setApFilterCustomFrom(""); setApFilterCustomTo(""); setApFilterEsporte(""); setApFilterCompeticao("") }}
                            className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center gap-1 transition-colors"
                          >
                            <X className="h-3 w-3" /> Limpar
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs">Status</Label>
                          <Select value={apFilterStatus} onValueChange={setApFilterStatus}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="todos">Todos</SelectItem>
                              <SelectItem value="pendente">Pendente</SelectItem>
                              <SelectItem value="finalizada">Finalizada</SelectItem>
                              <SelectItem value="cancelada">Cancelada</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">Ordenar</Label>
                          <Select value={apSortBy} onValueChange={v => setApSortBy(v as typeof apSortBy)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="data_desc">Mais recente</SelectItem>
                              <SelectItem value="data_asc">Mais antiga</SelectItem>
                              <SelectItem value="valor_desc">Maior valor</SelectItem>
                              <SelectItem value="roi_desc">Maior ROI</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* List */}
                {apFiltered.length === 0 ? (
                  <div className="space-y-2">
                    <div className="flex justify-end md:hidden">
                      <button
                        onClick={() => setApShowFilter(v => !v)}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium transition-colors ${
                          apShowFilter || hasActiveFilter
                            ? "bg-[#1e3a8a]/10 border-[#1e3a8a]/30 text-[var(--accent-text)]"
                            : "border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]"
                        }`}
                      >
                        {apShowFilter ? <X className="w-3 h-3" /> : <SlidersHorizontal className="w-3 h-3" />}
                        Filtrar{hasActiveFilter && !apShowFilter ? " •" : ""}
                      </button>
                    </div>
                    <Card>
                      <CardContent className="flex flex-col items-center justify-center py-16">
                        <BookOpen className="h-12 w-12 text-gray-300 mb-4" />
                        <p className="text-[var(--text-secondary)]">Nenhuma aposta encontrada</p>
                      </CardContent>
                    </Card>
                  </div>
                ) : (() => {
                  function formatGroupDate(iso: string) {
                    return new Date(iso + "T12:00:00").toLocaleDateString("pt-BR", { day: "numeric", month: "short" }).replace(".", "")
                  }
                  const map = new Map<string, typeof apFiltered>()
                  for (const a of apFiltered) {
                    const key = new Date(a.created_at).toISOString().slice(0, 10)
                    if (!map.has(key)) map.set(key, [])
                    map.get(key)!.push(a)
                  }
                  const groups = Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]))

                  return (
                    <>
                      {/* Desktop */}
                      <div className="hidden md:block space-y-6">
                        {groups.map(([dateKey, apostasGroup], groupIdx) => (
                          <div key={dateKey}>
                            <div className="flex items-center justify-between px-1 mb-2">
                              <p className="text-xs font-semibold text-[var(--text-muted)]">{formatGroupDate(dateKey)}</p>
                              {groupIdx === groups.length - 1 && (
                                <button
                                  onClick={() => setApShowFilter(v => !v)}
                                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium transition-colors ${
                                    apShowFilter || hasActiveFilter
                                      ? "bg-[#1e3a8a]/10 border-[#1e3a8a]/30 text-[var(--accent-text)]"
                                      : "border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]"
                                  }`}
                                >
                                  {apShowFilter ? <X className="w-3 h-3" /> : <SlidersHorizontal className="w-3 h-3" />}
                                  Filtrar{hasActiveFilter && !apShowFilter ? " •" : ""}
                                </button>
                              )}
                            </div>
                            <div className="space-y-3">
                              {apostasGroup.map(aposta => {
                                const legs = (aposta as any).legs ?? []
                                const d = aposta.data_evento ? new Date(aposta.data_evento) : new Date(aposta.created_at)
                                const dataStr = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })
                                const horaStr = aposta.data_evento ? d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : null
                                const isFinished = aposta.status === "finalizada" && aposta.resultado_real != null
                                const detectedGreenLegId = isFinished
                                  ? (() => {
                                      const inv = parseFloat(String(aposta.investimento_total))
                                      const res = parseFloat(String(aposta.resultado_real))
                                      let minDiff = Infinity, minId: string | null = null
                                      for (const l of legs) {
                                        const diff = Math.abs(parseFloat(String(l.stake)) * parseFloat(String(l.odd)) - inv - res)
                                        if (diff < minDiff) { minDiff = diff; minId = l.id }
                                      }
                                      return minDiff < 5 ? minId : null
                                    })()
                                  : null
                                return (
                                  <Card
                                    key={aposta.id}
                                    className="overflow-hidden cursor-pointer hover:border-[#1e3a8a]/40 transition-colors"
                                    onClick={() => window.location.href = `/apostas/${aposta.id}`}
                                  >
                                    <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--border)] bg-[var(--bg-elevated)]">
                                      <div className="flex items-center gap-3 min-w-0">
                                        <p className={`font-semibold truncate ${aposta.status === "pendente" ? "text-red-500 dark:text-[var(--text-primary)]" : "text-[var(--text-primary)]"}`}>{aposta.evento}</p>
                                        {aposta.esporte && <span className="text-xs text-[var(--text-muted)] flex-shrink-0">{aposta.esporte}</span>}
                                      </div>
                                      <div className="flex items-center gap-3 flex-shrink-0">
                                        <span className="text-xs text-[var(--text-secondary)]">{dataStr}{horaStr ? ` · ${horaStr}` : ""}</span>
                                        {statusBadge(aposta.status)}
                                        <span className={`font-bold text-base ${isFinished ? ((aposta.resultado_real ?? 0) >= 0 ? "text-green-500" : "text-[#DC2626]") : "text-green-500"}`}>
                                          {isFinished ? formatCurrency(aposta.resultado_real ?? 0) : formatCurrency(aposta.lucro_garantido)}
                                        </span>
                                        <span className="text-xs text-[var(--text-muted)]">{aposta.roi_percentual.toFixed(2)}%</span>
                                      </div>
                                    </div>
                                    <div className="divide-y divide-[var(--border)]">
                                      {legs.map((leg: any) => {
                                        const isGreen = detectedGreenLegId === leg.id
                                        const isRed = isFinished && detectedGreenLegId !== null && !isGreen
                                        return (
                                          <div key={leg.id} className={`flex items-center gap-4 px-5 py-3 ${isGreen ? "bg-green-500/5" : isRed ? "bg-[#DC2626]/5" : ""}`}>
                                            <div className="w-36 flex-shrink-0">
                                              <p className="font-semibold text-[var(--text-primary)] text-sm">{leg.profile_bet?.bet?.nome ?? "—"}</p>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                              <p className="text-sm text-[var(--text-secondary)] truncate">{leg.resultado_apostado}</p>
                                            </div>
                                            <div className="text-right flex-shrink-0 w-28">
                                              <p className="text-xs text-[var(--text-muted)]">Stake</p>
                                              <p className="text-sm font-semibold text-[var(--text-primary)]">{formatCurrency(leg.stake)}</p>
                                            </div>
                                            <div className="text-right flex-shrink-0 w-20">
                                              <p className="text-xs text-[var(--text-muted)]">Odd</p>
                                              <p className="text-sm font-bold text-[var(--text-primary)]">{Number(leg.odd).toFixed(3)}</p>
                                            </div>
                                            {isFinished && (
                                              <div className="text-right flex-shrink-0 w-28">
                                                <p className="text-xs text-[var(--text-muted)]">{isGreen ? "Retorno" : "Perda"}</p>
                                                <p className={`text-sm font-bold ${isGreen ? "text-green-600" : "text-[#DC2626]"}`}>
                                                  {isGreen ? `+${formatCurrency(leg.stake * leg.odd)}` : `-${formatCurrency(leg.stake)}`}
                                                </p>
                                              </div>
                                            )}
                                            {isFinished && (
                                              <span className={`px-2.5 py-1 rounded text-xs font-bold w-14 text-center flex-shrink-0 ${isGreen ? "bg-green-600 text-white" : "bg-[#DC2626] text-white"}`}>
                                                {isGreen ? "GREEN" : "RED"}
                                              </span>
                                            )}
                                          </div>
                                        )
                                      })}
                                    </div>
                                  </Card>
                                )
                              })}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Mobile */}
                      <div className="md:hidden space-y-6">
                        {groups.map(([dateKey, apostasGroup], groupIdx) => (
                          <div key={dateKey}>
                            <div className="flex items-center justify-between px-1 mb-2">
                              <p className="text-xs font-semibold text-[var(--text-muted)]">{formatGroupDate(dateKey)}</p>
                              {groupIdx === 0 && (
                                <button
                                  onClick={() => setApShowFilter(v => !v)}
                                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium transition-colors ${
                                    apShowFilter || hasActiveFilter
                                      ? "bg-[#1e3a8a]/10 border-[#1e3a8a]/30 text-[var(--accent-text)]"
                                      : "border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]"
                                  }`}
                                >
                                  {apShowFilter ? <X className="w-3 h-3" /> : <SlidersHorizontal className="w-3 h-3" />}
                                  Filtrar{hasActiveFilter && !apShowFilter ? " •" : ""}
                                </button>
                              )}
                            </div>
                            <div className="space-y-3">
                              {apostasGroup.map(aposta => {
                                const legs = (aposta as any).legs ?? []
                                const detectedGreenId = aposta.status === "finalizada" && aposta.resultado_real != null
                                  ? legs.find((l: any) => Math.abs(l.stake * l.odd - aposta.investimento_total - aposta.resultado_real!) < 0.5)?.id ?? null
                                  : null
                                return (
                                  <Link key={aposta.id} href={`/apostas/${aposta.id}`}>
                                    <Card className="hover:border-[#1e3a8a]/40 transition-colors cursor-pointer overflow-hidden">
                                      <CardContent className="p-4">
                                        <div className="flex items-center justify-between gap-2 mb-0.5 min-w-0">
                                          <p className="font-medium text-[var(--text-primary)] truncate">{aposta.evento}</p>
                                          <div className="flex-shrink-0">{statusBadge(aposta.status)}</div>
                                        </div>
                                        {aposta.competicao && (
                                          <p className="text-xs text-[var(--text-muted)] truncate mb-1">{aposta.competicao}</p>
                                        )}
                                        <p className="text-xs text-[var(--text-muted)] mb-3 flex items-center gap-1">
                                          <CalendarIcon className="h-3 w-3" />
                                          {(() => {
                                            const d = aposta.data_evento ? new Date(aposta.data_evento) : new Date(aposta.created_at)
                                            const dateStr = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" })
                                            const timeStr = aposta.data_evento ? ` às ${d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}` : ""
                                            return dateStr + timeStr
                                          })()}
                                        </p>
                                        {legs.length > 0 && (
                                          <div className="space-y-1.5 mb-3">
                                            {legs.map((leg: any) => {
                                              const isGreen = detectedGreenId === leg.id
                                              const isRed = detectedGreenId !== null && detectedGreenId !== leg.id
                                              return (
                                                <div key={leg.id} className={`rounded-xl px-3 py-3 flex items-center gap-3 ${isGreen ? "bg-green-500/10" : isRed ? "bg-[#DC2626]/5" : "bg-[var(--bg-elevated)]"}`}>
                                                  <div className="flex-1 min-w-0 space-y-1">
                                                    <p className={`text-base font-bold leading-tight ${isGreen ? "text-green-600" : isRed ? "text-[#DC2626]" : "text-[var(--accent-text)]"}`}>
                                                      {leg.profile_bet?.bet?.nome ?? "Casa"}
                                                    </p>
                                                    <p className="text-sm text-[var(--text-secondary)] leading-snug">{leg.resultado_apostado}</p>
                                                    <p className="text-sm text-[var(--text-secondary)]">@{Number(leg.odd).toFixed(2)} · {formatCurrency(leg.stake)}</p>
                                                    {(isGreen || isRed) && (
                                                      <p className={`text-sm font-bold ${isGreen ? "text-green-600" : "text-[#DC2626]"}`}>
                                                        {isGreen ? `Retorno: +${formatCurrency(leg.stake * leg.odd)}` : `Perda: -${formatCurrency(leg.stake)}`}
                                                      </p>
                                                    )}
                                                  </div>
                                                  {(isGreen || isRed) && (
                                                    <span className={`px-2.5 py-1 rounded text-xs font-bold flex-shrink-0 ${isGreen ? "bg-green-600 text-white" : "bg-[#DC2626] text-white"}`}>
                                                      {isGreen ? "GREEN" : "RED"}
                                                    </span>
                                                  )}
                                                </div>
                                              )
                                            })}
                                          </div>
                                        )}
                                        <div className="flex items-end justify-between gap-2 pt-2 border-t border-[var(--border)]">
                                          <div>
                                            <p className="text-xs text-[var(--text-muted)]">Investimento</p>
                                            <p className="text-sm font-bold text-[var(--text-primary)]">{formatCurrency(aposta.investimento_total)}</p>
                                          </div>
                                          <div className="text-center">
                                            <p className="text-xs text-[var(--text-muted)]">ROI</p>
                                            <p className="text-sm font-bold text-[#a855f7]">{parseFloat(String(aposta.roi_percentual)).toFixed(2)}%</p>
                                          </div>
                                          {aposta.status !== "cancelada" && (
                                            <div className="text-right">
                                              <p className="text-xs text-[var(--text-muted)]">{aposta.status === "finalizada" ? "Lucro" : "Lucro esperado"}</p>
                                              {aposta.status === "finalizada" ? (
                                                <p className={`text-sm font-bold ${(aposta.resultado_real ?? 0) >= 0 ? "text-[var(--accent-text)]" : "text-[#DC2626]"}`}>
                                                  {formatCurrency(aposta.resultado_real ?? 0)}
                                                </p>
                                              ) : (
                                                <>
                                                  <p className="text-sm font-bold text-[#D97706]">{formatCurrency(aposta.lucro_garantido)}</p>
                                                  <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="mt-2"
                                                    onClick={e => {
                                                      e.preventDefault()
                                                      setFinalizarDialog(aposta)
                                                      setResultadoReal("")
                                                    }}
                                                  >
                                                    Finalizar
                                                  </Button>
                                                </>
                                              )}
                                            </div>
                                          )}
                                        </div>
                                      </CardContent>
                                    </Card>
                                  </Link>
                                )
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )
                })()}
              </>
            )
          })()}
        </TabsContent>

        {/* Casas Tab */}
        <TabsContent value="casas" className="overflow-hidden">
          <AddBetToProfile profileId={profile.id} userToken={userToken} />
        </TabsContent>

        {/* Financeiro Tab */}
        <TabsContent value="financeiro" className="space-y-4">
          {/* Filtrar inline — aparece junto à primeira data na lista */}

          {/* Painel de filtros */}
          {finShowFilter && (
            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">Período</p>
                  {(finTipo !== "todos" || finCasa !== "todos" || finPeriodo !== "todos") && (
                    <button
                      onClick={() => { setFinTipo("todos"); setFinCasa("todos"); setFinPeriodo("todos"); setFinCustomDate(""); setFinCustomFrom(""); setFinCustomTo("") }}
                      className="flex items-center gap-1 text-xs text-[var(--text-muted)] hover:text-[#DC2626] transition-colors"
                    >
                      <X className="h-3 w-3" /> Limpar
                    </button>
                  )}
                </div>
                {/* Período */}
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2">
                    {(["todos", "hoje", "semana", "mes", "ano"] as const).map(p => (
                      <button key={p} onClick={() => setFinPeriodo(p)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                          finPeriodo === p
                            ? "bg-[#1e3a8a] border-[#1e3a8a] text-white"
                            : "border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]"
                        }`}>
                        {{ todos: "Todos", hoje: "Hoje", semana: "Semana", mes: "Mês", ano: "Ano" }[p]}
                      </button>
                    ))}
                    <button
                      onClick={() => setFinPeriodo("custom")}
                      title="Data personalizada"
                      className={`flex items-center justify-center w-[34px] h-[34px] rounded-lg transition-colors border ${
                        finPeriodo === "custom"
                          ? "bg-[#1e3a8a] border-[#1e3a8a] text-white"
                          : "border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]"
                      }`}
                    >
                      <CalendarIcon className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  {finPeriodo === "custom" && (
                    <div className="space-y-2">
                      <div className="flex gap-1 p-0.5 bg-[var(--bg-elevated)] rounded-lg w-fit">
                        <button onClick={() => setFinCustomMode("single")} className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${finCustomMode === "single" ? "bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-sm" : "text-[var(--text-secondary)]"}`}>Data</button>
                        <button onClick={() => setFinCustomMode("range")} className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${finCustomMode === "range" ? "bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-sm" : "text-[var(--text-secondary)]"}`}>Intervalo</button>
                      </div>
                      {finCustomMode === "single" ? (
                        <Input type="date" value={finCustomDate} onChange={e => setFinCustomDate(e.target.value)} className="text-xs h-8 max-w-[160px]" />
                      ) : (
                        <div className="flex items-center gap-2">
                          <Input type="date" value={finCustomFrom} onChange={e => setFinCustomFrom(e.target.value)} className="text-xs h-8 max-w-[140px]" />
                          <span className="text-[var(--text-muted)] text-xs">até</span>
                          <Input type="date" value={finCustomTo} onChange={e => setFinCustomTo(e.target.value)} className="text-xs h-8 max-w-[140px]" />
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {/* Tipo */}
                <div className="flex flex-wrap gap-1">
                  {([
                    { value: "todos",    label: "Todos",    active: "border-[#2563EB] bg-[#2563EB]/10 text-[#2563EB]" },
                    { value: "deposito", label: "Depósito", active: "border-[#1e3a8a] bg-[#1e3a8a]/10 text-[var(--accent-text)]" },
                    { value: "saque",    label: "Saque",    active: "border-[#DC2626] bg-[#DC2626]/10 text-[#DC2626]" },
                    { value: "lucro",    label: "Lucro",    active: "border-green-500 bg-green-500/10 text-green-500" },
                    { value: "perda",    label: "Perda",    active: "border-orange-500 bg-orange-500/10 text-orange-500" },
                    { value: "bonus",    label: "Bônus",    active: "border-purple-500 bg-purple-500/10 text-purple-500" },
                  ] as { value: "todos" | "deposito" | "saque" | "lucro" | "perda" | "bonus"; label: string; active: string }[]).map(({ value, label, active }) => (
                    <button key={value} onClick={() => setFinTipo(value)}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                        finTipo === value ? active : "border-[var(--border)] text-[var(--text-secondary)]"
                      }`}>
                      {label}
                    </button>
                  ))}
                </div>
                {/* Casa */}
                {profileBetsFinanceiro.length > 0 && (
                  <div>
                    <p className="text-xs text-[var(--text-muted)] mb-1 font-medium">Bet</p>
                    <select value={finCasa} onChange={e => setFinCasa(e.target.value)}
                      className="w-full h-9 px-3 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-primary)] text-sm">
                      <option value="todos">Todas as casas</option>
                      {profileBetsFinanceiro.map(pb => (
                        <option key={pb.id} value={pb.id}>{pb.bet?.nome ?? pb.id}</option>
                      ))}
                    </select>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Resumo */}
          <div className="grid grid-cols-3 gap-2">
            <Card>
              <CardContent className="p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <ArrowDownLeft className="h-3.5 w-3.5 text-[var(--accent-text)]" />
                  <span className="text-xs text-[var(--text-secondary)]">Depósitos</span>
                </div>
                <p className="text-sm font-bold text-[var(--accent-text)]">{formatCurrency(totalDepositos)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <ArrowUpRight className="h-3.5 w-3.5 text-[#DC2626]" />
                  <span className="text-xs text-[var(--text-secondary)]">Saques</span>
                </div>
                <p className="text-sm font-bold text-[#DC2626]">{formatCurrency(totalSaques)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <DollarSign className="h-3.5 w-3.5 text-[#2563EB]" />
                  <span className="text-xs text-[var(--text-secondary)]">Líquido</span>
                </div>
                <p className="text-sm font-bold text-[#2563EB]">{formatCurrency(saldoLiquido)}</p>
              </CardContent>
            </Card>
          </div>

          {/* Extrato bancário */}
          {!movLoaded ? (
            <Card><CardContent className="py-8 text-center text-[var(--text-secondary)] text-sm">Carregando...</CardContent></Card>
          ) : (() => {
            type Item = { id: string; created_at: string; tipo: string; valor: number; betNome?: string; descricao?: string | null }
            const allItems: Item[] = [
              ...finFiltered.map(m => ({
                id: m.id,
                created_at: m.created_at,
                tipo: m.tipo,
                valor: m.valor,
                betNome: (m.profile_bet as MovimentacaoFinanceira["profile_bet"])?.bet?.nome,
                descricao: m.descricao,
              })),
              ...bonusFiltered.map(b => ({
                id: `bonus-${b.id}`,
                created_at: b.created_at,
                tipo: "bonus",
                valor: b.valor,
                betNome: profileBetsFinanceiro.find(pb => pb.id === b.profile_bet_id)?.bet?.nome,
                descricao: b.descricao,
              })),
            ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

            if (allItems.length === 0) {
              return (
                <div className="space-y-2">
                  <div className="flex justify-end">
                    <button
                      onClick={() => setFinShowFilter(v => !v)}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium transition-colors ${
                        finShowFilter || finTipo !== "todos" || finCasa !== "todos"
                          ? "bg-[#1e3a8a]/10 border-[#1e3a8a]/30 text-[var(--accent-text)]"
                          : "border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]"
                      }`}
                    >
                      {finShowFilter ? <X className="w-3 h-3" /> : <SlidersHorizontal className="w-3 h-3" />}
                      Filtrar{(finTipo !== "todos" || finCasa !== "todos") && !finShowFilter ? " •" : ""}
                    </button>
                  </div>
                  <Card><CardContent className="py-8 text-center text-[var(--text-secondary)] text-sm">Nenhuma movimentação encontrada</CardContent></Card>
                </div>
              )
            }

            const groupMap = new Map<string, Item[]>()
            for (const item of allItems) {
              const key = item.created_at.slice(0, 10)
              if (!groupMap.has(key)) groupMap.set(key, [])
              groupMap.get(key)!.push(item)
            }
            const groups = Array.from(groupMap.entries()).sort((a, b) => b[0].localeCompare(a[0]))

            function fmtDate(iso: string) {
              return new Date(iso + "T12:00:00").toLocaleDateString("pt-BR", { day: "numeric", month: "short" }).replace(".", "")
            }
            function fmtHora(iso: string) {
              return new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
            }
            function tLabel(tipo: string) {
              return tipo === "deposito" ? "Depósito" : tipo === "saque" ? "Saque" : tipo === "lucro" ? "Lucro" : tipo === "perda" ? "Perda" : "Bônus"
            }
            function tColor(tipo: string) {
              return tipo === "saque" ? "text-[#DC2626]" : tipo === "perda" ? "text-orange-500" : tipo === "lucro" ? "text-green-500" : tipo === "bonus" ? "text-purple-500" : "text-[var(--accent-text)]"
            }
            function tBg(tipo: string) {
              return tipo === "saque" ? "bg-[#DC2626]/10" : tipo === "perda" ? "bg-orange-500/10" : tipo === "lucro" ? "bg-green-500/10" : tipo === "bonus" ? "bg-purple-500/10" : "bg-[#1e3a8a]/10"
            }
            function tIcon(tipo: string) {
              if (tipo === "deposito") return <ArrowDownLeft className="h-5 w-5 text-[var(--accent-text)]" />
              if (tipo === "lucro")    return <TrendingUp    className="h-5 w-5 text-green-500" />
              if (tipo === "perda")   return <ArrowUpRight  className="h-5 w-5 text-orange-500" />
              if (tipo === "bonus")   return <Gift          className="h-5 w-5 text-purple-500" />
              return                         <ArrowUpRight  className="h-5 w-5 text-[#DC2626]" />
            }

            return (
              <div className="space-y-4">
                {groups.map(([dateKey, items], groupIdx) => (
                  <div key={dateKey}>
                    <div className="flex items-center justify-between px-1 mb-2">
                      <p className="text-xs font-semibold text-[var(--text-muted)]">{fmtDate(dateKey)}</p>
                      {groupIdx === 0 && (
                        <button
                          onClick={() => setFinShowFilter(v => !v)}
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium transition-colors ${
                            finShowFilter || finTipo !== "todos" || finCasa !== "todos"
                              ? "bg-[#1e3a8a]/10 border-[#1e3a8a]/30 text-[var(--accent-text)]"
                              : "border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]"
                          }`}
                        >
                          {finShowFilter ? <X className="w-3 h-3" /> : <SlidersHorizontal className="w-3 h-3" />}
                          Filtrar{(finTipo !== "todos" || finCasa !== "todos") && !finShowFilter ? " •" : ""}
                        </button>
                      )}
                    </div>
                    <Card>
                      <CardContent className="p-0 divide-y divide-[var(--border)]">
                        {items.map(item => (
                          <div key={item.id} className="flex items-center gap-3 px-4 py-3.5">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${tBg(item.tipo)}`}>
                              {tIcon(item.tipo)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{item.betNome ?? "—"}</p>
                              {item.tipo === "perda" && item.descricao?.startsWith("Aposta: ") && (
                                <p className="text-xs text-[var(--text-secondary)] truncate">{item.descricao.replace("Aposta: ", "")}</p>
                              )}
                              <p className="text-xs text-[var(--text-muted)] truncate">
                                {fmtHora(item.created_at)}{item.descricao && !item.descricao.startsWith("Aposta: ") ? ` · ${item.descricao}` : ""}
                              </p>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className={`text-sm font-bold ${tColor(item.tipo)}`}>
                                {item.tipo === "saque" || item.tipo === "perda" ? "-" : "+"}{formatCurrency(item.valor)}
                              </p>
                              <p className="text-xs text-[var(--text-muted)]">{tLabel(item.tipo)}</p>
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  </div>
                ))}
                <p className="text-xs text-[var(--text-muted)] text-center pb-2">{allItems.length} movimentaç{allItems.length !== 1 ? "ões" : "ão"}</p>
              </div>
            )
          })()}
        </TabsContent>

        </div> {/* end swipe wrapper */}
      </Tabs>

      {/* Modal nova movimentação — fora dos tabs para funcionar em qualquer aba */}
      <Dialog open={finShowForm} onOpenChange={open => { if (!open) { setFinShowForm(false); setFinFormBet(""); setFinFormTipo("deposito"); setFinFormValor(""); setFinFormDescricao("") } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Movimentação</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Tipo</Label>
                <Select value={finFormTipo} onValueChange={v => setFinFormTipo(v as "deposito" | "saque" | "bonus" | "lucro" | "perda")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="deposito">Depósito</SelectItem>
                    <SelectItem value="saque">Saque</SelectItem>
                    <SelectItem value="lucro">Lucro externo</SelectItem>
                    <SelectItem value="perda">Perda</SelectItem>
                    <SelectItem value="bonus">Bônus</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Valor (R$)</Label>
                <Input placeholder="0,00" value={finFormValor} onChange={e => setFinFormValor(formatBRL(e.target.value))} />
              </div>
            </div>
            {finFormTipo === "perda" && (
              <div className="flex items-start gap-2.5 rounded-xl bg-orange-500/10 border border-orange-500/20 px-4 py-3">
                <ArrowDownLeft className="h-4 w-4 text-orange-400 shrink-0 mt-0.5" />
                <p className="text-xs text-orange-300 leading-relaxed">Registre perdas que <strong>não vieram de surebets</strong>. O valor é <strong>subtraído</strong> do saldo da casa selecionada.</p>
              </div>
            )}
            {finFormTipo === "lucro" && (
              <div className="flex items-start gap-2.5 rounded-xl bg-green-500/10 border border-green-500/20 px-4 py-3">
                <TrendingUp className="h-4 w-4 text-green-400 shrink-0 mt-0.5" />
                <p className="text-xs text-green-300 leading-relaxed">Registre lucros que <strong>não vieram de surebets</strong>. O valor é somado ao saldo da casa selecionada.</p>
              </div>
            )}
            {finFormTipo === "bonus" && (
              <div className="flex items-start gap-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 px-4 py-3">
                <Gift className="h-4 w-4 text-purple-400 shrink-0 mt-0.5" />
                <p className="text-xs text-purple-300 leading-relaxed">O bônus é registrado <strong>separadamente</strong> e não entra no cálculo do saldo líquido.</p>
              </div>
            )}
            {profileBetsFinanceiro.length > 0 && (
              <div className="space-y-1.5">
                <Label>Bet (opcional)</Label>
                <Select value={finFormBet} onValueChange={setFinFormBet}>
                  <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Nenhuma</SelectItem>
                    {profileBetsFinanceiro.map(pb => (
                      <SelectItem key={pb.id} value={pb.id}>{pb.bet?.nome ?? pb.id}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-1.5">
              <Label>Descrição (opcional)</Label>
              <Input placeholder="Ex: Depósito inicial" value={finFormDescricao} onChange={e => setFinFormDescricao(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFinShowForm(false)}>Cancelar</Button>
            <Button onClick={handleFinSave} disabled={finSaving}>{finSaving ? "Salvando..." : "Salvar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Alerta mínimo de bets */}
      <Dialog open={minBetsAlertOpen} onOpenChange={setMinBetsAlertOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bets insuficientes</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-[var(--text-secondary)]">
            Para registrar uma aposta é necessário ter pelo menos <strong className="text-[var(--text-primary)]">2 casas de apostas</strong> cadastradas neste perfil.
          </p>
          <p className="text-sm text-[var(--text-secondary)]">
            Vá até a aba <strong className="text-[var(--text-primary)]">Bets</strong> e adicione as casas antes de criar uma aposta.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMinBetsAlertOpen(false)}>Fechar</Button>
            <Button
              onClick={() => {
                setMinBetsAlertOpen(false)
                document.querySelector<HTMLButtonElement>('[data-value="casas"]')?.click()
              }}
            >
              Ir para Bets
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Calculadora — Sheet mobile */}
      <Sheet open={showCalculadoraSheet} onOpenChange={setShowCalculadoraSheet}>
        <SheetContent
          side="bottom"
          className="h-[70vh] flex flex-col p-0 rounded-t-2xl"
          onTouchStart={e => { (e.currentTarget as any)._swipeY = e.touches[0].clientY }}
          onTouchEnd={e => {
            const startY = (e.currentTarget as any)._swipeY
            if (startY !== undefined && e.changedTouches[0].clientY - startY > 80) setShowCalculadoraSheet(false)
          }}
        >
          <SheetHeader className="px-5 pt-5 pb-3 border-b border-[var(--border)] flex-shrink-0">
            <SheetTitle className="flex items-center gap-2">
              <Calculator className="h-4 w-4 text-[var(--accent-text)]" />
              Nova Aposta — {currentProfile.apelido ?? `${currentProfile.nome} ${currentProfile.sobrenome}`}
            </SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-5 py-4">
            <SurebetCalculator
              profiles={[currentProfile]}
              defaultProfileId={currentProfile.id}
              profileName={currentProfile.apelido ?? `${currentProfile.nome} ${currentProfile.sobrenome}`}
              onSaved={async () => {
                setShowCalculadoraSheet(false)
                const supabase = createClient()
                const { data } = await supabase
                  .from("apostas")
                  .select("*, legs:aposta_legs(*, profile_bet:profile_bets(*, bet:bets(*)))")
                  .eq("profile_id", currentProfile.id)
                  .order("created_at", { ascending: false })
                if (data) setCurrentApostas(data)
              }}
            />
          </div>
        </SheetContent>
      </Sheet>

      {/* Calculadora — Dialog desktop */}
      <Dialog open={showCalculadoraModal} onOpenChange={setShowCalculadoraModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5 text-[var(--accent-text)]" />
              Nova Aposta — {currentProfile.apelido ?? `${currentProfile.nome} ${currentProfile.sobrenome}`}
            </DialogTitle>
          </DialogHeader>
          <SurebetCalculator
            profiles={[currentProfile]}
            defaultProfileId={currentProfile.id}
            profileName={currentProfile.apelido ?? `${currentProfile.nome} ${currentProfile.sobrenome}`}
            onSaved={async () => {
              setShowCalculadoraModal(false)
              const supabase = createClient()
              const { data } = await supabase
                .from("apostas")
                .select("*, legs:aposta_legs(*, profile_bet:profile_bets(*, bet:bets(*)))")
                .eq("profile_id", currentProfile.id)
                .order("created_at", { ascending: false })
              if (data) setCurrentApostas(data)
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Finalizar Dialog */}
      <Dialog open={!!finalizarDialog} onOpenChange={open => { if (!open) { setFinalizarDialog(null); setGreenLegId(null) } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Finalizar Aposta</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm font-medium text-[var(--text-primary)]">{finalizarDialog?.evento}</p>
            <div className="space-y-2">
              <Label>Qual casa deu green?</Label>
              <div className="space-y-2">
                {(finalizarDialog?.legs ?? []).map(leg => (
                  <button
                    key={leg.id}
                    onClick={() => setGreenLegId(leg.id)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all text-left ${
                      greenLegId === leg.id
                        ? "border-green-500 bg-green-500/10"
                        : "border-[var(--border)] bg-[var(--bg-surface)] hover:border-[#1e3a8a]/40"
                    }`}
                  >
                    <div>
                      <p className={`font-semibold text-sm ${greenLegId === leg.id ? "text-green-600" : "text-[var(--text-primary)]"}`}>
                        {(leg as any).profile_bet?.bet?.nome ?? "Bet"}
                      </p>
                      <p className="text-xs text-[var(--text-secondary)]">@{Number(leg.odd).toFixed(2)} · {formatCurrency(leg.stake)}</p>
                    </div>
                    {greenLegId === leg.id && <Check className="w-4 h-4 text-green-600 flex-shrink-0" />}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setFinalizarDialog(null); setGreenLegId(null) }}>Cancelar</Button>
            <Button onClick={handleFinalizar} disabled={finalizando || !greenLegId}>
              {finalizando ? "Finalizando..." : "Confirmar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
