"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { formatCurrency } from "@/lib/utils"
import { useToast } from "@/hooks/useToast"
import {
  ArrowLeft, TrendingUp, DollarSign, Clock, BarChart2,
  CheckCircle2, XCircle, AlertCircle, CalendarDays, Tag, Trash2
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
  if (status === "finalizada") return <CheckCircle2 className="w-5 h-5 text-[#16A34A]" />
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
  for (const leg of legs) {
    const lucro = leg.stake * leg.odd - investimento_total
    if (Math.abs(lucro - resultado_real) < 0.5) return leg.id
  }
  return null
}

export default function ApostaDetailClient({ aposta: initial }: { aposta: ApostaWithDetails }) {
  const [aposta, setAposta] = useState(initial)
  const [finalizarOpen, setFinalizarOpen] = useState(false)
  const [deletarOpen, setDeletarOpen] = useState(false)
  const [greenLegId, setGreenLegId] = useState<string | null>(
    initial.status === "finalizada"
      ? inferGreenLegId(initial.legs, initial.resultado_real, initial.investimento_total)
      : null
  )
  const [pendingGreenLegId, setPendingGreenLegId] = useState<string | null>(null)
  const [alterarConfirmOpen, setAlterarConfirmOpen] = useState(false)
  const [finalizando, setFinalizando] = useState(false)
  const [cancelando, setCancelando] = useState(false)
  const [deletando, setDeletando] = useState(false)
  const { toast } = useToast()
  const router = useRouter()
  const supabase = createClient()

  // Calculate green/red per leg based on which leg won
  const legs = aposta.legs ?? []
  const totalInvestido = aposta.investimento_total

  function calcGreenRed(winnerLegId: string) {
    return legs.map(leg => {
      if (leg.id === winnerLegId) {
        const retorno = leg.stake * leg.odd
        const lucro = retorno - totalInvestido
        return { leg, tipo: "green" as const, valor: lucro, retorno }
      } else {
        return { leg, tipo: "red" as const, valor: -leg.stake, retorno: 0 }
      }
    })
  }

  const greenRedCalc = greenLegId ? calcGreenRed(greenLegId) : null
  const resultadoLiquido = greenRedCalc
    ? greenRedCalc.reduce((s, r) => s + r.valor, 0)
    : null

  async function handleFinalizar(overrideGreenId?: string) {
    const effectiveGreenId = overrideGreenId ?? greenLegId
    if (!effectiveGreenId) {
      toast({ title: "Selecione qual casa deu green", variant: "destructive" })
      return
    }
    const resultado = calcGreenRed(effectiveGreenId).reduce((s, r) => s + r.valor, 0)
    setFinalizando(true)
    const { error } = await supabase
      .from("apostas")
      .update({ status: "finalizada", resultado_real: resultado, finalizada_at: new Date().toISOString() })
      .eq("id", aposta.id)

    if (error) {
      toast({ title: "Erro ao finalizar aposta", variant: "destructive" })
    } else {
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

  async function handleDeletar() {
    setDeletando(true)
    const { error } = await supabase.from("apostas").delete().eq("id", aposta.id)
    if (error) {
      toast({ title: "Erro ao deletar aposta", variant: "destructive" })
      setDeletando(false)
    } else {
      toast({ title: "Aposta deletada" })
      router.push("/apostas")
      router.refresh()
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
    <div className="max-w-2xl md:max-w-4xl mx-auto space-y-6 p-4 md:p-6">
      {/* Cabeçalho */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-[var(--text-primary)] truncate">{aposta.evento}</h1>
          {perfil && (
            <Link href={`/perfis/${perfil.id}`} className="text-sm text-[var(--text-secondary)] hover:text-[#16A34A] transition-colors">
              {perfil.apelido ?? `${perfil.nome} ${perfil.sobrenome}`}
            </Link>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <StatusIcon status={aposta.status} />
          {statusBadge(aposta.status)}
          <Button
            variant="ghost"
            size="icon"
            className="text-[#DC2626] hover:bg-[#DC2626]/10"
            onClick={() => setDeletarOpen(true)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="p-2 bg-[#2563EB]/10 rounded-lg w-fit mb-3">
              <DollarSign className="h-4 w-4 text-[#2563EB]" />
            </div>
            <p className="text-xs text-[var(--text-secondary)]">Investimento</p>
            <p className="text-base font-bold text-[var(--text-primary)] mt-0.5">{formatCurrency(aposta.investimento_total)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className={`p-2 rounded-lg w-fit mb-3 ${aposta.status === "finalizada" ? "bg-[#16A34A]/10" : "bg-[#D97706]/10"}`}>
              <TrendingUp className={`h-4 w-4 ${aposta.status === "finalizada" ? "text-[#16A34A]" : "text-[#D97706]"}`} />
            </div>
            <p className="text-xs text-[var(--text-secondary)]">
              {aposta.status === "finalizada" ? "Lucro Real" : "Lucro Esperado"}
            </p>
            <p className={`text-base font-bold mt-0.5 ${aposta.status === "finalizada" ? "text-[#16A34A]" : "text-[#D97706]"}`}>
              {formatCurrency(lucroExibido)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="p-2 bg-[#7C3AED]/10 rounded-lg w-fit mb-3">
              <BarChart2 className="h-4 w-4 text-[#7C3AED]" />
            </div>
            <p className="text-xs text-[var(--text-secondary)]">ROI</p>
            <p className="text-base font-bold text-[#7C3AED] mt-0.5">{aposta.roi_percentual.toFixed(2)}%</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="p-2 bg-[var(--bg-elevated)] rounded-lg w-fit mb-3">
              <Tag className="h-4 w-4 text-[var(--text-secondary)]" />
            </div>
            <p className="text-xs text-[var(--text-secondary)]">Tipo</p>
            <p className="text-base font-bold text-[var(--text-primary)] mt-0.5">{aposta.tipo}</p>
          </CardContent>
        </Card>
      </div>

      {/* Legs */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Entradas por Casa de Apostas</CardTitle>
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
                    className={`flex items-center p-3 rounded-xl border transition-all ${
                      isGreen ? "border-[#16A34A] bg-[#16A34A]/5" :
                      isRed ? "border-[#DC2626] bg-[#DC2626]/5" :
                      "border-[var(--border)] bg-[var(--bg-muted)]"
                    }`}
                  >
                    {/* Number badge */}
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                      isGreen ? "bg-[#16A34A] text-white" :
                      isRed ? "bg-[#DC2626] text-white" :
                      "bg-[#16A34A]/10 text-[#16A34A]"
                    }`}>
                      {i + 1}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0 ml-3">
                      <p className="font-medium text-sm text-[var(--text-primary)]">
                        {leg.profile_bet?.bet?.nome ?? "Casa desconhecida"}
                      </p>
                      <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                        Resultado: <span className="font-medium text-[var(--text-primary)]">{leg.resultado_apostado}</span>
                      </p>
                    </div>

                    {/* Odd + Stake + valor calc */}
                    <div className="text-right mr-3">
                      <p className="text-sm font-bold text-[var(--text-primary)]">Odd {Number(leg.odd).toFixed(2)}</p>
                      <p className="text-xs text-[var(--text-secondary)]">{formatCurrency(leg.stake)}</p>
                      {calc && (
                        <p className={`text-xs font-bold mt-0.5 ${calc.valor >= 0 ? "text-[#16A34A]" : "text-[#DC2626]"}`}>
                          {calc.valor >= 0 ? "+" : ""}{formatCurrency(calc.valor)}
                        </p>
                      )}
                    </div>

                    {/* Green/Red toggle */}
                    <div className="flex flex-col gap-1 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => handleLegClick(leg.id, "green")}
                        className={`px-2 py-0.5 rounded text-xs font-bold border transition-all ${
                          isGreen
                            ? "bg-[#16A34A] text-white border-[#16A34A]"
                            : "bg-transparent text-[#16A34A] border-[#16A34A]/40 hover:bg-[#16A34A]/10"
                        }`}
                      >
                        GREEN
                      </button>
                      <button
                        type="button"
                        onClick={() => handleLegClick(leg.id, "red")}
                        className={`px-2 py-0.5 rounded text-xs font-bold border transition-all ${
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
                  <span className={`text-sm font-bold ${resultadoLiquido! >= 0 ? "text-[#16A34A]" : "text-[#DC2626]"}`}>
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

      {/* Ações */}
      {aposta.status === "pendente" && (
        <div className="flex gap-3">
          <Button
            className="flex-1 bg-[#16A34A] hover:bg-[#15803D]"
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

      {/* Dialog Deletar */}
      <Dialog open={deletarOpen} onOpenChange={setDeletarOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deletar Aposta</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-[var(--text-secondary)]">
            Tem certeza que deseja deletar a aposta <strong className="text-[var(--text-primary)]">{aposta.evento}</strong>? Esta ação não pode ser desfeita.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletarOpen(false)}>Cancelar</Button>
            <Button
              variant="destructive"
              onClick={handleDeletar}
              disabled={deletando}
            >
              {deletando ? "Deletando..." : "Deletar"}
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
              const newResultado = newCalc.reduce((s, r) => s + r.valor, 0)
              return (
                <div className="space-y-2 p-3 rounded-xl bg-[var(--bg-muted)] border border-[var(--border)]">
                  {newCalc.map(r => (
                    <div key={r.leg.id} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className={`px-1.5 py-0.5 rounded text-xs font-bold ${r.tipo === "green" ? "bg-[#16A34A] text-white" : "bg-[#DC2626] text-white"}`}>
                          {r.tipo === "green" ? "GREEN" : "RED"}
                        </span>
                        <span className="text-[var(--text-primary)]">{r.leg.profile_bet?.bet?.nome ?? "Casa"}</span>
                      </div>
                      <span className={`font-bold text-sm ${r.valor >= 0 ? "text-[#16A34A]" : "text-[#DC2626]"}`}>
                        {r.valor >= 0 ? "+" : ""}{formatCurrency(r.valor)}
                      </span>
                    </div>
                  ))}
                  <div className="pt-2 border-t border-[var(--border)] flex items-center justify-between text-sm font-bold">
                    <span className="text-[var(--text-primary)]">Novo resultado líquido</span>
                    <span className={newResultado >= 0 ? "text-[#16A34A]" : "text-[#DC2626]"}>
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
              className="bg-[#16A34A] hover:bg-[#15803D]"
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
                        <span className={`px-1.5 py-0.5 rounded text-xs font-bold ${r.tipo === "green" ? "bg-[#16A34A] text-white" : "bg-[#DC2626] text-white"}`}>
                          {r.tipo === "green" ? "GREEN" : "RED"}
                        </span>
                        <span className="text-[var(--text-primary)]">{r.leg.profile_bet?.bet?.nome ?? "Casa"}</span>
                      </div>
                      <span className={`font-bold ${r.valor >= 0 ? "text-[#16A34A]" : "text-[#DC2626]"}`}>
                        {r.valor >= 0 ? "+" : ""}{formatCurrency(r.valor)}
                      </span>
                    </div>
                  ))}
                  <div className="pt-2 border-t border-[var(--border)] flex items-center justify-between text-sm font-bold">
                    <span className="text-[var(--text-primary)]">Resultado líquido</span>
                    <span className={resultadoLiquido! >= 0 ? "text-[#16A34A]" : "text-[#DC2626]"}>
                      {resultadoLiquido! >= 0 ? "+" : ""}{formatCurrency(resultadoLiquido!)}
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setFinalizarOpen(false); setGreenLegId(null) }}>Cancelar</Button>
            <Button onClick={() => handleFinalizar()} disabled={finalizando || !greenLegId} className="bg-[#16A34A] hover:bg-[#15803D]">
              {finalizando ? "Finalizando..." : "Confirmar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
