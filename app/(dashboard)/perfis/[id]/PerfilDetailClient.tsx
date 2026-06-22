"use client"

import { useState } from "react"
import Link from "next/link"
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
import { ArrowLeft, DollarSign, TrendingUp, Clock, ArrowUpRight, Pencil, Calculator, ArrowDownCircle, ArrowUpCircle } from "lucide-react"
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
  const [finalizarDialog, setFinalizarDialog] = useState<Aposta | null>(null)
  const [periodoFiltro, setPeriodoFiltro] = useState<"semana" | "mes" | "ano">("semana")
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
      <div className="flex items-center gap-4">
        <Link href="/perfis">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Avatar className="h-12 w-12">
            {currentProfile.foto_url && <AvatarImage src={currentProfile.foto_url} />}
            <AvatarFallback>
              {currentProfile.nome.charAt(0)}{currentProfile.sobrenome.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-[var(--text-primary)] truncate">
              {currentProfile.nome} {currentProfile.sobrenome}
            </h1>
            {currentProfile.apelido && (
              <p className="text-sm text-[var(--text-secondary)]">{currentProfile.apelido}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setShowCalculadora(true)} size="sm">
            <Calculator className="h-4 w-4 mr-2" />
            Nova Aposta
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setConfirmAtivoOpen(true)}
            className={currentProfile.ativo
              ? "text-[#16A34A] border-[#16A34A]/40 hover:bg-[#16A34A]/5"
              : "text-[#DC2626] border-[#DC2626]/40 hover:bg-[#DC2626]/5"
            }
          >
            <span className={`w-2 h-2 rounded-full mr-2 ${currentProfile.ativo ? "bg-[#16A34A]" : "bg-[#DC2626]"}`} />
            {currentProfile.ativo ? "Ativo" : "Inativo"}
          </Button>
          <Link href={`/perfis/${profile.id}/editar`}>
            <Button variant="outline" size="sm">
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
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#2563EB]/10 rounded-lg">
                    <DollarSign className="h-5 w-5 text-[#2563EB]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-[var(--text-secondary)]">Saldo Total</p>
                    <p className="text-base font-bold text-[var(--text-primary)] truncate">{formatCurrency(dashboard?.saldo_total ?? 0)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#16A34A]/10 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-[#16A34A]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-[var(--text-secondary)]">Lucro Realizado</p>
                    <p className="text-base font-bold text-[#16A34A] truncate">{formatCurrency(dashboard?.lucro_realizado ?? 0)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <Clock className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-[var(--text-secondary)]">Lucro Pendente</p>
                    <p className="text-base font-bold text-yellow-600 truncate">{formatCurrency(dashboard?.lucro_pendente ?? 0)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <ArrowUpRight className="h-5 w-5 text-purple-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-[var(--text-secondary)]">ROI</p>
                    <p className="text-base font-bold text-purple-600 truncate">{(dashboard?.roi_percentual ?? 0).toFixed(2)}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Apostas do período */}
          <div>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
              <h2 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wide">Apostas</h2>
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
                  {(["semana", "mes", "ano"] as const).map(p => (
                    <button
                      key={p}
                      onClick={() => setPeriodoFiltro(p)}
                      className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                        periodoFiltro === p
                          ? "bg-[var(--bg-surface)] text-[#16A34A] shadow-sm border border-[var(--border)]"
                          : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                      }`}
                    >
                      {p === "semana" ? "Semana" : p === "mes" ? "Mês" : "Ano"}
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
                {apostasFiltradasPeriodo.map(aposta => (
                  <Link key={aposta.id} href={`/apostas/${aposta.id}`}>
                    <Card className="hover:border-[#16A34A]/40 transition-colors cursor-pointer">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <p className="font-medium text-[var(--text-primary)] truncate">{aposta.evento}</p>
                              {statusBadge(aposta.status)}
                              <Badge variant="secondary">{aposta.tipo}</Badge>
                            </div>
                            <p className="text-xs text-[var(--text-secondary)]">
                              Investimento: {formatCurrency(aposta.investimento_total)} · ROI: {aposta.roi_percentual.toFixed(2)}% · {new Date(aposta.created_at).toLocaleDateString("pt-BR")}
                            </p>
                            {(aposta as Aposta & { legs?: { id: string; resultado_apostado: string; odd: number; stake: number; profile_bet?: { bet?: { nome: string } } }[] }).legs?.length ? (
                              <div className="mt-2 space-y-1">
                                {(aposta as Aposta & { legs?: { id: string; resultado_apostado: string; odd: number; stake: number; profile_bet?: { bet?: { nome: string } } }[] }).legs!.map(leg => (
                                  <div key={leg.id} className="text-xs text-[var(--text-secondary)] flex items-center gap-2">
                                    <span className="bg-[var(--bg-elevated)] rounded px-1.5 py-0.5">{leg.profile_bet?.bet?.nome ?? "Casa"}</span>
                                    <span>{leg.resultado_apostado}</span>
                                    <span className="font-medium">@{Number(leg.odd).toFixed(2)}</span>
                                    <span className="text-[#16A34A]">{formatCurrency(leg.stake)}</span>
                                  </div>
                                ))}
                              </div>
                            ) : null}
                          </div>
                          <div className="text-right flex-shrink-0">
                            {aposta.status === "finalizada" ? (
                              <>
                                <p className="text-xs text-[var(--text-muted)]">Resultado real</p>
                                <p className="text-base font-bold text-[#16A34A]">{formatCurrency(aposta.resultado_real ?? 0)}</p>
                              </>
                            ) : aposta.status === "pendente" ? (
                              <>
                                <p className="text-xs text-[var(--text-muted)]">Lucro esperado</p>
                                <p className="text-base font-bold text-yellow-600">{formatCurrency(aposta.lucro_garantido)}</p>
                              </>
                            ) : (
                              <p className="text-sm text-[var(--text-muted)]">Cancelada</p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
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
                <p className="text-lg font-bold text-[#16A34A]">{formatCurrency(totalDepositos)}</p>
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
                <p className={`text-lg font-bold ${saldoLiquido >= 0 ? "text-[#16A34A]" : "text-[#DC2626]"}`}>{formatCurrency(saldoLiquido)}</p>
              </CardContent>
            </Card>
          </div>

          {/* Filters + Add button */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex gap-1 bg-[var(--bg-elevated)] rounded-lg p-1">
              {(["hoje", "semana", "mes", "todos"] as const).map(p => (
                <button key={p} onClick={() => setFinPeriodo(p)}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${finPeriodo === p ? "bg-[var(--bg-surface)] text-[#16A34A] shadow-sm border border-[var(--border)]" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"}`}>
                  {p === "hoje" ? "Hoje" : p === "semana" ? "Semana" : p === "mes" ? "Mês" : "Todos"}
                </button>
              ))}
            </div>
            <div className="flex gap-1">
              {(["todos", "deposito", "saque"] as const).map(t => (
                <button key={t} onClick={() => setFinTipo(t)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium border transition-colors ${finTipo === t
                    ? t === "deposito" ? "bg-[#16A34A] text-white border-[#16A34A]"
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
                      <div className={`p-2 rounded-lg ${m.tipo === "deposito" ? "bg-[#16A34A]/10" : "bg-[#DC2626]/10"}`}>
                        {m.tipo === "deposito"
                          ? <ArrowDownCircle className="h-4 w-4 text-[#16A34A]" />
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
                      <p className={`text-sm font-bold ${m.tipo === "deposito" ? "text-[#16A34A]" : "text-[#DC2626]"}`}>
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
              className={currentProfile.ativo ? "bg-[#DC2626] hover:bg-red-700" : "bg-[#16A34A] hover:bg-[#15803D]"}
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

      {/* Calculadora Dialog */}
      <Dialog open={showCalculadora} onOpenChange={setShowCalculadora}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5 text-[#16A34A]" />
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
