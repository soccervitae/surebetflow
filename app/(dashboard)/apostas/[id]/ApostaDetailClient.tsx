"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { formatCurrency } from "@/lib/utils"
import { useToast } from "@/hooks/useToast"
import {
  TrendingUp, DollarSign, Clock, BarChart2,
  CheckCircle2, XCircle, AlertCircle, CalendarDays, Tag, Pencil, ArrowLeft
} from "lucide-react"
import type { Aposta } from "@/lib/types"

type ApostaWithDetails = Aposta & {
  profile?: { id: string; user_id: string; nome: string; sobrenome: string; apelido?: string | null }
  legs?: Array<{
    id: string
    aposta_id: string
    profile_bet_id: string
    resultado_apostado: string
    odd: number
    stake: number
    created_at: string
    profile_bet?: {
      id: string
      email: string
      saldo: number
      bet?: { id: string; nome: string; logo_url?: string | null }
    }
  }>
}

function StatusIcon({ status }: { status: string }) {
  if (status === "finalizada") return <CheckCircle2 className="w-5 h-5 text-[var(--accent-text)]" />
  if (status === "cancelada") return <XCircle className="w-5 h-5 text-[#DC2626]" />
  return <AlertCircle className="w-5 h-5 text-yellow-500" />
}

function statusBadge(status: string) {
  if (status === "finalizada") return <Badge variant="default">Finalizada</Badge>
  if (status === "cancelada") return <Badge variant="destructive">Cancelada</Badge>
  return <Badge variant="yellow">Pendente</Badge>
}

function inferGreenLegId(legs: ApostaWithDetails["legs"], resultado_real: number | null | undefined, investimento_total: number): string | null {
  if (resultado_real == null || !legs?.length) return null
  const inv = parseFloat(String(investimento_total))
  const res = parseFloat(String(resultado_real))
  let minDiff = Infinity, minId: string | null = null
  for (const leg of legs) {
    const diff = Math.abs(parseFloat(String(leg.stake)) * parseFloat(String(leg.odd)) - inv - res)
    if (diff < minDiff) { minDiff = diff; minId = leg.id }
  }
  return minDiff < 5 ? minId : null
}

export default function ApostaDetailClient({ aposta: initial }: { aposta: ApostaWithDetails }) {
  const [aposta, setAposta] = useState(initial)
  const [finalizarOpen, setFinalizarOpen] = useState(false)
  const [greenLegId, setGreenLegId] = useState<string | null>(
    initial.status === "finalizada"
      ? inferGreenLegId(initial.legs, initial.resultado_real, initial.investimento_total)
      : null
  )
  const [pendingGreenLegId, setPendingGreenLegId] = useState<string | null>(null)
  const [alterarConfirmOpen, setAlterarConfirmOpen] = useState(false)
  const [finalizando, setFinalizando] = useState(false)
  const [cancelando, setCancelando] = useState(false)
  const [editarOpen, setEditarOpen] = useState(false)
  const [editEvento, setEditEvento] = useState(initial.evento)
  const [editEsporte, setEditEsporte] = useState(initial.esporte ?? "")
  const [editDataEvento, setEditDataEvento] = useState(
    initial.data_evento ? initial.data_evento.slice(0, 10) : ""
  )
  const [editHoraEvento, setEditHoraEvento] = useState(
    initial.data_evento ? initial.data_evento.slice(11, 16) : ""
  )
  const [editTipo, setEditTipo] = useState<"2-way" | "3-way">(initial.tipo)
  const [editLegs, setEditLegs] = useState(
    (initial.legs ?? []).map(l => ({
      id: l.id,
      resultado_apostado: l.resultado_apostado,
      odd: String(l.odd),
      stake: String(l.stake),
    }))
  )
  const [salvandoEdicao, setSalvandoEdicao] = useState(false)
  const { toast } = useToast()
  const router = useRouter()
  const supabase = createClient()

  // Calculate green/red per leg based on which leg won
  const legs = aposta.legs ?? []
  const totalInvestido = aposta.investimento_total

  function calcGreenRed(winnerLegId: string) {
    // GREEN: mostra retorno total recebido (stake × odd)
    // RED: mostra perda (−stake)
    return legs.map(leg => {
      if (leg.id === winnerLegId) {
        return { leg, tipo: "green" as const, valor: leg.stake * leg.odd }
      } else {
        return { leg, tipo: "red" as const, valor: -leg.stake }
      }
    })
  }

  function calcResultadoLiquido(winnerLegId: string) {
    const greenLeg = legs.find(l => l.id === winnerLegId)
    if (!greenLeg) return 0
    return greenLeg.stake * greenLeg.odd - totalInvestido
  }

  const greenRedCalc = greenLegId ? calcGreenRed(greenLegId) : null
  const resultadoLiquido = greenLegId ? calcResultadoLiquido(greenLegId) : null

  async function handleFinalizar(overrideGreenId?: string) {
    const effectiveGreenId = overrideGreenId ?? greenLegId
    if (!effectiveGreenId) {
      toast({ title: "Selecione qual casa deu green", variant: "destructive" })
      return
    }
    const resultado = calcResultadoLiquido(effectiveGreenId)
    setFinalizando(true)
    const { error } = await supabase
      .from("apostas")
      .update({ status: "finalizada", resultado_real: resultado, finalizada_at: new Date().toISOString() })
      .eq("id", aposta.id)

    if (error) {
      toast({ title: "Erro ao finalizar aposta", variant: "destructive" })
    } else {
      // Registrar movimentação por leg: GREEN = lucro líquido, RED = perda do stake
      for (const leg of aposta.legs ?? []) {
        if (!leg.profile_bet_id) continue
        const isGreen = leg.id === effectiveGreenId
        const tipo = isGreen ? "lucro" : "perda"
        const movValor = isGreen ? leg.stake * leg.odd - leg.stake : leg.stake
        if (movValor > 0) {
          await supabase.from("movimentacoes_financeiras").insert({
            profile_id: aposta.profile_id,
            profile_bet_id: leg.profile_bet_id,
            tipo,
            valor: movValor,
            descricao: `Aposta: ${aposta.evento}`,
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
      setAposta(prev => ({ ...prev, status: "finalizada", resultado_real: resultado, finalizada_at: new Date().toISOString() }))
      setGreenLegId(effectiveGreenId)
      toast({ title: overrideGreenId ? "Resultado alterado com sucesso!" : "Aposta finalizada com sucesso!" })
      setFinalizarOpen(false)
      setAlterarConfirmOpen(false)
      setPendingGreenLegId(null)
    }
    setFinalizando(false)
  }

  function handleLegClick(legId: string, tipo: "green" | "red") {
    if (aposta.status === "finalizada") {
      // Compute what the new green would be
      const newGreenId = tipo === "green" ? legId : legs.find(l => l.id !== legId)?.id ?? null
      if (!newGreenId || newGreenId === greenLegId) return
      setPendingGreenLegId(newGreenId)
      setAlterarConfirmOpen(true)
    } else {
      if (tipo === "green") {
        setGreenLegId(prev => prev === legId ? null : legId)
      } else if (legs.length === 2) {
        const other = legs.find(l => l.id !== legId)
        if (other) setGreenLegId(other.id)
      }
    }
  }

  function formatOdd(v: string) {
    return v.replace(/[^0-9.]/g, "").replace(/(\..*)\./g, "$1")
  }

  function formatStake(raw: string) {
    const digits = raw.replace(/\D/g, "")
    if (!digits) return ""
    const num = parseInt(digits, 10) / 100
    return num.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  function parseStake(formatted: string) {
    return parseFloat(formatted.replace(/\./g, "").replace(",", ".")) || 0
  }

  async function handleEditar() {
    if (!editEvento.trim()) {
      toast({ title: "Informe o nome do evento", variant: "destructive" }); return
    }
    const legsValidas = editLegs.every(l => l.resultado_apostado.trim() && parseFloat(l.odd) > 0 && parseStake(l.stake) > 0)
    if (!legsValidas) {
      toast({ title: "Preencha resultado, odd e stake de todas as entradas", variant: "destructive" }); return
    }
    setSalvandoEdicao(true)
    try {
      const stakes = editLegs.map(l => parseStake(l.stake))
      const odds = editLegs.map(l => parseFloat(l.odd))
      const investimento_total = stakes.reduce((s, v) => s + v, 0)
      const retornos = editLegs.map((_, i) => stakes[i] * odds[i])
      const lucro_garantido = Math.min(...retornos) - investimento_total
      const roi_percentual = investimento_total > 0 ? (lucro_garantido / investimento_total) * 100 : 0

      const { error: apostaErr } = await supabase
        .from("apostas")
        .update({
          evento: editEvento.trim(),
          esporte: editEsporte.trim() || null,
          tipo: editTipo,
          investimento_total,
          lucro_garantido,
          roi_percentual,
          data_evento: editDataEvento ? `${editDataEvento}${editHoraEvento ? `T${editHoraEvento}:00` : "T00:00:00"}` : null,
        })
        .eq("id", aposta.id)
      if (apostaErr) throw apostaErr

      for (let i = 0; i < editLegs.length; i++) {
        const { error: legErr } = await supabase
          .from("aposta_legs")
          .update({ resultado_apostado: editLegs[i].resultado_apostado.trim(), odd: parseFloat(editLegs[i].odd), stake: stakes[i] })
          .eq("id", editLegs[i].id)
        if (legErr) throw legErr
      }

      setAposta(prev => ({ ...prev, evento: editEvento.trim(), esporte: editEsporte.trim() || null, tipo: editTipo, investimento_total, lucro_garantido, roi_percentual,
        data_evento: editDataEvento ? `${editDataEvento}${editHoraEvento ? `T${editHoraEvento}:00` : "T00:00:00"}` : null,
        legs: prev.legs?.map((l, i) => ({ ...l, resultado_apostado: editLegs[i].resultado_apostado.trim(), odd: parseFloat(editLegs[i].odd), stake: stakes[i] }))
      }))
      toast({ title: "Aposta atualizada com sucesso!" })
      setEditarOpen(false)
    } catch {
      toast({ title: "Erro ao salvar alterações", variant: "destructive" })
    } finally {
      setSalvandoEdicao(false)
    }
  }

  async function handleCancelar() {
    setCancelando(true)
    const { error } = await supabase
      .from("apostas")
      .update({ status: "cancelada" })
      .eq("id", aposta.id)

    if (error) {
      toast({ title: "Erro ao cancelar aposta", variant: "destructive" })
    } else {
      setAposta(prev => ({ ...prev, status: "cancelada" }))
      toast({ title: "Aposta cancelada" })
    }
    setCancelando(false)
  }

  const perfil = aposta.profile
  const lucroExibido = aposta.status === "finalizada"
    ? (aposta.resultado_real ?? aposta.lucro_garantido)
    : aposta.lucro_garantido

  return (
    <div className="max-w-2xl md:max-w-4xl mx-auto space-y-6">
      {/* Cabeçalho — mobile centralizado */}
      <div className="md:hidden relative flex flex-col items-center text-center gap-1 pb-2">
        <button onClick={() => router.back()} className="absolute left-0 top-0 p-1.5 rounded-lg hover:bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-bold text-[var(--text-primary)] px-10 leading-tight">{aposta.evento}</h1>
        {aposta.esporte && (
          <p className="text-sm text-[var(--text-muted)]">{aposta.esporte}</p>
        )}
        {perfil && (
          <Link href={`/perfis/${perfil.id}`} className="text-sm text-[var(--accent-text)] hover:underline transition-colors">
            {perfil.apelido ?? `${perfil.nome} ${perfil.sobrenome}`}
          </Link>
        )}
        <div className="mt-1">{statusBadge(aposta.status)}</div>
      </div>

      {/* Cabeçalho — desktop */}
      <div className="hidden md:flex items-start gap-3">
        <button onClick={() => router.back()} className="mt-0.5 flex-shrink-0 p-1.5 rounded-lg hover:bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-[var(--text-primary)] truncate">{aposta.evento}</h1>
          {perfil && (
            <Link href={`/perfis/${perfil.id}`} className="text-sm text-[var(--text-secondary)] hover:text-[var(--accent-text)] transition-colors">
              {perfil.apelido ?? `${perfil.nome} ${perfil.sobrenome}`}
            </Link>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <StatusIcon status={aposta.status} />
          {statusBadge(aposta.status)}
        </div>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <div className="p-1.5 bg-[#2563EB]/10 rounded-lg flex-shrink-0">
                <DollarSign className="h-3.5 w-3.5 text-[#2563EB]" />
              </div>
              <p className="text-xs text-[var(--text-secondary)]">Investimento</p>
            </div>
            <p className="text-base font-bold text-[var(--text-primary)]">{formatCurrency(aposta.investimento_total)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <div className={`p-1.5 rounded-lg flex-shrink-0 ${aposta.status === "finalizada" ? "bg-green-500/10" : "bg-[#D97706]/10"}`}>
                <TrendingUp className={`h-3.5 w-3.5 ${aposta.status === "finalizada" ? "text-green-600" : "text-[#D97706]"}`} />
              </div>
              <p className="text-xs text-[var(--text-secondary)]">
                {aposta.status === "finalizada" ? "Lucro Real" : "Lucro Esperado"}
              </p>
            </div>
            <p className={`text-base font-bold ${aposta.status === "finalizada" ? "text-green-600" : "text-[#D97706]"}`}>
              {formatCurrency(lucroExibido)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <div className="p-1.5 bg-[#7C3AED]/10 rounded-lg flex-shrink-0">
                <BarChart2 className="h-3.5 w-3.5 text-[#7C3AED]" />
              </div>
              <p className="text-xs text-[var(--text-secondary)]">ROI</p>
            </div>
            <p className="text-base font-bold text-[#7C3AED]">{aposta.roi_percentual.toFixed(2)}%</p>
          </CardContent>
        </Card>

      </div>

      {/* Legs */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Entradas por Bet</CardTitle>
            {legs.length > 0 && (
              <p className="text-xs text-[var(--text-secondary)]">
                {aposta.status === "finalizada" ? "Clique para alterar resultado" : "Selecione qual deu green"}
              </p>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {legs.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)] text-center py-4">Nenhuma entrada registrada</p>
          ) : (
            <>
              {legs.map((leg, i) => {
                const isGreen = greenLegId === leg.id
                const isRed = greenLegId !== null && greenLegId !== leg.id
                const calc = greenRedCalc?.find(r => r.leg.id === leg.id)
                return (
                  <div
                    key={leg.id}
                    className={`rounded-xl px-3 py-3 flex items-center gap-3 ${
                      isGreen ? "bg-green-500/10" :
                      isRed ? "bg-[#DC2626]/5" :
                      "bg-[var(--bg-elevated)]"
                    }`}
                  >
                    {/* Info: stacked vertically */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <p className={`text-base font-bold leading-tight ${isGreen ? "text-green-600" : isRed ? "text-[#DC2626]" : "text-[var(--accent-text)]"}`}>
                        {leg.profile_bet?.bet?.nome ?? "Bet"}
                      </p>
                      <p className="text-sm text-[var(--text-secondary)] leading-snug">{leg.resultado_apostado}</p>
                      <p className="text-sm text-[var(--text-secondary)]">@{Number(leg.odd).toFixed(2)} · {formatCurrency(leg.stake)}</p>
                      {calc && (
                        <p className={`text-sm font-bold ${calc.valor >= 0 ? "text-green-600" : "text-[#DC2626]"}`}>
                          {calc.tipo === "green"
                            ? `Retorno: ${formatCurrency(calc.valor)}`
                            : `Perda: ${formatCurrency(calc.valor)}`}
                        </p>
                      )}
                    </div>
                    {/* GREEN/RED toggle badges */}
                    <div className="flex flex-col gap-1.5 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => handleLegClick(leg.id, "green")}
                        className={`px-2.5 py-1 rounded text-xs font-bold border transition-all ${
                          isGreen
                            ? "bg-green-600 text-white border-green-600"
                            : "bg-transparent text-green-600 border-green-600/40 hover:bg-green-500/10"
                        }`}
                      >
                        GREEN
                      </button>
                      <button
                        type="button"
                        onClick={() => handleLegClick(leg.id, "red")}
                        className={`px-2.5 py-1 rounded text-xs font-bold border transition-all ${
                          isRed
                            ? "bg-[#DC2626] text-white border-[#DC2626]"
                            : "bg-transparent text-[#DC2626] border-[#DC2626]/40 hover:bg-[#DC2626]/10"
                        }`}
                      >
                        RED
                      </button>
                    </div>
                  </div>
                )
              })}

              {/* Result summary when green is selected */}
              {greenRedCalc && (
                <div className="mt-2 p-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] flex items-center justify-between">
                  <span className="text-sm text-[var(--text-secondary)]">Resultado líquido</span>
                  <span className={`text-sm font-bold ${resultadoLiquido! >= 0 ? "text-green-600" : "text-[#DC2626]"}`}>
                    {resultadoLiquido! >= 0 ? "+" : ""}{formatCurrency(resultadoLiquido!)}
                  </span>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Datas */}
      <Card>
        <CardContent className="p-4 space-y-2">
          {aposta.data_evento && (
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                <CalendarDays className="w-4 h-4" />
                <span>Data do evento</span>
              </div>
              <span className="font-medium text-[var(--text-primary)]">
                {new Date(aposta.data_evento).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" })}
                {" "}
                {new Date(aposta.data_evento).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
          )}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-[var(--text-secondary)]">
              <CalendarDays className="w-4 h-4" />
              <span>Registrada em</span>
            </div>
            <span className="font-medium text-[var(--text-primary)]">
              {new Date(aposta.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" })}
            </span>
          </div>
          {aposta.finalizada_at && (
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                <Clock className="w-4 h-4" />
                <span>Finalizada em</span>
              </div>
              <span className="font-medium text-[var(--text-primary)]">
                {new Date(aposta.finalizada_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" })}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Botão Editar */}
      <div className="flex gap-3">
        <Button
          variant="outline"
          className="flex-1 gap-2"
          onClick={() => setEditarOpen(true)}
        >
          <Pencil className="w-4 h-4" />
          Editar
        </Button>
      </div>

      {/* Aviso: apostas não podem ser deletadas */}
      <div className="flex items-start gap-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] px-4 py-3">
        <AlertCircle className="h-4 w-4 text-[var(--text-muted)] shrink-0 mt-0.5" />
        <p className="text-xs text-[var(--text-muted)] leading-relaxed">
          Apostas não podem ser excluídas. Ao finalizar uma aposta, o resultado é registrado automaticamente no histórico financeiro do perfil para manter a integridade dos dados.
        </p>
      </div>

      {/* Ações */}
      {aposta.status === "pendente" && (
        <div className="flex gap-3">
          <Button
            className="flex-1 bg-[#1e3a8a] hover:bg-[#1e40af]"
            onClick={() => setFinalizarOpen(true)}
          >
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Finalizar Aposta
          </Button>
          <Button
            variant="outline"
            className="text-[#DC2626] border-[#DC2626]/30 hover:bg-[#DC2626]/5"
            onClick={handleCancelar}
            disabled={cancelando}
          >
            <XCircle className="w-4 h-4 mr-2" />
            {cancelando ? "Cancelando..." : "Cancelar"}
          </Button>
        </div>
      )}

      {/* Dialog Editar */}
      <Dialog open={editarOpen} onOpenChange={setEditarOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Aposta</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Evento *</Label>
              <Input value={editEvento} onChange={e => setEditEvento(e.target.value)} placeholder="Ex: Real Madrid vs Barcelona" />
            </div>
            <div className="space-y-2">
              <Label>Esporte</Label>
              <Input value={editEsporte} onChange={e => setEditEsporte(e.target.value)} placeholder="Ex: Futebol" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Data do evento</Label>
                <Input type="date" value={editDataEvento} onChange={e => setEditDataEvento(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Hora do evento</Label>
                <Input type="time" value={editHoraEvento} onChange={e => setEditHoraEvento(e.target.value)} />
              </div>
            </div>

            <div className="space-y-3">
              <Label>Entradas</Label>
              {editLegs.map((leg, i) => (
                <div key={leg.id} className="p-3 rounded-xl bg-[var(--bg-elevated)] space-y-2">
                  <p className="text-xs font-semibold text-[var(--text-secondary)]">
                    Entrada {i + 1} — {aposta.legs?.[i]?.profile_bet?.bet?.nome ?? `Bet ${i + 1}`}
                  </p>
                  <div className="space-y-2">
                    <div className="space-y-1">
                      <Label className="text-xs">Resultado apostado</Label>
                      <Input
                        value={leg.resultado_apostado}
                        onChange={e => setEditLegs(prev => prev.map((l, j) => j === i ? { ...l, resultado_apostado: e.target.value } : l))}
                        placeholder="Ex: Real Madrid vence"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs">Odd</Label>
                        <Input
                          type="text"
                          inputMode="decimal"
                          value={leg.odd}
                          onChange={e => setEditLegs(prev => prev.map((l, j) => j === i ? { ...l, odd: formatOdd(e.target.value) } : l))}
                          placeholder="Ex: 2.10"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Stake (R$)</Label>
                        <Input
                          type="text"
                          inputMode="numeric"
                          value={leg.stake}
                          onChange={e => setEditLegs(prev => prev.map((l, j) => j === i ? { ...l, stake: formatStake(e.target.value) } : l))}
                          placeholder="0,00"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Prévia dos totais */}
            {editLegs.length > 0 && (() => {
              const stakes = editLegs.map(l => parseStake(l.stake))
              const odds = editLegs.map(l => parseFloat(l.odd) || 0)
              const total = stakes.reduce((s, v) => s + v, 0)
              const retornos = editLegs.map((_, i) => stakes[i] * odds[i])
              const lucro = Math.min(...retornos) - total
              const roi = total > 0 ? (lucro / total) * 100 : 0
              return (
                <div className="p-3 rounded-xl bg-[var(--bg-muted)] border border-[var(--border)] space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[var(--text-secondary)]">Investimento total</span>
                    <span className="font-medium text-[var(--text-primary)]">{formatCurrency(total)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-secondary)]">Lucro garantido</span>
                    <span className={`font-bold ${lucro >= 0 ? "text-green-600" : "text-[#DC2626]"}`}>{formatCurrency(lucro)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-secondary)]">ROI</span>
                    <span className={`font-bold ${roi >= 0 ? "text-green-600" : "text-[#DC2626]"}`}>{roi.toFixed(2)}%</span>
                  </div>
                </div>
              )
            })()}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditarOpen(false)}>Cancelar</Button>
            <Button onClick={handleEditar} disabled={salvandoEdicao} className="bg-[#1e3a8a] hover:bg-[#1e40af] text-white">
              {salvandoEdicao ? "Salvando..." : "Salvar alterações"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Alterar Resultado */}
      <Dialog open={alterarConfirmOpen} onOpenChange={open => { setAlterarConfirmOpen(open); if (!open) setPendingGreenLegId(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alterar Resultado</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-[var(--text-secondary)]">
              Tem certeza que deseja alterar o resultado da aposta <strong className="text-[var(--text-primary)]">{aposta.evento}</strong>?
            </p>
            {pendingGreenLegId && (() => {
              const newCalc = calcGreenRed(pendingGreenLegId)
              const newResultado = calcResultadoLiquido(pendingGreenLegId)
              return (
                <div className="space-y-2 p-3 rounded-xl bg-[var(--bg-muted)] border border-[var(--border)]">
                  {newCalc.map(r => (
                    <div key={r.leg.id} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className={`px-1.5 py-0.5 rounded text-xs font-bold ${r.tipo === "green" ? "bg-green-600 text-white" : "bg-[#DC2626] text-white"}`}>
                          {r.tipo === "green" ? "GREEN" : "RED"}
                        </span>
                        <span className="text-[var(--text-primary)]">{r.leg.profile_bet?.bet?.nome ?? "Casa"}</span>
                      </div>
                      <span className={`font-bold text-sm ${r.valor >= 0 ? "text-green-600" : "text-[#DC2626]"}`}>
                        {r.valor >= 0 ? "+" : ""}{formatCurrency(r.valor)}
                      </span>
                    </div>
                  ))}
                  <div className="pt-2 border-t border-[var(--border)] flex items-center justify-between text-sm font-bold">
                    <span className="text-[var(--text-primary)]">Novo resultado líquido</span>
                    <span className={newResultado >= 0 ? "text-[var(--accent-text)]" : "text-[#DC2626]"}>
                      {newResultado >= 0 ? "+" : ""}{formatCurrency(newResultado)}
                    </span>
                  </div>
                </div>
              )
            })()}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setAlterarConfirmOpen(false); setPendingGreenLegId(null) }}>Cancelar</Button>
            <Button
              onClick={() => handleFinalizar(pendingGreenLegId!)}
              disabled={finalizando}
              className="bg-[#1e3a8a] hover:bg-[#1e40af]"
            >
              {finalizando ? "Salvando..." : "Confirmar alteração"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Finalizar */}
      <Dialog open={finalizarOpen} onOpenChange={open => { setFinalizarOpen(open); if (!open) setGreenLegId(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Finalização</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {!greenLegId ? (
              <div className="p-4 rounded-xl bg-yellow-50 border border-yellow-200 text-sm text-yellow-800">
                Selecione qual casa deu <strong>GREEN</strong> nos cards acima antes de confirmar.
              </div>
            ) : (
              <>
                <div className="p-3 rounded-xl bg-[var(--bg-muted)] border border-[var(--border)]">
                  <p className="text-sm font-medium text-[var(--text-primary)]">{aposta.evento}</p>
                </div>
                <div className="space-y-2">
                  {greenRedCalc?.map(r => (
                    <div key={r.leg.id} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className={`px-1.5 py-0.5 rounded text-xs font-bold ${r.tipo === "green" ? "bg-green-600 text-white" : "bg-[#DC2626] text-white"}`}>
                          {r.tipo === "green" ? "GREEN" : "RED"}
                        </span>
                        <span className="text-[var(--text-primary)]">{r.leg.profile_bet?.bet?.nome ?? "Casa"}</span>
                      </div>
                      <span className={`font-bold ${r.valor >= 0 ? "text-green-600" : "text-[#DC2626]"}`}>
                        {r.valor >= 0 ? "+" : ""}{formatCurrency(r.valor)}
                      </span>
                    </div>
                  ))}
                  <div className="pt-2 border-t border-[var(--border)] flex items-center justify-between text-sm font-bold">
                    <span className="text-[var(--text-primary)]">Resultado líquido</span>
                    <span className={resultadoLiquido! >= 0 ? "text-green-600" : "text-[#DC2626]"}>
                      {resultadoLiquido! >= 0 ? "+" : ""}{formatCurrency(resultadoLiquido!)}
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setFinalizarOpen(false); setGreenLegId(null) }}>Cancelar</Button>
            <Button onClick={() => handleFinalizar()} disabled={finalizando || !greenLegId} className="bg-[#1e3a8a] hover:bg-[#1e40af]">
              {finalizando ? "Finalizando..." : "Confirmar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
