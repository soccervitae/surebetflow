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
import { DollarSign, TrendingUp, Clock, ArrowUpRight, Pencil, Calculator, Gift, ArrowDownLeft, Wallet, SlidersHorizontal, X, Check } from "lucide-react"
import SurebetCalculator from "@/components/SurebetCalculator"
import type { Profile, ProfileDashboard, Aposta, MovimentacaoFinanceira, ProfileBet } from "@/lib/types"

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
  const [finPeriodo, setFinPeriodo] = useState<"hoje" | "semana" | "mes" | "ano" | "todos">("mes")
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
  const finFiltered = movimentacoes.filter(m => {
    const date = new Date(m.created_at)
    if (finPeriodo === "hoje") {
      if (date.toDateString() !== nowFin.toDateString()) return false
    } else if (finPeriodo === "semana") {
      const semanaAtras = new Date(nowFin); semanaAtras.setDate(nowFin.getDate() - 7)
      if (date < semanaAtras) return false
    } else if (finPeriodo === "mes") {
      if (date.getMonth() !== nowFin.getMonth() || date.getFullYear() !== nowFin.getFullYear()) return false
    } else if (finPeriodo === "ano") {
      if (date.getFullYear() !== nowFin.getFullYear()) return false
    }
    if (finTipo !== "todos" && m.tipo !== finTipo) return false
    if (finCasa !== "todos" && m.profile_bet_id !== finCasa) return false
    return true
  })

  // Filtrar bonus entries
  const bonusFiltered = bonusEntries.filter(b => {
    const date = new Date(b.created_at)
    if (finPeriodo === "hoje") { if (date.toDateString() !== nowFin.toDateString()) return false }
    else if (finPeriodo === "semana") { const s = new Date(nowFin); s.setDate(nowFin.getDate() - 7); if (date < s) return false }
    else if (finPeriodo === "mes") { if (date.getMonth() !== nowFin.getMonth() || date.getFullYear() !== nowFin.getFullYear()) return false }
    else if (finPeriodo === "ano") { if (date.getFullYear() !== nowFin.getFullYear()) return false }
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
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Avatar className="h-10 w-10 flex-shrink-0">
              {currentProfile.foto_url && <AvatarImage src={currentProfile.foto_url} />}
              <AvatarFallback>
                {currentProfile.nome.charAt(0)}{currentProfile.sobrenome.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <h1 className="text-lg font-bold text-[var(--text-primary)] truncate">
                {currentProfile.apelido || `${currentProfile.nome} ${currentProfile.sobrenome}`}
              </h1>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                currentProfile.ativo ? "bg-green-500/10 text-green-600" : "bg-red-500/10 text-red-500"
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${currentProfile.ativo ? "bg-green-500" : "bg-red-500"}`} />
                {currentProfile.ativo ? "Ativo" : "Inativo"}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Mobile: abre Sheet */}
          <Button
            onClick={async () => {
              const { data } = await createClient()
                .from("profile_bets")
                .select("id")
                .eq("profile_id", currentProfile.id)
              if (!data || data.length < 2) {
                setMinBetsAlertOpen(true)
              } else {
                setShowCalculadoraSheet(true)
              }
            }}
            size="sm"
            className="md:hidden flex-1 sm:flex-none"
          >
            <Calculator className="h-4 w-4 mr-2" />
            Nova Aposta
          </Button>
          {/* Desktop: abre Dialog */}
          <Button
            onClick={async () => {
              const { data } = await createClient()
                .from("profile_bets")
                .select("id")
                .eq("profile_id", currentProfile.id)
              if (!data || data.length < 2) {
                setMinBetsAlertOpen(true)
              } else {
                setShowCalculadoraModal(true)
              }
            }}
            size="sm"
            className="hidden md:flex flex-1 sm:flex-none"
          >
            <Calculator className="h-4 w-4 mr-2" />
            Nova Aposta
          </Button>
          <Link href={`/perfis/${profile.id}/editar`} className="flex-1 sm:flex-none">
            <Button variant="outline" size="sm" className="w-full">
              <Pencil className="h-4 w-4 mr-2" />
              Editar
            </Button>
          </Link>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={changeTab}>
        {/* Mobile: full-width centered tabs */}
        <div className="-mx-4 md:hidden">
          <div className="flex border-b border-[var(--border)]">
            {[
              { value: "dashboard", label: "Dashboard" },
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
        {/* Desktop: botões */}
        <div className="hidden md:flex items-center gap-2">
          {[
            { value: "dashboard", label: "Dashboard" },
            { value: "casas", label: "Bets" },
            { value: "financeiro", label: "Financeiro" },
          ].map(tab => (
            <Button
              key={tab.value}
              size="sm"
              variant={activeTab === tab.value ? "default" : "outline"}
              onClick={() => changeTab(tab.value)}
            >
              {tab.label}
            </Button>
          ))}
        </div>

        {/* Swipe wrapper (mobile) */}
        <div onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="p-2 bg-[#2563EB]/10 rounded-lg flex-shrink-0">
                    <DollarSign className="h-4 w-4 text-[#2563EB]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-[var(--text-secondary)] truncate">Saldo Total</p>
                    <p className="text-sm font-bold text-[var(--text-primary)] truncate">{formatCurrency(dashboard?.saldo_total ?? 0)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="p-2 bg-[#1e3a8a]/10 rounded-lg flex-shrink-0">
                    <TrendingUp className="h-4 w-4 text-[var(--accent-text)]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-[var(--text-secondary)] truncate">Lucro Realizado</p>
                    <p className="text-sm font-bold text-[var(--accent-text)] truncate">{formatCurrency(dashboard?.lucro_realizado ?? 0)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="p-2 bg-[#D97706]/10 rounded-lg flex-shrink-0">
                    <Clock className="h-4 w-4 text-[#D97706]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-[var(--text-secondary)] truncate">Lucro Pendente</p>
                    <p className="text-sm font-bold text-[#D97706] truncate">{formatCurrency(dashboard?.lucro_pendente ?? 0)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="p-2 bg-[#7C3AED]/10 rounded-lg flex-shrink-0">
                    <ArrowUpRight className="h-4 w-4 text-[#7C3AED]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-[var(--text-secondary)] truncate">ROI</p>
                    <p className="text-sm font-bold text-[#7C3AED] truncate">{(dashboard?.roi_percentual ?? 0).toFixed(2)}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Apostas do período */}
          <div>
            <div className="flex flex-col gap-2 mb-3">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wide">Apostas</h2>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[#1e3a8a]/10 text-[var(--accent-text)]">
                  {apostasFiltradasPeriodo.length}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {casasUnicas.length > 0 && (
                  <select
                    value={casaFiltro}
                    onChange={e => setCasaFiltro(e.target.value)}
                    className="h-8 px-2 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-primary)] text-xs"
                  >
                    <option value="todas">Todas as casas</option>
                    {casasUnicas.map(c => (
                      <option key={c.id} value={c.id}>{c.nome}</option>
                    ))}
                  </select>
                )}
                <div className="flex gap-1 bg-[var(--bg-elevated)] rounded-lg p-1">
                  {([
                    { value: "dia", label: "Dia" },
                    { value: "semana", label: "Sem" },
                    { value: "mes", label: "Mês" },
                    { value: "ano", label: "Ano" },
                  ] as { value: "dia" | "semana" | "mes" | "ano"; label: string }[]).map(({ value, label }) => (
                    <button
                      key={value}
                      onClick={() => setPeriodoFiltro(value)}
                      className={`px-2 py-1 rounded-md text-xs font-medium transition-colors ${
                        periodoFiltro === value
                          ? "bg-[var(--bg-surface)] text-[var(--accent-text)] shadow-sm border border-[var(--border)]"
                          : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            {apostasFiltradasPeriodo.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-[var(--text-secondary)] text-sm">
                  Nenhuma aposta registrada neste período
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {apostasFiltradasPeriodo.map(aposta => {
                  type LegWithBet = { id: string; resultado_apostado: string; odd: number; stake: number; profile_bet?: { bet?: { nome: string } } }
                  const legs = (aposta as Aposta & { legs?: LegWithBet[] }).legs ?? []
                  // Infer green leg from resultado_real
                  const greenLegId = aposta.status === "finalizada" && aposta.resultado_real != null
                    ? legs.find(l => Math.abs(l.stake * l.odd - aposta.investimento_total - aposta.resultado_real!) < 0.5)?.id ?? null
                    : null

                  return (
                  <Link key={aposta.id} href={`/apostas/${aposta.id}`}>
                    <Card className="hover:border-[#1e3a8a]/40 transition-colors cursor-pointer overflow-hidden">
                      <CardContent className="p-4">
                        {/* Linha 1: evento + badges */}
                        <div className="flex items-center gap-2 flex-wrap mb-1 min-w-0">
                          <p className="font-medium text-[var(--text-primary)] truncate">{aposta.evento}</p>
                          {statusBadge(aposta.status)}
                          <Badge variant="secondary">{aposta.tipo}</Badge>
                        </div>
                        <p className="text-xs text-[var(--text-secondary)] mb-2">
                          {new Date(aposta.created_at).toLocaleDateString("pt-BR")}
                        </p>

                        {/* Legs */}
                        {legs.length > 0 && (
                          <div className="space-y-1.5 mb-3">
                            {legs.map(leg => {
                              const isGreen = greenLegId === leg.id
                              const isRed = greenLegId !== null && greenLegId !== leg.id
                              return (
                                <div key={leg.id} className={`rounded-xl px-3 py-3 flex items-center gap-3 ${
                                  isGreen ? "bg-green-500/10" : isRed ? "bg-[#DC2626]/5" : "bg-[var(--bg-elevated)]"
                                }`}>
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
                                    <span className={`px-2.5 py-1 rounded text-xs font-bold flex-shrink-0 ${
                                      isGreen ? "bg-green-600 text-white" : "bg-[#DC2626] text-white"
                                    }`}>
                                      {isGreen ? "GREEN" : "RED"}
                                    </span>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        )}

                        {/* Linha final: Investimento + Lucro lado a lado */}
                        <div className="flex items-end justify-between gap-2 pt-2 border-t border-[var(--border)]">
                          <div>
                            <p className="text-xs text-[var(--text-muted)]">Investimento</p>
                            <p className="text-sm font-bold text-[var(--text-primary)]">{formatCurrency(aposta.investimento_total)}</p>
                          </div>
                          {aposta.status !== "cancelada" && (
                            <div className="text-right">
                              <p className="text-xs text-[var(--text-muted)]">
                                {aposta.status === "finalizada" ? "Lucro" : "Lucro esperado"}
                              </p>
                              {aposta.status === "finalizada" ? (
                                <p className={`text-sm font-bold ${(aposta.resultado_real ?? 0) >= 0 ? "text-[var(--accent-text)]" : "text-[#DC2626]"}`}>
                                  {formatCurrency(aposta.resultado_real ?? 0)}
                                </p>
                              ) : (
                                <p className="text-sm font-bold text-[#D97706]">{formatCurrency(aposta.lucro_garantido)}</p>
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
            )}
          </div>
        </TabsContent>

        {/* Casas Tab */}
        <TabsContent value="casas" className="overflow-hidden">
          <AddBetToProfile profileId={profile.id} userToken={userToken} />
        </TabsContent>

        {/* Financeiro Tab */}
        <TabsContent value="financeiro" className="space-y-4">
          {/* Header com botão Filtrar + Nova Movimentação */}
          <div className="flex items-center justify-between gap-2">
            <button
              onClick={() => setFinShowFilter(v => !v)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm font-medium transition-colors flex-shrink-0 ${
                finShowFilter || finTipo !== "todos" || finCasa !== "todos"
                  ? "bg-[#1e3a8a]/10 border-[#1e3a8a]/30 text-[var(--accent-text)]"
                  : "border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]"
              }`}
            >
              {finShowFilter ? <X className="w-4 h-4" /> : <SlidersHorizontal className="w-4 h-4" />}
              Filtrar{(finTipo !== "todos" || finCasa !== "todos") && !finShowFilter ? " •" : ""}
            </button>
            <button
              onClick={() => setFinShowForm(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[var(--border)] text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] transition-colors"
            >
              + Movimentação
            </button>
          </div>

          {/* Painel de filtros */}
          {finShowFilter && (
            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">Período</p>
                  {(finTipo !== "todos" || finCasa !== "todos" || finPeriodo !== "mes") && (
                    <button
                      onClick={() => { setFinTipo("todos"); setFinCasa("todos"); setFinPeriodo("mes") }}
                      className="flex items-center gap-1 text-xs text-[var(--text-muted)] hover:text-[#DC2626] transition-colors"
                    >
                      <X className="h-3 w-3" /> Limpar
                    </button>
                  )}
                </div>
                {/* Período */}
                <div className="flex gap-1 bg-[var(--bg-elevated)] rounded-lg p-1">
                  {(["hoje", "semana", "mes", "ano", "todos"] as const).map(p => (
                    <button key={p} onClick={() => setFinPeriodo(p)}
                      className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-colors ${
                        finPeriodo === p
                          ? "bg-[var(--bg-surface)] text-[var(--accent-text)] border border-[var(--border)] shadow-sm"
                          : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                      }`}>
                      {p === "hoje" ? "Dia" : p === "semana" ? "Semana" : p === "mes" ? "Mês" : p === "ano" ? "Ano" : "Todos"}
                    </button>
                  ))}
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

          {/* Modal nova movimentação */}
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
              return <Card><CardContent className="py-8 text-center text-[var(--text-secondary)] text-sm">Nenhuma movimentação encontrada</CardContent></Card>
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
                {groups.map(([dateKey, items]) => (
                  <div key={dateKey}>
                    <p className="text-xs font-semibold text-[var(--text-muted)] px-1 mb-2">{fmtDate(dateKey)}</p>
                    <Card>
                      <CardContent className="p-0 divide-y divide-[var(--border)]">
                        {items.map(item => (
                          <div key={item.id} className="flex items-center gap-3 px-4 py-3.5">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${tBg(item.tipo)}`}>
                              {tIcon(item.tipo)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{item.betNome ?? "—"}</p>
                              <p className="text-xs text-[var(--text-muted)] truncate">
                                {fmtHora(item.created_at)}{item.descricao ? ` · ${item.descricao}` : ""}
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
