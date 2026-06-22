"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import AddBetToProfile from "@/components/AddBetToProfile"
import { formatCurrency } from "@/lib/utils"
import { useToast } from "@/hooks/useToast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DollarSign, TrendingUp, Clock, ArrowUpRight, Pencil, Calculator, ArrowDownCircle, ArrowUpCircle } from "lucide-react"
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
  const [togglingAtivo, setTogglingAtivo] = useState(false)
  const [confirmAtivoOpen, setConfirmAtivoOpen] = useState(false)
  const [currentApostas, setCurrentApostas] = useState(apostas)
  const [showCalculadora, setShowCalculadora] = useState(false)
  const [minBetsAlertOpen, setMinBetsAlertOpen] = useState(false)
  const [finalizarDialog, setFinalizarDialog] = useState<Aposta | null>(null)
  const [periodoFiltro, setPeriodoFiltro] = useState<"dia" | "semana" | "mes" | "ano">("dia")
  const [casaFiltro, setCasaFiltro] = useState<string>("todas")
  const [resultadoReal, setResultadoReal] = useState("")
  const [finalizando, setFinalizando] = useState(false)
  // Financeiro tab state
  const [movimentacoes, setMovimentacoes] = useState<MovimentacaoFinanceira[]>([])
  const [movLoaded, setMovLoaded] = useState(false)
  const [profileBetsFinanceiro, setProfileBetsFinanceiro] = useState<(ProfileBet & { bet?: { id: string; nome: string } })[]>([])
  const [finPeriodo, setFinPeriodo] = useState<"hoje" | "semana" | "mes" | "todos">("mes")
  const [finTipo, setFinTipo] = useState<"todos" | "deposito" | "saque">("todos")
  const [finCasa, setFinCasa] = useState("todos")
  const [finShowForm, setFinShowForm] = useState(false)
  const [finFormBet, setFinFormBet] = useState("")
  const [finFormTipo, setFinFormTipo] = useState<"deposito" | "saque">("deposito")
  const [finFormValor, setFinFormValor] = useState("")
  const [finFormDescricao, setFinFormDescricao] = useState("")
  const [finSaving, setFinSaving] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

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

  async function handleToggleAtivo() {
    setTogglingAtivo(true)
    const novoAtivo = !currentProfile.ativo
    const { error } = await supabase
      .from("profiles")
      .update({ ativo: novoAtivo, updated_at: new Date().toISOString() })
      .eq("id", currentProfile.id)
    if (error) {
      toast({ title: "Erro ao atualizar status", variant: "destructive" })
    } else {
      setCurrentProfile(prev => ({ ...prev, ativo: novoAtivo }))
      toast({ title: novoAtivo ? "Perfil ativado" : "Perfil desativado" })
    }
    setTogglingAtivo(false)
  }

  async function loadMovimentacoes() {
    const [movRes, betsRes] = await Promise.all([
      supabase
        .from("movimentacoes_financeiras")
        .select("*, profile_bet:profile_bets(*, bet:bets(*))")
        .eq("profile_id", profile.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("profile_bets")
        .select("*, bet:bets(*)")
        .eq("profile_id", profile.id)
    ])
    if (movRes.data) setMovimentacoes(movRes.data as MovimentacaoFinanceira[])
    if (betsRes.data) setProfileBetsFinanceiro(betsRes.data as (ProfileBet & { bet?: { id: string; nome: string } })[])
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
    }
    if (finTipo !== "todos" && m.tipo !== finTipo) return false
    if (finCasa !== "todos" && m.profile_bet_id !== finCasa) return false
    return true
  })

  const totalDepositos = finFiltered.filter(m => m.tipo === "deposito").reduce((s, m) => s + m.valor, 0)
  const totalSaques = finFiltered.filter(m => m.tipo === "saque").reduce((s, m) => s + m.valor, 0)
  const saldoLiquido = totalDepositos - totalSaques

  async function handleFinSave() {
    const valor = parseBRL(finFormValor)
    if (!valor || valor <= 0) {
      toast({ title: "Informe um valor válido", variant: "destructive" })
      return
    }
    setFinSaving(true)
    const { error } = await supabase.from("movimentacoes_financeiras").insert({
      profile_id: profile.id,
      profile_bet_id: finFormBet || null,
      tipo: finFormTipo,
      valor,
      descricao: finFormDescricao.trim() || null,
    })
    if (error) {
      toast({ title: "Erro ao registrar movimentação", variant: "destructive" })
    } else {
      // Atualiza saldo do profile_bet vinculado
      if (finFormBet) {
        const { data: movs } = await supabase
          .from("movimentacoes_financeiras")
          .select("tipo, valor")
          .eq("profile_bet_id", finFormBet)
        const saldoReal = (movs ?? []).reduce((acc, m) => acc + (m.tipo === "deposito" ? m.valor : -m.valor), 0)
        await supabase.from("profile_bets").update({ saldo: saldoReal }).eq("id", finFormBet)
      }
      toast({ title: "Movimentação registrada!" })
      setFinShowForm(false)
      setFinFormBet("")
      setFinFormTipo("deposito")
      setFinFormValor("")
      setFinFormDescricao("")
      await loadMovimentacoes()
      router.refresh()
    }
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
    setFinalizando(true)
    const valor = parseBRL(resultadoReal)
    if (isNaN(valor)) {
      toast({ title: "Valor inválido", variant: "destructive" })
      setFinalizando(false)
      return
    }
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
      setCurrentApostas(prev =>
        prev.map(a => a.id === finalizarDialog.id
          ? { ...a, status: "finalizada" as const, resultado_real: valor, finalizada_at: new Date().toISOString() }
          : a
        )
      )
      toast({ title: "Aposta finalizada com sucesso!" })
      setFinalizarDialog(null)
      setResultadoReal("")
    }
    setFinalizando(false)
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
                {currentProfile.nome} {currentProfile.sobrenome}
              </h1>
              {currentProfile.apelido && (
                <p className="text-sm text-[var(--text-secondary)] truncate">{currentProfile.apelido}</p>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            onClick={async () => {
              const { data } = await createClient()
                .from("profile_bets")
                .select("id")
                .eq("profile_id", currentProfile.id)
              if (!data || data.length < 2) {
                setMinBetsAlertOpen(true)
              } else {
                setShowCalculadora(true)
              }
            }}
            size="sm"
            className="flex-1 sm:flex-none"
          >
            <Calculator className="h-4 w-4 mr-2" />
            Nova Aposta
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setConfirmAtivoOpen(true)}
            className={`flex-1 sm:flex-none ${currentProfile.ativo
              ? "text-[var(--accent-text)] border-[#1e3a8a]/40 hover:bg-[#1e3a8a]/5"
              : "text-[#DC2626] border-[#DC2626]/40 hover:bg-[#DC2626]/5"
            }`}
          >
            <span className={`w-2 h-2 rounded-full mr-2 ${currentProfile.ativo ? "bg-[#1e3a8a]" : "bg-[#DC2626]"}`} />
            {currentProfile.ativo ? "Ativo" : "Inativo"}
          </Button>
          <Link href={`/perfis/${profile.id}/editar`} className="flex-1 sm:flex-none">
            <Button variant="outline" size="sm" className="w-full">
              <Pencil className="h-4 w-4 mr-2" />
              Editar
            </Button>
          </Link>
        </div>
      </div>

      <Tabs defaultValue="dashboard">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="casas">Bets</TabsTrigger>
          <TabsTrigger value="financeiro" onClick={() => { if (!movLoaded) loadMovimentacoes() }}>Financeiro</TabsTrigger>
        </TabsList>

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
                                <div key={leg.id} className={`text-xs rounded-lg px-2 py-2 flex items-center gap-2 ${
                                  isGreen ? "bg-[#1e3a8a]/5" : isRed ? "bg-[#DC2626]/5" : "bg-[var(--bg-elevated)]"
                                }`}>
                                  {/* Info: casa + evento + odd/stake */}
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                                      <span className={`font-medium flex-shrink-0 ${isGreen ? "text-[var(--accent-text)]" : isRed ? "text-[#DC2626]" : "text-[var(--text-secondary)]"}`}>
                                        {leg.profile_bet?.bet?.nome ?? "Casa"}
                                      </span>
                                      <span className="text-[var(--text-secondary)] truncate">{leg.resultado_apostado}</span>
                                    </div>
                                    <p className="text-[var(--text-muted)] mt-0.5">
                                      @{Number(leg.odd).toFixed(2)} · {formatCurrency(leg.stake)}
                                    </p>
                                  </div>
                                  {/* GREEN / RED badge no canto direito */}
                                  {(isGreen || isRed) && (
                                    <span className={`px-2 py-1 rounded-lg text-[10px] font-bold flex-shrink-0 ${
                                      isGreen ? "bg-[#1e3a8a] text-white" : "bg-[#DC2626] text-white"
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
        <TabsContent value="casas">
          <Card>
            <CardContent className="p-6">
              <AddBetToProfile profileId={profile.id} userToken={userToken} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Financeiro Tab */}
        <TabsContent value="financeiro" className="space-y-4">
          {/* Summary cards */}
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-[var(--text-secondary)] mb-1">Depositado</p>
                <p className="text-lg font-bold text-[var(--accent-text)]">{formatCurrency(totalDepositos)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-[var(--text-secondary)] mb-1">Sacado</p>
                <p className="text-lg font-bold text-[#DC2626]">{formatCurrency(totalSaques)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-[var(--text-secondary)] mb-1">Saldo Líquido</p>
                <p className={`text-lg font-bold ${saldoLiquido >= 0 ? "text-[var(--accent-text)]" : "text-[#DC2626]"}`}>{formatCurrency(saldoLiquido)}</p>
              </CardContent>
            </Card>
          </div>

          {/* Filters + Add button */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex gap-1 bg-[var(--bg-elevated)] rounded-lg p-1">
              {(["hoje", "semana", "mes", "todos"] as const).map(p => (
                <button key={p} onClick={() => setFinPeriodo(p)}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${finPeriodo === p ? "bg-[var(--bg-surface)] text-[var(--accent-text)] shadow-sm border border-[var(--border)]" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"}`}>
                  {p === "hoje" ? "Hoje" : p === "semana" ? "Semana" : p === "mes" ? "Mês" : "Todos"}
                </button>
              ))}
            </div>
            <div className="flex gap-1">
              {(["todos", "deposito", "saque"] as const).map(t => (
                <button key={t} onClick={() => setFinTipo(t)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium border transition-colors ${finTipo === t
                    ? t === "deposito" ? "bg-[#1e3a8a] text-white border-[#1e3a8a]"
                      : t === "saque" ? "bg-[#DC2626] text-white border-[#DC2626]"
                      : "bg-[var(--bg-surface)] text-[var(--text-primary)] border-[var(--border)]"
                    : "bg-transparent text-[var(--text-secondary)] border-[var(--border)] hover:text-[var(--text-primary)]"}`}>
                  {t === "todos" ? "Todos" : t === "deposito" ? "Depósito" : "Saque"}
                </button>
              ))}
            </div>
            {profileBetsFinanceiro.length > 0 && (
              <select value={finCasa} onChange={e => setFinCasa(e.target.value)}
                className="h-8 px-2 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-primary)] text-xs">
                <option value="todos">Todas as casas</option>
                {profileBetsFinanceiro.map(pb => (
                  <option key={pb.id} value={pb.id}>{pb.bet?.nome ?? pb.id}</option>
                ))}
              </select>
            )}
          </div>

          {/* Modal form */}
          <Dialog open={finShowForm} onOpenChange={open => { if (!open) { setFinShowForm(false); setFinFormBet(""); setFinFormTipo("deposito"); setFinFormValor(""); setFinFormDescricao("") } }}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nova Movimentação</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Tipo</Label>
                    <Select value={finFormTipo} onValueChange={v => setFinFormTipo(v as "deposito" | "saque")}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="deposito">Depósito</SelectItem>
                        <SelectItem value="saque">Saque</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Valor (R$)</Label>
                    <Input placeholder="0,00" value={finFormValor}
                      onChange={e => setFinFormValor(formatBRL(e.target.value))} />
                  </div>
                </div>
                {profileBetsFinanceiro.length > 0 && (
                  <div className="space-y-1.5">
                    <Label>Casa de apostas (opcional)</Label>
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
                  <Input placeholder="Ex: Depósito inicial" value={finFormDescricao}
                    onChange={e => setFinFormDescricao(e.target.value)} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setFinShowForm(false)}>Cancelar</Button>
                <Button onClick={handleFinSave} disabled={finSaving}>
                  {finSaving ? "Salvando..." : "Salvar"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* List */}
          {!movLoaded ? (
            <Card><CardContent className="py-8 text-center text-[var(--text-secondary)] text-sm">Carregando...</CardContent></Card>
          ) : finFiltered.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-[var(--text-secondary)] text-sm">Nenhuma movimentação encontrada</CardContent></Card>
          ) : (
            <div className="space-y-2">
              {finFiltered.map(m => (
                <Card key={m.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${m.tipo === "deposito" ? "bg-[#1e3a8a]/10" : "bg-[#DC2626]/10"}`}>
                        {m.tipo === "deposito"
                          ? <ArrowDownCircle className="h-4 w-4 text-[var(--accent-text)]" />
                          : <ArrowUpCircle className="h-4 w-4 text-[#DC2626]" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[var(--text-primary)]">
                          {m.tipo === "deposito" ? "Depósito" : "Saque"}
                          {(m.profile_bet as MovimentacaoFinanceira["profile_bet"])?.bet?.nome && (
                            <span className="ml-2 text-xs px-1.5 py-0.5 rounded bg-[var(--bg-elevated)] text-[var(--text-secondary)]">
                              {(m.profile_bet as MovimentacaoFinanceira["profile_bet"])?.bet?.nome}
                            </span>
                          )}
                        </p>
                        {m.descricao && <p className="text-xs text-[var(--text-muted)] truncate">{m.descricao}</p>}
                        <p className="text-xs text-[var(--text-secondary)]">{new Date(m.created_at).toLocaleDateString("pt-BR")}</p>
                      </div>
                      <p className={`text-sm font-bold ${m.tipo === "deposito" ? "text-[var(--accent-text)]" : "text-[#DC2626]"}`}>
                        {m.tipo === "saque" ? "-" : "+"}{formatCurrency(m.valor)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

      </Tabs>

      {/* Confirmar Ativo/Inativo Dialog */}
      <Dialog open={confirmAtivoOpen} onOpenChange={setConfirmAtivoOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {currentProfile.ativo ? "Desativar perfil?" : "Ativar perfil?"}
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-[var(--text-secondary)]">
            {currentProfile.ativo
              ? `O perfil "${currentProfile.apelido ?? `${currentProfile.nome} ${currentProfile.sobrenome}`}" será marcado como inativo. Ele não será excluído e pode ser reativado a qualquer momento.`
              : `O perfil "${currentProfile.apelido ?? `${currentProfile.nome} ${currentProfile.sobrenome}`}" será marcado como ativo novamente.`}
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmAtivoOpen(false)}>Cancelar</Button>
            <Button
              disabled={togglingAtivo}
              className={currentProfile.ativo ? "bg-[#DC2626] hover:bg-red-700" : "bg-[#1e3a8a] hover:bg-[#1e40af]"}
              onClick={async () => {
                await handleToggleAtivo()
                setConfirmAtivoOpen(false)
              }}
            >
              {togglingAtivo ? "Salvando..." : currentProfile.ativo ? "Desativar" : "Ativar"}
            </Button>
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

      {/* Calculadora Dialog */}
      <Dialog open={showCalculadora} onOpenChange={setShowCalculadora}>
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
            onSaved={async () => {
              setShowCalculadora(false)
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
      <Dialog open={!!finalizarDialog} onOpenChange={open => !open && setFinalizarDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Finalizar Aposta</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-[var(--text-secondary)]">
              Informe o resultado real obtido para a aposta <strong>{finalizarDialog?.evento}</strong>.
            </p>
            <div className="space-y-2">
              <Label>Resultado real (R$)</Label>
              <Input
                type="text"
                inputMode="numeric"
                value={resultadoReal}
                onChange={e => setResultadoReal(formatBRL(e.target.value))}
                placeholder="0,00"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFinalizarDialog(null)}>Cancelar</Button>
            <Button onClick={handleFinalizar} disabled={finalizando}>
              {finalizando ? "Finalizando..." : "Confirmar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
